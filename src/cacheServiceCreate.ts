import { CacheService, CacheServiceConfig as BaseCacheServiceConfig } from './cacheService';
import { CacheType } from './types/cache';

export class CacheServiceCreate {
    static readonly LOCAL = 'local';
    static readonly REDIS = 'redis';
    static readonly NONE = 'none';

    static create(config: Partial<Omit<BaseCacheServiceConfig, 'cacheType'> & { cacheType?: 'local' | 'redis' | 'none' }> = {}): CacheService {
        const resolvedConfig: BaseCacheServiceConfig = {
            ...config,
            cacheType: config.cacheType ? CacheType[config.cacheType.toUpperCase() as keyof typeof CacheType] : CacheType.LOCAL,
        };
        return new CacheService(resolvedConfig);
    }
}
