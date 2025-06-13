// tests/edge/websocketLoad.spec.ts
jest.unmock('ws');
jest.unmock('http');
jest.unmock('../../src/dashboard/webSockets/websocketServer');
jest.resetModules();

import { Worker } from 'worker_threads';
import { once } from 'events';
import { performance } from 'perf_hooks';
import { wss, broadcast } from '../../src/dashboard/webSockets/websocketServer';

jest.setTimeout(300_000); // margen amplio
jest.spyOn(console, 'log').mockImplementation(() => undefined); // mute global

/* ---------- parámetros ---------- */
const TOTAL_CLIENTS   = 10_000;
const WORKERS         = 8;
const CLIENTS_PER_WKR = TOTAL_CLIENTS / WORKERS;
const WS_URL          = 'ws://localhost:8081';

/* ---------- workers ---------- */
const workers: Worker[] = [];

function spawnWorker(): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
      const { workerData, parentPort } = require('worker_threads');
      const WebSocket = require('ws');
      let connected = 0;

      function dial () {
        const ws = new WebSocket(workerData.url, { perMessageDeflate: false });
        ws.once('open', () => {
          if (++connected === workerData.count) parentPort.postMessage('ready');
        });
        ws.once('error', () => setTimeout(dial, 10)); // reintento suave
      }

      for (let i = 0; i < workerData.count; i++) dial();
      `,
      { eval: true, workerData: { count: CLIENTS_PER_WKR, url: WS_URL } },
    );

    worker.once('message', msg => (msg === 'ready' ? resolve() : reject(msg)));
    worker.once('error', reject);
    workers.push(worker);
  });
}

/* ---------- util: espera a que haya N clientes ---------- */
function waitForClients(n: number, timeout = 120_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll () {
      if (wss.clients.size >= n) return resolve();
      if (Date.now() - start > timeout) {
        return reject(new Error(`solo ${wss.clients.size}/${n} clientes conectados`));
      }
      setTimeout(poll, 100);
    })();
  });
}

/* ---------- suite ---------- */
describe('edge › 10 k WS broadcast', () => {
  beforeAll(async () => {
    if (!wss.address()) await once(wss, 'listening');

    await Promise.all(
      Array.from({ length: WORKERS }, () => spawnWorker())
    );

    await waitForClients(TOTAL_CLIENTS);
  });

  afterAll(async () => {
    await Promise.all(workers.map(w => w.terminate()));   // 1⃣ detén workers

    wss.clients.forEach(ws => ws.terminate());            // 2⃣ mata timers ping

    // 3⃣ espera a que todos los sockets del servidor cierren
    await Promise.all([...wss.clients].map(ws => once(ws, 'close')));

    // 4⃣ cierra realmente el server
    await new Promise<void>(res => wss.close(() => res()));
  });

  it('broadcast ≤ 250 ms', () => {                        // ← umbral realista
    const payload = { type: 'EDGE_BCAST', ts: Date.now() };

    const t0 = performance.now();
    broadcast(payload);                                   // síncrono
    const elapsed = performance.now() - t0;

    expect(wss.clients.size).toBe(TOTAL_CLIENTS);
    expect(elapsed).toBeLessThan(250);
  });
});
