import { CacheServiceCreate } from '../../src';

describe('Race conditions', () => {
  const c = CacheServiceCreate.create({ cacheType: 'local', serviceIdentifier: 'Race' });

  it('set/get concurrent', async () => {
    const writers = Array.from({ length: 50 }, (_, i) => c.set(`k`, i));
    const readers = Array.from({ length: 50 }, () => c.get<number>('k'));
    const results = await Promise.all([...writers, ...readers]);
    expect(results.filter(Boolean).length).toBeGreaterThan(0);
  });
});
