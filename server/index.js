// Emberwood Online server: presence, chat, profiles (instance-based card
// collections with Chronicle histories), PvP + NPC duel rooms, reconnect.
// node server/index.js  (ws on :8081)
//
// This file is the wiring: config, the live-player state, the socket
// lifecycle (auth/join, per-message dispatch, disconnect) and the two timers.
// The actual message handling lives in ./handlers/* — each domain module is a
// factory given `ctx` (the shared state + comms below) that returns a
// { msgType: (me, msg) => … } map. Profile persistence is ./profiles.js and
// the HTTP/static layer is ./httpStatic.js.

import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DuelRoom } from './duelRoom.js';
import { createProfiles } from './profiles.js';
import { createHttpServer, originAllowed, clientIp } from './httpStatic.js';
import { createWorldHandlers } from './handlers/world.js';
import { createCollectionHandlers } from './handlers/collection.js';
import { createTradeModule } from './handlers/trade.js';
import { createDuelModule } from './handlers/duel.js';
import { DUELISTS as CORE_DUELISTS } from '../shared/sets/core/duelists.js';
import { EMBERPEAKS_DUELISTS } from '../shared/sets/emberpeaks/duelists.js';
import { DARKWOOD_DUELISTS } from '../shared/sets/darkwood/duelists.js';
const DUELISTS = { ...CORE_DUELISTS, ...EMBERPEAKS_DUELISTS, ...DARKWOOD_DUELISTS };
import { createDevSeedHandlers } from './handlers/devSeed.js';
import { createHearthModule } from './handlers/hearth.js';

const PORT = +(process.env.PORT || 8081);
const DIR = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = process.env.DB_FILE || path.join(DIR, 'profiles.db');
const LEGACY_DATA_FILE = process.env.DATA_FILE || path.join(DIR, 'profiles.json');
const DIST_DIR = path.join(DIR, '../client/dist');

// ---- profiles (persistent, SQLite — see profiles.js / db.js) ----
// The in-memory map stays the runtime source of truth (game code mutates
// profiles in place); the DB is the durable copy, written per-profile.
const {
  profiles, registerProfile, markDirty, flushProfiles,
  setPassword, verifyPw, findByName, newProfile,
  validDeck, grant, deckItems, loadWorld, saveWorld,
} = createProfiles(DB_FILE, LEGACY_DATA_FILE);

process.on('SIGINT', () => { flushProfiles(); process.exit(0); });
process.on('SIGTERM', () => { flushProfiles(); process.exit(0); });
process.on('uncaughtException', err => {
  console.error('uncaught exception:', err);
  flushProfiles();
  process.exit(1);
});

// ---- http: health check + static client (client/dist, if built) ----
const httpServer = createHttpServer(DIST_DIR);

// ---- rate limits ----
const MSG_RATE = 25, MSG_BURST = 50;            // per-connection messages/sec
const JOIN_FAILS_MAX = 8, JOIN_FAILS_WINDOW_MS = 10 * 60_000;  // per-IP bad passwords
const joinFails = new Map();  // ip -> {count, resetAt}

function passwordAttemptsLeft(ip) {
  const e = joinFails.get(ip);
  return !e || e.resetAt < Date.now() || e.count < JOIN_FAILS_MAX;
}
function notePasswordFail(ip) {
  const now = Date.now();
  const e = joinFails.get(ip);
  if (!e || e.resetAt < now) joinFails.set(ip, { count: 1, resetAt: now + JOIN_FAILS_WINDOW_MS });
  else e.count++;
}

// ---- live state ----
const wss = new WebSocketServer({ server: httpServer, maxPayload: 16 * 1024 });
let nextId = 1;
const players = new Map();
const activeDuels = new Map();   // token -> {room, side}
const challenges = new Map();    // 'fromId:targetId' -> expiry ms
const tradeInvites = new Map();  // 'fromId:targetId' -> expiry ms
const CHALLENGE_TTL_MS = 20_000;
const CHALLENGE_RANGE = 10;      // world units; client requires 3.9, slack for pos lag
const VENDOR_RANGE = 10;         // same slack for buying from an NPC vendor

// world clock: 20 real minutes per day, derived from wall time (50s per game
// hour) — no stored state, identical across restarts, shared by all players
const gameHour = () => (Date.now() / 50_000) % 24;

