# 📚 Guía de Ejemplos – **CacheDash**

Esta carpeta **`examples/`** contiene **10 archivos** que ilustran, de forma progresiva, **cómo usar toda la API pública** de CacheDash.  
Los ejemplos **no están pensados para ejecutarse** tal cual, sino como _píldoras de referencia_ que puedes copiar y adaptar dentro de tu código.

| # | Archivo | Qué enseña | Métodos destacados |
|---|---------|-----------|--------------------|
| 1 | `1-basic-local.ts` | CRUD esencial en memoria (LOCAL) | `set`, `get`, `hasKey`, `del`, `flush`, `getStats`, `getKeyStats` |
| 2 | `2-basic-redis.ts` | CRUD esencial con backend Redis | _Todos los anteriores_ |
| 3 | `3-cache-json.ts` | Versionar e invalidar respuestas JSON grandes | `set`, `get`, `hasKey`, `del`, `getStats`, `getKeyStats` |
| 4 | `4-cache-function-results.ts` | Patrones para cachear resultados de funciones | `get`, `set`, `del`, `hasKey`, `getStats` |
| 5 | `5-ttl-strategies.ts` | Estrategias de TTL e invalidación selectiva/global | `set`, `hasKey`, `del`, `flush`, `getStats` |
| 6 | `6-multi-service-fallback.ts` | Fallback LOCAL → REDIS con warming | `get`, `set`, `hasKey`, `del`, `getStats` |
| 7 | `7-memory-limit-eviction.ts` | Límite de memoria y evictions automáticos (LOCAL) | `set`, `hasKey`, `getStats`, `getKeyStats` |
| 8 | `8-concurrency-safe.ts` | Concurrencia segura con mapa in-flight | `get`, `set`, `hasKey`, `getStats` |
| 9 | `9-bulk-refresh.ts` | Renovación masiva por prefijo (`user:*`) | `getKeyStats`, `set`, `del`, `getStats` |
| 10| `10-testmode-example.ts` | Uso de `testMode: true` en suites unitarias | todos los métodos (sin broadcast) |

---

## 🛠 Cómo leer estos ejemplos

1. **Ubica el escenario** que se parezca a tu necesidad (TTL, Redis, evictions, etc.).
2. **Copia el bloque relevante** dentro de tu proyecto:
   - Cambia `cacheType` (`local` / `redis`) y `serviceIdentifier`.
   - Ajusta los TTL y claves según tu dominio.
   - Puedes activar el monitoreo es decir el dashboard y poder ver en tiempo y manejar tu cache desde la web.
3. **Integra** el patrón (`getOrSet`, `cachedFn`, fallback, etc.) en tu servicio, _resolver_, hook o controlador.

> ℹ️ Los ejemplos evitan dependencias externas: **no traen fetch/axios** ni bases de datos; todo el código gira en torno a la **API de CacheDash**.

---

## 📑 Resumen detallado de cada archivo

<details>
<summary><strong>1. 1-basic-local.ts</strong></summary>

CRUD esencial en memoria. Muestra TTL global vs. personalizado, expiración real, verificación con `hasKey`, limpieza puntual (`del`) y total (`flush`), además de `getStats` y `getKeyStats`.
</details>

<details>
<summary><strong>2. 2-basic-redis.ts</strong></summary>

Mismo CRUD usando Redis. Explica cómo construir `redisOptions` con variables de entorno (`REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`).
</details>

<details>
<summary><strong>3. 3-cache-json.ts</strong></summary>

Guarda un JSON grande (p. ej. respuesta REST/GraphQL), lo versiona (`v1 → v2`), y enseña a invalidar con `del` cuando la API cambia.
</details>

<details>
<summary><strong>4. 4-cache-function-results.ts</strong></summary>

Tres patrones prácticos para cachear resultados de funciones:
1. `getOrSet` (clave fija)  
2. `cachedFn` (decorador args → clave)  
3. Inline caching con TTL propio
</details>

<details>
<summary><strong>5. 5-ttl-strategies.ts</strong></summary>

Demuestra TTL diferenciado según la naturaleza del dato (config 1 h, session 15 min, search 30 s) y cuándo usar `del` o `flush`.
</details>

<details>
<summary><strong>6. 6-multi-service-fallback.ts</strong></summary>

Mantiene dos instancias: `localCache` (baja latencia) y `redisCache` (durable). Patrón de lectura LOCAL → REDIS y _warming_ de la capa rápida.
</details>

<details>
<summary><strong>7. 7-memory-limit-eviction.ts</strong></summary>

Muestra cómo establecer `maxMemorySizeMB` y ver en las stats cómo se incrementa `evictions` al superar el umbral.
</details>

<details>
<summary><strong>8. 8-concurrency-safe.ts</strong></summary>

Patrón “in-flight map” para evitar que múltiples peticiones concurrentes computen el mismo resultado cuando la clave aún no existe.
</details>

<details>
<summary><strong>9. 9-bulk-refresh.ts</strong></summary>

Proceso de renovación masiva de claves `user:*` por migración o invalidez selectiva, sin reiniciar toda la caché.  
Usa `getKeyStats()` para iterar y aplicar `set` o `del`.
</details>

<details>
<summary><strong>10. 10-testmode-example.ts</strong></summary>

Cómo instanciar CacheDash con `testMode: true` para suites de Jest.  
Desactiva WebSockets, timers y monitorización para que los tests sean rápidos y estables.
</details>

---

## ✅ Conclusión

Con estos 10 archivos, cualquier desarrollador puede:

- **Adoptar CacheDash** en memoria o con Redis.
- Diseñar **TTL inteligentes** y políticas de invalidación.
- Implementar **fallback multicapas** para latencia y durabilidad.
- Controlar el **uso de memoria** y evictions.
- Asegurar **concurrencia** sin sobrecarga.
- Integrar la caché en **tests automatizados**.

Copia el patrón que necesites, ajusta los TTL y disfruta de una caché flexible y bien instrumentada.
