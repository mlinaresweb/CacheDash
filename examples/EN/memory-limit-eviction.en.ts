/****************************************************************************************
 * 📚 Example 7 (EN) – Memory limit & automatic eviction (LOCAL)
 * ======================================================================================
 * Reference snippet — NOT meant to be executed as‑is.
 *
 * Demonstrates:
 *   • Setting `maxMemorySizeMB` on a LOCAL cache instance.
 *   • Observing how CacheDash evicts least‑used keys when the
 *     memory threshold is exceeded.
 *   • Reading `getStats()` to see evictions, current size, keys left.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  LOCAL instance limited to 2 MB with no TTL */
const MAX_MB = 2;

const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 0,        // no time expiry
  maxMemorySizeMB  : MAX_MB,   // memory cap
  serviceIdentifier: 'EXAMPLE_EVICT_7',
  enableMonitoring : false
});

/* Helper: ~0.5 MB object */
const genBig = (i: number) => ({ id: i, blob: 'x'.repeat(512 * 1024) });

/* 2️⃣  Insert data until the limit is breached (async IIFE) */
(async () => {
  for (let i = 1; i <= 6; i++) {
    await cache.set(`big:${i}`, genBig(i)); // ~0.5 MB each
  }

  const statsAfterInsert = cache.getStats();     // check size & evictions
  const survivors = Array.from(cache.getKeyStats()?.keys() || []);

  // survivors reveals which keys survived automatic eviction
})();
