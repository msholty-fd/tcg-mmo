#!/usr/bin/env node
// Dev rig — one command to a testable game state (see VERIFICATION.md).
//
// Starts a throwaway WS server (scratch DB, DEV_SEED=1) + a Vite client on
// alternate ports, mints a character, seeds it to the requested progression
// state over the env-gated `devSeed` message, and prints the token plus a
// paste-ready `__test.loginAs(...)` snippet for the browser console/eval.
// Replaces the old create → stop server → edit sqlite → restart → hand-write
// localStorage dance (6 steps → 1 command).
//
// The rig NEVER touches the real dev DB: the server runs on
// server/profiles.dev-rig.db (gitignored via profiles*.db pattern — verify).
// DEV_SEED is set only here; production deploys set nothing (DEPLOYMENT.md).
//
//   node scripts/dev-rig.mjs                            # bare character
//   node scripts/dev-rig.mjs --name Fit --standing wardens=300,redsash=120 \
//     --coins 500 --xp 800 --cards weir,sentinel --appearance back=ward_mantle
//   node scripts/dev-rig.mjs --seed-only --name Fit2 …  # servers already up
//   node scripts/dev-rig.mjs --fresh …                  # wipe the scratch DB first
//
// Flags: --ws <port=8082> --web <port=5176> --name <str> --standing k=v,…
//        --coins n --xp n --cards id,… --appearance slot=itemId,…
//        --fresh (wipe scratch DB) --seed-only (skip starting servers)

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB = path.join(ROOT, 'server', 'profiles.dev-rig.db');

// ---- args -------------------------------------------------------------------
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const k = argv[i].slice(2);
  const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  args[k] = v;
}
const kv = s => Object.fromEntries(String(s || '').split(',').filter(Boolean).map(p => p.split('=')));
const WS_PORT = +args.ws || 8082;
const WEB_PORT = +args.web || 5176;
const NAME = args.name || 'Rig' + Math.floor(Math.random() * 1e4);
const PASSWORD = 'devrig';

// ---- servers ----------------------------------------------------------------
const children = [];
function run(label, cmd, cmdArgs, env) {
  const c = spawn(cmd, cmdArgs, { cwd: ROOT, env: { ...process.env, ...env } });
  c.stdout.on('data', d => process.stdout.write(`[${label}] ${d}`));
  c.stderr.on('data', d => process.stderr.write(`[${label}] ${d}`));
  c.on('exit', code => { if (code) { console.error(`[${label}] exited ${code}`); shutdown(1); } });
  children.push(c);
  return c;
}
function shutdown(code = 0) {
  for (const c of children) { try { c.kill('SIGINT'); } catch {} }
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const waitPort = (url, tries = 50) => new Promise((res, rej) => {
  const tick = async n => {
    try { await fetch(url); return res(); }
    catch { n ? setTimeout(() => tick(n - 1), 200) : rej(new Error('timeout waiting for ' + url)); }
  };
  tick(tries);
});

if (!args['seed-only']) {
  // fail fast on zombie servers — a stale rig on these ports would silently
  // serve OLD code and old in-memory characters
  for (const [port, what] of [[WS_PORT, 'WS server'], [WEB_PORT, 'Vite']]) {
    const busy = await fetch(`http://localhost:${port}/`).then(() => true, () => false);
    if (busy) {
      console.error(`port ${port} already serving (${what}) — stop the old rig first, or use --seed-only to reuse it`);
      process.exit(1);
    }
  }
  if (args.fresh) for (const f of [DB, DB + '-wal', DB + '-shm']) fs.rmSync(f, { force: true });
  run('ws', 'node', ['server/index.js'], { PORT: String(WS_PORT), DB_FILE: DB, DEV_SEED: '1' });
  run('web', 'npx', ['vite', 'client', '--port', String(WEB_PORT), '--strictPort'],
    { VITE_WS_URL: `ws://localhost:${WS_PORT}` });
  await waitPort(`http://localhost:${WS_PORT}/health`);
  await waitPort(`http://localhost:${WEB_PORT}/`);
}

// ---- mint + seed --------------------------------------------------------------
const seed = {
  factions: Object.fromEntries(Object.entries(kv(args.standing)).map(([k, v]) => [k, +v])),
  coins: args.coins !== undefined ? +args.coins : undefined,
  xp: args.xp !== undefined ? +args.xp : undefined,
  cards: args.cards ? String(args.cards).split(',').filter(Boolean) : undefined,
  appearance: args.appearance ? kv(args.appearance) : undefined,
};

// create, or log back in when the name already exists (re-running the rig
// with the same --name is idempotent)
function mintAndSeed(mode) {
  return new Promise((resolve, reject) => {
    const sock = new WebSocket(`ws://localhost:${WS_PORT}`);
    const out = {};
    const timer = setTimeout(() => reject(new Error('seed timeout — is the WS server up?')), 10_000);
    sock.on('open', () => sock.send(JSON.stringify({ t: 'join', mode, name: NAME, password: PASSWORD, outfit: 'wardens' })));
    const maybeDone = () => {
      if (!out.seeded || !out.profile) return;   // profileUpdate and devSeeded arrive in either order
      clearTimeout(timer);
      sock.close();
      resolve(out);
    };
    sock.on('message', raw => {
      const m = JSON.parse(raw);
      if (m.t === 'joinError') { clearTimeout(timer); reject(new Error(m.reason)); }
      if (m.t === 'welcome') { out.token = m.token; sock.send(JSON.stringify({ t: 'devSeed', seed })); }
      if (m.t === 'devSeeded') { out.seeded = true; maybeDone(); }
      if (m.t === 'profileUpdate') {
        out.profile = { lvl: m.lvl, coins: m.coins, factions: m.factions, cards: m.cards.length };
        maybeDone();
      }
    });
    sock.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

let result;
try {
  result = await mintAndSeed('create');
} catch (err) {
  if (/name is taken/i.test(err.message)) {
    console.log(`[rig] ${NAME} exists — logging in instead`);
    result = await mintAndSeed('login').catch(e => { console.error('[rig] login failed:', e.message); shutdown(1); return Promise.reject(e); });
  } else {
    console.error('[rig] seed failed:', err.message);
    shutdown(1);
    process.exit(1);
  }
}

console.log(`
── dev rig ready ───────────────────────────────────────────────
  character  ${NAME}  (password: ${PASSWORD})
  token      ${result.token}
  profile    lvl ${result.profile.lvl} · ${result.profile.coins} coins · ${result.profile.cards} cards
  standing   ${JSON.stringify(result.profile.factions)}
  client     http://localhost:${WEB_PORT}
  ws server  ws://localhost:${WS_PORT}  (scratch DB: server/profiles.dev-rig.db)

  in the browser console (dev build installs window.__test):
    __test.loginAs('${result.token}', '${NAME}')
────────────────────────────────────────────────────────────────`);

if (args['seed-only']) process.exit(0);
console.log('servers running — Ctrl-C to stop both\n');