function send(p, msg) { if (p.ws.readyState === 1) p.ws.send(JSON.stringify(msg)); }
function broadcast(msg, except = null) {
  for (const p of players.values()) if (p !== except) send(p, msg);
}

function sendProfile(p) {
  const { xp, lvl, coins, quests, cards, deck, leaders = [], factions = {} } = p.profile;
  send(p, { t: 'profileUpdate', xp, lvl, coins, quests, cards, deck, leaders, factions });
}

// shared context handed to every handler module (state + comms + the profile
// ops they mutate through). Domain rules live in shared/ and are imported by
// each handler directly; ctx is only the runtime wiring.
const ctx = {
  profiles, players, activeDuels, challenges, tradeInvites,
  send, broadcast, sendProfile,
  markDirty, grant, deckItems, validDeck, loadWorld, saveWorld,
  DuelRoom, gameHour, DUELISTS,
  CHALLENGE_TTL_MS, CHALLENGE_RANGE, VENDOR_RANGE,
};

const { handlers: tradeHandlers, endTrade } = createTradeModule(ctx);
// hearth before duel: the duel module reads ctx.feedFire so every kindle in
// an online duel drifts into the nearest fire's pool (drafting Phase 2)
const { handlers: hearthHandlers, feedFire } = createHearthModule(ctx);
ctx.feedFire = feedFire;
const handlers = {
  ...createWorldHandlers(ctx),
  ...createCollectionHandlers(ctx),
  ...tradeHandlers,
  ...createDuelModule(ctx).handlers,
  ...hearthHandlers,
  ...createDevSeedHandlers(ctx),   // {} unless DEV_SEED=1 (local rig only)
};

