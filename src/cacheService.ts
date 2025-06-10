//CACHESERVICE.TS
import { LocalCacheService } from './local/localCacheService';
import { RedisCacheService } from './redis/redisCacheService';
import { RedisOptions } from 'ioredis';
import { CacheType, CacheStats, KeyStats } from './types/cache';
import { GlobalCacheStatsCollector } from './dashboard/globalCacheStatsCollector';

export interface CacheServiceConfig {
    cacheType?: CacheType;
    defaultTTL?: number;
    redisOptions?: RedisOptions | string;
    serviceIdentifier?: string;
    enableMonitoring?: boolean;
    maxMemorySizeMB?: number;
}


export class CacheService {
    private localCacheService: LocalCacheService | null = null;
    private redisCacheService: RedisCacheService | null = null;
    private cacheType: CacheType;
    private defaultTTL?: number;
    private serviceIdentifier: string;
    private monitoringEnabled: boolean;

    constructor(config: CacheServiceConfig = {}) {
        const {
            cacheType = CacheType.LOCAL,
            defaultTTL,
            redisOptions,
            serviceIdentifier = "DefaultService",
            enableMonitoring = false,
            maxMemorySizeMB
        } = config;

        this.cacheType = cacheType;
        this.defaultTTL = defaultTTL;
        this.serviceIdentifier = serviceIdentifier;
        this.monitoringEnabled = enableMonitoring;

        const maxMemorySize = maxMemorySizeMB ? maxMemorySizeMB * 1024 * 1024 : undefined;
        
        if (cacheType === CacheType.LOCAL) {
            this.localCacheService = new LocalCacheService(defaultTTL, serviceIdentifier, maxMemorySize); 

            // Register the cache service and its key stats with the global collector
            const globalCollector = GlobalCacheStatsCollector.getInstance();
            globalCollector.registerCacheService(serviceIdentifier, this.localCacheService.getStats(), this.localCacheService, maxMemorySizeMB);
            globalCollector.registerKeyStats(serviceIdentifier, this.localCacheService.getKeyStats());

            if (this.monitoringEnabled) {
                globalCollector.enableMonitoring();
            }
        } else if (cacheType === CacheType.REDIS && redisOptions) {
            this.redisCacheService = new RedisCacheService(redisOptions, defaultTTL, serviceIdentifier);

            // Register the cache service and its key stats with the global collector
            const globalCollector = GlobalCacheStatsCollector.getInstance();
            globalCollector.registerCacheService(serviceIdentifier, this.redisCacheService.getStats(), this.redisCacheService);
            globalCollector.registerKeyStats(serviceIdentifier, this.redisCacheService.getKeyStats());

            if (this.monitoringEnabled) {
                globalCollector.enableMonitoring();
            }
        }
    }

    public async get<T>(key: string): Promise<T | undefined> {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.get<T>(key);
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.get<T>(key);
        } else {
            return undefined;
        }
    }

    public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.set(key, value, ttl);
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.set(key, value, ttl);
        }
    }

    public async del(key: string): Promise<void> {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.del(key);
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.del(key);
        }
    }

    public async flush(): Promise<void> {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.flush();
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.flush();
        }
    }

    public getStats(): CacheStats {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.getStats();
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.getStats();
        } else {
            return { hits: 0, misses: 0, keys: 0, keysAdded: 0, keysDeleted: 0, size: 0, evictions: 0 }; 
        }
    }

    public getKeyStats(): Map<string, KeyStats> | undefined {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.getKeyStats();
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.getKeyStats();
        } else {
            return undefined;
        }
    }

    public async hasKey(key: string): Promise<boolean> {
        if (this.cacheType === CacheType.LOCAL && this.localCacheService) {
            return this.localCacheService.hasKey(key);
        } else if (this.cacheType === CacheType.REDIS && this.redisCacheService) {
            return this.redisCacheService.hasKey(key);
        }
        return false;
    }
}