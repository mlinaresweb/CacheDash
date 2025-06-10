/**
 * DEMO COMBINADA  –  CacheType.LOCAL  +  CacheType.REDIS
 * ============================================================================
 *  ▸ Dashboard único: http://localhost:4000/dashboard
 *  ▸ Dos servicios simultáneos:
 *       • LocalService   (memoria)
 *       • RedisService   (Redis)
 *
 *  Sintaxis CLI
 *  -------------
 *    local  <comando ...>   → opera en servicio LOCAL
 *    redis  <comando ...>   → opera en servicio REDIS
 *
 *  Comandos globales (sin prefijo):
 *    monitor  on|off        · activa / pausa dashboard
 *    services               · lista servicios registrados
 *    globalstats            · métricas de todos los servicios
 *    help | exit | quit
 *
 *  Todos los sub‑comandos tras el prefijo son los mismos de las demos
 *  individuales: set, get, del, list, ttl, expire, persist, has, etc.
 *
 *  Requisitos
 *  ----------
 *    Redis disponible en 127.0.0.1:6379
 *      docker run -d -p 6379:6379 --name demo-redis redis:7
 */

import { CacheServiceCreate } from '../../../src';
import { GlobalCacheStatsCollector } from '../../../src/dashboard/globalCacheStatsCollector';

import readline from 'node:readline';
import util from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';

// ─── 1. Crear servicios ─────────────────────────────────────
const localSrv = CacheServiceCreate.create({
  cacheType: 'local',
  serviceIdentifier: 'LocalService',
  enableMonitoring: true,
  maxMemorySizeMB: 64,
});

const redisSrv = CacheServiceCreate.create({
  cacheType: 'redis',
  serviceIdentifier: 'RedisService',
  enableMonitoring: true, // el primer enableMonitoring ya inició Express
  redisOptions: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: +(process.env.REDIS_PORT || 6379),
  },
});

// Util para mapear prefijo → servicio
function srvOf(prefix: string) {
  if (prefix === 'local') return localSrv;
  if (prefix === 'redis') return redisSrv;
  return null;
}

// ─── 2. CLI ────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
banner(); rl.prompt();

rl.on('line', async (raw) => {
  const line = raw.trim();
  if (!line) return rl.prompt();

  const [tok1, tok2, ...tail] = line.split(/\s+/);

  // 2.1 comandos globales (sin prefijo)
  if (tok1 === 'monitor') { await cmdMonitor(tok2); return rl.prompt(); }
  if (tok1 === 'services') { console.log(GlobalCacheStatsCollector.getInstance().getServiceRegistryKeys()); return rl.prompt(); }
  if (tok1 === 'globalstats') { console.log(GlobalCacheStatsCollector.getInstance().getAllStats()); return rl.prompt(); }
  if (tok1 === 'help') { help(); return rl.prompt(); }
  if (tok1 === 'exit' || tok1 === 'quit') { rl.close(); return; }

  // 2.2 debe existir prefijo local|redis
  const srv = srvOf(tok1);
  if (!srv) { console.log('Prefijo requerido: local …  |  redis …'); help(false); return rl.prompt(); }

  const cmd = tok2?.toLowerCase();
  const args = tail;

  try {
    switch (cmd) {
      case 'set':       await cmdSet(srv, [tok2, ...tail].join(' ')); break;
      case 'get':       await cmdGet(srv, args);                      break;
      case 'del':       await cmdDel(srv, args);                      break;
      case 'ttl':       await cmdTtl(srv, args);                      break;
      case 'expire':    await cmdExpire(srv, args);                   break;
      case 'persist':   await cmdPersist(srv, args);                  break;
      case 'has':       await cmdHas(srv, args);                      break;

      case 'list':      await cmdList(srv);                           break;
      case 'mass':      await cmdMass(srv, args);                     break;
      case 'flush':     await srv.flush(); console.log('🧹 ok');      break;

      case 'dump':      await cmdDump(srv, args);                     break;
      case 'load':      await cmdLoad(srv, args);                     break;
      case 'csv':       await cmdCsv(srv, args);                      break;
      case 'stats':     console.log(srv.getStats());                  break;
      case 'keystats':  await cmdKeyStats(srv, args);                 break;

      default: console.log('Comando desconocido'); help(false);
    }
  } catch (err) {
    console.error('❌', (err as Error).message);
  }
  rl.prompt();
});

rl.on('close', () => { console.log('👋 Fin demo combinada'); process.exit(0); });

