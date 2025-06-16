/**
 * 🧩 Ejemplo 8: Patron Concurrency‑Safe (Double‑Check + In‑Flight Map)
 * ===================================================================
 * Problema real:
 *   ▸ Varias peticiones simultáneas piden el mismo recurso costoso.
 *   ▸ Si la clave no existe aún en caché, cada petición dispara
 *     la operación cara ⇒ “dog‑pile effect”.
 *
 * Solución:
 *   ▸ 1)  Comprobamos la caché (primer check).
 *   ▸ 2)  Si no hay dato, almacenamos una promesa en un mapa “in‑flight”
 *         para que el resto de peticiones esperen a ese mismo resultado.
 *   ▸ 3)  Cuando la promesa se resuelve, se guarda en CacheDash y
 *         se elimina del mapa.
 *
 * API empleada:  get() · set() · hasKey() · getStats()
 */

import { CacheServiceCreate } from '../src';

// Caché LOCAL con TTL de 15 s
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 15,
  serviceIdentifier: 'EXAMPLE_CONC_8',
  enableMonitoring : false
});

// ▸ Mapa para promesas en curso (clave → Promise)
const inFlight = new Map<string, Promise<any>>();

/* ----------------------------------------------------------------- *
 * 1. Helper concurrency‑safe
 * ----------------------------------------------------------------- */
async function getOrLoad<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttl = 15
): Promise<T> {
  /* Primer check (caché) */
  const cached = await cache.get<T>(key);
  if (cached !== undefined) return cached;

  /* Segundo check (promesa en curso) */
  if (inFlight.has(key)) {
    return inFlight.get(key)!; // Espera la misma promesa
  }

  /* No hay nada: lanzamos loader(), guardamos promesa y continuamos */
  const promise = Promise.resolve(loader())
    .then(async value => {
      await cache.set(key, value, ttl); // Escribir en CacheDash
      return value;
    })
    .finally(() => {
      inFlight.delete(key);             // Limpiar mapa
    });

  inFlight.set(key, promise);
  return promise;
}

/* ----------------------------------------------------------------- *
 * 2. Demonstación con carga “costosa” y peticiones concurrentes
 * ----------------------------------------------------------------- */
async function expensiveOp(id: number): Promise<string> {
  console.log(`⏳  Generando recurso costoso para id=${id}…`);
  await new Promise(r => setTimeout(r, 300)); // Simula latencia
  return `VALUE_${id}_${Date.now()}`;
}

async function demoConcurrency() {
  const KEY = 'heavy:99';

  // Lanzamos 5 peticiones concurrentes
  console.log('\n🚀  Lanzando 5 peticiones concurrentes al mismo recurso…');
  const promises = Array.from({ length: 5 }, () =>
    getOrLoad(KEY, () => expensiveOp(99))
  );

  const results = await Promise.all(promises);
  console.log('Resultados:', results);

  // Todas deberían ser idénticas y haber ejecutado expensiveOp solo una vez
  console.log('\n🏁  Stats finales:', cache.getStats());
}

demoConcurrency().catch(console.error);
