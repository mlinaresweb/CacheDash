/**
 * 📚 Ejemplo 1 (ES)
 * =================
 * Demuestra TODAS las operaciones básicas de la API pública de CacheDash
 * cuando se trabaja con caché en memoria (`cacheType: 'local'`).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Escenario imaginado:
 *   • Necesitas cachear valores simples (string, number, objetos pequeños).
 *   • Quieres TTL por defecto (10 s) y TTL específico para algunas claves.
 *   • Necesitas saber si una clave existe sin leerla (“hasKey”).
 *   • Debes invalidar claves (del) o limpiar todo (flush) bajo demanda.
 *   • Deseas consultar métricas globales y por clave para debugging.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ✨ Pasos ilustrados en este archivo
 *   1) Crear una instancia LOCAL con TTL global.
 *   2) Guardar claves con y sin TTL personalizado.
 *   3) Leer valores y observar la expiración automática.
 *   4) Verificar existencia con hasKey().
 *   5) Invalidar con del() y flush().
 *   6) Obtener estadísticas globales y por clave.
 * 
 * Nota:  Este archivo NO está pensado para ejecutarse tal cual.
 *        Copia los fragmentos que necesites dentro de tu propia app
 *        (servicios, controladores, etc.) y adapta las claves/TTL.
 */

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Crear instancia LOCAL */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',     // backend en memoria
  defaultTTL       : 10,          // TTL global (segundos)
  serviceIdentifier: 'EXAMPLE_LOCAL_1',
  enableMonitoring : false        // pon true si luego activas el dashboard
});

(async () => {

/* 2️⃣  set(): guardar valores */
await cache.set('foo', 'bar');        // TTL = 10 s (global)
await cache.set('count', 123);        // TTL = 10 s
await cache.set('token', 'abc123', 5); // TTL específico de 5 s

/* 3️⃣  get(): leer valores (antes/después de expirar) */
const foo1 = await cache.get('foo');   // 'bar'
const tok1 = await cache.get('token'); // 'abc123'
// … espera 6 s y repite …
const tok2 = await cache.get('token'); // undefined (expiró)

/* 4️⃣  hasKey(): comprobar existencia sin leer */
const fooExists  = await cache.hasKey('foo');   // true
const tokenAlive = await cache.hasKey('token'); // false

/* 5️⃣  del() y flush() */
await cache.del('foo');   // invalida solo 'foo'
await cache.flush();      // vacía toda la caché

/* 6️⃣  Métricas */
const globalStats = cache.getStats();   // hits, misses, keys, size, …
const perKeyStats = cache.getKeyStats(); // Map<key, KeyStats>

})();