/**
 * ALL‑IN‑ONE DEMO  –  CacheType.LOCAL  (ENGLISH)
 * ============================================================================
 *  • Opens the dashboard at http://localhost:4000/dashboard
 *  • CLI covers every public API of cache‑dash in LOCAL mode.
 *
 *  Quick commands (type "help" for details):
 *    set      <key> <json> [ttl]     – create / update
 *    get      <key>                  – read
 *    del      <key>                  – delete
 *    list                             – keys table
 *    ttl      <key>                  – remaining TTL
 *    expire   <key> <ttl>            – change TTL
 *    persist  <key>                  – remove TTL (∞)
 *    has      <key>                  – check existence
 *    flush                            – wipe cache
 *    mass     <n>                    – stress test
 *    dump     <file.json>            – export snapshot
 *    load     <file.json>            – import snapshot
 *    csv      <file.csv>             – key‑stats → CSV
 *    stats                            – global stats
 *    keystats <key>                  – stats for a key
 *    config   show|ttl <s>|maxmem <MB>
 *    calls     [--all]               – calls history
 *    monitor  on|off                 – toggle dashboard
 *    services / globalstats          – multi‑service info
 *    help | exit | quit
 * ============================================================================
 */

/**
 * ============================================================================
// # ─── BASIC CRUD ───────────────────────────────────────────
// set user:1 {"id":1,"name":"Ada"} 60          # create – ttl 60s
// get user:1                                   # read
// set user:1 {"id":1,"name":"Ada Lovelace"}    # update (infinite ttl)
// ttl user:1                                   # remaining ttl
// expire user:1 120                            # new ttl 120s
// persist user:1                               # remove ttl (∞)
// has user:1                                   # check existence
// del user:1                                   # delete
// get user:1                                   # miss

// # ─── LIST AND METRICS ───────────────────────────────────
// set product:42 {"sku":42,"price":99.9} 30
// set flag true                                # boolean value
// list                                         # summary table
// stats                                        # global stats
// keystats product:42                          # stats for a key

// # ─── BULK MANAGEMENT / STRESS TEST ─────────────────────────
// mass 50                                      # 50 random keys, ttl 30s
// flush                                        # clears everything

// # ─── SNAPSHOT / IMPORT‑EXPORT ─────────────────────────────
// dump snapshot.json                           # export to disk
// load snapshot.json                           # import
// csv stats.csv                                # key‑stats → CSV

// # ─── HOT CONFIGURATION ───────────────────────────────────
// config show                                  # view default TTL & memory
// config ttl 300                               # default TTL 5 min
// config maxmem 256                            # 256 MB memory limit

// # ─── MONITORING & SERVICES ───────────────────────────
// monitor off                                  # stop dashboard
// monitor on                                   # reactivate
// services                                     # list registered services
// globalstats                                  # stats of all services

// # ─── CALL HISTORY ────────────────────────────────────────
// calls                                        # last 24 h (current service)
// calls --all                                  # combined from all

// # ─── EXIT ────────────────────────────────────────────────
// help                                         # help reminder
// exit                                         # close the demo

// ----------------------------------------------------------------------------
 */



import { CacheServiceCreate } from '../../../src';
import { GlobalCacheStatsCollector } from '../../../src/dashboard/globalCacheStatsCollector';
import { LocalCacheService } from '../../../src/local/localCacheService';

import readline from 'node:readline';
import util from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';

// ─────────────────────────────────────────────────────────────
// 1. Create cache instance + monitoring
// ─────────────────────────────────────────────────────────────
const cache = CacheServiceCreate.create({
  cacheType        : 'local',
  serviceIdentifier: 'DemoService',
  defaultTTL       : 0,
  enableMonitoring : true,
  maxMemorySizeMB  : 128,
});

// direct access to internal LocalCacheService for advanced calls
const localSvc = (cache as any).localCacheService as LocalCacheService;

// ─────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
banner(); prompt();

