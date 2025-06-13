// tests/integration/websocketServer.spec.ts
// -----------------------------------------
// Prueba de integración real sobre wss:8081
// -----------------------------------------

/* 1. Des‑mocks globales definidos en setupTests --------------------------- */
jest.unmock('ws');
jest.unmock('http');
jest.unmock('../../src/dashboard/webSockets/websocketServer');
jest.resetModules();                                // limpia el require‑cache

/* 2. Imports – ya con implementaciones reales ---------------------------- */
import WebSocket from 'ws';
import { once } from 'events';
import { wss, broadcast } from '../../src/dashboard/webSockets/websocketServer';

jest.setTimeout(15_000);

/* 3. Pequeños helpers ---------------------------------------------------- */
function connect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function waitMsg(ws: WebSocket): Promise<unknown> {
  return new Promise(res =>
    ws.once('message', data => res(JSON.parse(data.toString())))
  );
}

/* 4. Suite --------------------------------------------------------------- */
describe('integration › websocketServer.broadcast', () => {
  const WS_URL = 'ws://localhost:8081';
  let clientA: WebSocket;
  let clientB: WebSocket;

  /* 🟡 ANTES: esperabas el “connection” *después* de abrir sockets.
     🔵 AHORA: registramos los listeners primero, así no perdemos el evento. */
beforeAll(async () => {
  // 1️⃣  Pre‑registra los listeners de 'connection'
  const connA = once(wss, 'connection');
  const connB = once(wss, 'connection');

  // 2️⃣  Abre los clientes
  [clientA, clientB] = await Promise.all([
    connect(WS_URL),
    connect(WS_URL),
  ]);

  // 3️⃣  Espera a que el servidor procese ambas conexiones
  await Promise.all([connA, connB]);
});

  /* Cerramos limpio y esperamos a que el servidor confirme para
     evitar el “Cannot log after tests are done”. */
afterAll(async () => {
  /* 1⃣  Ordena a los clientes que se cierren */
  clientA.close();
  clientB.close();

  /* 2⃣  Espera a que el servidor procese el cierre de CADA WebSocket
         —ahí es donde se ejecuta console.log('Client disconnected')—       */
  await Promise.all(
    [...wss.clients].map(ws => once(ws, 'close'))   // ← lado servidor
  );

  /* 3⃣  Cierra el propio WebSocketServer y aguarda su callback */
  await new Promise<void>(res => wss.close(() => res()));
});


  it('broadcast reaches every connected client', async () => {
    const payload = { type: 'UPDATE_TEST', data: 'hello' };

    const pA = waitMsg(clientA);
    const pB = waitMsg(clientB);

    broadcast(payload);

    await expect(Promise.all([pA, pB])).resolves.toEqual([payload, payload]);
  });
});
