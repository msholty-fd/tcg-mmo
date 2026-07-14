// Emberwood Online server: presence, chat, profiles (instance-based card
// collections with Chronicle histories), PvP + NPC duel rooms, reconnect.
// node server/index.js  (ws on :8081)

import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openProfileStore } from './db.js';
import { DuelRoom } from './duelRoom.js';
import { newPlayerStarter } from '../shared/sets/core/cards.js';
import { getCard } from '../shared/engine/cards.js';
import { evaluateDeck } from '../shared/deckConstraints.js';
import { isLeaderCard } from '../shared/sets/core/leaders.js';
import { DUELISTS as CORE_DUELISTS } from '../shared/sets/core/duelists.js';
import { EMBERPEAKS_DUELISTS } from '../shared/sets/emberpeaks/duelists.js';
const DUELISTS = { ...CORE_DUELISTS, ...EMBERPEAKS_DUELISTS };
import { applyXP } from '../shared/progression.js';
import { questById, canAccept, canTurnin, progressDuelWin, progressVisit } from '../shared/quests.js';
import { PACKS, rollPack } from '../shared/sets/core/packs.js';
import { mintCard, levelOf, levelPoints, LEGEND_BUDGET, LEVEL_NAMES, renownFromDuel, HALL } from '../shared/chronicle.js';

const PORT = +(process.env.PORT || 8081);
const DIR = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = process.env.DB_FILE || path.join(DIR, 'profiles.db');
const LEGACY_DATA_FILE = process.env.DATA_FILE || path.join(DIR, 'profiles.json');
const DIST_DIR = path.join(DIR, '../client/dist');
const MAX_COPIES = 3;
const WORLD_RADIUS = 220;   // playable disc is r=210 (client/src/main.js); slack for lag

// ---- profiles (persistent, SQLite — see db.js) ----
// profile: {name, outfit, cards: [instance], deck: [iid], leaders: [iid], xp, lvl, coins, quests}
//   leaders: designated Leader instances (subset of deck) — the banner system
// The in-memory map stays the runtime source of truth (game code mutates
// profiles in place); the DB is the durable copy, written per-profile.
const store = openProfileStore(DB_FILE, LEGACY_DATA_FILE);
const profiles = store.loadAll();

const tokenOf = new Map(Object.entries(profiles).map(([t, p]) => [p, t]));
function registerProfile(token, profile) {
  profiles[token] = profile;
  tokenOf.set(profile, token);
}

const dirty = new Set();   // tokens with unsaved changes
let saveT = null;
function markDirty(profile) {
  const token = tokenOf.get(profile);
  if (!token) return console.error('markDirty: unregistered profile', profile && profile.name);
  dirty.add(token);
  if (saveT) return;
  saveT = setTimeout(flushProfiles, 1000);
}

function flushProfiles() {
  clearTimeout(saveT);
  saveT = null;
  if (!dirty.size) return;
  const entries = [...dirty].map(t => [t, profiles[t]]);
  dirty.clear();
  try {
    store.saveMany(entries);
  } catch (err) {
    console.error('profile save failed:', err.message);
    for (const [t] of entries) dirty.add(t);   // retried on the next flush
  }
}

process.on('SIGINT', () => { flushProfiles(); process.exit(0); });
process.on('SIGTERM', () => { flushProfiles(); process.exit(0); });
process.on('uncaughtException', err => {
  console.error('uncaught exception:', err);
  flushProfiles();
  process.exit(1);
});

// scrypt for new passwords; legacy single-round sha256 profiles are verified
// with the old scheme and upgraded in place on their next successful login
const hashPwLegacy = (pw, salt) => crypto.createHash('sha256').update(salt + ':' + pw).digest('hex');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

function setPassword(profile, pw) {
  profile.salt = crypto.randomBytes(16).toString('hex');
  profile.passwordHash = hashPw(pw, profile.salt);
  profile.pwAlg = 'scrypt';
  markDirty(profile);
}

