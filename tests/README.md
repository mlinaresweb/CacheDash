# 🧪 CacheDash Tests — Contributor Guide  
*(English first · Español después)*  

---

## 📖 1. Test Pyramid & Folder Layout (EN)

| Layer | Folder / Pattern | Runner & Config | Purpose |
|-------|------------------|-----------------|---------|
| **UNIT** | `tests/unit/**/*.spec.ts` | `jest` · **`jest.config.ts`** | Micro‑fast, fully mocked. Generates coverage. |
| **INTEGRATION** | `tests/integration/**/*.spec.ts` | _Same Jest config_ | Touch multiple modules together (still mocked network/IO). |
| **EDGE / STRESS** | `tests/edge/**/*.spec.ts` | `jest --config jest.edge.config.ts` | Heavy loops, memory‑limit checks, one worker, no coverage. |
| **A2E (App‑to‑End)** | `tests/a2e/**/*.{spec,test}.ts` | `playwright test` · **`playwright.config.ts`** | Boot real dashboard + WS and drive a headless browser. |

**Folder map**

```
tests/
├── unit/          # smallest units
├── integration/   # across‑module flows
├── edge/          # stress / long‑running
└── a2e/           # Playwright suites
```

---

## 🚀 2. Running the suites (EN)

```bash
# 2.1  Unit + Integration   (default, < 2 s)
npm test               # or npx jest

# 2.2  Edge / Stress     (long, single thread)
npx jest --config jest.edge.config.ts

# 2.3  A2E (Playwright)  (HTML report)
npx playwright test
```

> **Tip:** Edge & A2E suites are **skipped in CI** unless the job sets  
> `RUN_EDGE_TESTS=true` or `RUN_A2E=true`.

---

## 🛠 3. Global mocks for Jest

`setupTests.ts` auto‑loads for unit + integration runs and provides:

| # | Mocked item | Reason |
|---|-------------|--------|
| 1 | `console.log` | Keep CI logs clean |
| 2 | `setInterval` | Prevent open handles |
| 3 | `ws` | No real WebSocket server |
| 4 | `express` & `Router` | Stub HTTP routes |
| 5 | `http.createServer` | Avoid port binding |
| 6 | `dashboardRoutes` | NOP middleware |
| 7 | `websocketServer.broadcast*` | Silence WS chatter |
| 8 | `ioredis` → `ioredis‑mock` (+ `.config`, `.psubscribe` stubs) | Zero external Redis |

Add new stubs here whenever your code pulls heavy dependencies.

---

## ✍️ 4. Creating new tests

### 4.1  Unit

1. Place file in `tests/unit/` ending with `*.spec.ts`.  
2. Import only the **public API** (`cache-dash`).  
3. Instantiate caches with `testMode: true`.  
4. Keep runtime under **50 ms**.

### 4.2  Integration

* Folder: `tests/integration/`  
* May spin multiple cache instances, still mocked network.  
* Use same guidelines as unit, but can be <200 ms.

### 4.3  Edge

* Folder: `tests/edge/`  
* Uses **`jest.edge.config.ts`** → `maxWorkers: 1`, real timers allowed.

### 4.4  A2E (Playwright)

* Folder: `tests/a2e/`  
* `global-setup.ts` starts the dashboard on a free port, writes `baseURL`.  
* Use Playwright fixtures to assert UI + WS traffic.

---

## 📊 5. Coverage

Default Jest run outputs **`coverage/`** (Istanbul).  
Edge & A2E suites **do not** generate coverage.

```
npm run coverage   # alias for npx jest --coverage
```

---

## 🤝 6. Contributing Workflow

1. **Red → Green**: write failing spec first.  
2. Mock external I/O in `setupTests.ts` if needed.  
3. For new edge cases, add a spec under `tests/edge/`.  
4. If the test is interactive/browser, place it in `tests/a2e/`.

Submit PR with:

* `npm test` green  
* No new open‑handle warnings  
* Coverage ≥ previous baseline

---

# 🧪 Guía de Tests — **CacheDash**

Este documento explica **cómo están organizados** los tests del proyecto,
**cómo ejecutarlos** y **cómo contribuir** añadiendo casos nuevos.

---

## 1. Pirámide de tests & estructura de carpetas

