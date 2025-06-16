/****************************************************************************************
 * 📚 Example 8 (EN) – Concurrency‑Safe Pattern (Double‑Check + In‑Flight Map)
 * ======================================================================================
 * Reference snippet — not intended to be run as‑is.  Shows how to protect an
 * expensive resource from concurrent requests using CacheDash only.
 *
 * ✨ Problem
 *   • Several concurrent requests ask for the same heavy computation.
 *   • If the key is missing, each request would trigger the job ⇒ dog‑pile.
 *
 * 🛠 Solution
 *   1)  Check cache first.
 *   2)  If absent, store a Promise in an **in‑flight map**.
 *   3)  Later requests await that very Promise.
 *   4)  When resolved, store in CacheDash and drop the map entry.
 *
 *   API used:  get() · set() · hasKey() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* LOCAL cache instance with 15‑second TTL */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 15,
  serviceIdentifier: 'EXAMPLE_CONC_8',
  enableMonitoring : false
});

/* In‑flight map  (key → Promise) */
const inFlight = new Map<string, Promise<any>>();

/* Concurrency‑safe helper */
async function getOrLoad<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttl = 15
): Promise<T> {
  /* 1st check: cache */
  const cached = await cache.get<T>(key);
  if (cached !== undefined) return cached;

  /* 2nd check: in‑flight promise */
  if (inFlight.has(key)) return inFlight.get(key)!;

  /* Launch loader and register the promise */
  const promise = Promise.resolve(loader())
    .then(async res => {
      await cache.set(key, res, ttl); // Persist in CacheDash
      return res;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/* Usage illustration (5 concurrent requests) */
(async () => {
  const KEY = 'heavy:99';

  const expensiveOp = async (id: number) => {
    // …real heavy logic: DB, ML, rendering…
    await new Promise(r => setTimeout(r, 300));
    return `VALUE_${id}_${Date.now()}`;
  };

  const concurrent = Array.from({ length: 5 }, () =>
    getOrLoad(KEY, () => expensiveOp(99))
  );

  const results = await Promise.all(concurrent);
  // → all 5 results identical; expensiveOp executed only once

  const stats = cache.getStats(); // hits should be 4, misses 1
})();
