/**
 * DEMO TODO‑EN‑UNO  –  CacheType.LOCAL
 * ============================================================================
 *  ❯ Dashboard: http://localhost:4000/dashboard
 *
 *  Comandos rápidos (escribe "help" para la lista completa):
 *    set        <key> <json> [ttl]      · crea/actualiza
 *    get        <key>                   · lee
 *    del        <key>                   · borra
 *    list                               · tabla keys
 *    ttl        <key>                   · TTL restante
 *    expire     <key> <ttl>             · cambia TTL
 *    persist    <key>                   · TTL infinito
 *    has        <key>                   · existencia
 *    flush                              · vacía cache
 *    mass       <n>                     · stress‑test
 *    dump       <file.json>             · exporta snapshot
 *    load       <file.json>             · importa snapshot
 *    csv        <file.csv>              · key‑stats → CSV
 *    stats                              · stats globales
 *    keystats   [key]                   · stats de una clave
 *    config     show|ttl <seg>|maxmem <MB>
 *    calls      [--all]                 · historial llamadas
 *    monitor    on|off                  · toggle dashboard
 *    services                           · lista servicios
 *    globalstats                        · stats de todos
 *    help  ·  exit
 * ============================================================================
 */


/**
 * ============================================================================
// # ─── CRUD BÁSICO ───────────────────────────────────────────
// set user:1 {"id":1,"name":"Ada"} 60          # crea ‑ ttl 60 s
// get user:1                                   # lee
// set user:1 {"id":1,"name":"Ada Lovelace"}    # actualiza (ttl infinito)
// ttl user:1                                   # ttl restante
// expire user:1 120                            # nuevo ttl 120 s
// persist user:1                               # quita ttl (∞)
// has user:1                                   # comprueba existencia
// del user:1                                   # borra
// get user:1                                   # miss

// # ─── LISTADO Y MÉTRICAS ───────────────────────────────────
// set product:42 {"sku":42,"price":99.9} 30
// set flag true                                # valor booleano
// list                                         # tabla resumen
// stats                                        # stats globales
// keystats product:42                          # stats de una clave

// # ─── GESTIÓN EN MASA / STRESS TEST ─────────────────────────
// mass 50                                      # 50 claves aleatorias, ttl 30 s
// flush                                        # limpia todo

// # ─── SNAPSHOT / IMPORT‑EXPORT ─────────────────────────────
// dump snapshot.json                           # exporta a disco
// load snapshot.json                           # importa
// csv stats.csv                                # key‑stats → CSV

// # ─── CONFIG EN CALIENTE ───────────────────────────────────
// config show                                  # ver TTL por defecto & memoria
// config ttl 300                               # TTL por defecto 5 min
// config maxmem 256                            # 256 MB límite memoria

// # ─── MONITORIZACIÓN Y SERVICIOS ───────────────────────────
// monitor off                                  # detener dashboard
// monitor on                                   # reactivar
// services                                     # lista de servicios registrados
// globalstats                                  # stats de todos los servicios

// # ─── HISTORIAL DE LLAMADAS ─────────────────────────────────
// calls                                        # últimas 24 h (servicio actual)
// calls --all                                  # combinado de todos

// # ─── SALIR ────────────────────────────────────────────────
// help                                         # recordatorio de ayuda
// exit                                         # cierra la demo

// ----------------------------------------------------------------------------
 */

import { CacheServiceCreate, CacheType } from '../../../src';
import { GlobalCacheStatsCollector }     from '../../../src/dashboard/globalCacheStatsCollector';
import { LocalCacheService }             from '../../../src/local/localCacheService';

import readline       from 'node:readline';
import util           from 'node:util';
import path           from 'node:path';
import { promises as fs } from 'node:fs';
import { randomBytes }    from 'node:crypto';

// ----------------------------------------------------------------------------
// 1. Instancia de cache + monitor
// ----------------------------------------------------------------------------
const cache = CacheServiceCreate.create({
  cacheType       : 'local',
  serviceIdentifier: 'DemoService',
  defaultTTL      : 0,
  enableMonitoring: true,
  maxMemorySizeMB : 128,
});

// Acceso directo al LocalCacheService interno para funciones avanzadas
const localSvc = (cache as any).localCacheService as LocalCacheService;

// ----------------------------------------------------------------------------
// 2. CLI
// ----------------------------------------------------------------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
banner();
prompt();

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
      default:          console.log('Comando desconocido'); help(false);
    }
  } catch (err) {
    console.error('❌', (err as Error).message);
  }
  prompt();
});

rl.on('close', () => { console.log('👋 Bye'); process.exit(0); });

// ----------------------------------------------------------------------------
// 3. Implementación de comandos
// ----------------------------------------------------------------------------
async function cmdSet(line: string) {
  const m = line.match(/^set\s+(\S+)\s+(.+?)(?:\s+(\d+))?$/);
  if (!m) return usage('set');
  const [, key, jsonStr, ttlStr] = m;
  const ttl = ttlStr ? Number(ttlStr) : undefined;
  let val; try { val = JSON.parse(jsonStr); } catch { return console.log('JSON inválido'); }
  await cache.set(key, val, ttl);
  console.log(`✔ ${key}${ttl ? ` ttl=${ttl}s` : ''}`);
}

async function cmdGet([key]: string[]) {
  if (!key) return usage('get');
  console.log(util.inspect(await cache.get(key), { depth: null, colors: true }));
}

async function cmdDel([key]: string[]) {
  if (!key) return usage('del');
  await cache.del(key); console.log('🗑️  ok');
}

