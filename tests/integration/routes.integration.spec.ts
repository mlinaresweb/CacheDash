// tests/integration/routes.integration.spec.ts
import { jest } from '@jest/globals';
import type { Application } from 'express';
import type { Server } from 'http';
import path from 'node:path';

describe('Dashboard routes – wiring completo', () => {
  let app: Application;
  let server: Server | undefined;
  let request: typeof import('supertest');

  beforeAll(async () => {
    jest.resetModules();
    jest.doMock('express', () => jest.requireActual('express'));
    jest.doMock('http',    () => jest.requireActual('http'));

    /* Ruta absoluta del módulo de rutas */
    const routesPath = require.resolve(
      path.join(process.cwd(), 'src', 'dashboard', 'routes', 'dashboardRoutes')
    );
    /* Sustituye el stub global por la implementación real */
    jest.doMock(routesPath, () => jest.requireActual(routesPath));

    /* 🔧 Stub del GlobalCacheStatsCollector con lo que piden las 3 rutas */
    const collectorPath = require.resolve(
      path.join(process.cwd(), 'src', 'dashboard', 'globalCacheStatsCollector')
    );
    jest.doMock(collectorPath, () => {
      /* keyStats ficticio para el servicio 'svc' */
      const keyStatsMap = new Map().set('myKey', {
        keyName: 'myKey',
        hits   : 1,
        misses : 0,
        size   : 10,
      });
      const registry = new Map().set('svc', keyStatsMap);

      return {
        GlobalCacheStatsCollector: {
          getInstance: () => ({
            isMonitoringEnabled          : () => true,
            getAllStats                  : () => new Map(),
            getKeyStatsRegistry          : () => registry,
            generateCsv                  : () => 'csv',          // /export-key-stats
            getAllServicesCallHistory    : () => [],             // /all-services-call-history
            getService                   : () => ({}),
          }),
        },
      };
    });

    /* Express + rutas reales */
    const express = (await import('express')).default;
    const { configureRoutes } = await import(routesPath);

    app = express();
    app.use(express.json());
    app.use('/', configureRoutes());
    server = app.listen(0);

    const st = await import('supertest');
    request = (st as any).default ?? (st as any);
  });

  afterAll(() => server?.close());

  const cases: [string, string, any?][] = [
    ['get',  '/dashboard'],
    ['get',  '/dashboard/estadisticas'],
    ['get',  '/cache-key-stats'],
    ['get',  '/cache-key-stats/charts?service=svc'],
    ['post', '/delete-key',      { service: 'svc', key: 'k' }],
    ['post', '/refresh-key',     { service: 'svc', key: 'k' }],
    ['post', '/flush-cache',     { service: 'svc' }],
    ['get',  '/export-key-stats?service=svc'],
    ['get',  '/memory-usage'],
    ['get',  '/logs'],
    ['get',  '/all-services-call-history'],
    ['post', '/update-ttl',      { service: 'svc', key: 'k', ttl: 10 }],
    ['get',  '/settings'],
    ['post', '/update-settings', { serviceIdentifier: 'svc' }],
  ];

  describe.each(cases)('%s %s responde (no 404)', (method, url, body) => {
    it('no devuelve 404', async () => {
      const res = body
        ? await request(server!)[method as 'get' | 'post'](url).send(body)
        : await request(server!)[method as 'get' | 'post'](url);

      expect(res.status).not.toBe(404);
    });
  });
});
