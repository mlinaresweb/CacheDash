export enum CacheType {
    LOCAL = 'local',
    REDIS = 'redis',
    NONE = 'none',
}

export interface CacheStats {
    hits: number;
    misses: number;
    keys: number;
    size: number;
    keysAdded: number;
    keysDeleted: number;
    evictions: number;
    maxMemorySizeMB?: number; 
}


export interface KeyStats {
    hits: number;
    misses: number;
    keyName: string;
    setTime: number;
    ttl: number;
    size: number; 
    endTime?: number;
    responseTimes: number[]; 
    uncachedResponseTimes: number[]; 
}

export interface CacheEvent {
    type: 'hit' | 'set';
    timestamp: number;
}