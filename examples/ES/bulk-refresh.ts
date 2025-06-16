/**
 * 🧩 Ejemplo 9: Renovación masiva (bulk refresh) por prefijo
 * =========================================================
 * Escenario:
 *   ▸ Tenemos cientos/miles de claves `user:*` almacenadas.
 *   ▸ Llega una migración (o cambio de roles) y necesitamos:
 *       1.  Actualizar/consolidar la estructura de datos.
 *       2.  Prolongar su TTL sin tocar el resto de claves.
 *       3.  O, si no se pueden migrar, invalidarlas en lote.
 *
 * Demostramos:
 *   • Uso de getKeyStats() para localizar todas las claves user:*
 *   • Aplicar set() para “refrescar” TTL y estructura
 *   • Aplicar del() para las que no cumplan un criterio
 *   • Ver impacto en getStats() al final
 */

import { CacheServiceCreate } from '../src';

// Caché LOCAL con TTL por defecto 15 m
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 900,
  serviceIdentifier: 'EXAMPLE_BULK_9',
  enableMonitoring : false
});

/* ----------------------------------------------------------------- *
 * 1. Poblar la caché con datos “user:*” y otros prefijos
 * ----------------------------------------------------------------- */
async function seed() {
  await cache.set('user:1', { id: 1, role: 'guest' }, 300);
  await cache.set('user:2', { id: 2, role: 'member' }, 300);
  await cache.set('user:3', { id: 3, role: 'guest' }, 300);

  // Claves no relacionadas (deben quedar intactas)
  await cache.set('cfg:site', { ver: '1.0' }, 3600);
  await cache.set('session:xyz', { token: 'abc' }, 600);
}

/* ----------------------------------------------------------------- *
 * 2. Proceso de renovación masiva
 * ----------------------------------------------------------------- */
async function bulkRefreshUsers() {
  const keyStats = cache.getKeyStats();
  if (!keyStats) return;

  for (const [key, stats] of keyStats.entries()) {
    if (!key.startsWith('user:')) continue;            // Filtramos

    // A) Migramos estructura (añadimos campo updated)
    const current = await cache.get<any>(key);
    if (current) {
      const migrated = { ...current, updated: Date.now() };
      await cache.set(key, migrated, 900);             // Nuevo TTL 15 m
      console.log(`🆙  Refrescado ${key}`);
    } else {
      // B) Si no se pudo leer el valor, invalidamos la clave
      await cache.del(key);
      console.log(`🗑  Borrado ${key} (valor inaccesible)`);
    }
  }
}

/* ----------------------------------------------------------------- *
 * DEMO
 * ----------------------------------------------------------------- */
async function main() {
  await seed();

  console.log('\n📊  Stats antes de la renovación:', cache.getStats());

  await bulkRefreshUsers();

  console.log('\n📊  Stats después de la renovación:', cache.getStats());

  console.log('\n🔍  Verificamos que cfg:site y session:xyz sigan intactas:');
  console.log('cfg:site →', await cache.get('cfg:site'));
  console.log('session:xyz →', await cache.get('session:xyz'));
}

main().catch(console.error);
