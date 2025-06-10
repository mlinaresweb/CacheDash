import { LocalCacheService } from '../../src/local/localCacheService';

test('evicts least‑used under pressure', async () => {
  const cache = new LocalCacheService(0, 'EvictLRU', 256 * 1024); // 256 KB
  await cache.set('old', 'x'.repeat(200_000));
  await cache.set('new', 'y'.repeat(200_000)); // +200 KB, sobrepasa límite
  expect(await cache.hasKey('old')).toBe(false);
  expect(await cache.hasKey('new')).toBe(true);
});