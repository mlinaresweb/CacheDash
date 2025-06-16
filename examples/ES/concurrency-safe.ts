/****************************************************************************************
 * 📚 Ejemplo 8 (ES) – Patrón Concurrency‑Safe (Double‑Check + In‑Flight Map)
 * ======================================================================================
 * Snippet de referencia — no pensado para ejecutarse “tal cual”.  Explica cómo
 * proteger un recurso costoso ante peticiones concurrentes usando sólo la API
 * pública de CacheDash.
 *
 * ✨ Problema
 *   • Cinco peticiones simultáneas solicitan la misma información pesada.
 *   • Si la clave no está en caché, cada una dispararía el cálculo ⇒ “dog‑pile”.
 *
 * 🛠 Solución
 *   1)  Mirar la caché (primer check).
 *   2)  Si no está, guardar la Promise en un **in‑flight map**.
 *   3)  Las peticiones siguientes esperan la misma Promise.
 *   4)  Al resolverse, guardamos el valor en CacheDash y eliminamos el in‑flight.
 *
 *   API usada:  get() · set() · hasKey() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* Instancia LOCAL con TTL global 15 s */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 15,
  serviceIdentifier: 'EXAMPLE_CONC_8',
  enableMonitoring : false
});

/* Mapa in‑flight  (clave → Promise) */
const inFlight = new Map<string, Promise<any>>();

/* Helper concurrency‑safe */
async function getOrLoad<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttl = 15
): Promise<T> {
  /* 1º check: caché */
  const cached = await cache.get<T>(key);
  if (cached !== undefined) return cached;

  /* 2º check: promesa en curso */
  if (inFlight.has(key)) return inFlight.get(key)!;

  /* Lanzamos loader y lo registramos como in‑flight */
  const promise = Promise.resolve(loader())
    .then(async result => {
      await cache.set(key, result, ttl); // Persistir en CacheDash
      return result;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/* Ejemplo de uso (5 peticiones concurrentes) — IIFE async para ilustrar */
(async () => {
  const KEY = 'heavy:99';

  const expensiveOp = async (id: number) => {
    // … lógica costosa: DB, IA, PDF …
    await new Promise(r => setTimeout(r, 300));
    return `VALUE_${id}_${Date.now()}`;
  };

  const concurrent = Array.from({ length: 5 }, () =>
    getOrLoad(KEY, () => expensiveOp(99))
  );

  const results = await Promise.all(concurrent);
  // -> los 5 resultados son idénticos; expensiveOp() sólo se ejecutó 1 vez

  const stats = cache.getStats(); // hits debería ser 4, misses 1
})();
