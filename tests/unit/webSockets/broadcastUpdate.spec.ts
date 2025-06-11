// tests/unit/webSockets/broadcastUpdate.spec.ts
import { jest } from '@jest/globals';
import path from 'node:path';

const WS_PATH   = path.join(process.cwd(),
  'src', 'dashboard', 'webSockets', 'websocketServer');
const VIEW_PATH = path.join(process.cwd(),
  'src', 'dashboard', 'views', 'pages', 'ServiceListView');
const COLLECTOR_PATH = path.join(process.cwd(),
  'src', 'dashboard', 'globalCacheStatsCollector');
const BROADCAST_UPDATE_PATH = path.join(process.cwd(),
  'src', 'dashboard', 'webSockets', 'broadcasts', 'broadcastUpdate');

describe('broadcastUpdate()', () => {
  it('envía UPDATE_VIEW y llama a broadcastUpdateDashboard por servicio', async () => {
    /* variable donde capturaremos el mock para las aserciones */
    const broadcastMock = jest.fn();

    /* aislamos todo el flujo en su propio registry */
    await jest.isolateModulesAsync(async () => {
      /* 1 ─ mock de websocketServer (el PRIMERO que se registra) */
      jest.mock(WS_PATH, () => {
        const dummyClient: any = { readyState: 1, send: jest.fn() };
        return {
          wss      : { clients: new Set([dummyClient]) },
          broadcast: broadcastMock,           // 👈 mock que verificaremos
        };
      });

      /* 2 ─ mock de la vista (HTML determinista) */
      jest.mock(VIEW_PATH, () => ({
        generateServiceListViewHtml: () => '<html>LIST</html>',
      }));

      /* 3 ─ mock del GlobalCacheStatsCollector */
      const dashboardSpy = jest.fn();
      jest.mock(COLLECTOR_PATH, () => ({
        GlobalCacheStatsCollector: {
          getInstance: () => ({
            getAllStats: () =>
              new Map().set('svc', {
                hits: 1, misses: 0, keys: 1, size: 10,
                evictions: 0, keysAdded: 0, keysDeleted: 0,
              }),
            getServiceRegistry: () => new Map().set('svc', {}),
            broadcastUpdateDashboard: dashboardSpy,
          }),
        },
      }));

      /* 4 ─ ahora importamos la función a probar */
      const { broadcastUpdate } = await import(BROADCAST_UPDATE_PATH);
      await broadcastUpdate();

      /* 5 ─ aserciones */
      expect(broadcastMock).toHaveBeenCalledWith({
        type: 'UPDATE_VIEW',
        html: '<html>LIST</html>',
      });
      expect(dashboardSpy).toHaveBeenCalledWith('svc');
    });
  });
});