rl.on('line', async (input) => {
  const line = input.trim();
  if (!line) return prompt();

  const [cmd, ...rest] = line.split(/\s+/);
  try {
    switch (cmd.toLowerCase()) {
      case 'set':       await cmdSet(line);                break;
      case 'get':       await cmdGet(rest);                break;
      case 'del':       await cmdDel(rest);                break;
      case 'list':      await cmdList();                   break;
      case 'ttl':       await cmdTtl(rest);                break;
      case 'expire':    await cmdExpire(rest);             break;
      case 'persist':   await cmdPersist(rest);            break;
      case 'has':       await cmdHas(rest);                break;
      case 'flush':     await cache.flush();               break;
      case 'mass':      await cmdMass(rest);               break;
      case 'dump':      await cmdDump(rest);               break;
      case 'load':      await cmdLoad(rest);               break;
      case 'csv':       await cmdCsv(rest);                break;
      case 'stats':     console.log(cache.getStats());     break;
      case 'keystats':  await cmdKeyStats(rest);           break;
      case 'config':    await cmdConfig(rest);             break;
      case 'calls':     await cmdCalls(rest);              break;
      case 'monitor':   await cmdMonitor(rest);            break;
      case 'services':  console.log(GlobalCacheStatsCollector.getInstance().getServiceRegistryKeys()); break;
      case 'globalstats': console.log(GlobalCacheStatsCollector.getInstance().getAllStats()); break;
      case 'help':      help();                            break;
      case 'exit':
      case 'quit':      rl.close(); return;
      default:          console.log('Unknown command'); help(false);
    }
  } catch (err) { console.error('❌', (err as Error).message); }
  prompt();
});

rl.on('close', () => { console.log('👋 Bye'); process.exit(0); });

// ─────────── commands (same logic as Spanish demo) ──────────
async function cmdSet(line: string) {
  const m = line.match(/^set\s+(\S+)\s+(.+?)(?:\s+(\d+))?$/);
  if (!m) return usage('set');
  const [, key, jsonStr, ttlStr] = m;
  const ttl = ttlStr ? Number(ttlStr) : undefined;
  let val; try { val = JSON.parse(jsonStr); } catch { return console.log('Invalid JSON'); }
  await cache.set(key, val, ttl);
  console.log(`✔ ${key}${ttl ? ` ttl=${ttl}s` : ''}`);
}

async function cmdGet([key]: string[]) {
  if (!key) return usage('get');
  console.log(util.inspect(await cache.get(key), { depth: null, colors: true }));
}
async function cmdDel([key]: string[]) { if (!key) return usage('del'); await cache.del(key); console.log('🗑️  ok'); }
async function cmdList() {
  const ks = cache.getKeyStats();
  if (!ks || ks.size === 0) return console.log('(empty)');
  console.table([...ks.values()].map(({ keyName, size, ttl, hits, misses }) => ({
    key: keyName, sizeB: size, ttlS: ttl, hits, misses,
  })));
}
async function cmdTtl([key]: string[]) {
  if (!key) return usage('ttl');
  const k = cache.getKeyStats()?.get(key);
  console.log(k ? `${k.ttl}s` : '⛔ not found');
}
async function cmdExpire([key, ttlStr]: string[]) {
  if (!key || !ttlStr) return usage('expire');
  const ttl = Number(ttlStr);
  const val = await cache.get(key);
  if (val === undefined) return console.log('⛔ not found');
  await cache.set(key, val, ttl); console.log('✔ ttl updated');
}
async function cmdPersist([key]: string[]) {
  if (!key) return usage('persist');
  const val = await cache.get(key);
  if (val === undefined) return console.log('⛔ not found');
  await cache.set(key, val); console.log('♾️ ttl removed');
}
async function cmdHas([key]: string[]) { if (!key) return usage('has'); console.log(await cache.hasKey(key)); }
async function cmdMass([nStr]: string[]) {
  const n = Number(nStr); if (!n) return usage('mass');
  for (let i = 0; i < n; i++) await cache.set(`mass:${i}`, { dummy: randomBytes(32).toString('hex') }, 30);
  console.log(`🚀 ${n} keys added`);
}
async function cmdDump([file]: string[]) {
  if (!file) return usage('dump');
  const data: Record<string, unknown> = {};
  for (const [k] of cache.getKeyStats() ?? []) data[k] = await cache.get(k);
  await fs.writeFile(path.resolve(file), JSON.stringify(data, null, 2)); console.log('💾 dump ok');
}
async function cmdLoad([file]: string[]) {
  if (!file) return usage('load');
  const txt = await fs.readFile(path.resolve(file), 'utf8');
  const data = JSON.parse(txt);
  await cache.flush();
  for (const [k, v] of Object.entries(data)) await cache.set(k, v);
  console.log('📂 snapshot loaded');
}
async function cmdCsv([file]: string[]) {
  if (!file) return usage('csv');
  const ks = cache.getKeyStats();
  if (!ks) return console.log('(no data)');
  const csv = GlobalCacheStatsCollector.getInstance().generateCsv([...ks.values()]);
  await fs.writeFile(path.resolve(file), csv); console.log('📝 CSV generated');
}
async function cmdKeyStats([key]: string[]) {
  if (!key) return usage('keystats');
  const k = cache.getKeyStats()?.get(key);
  console.log(k ?? '⛔ not found');
}
async function cmdConfig([sub, val]: string[]) {
  if (!sub) return usage('config');
  switch (sub) {
    case 'show': console.log(localSvc.getConfig()); break;
    case 'ttl':
      if (!val) return usage('config');
      localSvc.updateConfig(Number(val));
      console.log('Default TTL updated'); break;
    case 'maxmem':
      if (!val) return usage('config');
      localSvc.updateConfig(undefined, Number(val));
      console.log('MaxMemory updated'); break;
    default: usage('config');
  }
}
async function cmdCalls([flag]: string[]) {
  if (flag === '--all')
    console.log(GlobalCacheStatsCollector.getInstance().getAllServicesCallHistory());
  else
    console.log(localSvc.getCallHistory());
}
async function cmdMonitor([state]: string[]) {
  const gc = GlobalCacheStatsCollector.getInstance();
  if (state === 'on')      { gc.enableMonitoring();  console.log('monitor ON'); }
  else if (state === 'off'){ gc.disableMonitoring(); console.log('monitor OFF'); }
  else                     usage('monitor');
}

