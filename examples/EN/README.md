# 📚 Examples Guide – **CacheDash**

The **`examples/`** folder contains **11 files** that progressively demonstrate **how to use the entire public API** of CacheDash.  
These snippets **are not meant to be executed as‑is**; think of them as _copy‑paste reference pills_ you can adapt to your own codebase.

| # | File | What it teaches | Highlighted methods |
|---|------|-----------------|---------------------|
| 1 | `1-basic-local.ts` | Essential CRUD in memory (LOCAL) | `set`, `get`, `hasKey`, `del`, `flush`, `getStats`, `getKeyStats` |
| 2 | `2-basic-redis.ts` | Essential CRUD on a Redis backend | _All of the above_ |
| 3 | `3-cache-json.ts` | Versioning & invalidating large JSON responses | `set`, `get`, `hasKey`, `del`, `getStats`, `getKeyStats` |
| 4 | `4-cache-function-results.ts` | Patterns for caching function results | `get`, `set`, `del`, `hasKey`, `getStats` |
| 5 | `5-ttl-strategies.ts` | TTL strategies & selective vs. global invalidation | `set`, `hasKey`, `del`, `flush`, `getStats` |
| 6 | `6-multi-service-fallback.ts` | LOCAL → REDIS fallback with warming | `get`, `set`, `hasKey`, `del`, `getStats` |
| 7 | `7-memory-limit-eviction.ts` | Memory cap & automatic evictions (LOCAL) | `set`, `hasKey`, `getStats`, `getKeyStats` |
| 8 | `8-concurrency-safe.ts` | Concurrency‑safe caching with an in‑flight map | `get`, `set`, `hasKey`, `getStats` |
| 9 | `9-bulk-refresh.ts` | Bulk refresh by prefix (`user:*`) | `getKeyStats`, `set`, `del`, `getStats` |
| 10 | `10-testmode-example.ts` | Using `testMode: true` in unit tests | all methods (no broadcast) |
| 11 | `11-advanced-orchestration.ts` | **Multi‑tier orchestration (L1/L2/L3) + SWR + aggregated metrics** | `create`, `get`, `set`, `hasKey`, `getStats`, `flush` |

---

## 🛠 How to read these examples

1. **Locate the scenario** closest to yours (TTL, Redis, evictions, etc.).  
2. **Copy the relevant block** into your project:  
   - Adjust `cacheType` (`local` / `redis`) and `serviceIdentifier`.  
   - Tune TTLs and keys to suit your domain.  
   - Turn on the dashboard (`enableMonitoring: true`) if you need web visibility.  
3. **Integrate** the pattern (`getOrSet`, `cachedFn`, fallback, SWR, etc.) into your service, resolver, hook, or controller.

> ℹ️ The snippets avoid external dependencies: **no fetch/axios** or databases—every line focuses on the **CacheDash API**.

---

## 📑 Detailed file index

<details>
<summary><strong>1. 1-basic-local.ts</strong></summary>

In‑memory CRUD. Shows global vs. custom TTL, real expiration, `hasKey`, selective (`del`) and full (`flush`) cleanup, plus `getStats` and `getKeyStats`.
</details>

<details>
<summary><strong>2. 2-basic-redis.ts</strong></summary>

Same CRUD on Redis. Explains how to build `redisOptions` from environment variables (`REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`).
</details>

<details>
<summary><strong>3. 3-cache-json.ts</strong></summary>

Stores a large JSON (e.g. REST/GraphQL response), versions it (`v1 → v2`) and invalidates with `del` when the API changes.
</details>

<details>
<summary><strong>4. 4-cache-function-results.ts</strong></summary>

Three practical patterns for caching function results:  
1. `getOrSet` (fixed key)  
2. `cachedFn` (decorator name+args → key)  
3. Inline caching with its own TTL
</details>

<details>
<summary><strong>5. 5-ttl-strategies.ts</strong></summary>

Shows data‑aware TTLs (config 1 h, session 15 min, search 30 s) and when to use `del` vs. `flush`.
</details>

<details>
<summary><strong>6. 6-multi-service-fallback.ts</strong></summary>

Keeps two instances: `localCache` (low latency) and `redisCache` (durable). Reads LOCAL → REDIS and warms the fast layer.
</details>

<details>
<summary><strong>7. 7-memory-limit-eviction.ts</strong></summary>

How to set `maxMemorySizeMB` and watch `evictions` climb once the threshold is breached.
</details>

<details>
<summary><strong>8. 8-concurrency-safe.ts</strong></summary>

“In‑flight map” pattern to avoid multiple requests computing the same heavy result when the key is still missing.
</details>

<details>
<summary><strong>9. 9-bulk-refresh.ts</strong></summary>

Bulk‑refresh `user:*` keys during a migration without flushing the whole cache.  
Uses `getKeyStats()` to iterate and apply `set` or `del`.
</details>

<details>
<summary><strong>10. 10-testmode-example.ts</strong></summary>

Instantiate CacheDash with `testMode: true` for Jest: no WebSockets, no timers, blazing‑fast tests.
</details>

<details>
<summary><strong>11. 11-advanced-orchestration.ts</strong></summary>

**Three‑layer orchestration**:

| Layer | Backend | TTL | Purpose |
|-------|---------|-----|---------|
| L1    | `localFast`   | 3 s   | ultra‑low latency, initial heat |
| L2    | `localLarge`  | 30 s  | 64 MB in‑memory pool, mid retention |
| L3    | `redisShared` | 300 s | durability across pods |

Includes:

- Cascading fallback L1 → L3.  
- **Write‑through** across layers.  
- **Stale‑While‑Revalidate** pattern with async refresh.  
- Global *in‑flight* map to stop dog‑pile effects.  
- Aggregated metrics (`mergedStats`) for unified observability.
</details>

---

## ✅ Conclusion

With these 11 files any developer can:

- **Adopt CacheDash** in memory or Redis, simple or multi‑tier.  
- Design **smart TTLs** and invalidation policies.  
- Implement multi‑layer fallback and SWR for latency **and** freshness.  
- Control memory usage and evictions.  
- Ensure concurrency without overload.  
- Integrate caching into automated tests while keeping metrics insight.

Grab the pattern you need, tweak TTLs, and enjoy a flexible, well‑instrumented cache!
