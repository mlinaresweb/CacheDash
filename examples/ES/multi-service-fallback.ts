/**
 * 🧩 Ejemplo 6: Fallback inteligente LOCAL → REDIS
 * =================================================
 * Escenario típico en micro‑servicios:
 *
 *   1.  Tenemos **dos instancias de CacheDash**:
 *        • localCache  (memoria; latencia ultra‑baja)
 *        • redisCache  (durable; compartida entre pods)
 *   2.  Leemos SIEMPRE de la caché local primero.
 *   3.  Si falla → consultamos Redis.
 *   4.  Si Redis tiene el dato → “calentamos” la caché local.
 *   5.  Si tampoco está en Redis → lo calculamos y escribimos en ambos
 *      (patrón write‑through).
 *
 * Métodos API utilizados:
 *   get() · set() · hasKey() · del() · getStats()
 */

import { CacheServiceCreate } from '../src';

// ⚡️ Caché en memoria (TTL muy corto; p. ej. 5 s)
const localCache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 5,
  serviceIdentifier: 'LOCAL_FAST',
  enableMonitoring : false
});

// 🗄  Caché Redis (TTL más largo; p. ej. 30 s)
const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const redisCache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : redisUrl,
  defaultTTL       : 30,
  serviceIdentifier: 'REDIS_BACKING',
  enableMonitoring : false
});

/**
 * Helper: getWithFallback(key, loader, ttlLocal?, ttlRedis?)
 * ----------------------------------------------------------
 * • key         → clave a usar en ambos caches
 * • loader()    → función que devuelve el dato si no existe en ninguno
 * • ttlLocal    → TTL para la caché local (opcional)
 * • ttlRedis    → TTL para Redis          (opcional)
 */
async function getWithFallback<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttlLocal?: number,
  ttlRedis?: number
): Promise<T> {
  // 1. Intentar LOCAL
  const fromLocal = await localCache.get<T>(key);
  if (fromLocal !== undefined) {
    return fromLocal;
  }

  // 2. Intentar REDIS
  const fromRedis = await redisCache.get<T>(key);
  if (fromRedis !== undefined) {
    // “Calentamos” la caché local para la próxima vez
    await localCache.set(key, fromRedis, ttlLocal);
    return fromRedis;
  }

  // 3. No existe → lo calculamos y escribimos en ambas cachés
  const fresh = await Promise.resolve(loader());
  await localCache.set(key, fresh, ttlLocal);
  await redisCache.set(key, fresh, ttlRedis);
  return fresh;
}

/* ----------------------------------------------------------------- *
 * DEMO:  Obtener datos de “usuario 42” usando el patrón fallback
 * ----------------------------------------------------------------- */

/** Simulación de carga pesada de datos */
async function loadUserFromDB(id: number) {
  console.log('🔄  Cargando usuario desde origen real (DB)…');
  return { id, name: 'User 42', loadedAt: Date.now() };
}

async function demo() {
  const userKey = 'user:42';

  console.log('\n🍃  Primera llamada (MISS en ambas caches)…');
  const u1 = await getWithFallback(userKey, () => loadUserFromDB(42), 5, 30);
  console.log('Resultado:', u1);

  console.log('\n⚡  Segunda llamada (HIT en LOCAL)…');
  const u2 = await getWithFallback(userKey, () => loadUserFromDB(42), 5, 30);
  console.log('Resultado:', u2);

  // Esperar 6 s (expira LOCAL, persiste REDIS)
  await new Promise(r => setTimeout(r, 6000));

  console.log('\n🗄  Tercera llamada (MISS local, HIT redis)…');
  const u3 = await getWithFallback(userKey, () => loadUserFromDB(42), 5, 30);
  console.log('Resultado:', u3);

  /* -----------------------------------------------------------
   * Stats comparativas de ambos servicios
   * --------------------------------------------------------- */
  console.log('\n📊  Stats LOCAL:', localCache.getStats());
  console.log('📊  Stats REDIS:', redisCache.getStats());
}

demo().catch(console.error);
