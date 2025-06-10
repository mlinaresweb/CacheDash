//localCacheService.TS
import NodeCache from 'node-cache';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { CacheStats, KeyStats } from '../types/cache';
import { GlobalCacheStatsCollector } from '../dashboard/globalCacheStatsCollector';
import { logger } from '../dashboard/utils/loggerService';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class LocalCacheService {
    private localCache: NodeCache;
    private defaultTTL?: number;
    private stats: CacheStats = { hits: 0, misses: 0, keys: 0, keysAdded: 0, keysDeleted: 0, size: 0, evictions: 0 };
    private keyStats: Map<string, KeyStats> = new Map();
    private serviceIdentifier: string;
    private triedKeys: Set<string> = new Set();
    private maxMemorySize?: number;
    private usageFrequency: Map<string, number> = new Map();
    private callHistory: { [timestamp: string]: number } = {};
    private testMode: boolean;
    
    constructor(defaultTTL?: number, serviceIdentifier: string = "DefaultService", maxMemorySize?: number, testMode: boolean = false) {
        this.localCache = new NodeCache({
            stdTTL: defaultTTL,
            checkperiod: 60,
            useClones: false,
            deleteOnExpire: true
        });
        this.defaultTTL = defaultTTL;
        this.serviceIdentifier = serviceIdentifier;
        this.maxMemorySize = maxMemorySize;
        this.testMode = testMode;

        this.localCache.on('del', this.onDelete.bind(this));
        this.localCache.on('expired', this.onExpired.bind(this));
        this.localCache.on('flush', this.onFlush.bind(this));

        GlobalCacheStatsCollector.getInstance().registerCacheService(this.serviceIdentifier, this.getStats(), this, maxMemorySize);
        if (!this.testMode) {
        setInterval(this.cleanUpOldCalls.bind(this), 3600000); // Ejecutar la limpieza cada hora

        // Ejecutar la verificación de memoria periódicamente
        if (this.maxMemorySize !== undefined) {
            setInterval(this.enforceMemoryLimit.bind(this), 60000); // Cada minuto
        }
        }
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

    private onDelete(key: string): void {
        const keyStats = this.keyStats.get(key);
        const size = keyStats ? keyStats.size : 0;

        if (keyStats) {
            this.stats.hits -= keyStats.hits;
            this.stats.misses -= keyStats.misses;
            this.stats.size -= keyStats.size;
        }

        this.stats.keysDeleted++;
        this.stats.keys = Math.max(this.localCache.keys().length - 1, 0);

        this.updateKeyStats(key, 'del', size);
        logger.log(this.serviceIdentifier, `Key deleted: ${key}, total keys: ${this.stats.keys}, total size: ${this.stats.size}`, 'delete');
        GlobalCacheStatsCollector.getInstance().decrementStats(this.serviceIdentifier, { keysDeleted: 1, keys: 1, size: size, hits: keyStats?.hits, misses: keyStats?.misses });

        this.triedKeys.delete(key);  // Remove the key from triedKeys when deleted
        this.usageFrequency.delete(key); // Remove the key from usage frequency map
        this.notifyChange();
    }

    private onExpired(key: string): void {
        logger.log(this.serviceIdentifier, `Cache entry expired: ${key}`, 'expire');
        this.stats.evictions++; // Increment evictions on expiry
        GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { evictions: 1 });
        this.onDelete(key);
    }

    private onFlush(): void {
        logger.log(this.serviceIdentifier, 'Cache flushed', 'flush');
        this.stats.evictions += this.stats.keys; // Consider all keys evicted
        GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { evictions: this.stats.keys });
        this.notifyChange();
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
          if (this.testMode) {
        return Buffer.from(jsonData);
        }
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

    // public async get<T>(key: string): Promise<T | undefined> {
    //     const startTime = Date.now();
    //     try {
    //         const value = this.localCache.get<Buffer>(key);
    //         if (value !== undefined) {
    //             const decompressedData = await this.decompressData(value);
    //             const responseTime = Date.now() - startTime;
    //             this.updateKeyStats(key, 'hit', 0, responseTime);
    //             logger.log(this.serviceIdentifier, `Cache hit: ${key}`, 'hit');
    //             this.stats.hits++;
    //             GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { hits: 1 });
    //             this.notifyChange();
    //             this.recordCall();
    //             return decompressedData as T;
    //         } else {
    //             if (this.triedKeys.has(key)) {
    //                 this.stats.misses++;
    //                 this.updateKeyStats(key, 'miss');
    //                 logger.log(this.serviceIdentifier, `Cache miss: ${key}`, 'miss');
    //                 GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { misses: 1 });
    //                 this.notifyChange();
    //             } else {
    //                 this.triedKeys.add(key);
    //             }
    //             return undefined;
    //         }
    //     } catch (error) {
    //         logger.log(this.serviceIdentifier, `Local cache get error: ${error}`, 'error');
    //         if (this.triedKeys.has(key)) {
    //             this.stats.misses++;
    //             this.updateKeyStats(key, 'miss');
    //             logger.log(this.serviceIdentifier, `Cache miss due to error: ${key}`, 'error');
    //             GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { misses: 1 });
    //             this.notifyChange();
    //         } else {
    //             this.triedKeys.add(key);
    //         }
    //         return undefined;
    //     }
    // }
public async get<T>(key: string): Promise<T | undefined> {
  const startTime = Date.now();
  try {
    const buf = this.localCache.get<Buffer>(key);
    if (buf !== undefined) {
      const data = await this.decompressData(buf);
      const responseTime = Date.now() - startTime;
      this.updateKeyStats(key, 'hit', 0, responseTime);
      logger.log(this.serviceIdentifier, `Cache hit: ${key}`, 'hit');
      this.stats.hits++;
      GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { hits: 1 });
      this.notifyChange();
      this.recordCall();
      return data as T;
    } else {
      // cada miss cuenta siempre
      this.stats.misses++;
      this.updateKeyStats(key, 'miss');
      logger.log(this.serviceIdentifier, `Cache miss: ${key}`, 'miss');
      GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { misses: 1 });
      this.notifyChange();
      return undefined;
    }
  } catch (error) {
    logger.log(this.serviceIdentifier, `Local cache get error: ${error}`, 'error');
    // en error también cuenta como miss
    this.stats.misses++;
    this.updateKeyStats(key, 'miss');
    GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, { misses: 1 });
    this.notifyChange();
    return undefined;
  }
}

    private incrementUsageFrequency(key: string): void {
        const currentFrequency = this.usageFrequency.get(key) || 0;
        this.usageFrequency.set(key, currentFrequency + 1);
    }

    private enforceMemoryLimit(): void {
        if (this.maxMemorySize !== undefined) {
            while (this.getCurrentMemoryUsage() > this.maxMemorySize) {
                const keys = this.localCache.keys();
                if (keys.length === 0) break;

                const leastUsedKey = this.getLeastUsedKey(keys);
                if (leastUsedKey) {
                    this.localCache.del(leastUsedKey);
                    this.stats.evictions++;
                    logger.log(this.serviceIdentifier, `Evicted least used key: ${leastUsedKey}`, 'eviction');
                }
            }
        }
    }

    private getCurrentMemoryUsage(): number {
        return this.stats.size;
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

    // public async set<T>(key: string, value: T, ttl?: number, isRefresh: boolean = false): Promise<void> {
    //     const startTime = Date.now();
    //     try {
    //         const cacheTTL = ttl ?? this.defaultTTL;
    //         if (typeof cacheTTL !== 'number') {
    //             throw new Error('Cache TTL must be a number');
    //         }
    //         const compressedData = await this.compressData(value);
    //         const oldValue = this.localCache.get<Buffer>(key) || Buffer.from('');

    //         // Check if the value already exists and adjust the stats accordingly
    //         if (oldValue.length > 0 && !isRefresh) {
    //             this.stats.size = Math.max(0, this.stats.size - oldValue.length);
    //         }

    //         // Enforce memory limit before setting the new key
    //         this.enforceMemoryLimit();

    //         const endTime = Date.now() + cacheTTL * 1000;

    //         logger.log(this.serviceIdentifier, `Setting key: ${key}, TTL: ${cacheTTL}`, 'set');
    //         this.localCache.set(key, compressedData, cacheTTL);

    //         const responseTime = Date.now() - startTime;
    //         this.updateKeyStats(key, 'set', compressedData.length, responseTime, isRefresh, endTime, cacheTTL);

    //         if (!oldValue || Buffer.compare(oldValue, compressedData) !== 0) {
    //             if (!isRefresh) {
    //                 this.stats.keysAdded++;
    //                 this.stats.keys = this.localCache.keys().length;
    //             }
    //             this.stats.size += compressedData.length;

    //             logger.log(this.serviceIdentifier, `Key added or updated: ${key}, total keys: ${this.stats.keys}, total size: ${this.stats.size}`, 'set');

    //             GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, {
    //                 keysAdded: !isRefresh ? 1 : 0,
    //                 keys: this.localCache.keys().length,
    //                 size: compressedData.length
    //             });
    //         } else if (isRefresh) {
    //             // Here, we handle the case where the TTL is updated without changing the value
    //             this.localCache.ttl(key, cacheTTL);
    //             logger.log(this.serviceIdentifier, `TTL updated for key: ${key}`, 'set');
    //         } else {
    //             logger.log(this.serviceIdentifier, `Key set called, but value is unchanged: ${key}`, 'set');
    //         }

    //         // Make sure to update the TTL in the keyStats
    //         const keyStat = this.keyStats.get(key);
    //         if (keyStat) {
    //             keyStat.ttl = cacheTTL;
    //             keyStat.endTime = endTime;
    //         }

    //         this.notifyChange();
    //         this.recordCall();
    //     } catch (error) {
    //         logger.log(this.serviceIdentifier, `Local cache set error: ${error}`, 'error');
    //     }
    // }
public async set<T>(key: string, value: T, ttl?: number, isRefresh: boolean = false): Promise<void> {
  const startTime = Date.now();
  try {
    const cacheTTL = ttl ?? this.defaultTTL;
    if (typeof cacheTTL !== 'number') {
      throw new Error('Cache TTL must be a number');
    }
    const compressedData = this.testMode
      // en testMode guardamos JSON directo
      ? Buffer.from(JSON.stringify(value))
      : await this.compressData(value);

    const oldValue = this.localCache.get<Buffer>(key) || Buffer.from('');
    // Si ya existía y no refresh, restamos su tamaño
    if (oldValue.length > 0 && !isRefresh) {
      this.stats.size = Math.max(0, this.stats.size - oldValue.length);
    }

    logger.log(this.serviceIdentifier, `Setting key: ${key}, TTL: ${cacheTTL}`, 'set');
    this.localCache.set(key, compressedData, cacheTTL);

    // Actualizamos stats
    const responseTime = Date.now() - startTime;
    const endTime = Date.now() + cacheTTL * 1000;
    this.updateKeyStats(key, 'set', compressedData.length, responseTime, isRefresh, endTime, cacheTTL);

    if (!oldValue.length || Buffer.compare(oldValue, compressedData) !== 0) {
      if (!isRefresh) {
        this.stats.keysAdded++;
        this.stats.keys = this.localCache.keys().length;
      }
      this.stats.size += compressedData.length;
      GlobalCacheStatsCollector.getInstance().incrementStats(this.serviceIdentifier, {
        keysAdded: !isRefresh ? 1 : 0,
        keys: this.localCache.keys().length,
        size: compressedData.length,
      });
    }

    // ➡️ **Nuevo paso**: forzamos expulsión tras actualizar tamaño
    this.enforceMemoryLimit();

    this.notifyChange();
    this.recordCall();
  } catch (error) {
    logger.log(this.serviceIdentifier, `Local cache set error: ${error}`, 'error');
  }
}

    public async del(key: string): Promise<void> {
        try {
            logger.log(this.serviceIdentifier, `Deleting key: ${key}`, 'delete');
            this.localCache.del(key);
            this.onDelete(key);
            this.recordCall();
        } catch (error) {
            logger.log(this.serviceIdentifier, `Local cache delete error: ${error}`, 'error');
        }
    }

    public getStats(): CacheStats {
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            keys: this.localCache.keys().length,
            keysAdded: this.stats.keysAdded,
            keysDeleted: this.stats.keysDeleted,
            size: this.stats.size,
            evictions: this.stats.evictions, // Añadimos evictions
            maxMemorySizeMB: this.maxMemorySize ? this.maxMemorySize / (1024 * 1024) : undefined,
        };
    }

    public getKeyStats(): Map<string, KeyStats> {
        return this.keyStats;
    }

    public async flush(): Promise<void> {
        try {
            logger.log(this.serviceIdentifier, 'Flushing all keys', 'flush');
            this.localCache.flushAll();
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
            logger.log(this.serviceIdentifier, `Local cache flush error: ${error}`, 'error');
        }
    }

    public async hasKey(key: string): Promise<boolean> {
        try {
            const exists = this.localCache.has(key);
            logger.log(this.serviceIdentifier, `Key exists check: ${key} - ${exists}`, 'check');
            return exists;
        } catch (error) {
            logger.log(this.serviceIdentifier, `Local cache hasKey error: ${error}`, 'error');
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
            this.localCache.options.stdTTL = newTTL;
    
            // Update TTL for all existing keys
            this.localCache.keys().forEach(key => {
                const value = this.localCache.get<Buffer>(key);
                if (value) {
                    this.localCache.ttl(key, newTTL);
                    const keyStats = this.keyStats.get(key);
                    if (keyStats) {
                        keyStats.ttl = newTTL;
                        keyStats.endTime = Date.now() + newTTL * 1000;
                    }
                }
            });
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