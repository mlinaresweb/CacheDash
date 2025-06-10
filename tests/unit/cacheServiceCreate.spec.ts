import { CacheServiceCreate } from '../../src/cacheServiceCreate';
import { CacheService } from '../../src/cacheService';

describe('CacheServiceCreate', () => {
  it('has correct string constants', () => {
    expect(CacheServiceCreate.LOCAL).toBe('local');
    expect(CacheServiceCreate.REDIS).toBe('redis');
    expect(CacheServiceCreate.NONE).toBe('none');
  });

  it('create() without args returns a LOCAL CacheService', async () => {
    const cs = CacheServiceCreate.create({});
    expect(cs).toBeInstanceOf(CacheService);
    await cs.set('k', 'v');
    expect(await cs.get<string>('k')).toBe('v');
    expect(await cs.hasKey('k')).toBe(true);
    await cs.flush();
  });

  it('create({ cacheType: "redis" }) returns a REDIS CacheService', async () => {
    const cs = CacheServiceCreate.create({ cacheType: 'redis', testMode: true });
    expect(cs).toBeInstanceOf(CacheService);
    await cs.set('rkey', 123);
    expect(await cs.get<number>('rkey')).toBe(123);
    expect(await cs.hasKey('rkey')).toBe(true);
    await cs.del('rkey');
    expect(await cs.hasKey('rkey')).toBe(false);
  });

  it('create({ cacheType: "none" }) returns a no-op CacheService', async () => {
    const cs = CacheServiceCreate.create({ cacheType: 'none' });
    expect(cs).toBeInstanceOf(CacheService);
    await cs.set('x', 1);
    expect(await cs.get<number>('x')).toBeUndefined();
    expect(await cs.hasKey('x')).toBe(false);
    // flush / del / get should not throw
    await expect(cs.flush()).resolves.toBeUndefined();
    await expect(cs.del('x')).resolves.toBeUndefined();
  });
});
