/****************************************************************************************
 * 📚 Example 6 (EN) – Smart Fallback LOCAL → REDIS
 * ======================================================================================
 * Reference snippet (not runnable as‑is).  Shows how to combine two instances:
 *
 *   • `localCache`   → ultra‑low latency in‑memory cache, short TTL.
 *   • `redisCache`   → durable shared cache, longer TTL.
 *
 * Pattern:
 *   1)  Always read from LOCAL.          (HIT → return)
 *   2)  If miss, query Redis.            (HIT → warm LOCAL)
 *   3)  If miss again, load from origin, write to both caches (write‑through).
 *
 * API methods:  get() · set() · hasKey() · del() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instances */
const localCache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 5,
  serviceIdentifier: 'LOCAL_FAST',
  enableMonitoring : false
});

const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const redisCache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : redisUrl,
  defaultTTL       : 30,
  serviceIdentifier: 'REDIS_BACKING',
  enableMonitoring : false
});

/* 2️⃣  Helper getWithFallback() */
async function getWithFallback<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttlLocal = 5,
  ttlRedis = 30
): Promise<T> {
  const hitLocal = await localCache.get<T>(key);
  if (hitLocal !== undefined) return hitLocal;

  const hitRedis = await redisCache.get<T>(key);
  if (hitRedis !== undefined) {
    await localCache.set(key, hitRedis, ttlLocal); // warm LOCAL
    return hitRedis;
  }

  const fresh = await Promise.resolve(loader());   // real origin
  await localCache.set(key, fresh, ttlLocal);
  await redisCache.set(key, fresh, ttlRedis);
  return fresh;
}

/* 3️⃣  Usage example (embed in your service) */
(async () => {
  const KEY = 'user:42';

  const loadUserFromDB = async () =>
    ({ id: 42, name: 'User 42', loadedAt: Date.now() });

  const user = await getWithFallback(KEY, loadUserFromDB, 5, 30);
  // • First access → MISS/MISS → DB call, populate both caches
  // • Subsequent (<5 s)        → HIT local
  // • After 5 s but <30 s      → MISS local, HIT Redis, re‑warm local
})();
