/****************************************************************************************
 * 🧩 Ejemplo Avanzado (ES) – Orquestación Multi‑Nivel con CacheDash
 * ======================================================================================
 * Snippet documental — NO ejecutable tal cual.  Reúne las técnicas más avanzadas:
 *
 *   • Tres niveles de caché simultáneos
 *       L1  localFast   → TTL 3 s   (memoria, latencia mínima)
 *       L2  localLarge  → TTL 30 s  (memoria 64 MB, evictions)
 *       L3  redisShared → TTL 300 s (Redis, duradero)
 *   • Cascada  L1 → L2 → L3 → loader()
 *   • Estrategia *stale‑while‑revalidate* (sirve “stale”, refresca en BG).
 *   • Mapa in‑flight global antiperros (dog‑pile).
 *   • Métricas agregadas de los tres servicios.
 *
 * Métodos API usados:  create() · get()/set() · hasKey() · getStats() · flush()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancias L1/L2/L3 */
const localFast = CacheServiceCreate.create({ cacheType:'local', defaultTTL:3,  serviceIdentifier:'L1_FAST'  });
const localLarge = CacheServiceCreate.create({ cacheType:'local', defaultTTL:30, maxMemorySizeMB:64, serviceIdentifier:'L2_LARGE' });
const redisShared = CacheServiceCreate.create({
  cacheType:'redis',
  redisOptions: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST||'127.0.0.1'}:${process.env.REDIS_PORT||6379}`,
  defaultTTL:300,
  serviceIdentifier:'L3_REDIS'
});

/* 2️⃣  In‑flight map para concurrencia */
const inFlight = new Map<string, Promise<any>>();

/* 3️⃣  getSmart() – fallback completo L1→L3 + write‑through */
async function getSmart<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttlL1 = 3, ttlL2 = 30, ttlL3 = 300
): Promise<T> {
  const hitL1 = await localFast.get<T>(key);
  if (hitL1 !== undefined) return hitL1;

  const hitL2 = await localLarge.get<T>(key);
  if (hitL2 !== undefined) {
    await localFast.set(key, hitL2, ttlL1);
    return hitL2;
  }

  const hitL3 = await redisShared.get<T>(key);
  if (hitL3 !== undefined) {
    await localFast.set(key, hitL3, ttlL1);
    await localLarge.set(key, hitL3, ttlL2);
    return hitL3;
  }

  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = Promise.resolve(loader()).then(async res => {
    await localFast.set(key, res, ttlL1);
    await localLarge.set(key, res, ttlL2);
    await redisShared.set(key, res, ttlL3);
    return res;
  }).finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/* 4️⃣  getSWR() – patrón stale‑while‑revalidate */
async function getSWR<T>(key: string, freshTTL: number, loader: () => Promise<T> | T): Promise<T> {
  const stale = await localFast.get<T>(key);
  if (stale !== undefined) {
    const remaining = (await localFast.getKeyStats()?.get(key))?.ttl ?? freshTTL;
    if (remaining < freshTTL / 2) void getSmart(key, loader, freshTTL); // refresh en BG
    return stale;
  }
  return getSmart(key, loader, freshTTL);
}

/* 5️⃣  Métricas combinadas */
function mergedStats() {
  const a = localFast.getStats();
  const b = localLarge.getStats();
  const c = redisShared.getStats();
  return {
    hits: a.hits + b.hits + c.hits,
    misses: a.misses + b.misses + c.misses,
    sizeMB: (a.size + b.size + c.size) / (1024 * 1024),
    evictions: a.evictions + b.evictions
  };
}

/* 6️⃣  Ejemplo de uso (IIFE) */
(async () => {
  const KEY = 'analytics:dashboard';
  const heavyLoader = async () => ({ ts: Date.now(), rows: 999 });

  await getSmart(KEY, heavyLoader);   // primer fill
  await getSWR(KEY, 5, heavyLoader);  // patrón SWR

  const all = mergedStats();          // métricas globales
})();
