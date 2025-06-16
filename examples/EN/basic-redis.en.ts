/****************************************************************************************
 * 📚 Example 2 (EN) – Integrating CacheDash with Redis
 * ======================================================================================
 * This file is **documentation only** (not meant to be run as‑is). It shows how to wire
 * CacheDash to a Redis backend in any environment (local, Docker, CI, prod) without
 * hard‑coding the connection string.
 *
 * 1) Build `redisUrl` from environment variables:
 *      • REDIS_URL   (full url, e.g. redis://user:pass@host:port/db)
 *      • REDIS_HOST  +  REDIS_PORT  as fallback
 * 2) Create the `cache` instance with `cacheType:'redis'`.
 * 3) Illustrate every core operation: set, get, hasKey, del, flush, getStats.
 *
 * Copy the relevant parts into your own services/controllers and adapt TTL,
 * keys and serviceIdentifier to your domain.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Build Redis connection URL */
const redisUrl =
  process.env.REDIS_URL ||                                // (1) full URL
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:` +   // (2) host
  `${process.env.REDIS_PORT || 6379}`;                    //     + port

/* 2️⃣  Create CacheDash instance with Redis backend */
const cache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : redisUrl,
  defaultTTL       : 20,            // global TTL: 20 s
  serviceIdentifier: 'EXAMPLE_REDIS_2',
  enableMonitoring : false          // set true if you enable the dashboard
});

/* 3️⃣  Illustrative operations (wrapped in an async IIFE) */
(async () => {

  // Store values with global and custom TTL
  await cache.set('redis:foo', 'bar');           // TTL 20 s
  await cache.set('redis:number', 100);          // TTL 20 s
  await cache.set('redis:ephemeral', 'temp', 5); // TTL 5 s

  // Retrieve values
  const foo = await cache.get('redis:foo');      // 'bar'
  const num = await cache.get('redis:number');   // 100

  // Check short‑TTL expiration
  const before = await cache.get('redis:ephemeral'); // 'temp'
  // … wait 6 s and read again …
  const after  = undefined; // (expired – concept only)

  // Verify existence without fetching
  const existsNum  = await cache.hasKey('redis:number');    // true
  const existsTemp = await cache.hasKey('redis:ephemeral'); // false after TTL

  // Invalidate one key and wipe the entire cache
  await cache.del('redis:number');
  await cache.flush();

  // Global + per‑key stats
  const global = cache.getStats();
  const perKey = cache.getKeyStats();

})();