// ───────────────────────────── utilities ───────────────────
function banner() {
  console.log('\n🟢  Cache Demo (LOCAL) – service “DemoService”');
  console.log('🔗 Dashboard: http://localhost:4000/dashboard\n');
}
function prompt() { rl.prompt(); }
function usage(cmd: string) {
  const map: Record<string, string> = {
    set    : 'set <key> <json> [ttl]',
    get    : 'get <key>',
    del    : 'del <key>',
    ttl    : 'ttl <key>',
    expire : 'expire <key> <ttl>',
    persist: 'persist <key>',
    has    : 'has <key>',
    mass   : 'mass <n>',
    dump   : 'dump <file.json>',
    load   : 'load <file.json>',
    csv    : 'csv <file.csv>',
    keystats:'keystats <key>',
    config : 'config show|ttl <s>|maxmem <MB>',
    monitor: 'monitor on|off',
  };
  console.log('Usage:', map[cmd] ?? cmd);
}

function help(showPrompt = true) {
  console.log(`
══════════  Quick Help – LOCAL Demo (en) ══════════
 Basic:
   set <key> <json> [ttl]   ➜ create / update
   get <key>                ➜ read key
   del <key>                ➜ delete key
   has <key>                ➜ exists?
   list                     ➜ keys table

 TTL & expiry:
   ttl <key>                ➜ remaining TTL
   expire <key> <ttl>       ➜ change TTL
   persist <key>            ➜ remove TTL (∞)

 Utilities:
   mass <n>                 ➜ generate n dummy keys
   flush                    ➜ flush all
   dump <file.json>         ➜ export snapshot
   load <file.json>         ➜ import snapshot
   csv  <file.csv>          ➜ key‑stats → CSV

 Diagnostics:
   stats                    ➜ global stats
   keystats <key>           ➜ stats for a key
   calls [--all]            ➜ calls history
   services / globalstats   ➜ multi‑service info

 Config & monitor:
   config show|ttl <s>|maxmem <MB>
   monitor on|off           ➜ dashboard toggle

 Others:
   help   / exit / quit
═══════════════════════════════════════════════════`);
  if (showPrompt) prompt();
}
