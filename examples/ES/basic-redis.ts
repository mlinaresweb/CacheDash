/**
 * 🧩 Ejemplo 2: Uso básico y progresivo de CacheDash con Redis
 * -------------------------------------------------------------------------
 * Este archivo enseña cómo integrar CacheDash con un servidor Redis,
 * usando variables de entorno para que el código funcione igual en
 * desarrollo local, contenedores, staging o producción.
 *
 * Variables de entorno admitidas (prioridad):
 *  1. REDIS_URL  → URL completa (p. ej. redis://user:pass@my‑host:6379/0)
 *  2. REDIS_HOST → Host (por defecto "127.0.0.1")
 *     REDIS_PORT → Puerto (por defecto "6379")
 *
 * Incluye:
 *   ✅ set() / get() con TTL por defecto y personalizado
 *   ✅ hasKey(), del(), flush()
 *   ✅ getStats() y getKeyStats()
 */

import { CacheServiceCreate } from '../src';

// Construir la URL de conexión a Redis de forma flexible
const redisUrl =
  process.env.REDIS_URL ||                               // 1º: URL completa
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:` +  // 2º: host + port
  `${process.env.REDIS_PORT || 6379}`;

// Crear instancia CacheDash con Redis
const cache = CacheServiceCreate.create({
  cacheType        : 'redis',
  redisOptions     : redisUrl,
  defaultTTL       : 20,              // TTL por defecto de 20 s
  serviceIdentifier: 'EXAMPLE_REDIS_2',
  enableMonitoring : true
});

async function main(): Promise<void> {
  // 📝 Guardar valores con TTL implícito y explícito
  await cache.set('redis:foo', 'bar');
  await cache.set('redis:number', 100);
  await cache.set('redis:ephemeral', 'temp', 5);   // TTL corto

  // 📥 Leer los valores
  console.log('[get] redis:foo:',     await cache.get('redis:foo'));
  console.log('[get] redis:number:',  await cache.get('redis:number'));

  // ⏱ Comprobar expiración de TTL corto
  console.log('[get] redis:ephemeral (antes):', await cache.get('redis:ephemeral'));
  await new Promise(r => setTimeout(r, 6000));
  console.log('[get] redis:ephemeral (después):', await cache.get('redis:ephemeral'));

  // 🔍 Verificar existencia con hasKey()
  console.log('[hasKey] redis:number?',    await cache.hasKey('redis:number'));
  console.log('[hasKey] redis:ephemeral?', await cache.hasKey('redis:ephemeral'));

  // 🧹 Borrar una clave y verificar
  await cache.del('redis:number');
  console.log('[get] redis:number (tras del):', await cache.get('redis:number'));

  // 🧼 flush(): eliminar toda la caché del servicio
  await cache.flush();
  console.log('[get] redis:foo (tras flush):', await cache.get('redis:foo'));

  // 📊 Ver estadísticas globales y por clave
  console.log('\n[Stats Globales]:', cache.getStats());
  const keyStats = cache.getKeyStats();
  if (keyStats) {
    console.log('\n[Stats por clave]:');
    for (const [key, stats] of keyStats.entries()) {
      console.log(` - ${key}:`, stats);
    }
  }
}

main().catch(console.error);
