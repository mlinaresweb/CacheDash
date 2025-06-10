// tests/unit/redisCacheService.spec.ts
import { RedisCacheService } from '../../src/redis/redisCacheService';

describe('RedisCacheService (unit)', () => {
  let cache: RedisCacheService;

  beforeAll(() => {
    // cache = new RedisCacheService({ host: '127.0.0.1', port: 6379 }, 1, 'TestRedis', undefined, true);
    cache = new RedisCacheService({}, 0, 'UnitRedis', undefined, true);
  });

  afterAll(async () => {
    await cache.flush();
  });

  it('should round‑trip simple values', async () => {
    await cache.set('a', 42);
    // Usamos get sin genérico para que el fallback JSON funcione
    const raw = await cache.get('a');
    expect(raw).toBe(42);
  });

  it('should honour TTL in Redis', async () => {
    await cache.set('b', 'hello', 1);
    expect(await cache.get('b')).toBe('hello');
    await new Promise(r => setTimeout(r, 1100));
    expect(await cache.get('b')).toBeUndefined();
  });

  it('flush should clear all keys', async () => {
    await cache.set('c', 'z');
    await cache.flush();
    expect(await cache.get('c')).toBeUndefined();
  });

 it('hasKey should report existence', async () => {
    await cache.set('d', true);
    expect(await cache.hasKey('d')).toBe(true);
    await cache.del('d');
    expect(await cache.hasKey('d')).toBe(false);
  });

  it('getKeyStats returns map with correct entries', async () => {
    await cache.set('e', { foo: 'bar' });
    const ks = cache.getKeyStats();
    expect(ks.has('e')).toBe(true);
    const estat = ks.get('e')!;
    expect(estat.keyName).toBe('e');
    expect(estat.hits).toBe(0);
  });
});
