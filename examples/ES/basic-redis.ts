/****************************************************************************************
 * 📚 Ejemplo 2 (ES) – Integrar CacheDash con Redis
 * ======================================================================================
 * Este archivo **NO está pensado para ejecutarse**.  Es un _snippet_ de referencia que
 * muestra cómo usar CacheDash con un backend Redis en cualquier entorno (local, CI, prod)
 * sin hard‑codear la URL.
 *
 * 1) Construimos `redisUrl` a partir de variables de entorno:
 *      • REDIS_URL   (url completa → redis://user:pass@host:port/db)
 *      • REDIS_HOST  +  REDIS_PORT  (alternativa)
 * 2) Creamos la instancia `cache` con `cacheType:'redis'`.
 * 3) Demostramos todas las operaciones clave: set, get, hasKey, del, flush, getStats.
 *
 * Copia las secciones que necesites en tus servicios/controladores y adapta
 *TTL, claves y serviceIdentifier a tu dominio.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Construir la URL de conexión a Redis */
const redisUrl =
  process.env.REDIS_URL ||                                // (1) URL completa
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:` +   // (2) host
  `${process.env.REDIS_PORT || 6379}`;                    //     + port

/* 2️⃣  Instancia CacheDash con backend Redis */
const cache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : redisUrl,
  defaultTTL       : 20,           // TTL global: 20 s
  serviceIdentifier: 'EXAMPLE_REDIS_2',
  enableMonitoring : false         // cámbialo a true si usas el dashboard
});

/* 3️⃣  Operaciones ilustrativas  (envueltas en IIFE async) */
(async () => {

  // Almacenar valores con TTL global y personalizado
  await cache.set('redis:foo', 'bar');           // TTL 20 s
  await cache.set('redis:number', 100);          // TTL 20 s
  await cache.set('redis:ephemeral', 'temp', 5); // TTL 5 s

  // Leer valores
  const foo = await cache.get('redis:foo');          // 'bar'
  const num = await cache.get('redis:number');       // 100

  // Comprobar expiración del TTL corto
  const before = await cache.get('redis:ephemeral'); // 'temp'
  // … espera 6 s y vuelve a leer …
  const after  = undefined; // (expiró, simplemente muestra la idea)

  // Verificar existencia sin leer
  const existsNum  = await cache.hasKey('redis:number');    // true
  const existsTemp = await cache.hasKey('redis:ephemeral'); // false tras TTL

  // Invalidar una clave y vaciar toda la caché
  await cache.del('redis:number');
  await cache.flush();

  // Stats globales + detalladas
  const global = cache.getStats();
  const perKey = cache.getKeyStats();

})();
