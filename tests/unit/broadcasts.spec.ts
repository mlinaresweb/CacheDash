// tests/unit/webSockets/broadcasts.spec.ts
import { jest } from '@jest/globals';
import path from 'node:path';

/* ──────────────────────────────  paths básicos ────────────────────────────── */
const SRC_DIR          = path.join(process.cwd(), 'src', 'dashboard');
const WS_DIR           = path.join(SRC_DIR, 'webSockets');
const BROADCASTS_DIR   = path.join(WS_DIR, 'broadcasts');
const COLLECTOR_PATH   = path.join(SRC_DIR, 'globalCacheStatsCollector');
const WEBSOCKET_PATH   = path.join(WS_DIR, 'websocketServer');

/* ─────────────────────────────   helpers mocks  ───────────────────────────── */

/** Stub configurable del GlobalCacheStatsCollector */
function stubCollector(overrides: Record<string, any> = {}) {
  const keyStatsSvc = new Map().set('myKey', {
    keyName : 'myKey',
    hits    : 1,
    misses  : 0,
    size    : 10,
  });

  const base = {
    getAllStats                 : () => new Map().set('svc', {
      hits: 1, misses: 0, keys: 1, size: 10,
      evictions: 0, keysAdded: 0, keysDeleted: 0,
    }),
    getKeyStatsRegistry         : () => new Map().set('svc', keyStatsSvc),
    getAverageResponseTimes     : () => new Map().set('svc', 5),
    /* 🔑  nombre correcto que usan los módulos de producción */
    getAverageUncachedResponseTimes: () => new Map().set('svc', 20),
    getKeyResponseTimes         : () => ({ labels: ['k'], responseTimes: [5] }),
    getKeyUncachedResponseTimes : () => ({ labels: ['k'], responseTimes: [20] }),
    getServiceRegistry          : () => new Map().set('svc', {}),
    getAllServicesCallHistory   : () => [],
    broadcastUpdateDashboard    : jest.fn(),
  };

  jest.doMock(COLLECTOR_PATH, () => ({
    GlobalCacheStatsCollector: {
      getInstance: () => ({ ...base, ...overrides }),
    },
  }));
}

/* ─────────────────────────────   test suite  ──────────────────────────────── */
describe('WebSocket broadcasts – unit', () => {
  let broadcastMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    broadcastMock = jest.fn();

    /* WebSocketServer con ≥1 cliente para que no haga early‑return */
    const dummyClient = {};
    jest.doMock(require.resolve(WEBSOCKET_PATH), () => ({
      wss      : { clients: new Set([dummyClient]) },
      broadcast: broadcastMock,
    }));
  });

  afterEach(() => jest.resetModules());

  /* ───────────────────────────   tests  ─────────────────────────── */


  it('broadcastUpdateDashboard publica UPDATE_DASHBOARD', async () => {
    stubCollector();
    jest.doMock(
      path.join(SRC_DIR, 'views', 'pages', 'KeyStatsView'),
      () => ({ generateKeyStatsViewHtml: () => '<html>K</html>' }),
    );

    const { broadcastUpdateDashboard } = await import(
      path.join(BROADCASTS_DIR, 'broadcastUpdateDashboard.ts')
    );
    await broadcastUpdateDashboard('svc');

    expect(broadcastMock).toHaveBeenCalledWith({
      type   : 'UPDATE_DASHBOARD',
      service: 'svc',
      html   : '<html>K</html>',
    });
  });

  it('broadcastUpdateGlobalDashboard publica UPDATE_GLOBAL_DASHBOARD', async () => {
    stubCollector();
    jest.doMock(
      path.join(SRC_DIR, 'views', 'pages', 'MainDashboard'),
      () => ({ generateMainDashboardHtml: () => '<html>Main</html>' }),
    );

    const { broadcastUpdateGlobalDashboard } = await import(
      path.join(BROADCASTS_DIR, 'broadcastUpdateGlobalDashboard.ts')
    );
    await broadcastUpdateGlobalDashboard('svc');

    expect(broadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UPDATE_GLOBAL_DASHBOARD' }),
    );
  });

  it('broadcastUpdateGlobalStats publica UPDATE_GLOBAL_STATISTICS', async () => {
    stubCollector();
    jest.doMock(
      path.join(SRC_DIR, 'views', 'pages', 'StatisticsGlobalView'),
      () => ({ generateStatisticsGlobalViewHtml: () => '<html>Stats</html>' }),
    );

    const { broadcastUpdateGlobalStats } = await import(
      path.join(BROADCASTS_DIR, 'broadcastUpdateGlobalStats.ts')
    );
    await broadcastUpdateGlobalStats();

    expect(broadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UPDATE_GLOBAL_STATISTICS' }),
    );
  });

  it('broadcastUpdateLogs publica UPDATE_LOGS', async () => {
    stubCollector();
    jest.doMock(
      path.join(SRC_DIR, 'views', 'pages', 'LogsView'),
      () => ({ generateLogsHtml: () => '<html>Logs</html>' }),
    );
    jest.doMock(
      path.join(SRC_DIR, 'utils', 'loggerService'),
      () => ({ logger: { getLogs: () => [] } }),
    );

    const { broadcastUpdateLogs } = await import(
      path.join(BROADCASTS_DIR, 'broadcastUpdateLogs.ts')
    );
    await broadcastUpdateLogs();

    expect(broadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UPDATE_LOGS' }),
    );
  });

  it('broadcastUpdateServiceStats publica UPDATE_SERVICE_STATISTICS', async () => {
    stubCollector();
    jest.doMock(
      path.join(SRC_DIR, 'views', 'pages', 'StatisticsView'),
      () => ({ generateStatisticsViewHtml: () => '<html>Svc</html>' }),
    );

    const { broadcastUpdateServiceStats } = await import(
      path.join(BROADCASTS_DIR, 'broadcastUpdateServiceStats.ts')
    );
    await broadcastUpdateServiceStats('svc');

    expect(broadcastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type   : 'UPDATE_SERVICE_STATISTICS',
        service: 'svc',
      }),
    );
  });
});
