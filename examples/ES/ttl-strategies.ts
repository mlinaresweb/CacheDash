/****************************************************************************************
 * 📚 Ejemplo 5 (ES) – Estrategias de TTL e invalidación selectiva/global
 * =====================================================================================
 * Fragmento explicativo (NO se ejecuta tal cual).  Muestra cómo:
 *
 *   • Asignar TTL distinto según el tipo de dato:
 *        cfg:*       → 3600 s  (1 h)
 *        session:*   →  900 s  (15 min)
 *        search:*    →   30 s
 *   • Renovar sólo la parte “search:*” cuando expira (sin flush global).
 *   • Invalidar una clave puntual (`del`) tras un cambio de versión.
 *   • Hacer flush() total por mantenimiento.
 *   • Revisar el impacto en getStats() y hasKey().
 *
 * API utilizada:  set() · get() · hasKey() · del() · flush() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancia LOCAL con TTL global de respaldo (10 s) */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 10,   // fallback
  serviceIdentifier: 'EXAMPLE_TTL_5',
  enableMonitoring : false
});

/* 2️⃣  Lógica de ejemplo envuelta en IIFE async */
(async () => {
  /* Guardar tres tipos de datos con TTLs específicos */
  await cache.set('cfg:site',        { theme:'dark', ver:'1.1' }, 3600);
  await cache.set('session:user:42', { lastActive: Date.now() },  900);
  await cache.set('search:q=shoes',  ['shoe‑1', 'shoe‑2'],         30);

  /* Simular paso del tiempo (30 s) y comprobar expiración */
  // … sleep 30 s …

  const cfgAlive   = await cache.hasKey('cfg:site');        // true
  const sessAlive  = await cache.hasKey('session:user:42'); // true
  const searchMiss = await cache.hasKey('search:q=shoes');  // false

  /* Renovar sólo la búsqueda vencida */
  await cache.set('search:q=shoes', ['shoe‑3', 'shoe‑4'], 30);

  /* Cambiar versión de cfg:site → del() + nuevo set() */
  await cache.del('cfg:site');
  await cache.set('cfg:site', { theme:'light', ver:'1.2' }, 3600);

  /* Flush global (mantenimiento) y stats finales */
  await cache.flush();
  const finalStats = cache.getStats();
})();
