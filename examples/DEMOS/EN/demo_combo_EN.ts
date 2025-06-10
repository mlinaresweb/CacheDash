/**
 * COMBINED DEMO – CacheType.LOCAL + CacheType.REDIS
 * =============================================================================
 *  ▸ Single dashboard: http://localhost:4000/dashboard
 *  ▸ Two simultaneous services:
 *       • LocalService   (in-memory)
 *       • RedisService   (Redis)
 *
 *  CLI syntax
 *  ----------
 *    local  <command ...>   → operate on LOCAL service
 *    redis  <command ...>   → operate on REDIS service
 *
 *  Global commands (no prefix):
 *    monitor  on|off        · enable / pause dashboard
 *    services               · list registered services
 *    globalstats            · metrics of all services
 *    help | exit | quit
 *
 *  All sub-commands after the prefix are the same as the individual demos:
 *  set, get, del, list, ttl, expire, persist, has, etc.
 *
 *  Requirements
 *  ------------
 *    Redis available at 127.0.0.1:6379
 *      docker run -d -p 6379:6379 --name demo-redis redis:7
 */

import { CacheServiceCreate } from '../../../src';
import { GlobalCacheStatsCollector } from '../../../src/dashboard/globalCacheStatsCollector';

import readline from 'node:readline';
import util from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';

// ─── 1. Create services ─────────────────────────────────────
const localSrv = CacheServiceCreate.create({
  cacheType        : 'local',
  serviceIdentifier: 'LocalService',
  enableMonitoring : true,
  maxMemorySizeMB  : 64,
});

const redisSrv = CacheServiceCreate.create({
  cacheType        : 'redis',
  serviceIdentifier: 'RedisService',
  enableMonitoring : true, // first enableMonitoring already started the dashboard
  redisOptions     : {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: +(process.env.REDIS_PORT || 6379),
  },
});

// Utility to map prefix → service
function srvOf(prefix: string) {
  if (prefix === 'local') return localSrv;
  if (prefix === 'redis') return redisSrv;
  return null;
}

// ─── 2. CLI ────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
banner();
rl.prompt();

