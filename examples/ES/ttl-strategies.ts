/**
 * 🧩 Ejemplo 5: Estrategias de TTL e invalidación con CacheDash
 * ============================================================
 * Objetivo:
 *   • Asignar TTL diferente según la naturaleza del dato
 *   • Renovar datos “críticos” sin reiniciar todo
 *   • Decidir entre  del()  y  flush()  en situaciones reales
 *   • Medir impacto en las estadísticas
 *
 * API usada:
 *   get() · set() · del() · flush() · getStats() · hasKey()
 */

import { CacheServiceCreate } from '../src';

// Instancia LOCAL con TTL global *corto* (fallback)
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 10,     // fallback de 10 s
  serviceIdentifier: 'EXAMPLE_TTL_5',
  enableMonitoring : false
});

/* Utilidades de ayuda —solo para este ejemplo */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  /* -----------------------------------------------------------------
   * 1. Guardamos tres tipos de datos con TTLs distintos
   * ----------------------------------------------------------------- */

  // A) Configuración que casi nunca cambia → TTL largo (1h)
  await cache.set('cfg:site', { theme: 'dark', ver: '1.1' }, 3600);

  // B) Datos de usuario en sesión → TTL medio (15 min)
  await cache.set('session:user:42', { lastActive: Date.now() }, 900);

  // C) Resultado de búsqueda muy dinámico → TTL muy corto (30 s)
  await cache.set('search:q=shoes', ['shoe‑1', 'shoe‑2'], 30);

  console.log('\n⏳ Datos almacenados con TTLs personalizados.');
  console.log(cache.getStats());

  /* -----------------------------------------------------------------
   * 2. Simulamos paso del tiempo y renovamos sólo lo necesario
   * ----------------------------------------------------------------- */
  console.log('\n…esperando 35 s para que expire la búsqueda…');
  await sleep(35_000);

  // Verificamos qué sigue vivo
  console.log('cfg viva?',      await cache.hasKey('cfg:site'));        // true
  console.log('session viva?',  await cache.hasKey('session:user:42')); // true
  console.log('search viva?',   await cache.hasKey('search:q=shoes'));  // false

  // Renovamos sólo la búsqueda (no toca flush global)
  await cache.set('search:q=shoes', ['shoe‑3', 'shoe‑4'], 30);
  console.log('🔄 Búsqueda renovada.\n');

  /* -----------------------------------------------------------------
   * 3. Cambia la versión del sitio → invalidamos la configuración
   * ----------------------------------------------------------------- */
  await cache.del('cfg:site');                               // del() puntual
  await cache.set('cfg:site', { theme: 'light', ver: '1.2' }, 3600);
  console.log('⚙️  Config actualizada.\n');

  /* -----------------------------------------------------------------
   * 4. Mantenimiento programado → flush() total
   * ----------------------------------------------------------------- */
  console.log('🧹  Realizamos flush() global por mantenimiento…');
  await cache.flush();

  console.log('\n📊  Stats después de flush():', cache.getStats());
  console.log('cfg existe?',      await cache.hasKey('cfg:site'));
  console.log('session existe?',  await cache.hasKey('session:user:42'));
  console.log('search existe?',   await cache.hasKey('search:q=shoes'));
}

main().catch(console.error);
