/****************************************************************************************
 * 📚 Ejemplo 10 (ES) – Uso de CacheDash en TEST MODE
 * ======================================================================================
 * Este snippet sirve como **plantilla para pruebas unitarias**; no está pensado
 * para ejecutarse como script independiente.
 *
 * 💡 ¿Por qué `testMode: true`?
 *   • Desactiva WebSockets y timers internos ⇒ pruebas más rápidas y estables.
 *   • Evita llamadas de E/S costosas (ideal en CI).
 *
 * Contenido:
 *   1.  Crear instancias LOCAL y (opcional) “REDIS” en modo test.
 *   2.  Operaciones de ejemplo sin side‑effects (set / get / stats).
 *   3.  Pseudocódigo de integración con Jest.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancias en TEST MODE */
const localTestCache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 5,
  serviceIdentifier: 'TEST_LOCAL',
  testMode         : true               // WebSockets y timers OFF
});

const redisTestCache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : 'redis://localhost:6379', // o ioredis‑mock
  defaultTTL       : 5,
  serviceIdentifier: 'TEST_REDIS',
  testMode         : true
});

/* 2️⃣  Operaciones ilustrativas (IIFE async) */
(async () => {
  await localTestCache.set('foo', 'bar');
  await redisTestCache.set('foo', 'bar');

  const l = await localTestCache.get('foo');  // 'bar'
  const r = await redisTestCache.get('foo');  // 'bar'

  const lStats = localTestCache.getStats();
  const rStats = redisTestCache.getStats();

  // Usa las variables l, r, lStats, rStats en tus aserciones
})();

/* 3️⃣  Integración con Jest (ejemplo) */
// describe('CacheDash in test mode', () => {
//   it('should store and retrieve values without side effects', async () => {
//     const cache = CacheServiceCreate.create({ cacheType:'local', testMode:true });
//     await cache.set('key', 42);
//     expect(await cache.get('key')).toBe(42);
//   });
// });
