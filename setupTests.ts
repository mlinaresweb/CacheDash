// setupTests.ts
// @ts-nocheck
import { jest } from '@jest/globals';

/* 1. Silenciar logs */
jest.spyOn(console, 'log').mockImplementation(() => undefined);

/* 2. Evitar timers que queden “abiertos” */
jest.spyOn(global, 'setInterval').mockImplementation((fn) => {
  fn(); // ejecuta una vez
  return { unref: () => {} };
});

/* 3. Mock ws (WebSocketServer) */
jest.mock('ws', () => {
  class MockWS { constructor(){} on(){} close(cb?:()=>void){ cb?.(); } }
  return { Server: MockWS, WebSocketServer: MockWS };
});

/* 4. Mock express + Router */
jest.mock('express', () => {
  const router = { get:()=>router, post:()=>router, use:()=>router };
  const app = () => app;
  app.use = () => app;
  app.json = () => app;
  app.urlencoded = () => app;
  app.static = () => app;
  app.listen = (_:number, cb?:()=>void) => { cb?.(); return { close:(c:any)=>c() }; };
  return { __esModule:true, default:app, Router:()=>router };
});

/* 5. Mock http.createServer */
jest.mock('http', () => ({
  createServer: () => ({ listen:(_:any, cb:()=>void) => { cb(); return { close:(c:any)=>c() }; } })
}));

/* 6. Stub dashboardRoutes para que configureRoutes exista */
jest.mock(
  './src/dashboard/routes/dashboardRoutes',
  () => ({ configureRoutes: () => (req:any, res:any, next:any) => next() })
);

/* 7. Stub websocketServer + broadcast */
jest.mock(
  './src/dashboard/webSockets/websocketServer',
  () => ({
    wss: { clients:new Set(), on:()=>{}, close:()=>{} },
    broadcast: async () => {},
  })
);

/* 8. Stub todos los broadcastUpdates (no hacen nada) */
jest.mock(
  './src/dashboard/webSockets/broadcasts/broadcastUpdate',
  () => ({
    broadcastUpdate               : async () => {},
    broadcastUpdateLogs           : async () => {},
    broadcastUpdateDashboard      : async (_:string) => {},
    broadcastUpdateGlobalDashboard: async (_:string) => {},
    broadcastUpdateGlobalStats    : async () => {},
    broadcastUpdateServiceStats   : async (_:string) => {},
  })
);

/* 9. Extiende ioredis-mock (config/psubscribe) */
const RedisMock = require('ioredis-mock');
// Acepta cualquier firma: config('SET','notify-keyspace-events','Ex'), etc.
RedisMock.prototype.config = function(..._args: any[]) { 
  return Promise.resolve('OK');
};
RedisMock.prototype.psubscribe = function(..._args: any[]) {
  return Promise.resolve(1);
};
jest.mock('ioredis', () => RedisMock);