rl.on('line', async (raw) => {
  const line = raw.trim();
  if (!line) return rl.prompt();

  const [tok1, tok2, ...tail] = line.split(/\s+/);

  // 2.1 global commands (no prefix)
  if (tok1 === 'monitor') {
    await cmdMonitor(tok2);
    rl.prompt();
    return;
  }
  if (tok1 === 'services') {
    console.log(GlobalCacheStatsCollector.getInstance().getServiceRegistryKeys());
    rl.prompt();
    return;
  }
  if (tok1 === 'globalstats') {
    console.log(GlobalCacheStatsCollector.getInstance().getAllStats());
    rl.prompt();
    return;
  }
  if (tok1 === 'help') {
    help();
    rl.prompt();
    return;
  }
  if (tok1 === 'exit' || tok1 === 'quit') {
    rl.close();
    return;
  }

  // 2.2 must have prefix local|redis
  const srv = srvOf(tok1);
  if (!srv) {
    console.log('Prefix required: local …  |  redis …');
    help(false);
    rl.prompt();
    return;
  }

  const cmd = tok2?.toLowerCase();
  const args = tail;

  try {
    switch (cmd) {
      case 'set':      await cmdSet(srv, [tok2, ...tail].join(' ')); break;
      case 'get':      await cmdGet(srv, args);                      break;
      case 'del':      await cmdDel(srv, args);                      break;
      case 'ttl':      await cmdTtl(srv, args);                      break;
      case 'expire':   await cmdExpire(srv, args);                   break;
      case 'persist':  await cmdPersist(srv, args);                  break;
      case 'has':      await cmdHas(srv, args);                      break;
      case 'list':     await cmdList(srv);                           break;
      case 'mass':     await cmdMass(srv, args);                     break;
      case 'flush':    await srv.flush(); console.log('🧹 ok');      break;
      case 'dump':     await cmdDump(srv, args);                     break;
      case 'load':     await cmdLoad(srv, args);                     break;
      case 'csv':      await cmdCsv(srv, args);                      break;
      case 'stats':    console.log(srv.getStats());                  break;
      case 'keystats': await cmdKeyStats(srv, args);                 break;
      default:
        console.log('Unknown command');
        help(false);
    }
  } catch (err) {
    console.error('❌', (err as Error).message);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('👋 Combined demo ended');
  process.exit(0);
});

// ─── 3. Command implementations (same as before) ───────────
async function cmdSet(srv: any, line: string) {
  const m = line.match(/^set\s+(\S+)\s+(.+?)(?:\s+(\d+))?$/);
  if (!m) return console.log('Usage: local|redis set <key> <json> [ttl]');
  const [, key, jsonStr, ttlStr] = m;
  const ttl = ttlStr ? Number(ttlStr) : undefined;
  let val;
  try {
    val = JSON.parse(jsonStr);
  } catch {
    return console.log('Invalid JSON');
  }
  await srv.set(key, val, ttl);
  console.log(`✔ ${key}`);
}

async function cmdGet(srv: any, [key]: string[]) {
  if (!key) return console.log('Usage: … get <key>');
  console.log(util.inspect(await srv.get(key), { depth: null, colors: true }));
}

async function cmdDel(srv: any, [key]: string[]) {
  if (!key) return console.log('Usage: … del <key>');
  await srv.del(key);
  console.log('🗑️ ok');
}

async function cmdTtl(srv: any, [key]: string[]) {
  if (!key) return console.log('Usage: … ttl <key>');
  const stat = srv.getKeyStats()?.get(key);
  console.log(stat ? `${stat.ttl}s` : '⛔ not found');
}

async function cmdExpire(srv: any, [key, ttlStr]: string[]) {
  if (!key || !ttlStr) return console.log('Usage: … expire <key> <ttl>');
  const ttl = Number(ttlStr);
  const val = await srv.get(key);
  if (val === undefined) return console.log('⛔ not found');
  await srv.set(key, val, ttl);
  console.log('✔ ttl updated');
}

async function cmdPersist(srv: any, [key]: string[]) {
  if (!key) return console.log('Usage: … persist <key>');
  const val = await srv.get(key);
  if (val === undefined) return console.log('⛔ not found');
  await srv.set(key, val);
  console.log('♾️ ttl removed');
}

async function cmdHas(srv: any, [key]: string[]) {
  if (!key) return console.log('Usage: … has <key>');
  console.log(await srv.hasKey(key));
}

async function cmdList(srv: any) {
  const ks = srv.getKeyStats();
  if (!ks || ks.size === 0) return console.log('(no keys)');
  console.table([...ks.values()].map(({ keyName, ttl, hits, misses }) => ({
    key: keyName, ttlS: ttl, hits, misses,
  })));
}

async function cmdMass(srv: any, [nStr]: string[]) {
  const n = Number(nStr);
  if (!n) return console.log('Usage: … mass <n>');
  for (let i = 0; i < n; i++) {
    await srv.set(`mass:${i}`, { rnd: randomBytes(16).toString('hex') }, 30);
  }
  console.log(`🚀 ${n} keys added`);
}

async function cmdDump(srv: any, [file]: string[]) {
  if (!file) return console.log('Usage: … dump <file.json>');
  const data: Record<string, unknown> = {};
  for (const [k] of srv.getKeyStats() ?? []) {
    data[k] = await srv.get(k);
  }
  await fs.writeFile(path.resolve(file), JSON.stringify(data, null, 2));
  console.log('💾 dump ok');
}

async function cmdLoad(srv: any, [file]: string[]) {
  if (!file) return console.log('Usage: … load <file.json>');
  const txt = await fs.readFile(path.resolve(file), 'utf8');
  const data = JSON.parse(txt);
  await srv.flush();
  for (const [k, v] of Object.entries(data)) {
    await srv.set(k, v);
  }
  console.log('📂 snapshot loaded');
}

async function cmdCsv(srv: any, [file]: string[]) {
  if (!file) return console.log('Usage: … csv <file.csv>');
  const ks = srv.getKeyStats();
  if (!ks) return console.log('(no data)');
  const csv = GlobalCacheStatsCollector.getInstance().generateCsv([...ks.values()]);
  await fs.writeFile(path.resolve(file), csv);
  console.log('📝 CSV generated');
}

async function cmdKeyStats(srv: any, [key]: string[]) {
  if (!key) return console.log('Usage: … keystats <key>');
  console.log(srv.getKeyStats()?.get(key) ?? '⛔ not found');
}

// ----- global monitor toggle -----------------------------------------------
async function cmdMonitor(state?: string) {
  const gc = GlobalCacheStatsCollector.getInstance();
  if (state === 'on') {
    gc.enableMonitoring();
    console.log('monitor ON');
  } else if (state === 'off') {
    gc.disableMonitoring();
    console.log('monitor OFF');
  } else {
    console.log('Usage: monitor on|off');
  }
}

// ─── 5. banner & help ─────────────────────────────────────
function banner() {
  console.log('\n🟢  COMBINED DEMO – Local & Redis');
  console.log('🔗 Dashboard: http://localhost:4000/dashboard');
  console.log('Prefix required for backend commands: local …  |  redis …');
  console.log('Type `help` to see full help.\n');
}

function help(showPrompt = true) {
  console.log(`
══════════  Quick Help – Combined Demo ══════════
Prefixes:
  local  …command   ➜ operate on LOCAL service
  redis  …command   ➜ operate on REDIS service

Commands after prefix:
  set/get/del/has
  ttl/expire/persist
  list  | mass <n> | flush
  dump <file.json> | load <file.json> | csv <file.csv>
  stats | keystats [key]

Global (no prefix):
  monitor on|off        – enable / pause dashboard
  services              – list registered services
  globalstats           – metrics of all services
  help | exit | quit
══════════════════════════════════════════════
`);
  if (showPrompt) rl.prompt();
}
