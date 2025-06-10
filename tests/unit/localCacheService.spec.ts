// tests/unit/localCacheService.spec.ts
import { LocalCacheService } from '../../src/local/localCacheService';

describe('LocalCacheService (unit)', () => {
  let cache: LocalCacheService;

  beforeEach(() => {
    cache = new LocalCacheService(0, 'UnitLocal', 128 * 1024, true);
  });

  it('should set, get and delete simple values', async () => {
    await cache.set('a', 123);
    expect(await cache.get<number>('a')).toBe(123);
    await cache.del('a');
    expect(await cache.get('a')).toBeUndefined();
  });

  it('should honour TTL expiration', async () => {
    await cache.set('b', 'x', 1);
    expect(await cache.get('b')).toBe('x');
    await new Promise(r => setTimeout(r, 1100));
    expect(await cache.get('b')).toBeUndefined();
  });

 it('should evict least‑used under memory pressure', async () => {
    await cache.set('k1', 'x'.repeat(100 * 1024));
    await cache.set('k2', 'y'.repeat(100 * 1024));
    expect(await cache.hasKey('k1')).toBeFalsy();
    expect(await cache.hasKey('k2')).toBeTruthy();
  });

  it('tracks hits and misses correctly', async () => {
    await cache.set('s', 7);
    await cache.get('s');      // hit
    await cache.get('nope');   // miss
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
  });

  it('returns proper keyStats map', async () => {
    await cache.set('x', { foo: 'bar' });
    const ks = cache.getKeyStats();
    expect(ks.has('x')).toBe(true);
    const xstat = ks.get('x')!;
    expect(xstat.keyName).toBe('x');
    expect(xstat.size).toBeGreaterThan(0);
  });
});
