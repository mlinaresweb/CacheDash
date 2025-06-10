# 🧪 Demos oficiales de **Cache‑Dash** (ES)  

> Carpeta: `examples/DEMOS/ES/`  
> Demos incluidas:
>
> | Archivo                                | Backend | Idioma | Script npm                               |
> |----------------------------------------|---------|--------|------------------------------------------|
> | `demo_local_es.ts`                     | LOCAL   | ES     | `npm run demo:local-es`                  |
> | `demo_redis_es.ts`                     | REDIS   | ES     | `npm run demo:redis-es`                  |

Cada demo es **autosuficiente** y cubre el 100 % de la API pública.  
Al lanzarla verás un prompt `cache>` y un panel en tiempo real en <http://localhost:4000/dashboard>.

---

## 0. Requisitos

|                              | Mínimo |
|------------------------------|--------|
| Node.js                      | 16 LTS |
| npm / yarn / pnpm            | 8.x    |
| Puertos libres               | 4000 (dashboard) + 6379 (si usas Redis) |
| Docker (opcional)            | Para levantar Redis rápido |

---

## 1. Instalación y arranque

### 1.1 Clonando el repositorio completo

```bash
git clone https://github.com/tu‑usuario/cache-dash.git
cd cache-dash
npm install
npm run build
# LOCAL en español
npm run demo:local-es
# REDIS en español
npm run demo:redis-es
# COMBO en español
npm run demo:combo-es
```

### 1.2 Usando solo la librería publicada en npm

```bash
mkdir cache-dash-demos && cd cache-dash-demos
npm init -y
npm i cache-dash ts-node typescript
npx tsc --init                            # genera tsconfig.json
curl -O https://raw.githubusercontent.com/tu‑usuario/cache-dash/main/examples/DEMOS/ES/demo_local_es.ts
npx ts-node demo_local_es.ts
```

> Para la versión Redis baja `demo_redis_es.ts` y asegúrate de tener Redis corriendo.

### 1.3 Integrando la demo en tu proyecto

1. `npm i cache-dash`  
2. Copia el demo deseado a tu código fuente.  
3. Cambia la importación:

```ts
// de:
import { CacheServiceCreate } from '../../src';
// a:
import { CacheServiceCreate } from 'cache-dash';
```

4. Ejecuta con `ts-node` o traspílalo con `tsc`.

---

## 2. Estructura de carpetas

```
examples/
└─ DEMOS/
   ├─ EN/                       # versión inglesa
   └─ ES/
      ├─ demo_type_local_es.ts       # CLI Local
      ├─ demo_type_redis_es.ts       # CLI Redis
      ├─ demo_combo_es.ts           # CLI Combinado LOCAL + REDIS (2 servicios)
      ├─ commands_es.txt             # bloques copiar‑pegar LOCAL
      └─ README.md                   # ESTE documento
```

---

## 3. Configuración detallada

| Opción                       | LOCAL (`demo_local_es.ts`)                        | REDIS (`demo_redis_es.ts`)                     |
|------------------------------|---------------------------------------------------|------------------------------------------------|
| `cacheType`                 | `'local'`                                         | `'redis'`                                      |
| `defaultTTL`                | TTL por defecto para nuevas claves (seg.). `0` = infinito. | Igual (se mapea a `EX` en Redis).             |
| `serviceIdentifier`         | Nombre visible en el dashboard.                   | Idem (p.ej. `DemoRedisService`).               |
| `enableMonitoring`          | `true` inicia Express+WS en **4000**.             | Igual.                                         |
| `maxMemorySizeMB`           | Límite de RAM (solo LOCAL).                       | – (Redis controla su propia memoria).         |
| `redisOptions.host`         | –                                                 | Host de Redis (`127.0.0.1` por defecto).       |
| `redisOptions.port`         | –                                                 | Puerto (`6379`).                               |
| `redisOptions.password`     | –                                                 | Password si tu Redis tiene auth.               |
| `redisOptions.db`           | –                                                 | Índice de base de datos (0‑15).                |

