/****************************************************************************************
 * 📚 Example 5 (EN) – TTL Strategies & Selective/Global Invalidation
 * ======================================================================================
 * Documentation snippet (NOT intended to run as‑is).  Shows how to:
 *
 *   • Assign different TTLs by data nature:
 *        cfg:*       → 3600 s  (1 h)
 *        session:*   →  900 s  (15 min)
 *        search:*    →   30 s
 *   • Refresh only the “search:*” keys when they expire (no global flush).
 *   • Invalidate a single key (`del`) after a version bump.
 *   • Perform a global flush() for maintenance.
 *   • Inspect the impact via getStats() and hasKey().
 *
 * API used:  set() · get() · hasKey() · del() · flush() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  LOCAL instance with a fallback TTL of 10 s */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 10,   // fallback
  serviceIdentifier: 'EXAMPLE_TTL_5',
  enableMonitoring : false
});

/* 2️⃣  Example logic wrapped in an async IIFE */
(async () => {
  /* Store three data types with dedicated TTLs */
  await cache.set('cfg:site',        { theme:'dark', ver:'1.1' }, 3600);
  await cache.set('session:user:42', { lastActive: Date.now() },   900);
  await cache.set('search:q=shoes',  ['shoe‑1', 'shoe‑2'],          30);

  /* Simulate time passing (30 s) and check expiration */
  // … sleep 30 s …

  const cfgAlive   = await cache.hasKey('cfg:site');        // true
  const sessAlive  = await cache.hasKey('session:user:42'); // true
  const searchMiss = await cache.hasKey('search:q=shoes');  // false

  /* Refresh only the expired search result */
  await cache.set('search:q=shoes', ['shoe‑3', 'shoe‑4'], 30);

  /* Version change for cfg:site → del() + new set() */
  await cache.del('cfg:site');
  await cache.set('cfg:site', { theme:'light', ver:'1.2' }, 3600);

  /* Global maintenance flush and final stats */
  await cache.flush();
  const finalStats = cache.getStats();
})();
