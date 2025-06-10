// tests/unit/cacheService.spec.ts
import { CacheService } from '../../src/cacheService';
import { CacheType } from '../../src/types/cache';

describe('CacheService wrapper', () => {
  it('uses LOCAL by default', async () => {
    const cs = new CacheService({ serviceIdentifier: 'WrapLocal', testMode: true });
    await cs.set('x', 100);
    expect(await cs.get<number>('x')).toBe(100);
    expect(await cs.hasKey('x')).toBe(true);
    await cs.flush();
    expect(await cs.hasKey('x')).toBe(false);
  });

  it('uses REDIS when requested', async () => {
    const cs = new CacheService({ cacheType: CacheType.REDIS, serviceIdentifier: 'WrapRedis', testMode: true });
    await cs.set('r', 'foo');
    expect(await cs.get<string>('r')).toBe('foo');
    expect(await cs.hasKey('r')).toBe(true);
    await cs.del('r');
    expect(await cs.hasKey('r')).toBe(false);
  });
});
