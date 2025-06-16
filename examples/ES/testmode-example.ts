/**
 * 🧩 Ejemplo 10: Uso de CacheDash en TEST MODE
 * ===========================================
 * Contexto:
 *   • En entornos de tests (Jest, Playwright, Vitest…) no queremos:
 *       –  Servidores WebSocket ni intervalos setInterval/setTimeout reales
 *       –  Conexión a Redis externa (salvo que la necesites explícitamente)
 *   • El flag  `testMode: true`  desactiva:
 *       –  Timers de monitorización
 *       –  Eventos WebSocket de broadcast
 *       –  Llamadas costosas al sistema operativo
 *
 * Este ejemplo muestra:
 *   1.  Crear instancias LOCAL y REDIS en modo test.
 *   2.  Ejecutar operaciones y comprobar Stats sin side‑effects.
 *   3.  Ejemplo de cómo integrarlo en una prueba Jest (pseudocódigo).
 */

import { CacheServiceCreate } from '../src';

/* -----------------------------------------------------------
 * 1. Instancias en modo TEST
 * --------------------------------------------------------- */
const localTestCache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 5,
  serviceIdentifier: 'TEST_LOCAL',
  testMode         : true          // Desactiva monitorización + timers
});

const redisTestCache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : 'redis://localhost:6379', // usa ioredis‑mock si lo prefieres
  defaultTTL       : 5,
  serviceIdentifier: 'TEST_REDIS',
  testMode         : true
});

/* -----------------------------------------------------------
 * 2. Operaciones rápidas sin side‑effects
 * --------------------------------------------------------- */
async function quickDemo() {
  await localTestCache.set('foo', 'bar');
  await redisTestCache.set('foo', 'bar');

  console.log('LOCAL get:', await localTestCache.get('foo')); // 'bar'
  console.log('REDIS get:', await redisTestCache.get('foo')); // 'bar'

  console.log('LOCAL stats:', localTestCache.getStats());
  console.log('REDIS stats:', redisTestCache.getStats());
}

/* -----------------------------------------------------------
 * 3. Ejemplo de integración con Jest (pseudo‑código)
 * --------------------------------------------------------- */
// describe('Cache tests', () => {
//   it('should cache value in LOCAL without timers', async () => {
//     const cache = CacheServiceCreate.create({ cacheType:'local', testMode:true });
//     await cache.set('k', 1);
//     expect(await cache.get('k')).toBe(1);
//   });
// });

quickDemo().catch(console.error);