wss.on('connection', (ws, req) => {
  if (!originAllowed(req)) {
    console.log('rejected connection from origin ' + req.headers.origin);
    return ws.close(1008, 'origin not allowed');
  }
  const ip = clientIp(req);
  let me = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // token bucket: sustained MSG_RATE msgs/sec, MSG_BURST burst, else drop the
  // connection (normal client traffic peaks ~10/sec of pos updates)
  let allowance = MSG_BURST, lastMsg = Date.now();

  // one bad payload or engine throw must not take down the realm
  ws.on('message', raw => {
    const now = Date.now();
    allowance = Math.min(MSG_BURST, allowance + (now - lastMsg) / 1000 * MSG_RATE);
    lastMsg = now;
    if (--allowance < 0) {
      console.log(`rate limit: dropping ${me ? me.name : '(unjoined)'} @ ${ip}`);
      return ws.terminate();
    }
    try { handleMessage(raw); }
    catch (err) { console.error(`message error from ${me ? me.name : '(unjoined)'}:`, err); }
  });

  function handleMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.t === 'join' && !me) { handleJoin(msg); return; }
    if (!me) return;

    const handler = handlers[msg.t];
    if (handler) handler(me, msg);
  }

  function handleJoin(msg) {
    const name = String(msg.name || '').trim().slice(0, 14);
    const password = String(msg.password || '');
    const outfit = ['boarherd', 'wardens', 'redsash'].includes(msg.outfit) ? msg.outfit : 'boarherd';
    const fail = reason => { ws.send(JSON.stringify({ t: 'joinError', reason })); ws.close(); };

    // 'create' | 'login' come from the title-screen form; 'resume' is the
    // token path (saved session, reconnects). Legacy clients send no mode
    // and keep the old token-then-guess-from-name-existence behavior.
    const mode = ['create', 'login', 'resume'].includes(msg.mode) ? msg.mode : null;
    let token = typeof msg.token === 'string' && msg.token.length <= 64 ? msg.token : null;
    // Explicit intent outranks any stored device token — otherwise a
    // lingering token logs the form into whatever character it holds, no
    // matter what name/password was typed (create looked like it skipped
    // the taken-name check and accepted any password).
    if (mode === 'create' || mode === 'login') token = null;
    let profile = token ? profiles[token] : null;

    if (!profile) {
      if (mode === 'resume') return fail('Your session has expired — log in again.');
      if (!name) return fail('Choose a character name.');
      const existing = findByName(name);
      if (mode === 'create' && existing) {
        return fail(`That name is taken — return to the realm if ${existing[1].name} is yours, or choose another.`);
      }
      if (mode === 'login' && !existing) {
        return fail(`No character named ${name} — check the spelling, or create them anew.`);
      }
      if (existing) {
        // recover an existing character by name + password
        if (!passwordAttemptsLeft(ip)) return fail('Too many password attempts — try again later.');
        if (!verifyPw(existing[1], password)) {
          notePasswordFail(ip);
          return fail(mode
            ? 'Wrong password for ' + existing[1].name + '.'
            : 'Wrong password for ' + existing[1].name + ' — or the name is taken.');
        }
        [token, profile] = existing;
      } else {
        // new character
        if (password.length < 3) return fail('Choose a password (3+ characters) so you can recover this character later.');
        token = crypto.randomUUID();
        profile = newProfile(name, outfit);
        registerProfile(token, profile);
        setPassword(profile, password);   // marks the (registered) profile dirty
      }
    }
    // a new login supersedes any lingering session (covers ghost connections)
    const old = [...players.values()].find(p => p.token === token);
    if (old) {
      players.delete(old.id);
      if (old.trade) endTrade(old.trade, old.name + ' disconnected.');
      send(old, { t: 'joinError', reason: 'You logged in from another location.' });
      old.ws.terminate();
      console.log(`kick: superseded session for ${profile.name}`);
    }

    // restore last world position (fresh characters spawn at the well)
    me = { id: nextId++, ws, ip, token, name: profile.name, outfit: profile.outfit, appearance: profile.appearance || {}, x: profile.x ?? 0, z: profile.z ?? 9, yaw: profile.yaw ?? 0, profile, room: null, chatTimes: [] };
    players.set(me.id, me);
    console.log(`join: ${me.name} (#${me.id}, ${players.size} online)`);
    const { passwordHash, salt, pwAlg, ...pub } = profile;   // never ship credentials
    send(me, { t: 'welcome', id: me.id, token, online: players.size, profile: pub, hour: gameHour(), x: me.x, z: me.z, yaw: me.yaw });
    broadcast({ t: 'chat', from: '[Server]', text: me.name + ' has entered the realm.' }, me);

    const pending = activeDuels.get(token);
    if (pending && pending.room.duel.winner === null) {
      me.room = pending.room;
      pending.room.players[pending.side].live = me;
      pending.room.attach(pending.side, ws);
    }
  }

  ws.on('close', () => {
    if (!me || players.get(me.id) !== me) return;   // already superseded by a newer login
    players.delete(me.id);
    markDirty(me.profile);   // persist last position (profile.x/z/yaw)
    if (me.trade) endTrade(me.trade, me.name + ' disconnected.');
    console.log(`leave: ${me.name} (#${me.id}, ${players.size} online)`);
    if (me.room && me.room.duel.winner === null) {
      me.room.detach(me.room.players.findIndex(p => p.live === me));
    }
    broadcast({ t: 'chat', from: '[Server]', text: me.name + ' has left the realm.' });
  });
});

// heartbeat: terminate sockets that missed a ping round (dead TCP would
// otherwise hold ghost players for minutes); also expire stale challenges
setInterval(() => {
  for (const client of wss.clients) {
    if (client.isAlive === false) { client.terminate(); continue; }
    client.isAlive = false;
    client.ping();
  }
  const now = Date.now();
  for (const [k, exp] of challenges) if (exp < now) challenges.delete(k);
  for (const [k, exp] of tradeInvites) if (exp < now) tradeInvites.delete(k);
  for (const [k, e] of joinFails) if (e.resetAt < now) joinFails.delete(k);
}, 30_000);

setInterval(() => {
  if (!players.size) return;
  const snapshot = [...players.values()].map(p => ({
    id: p.id, name: p.name, outfit: p.outfit, appearance: p.appearance, x: p.x, z: p.z, yaw: p.yaw, inDuel: !!p.room,
  }));
  broadcast({ t: 'state', players: snapshot, hour: gameHour() });
}, 100);

httpServer.listen(PORT, () => {
  console.log(`Emberwood server on :${PORT} — ws + /health + static client${fs.existsSync(DIST_DIR) ? '' : ' (client/dist not built yet)'}`);
});
