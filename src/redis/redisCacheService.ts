import IORedis, { RedisOptions } from 'ioredis';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { CacheStats, KeyStats } from '../types/cache';
import { GlobalCacheStatsCollector } from '../dashboard/globalCacheStatsCollector';
import { logger } from '../dashboard/utils/loggerService';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class RedisCacheService {
    private redisClient: IORedis;
    private subscriberClient: IORedis;
    private defaultTTL?: number;
    private stats: CacheStats = { hits: 0, misses: 0, keys: 0, keysAdded: 0, keysDeleted: 0, size: 0, evictions: 0 };
    private keyStats: Map<string, KeyStats> = new Map();
    private serviceIdentifier: string;
    private triedKeys: Set<string> = new Set();
    private maxMemorySize?: number;
    private usageFrequency: Map<string, number> = new Map();
    private callHistory: { [timestamp: string]: number } = {};

    constructor(redisOptions: RedisOptions, defaultTTL?: number, serviceIdentifier: string = "RedisService", maxMemorySize?: number) {
        this.redisClient = new IORedis(redisOptions);
        this.subscriberClient = new IORedis(redisOptions);
        this.defaultTTL = defaultTTL;
        this.serviceIdentifier = serviceIdentifier;
        this.maxMemorySize = maxMemorySize;

        GlobalCacheStatsCollector.getInstance().registerCacheService(this.serviceIdentifier, this.getStats(), this);

        this.initializeStats();
        this.setupEventListeners();

        setInterval(this.cleanUpOldCalls.bind(this), 3600000); // Ejecutar la limpieza cada hora

        if (this.maxMemorySize !== undefined) {
            setInterval(this.enforceMemoryLimit.bind(this), 60000); // Cada minuto
        }
    }

    private setupEventListeners(): void {
        this.subscriberClient.config('SET', 'notify-keyspace-events', 'Ex').then(() => {
            this.subscriberClient.psubscribe(`__keyevent@${this.redisClient.options.db}__:expired`, (err, count) => {
                if (err) {
                    logger.log(this.serviceIdentifier, `Failed to subscribe to expired events: ${err}`, 'error');
                }
            });

            this.subscriberClient.on('pmessage', async (pattern, channel, message) => {
                if (pattern === `__keyevent@${this.redisClient.options.db}__:expired`) {
                    await this.onExpired(message);
                }
            });
        });
    }

    private async initializeStats(): Promise<void> {
        try {
            const keys = await this.redisClient.keys('*');
            this.stats.keys = keys.length;
            for (const key of keys) {
                const ttl = await this.redisClient.ttl(key);
                const size = await this.getKeyMemoryUsage(key);
                this.stats.size += size;
                this.keyStats.set(key, {
                    keyName: key,
                    setTime: Date.now(),
                    ttl: ttl > 0 ? ttl : this.defaultTTL || 0,
                    size,
                    hits: 0,
                    misses: 0,
                    responseTimes: [],
                    uncachedResponseTimes: [],
                    endTime: Date.now() + (ttl > 0 ? ttl : this.defaultTTL || 0) * 1000,
                });
            }
            GlobalCacheStatsCollector.getInstance().updateServiceStats(this.serviceIdentifier, this.stats);
            await this.notifyChange();
        } catch (error) {
            logger.log(this.serviceIdentifier, `Error initializing stats: ${error}`, 'error');
        }
    }

    private async getKeyMemoryUsage(key: string): Promise<number> {
        const memoryInfo = await this.redisClient.memory('USAGE', key);
        return memoryInfo || 0;
    }

    private recordCall(): void {
        const timestamp = new Date().toISOString().slice(0, 13); // Obtener timestamp hasta las horas
        if (!this.callHistory[timestamp]) {
            this.callHistory[timestamp] = 0;
        }
        this.callHistory[timestamp]++;
    }

    private cleanUpOldCalls(): void {
        const currentTimestamp = new Date();
        currentTimestamp.setHours(currentTimestamp.getHours() - 24); // Hace 24 horas

        Object.keys(this.callHistory).forEach(timestamp => {
            const timestampDate = new Date(timestamp + ':00:00.000Z'); // Convertir timestamp a fecha completa
            if (timestampDate < currentTimestamp) {
                delete this.callHistory[timestamp];
            }
        });
    }

    public getCallHistory(): { [timestamp: string]: number } {
        return this.callHistory;
    }

    private async notifyChange(): Promise<void> {
        const stats = this.getStats();
        GlobalCacheStatsCollector.getInstance().updateServiceStats(this.serviceIdentifier, stats);
        await GlobalCacheStatsCollector.getInstance().broadcastUpdate();
        await GlobalCacheStatsCollector.getInstance().broadcastUpdateDashboard(this.serviceIdentifier);
        await GlobalCacheStatsCollector.getInstance().broadcastUpdateGlobalDashboard(this.serviceIdentifier);
        await GlobalCacheStatsCollector.getInstance().broadcastUpdateLogs();
        await GlobalCacheStatsCollector.getInstance().broadcastUpdateGlobalStats();
        await GlobalCacheStatsCollector.getInstance().broadcastUpdateServiceStats(this.serviceIdentifier);

    }

    private async onDelete(key: string): Promise<void> {
        const keyStats = this.keyStats.get(key);
        const size = keyStats ? keyStats.size : 0;

        if (keyStats) {
            this.stats.hits -= keyStats.hits;
            this.stats.misses -= keyStats.misses;
            this.stats.size -= keyStats.size;
        }

        this.stats.keysDeleted++;
        this.stats.keys = Math.max((await this.redisClient.dbsize()) - 1, 0);

        this.updateKeyStats(key, 'del', size);
        logger.log(this.serviceIdentifier, `Key deleted: ${key}, total keys: ${this.stats.keys}, total size: ${this.stats.size}`, 'delete');
        GlobalCacheStatsCollector.getInstance().decrementStats(this.serviceIdentifier, { keysDeleted: 1, keys: 1, size: size, hits: keyStats?.hits, misses: keyStats?.misses });

        this.triedKeys.delete(key);  // Remove the key from triedKeys when deleted
        this.usageFrequency.delete(key); // Remove the key from usage frequency map
        this.notifyChange();
    }

    private async onExpired(key: string): Promise<void> {
        logger.log(this.serviceIdentifier, `Cache entry expired: ${key}`, 'expire');
        this.stats.evictions++; // Increment evictions on expiry
        GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { evictions: 1 });
        await this.onDelete(key);
    }

    private updateKeyStats(key: string, action: 'set' | 'del' | 'hit' | 'miss', size: number = 0, responseTime: number = 0, isRefresh: boolean = false, endTime: number = 0, ttl?: number): void {
        let stats = this.keyStats.get(key) || { hits: 0, misses: 0, keyName: key, setTime: Date.now(), ttl: this.defaultTTL ?? 0, size: 0, responseTimes: [], uncachedResponseTimes: [], endTime: 0 };
        switch (action) {
            case 'set':
                stats.setTime = Date.now();
                if (!isRefresh) {
                    stats.ttl = ttl ?? this.defaultTTL ?? 0; // Actualizar TTL
                    stats.size = size;
                    stats.responseTimes = [];
                    stats.uncachedResponseTimes = [];
                    stats.endTime = endTime;
                }
                stats.uncachedResponseTimes.push(responseTime);
                break;
            case 'del':
                this.keyStats.delete(key);
                return;
            case 'hit':
                stats.hits++;
                stats.responseTimes.push(responseTime);
                this.incrementUsageFrequency(key); // Incrementar la frecuencia de uso en hit
                break;
            case 'miss':
                stats.misses++;
                break;
        }
        this.keyStats.set(key, stats);
    }

    private async compressData<T>(data: T): Promise<Buffer> {
        const jsonData = JSON.stringify(data);
        if (jsonData.length > 1024) {
            return await gzipAsync(jsonData);
        }
        return Buffer.from(jsonData);
    }

    private async decompressData(data: Buffer): Promise<any> {
        try {
            const decompressed = await gunzipAsync(data);
            return JSON.parse(decompressed.toString());
        } catch {
            return JSON.parse(data.toString());
        }
    }

    public async get<T>(key: string): Promise<T | undefined> {
        const startTime = Date.now();
        try {
            const value = await this.redisClient.getBuffer(key);
            if (value !== null) {
                const decompressedData = await this.decompressData(value);
                const responseTime = Date.now() - startTime;
                
                // Update key size and stats if key not already in cache
                if (!this.keyStats.has(key)) {
                    const size = await this.getKeyMemoryUsage(key);
                    this.updateKeyStats(key, 'set', size, responseTime, false, Date.now() + (await this.redisClient.ttl(key)) * 1000);
                }
                
                this.updateKeyStats(key, 'hit', 0, responseTime);
                logger.log(this.serviceIdentifier, `Cache hit: ${key}`, 'hit');
                this.stats.hits++;
                GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { hits: 1 });
                this.notifyChange();
                this.recordCall();
                return decompressedData as T;
            } else {
                if (this.triedKeys.has(key)) {
                    this.stats.misses++;
                    this.updateKeyStats(key, 'miss');
                    logger.log(this.serviceIdentifier, `Cache miss: ${key}`, 'miss');
                    GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { misses: 1 });
                    this.notifyChange();
                } else {
                    this.triedKeys.add(key);
                }
                return undefined;
            }
        } catch (error) {
            logger.log(this.serviceIdentifier, `Redis cache get error: ${error}`, 'error');
            if (this.triedKeys.has(key)) {
                this.stats.misses++;
                this.updateKeyStats(key, 'miss');
                logger.log(this.serviceIdentifier, `Cache miss due to error: ${key}`, 'error');
                GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { misses: 1 });
                this.notifyChange();
            } else {
                this.triedKeys.add(key);
            }
            return undefined;
        }
    }

    private incrementUsageFrequency(key: string): void {
        const currentFrequency = this.usageFrequency.get(key) || 0;
        this.usageFrequency.set(key, currentFrequency + 1);
    }

    private async enforceMemoryLimit(): Promise<void> {
        if (this.maxMemorySize !== undefined) {
            let currentMemoryUsage = await this.getCurrentMemoryUsage();
            while (currentMemoryUsage > this.maxMemorySize) {
                const keys = await this.redisClient.keys('*');
                if (keys.length === 0) break;

                const leastUsedKey = this.getLeastUsedKey(keys);
                if (leastUsedKey) {
                    await this.redisClient.del(leastUsedKey);
                    this.stats.evictions++;
                    logger.log(this.serviceIdentifier, `Evicted least used key: ${leastUsedKey}`, 'eviction');
                }
                currentMemoryUsage = await this.getCurrentMemoryUsage();
            }
        }
    }

    private async getCurrentMemoryUsage(): Promise<number> {
        const memoryInfo = await this.redisClient.info('memory');
        const usedMemoryMatch = memoryInfo.match(/used_memory:(\d+)/);
        if (usedMemoryMatch) {
            return parseInt(usedMemoryMatch[1], 10);
        }
        return 0;
    }

    private getLeastUsedKey(keys: string[]): string | null {
        let leastUsedKey: string | null = null;
        let minFrequency = Infinity;
        for (const key of keys) {
            const frequency = this.usageFrequency.get(key) || 0;
            if (frequency < minFrequency) {
                minFrequency = frequency;
                leastUsedKey = key;
            }
        }
        return leastUsedKey;
    }

    public async set<T>(key: string, value: T, ttl?: number, isRefresh: boolean = false): Promise<void> {
        const startTime = Date.now();
        try {
            const cacheTTL = ttl ?? this.defaultTTL;
            if (typeof cacheTTL !== 'number') {
                throw new Error('Cache TTL must be a number');
            }
            const compressedData = await this.compressData(value);
            const oldValue = await this.redisClient.getBuffer(key);

            // Check if the value already exists and adjust the stats accordingly
            if (oldValue && oldValue.length > 0 && !isRefresh) {
                this.stats.size = Math.max(0, this.stats.size - oldValue.length);
            }

            const endTime = Date.now() + cacheTTL * 1000;

            logger.log(this.serviceIdentifier, `Setting key: ${key}, TTL: ${cacheTTL}`, 'set');
            await this.redisClient.set(key, compressedData, 'EX', cacheTTL);

            const responseTime = Date.now() - startTime;
            this.updateKeyStats(key, 'set', compressedData.length, responseTime, isRefresh, endTime, cacheTTL);

            if (!oldValue || Buffer.compare(oldValue, compressedData) !== 0) {
                if (!isRefresh) {
                    this.stats.keysAdded++;
                    this.stats.keys = await this.redisClient.dbsize();
                }
                this.stats.size += compressedData.length;

                logger.log(this.serviceIdentifier, `Key added or updated: ${key}, total keys: ${this.stats.keys}, total size: ${this.stats.size}`, 'set');

                GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, {
                    keysAdded: !isRefresh ? 1 : 0,
                    keys: await this.redisClient.dbsize(),
                    size: compressedData.length
                });
            } else if (isRefresh) {
                logger.log(this.serviceIdentifier, `TTL updated for key: ${key}`, 'set');
            } else {
                logger.log(this.serviceIdentifier, `Key set called, but value is unchanged: ${key}`, 'set');
            }

            const keyStat = this.keyStats.get(key);
            if (keyStat) {
                keyStat.ttl = cacheTTL;
                keyStat.endTime = endTime;
            }

            this.notifyChange();
            this.recordCall();
        } catch (error) {
            logger.log(this.serviceIdentifier, `Redis cache set error: ${error}`, 'error');
        }
    }

    public async del(key: string): Promise<void> {
        try {
            logger.log(this.serviceIdentifier, `Deleting key: ${key}`, 'delete');
            await this.redisClient.del(key);
            await this.onDelete(key);
            this.recordCall();
        } catch (error) {
            logger.log(this.serviceIdentifier, `Redis cache delete error: ${error}`, 'error');
        }
    }

    public getStats(): CacheStats {
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            keys: this.stats.keys,
            keysAdded: this.stats.keysAdded,
            keysDeleted: this.stats.keysDeleted,
            size: this.stats.size,
            evictions: this.stats.evictions,
            maxMemorySizeMB: this.maxMemorySize ? this.maxMemorySize / (1024 * 1024) : undefined,
        };
    }

    public getKeyStats(): Map<string, KeyStats> {
        return this.keyStats;
    }

    public async flush(): Promise<void> {
        try {
            logger.log(this.serviceIdentifier, 'Flushing all keys', 'flush');
            await this.redisClient.flushall();
            GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, {
                keysDeleted: this.stats.keys,
                keys: -this.stats.keys,
                size: -this.stats.size,
                evictions: this.stats.keys // Añadimos evictions
            });
            this.stats.keysDeleted += this.stats.keys;
            this.stats.keys = 0;
            this.stats.keysAdded = 0;
            this.stats.hits = 0;
            this.stats.misses = 0;
            this.stats.size = 0;
            this.stats.evictions += this.stats.keys; // Actualizamos evictions
            this.keyStats.clear();
            this.triedKeys.clear(); // Clear triedKeys when flushing cache
            this.usageFrequency.clear(); // Clear usage frequency map when flushing cache

            this.notifyChange();
        } catch (error) {
            logger.log(this.serviceIdentifier, `Redis cache flush error: ${error}`, 'error');
        }
    }

    public async hasKey(key: string): Promise<boolean> {
        try {
            const exists = await this.redisClient.exists(key);
            logger.log(this.serviceIdentifier, `Key exists check: ${key} - ${exists}`, 'check');
            return exists === 1;
        } catch (error) {
            logger.log(this.serviceIdentifier, `Redis cache hasKey error: ${error}`, 'error');
            return false;
        }
    }

    public getConfig() {
        return {
            ttl: this.defaultTTL,
            maxMemorySizeMB: this.maxMemorySize ? this.maxMemorySize / (1024 * 1024) : undefined
        };
    }

    public updateConfig(newTTL?: number, newMaxMemorySizeMB?: number): void {
        if (newTTL !== undefined) {
            this.defaultTTL = newTTL;
        }

        if (newMaxMemorySizeMB !== undefined) {
            if (newMaxMemorySizeMB > 0) {
                const newMaxMemorySizeBytes = newMaxMemorySizeMB * 1024 * 1024;
                this.maxMemorySize = newMaxMemorySizeBytes;
                this.stats.maxMemorySizeMB = newMaxMemorySizeMB; // Actualizar los stats
                this.enforceMemoryLimit();
            } else {
                throw new Error("Max memory size must be greater than 0.");
            }
        }

        this.notifyChange();
    }
}