function verifyPw(profile, pw) {
  if (!pw) return false;
  const expected = profile.pwAlg === 'scrypt' ? hashPw(pw, profile.salt) : hashPwLegacy(pw, profile.salt);
  const a = Buffer.from(expected), b = Buffer.from(String(profile.passwordHash || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  if (profile.pwAlg !== 'scrypt') setPassword(profile, pw);
  return true;
}

const findByName = name =>
  Object.entries(profiles).find(([, p]) => p.name.toLowerCase() === name.toLowerCase());

function newProfile(name, outfit) {
  // Roll a fresh, banner-coherent starter deck + its Leader server-side.
  const starter = newPlayerStarter();
  const cards = starter.deck.map(id => mintCard(id, 'Starter deck', name));
  // designate the leader instance(s): the first minted copy of each leader card
  const leaders = starter.leaders.map(cid => cards.find(c => c.cardId === cid)?.iid).filter(Boolean);
  return { name, outfit, cards, deck: cards.map(c => c.iid), leaders, xp: 0, lvl: 1, coins: 0, quests: {} };
}

// Validate a deck + its designated Leaders. Base rules (30 / ≤3 / Legend
// Budget) then the Leader system (gate + per-Leader constraints via the shared
// engine). leaderIids must be owned instances that are in the deck and whose
// card is a registered Leader.
function validDeck(profile, iids, leaderIids = []) {
  if (!Array.isArray(iids) || iids.length !== 30 || new Set(iids).size !== 30) return false;
  const byId = new Map(profile.cards.map(c => [c.iid, c]));
  const copies = {};
  let legend = 0;
  for (const iid of iids) {
    const inst = byId.get(iid);
    if (!inst) return false;
    copies[inst.cardId] = (copies[inst.cardId] || 0) + 1;
    if (copies[inst.cardId] > MAX_COPIES) return false;
    legend += levelPoints(levelOf(inst.renown));
  }
  if (legend > LEGEND_BUDGET) return false;

  // Leaders: each must be owned, in the deck, distinct, and a real Leader card.
  if (!Array.isArray(leaderIids)) return false;
  const deckSet = new Set(iids);
  if (new Set(leaderIids).size !== leaderIids.length) return false;
  const leaderCardIds = [];
  for (const iid of leaderIids) {
    const inst = byId.get(iid);
    if (!inst || !deckSet.has(iid) || !isLeaderCard(inst.cardId)) return false;
    leaderCardIds.push(inst.cardId);
  }
  const defs = iids.map(iid => getCard(byId.get(iid).cardId));
  return evaluateDeck(defs, leaderCardIds).valid;
}

// mint a won card into a profile; returns the instance
function grant(profile, cardId, origin) {
  const inst = mintCard(cardId, origin, profile.name);
  profile.cards.push(inst);
  markDirty(profile);
  return inst;
}

// deck items handed to the engine: instances carry their Chronicle level
function deckItems(profile) {
  const byId = new Map(profile.cards.map(c => [c.iid, c]));
  return profile.deck.map(iid => {
    const inst = byId.get(iid);
    return { card: inst.cardId, iid, level: levelOf(inst.renown) };
  });
}

// ---- http: health check + static client (client/dist, if built) ----
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const httpServer = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  const file = path.normalize(path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(DIST_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found' + (fs.existsSync(DIST_DIR) ? '' : ' — client not built (npm run build)'));
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

// browsers send Origin on WS connects; only accept our own host (any port, so
// the Vite dev client works) or an explicit ALLOWED_ORIGIN. Non-browser
// clients send no Origin — that's fine, scripts can fake it anyway.
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN) return true;
  try {
    const host = new URL(origin).hostname;
    const reqHost = String(req.headers.host || '').replace(/:\d+$/, '');
    return host === reqHost || host === 'localhost' || host === '127.0.0.1';
  } catch { return false; }
}

const clientIp = req =>
  (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '')
  || req.socket.remoteAddress;

// ---- rate limits ----
const MSG_RATE = 25, MSG_BURST = 50;            // per-connection messages/sec
const CHAT_MAX = 5, CHAT_WINDOW_MS = 5_000;     // per-connection chat lines
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
const TRADE_MAX_CARDS = 8;

// world clock: 20 real minutes per day, derived from wall time (50s per game
// hour) — no stored state, identical across restarts, shared by all players
const gameHour = () => (Date.now() / 50_000) % 24;

function send(p, msg) { if (p.ws.readyState === 1) p.ws.send(JSON.stringify(msg)); }
function broadcast(msg, except = null) {
  for (const p of players.values()) if (p !== except) send(p, msg);
}

function sendProfile(p) {
  const { xp, lvl, coins, quests, cards, deck, leaders = [] } = p.profile;
  send(p, { t: 'profileUpdate', xp, lvl, coins, quests, cards, deck, leaders });
}

// ---- trading ----
// session: {players:[a,b], offers:[{iids,coins}×2], confirmed:[bool×2]}
// any offer change resets BOTH confirmations (anti-scam); execution re-validates
// and moves cards+coins atomically, appending the recipient to owners[]

function validOffer(profile, iids, coins) {
  if (!Array.isArray(iids) || iids.length > TRADE_MAX_CARDS || new Set(iids).size !== iids.length) return false;
  if (!Number.isInteger(coins) || coins < 0 || coins > profile.coins) return false;
  const owned = new Set(profile.cards.map(c => c.iid));
  const decked = new Set(profile.deck);   // deck cards can't be traded — decks stay valid
  return iids.every(iid => typeof iid === 'string' && owned.has(iid) && !decked.has(iid));
}

function startTrade(a, b) {
  const tr = { players: [a, b], offers: [{ iids: [], coins: 0 }, { iids: [], coins: 0 }], confirmed: [false, false] };
  a.trade = tr; b.trade = tr;
  for (let s = 0; s < 2; s++) send(tr.players[s], { t: 'tradeStart', partner: tr.players[1 - s].name });
  sendTradeState(tr);
  console.log(`trade start: ${a.name} <-> ${b.name}`);
}

function sendTradeState(tr) {
  for (let s = 0; s < 2; s++) {
    const other = tr.players[1 - s];
    const byId = new Map(other.profile.cards.map(c => [c.iid, c]));
    send(tr.players[s], {
      t: 'tradeState',
      yours: { iids: [...tr.offers[s].iids], coins: tr.offers[s].coins },
      theirs: { cards: tr.offers[1 - s].iids.map(iid => byId.get(iid)).filter(Boolean), coins: tr.offers[1 - s].coins },
      confirmed: [tr.confirmed[s], tr.confirmed[1 - s]],   // [you, them]
    });
  }
}

function endTrade(tr, reason) {
  for (const p of tr.players) {
    if (p.trade !== tr) continue;
    p.trade = null;
    send(p, { t: 'tradeCancelled', reason });
  }
}

function executeTrade(tr) {
  const [a, b] = tr.players;
  if (!validOffer(a.profile, tr.offers[0].iids, tr.offers[0].coins) ||
      !validOffer(b.profile, tr.offers[1].iids, tr.offers[1].coins)) {
    return endTrade(tr, 'Trade failed validation.');
  }
  const move = (from, to, iids) => {
    for (const iid of iids) {
      const i = from.profile.cards.findIndex(c => c.iid === iid);
      const [inst] = from.profile.cards.splice(i, 1);
      inst.owners.push(to.profile.name);   // provenance grows with the trade
      to.profile.cards.push(inst);
    }
  };
  move(a, b, tr.offers[0].iids);
  move(b, a, tr.offers[1].iids);
  a.profile.coins += tr.offers[1].coins - tr.offers[0].coins;
  b.profile.coins += tr.offers[0].coins - tr.offers[1].coins;
  markDirty(a.profile);
  markDirty(b.profile);
  for (const p of tr.players) {
    p.trade = null;
    send(p, { t: 'tradeComplete' });
    sendProfile(p);
  }
  broadcast({ t: 'chat', from: '[Server]', text: `${a.name} and ${b.name} completed a trade.` });
  console.log(`trade done: ${a.name} gave ${tr.offers[0].iids.length} cards + ${tr.offers[0].coins}c, ${b.name} gave ${tr.offers[1].iids.length} cards + ${tr.offers[1].coins}c`);
}

// duel victory: XP + quest progress
function onDuelWin(w, room) {
  const winner = room.players[w];
  if (winner.ai || !winner.profile) return;
  applyXP(winner.profile, room.kind === 'npc' ? 40 : 60);
  // coin faucet — autobattle earns full rewards by decision (DESIGN.md
  // 2026-07-08: it's QoL, automation is possible either way)
  const coins = room.kind === 'npc' ? 5 : 10;
  winner.profile.coins += coins;
  const events = progressDuelWin(winner.profile, room.npcId);
  markDirty(winner.profile);
  if (winner.live) {
    if (coins) send(winner.live, { t: 'coinGain', amount: coins });
    for (const ev of events) send(winner.live, { t: 'questEvent', kind: 'progress', ...ev });
  }
}

// after every duel: write each participating instance's story into its ledger
function onChronicle(room) {
  const w = room.duel.winner;
  for (let s = 0; s < 2; s++) {
    const p = room.players[s];
    if (p.ai || !p.profile) continue;
    const byId = new Map(p.profile.cards.map(c => [c.iid, c]));
    const events = [];
    for (const item of p.deckItems) {
      const inst = byId.get(item.iid);
      if (!inst) continue;
      const stats = room.duel.stats[item.iid];
      const before = levelOf(inst.renown);
      inst.renown += renownFromDuel(stats, s === w);
      inst.record.duels++;
      if (s === w) inst.record.wins++;
      if (stats) { inst.record.kills += stats.kills; inst.record.hearthDmg += stats.hearthDmg; }
      const after = levelOf(inst.renown);
      if (after > before) {
        events.push({ iid: inst.iid, cardId: inst.cardId, level: after, levelName: LEVEL_NAMES[after] });
        // realm-wide moment: an ember waking to Veteran/Storied is rare and
        // is exactly the visible status the Hall of Legends trades in.
        // Seasoned (level 1) is deliberately not announced — too common.
        if (after >= 2) {
          broadcast({ t: 'chat', from: '[Chronicle]', text: `The fire remembers: ${p.profile.name}'s ${getCard(inst.cardId).name} is now ${LEVEL_NAMES[after]}.` });
        }
      }
    }
    markDirty(p.profile);
    if (p.live) {
      if (events.length) send(p.live, { t: 'chronicle', events });
      sendProfile(p.live);
    }
  }
}

function endRoom(room) {
  for (const p of room.players) {
    if (p.token) activeDuels.delete(p.token);
    if (p.live) p.live.room = null;
  }
}

// night matches the Sentinel/wisp window (20:00–6:00), evaluated when the
// room is created — nocturnal cards (Darkwood set) key off it for the whole
// duel. Same server-synced clock every client renders, so the duel's night
// state always agrees with the sky the players are looking at.
const isNight = () => { const h = gameHour(); return h >= 20 || h < 6; };
const roomOpts = extra => ({ onEnd: endRoom, grant, onWin: onDuelWin, onChronicle, night: isNight(), ...extra });

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
  const chatTimes = [];

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

    if (msg.t === 'join' && !me) {
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
      me = { id: nextId++, ws, token, name: profile.name, outfit: profile.outfit, x: profile.x ?? 0, z: profile.z ?? 9, yaw: profile.yaw ?? 0, profile, room: null };
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
      return;
    }
    if (!me) return;

    switch (msg.t) {
      case 'pos': {
        const x = +msg.x || 0, z = +msg.z || 0;
        const r = Math.hypot(x, z);
        const s = r > WORLD_RADIUS ? WORLD_RADIUS / r : 1;
        me.x = x * s; me.z = z * s; me.yaw = +msg.yaw || 0;
        // in-memory only at 10Hz; persisted by the disconnect markDirty and
        // whatever other saves happen along the way
        me.profile.x = me.x; me.profile.z = me.z; me.profile.yaw = me.yaw;
        // visit-quest progress rides the position stream (shared/quests.js
        // progressVisit — cheap scan, early-outs unless a visit quest is
        // active and newly satisfied). sendProfile syncs the client's quest
        // mirror; the questEvent is the chat-log ping, same as duel wins.
        const events = progressVisit(me.profile, me.x, me.z);
        if (events.length) {
          markDirty(me.profile);
          for (const ev of events) send(me, { t: 'questEvent', kind: 'progress', ...ev });
          sendProfile(me);
        }
        break;
      }
      case 'chat': {
        const now = Date.now();
        while (chatTimes.length && chatTimes[0] < now - CHAT_WINDOW_MS) chatTimes.shift();
        if (chatTimes.length >= CHAT_MAX) {
          send(me, { t: 'chat', from: '[Server]', text: 'You are chatting too fast.' });
          break;
        }
        const text = String(msg.text || '').slice(0, 200).trim();
        if (text) { chatTimes.push(now); broadcast({ t: 'chat', from: me.name, text }); }
        break;
      }
      case 'deck': {
        const leaders = Array.isArray(msg.leaders) ? msg.leaders : [];
        if (validDeck(me.profile, msg.deck, leaders)) {
          me.profile.deck = [...msg.deck];
          me.profile.leaders = [...leaders];
          markDirty(me.profile);
        } else {
          send(me, { t: 'chat', from: '[Server]', text: 'Deck rejected — invalid cards, Legend Budget, or Leader rules not met.' });
        }
        break;
      }
      case 'questAccept': {
        if (canAccept(me.profile, msg.id)) {
          me.profile.quests[msg.id] = { state: 'active', have: 0 };
          markDirty(me.profile);
          send(me, { t: 'questEvent', kind: 'accepted', id: msg.id });
          sendProfile(me);
        }
        break;
      }
      case 'questTurnin': {
        if (canTurnin(me.profile, msg.id)) {
          const q = questById(msg.id);
          me.profile.quests[msg.id].state = 'completed';
          applyXP(me.profile, q.xp);
          me.profile.coins += q.coins;
          markDirty(me.profile);
          send(me, { t: 'questEvent', kind: 'completed', id: msg.id });
          sendProfile(me);
        }
        break;
      }
      case 'buyPack': {
        // proximity vendor purchase — validated like everything else that
        // grants cards: server checks coins + range and mints authoritatively
        const pack = PACKS[msg.pack];
        if (!pack || me.room || me.trade) break;
        if (Math.hypot(me.x - pack.vendor.x, me.z - pack.vendor.z) > VENDOR_RANGE) break;
        if (me.profile.coins < pack.price) {
          send(me, { t: 'packResult', error: 'Not enough coins.' });
          break;
        }
        me.profile.coins -= pack.price;
        const pulls = rollPack(pack).map(id => grant(me.profile, id, 'Bought from ' + pack.vendor.name));
        markDirty(me.profile);
        sendProfile(me);   // coins + new cards land before the reveal renders
        send(me, { t: 'packResult', pack: pack.id, cards: pulls.map(c => ({ cardId: c.cardId, iid: c.iid })) });
        console.log(`${me.name} bought a ${pack.name} (${pulls.map(c => c.cardId).join(', ')})`);
        break;
      }
      case 'hall': {
        // Hall of Legends — a proximity-gated read of the realm's ledger
        // (Chronicler Sela in Highgate; coords shared via chronicle.js HALL).
        // Scans every profile, ranks by renown server-side, ships only the
        // top N — the read is authoritative and rank can't be spoofed. A
        // full scan per request is fine at current scale; revisit alongside
        // the interest-management trigger in DESIGN.md if profiles grow.
        if (Math.hypot(me.x - HALL.x, me.z - HALL.z) > VENDOR_RANGE) break;
        const ranked = [];
        for (const token in profiles) {
          const pr = profiles[token];
          for (const c of pr.cards || []) {
            if (c.renown > 0) ranked.push({ c, owner: pr.name });
          }
        }
        ranked.sort((a, b) => b.c.renown - a.c.renown);
        send(me, {
          t: 'hallOfLegends',
          entries: ranked.slice(0, HALL.top).map(({ c, owner }) => ({
            cardId: c.cardId, renown: c.renown, level: levelOf(c.renown),
            owner, origin: c.origin, owners: c.owners || [], record: c.record,
          })),
        });
        break;
      }
      case 'tradeRequest': {
        const target = players.get(msg.target);
        if (target && !target.room && !me.room && !target.trade && !me.trade && target !== me
            && Math.hypot(target.x - me.x, target.z - me.z) <= CHALLENGE_RANGE) {
          tradeInvites.set(me.id + ':' + target.id, Date.now() + CHALLENGE_TTL_MS);
          send(target, { t: 'tradeInvite', from: me.id, name: me.name });
          send(me, { t: 'chat', from: '[Server]', text: 'Trade offer sent to ' + target.name + '.' });
        }
        break;
      }
      case 'tradeAccept': {
        const key = msg.from + ':' + me.id;
        const expiry = tradeInvites.get(key);
        tradeInvites.delete(key);
        if (!expiry || expiry < Date.now()) break;
        const other = players.get(msg.from);
        if (other && !other.room && !me.room && !other.trade && !me.trade && other !== me) startTrade(other, me);
        break;
      }
      case 'tradeOffer': {
        const tr = me.trade;
        if (!tr) break;
        const iids = Array.isArray(msg.iids) ? msg.iids : [];
        const coins = Number.isInteger(msg.coins) ? msg.coins : 0;
        if (!validOffer(me.profile, iids, coins)) {
          send(me, { t: 'chat', from: '[Server]', text: 'Trade offer rejected — cards in your active deck can’t be traded.' });
          break;
        }
        tr.offers[tr.players.indexOf(me)] = { iids: [...iids], coins };
        tr.confirmed = [false, false];   // any change voids both confirmations
        sendTradeState(tr);
        break;
      }
      case 'tradeConfirm': {
        const tr = me.trade;
        if (!tr) break;
        tr.confirmed[tr.players.indexOf(me)] = true;
        if (tr.confirmed[0] && tr.confirmed[1]) executeTrade(tr);
        else sendTradeState(tr);
        break;
      }
      case 'tradeCancel':
        if (me.trade) endTrade(me.trade, me.name + ' cancelled the trade.');
        break;
      case 'challenge': {
        const target = players.get(msg.target);
        if (target && !target.room && !me.room && !target.trade && !me.trade && target !== me
            && Math.hypot(target.x - me.x, target.z - me.z) <= CHALLENGE_RANGE) {
          challenges.set(me.id + ':' + target.id, Date.now() + CHALLENGE_TTL_MS);
          send(target, { t: 'challenged', from: me.id, name: me.name });
        }
        break;
      }
      case 'accept': {
        // only start a duel the other side actually asked for
        const key = msg.from + ':' + me.id;
        const expiry = challenges.get(key);
        challenges.delete(key);
        if (!expiry || expiry < Date.now()) break;
        const ch = players.get(msg.from);
        if (ch && !ch.room && !me.room && !ch.trade && !me.trade && ch !== me) {
          const a = { name: ch.name, deckItems: deckItems(ch.profile), ws: ch.ws, profile: ch.profile, token: ch.token, live: ch };
          const b = { name: me.name, deckItems: deckItems(me.profile), ws: me.ws, profile: me.profile, token: me.token, live: me };
          const room = new DuelRoom(a, b, roomOpts({ kind: 'pvp' }));
          ch.room = room; me.room = room;
          activeDuels.set(ch.token, { room, side: 0 });
          activeDuels.set(me.token, { room, side: 1 });
        }
        break;
      }
      case 'npcduel': {
        const def = DUELISTS[msg.npc];
        if (!def || me.room || me.trade) break;
        const a = { name: me.name, deckItems: deckItems(me.profile), ws: me.ws, profile: me.profile, token: me.token, live: me };
        const b = { name: def.name, deckItems: [...def.deck], ws: null, ai: true };
        const room = new DuelRoom(a, b, roomOpts({ kind: 'npc', npcId: msg.npc, rewardsPool: def.rewards }));
        me.room = room;
        activeDuels.set(me.token, { room, side: 0 });
        break;
      }
      case 'duel':
        if (me.room) me.room.onAction(me.room.players.findIndex(p => p.live === me), msg.act);
        break;
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
    id: p.id, name: p.name, outfit: p.outfit, x: p.x, z: p.z, yaw: p.yaw, inDuel: !!p.room,
  }));
  broadcast({ t: 'state', players: snapshot, hour: gameHour() });
}, 100);

httpServer.listen(PORT, () => {
  console.log(`Emberwood server on :${PORT} — ws + /health + static client${fs.existsSync(DIST_DIR) ? '' : ' (client/dist not built yet)'}`);
});
