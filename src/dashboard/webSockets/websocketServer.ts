// websocketServer.ts
import { Server } from 'ws';

// Exportamos wss para poder inyectarlo en los tests
export const wss = new Server({ port: 8081 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

export function broadcast(data: any) {
    wss.clients.forEach((client: any) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
