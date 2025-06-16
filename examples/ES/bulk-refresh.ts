/****************************************************************************************
 * 📚 Ejemplo 9 (ES) – Renovación masiva por prefijo  user:*
 * ======================================================================================
 * Este snippet **no se ejecuta tal cual**.  Sirve de guía para:
 *
 *   • Iterar todas las claves `user:*` mediante  getKeyStats().
 *   • “Migrar” su estructura y prolongar TTL (set con nuevo objeto + 900 s).
 *   • Borrar en lote (del) las que no puedan migrarse.
 *   • Ver el impacto antes/después con  getStats().
 *
 * Copia sólo el bloque que necesites en tu servicio o script de mantenimiento.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancia LOCAL con TTL por defecto = 15 min */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 900,
  serviceIdentifier: 'EXAMPLE_BULK_9',
  enableMonitoring : false
});

/* 2️⃣  Poblado inicial (opcional) */
(async () => {
  await cache.set('user:1', { id: 1, role: 'guest' }, 300);
  await cache.set('user:2', { id: 2, role: 'member' }, 300);
  await cache.set('user:3', { id: 3, role: 'guest' }, 300);

  await cache.set('cfg:site',    { ver: '1.0' }, 3600);
  await cache.set('session:xyz', { token:'abc' }, 600);
})();

/* 3️⃣  Renovación masiva */
async function bulkRefreshUsers() {
  const statsMap = cache.getKeyStats();
  if (!statsMap) return;

  for (const [key] of statsMap.entries()) {
    if (!key.startsWith('user:')) continue;

    const current = await cache.get<Record<string, any>>(key);
    if (current) {
      const migrated = { ...current, updated: Date.now() };
      await cache.set(key, migrated, 900);          // TTL 15 min
    } else {
      await cache.del(key);                         // valor ilegible → borrar
    }
  }
}

/* 4️⃣  Uso típico en un script de mantenimiento */
(async () => {
  console.log('Stats antes:', cache.getStats());

  await bulkRefreshUsers();

  console.log('Stats después:', cache.getStats());
  console.log('cfg:site intacta?',    await cache.hasKey('cfg:site'));
  console.log('session:xyz intacta?', await cache.hasKey('session:xyz'));
})();
