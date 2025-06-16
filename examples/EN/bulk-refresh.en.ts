/****************************************************************************************
 * 📚 Example 9 (EN) – Bulk refresh by prefix  user:*
 * ======================================================================================
 * This snippet is **documentation only** – copy what you need into a maintenance
 * script.  It demonstrates how to:
 *
 *   • Iterate over all `user:*` keys via  getKeyStats().
 *   • “Migrate” each object (add `updated`) and extend TTL to 900 s.
 *   • Delete keys (`del`) that cannot be migrated.
 *   • Compare cache statistics before and after the operation.
 ****************************************************************************************/

import { CacheServiceCreate } from '../../src';

/* 1️⃣  LOCAL instance with default TTL = 15 min */
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  defaultTTL       : 900,
  serviceIdentifier: 'EXAMPLE_BULK_9',
  enableMonitoring : false
});

/* 2️⃣  Optional seeding (demo only) */
(async () => {
  await cache.set('user:1', { id: 1, role: 'guest'  }, 300);
  await cache.set('user:2', { id: 2, role: 'member' }, 300);
  await cache.set('user:3', { id: 3, role: 'guest'  }, 300);

  await cache.set('cfg:site',    { ver: '1.0' }, 3600);
  await cache.set('session:xyz', { token:'abc' }, 600);
})();

/* 3️⃣  Bulk refresh logic */
async function bulkRefreshUsers() {
  const statsMap = cache.getKeyStats();
  if (!statsMap) return;

  for (const [key] of statsMap.entries()) {
    if (!key.startsWith('user:')) continue;

    const current = await cache.get<Record<string, any>>(key);
    if (current) {
      const migrated = { ...current, updated: Date.now() };
      await cache.set(key, migrated, 900);          // TTL 15 min
    } else {
      await cache.del(key);                         // unreadable → delete
    }
  }
}

/* 4️⃣  Typical usage inside a maintenance job */
(async () => {
  console.log('Stats before:', cache.getStats());

  await bulkRefreshUsers();

  console.log('Stats after:',  cache.getStats());
  console.log('cfg:site intact?',    await cache.hasKey('cfg:site'));
  console.log('session:xyz intact?', await cache.hasKey('session:xyz'));
})();
