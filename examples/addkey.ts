import { CacheServiceCreate } from '../src/index';
const cacheService = CacheServiceCreate.create({ cacheType: 'local', defaultTTL: 60  });

const addKeyToCache = async (key: string, value: any, ttl: number) => {
    try {
        await cacheService.set(key, value, ttl);
        console.log(`Key "${key}" added successfully.`);
    } catch (error:any) {
        console.error(`Failed to add key "${key}":`, error.message);
    }
};

// Ejemplo de uso
const key = 'testKey';
const value = 'testValue';
const ttl = 60;  // TTL en segundos

addKeyToCache(key, value, ttl);
