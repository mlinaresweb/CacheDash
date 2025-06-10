// tests/unit/localCacheService.spec.ts

import { LocalCacheService } from '../../src/local/localCacheService';

describe('LocalCacheService (unit) – comprehensive', () => {
  let cache: LocalCacheService;

  beforeEach(() => {
    // TTL infinite (0), max memory 128KB, testMode = true
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

  // ———————————————— New Tests ————————————————

  it('getConfig returns correct TTL and maxMemorySize', () => {
    const cfg = cache.getConfig();
    expect(cfg.ttl).toBe(0);
    expect(cfg.maxMemorySizeMB).toBeCloseTo(0.125, 3); // 128KB = 0.125MB
  });

  it('updateConfig changes default TTL and updates existing keys TTL', async () => {
    await cache.set('a', 1);
    // default TTL = 0 (infinite)
    cache.updateConfig(5); 
    expect(cache.getConfig().ttl).toBe(5);
    // existing key 'a' should have its TTL updated
    const ks = cache.getKeyStats().get('a')!;
    expect(ks.ttl).toBe(5);
  });

  it('updateConfig changes maxMemorySize and enforces eviction', async () => {
    // set very small memory to force eviction (~1KB)
    cache.updateConfig(undefined, 0.001);
    await cache.set('big', 'x'.repeat(2000));
    expect(await cache.hasKey('big')).toBeFalsy();
  });

  it('flush clears all keys and resets stats', async () => {
    await cache.set('k1', 'v1');
    await cache.set('k2', 'v2');
    expect(cache.getStats().keys).toBe(2);
    await cache.flush();
    expect(cache.getStats().keys).toBe(0);
    expect(cache.getKeyStats().size).toBe(0);
  });

  it('getCallHistory tracks number of operations', async () => {
    await cache.set('x', 1);
    await cache.get('x');
    await cache.del('x');
    const hist = cache.getCallHistory();
    const total = Object.values(hist).reduce((sum, v) => sum + v, 0);
    expect(total).toBeGreaterThanOrEqual(3);
  });

  it('first‑time miss increments misses counter', async () => {
    const before = cache.getStats().misses;
    await cache.get('unknown');
    const after = cache.getStats().misses;
    expect(after).toBe(before + 1);
  });
});
