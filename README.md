# Cache Dash

Cache Dash is a lightweight caching layer for Node.js and TypeScript that supports three strategies:

- **NONE** – no caching (pass‑through).
- **LOCAL** – in‑process cache powered by [node‑cache](https://www.npmjs.com/package/node-cache).
- **REDIS** – distributed cache backed by [ioredis](https://www.npmjs.com/package/ioredis).

## Features

* Typed API (`set`, `get`, `del`, `flush`, etc.).
* Per‑key or default TTL control.
* Real‑time, zero‑config monitoring dashboard served over Express + WebSocket.
* Pluggable design via dependency‑injection ([tsyringe](https://www.npmjs.com/package/tsyringe)).
* Zero overhead when monitoring is disabled.

## Installation

```bash
npm i cache-dash
```

## Quick start

```ts
import { CacheServiceCreate, CacheType } from 'cache-dash';

const cache = CacheServiceCreate.create({
  cacheType: CacheType.LOCAL,
  defaultTTL: 60,
  enableMonitoring: true
});

// Store data
await cache.set('foo', 'bar', 120);

// Retrieve data
const value = await cache.get<string>('foo'); // 'bar'

// Launch dashboard
cache.enableMonitoring(4000);
```

Open <http://localhost:4000/dashboard> to inspect your cache in real time.

## Examples

See the **examples** folder for ready‑to‑run snippets.

## Demo de uso completo

Después de clonar o descomprimir el repositorio:

```bash
npm install
npm run build
npm run example      # ejecuta examples/demo.ts con ts-node
# abre http://localhost:4000/dashboard para ver los cambios en directo
```
Este script añade, lee, actualiza e invalida claves para que puedas ver el flujo
completo en el dashboard y verificar los WebSockets.


> **Nota:** el servidor de monitorización expone el panel en el puerto **4000**.
> Si necesitas otro puerto:
> ```ts
> import { GlobalCacheStatsCollector } from 'cache-dash';
> GlobalCacheStatsCollector.getInstance().enableMonitoring(8081);
> ``` 
