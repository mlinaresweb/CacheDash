/****************************************************************************************
 * 📚 Ejemplo 7 (ES) – Límite de memoria y expulsión automática (LOCAL)
 * =====================================================================================
 * Snippet de referencia — NO pensado para ejecutarse “tal cual”.
 *
 * Qué ilustra:
 *   • Cómo fijar `maxMemorySizeMB` en una instancia LOCAL.
 *   • Cómo CacheDash va expulsando (evicting) claves menos usadas
 *     al superar ese umbral.
 *   • Cómo consultar en `getStats()` el número de evictions,
 *     el tamaño actual y las claves restantes.
 *
 * Redis tiene sus propias políticas de memoria; esta característica
 * es exclusiva del backend LOCAL.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  Instancia LOCAL con límite de 2 MB y sin TTL */
const MAX_MB = 2;

const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 0,         // sin expiración por tiempo
  maxMemorySizeMB  : MAX_MB,    // umbral de memoria
  serviceIdentifier: 'EXAMPLE_EVICT_7',
  enableMonitoring : false
});

/* Helper: objeto ~0.5 MB */
const genBig = (i: number) => ({ id: i, blob: 'x'.repeat(512 * 1024) });

/* 2️⃣  Inserta datos hasta superar el límite (IIFE async) */
(async () => {
  for (let i = 1; i <= 6; i++) {
    await cache.set(`big:${i}`, genBig(i)); // ~0.5 MB cada uno
  }

  const statsAfterInsert = cache.getStats();     // observar size y evictions
  const survivors = Array.from(cache.getKeyStats()?.keys() || []);

  // survivors muestra qué claves sobrevivieron tras la expulsión automática
})();