### 3.1 Cambiar parámetros en caliente

* **LOCAL**  
  ```text
  config ttl 120          # TTL por defecto → 2 min
  config maxmem 512       # Memoria máx → 512 MB
  ```
* **REDIS**  
  Cambia las variables de entorno antes de lanzar:  
  `REDIS_HOST=192.168.1.50 REDIS_PORT=6380 npm run demo:redis-es`

---

## 4. Guía de uso de la demo

### 4.1 Interfaz CLI

Escribe `help` para ver los comandos. Lista completa ⬇️

<details>
<summary>Comandos disponibles (LOCAL y REDIS)</summary>

```text
set <k> <json> [ttl]        crea / actualiza
get <k>                      lee clave
del <k>                      borra
has <k>                      existe?
list                         tabla de claves

ttl <k>                      TTL restante
expire <k> <ttl>             cambia TTL
persist <k>                  TTL infinito

mass <n>                     genera n claves dummy
flush                        borra todo (Redis: FLUSHDB)

dump <file.json>             export snapshot
load <file.json>             importa snapshot
csv  <file.csv>              key‑stats -> CSV

stats                        métricas globales
keystats [k]                 métricas de clave
calls [--all]                historial de llamadas

config show|ttl|maxmem       gestionar TTL / memoria (solo LOCAL)
monitor on|off               iniciar / parar dashboard
services                     lista de servicios registrados
globalstats                  métricas de todos los servicios

help | exit | quit
```
</details>

### 4.2 Dashboard interactivo

* **Panel global**: hits, misses, memoria, evicciones.  
* **Servicios**: cada `serviceIdentifier` aparece como tarjeta.  
* **Gráficos**:  
  * **TTL**: tiempo restante por clave.  
  * **Evictions**: barras cuando se supera memoria (LOCAL) o Redis expulsa claves.  
  * **Rendimiento**: medias de respuesta cacheada vs sin cachear.  
* **Tabla de claves**: filtrar, paginar, exportar CSV desde la demo (`csv`).

---

## 5. Casos de uso recomendados

1. **Smoke test**  
   ```text
   set ping {"ok":true} 5
   get ping
   stats
   ```
2. **Stress test memoria (LOCAL)**  
   ```text
   config maxmem 5     # 5 MB
   mass 500
   stats               # observa evictions
   ```
3. **Renovar sesión (REDIS)**  
   ```text
   set session:123 {"user":"Ada"} 30
   ttl session:123
   expire session:123 900
   ```
4. **Snapshot de producción**  
   ```text
   dump backup.json
   flush
   load backup.json
   ```

---

## 6. Solución de problemas

| Mensaje / síntoma                         | Causa y solución                                      |
|------------------------------------------|-------------------------------------------------------|
| `ECONNREFUSED 127.0.0.1:6379`            | Redis no está corriendo → `docker start demo-redis`.  |
| `Cache TTL must be a number`             | Pasaste texto como ttl; usa número entero.            |
| Dashboard no carga                       | Puerto 4000 ocupado → `monitor off` y `monitor on`.   |
| Memoria LOCAL sube sin límite            | Aumenta `config maxmem` o activa eviction con TTL.    |

---

## 7. Próximos pasos

| Quiero…                               | Haz esto |
|---------------------------------------|----------|
| **Código TypeScript → JavaScript**    | `npm run build` – genera `dist/`. |
| **Ver demo en inglés**                | `examples/DEMOS/EN/`. |
| **Probar modo NONE**                  | Cambia `cacheType: 'none'` (sin cache). |
| **Contribuir**                        | Fork → rama → PR (añade tests). |

---

## 8. Créditos

* **Autor de la librería**: Mlinaresweb.  

¡Feliz cacheo 🕶️!
