/****************************************************************************************
 * 📚 Example 10 (EN) – Using CacheDash in TEST MODE
 * ======================================================================================
 * Template snippet for **unit tests**; not intended to run as a standalone script.
 *
 * 💡 Why `testMode: true`?
 *   • Turns off WebSockets and internal timers → faster, stable tests.
 *   • Avoids costly I/O (perfect for CI pipelines).
 *
 * What it shows:
 *   1.  Creating LOCAL and (optional) “REDIS” instances in test mode.
 *   2.  Sample operations with no side effects (set / get / stats).
 *   3.  Jest pseudo‑integration.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Test‑mode instances */
const localTestCache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 5,
  serviceIdentifier: 'TEST_LOCAL',
  testMode         : true              // WebSockets & timers OFF
});

const redisTestCache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : 'redis://localhost:6379', // or ioredis‑mock
  defaultTTL       : 5,
  serviceIdentifier: 'TEST_REDIS',
  testMode         : true
});

/* 2️⃣  Illustrative operations (async IIFE) */
(async () => {
  await localTestCache.set('foo', 'bar');
  await redisTestCache.set('foo', 'bar');

  const l = await localTestCache.get('foo');  // 'bar'
  const r = await redisTestCache.get('foo');  // 'bar'

  const lStats = localTestCache.getStats();
  const rStats = redisTestCache.getStats();

  // Use l, r, lStats, rStats in your assertions
})();

/* 3️⃣  Jest integration (example) */
// describe('CacheDash in test mode', () => {
//   it('stores and retrieves values without side effects', async () => {
//     const cache = CacheServiceCreate.create({ cacheType:'local', testMode:true });
//     await cache.set('key', 42);
//     expect(await cache.get('key')).toBe(42);
//   });
// });
