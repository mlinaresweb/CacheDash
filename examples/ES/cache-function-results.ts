/****************************************************************************************
 * 🧩 Ejemplo 4 (ES) – Patrones para cachear resultados de funciones
 * =====================================================================================
 * Snippet pedagógico (NO se ejecuta tal cual).  Muestra tres formas profesionales
 * de aplicar CacheDash en tu código de negocio sin dependencias externas:
 *
 *   1.  getOrSet()      → helper genérico con clave fija
 *   2.  cachedFn()      → “decorador” que genera la clave con los argumentos
 *   3.  Patrón inline   → clave compuesta dentro de la propia función costosa
 *
 * Métodos usados:  get() · set() · del() · hasKey() · getStats()
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 0️⃣  Instancia LOCAL (usa 'redis' si lo prefieres) */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 30,              // TTL global (s)
  serviceIdentifier: 'EXAMPLE_FUNC_4',
  enableMonitoring : false
});

/* 1️⃣  getOrSet() – helper universal  (clave ya conocida) */
async function getOrSet<T>(
  key: string,
  ttl: number,
  compute: () => Promise<T> | T
): Promise<T> {
  const hit = await cache.get<T>(key);
  if (hit !== undefined) return hit;              // HIT
  const value = await Promise.resolve(compute()); // MISS
  await cache.set(key, value, ttl);
  return value;
}

/* 2️⃣  cachedFn() – decorador para funciones (clave = nombre+args) */
function cachedFn<T extends (...args: any[]) => any>(
  fn: T,
  ttl = 30,
  prefix = fn.name
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = `${prefix}:${JSON.stringify(args)}`;
    const hit = await cache.get<ReturnType<T>>(key);
    if (hit !== undefined) return hit;

    const res = await Promise.resolve(fn(...args));
    await cache.set(key, res, ttl);
    return res;
  };
}

/* 3️⃣  Patrón inline – la función maneja su propia clave */
async function expensiveComputation(a: number, b: number): Promise<number> {
  const key = `expensive:${a}:${b}`;
  const hit = await cache.get<number>(key);
  if (hit !== undefined) return hit;

  const result = Math.pow(a, b);       // cálculo intensivo real
  await cache.set(key, result, 45);    // TTL 45 s
  return result;
}

/* ╭──────────────────────────────────────────────────────────╮
 * │  DEMO (IIFE async) – copia sólo las partes que necesites │
 * ╰──────────────────────────────────────────────────────────╯ */
(async () => {
  /* getOrSet(): cachear un objeto de configuración */
  const cfg = await getOrSet('config:global', 120, () => ({
    version: '1.0', loadedAt: Date.now()
  }));

  /* cachedFn(): cachear informes mensuales */
  const buildReport   = (y: number, m: number) => `REPORT_${y}_${m}_${Date.now()}`;
  const cachedReport  = cachedFn(buildReport, 60, 'report');
  const feb2025First  = await cachedReport(2025, 2); // MISS, se genera
  const feb2025Second = await cachedReport(2025, 2); // HIT

  /* inline: cálculo costoso */
  const pow1 = await expensiveComputation(2, 10); // MISS
  const pow2 = await expensiveComputation(2, 10); // HIT

  /* Invalidación puntual + verificación */
  await cache.del('report:[2025,2]');
  const stillExists = await cache.hasKey('report:[2025,2]'); // false

  /* Stats para depuración */
  console.log('Stats globales:', cache.getStats());
})();
