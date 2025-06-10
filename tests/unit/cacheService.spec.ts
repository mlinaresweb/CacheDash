// tests/unit/cacheService.spec.ts

import { CacheService } from '../../src/cacheService';
import { CacheType } from '../../src/types/cache';

describe('CacheService wrapper – comprehensive', () => {
  it('uses LOCAL by default for CRUD operations', async () => {
    const cs = new CacheService({ serviceIdentifier: 'WrapLocal', testMode: true });
    // Initially empty
    expect(cs.getStats().keys).toBe(0);

    // SET / GET
    await cs.set('x', 100);
    expect(await cs.get<number>('x')).toBe(100);
    expect(await cs.hasKey('x')).toBe(true);

    // getKeyStats
    const ks = cs.getKeyStats()!;
    expect(ks.has('x')).toBe(true);
    expect(ks.get('x')!.keyName).toBe('x');

    // STATS reflect one key
    expect(cs.getStats().keys).toBe(1);

    // FLUSH
    await cs.flush();
    expect(await cs.hasKey('x')).toBe(false);
    expect(cs.getStats().keys).toBe(0);
  });

  it('uses REDIS when configured for CRUD operations', async () => {
    const cs = new CacheService({
      cacheType: CacheType.REDIS,
      serviceIdentifier: 'WrapRedis',
      testMode: true
    });

    // Initially empty
    expect(cs.getStats().keys).toBe(0);

    // SET / GET
    await cs.set('r', 'foo');
    expect(await cs.get<string>('r')).toBe('foo');
    expect(await cs.hasKey('r')).toBe(true);

    // getKeyStats
    const ks = cs.getKeyStats()!;
    expect(ks.has('r')).toBe(true);
    expect(ks.get('r')!.keyName).toBe('r');

    // STATS reflect one key
    expect(cs.getStats().keys).toBe(1);

    // DEL
    await cs.del('r');
    expect(await cs.hasKey('r')).toBe(false);

    // FLUSH no error on empty
    await cs.flush();
    expect(cs.getStats().keys).toBe(0);
  });

  it('delegates getStats correctly for both backends', async () => {
    const local = new CacheService({ serviceIdentifier: 'Loc', testMode: true });
    expect(local.getStats()).toMatchObject({ hits: 0, misses: 0, keys: 0 });

    const redis = new CacheService({
      cacheType: CacheType.REDIS,
      serviceIdentifier: 'Red',
      testMode: true
    });
    expect(redis.getStats()).toMatchObject({ hits: 0, misses: 0, keys: 0 });
  });

  it('delegates getKeyStats and handles undefined when empty', () => {
    const cs = new CacheService({ serviceIdentifier: 'Empty', testMode: true });
    expect(cs.getKeyStats()?.size).toBe(0);
    const redisEmpty = new CacheService({
      cacheType: CacheType.REDIS,
      serviceIdentifier: 'EmptyR',
      testMode: true
    });
    expect(redisEmpty.getKeyStats()?.size).toBe(0);
  });
});
