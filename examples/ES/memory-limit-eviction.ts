/**
 * 🧩 Ejemplo 7: Límite de memoria y expulsión automática (LOCAL)
 * ==============================================================
 * Objetivo:
 *   • Configurar `maxMemorySizeMB` para la instancia LOCAL.
 *   • Observar cómo CacheDash va expulsando (evicting) claves
 *     menos usadas cuando se supera el umbral.
 *   • Ver estadísticas de cuántas claves y bytes se han desalojado.
 *
 * Nota:  Este ejemplo funciona en memoria únicamente.  Redis gestiona
 *        sus límites con políticas internas.  Aquí mostramos la
 *        característica exclusiva del backend LOCAL de CacheDash.
 */

import { CacheServiceCreate } from '../src';

// Definimos un límite deliberadamente bajo (2 MB)
const MAX_MB = 2;

const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 0,                // sin expiración por TTL
  maxMemorySizeMB  : MAX_MB,
  serviceIdentifier: 'EXAMPLE_EVICT_7',
  enableMonitoring : false
});

// Helper para crear un objeto ~0.5 MB
function generateBigObject(i: number) {
  return { id: i, blob: 'x'.repeat(512 * 1024) }; // 512 KB aprox.
}

async function main() {
  console.log(`🚦  Límite de memoria LOCAL: ${MAX_MB} MB\n`);

  // 1. Insertamos 6 objetos de 0.5 MB cada uno (≈ 3 MB totales)
  for (let i = 1; i <= 6; i++) {
    await cache.set(`big:${i}`, generateBigObject(i));
    console.log(`✅ set('big:${i}') — tamaño aproximado ${(i * 0.5).toFixed(1)} MB`);
  }

  console.log('\n📊 Stats globales después de insertar 6 objetos:');
  console.log(cache.getStats());

  // 2. Revisamos qué claves sobreviven
  const survivors: string[] = [];
  const keyStats = cache.getKeyStats();
  if (keyStats) {
    for (const key of keyStats.keys()) {
      survivors.push(key);
    }
  }

  console.log('\n🔍  Claves existentes tras la expulsión automática:');
  console.log(survivors.length ? survivors.join(', ') : '(ninguna)');

  // 3. Demostramos que los objetos expulsados ya no están accesibles
  for (let i = 1; i <= 6; i++) {
    const exists = await cache.hasKey(`big:${i}`);
    console.log(`¿Existe big:${i}? →`, exists);
  }

  console.log('\n📉  Stats finales (evictions, size, keys):');
  console.log(cache.getStats());
}

main().catch(console.error);
