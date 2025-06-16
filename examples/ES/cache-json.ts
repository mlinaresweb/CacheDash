/**
 * 🧩 Ejemplo 3: Cachear objetos JSON de una API con CacheDash (LOCAL)
 * ------------------------------------------------------------------
 * Paso a paso:
 *   1. Crear instancia LOCAL con TTL amplio (p. ej. 60 s)
 *   2. set() de un JSON (simula respuesta de API)
 *   3. get() para consumir el JSON desde caché
 *   4. hasKey() para saber si hay que volver a pedir la API
 *   5. del() para invalidar la respuesta cuando cambie la versión
 *   6. Inspeccionar estadísticas de tamaño y accesos
 *
 * NOTA:  En un proyecto real el JSON vendría de `fetch()` / `axios.get()`.
 *         Aquí lo asignamos directamente para centrarnos en el uso de la API.
 */

import { CacheServiceCreate } from '../src';

const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 60,                  // TTL “amplio” para datos de API
  serviceIdentifier: 'EXAMPLE_JSON_3',
  enableMonitoring : false
});

// 🔹 Clave que usaremos para el JSON
const DATA_KEY = 'api:/products/list';

async function main(): Promise<void> {
  /* -----------------------------------------------------------
   * 1. Simular que “traemos” un JSON de una API externa.
   *    (En producción esto sería fetch/axios y luego cache.set)
   * --------------------------------------------------------- */
  const productsJson = {
    version: 'v1',
    generatedAt: new Date().toISOString(),
    items: Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Product #${i + 1}`,
      price: (Math.random() * 100).toFixed(2)
    }))
  };

  // Guardar la respuesta JSON con TTL (aquí usamos el TTL global = 60 s)
  await cache.set(DATA_KEY, productsJson);

  /* -----------------------------------------------------------
   * 2. Consumir los datos desde caché
   * --------------------------------------------------------- */
  const cachedProducts = await cache.get<typeof productsJson>(DATA_KEY);
  console.log('📦 Productos obtenidos desde caché:', {
    version: cachedProducts?.version,
    items: cachedProducts?.items.length
  });

  /* -----------------------------------------------------------
   * 3. Evitar llamada a la API si los datos siguen vigentes
   * --------------------------------------------------------- */
  if (await cache.hasKey(DATA_KEY)) {
    console.log('✅ Usamos caché – no llamamos a la API');
  } else {
    console.log('🚀 Cache MISS – sería momento de pedir a la API de nuevo');
  }

  /* -----------------------------------------------------------
   * 4. Invalidar manualmente cuando la API cambie de versión
   * --------------------------------------------------------- */
  console.log('\\n🔄 Supongamos que la API publica “v2”…');
  await cache.del(DATA_KEY);                       // invalidamos caché v1
  console.log('¿Existe la clave tras del()? →', await cache.hasKey(DATA_KEY)); // false

  // Guardar la nueva versión
  const productsJsonV2 = { ...productsJson, version: 'v2' };
  await cache.set(DATA_KEY, productsJsonV2);
  console.log('🆕 Guardada versión v2; ahora existe:', await cache.hasKey(DATA_KEY));

  /* -----------------------------------------------------------
   * 5. Estadísticas para auditar tamaño y uso
   * --------------------------------------------------------- */
  console.log('\\n📊 Stats globales:', cache.getStats());

  const keyStats = cache.getKeyStats();
  if (keyStats?.has(DATA_KEY)) {
    console.log('📌 Stats de la clave JSON:', keyStats.get(DATA_KEY));
  }
}

main().catch(console.error);
