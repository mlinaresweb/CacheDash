/**
 * 📚 Example 1 (EN)
 * =================
 * How to perform every basic CacheDash operation with an **in‑memory** cache.
 *
 * What you’ll learn:
 *   • Creating a LOCAL cache instance with a global TTL.
 *   • Storing values with the default TTL and with a custom TTL.
 *   • Reading values and observing automatic expiration.
 *   • Checking key existence via hasKey().
 *   • Invalidating specific keys (del) or the whole cache (flush).
 *   • Retrieving global and per‑key statistics for debugging.
 *
 * This file is meant as documentation snippets – not as a runnable script.
 * Copy the relevant parts into your own services / controllers and
 * adapt keys, TTLs and serviceIdentifier to your domain.
 */

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Create a LOCAL cache instance */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',     // in‑memory backend
  defaultTTL       : 10,          // global TTL in seconds
  serviceIdentifier: 'EXAMPLE_LOCAL_1',
  enableMonitoring : false        // set true if you enable the dashboard
});

(async () => {

/* 2️⃣  set(): store values */
await cache.set('foo', 'bar');           // uses global TTL (10 s)
await cache.set('count', 123);           // global TTL
await cache.set('token', 'abc123', 5);   // custom TTL (5 s)

/* 3️⃣  get(): read values */
const foo1 = await cache.get('foo');     // 'bar'
const tok1 = await cache.get('token');   // 'abc123'
// … wait 6 seconds …
const tok2 = await cache.get('token');   // undefined (expired)

/* 4️⃣  hasKey(): check without fetching */
const fooExists  = await cache.hasKey('foo');   // true
const tokenAlive = await cache.hasKey('token'); // false

/* 5️⃣  del() and flush() */
await cache.del('foo');   // invalidate only 'foo'
await cache.flush();      // wipe the entire cache

/* 6️⃣  Metrics */
const globalStats = cache.getStats();    // hits, misses, keys, size, …
const perKeyStats = cache.getKeyStats(); // Map<key, KeyStats>

})();
