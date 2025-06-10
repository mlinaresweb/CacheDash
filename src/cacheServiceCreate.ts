// src/cacheServiceCreate.ts

import { CacheService, CacheServiceConfig as BaseConfig } from './cacheService';
import { CacheType } from './types/cache';

export interface CacheServiceCreateConfig
  extends Partial<Omit<BaseConfig, 'cacheType'>> {
  cacheType?: 'local' | 'redis' | 'none';
  testMode?: boolean;    
}

export class CacheServiceCreate {
  static readonly LOCAL = 'local';
  static readonly REDIS = 'redis';
  static readonly NONE = 'none';

  static create(config: CacheServiceCreateConfig = {}): CacheService {
    const {
      cacheType,
      testMode,     
      ...rest
    } = config;
    const resolvedConfig: BaseConfig & { testMode?: boolean } = {
      ...rest,
      cacheType: cacheType
        ? CacheType[cacheType.toUpperCase() as keyof typeof CacheType]
        : CacheType.LOCAL,
    };
    return new CacheService({ ...resolvedConfig, testMode });
  }
}