// ─── 3. Implementación de util‑comandos (idénticos a antes) ──
async function cmdSet(srv: any, restLine: string) {
  const m = restLine.match(/set\s+(\S+)\s+(.+?)(?:\s+(\d+))?$/);
  if (!m) return console.log('Uso: local|redis set <k> <json> [ttl]');
  const [, key, jsonStr, ttlStr] = m;
  const ttl = ttlStr ? Number(ttlStr) : undefined;
  let val; try { val = JSON.parse(jsonStr); } catch { return console.log('JSON inválido'); }
  await srv.set(key, val, ttl); console.log(`✔ ${key}`);
}
async function cmdGet(srv: any, [key]: string[]) {
  if (!key) return console.log('Uso: … get <k>');
  console.log(util.inspect(await srv.get(key), { depth: null, colors: true }));
}
async function cmdDel(srv: any, [key]: string[]) {
  if (!key) return console.log('Uso: … del <k>');
  await srv.del(key); console.log('🗑️ ok');
}
async function cmdTtl(srv: any, [key]: string[]) {
  if (!key) return console.log('Uso: … ttl <k>');
  const k = srv.getKeyStats()?.get(key);
  console.log(k ? `${k.ttl}s` : '⛔ no existe');
}
async function cmdExpire(srv: any, [key, ttlStr]: string[]) {
  if (!key || !ttlStr) return console.log('Uso: … expire <k> <ttl>');
  const ttl = Number(ttlStr); const val = await srv.get(key);
  if (val === undefined) return console.log('⛔ no existe');
  await srv.set(key, val, ttl); console.log('✔ ttl actualizado');
}
async function cmdPersist(srv: any, [key]: string[]) {
  if (!key) return console.log('Uso: … persist <k>');
  const val = await srv.get(key);
  if (val === undefined) return console.log('⛔ no existe');
  await srv.set(key, val); console.log('♾️ ttl removido');
}
async function cmdHas(srv: any, [key]: string[]) { if (!key) return; console.log(await srv.hasKey(key)); }
async function cmdList(srv: any) {
  const ks = srv.getKeyStats();
  if (!ks || ks.size === 0) return console.log('(sin claves)');
  console.table([...ks.values()].map(({ keyName, ttl, hits, misses }) => ({
    key: keyName, ttlS: ttl, hits, misses,
  })));
}
async function cmdMass(srv: any, [nStr]: string[]) {
  const n = Number(nStr); if (!n) return console.log('Uso: … mass <n>');
  for (let i = 0; i < n; i++)
    await srv.set(`mass:${i}`, { rnd: randomBytes(16).toString('hex') }, 30);
  console.log(`🚀 ${n} claves añadidas`);
}
async function cmdDump(srv: any, [file]: string[]) {
  if (!file) return console.log('Uso: … dump <f.json>');
  const data: Record<string, unknown> = {};
  for (const [k] of srv.getKeyStats() ?? []) data[k] = await srv.get(k);
  await fs.writeFile(path.resolve(file), JSON.stringify(data, null, 2)); console.log('💾 dump ok');
}
async function cmdLoad(srv: any, [file]: string[]) {
  if (!file) return console.log('Uso: … load <f.json>');
  const txt = await fs.readFile(path.resolve(file), 'utf8');
  const data = JSON.parse(txt);
  await srv.flush();
  for (const [k, v] of Object.entries(data)) await srv.set(k, v);
  console.log('📂 snapshot cargado');
}
async function cmdCsv(srv: any, [file]: string[]) {
  if (!file) return console.log('Uso: … csv <f.csv>');
  const ks = srv.getKeyStats(); if (!ks) return console.log('(sin datos)');
  const csv = GlobalCacheStatsCollector.getInstance().generateCsv([...ks.values()]);
  await fs.writeFile(path.resolve(file), csv); console.log('📝 CSV generado');
}
async function cmdKeyStats(srv: any, [key]: string[]) {
  if (!key) return console.log('Uso: … keystats <k>');
  console.log(srv.getKeyStats()?.get(key) ?? '⛔ no existe');
}

// ----- global monitor toggle -----------------------------------------------
async function cmdMonitor(state?: string) {
  const gc = GlobalCacheStatsCollector.getInstance();
  if (state === 'on')      { gc.enableMonitoring();  console.log('monitor ON'); }
  else if (state === 'off'){ gc.disableMonitoring(); console.log('monitor OFF'); }
  else console.log('Uso: monitor on|off');
}

// ─── 5. banner & ayuda ─────────────────────────────────────
function banner() {
  console.log('\n🟢  DEMO COMBO – Local & Redis');
  console.log('🔗 Dashboard: http://localhost:4000/dashboard');
  console.log('Prefijo obligatorio para comandos de backend: local …  |  redis …');
  console.log('Escribe `help` para ver la ayuda completa.\n');
}
function help(showPrompt = true) {
  console.log(`
══════════  Ayuda rápida – Demo COMBO (es) ══════════
 Prefijos:
   local  …comando   ➜ opera en servicio LOCAL
   redis  …comando   ➜ opera en servicio REDIS

 Comandos (tras prefijo):
   set/get/del/has
   ttl/expire/persist
   list  | mass <n> | flush
   dump <f.json> | load <f.json> | csv <f.csv>
   stats | keystats [clave]

 Globales (sin prefijo):
   monitor on|off        – activar / detener dashboard
   services              – servicios registrados
   globalstats           – métricas de todos los servicios
   calls [--all]         – llamadas combinadas
   help  | exit | quit
══════════════════════════════════════════════════════
`);
  if (showPrompt) rl.prompt();
}
