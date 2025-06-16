/****************************************************************************************
 * 📚 Example 3 (EN) – Caching an API JSON with CacheDash (LOCAL)
 * ======================================================================================
 * Documentation snippet (NOT meant to run as‑is).  It shows how to:
 *
 *   1.  Create a LOCAL cache instance with a generous TTL (60 s).
 *   2.  Store an API JSON response via `set`.
 *   3.  Read that JSON from cache via `get`.
 *   4.  Skip the API call if the key is still alive (`hasKey`).
 *   5.  Invalidate the cached response when the API releases v2 (`del` + new `set`).
 *   6.  Inspect global and per‑key stats (`getStats`, `getKeyStats`).
 *
 * Replace the “productsJson” block with your real `fetch/axios` call and
 * adjust `DATA_KEY` to match your endpoint.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  LOCAL instance with a 60‑second global TTL */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 60,
  serviceIdentifier: 'EXAMPLE_JSON_3',
  enableMonitoring : false
});

const DATA_KEY = 'api:/products/list';

/* 2️⃣  Async IIFE to avoid top‑level await */
(async () => {

  /* Store JSON (simulated API response v1) */
  const productsJson = {
    version     : 'v1',
    generatedAt : new Date().toISOString(),
    items       : Array.from({ length: 1000 }, (_, i) => ({
      id   : i + 1,
      name : `Product #${i + 1}`,
      price: (Math.random() * 100).toFixed(2)
    }))
  };
  await cache.set(DATA_KEY, productsJson);              // TTL 60 s

  /* Consume data from cache */
  const cached = await cache.get<typeof productsJson>(DATA_KEY);
  // e.g. cached?.items.length, cached?.version …

  /* Skip new API call if key is still valid */
  if (await cache.hasKey(DATA_KEY)) {
    // Use cached JSON
  } else {
    // Call the API again and then cache.set()
  }

  /* Manually invalidate when API ships v2 */
  await cache.del(DATA_KEY);                            // invalidate v1
  const productsJsonV2 = { ...productsJson, version: 'v2' };
  await cache.set(DATA_KEY, productsJsonV2);            // store v2

  /* Audit statistics */
  const globalStats = cache.getStats();                 // hits, misses, size…
  const perKeyStats = cache.getKeyStats()?.get(DATA_KEY);

})();
