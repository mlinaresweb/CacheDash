import { RedisCacheService } from '../../src/redis/redisCacheService';

describe('RedisCacheService (unit) – comprehensive', () => {
  let cache: RedisCacheService;

  beforeAll(() => {
    cache = new RedisCacheService({}, 0, 'UnitRedis', undefined, true);
  });

  afterAll(async () => {
    await cache.flush();
  });

  it('should round‑trip simple values', async () => {
    await cache.set('a', 42);
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

  it('getConfig returns default TTL and undefined maxMemorySizeMB', () => {
    const cfg = cache.getConfig();
    expect(cfg.ttl).toBe(0);
    expect(cfg.maxMemorySizeMB).toBeUndefined();
  });

  it('updateConfig changes TTL and new keyStats reflect it', async () => {
    cache.updateConfig(5, undefined);
    expect(cache.getConfig().ttl).toBe(5);

    await cache.set('x', 'X');              // usa TTL=5
    const ks = cache.getKeyStats().get('x')!;
    expect(ks.ttl).toBe(5);
  });

  it('updateConfig with maxMemorySizeMB does not throw', () => {
    expect(() => cache.updateConfig(undefined, 1)).not.toThrow();
    const cfg = cache.getConfig();
    expect(cfg.maxMemorySizeMB).toBe(1);
  });

  it('getCallHistory tracks calls count correctly', async () => {
    // limpiar historial
    cache.getCallHistory();
    await cache.set('f', 1);
    await cache.get('f');
    await cache.del('f');
    const hist = cache.getCallHistory();
    const total = Object.values(hist).reduce((sum, v) => sum + v, 0);
    expect(total).toBeGreaterThanOrEqual(3);
  });

  it('error in get logs and returns undefined', async () => {
    // Forzar error en getBuffer/get
    // @ts-ignore
    jest.spyOn(cache['redisClient'], 'get').mockRejectedValueOnce(new Error('fail'));
    const val = await cache.get('errkey');
    expect(val).toBeUndefined();
    // El miss debe haberse incrementado
    expect(cache.getStats().misses).toBeGreaterThanOrEqual(1);
  });
});
