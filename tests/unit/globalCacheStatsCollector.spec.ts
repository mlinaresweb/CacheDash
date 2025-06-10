// tests/unit/globalCacheStatsCollector.spec.ts

import { GlobalCacheStatsCollector } from '../../src/dashboard/globalCacheStatsCollector';
import { CacheStats, KeyStats } from '../../src/types/cache';

describe('GlobalCacheStatsCollector (unit)', () => {
  let collector: GlobalCacheStatsCollector;

  beforeEach(() => {
    collector = GlobalCacheStatsCollector.getInstance();
    // Limpiar registros internos
    (collector as any).statsRegistry.clear();
    (collector as any).keyStatsRegistry.clear();
    (collector as any).serviceRegistry.clear();
    (collector as any).monitoringEnabled = false;
  });

  it('registerCacheService and getServiceRegistryKeys', () => {
    const stats: CacheStats = { hits:0, misses:0, keys:0, keysAdded:0, keysDeleted:0, size:0, evictions:0 };
    collector.registerCacheService('S1', stats, {} as any, 50);
    collector.registerCacheService('S2', stats, {} as any, 100);
    const keys = collector.getServiceRegistryKeys();
    expect(keys).toEqual(expect.arrayContaining(['S1','S2']));
    expect(collector.getStatsRegistry().get('S1')?.maxMemorySizeMB).toBe(50);
    expect(collector.getStatsRegistry().get('S2')?.maxMemorySizeMB).toBe(100);
  });

it('updateServiceStats merges new stats', () => {
  collector.registerCacheService(
    'S1',
    { hits: 1, misses: 2, keys: 3, keysAdded: 0, keysDeleted: 0, size: 0, evictions: 0 },
    {} as any
  );
  // Pasamos un CacheStats completo:
  collector.updateServiceStats(
    'S1',
    { hits: 5, misses: 2, keys: 3, keysAdded: 0, keysDeleted: 0, size: 200, evictions: 0 }
  );
  const updated = collector.getStatsRegistry().get('S1')!;
  expect(updated.hits).toBe(5);
  expect(updated.size).toBe(200);
  expect(updated.misses).toBe(2);
});

  it('incrementStats and decrementStats work when monitoring enabled', () => {
    // Habilitar monitorización
    (collector as any).monitoringEnabled = true;
    collector.registerCacheService('S1', { hits:0, misses:0, keys:0, keysAdded:0, keysDeleted:0, size:0, evictions:0 }, {} as any);
    collector.incrementStats('S1', { hits:3, misses:2 });
    let st = collector.getStatsRegistry().get('S1')!;
    expect(st.hits).toBe(3);
    expect(st.misses).toBe(2);

    collector.decrementStats('S1', { hits:1, misses:1 });
    st = collector.getStatsRegistry().get('S1')!;
    expect(st.hits).toBe(2);
    expect(st.misses).toBe(1);
  });

  it('getCacheRenewalRate and getEvictionRate calculations', () => {
    collector.registerCacheService('S1', {
      hits:0, misses:0, keys:10, keysAdded:5, keysDeleted:3, size:0, evictions:2
    }, {} as any);
    const rates = collector.getCacheRenewalRate();
    // RenewalRate = (added+deleted)/(keys+added+deleted)*100
    expect(rates.get('S1')).toBeCloseTo(((5+3)/(10+5+3))*100);
    const erates = collector.getEvictionRate();
    // EvictionRate = evictions/(keys+evictions)*100
    expect(erates.get('S1')).toBeCloseTo((2/(10+2))*100);
  });

  it('generateCsv outputs valid CSV', () => {
    const now = Date.now();
    const arr: KeyStats[] = [{
      keyName: 'k1',
      hits: 1,
      misses: 0,
      setTime: now - 1000,
      ttl: 5,
      size: 100,
      responseTimes: [],
      uncachedResponseTimes: [],
      endTime: now + 4000,
    }];
    const csv = collector.generateCsv(arr);
    expect(csv.startsWith('Key,Hits,Misses,Set Time,End Time,TTL')).toBe(true);
    expect(csv).toContain('k1,1,0');
  });
});
