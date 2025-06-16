/****************************************************************************************
 * 🧩 Example 4 (EN) – Patterns for caching function results
 * ======================================================================================
 * Documentation snippet (NOT meant to run as‑is).  Demonstrates three production‑ready
 * ways to leverage CacheDash in business logic without extra dependencies:
 *
 *   1.  getOrSet()      → generic helper (fixed key)
 *   2.  cachedFn()      → lightweight decorator (key = name + args)
 *   3.  Inline pattern  → key built inside the heavy function itself
 *
 * API methods:  get() · set() · del() · hasKey() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 0️⃣  LOCAL instance (switch to 'redis' if needed) */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 30,              // global TTL in seconds
  serviceIdentifier: 'EXAMPLE_FUNC_4',
  enableMonitoring : false
});

/* 1️⃣  getOrSet() – universal helper (key already known) */
async function getOrSet<T>(
  key: string,
  ttl: number,
  compute: () => Promise<T> | T
): Promise<T> {
  const hit = await cache.get<T>(key);
  if (hit !== undefined) return hit;              // HIT
  const value = await Promise.resolve(compute()); // MISS
  await cache.set(key, value, ttl);
  return value;
}

/* 2️⃣  cachedFn() – decorator for functions (key = name+args) */
function cachedFn<T extends (...args: any[]) => any>(
  fn: T,
  ttl = 30,
  prefix = fn.name
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = `${prefix}:${JSON.stringify(args)}`;
    const hit = await cache.get<ReturnType<T>>(key);
    if (hit !== undefined) return hit;

    const res = await Promise.resolve(fn(...args));
    await cache.set(key, res, ttl);
    return res;
  };
}

/* 3️⃣  Inline pattern – function handles its own key */
async function expensiveComputation(a: number, b: number): Promise<number> {
  const key = `expensive:${a}:${b}`;
  const hit = await cache.get<number>(key);
  if (hit !== undefined) return hit;

  const result = Math.pow(a, b);       // heavy calculation
  await cache.set(key, result, 45);    // TTL 45 s
  return result;
}

/* ╭──────────────────────────────────────────────────────────╮
 * │  DEMO (async IIFE) – copy only what you need            │
 * ╰──────────────────────────────────────────────────────────╯ */
(async () => {
  /* getOrSet(): cache a global config object */
  const cfg = await getOrSet('config:global', 120, () => ({
    version: '1.0', loadedAt: Date.now()
  }));

  /* cachedFn(): cache monthly reports */
  const buildReport   = (y: number, m: number) => `REPORT_${y}_${m}_${Date.now()}`;
  const cachedReport  = cachedFn(buildReport, 60, 'report');
  const feb2025First  = await cachedReport(2025, 2); // MISS
  const feb2025Second = await cachedReport(2025, 2); // HIT

  /* inline: heavy calculation */
  const pow1 = await expensiveComputation(2, 10); // MISS
  const pow2 = await expensiveComputation(2, 10); // HIT

  /* Point invalidation + check */
  await cache.del('report:[2025,2]');
  const stillExists = await cache.hasKey('report:[2025,2]'); // false

  /* Debug stats */
  console.log('Global stats:', cache.getStats());
})();
