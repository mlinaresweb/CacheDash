import express from 'express';
import http from 'http';
import { configureRoutes } from '../../src/dashboard/routes/dashboardRoutes';

import { GlobalCacheStatsCollector } from '../../src/dashboard/globalCacheStatsCollector';
import { LocalCacheService }        from '../../src/local/localCacheService';

let server: http.Server;

async function globalSetup() {
  const app = express();
  app.use(express.json());

  /* ── singleton ── */
  const gc = GlobalCacheStatsCollector.getInstance();
  gc.enableMonitoring();

  /* ── servicio “user-cache” ── */
  let userCache = gc.getService('user-cache') as LocalCacheService | undefined;

  if (!userCache) {
    // constructor: (ttl, identifier?, maxMemorySizeMB?, testMode?)
    userCache = new LocalCacheService(60, 'user-cache');

    // registra: (id, stats, instance, maxMemorySize?)
    gc.registerCacheService('user-cache', userCache.getStats(), userCache);
  }

  /* ── clave semilla ── */
// después de await userCache.set(...)
await userCache.set('session:123', { foo: 'bar' }, 120, true); // 👈 crea KeyStats
    await userCache.get('session:123');  
  /* ── expone rutas ── */
  app.use('/', configureRoutes());

  server = await new Promise<http.Server>((res) => {
    const srv = app.listen(0, () => res(srv));   // ← devuelve el Server real
  });

  process.env.A2E_BASE_URL =
    `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  return () => new Promise<void>((res) => server.close(() => res()));
}
export default globalSetup;
