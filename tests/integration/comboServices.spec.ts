import { CacheServiceCreate } from '../../src';

describe('Combo Local + Redis', () => {
  const local = CacheServiceCreate.create({ cacheType: 'local', serviceIdentifier: 'ITestLocal' });
  const redis = CacheServiceCreate.create({ cacheType: 'redis', serviceIdentifier: 'ITestRedis' });

  it('both services appear in global stats', async () => {
    await local.set('a', 1);
    await redis.set('b', 2);
    const svcKeys = Array.from(
      (await import('../../src/dashboard/globalCacheStatsCollector'))
        .GlobalCacheStatsCollector.getInstance()
        .getServiceRegistryKeys()
    );
    expect(svcKeys).toEqual(expect.arrayContaining(['ITestLocal', 'ITestRedis']));
  });
});
