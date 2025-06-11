// tests/unit/broadcast.spec.ts

// Primero deshacemos el mock de setupTests
jest.unmock('../../src/dashboard/webSockets/websocketServer');

import { wss, broadcast } from '../../src/dashboard/webSockets/websocketServer';

describe('WebSocket broadcast function', () => {
  it('should send data to all connected clients', () => {
    const mockClient1 = { readyState: 1, send: jest.fn(), OPEN: 1 };
    const mockClient2 = { readyState: 1, send: jest.fn(), OPEN: 1 };

    // Inyectamos nuestros mocks en wss.clients
    (wss.clients as Set<any>) = new Set([mockClient1, mockClient2]);

    broadcast({ foo: 'bar' });

    expect(mockClient1.send).toHaveBeenCalledWith(JSON.stringify({ foo: 'bar' }));
    expect(mockClient2.send).toHaveBeenCalledWith(JSON.stringify({ foo: 'bar' }));
  });
});
