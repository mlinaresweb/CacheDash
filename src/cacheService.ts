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
    private testMode: boolean;

    constructor(config: CacheServiceConfig & { testMode?: boolean } = {}) {
        const {
            cacheType = CacheType.LOCAL,
            defaultTTL,
            testMode = false,
            redisOptions,
            serviceIdentifier = "DefaultService",
            enableMonitoring = false,
            maxMemorySizeMB
        } = config;

        this.testMode = testMode;
        this.cacheType = cacheType;
        this.defaultTTL = defaultTTL;
        this.serviceIdentifier = serviceIdentifier;
        this.monitoringEnabled = enableMonitoring;

        const maxMemorySize = maxMemorySizeMB ? maxMemorySizeMB * 1024 * 1024 : undefined;
        
        if (cacheType === CacheType.LOCAL) {
              const ttl = defaultTTL ?? 0;
            this.localCacheService = new LocalCacheService(ttl, serviceIdentifier, maxMemorySize, testMode); 

            // Register the cache service and its key stats with the global collector
            const globalCollector = GlobalCacheStatsCollector.getInstance();
            globalCollector.registerCacheService(serviceIdentifier, this.localCacheService.getStats(), this.localCacheService, maxMemorySizeMB);
            globalCollector.registerKeyStats(serviceIdentifier, this.localCacheService.getKeyStats());

            if (this.monitoringEnabled && !testMode) {
                globalCollector.enableMonitoring();
            }
        } else if (cacheType === CacheType.REDIS ) {
            const opts = (redisOptions as RedisOptions) || {};
            const ttl = defaultTTL ?? 0;
            this.redisCacheService = new RedisCacheService(  opts, ttl, serviceIdentifier,maxMemorySize, testMode);

            // Register the cache service and its key stats with the global collector
            const globalCollector = GlobalCacheStatsCollector.getInstance();
            globalCollector.registerCacheService(serviceIdentifier, this.redisCacheService.getStats(), this.redisCacheService);
            globalCollector.registerKeyStats(serviceIdentifier, this.redisCacheService.getKeyStats());

            if (this.monitoringEnabled && !testMode) {
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