async function cmdList() {
  const ks = cache.getKeyStats();
  if (!ks || ks.size === 0) return console.log('(vacío)');
  console.table([...ks.values()].map(({ keyName, size, ttl, hits, misses }) => ({
    key: keyName, sizeB: size, ttlS: ttl, hits, misses,
  })));
}

async function cmdTtl([key]: string[]) {
  if (!key) return usage('ttl');
  const k = cache.getKeyStats()?.get(key);
  console.log(k ? `${k.ttl}s` : '⛔ no existe');
}

async function cmdExpire([key, ttlStr]: string[]) {
  if (!key || !ttlStr) return usage('expire');
  const ttl = Number(ttlStr);
  const val = await cache.get(key);
  if (val === undefined) return console.log('⛔ no existe');
  await cache.set(key, val, ttl); console.log('✔ ttl actualizado');
}

async function cmdPersist([key]: string[]) {
  if (!key) return usage('persist');
  const val = await cache.get(key);
  if (val === undefined) return console.log('⛔ no existe');
  await cache.set(key, val); console.log('♾️ ttl removido');
}

async function cmdHas([key]: string[]) {
  if (!key) return usage('has');
  console.log(await cache.hasKey(key));
}

async function cmdMass([nStr]: string[]) {
  const n = Number(nStr); if (!n) return usage('mass');
  for (let i = 0; i < n; i++)
    await cache.set(`mass:${i}`, { dummy: randomBytes(32).toString('hex') }, 30);
  console.log(`🚀 ${n} claves añadidas`);
}

async function cmdDump([file]: string[]) {
  if (!file) return usage('dump');
  const data: Record<string, unknown> = {};
  for (const [k] of cache.getKeyStats() ?? [])
    data[k] = await cache.get(k);
  await fs.writeFile(path.resolve(file), JSON.stringify(data, null, 2));
  console.log('💾 dump ok');
}

async function cmdLoad([file]: string[]) {
  if (!file) return usage('load');
  const txt = await fs.readFile(path.resolve(file), 'utf8');
  const data = JSON.parse(txt);
  await cache.flush();
  for (const [k, v] of Object.entries(data))
    await cache.set(k, v);
  console.log('📂 snapshot cargado');
}

async function cmdCsv([file]: string[]) {
  if (!file) return usage('csv');
  const ks = cache.getKeyStats();
  if (!ks) return console.log('(sin datos)');
  const csv = GlobalCacheStatsCollector.getInstance().generateCsv([...ks.values()]);
  await fs.writeFile(path.resolve(file), csv);
  console.log('📝 CSV generado');
}

async function cmdKeyStats([key]: string[]) {
  if (!key) return usage('keystats');
  const k = cache.getKeyStats()?.get(key);
  console.log(k ?? '⛔ no existe');
}

async function cmdConfig([sub, val]: string[]) {
  if (!sub) return usage('config');
  switch (sub) {
    case 'show':
      console.log(localSvc.getConfig()); break;
    case 'ttl':
      if (!val) return usage('config');
      localSvc.updateConfig(Number(val));
      console.log('TTL por defecto actualizado'); break;
    case 'maxmem':
      if (!val) return usage('config');
      localSvc.updateConfig(undefined, Number(val));
      console.log('MaxMemory actualizado'); break;
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

// ----------------------------------------------------------------------------
// 4. utilidades
// ----------------------------------------------------------------------------
function banner() {
  console.log('\n🟢  Cache Demo (LOCAL) – servicio “DemoService”');
  console.log('🔗 Dashboard: http://localhost:4000/dashboard\n');
}
function prompt() { rl.prompt(); }
function usage(cmd: string) {
  const map: Record<string, string> = {
    set   : 'set <key> <json> [ttl]',
    get   : 'get <key>',
    del   : 'del <key>',
    ttl   : 'ttl <key>',
    expire: 'expire <key> <ttl>',
    persist:'persist <key>',
    has   : 'has <key>',
    mass  : 'mass <n>',
    dump  : 'dump <file.json>',
    load  : 'load <file.json>',
    csv   : 'csv <file.csv>',
    keystats:'keystats <key>',
    config:'config show|ttl <seg>|maxmem <MB>',
    monitor:'monitor on|off',
  };
  console.log('Uso:', map[cmd] ?? cmd);
}
function help(showPrompt = true) {
  console.log(`
══════════  Ayuda rápida – Demo LOCAL (es) ══════════
 Básico:
   set <key> <json> [ttl]       ➜ crea / actualiza
   get <key>                    ➜ lee clave
   del <key>                    ➜ elimina clave
   has <key>                    ➜ existe?
   list                         ➜ tabla de claves

 TTL y expiración:
   ttl <key>                    ➜ TTL restante
   expire <key> <ttl>           ➜ cambia TTL
   persist <key>                ➜ quita TTL (∞)

 Utilidades:
   mass <n>                     ➜ genera n claves dummy
   flush                        ➜ borra todo
   dump <file.json>             ➜ export snapshot
   load <file.json>             ➜ importa snapshot
   csv  <file.csv>              ➜ key‑stats → CSV

 Diagnóstico:
   stats                        ➜ stats globales
   keystats <key>               ➜ stats clave
   calls [--all]                ➜ historial de llamadas
   services / globalstats       ➜ infos de todos los servicios

 Config & monitor:
   config show|ttl <seg>|maxmem <MB>
   monitor on|off               ➜ dashboard toggle

 Otros:
   help   / exit / quit
═════════════════════════════════════════════════════`);
  if (showPrompt) rl.prompt();
}
