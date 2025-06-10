# 🧪 Official **Cache‑Dash** Demos (EN)  

> Folder: `examples/DEMOS/EN/`  
> Included demos:
>
> | File                                | Backend | Language | npm script                          |
> |-------------------------------------|---------|----------|-------------------------------------|
> | `demo_local_en.ts`                  | LOCAL   | EN       | `npm run demo:local-en`             |
> | `demo_redis_en.ts`                  | REDIS   | EN       | `npm run demo:redis-en`             |

Each demo is **self‑contained** and exercises the full public API.  
When you run it you’ll get a `cache>` prompt and a live dashboard at <http://localhost:4000/dashboard>.

---

## 0. Purpose of these demos

* Try **every** feature of *cache‑dash* without writing code.  
* Watch hits, misses, size, evictions, TTL, etc. in real time via WebSockets.  
* Stress‑test memory limits and see the eviction policy.  
* Export / import snapshots to reproduce bugs or migrate data.  
* Use the script as a template for your own application.

---

## 1. Requirements

|                              | Minimum |
|------------------------------|---------|
| Node.js                      | 16 LTS  |
| npm / yarn / pnpm            | 8.x     |
| Free ports                   | 4000 (dashboard) + 6379 (if you use Redis) |
| Docker (optional)            | Quick Redis spin‑up |

---

## 2. Installation & run

### 2.1 Clone the full repo

```bash
git clone https://github.com/your‑user/cache-dash.git
cd cache-dash
npm install
npm run build
# LOCAL demo in English
npm run demo:local-en
# REDIS demo in English
npm run demo:redis-en
```

### 2.2 Using the npm package only

```bash
mkdir cache-dash-demos && cd cache-dash-demos
npm init -y
npm i cache-dash ts-node typescript
npx tsc --init
curl -O https://raw.githubusercontent.com/your‑user/cache-dash/main/examples/DEMOS/EN/demo_local_en.ts
npx ts-node demo_local_en.ts
```

### 2.3 Embedding the demo in *your* project

1. `npm i cache-dash`  
2. Copy the desired demo script.  
3. Replace the import:

```ts
import { CacheServiceCreate } from 'cache-dash';
```

4. Run with `ts-node demo_local_en.ts` or compile with `tsc`.

---

## 3. Folder layout

```
examples/
└─ DEMOS/
   ├─ EN/
   │  ├─ demo_type_local_en.ts
   │  ├─ demo_type_redis_en.ts
   │  ├─ commands_en.txt
   │  └─ README.md    <-- this file
   └─ ES/   … (Spanish version)
```

---

## 4. Starting a demo

After launching you’ll see:

```
🟢  Cache Demo (LOCAL) – service “DemoService”
🔗 Dashboard: http://localhost:4000/dashboard

cache>
```

Open the dashboard URL and type commands in the prompt.

---

## 5. Key commands

| Category     | Example                                               | Effect | Dashboard impact |
|--------------|-------------------------------------------------------|--------|------------------|
| CRUD         | `set user:1 {"id":1,"name":"Ada"} 60`<br>`get user:1`<br>`del user:1` | create, read, delete | New rows, **Hits** ↑, **Keys** ↓ |
| TTL          | `ttl user:1` · `expire user:1 120` · `persist user:1` | query / change TTL | TTL bar updates |
| Bulk         | `mass 100`                                            | 100 dummy keys | Memory & evictions spikes |
| Snapshot     | `dump dump.json` · `load dump.json`                   | export / import | Keys re‑appear |
| Diagnostics  | `list` · `stats` · `keystats user:1`                  | tables & metrics | Global panel updates |
| Management   | `config maxmem 256` · `monitor off`                   | memory / dashboard | Indicators adapt |

Type **`help`** for the full (34‑command) list.

---

## 6. Quick command sheet

```text
set user:1 {"id":1,"name":"Ada"} 60
get user:1
list
ttl user:1
expire user:1 300
persist user:1
mass 50
flush
dump snapshot.json
load snapshot.json
csv stats.csv
stats
config maxmem 256
monitor off
monitor on
exit
```

Paste blocks into your terminal to see immediate feedback.

---

## 7. Configuration details

| Option                     | LOCAL (`demo_local_en.ts`)              | REDIS (`demo_redis_en.ts`)            |
|----------------------------|-----------------------------------------|---------------------------------------|
| `cacheType`                | `'local'`                               | `'redis'`                             |
| `defaultTTL`               | Default TTL for new keys. `0` = infinite. | Same (`EX` in Redis).                |
| `serviceIdentifier`        | Name shown on dashboard.                | Same.                                 |
| `enableMonitoring`         | Starts Express+WS on **4000**.          | Same.                                 |
| `maxMemorySizeMB`          | RAM limit (LOCAL only).                 | — (Redis handles its own memory).     |
| `redisOptions.host`        | —                                       | Redis host (`127.0.0.1`).             |
| `redisOptions.port`        | —                                       | Port (`6379`).                        |
| `redisOptions.password`    | —                                       | Password if your Redis requires auth. |
| `redisOptions.db`          | —                                       | DB index (0‑15).                      |

### 7.1 Runtime tweaks

* **LOCAL**  
  ```text
  config ttl 120      # default TTL → 2 min
  config maxmem 512   # memory limit → 512 MB
  ```
* **REDIS**  
  Set env vars before running:  
  `REDIS_HOST=192.168.1.50 REDIS_PORT=6380 npm run demo:redis-en`

---

## 8. Using the dashboard

* **Global panel**: hits, misses, memory, evictions.  
* **Services**: each `serviceIdentifier` becomes a card.  
* **Charts**: TTL countdown, evictions, cached vs uncached timings.  
* **Key table**: filter, paginate, export CSV with the `csv` command.

---

## 9. Recommended scenarios

| Goal                    | Commands |
|-------------------------|----------|
| Smoke test              | `set ping {"ok":true} 5` → `get ping` → `stats` |
| Memory stress (LOCAL)   | `config maxmem 5` → `mass 500` → `stats` |
| Renew session (REDIS)   | `set session:123 {"user":"Ada"} 30` → `expire session:123 900` |
| Production snapshot     | `dump backup.json` → `flush` → `load backup.json` |

---

## 10. Troubleshooting

| Symptom / message                    | Cause & fix                          |
|--------------------------------------|--------------------------------------|
| `ECONNREFUSED 127.0.0.1:6379`        | Redis not running → `docker start demo-redis`. |
| `Cache TTL must be a number`         | Pass a numeric ttl to `set`.         |
| Dashboard won’t load                 | Port 4000 busy → `monitor off` then `monitor on`. |
| LOCAL memory keeps growing           | Raise `config maxmem` or add TTL.    |

---

## 11. Next steps

| Want to…                    | Action |
|-----------------------------|--------|
| Compile TS → JS             | `npm run build` (creates `dist/`). |
| See the Spanish demo        | `examples/DEMOS/ES/`.             |
| Test NONE mode              | Set `cacheType: 'none'`.          |
| Contribute                  | Fork → branch → PR (+ tests).     |

---

## 12. Credits

* **Library author**: Mlinaresweb.  

Happy caching 🎉
