/****************************************************************************************
 * 📚 Ejemplo 6 (ES) – Fallback inteligente LOCAL → REDIS
 * ======================================================================================
 * Fragmento de guía (no ejecutable tal cual).  Enseña a combinar dos instancias:
 *
 *   • `localCache`   → latencia ultra‑baja en memoria, TTL corto.
 *   • `redisCache`   → durabilidad entre pods, TTL más largo.
 *
 * Patrón:
 *   1)  Leer siempre de la caché LOCAL.             (HIT ➜ devolver)
 *   2)  Si falla, consultar Redis.                  (HIT ➜ “calentar” LOCAL)
 *   3)  Si tampoco existe, cargar del origen real,  escribir en ambas (write‑through).
 *
 * Métodos usados:  get() · set() · hasKey() · del() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancias */
const localCache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 5,   // TTL corto
  serviceIdentifier: 'LOCAL_FAST',
  enableMonitoring : false
});

const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const redisCache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : redisUrl,
  defaultTTL       : 30,  // TTL largo
  serviceIdentifier: 'REDIS_BACKING',
  enableMonitoring : false
});

/* 2️⃣  Helper getWithFallback() */
async function getWithFallback<T>(
  key: string,
  loader: () => Promise<T> | T,
  ttlLocal = 5,
  ttlRedis = 30
): Promise<T> {
  const hitLocal = await localCache.get<T>(key);
  if (hitLocal !== undefined) return hitLocal;

  const hitRedis = await redisCache.get<T>(key);
  if (hitRedis !== undefined) {
    await localCache.set(key, hitRedis, ttlLocal); // warming
    return hitRedis;
  }

  const fresh = await Promise.resolve(loader());   // origen real
  await localCache.set(key, fresh, ttlLocal);
  await redisCache.set(key, fresh, ttlRedis);
  return fresh;
}

/* 3️⃣  Ejemplo de uso (copiar dentro de tu servicio) */
(async () => {
  const KEY = 'user:42';

  const loadUserFromDB = async () =>
    ({ id: 42, name: 'User 42', loadedAt: Date.now() });

  const user = await getWithFallback(KEY, loadUserFromDB, 5, 30);
  // • Primer acceso → MISS / MISS → se consulta DB y se llenan ambas caches
  // • Acceso subsecuente (<5 s) → HIT local
  // • Tras 5 s pero <30 s       → MISS local, HIT redis, se recalienta local
})();
