/****************************************************************************************
 * 📚 Advanced Example (EN) – Multi‑Tier Orchestration with CacheDash
 * ======================================================================================
 * Documentation‑only snippet.  Combines every advanced technique:
 *
 *   • Three cache layers
 *       L1  localFast   → TTL 3 s  (in‑memory)
 *       L2  localLarge  → TTL 30 s (in‑memory, 64 MB cap)
 *       L3  redisShared → TTL 300 s (Redis)
 *   • Cascading fallback L1 → L2 → L3 → loader().
 *   • Stale‑while‑revalidate (serve stale, refresh in background).
 *   • Global in‑flight map to prevent dog‑pile.
 *   • Aggregated metrics across layers.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Layered instances */
const localFast = CacheServiceCreate.create({ cacheType:'local', defaultTTL:3,  serviceIdentifier:'L1_FAST' });
const localLarge = CacheServiceCreate.create({ cacheType:'local', defaultTTL:30, maxMemorySizeMB:64, serviceIdentifier:'L2_LARGE' });
const redisShared = CacheServiceCreate.create({
  cacheType:'redis',
  redisOptions: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST||'127.0.0.1'}:${process.env.REDIS_PORT||6379}`,
  defaultTTL:300,
  serviceIdentifier:'L3_REDIS'
});

/* 2️⃣  In‑flight map */
const inFlight = new Map<string, Promise<any>>();

/* 3️⃣  getSmart() – full cascade + write‑through */
async function getSmart<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttlL1 = 3, ttlL2 = 30, ttlL3 = 300
): Promise<T> {
  const l1 = await localFast.get<T>(key);
  if (l1 !== undefined) return l1;

  const l2 = await localLarge.get<T>(key);
  if (l2 !== undefined) {
    await localFast.set(key, l2, ttlL1);
    return l2;
  }

  const l3 = await redisShared.get<T>(key);
  if (l3 !== undefined) {
    await localFast.set(key, l3, ttlL1);
    await localLarge.set(key, l3, ttlL2);
    return l3;
  }

  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = Promise.resolve(loader()).then(async val => {
    await localFast.set(key, val, ttlL1);
    await localLarge.set(key, val, ttlL2);
    await redisShared.set(key, val, ttlL3);
    return val;
  }).finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/* 4️⃣  Stale‑While‑Revalidate helper */
async function getSWR<T>(key: string, freshTTL: number, loader: () => Promise<T> | T): Promise<T> {
  const stale = await localFast.get<T>(key);
  if (stale !== undefined) {
    const remain = (await localFast.getKeyStats()?.get(key))?.ttl ?? freshTTL;
    if (remain < freshTTL / 2) void getSmart(key, loader, freshTTL); // async refresh
    return stale;
  }
  return getSmart(key, loader, freshTTL);
}

/* 5️⃣  Aggregated metrics */
function mergedStats() {
  const a = localFast.getStats();
  const b = localLarge.getStats();
  const c = redisShared.getStats();
  return {
    hits      : a.hits + b.hits + c.hits,
    misses    : a.misses + b.misses + c.misses,
    sizeMB    : (a.size + b.size + c.size) / (1024 * 1024),
    evictions : a.evictions + b.evictions
  };
}

/* Usage illustration */
(async () => {
  const KEY = 'analytics:dashboard';
  const heavyLoader = async () => ({ ts: Date.now(), rows: 999 });

  await getSmart(KEY, heavyLoader);   // initial fill
  await getSWR(KEY, 5, heavyLoader);  // SWR pattern

  const summary = mergedStats();      // combined metrics
})();
