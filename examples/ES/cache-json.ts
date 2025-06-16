/****************************************************************************************
 * 📚 Ejemplo 3 (ES) – Cachear un JSON de API con CacheDash (LOCAL)
 * =====================================================================================
 * Snippet de referencia (NO ejecutable tal cual).  Demuestra cómo:
 *
 *   1.  Crear una instancia LOCAL con TTL amplio (60 s).
 *   2.  Guardar un objeto JSON como respuesta de API (`set`).
 *   3.  Leer ese JSON desde la caché (`get`).
 *   4.  Evitar una nueva llamada si aún existe (`hasKey`).
 *   5.  Invalidar la caché cuando la API publique nueva versión (`del` + nuevo `set`).
 *   6.  Consultar estadísticas globales y por clave (`getStats`, `getKeyStats`).
 *
 * Sustituye el bloque “productsJson” por tu `fetch/axios` real
 * y adapta la clave `DATA_KEY` al endpoint correspondiente.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancia LOCAL con TTL global = 60 s */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 60,
  serviceIdentifier: 'EXAMPLE_JSON_3',
  enableMonitoring : false
});

const DATA_KEY = 'api:/products/list';

/* 2️⃣  IIFE async para evitar top‑level await */
(async () => {

  /* Guardar JSON (simulación de respuesta API v1) */
  const productsJson = {
    version     : 'v1',
    generatedAt : new Date().toISOString(),
    items       : Array.from({ length: 1000 }, (_, i) => ({
      id   : i + 1,
      name : `Product #${i + 1}`,
      price: (Math.random() * 100).toFixed(2)
    }))
  };
  await cache.set(DATA_KEY, productsJson);              // TTL 60 s

  /* Consumir datos desde caché */
  const cached = await cache.get<typeof productsJson>(DATA_KEY);
  // → cached?.items.length, cached?.version …

  /* Evitar nueva llamada si la clave sigue viva */
  if (await cache.hasKey(DATA_KEY)) {
    // Usar el JSON cacheado
  } else {
    // Llamar de nuevo a la API y luego cache.set()
  }

  /* Invalidar manualmente al publicar la versión v2 */
  await cache.del(DATA_KEY);                            // invalida v1
  const productsJsonV2 = { ...productsJson, version: 'v2' };
  await cache.set(DATA_KEY, productsJsonV2);            // guarda v2

  /* Auditoría de estadísticas */
  const globalStats = cache.getStats();                 // hits, misses, size…
  const perKeyStats = cache.getKeyStats()?.get(DATA_KEY);

})();