| Capa | Carpeta / patrón | Runner & configuración | Propósito |
|------|------------------|------------------------|-----------|
| **UNIT** | `tests/unit/**/*.spec.ts` | `jest` · `jest.config.ts` | Prueban funciones o clases aisladas. <br>Mockean toda E/S (WebSocket, Express, Redis…). |
| **INTEGRACIÓN** | `tests/integration/**/*.spec.ts` | _Misma config Jest_ | Combina varios módulos públicos (sin tocar red/disco reales). |
| **EDGE / STRESS** | `tests/edge/**/*.spec.ts` | `jest --config jest.edge.config.ts` | Bucles pesados & límites de memoria/TTL. 1 worker, sin coverage. |
| **A2E (App‑to‑End)** | `tests/a2e/**/*.(spec|test).ts` | `playwright test` · `playwright.config.ts` | Levanta dashboard real + WebSockets y lo prueba con navegador. |

```
tests/
├── unit/          # pruebas unitarias
├── integration/   # flujos entre módulos
├── edge/          # estrés / larga duración
└── a2e/           # suites Playwright
```

---

## 2. Cómo ejecutar las suites

```bash
# 2.1  Unit + Integración  (rápido, < 2 s)
npm test                    # o npx jest

# 2.2  Edge / Stress  (lento, un solo hilo)
npx jest --config jest.edge.config.ts

# 2.3  A2E (Playwright)  (genera reporte HTML)
npx playwright test
```

> **Consejo:** Los jobs de CI suelen saltarse Edge y A2E salvo que la build
> defina `RUN_EDGE_TESTS=true` o `RUN_A2E=true`.

---

## 3. Mocks globales (`setupTests.ts`)

Al arrancar Jest (unit + integración) se carga `setupTests.ts`, que:

| # | Qué se mockea | Por qué |
|---|---------------|---------|
| 1 | `console.log` | Mantener la salida de CI limpia. |
| 2 | `setInterval` | Evitar _open handles_ al cerrar Jest. |
| 3 | `ws` (`WebSocketServer`) | No usar sockets reales. |
| 4 | `express` & `Router` | Stub HTTP sin puertos. |
| 5 | `http.createServer` | Sin binding de puertos. |
| 6 | `dashboardRoutes` | Middleware NOP. |
| 7 | `websocketServer.broadcast*` | Silenciar tráfico WS. |
| 8 | `ioredis` → `ioredis‑mock` (+ `.config`, `.psubscribe`) | Cero Redis externo. |

Si tu nuevo test requiere otra librería pesada, **añade el stub aquí**.

---

## 4. Cómo crear tests nuevos

### 4.1  Unit

1. Archivo en `tests/unit/` con sufijo `*.spec.ts`.  
2. Importa **solo la API pública** (`cache-dash`).  
3. Crea instancias con `testMode: true`.  
4. Mantén la prueba por debajo de **50 ms**.

```ts
// tests/unit/cache-basic.spec.ts
import { CacheServiceCreate } from 'cache-dash';

describe('Cache básico', () => {
  it('guarda y lee valores', async () => {
    const cache = CacheServiceCreate.create({ testMode: true });
    await cache.set('k', 42);
    expect(await cache.get('k')).toBe(42);
  });
});
```

### 4.2  Integración

* Carpeta: `tests/integration/`  
* Pruebas que combinan varios servicios de la librería.  
* Tiempo objetivo: < 200 ms por `it`.

### 4.3  Edge / Stress

* Carpeta: `tests/edge/`  
* Usa `jest.edge.config.ts` → `maxWorkers: 1`, detecta open‑handles.  
* Ideal para pruebas de límite de memoria o TTL largos.

### 4.4  A2E (Playwright)

* Carpeta: `tests/a2e/`  
* `global-setup.ts` arranca el dashboard en un puerto libre y lo expone vía `process.env.BASE_URL`.  
* Utiliza fixtures Playwright (`page`) para comprobar DOM, WS y métricas.

---

## 5. Cobertura de código

Los tests Unit + Integración generan **`coverage/`** (Istanbul):

```bash
npm run coverage   # alias de npx jest --coverage
```

Edge y A2E **no** producen cobertura (demasiado costoso).

---

## 6. Flujo de contribución

1. Crea el test *(rojo)* en la carpeta adecuada.  
2. Mockea dependencias en `setupTests.ts` si es preciso.  
3. Asegúrate de que `npm test` pasa sin _open handles_.  
4. Mantén la cobertura ≥ baseline anterior.  
5. Abre tu Pull Request. ✨

---

## 7. Solución de problemas

| Síntoma | Posible solución |
|---------|------------------|
| **“open handles”** al terminar Jest | Añade el handle a los mocks de `setupTests.ts`. |
| **Puerto 3000 en uso** en Playwright | Usa el puerto aleatorio que crea `global-setup`. Evita hard‑codear URLs. |
| **Timeout en Edge** | Reduce dataset o itera menos; ejecuta con `DEBUG=cachedash:*` para ver cuellos. |

---

¡Felices tests y feliz caching! 🚀
