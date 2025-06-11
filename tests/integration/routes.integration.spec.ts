// tests/integration/routes.integration.spec.ts
import { jest } from '@jest/globals';
import type { Application } from 'express';
import type { Server } from 'http';
import path from 'node:path';

describe('Dashboard routes integration', () => {
  let app: Application;
  let server: Server;
  let request: typeof import('supertest');

  beforeAll(async () => {
    jest.resetModules();
    jest.unmock('express');
    jest.unmock('http');

    /* 👉 RESTAURA dashboardRoutes REAL */
    const routesPath = require.resolve(
      path.join(process.cwd(), 'src', 'dashboard', 'routes', 'dashboardRoutes')
    );
    jest.doMock(routesPath, () => jest.requireActual(routesPath));

    /* 👉 Stub mínimo del GlobalCacheStatsCollector */
    const collectorPath = require.resolve(
      path.join(process.cwd(), 'src', 'dashboard', 'globalCacheStatsCollector')
    );
    jest.doMock(collectorPath, () => {
      const blankService = {
        set  : jest.fn().mockImplementation(async () => undefined),
        get  : jest.fn().mockImplementation(async () => 'value'),
        del  : jest.fn().mockImplementation(async () => undefined),
        flush: jest.fn().mockImplementation(async () => undefined),
        getKeyStats : jest.fn().mockReturnValue(new Map()),
        updateConfig: jest.fn(),
        getStats    : jest.fn().mockReturnValue({}),
      };
      return {
        GlobalCacheStatsCollector: {
          getInstance: () => ({
            isMonitoringEnabled: () => true,
            getAllStats        : () => new Map(),
            getKeyStatsRegistry: () => new Map(),
            getService         : () => blankService,
          }),
        },
      };
    });

    /* Crea app real + servidor */
    const express = (await import('express')).default;
    const { configureRoutes } = await import(routesPath);

    app = express();
    app.use(express.json());
    app.use('/', configureRoutes());
    server = app.listen(0);

    /* importa supertest DESPUÉS de restaurar http */
    const st = await import('supertest');
    request = (st as any).default ?? (st as any);
  });

  afterAll(() => server.close());

  it('GET /dashboard debería devolver 200', async () => {
    const res = await request(server).get('/dashboard');
    expect(res.status).toBe(200);
  });

  it('POST /update-ttl debe validar TTL numérico', async () => {
    const res = await request(server)
      .post('/update-ttl')
      .send({ service: 'svc', key: 'k', ttl: 'abc' });

    expect(res.status).toBe(400);
  });
});
