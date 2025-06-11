import path from 'node:path';
import { jest } from '@jest/globals';

/**
 * Crea un stub de GlobalCacheStatsCollector y lo registra con jest.doMock.
 * Devuelve la instancia para poder hacer asserts si el test lo necesita.
 */
export function mockCollector(overrides: Record<string, any> = {}) {
  /* ---- stub por defecto ---- */
  const defaults = {
    isMonitoringEnabled            : jest.fn().mockReturnValue(true),
    getAllServicesCallHistory      : jest.fn().mockReturnValue([]),
    getKeyStatsRegistry            : jest.fn().mockReturnValue(new Map()),
    getAllStats                    : jest.fn().mockReturnValue(new Map()),
    getServiceRegistryKeys         : jest.fn().mockReturnValue([]),
    getServiceRegistry             : jest.fn().mockReturnValue(new Map()),
    getKeyStatsForService          : jest.fn().mockReturnValue({ keyStats: [], totalItems: 0 }),
    getService                     : jest.fn().mockReturnValue(undefined),
    generateCsv                    : jest.fn().mockReturnValue(''),
    getAverageResponseTimes        : jest.fn().mockReturnValue(new Map()),
    getAverageUncachedResponseTimes: jest.fn().mockReturnValue(new Map()),
    getKeyResponseTimes            : jest.fn().mockReturnValue({ labels: [], responseTimes: [] }),
    getKeyUncachedResponseTimes    : jest.fn().mockReturnValue({ labels: [], responseTimes: [] }),
    broadcastUpdateDashboard       : jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    getStatsRegistry               : jest.fn().mockReturnValue(new Map()),
  };

  const instance = { ...defaults, ...overrides };

  /* ---- ruta absoluta del módulo real ---- */
  const collectorPath = require.resolve(
    path.join(process.cwd(), 'src', 'dashboard', 'globalCacheStatsCollector')
  );

  jest.doMock(collectorPath, () => ({
    GlobalCacheStatsCollector: { getInstance: () => instance },
  }));

  return instance;
}
