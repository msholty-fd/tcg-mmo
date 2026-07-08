// Client networking: presence, chat, PvP challenges, remote duels,
// profile sync (server-authoritative collection), duel reconnect.

import { $, lerp } from './utils.js';
import { scene } from './scene.js';
import { groundH } from './terrain.js';
import { humanoid, makeLabel } from './entities.js';
import { STARTERS } from './constants.js';
import { player, bots } from './state.js';
import { log, fct, updateHUD } from './ui.js';
import { getDeck, getDeckCardIds, adoptProfile } from './collection.js';
import { setQuests } from './quests.js';
import { questById } from '../../shared/quests.js';
import { getCard } from '../../shared/engine/cards.js';
import { LEVEL_NAMES } from '../../shared/chronicle.js';
import { startRemoteDuel, applyRemoteView, endRemoteDuel, duelActive } from './duel/duelManager.js';
import { setGameHour } from './main.js';   // safe cycle: called at runtime only
import { initTrade, onTradeInvite, onTradeStart, onTradeState, onTradeComplete, onTradeCancelled } from './trade.js';
import { initShop, onPackResult } from './shop.js';

// production build is served by the game server itself, so the WS lives on
// our own origin; dev keeps Vite (:5175) + server (:8081) split
const SERVER = import.meta.env.VITE_WS_URL
  || (import.meta.env.DEV
    ? `ws://${location.hostname}:8081`
    : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`);
const TOKEN_KEY = 'emberwood.token';

// token is issued by the server on successful login/creation
const getToken = () => localStorage.getItem(TOKEN_KEY);

let ws = null;
let myId = null;
let connected = false;
let joinInfo = null;         // {name, outfit} for reconnects
let reconnectT = null;
const remotes = new Map();   // id -> {id, name, mesh, x, z, tx, tz, yaw, inDuel}
let posT = 0;
let pendingChallenge = null;

export function isConnected() { return connected; }

export function startNet(name, outfit, password = '') {
  joinInfo = { name, outfit, password };
  connect();
}

function connect() {
  ws = new WebSocket(SERVER);
  ws.onopen = () => {
    connected = true;
    ws.send(JSON.stringify({
      t: 'join', token: getToken(),
      name: joinInfo.name, password: joinInfo.password, outfit: joinInfo.outfit,
      deck: getDeckCardIds(),
    }));
  };
  ws.onclose = () => {
    const wasConnected = connected;
    connected = false;
    for (const r of remotes.values()) removeRemote(r);
    remotes.clear();
    if (wasConnected) log('[Server] Connection lost — reconnecting…', 'bad');
    clearTimeout(reconnectT);
    reconnectT = setTimeout(connect, 4000);
  };
  ws.onmessage = e => {
    let msg; try { msg = JSON.parse(e.data); } catch { return; }
    handle(msg);
  };
}

function handle(msg) {
  switch (msg.t) {
    case 'joinError':
      localStorage.removeItem('emberwood.session');
      alert(msg.reason);
      location.reload();
      return;
    case 'welcome': {
      myId = msg.id;
      if (msg.token) localStorage.setItem(TOKEN_KEY, msg.token);
      joinInfo.password = '';   // token covers future reconnects
      log(`[Server] Claudemoon realm — ${msg.online} player${msg.online === 1 ? '' : 's'} online`, 'sys');
      if (msg.hour !== undefined) setGameHour(msg.hour);   // shared world clock
      if (msg.x !== undefined) {
        // server-persisted position wins (works cross-device); the per-frame
        // update loop moves the mesh to player.x/z
        player.x = msg.x; player.z = msg.z;
        if (msg.yaw !== undefined) player.yaw = msg.yaw;
      }
      // server profile is authoritative
      adoptProfile(msg.profile);
      player.xp = msg.profile.xp; player.lvl = msg.profile.lvl; player.coins = msg.profile.coins;
      setQuests(msg.profile.quests);
      updateHUD();
      break;
    }
    case 'profileUpdate': {
      const oldLvl = player.lvl;
      player.xp = msg.xp; player.lvl = msg.lvl; player.coins = msg.coins;
      if (msg.cards) adoptProfile(msg);
      setQuests(msg.quests);
      if (msg.lvl > oldLvl) {
        log('DING! You have reached level ' + msg.lvl + '!', 'ding');
        fct(player.x, groundH(player.x, player.z) + 2.6, player.z, 'LEVEL UP!', 'crit');
        $('dingflash').style.opacity = 1;
        setTimeout(() => $('dingflash').style.opacity = 0, 600);
      }
      updateHUD();
      break;
    }
    case 'questEvent': {
      const q = questById(msg.id);
      if (!q) break;
      if (msg.kind === 'accepted') log('Quest accepted: ' + q.title, 'sys');
      else if (msg.kind === 'completed') log('Quest completed: ' + q.title, 'sys');
      else if (msg.kind === 'progress') {
        log(`${q.title}: ${msg.have}/${q.duels.need}`, 'sys');
        if (msg.have >= q.duels.need) log(q.title + ' complete! Return to the quest giver.', 'sys');
      }
      break;
    }
    case 'chat':
      log(msg.from + ': ' + msg.text, msg.from === '[Server]' ? 'sys' : 'say');
      break;
    case 'state': {
      if (msg.hour !== undefined) setGameHour(msg.hour);
      const seen = new Set();
      for (const p of msg.players) {
        if (p.id === myId) continue;
        seen.add(p.id);
        let r = remotes.get(p.id);
        if (!r) { r = addRemote(p); remotes.set(p.id, r); }
        r.tx = p.x; r.tz = p.z; r.yaw = p.yaw; r.inDuel = p.inDuel;
      }
      for (const [id, r] of remotes) if (!seen.has(id)) { removeRemote(r); remotes.delete(id); }
      break;
    }
    case 'challenged':
      pendingChallenge = { from: msg.from, name: msg.name };
      $('challenge-name').textContent = msg.name;
      $('challenge').style.display = 'flex';
      setTimeout(() => { if (pendingChallenge?.from === msg.from) dismissChallenge(); }, 15000);
      break;
    case 'duelStart':
      dismissChallenge();
      startRemoteDuel(msg.foe, msg.side, msg.state, act => ws.send(JSON.stringify({ t: 'duel', act })), msg.kind);
      break;
    case 'duelState':
      applyRemoteView(msg.state);
      break;
    case 'duelEnd':
      // rewards are minted server-side; the profileUpdate that follows syncs them
      endRemoteDuel(msg);
      break;
    case 'chronicle':
      for (const ev of msg.events) {
        log(`🃏 Your ${getCard(ev.cardId).name} has become ${LEVEL_NAMES[ev.level]}!`, 'ding');
      }
      break;
    case 'coinGain':
      log(`You earned 🪙 ${msg.amount}.`, 'sys');
      fct(player.x, groundH(player.x, player.z) + 2.6, player.z, `+${msg.amount} 🪙`, 'heal');
      break;
    case 'packResult':
      onPackResult(msg);
      break;
    case 'tradeInvite': onTradeInvite(msg); break;
    case 'tradeStart': onTradeStart(msg); break;
    case 'tradeState': onTradeState(msg); break;
    case 'tradeComplete': onTradeComplete(); break;
    case 'tradeCancelled': onTradeCancelled(msg); break;
  }
}

function addRemote(p) {
  const s = STARTERS[p.outfit] || STARTERS.boarherd;
  const mesh = humanoid({ shirt: s.shirt, hat: s.hat });
  const label = makeLabel(p.name, '#8fd0f0', 22); label.position.y = 2.9; mesh.add(label);
  mesh.position.set(p.x, groundH(p.x, p.z), p.z);
  scene.add(mesh);
  const r = { id: p.id, name: p.name, mesh, x: p.x, z: p.z, tx: p.x, tz: p.z, yaw: p.yaw, inDuel: false };
  bots.push(r);
  return r;
}

function removeRemote(r) {
  scene.remove(r.mesh);
  const i = bots.indexOf(r);
  if (i >= 0) bots.splice(i, 1);
}

export function netTick(dt) {
  if (!connected) return;
  posT -= dt;
  if (posT <= 0) {
    posT = .1;
    ws.send(JSON.stringify({ t: 'pos', x: player.x, z: player.z, yaw: player.yaw }));
  }
  for (const r of remotes.values()) {
    const moving = Math.hypot(r.tx - r.x, r.tz - r.z) > .05;
    r.x = lerp(r.x, r.tx, Math.min(1, dt * 10));
    r.z = lerp(r.z, r.tz, Math.min(1, dt * 10));
    r.mesh.rotation.y = r.yaw;
    const bob = moving ? Math.abs(Math.sin(performance.now() * .012 + r.id)) * .07 : 0;
    r.mesh.position.set(r.x, groundH(r.x, r.z) + bob, r.z);
  }
}

export function nearestRemote() {
  let best = null, bd = 3.9;
  for (const r of remotes.values()) {
    if (r.inDuel) continue;
    const d = Math.hypot(r.x - player.x, r.z - player.z);
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}

export function challengePlayer(id) {
  if (!connected || duelActive) return;
  ws.send(JSON.stringify({ t: 'challenge', target: id }));
  log('Challenge sent. Waiting for them to accept…', 'sys');
}

export function requestTrade(id) {
  if (connected && !duelActive) ws.send(JSON.stringify({ t: 'tradeRequest', target: id }));
}

export function requestNpcDuel(npcId) {
  if (connected) ws.send(JSON.stringify({ t: 'npcduel', npc: npcId }));
}

export function sendChat(text) {
  if (connected && text.trim()) ws.send(JSON.stringify({ t: 'chat', text }));
}

export function sendDeckUpdate() {
  if (connected) ws.send(JSON.stringify({ t: 'deck', deck: getDeck() }));
}

export function sendQuestAccept(id) {
  if (connected) ws.send(JSON.stringify({ t: 'questAccept', id }));
}

export function sendQuestTurnin(id) {
  if (connected) ws.send(JSON.stringify({ t: 'questTurnin', id }));
}

function dismissChallenge() {
  pendingChallenge = null;
  $('challenge').style.display = 'none';
}

export function initNet() {
  $('challenge-accept').addEventListener('click', () => {
    if (pendingChallenge) {
      ws.send(JSON.stringify({ t: 'accept', from: pendingChallenge.from }));
      dismissChallenge();
    }
  });
  $('challenge-decline').addEventListener('click', dismissChallenge);
  initTrade({
    sendTradeAccept: from => connected && ws.send(JSON.stringify({ t: 'tradeAccept', from })),
    sendTradeOffer: (iids, coins) => connected && ws.send(JSON.stringify({ t: 'tradeOffer', iids, coins })),
    sendTradeConfirm: () => connected && ws.send(JSON.stringify({ t: 'tradeConfirm' })),
    sendTradeCancel: () => connected && ws.send(JSON.stringify({ t: 'tradeCancel' })),
  });
  initShop({
    isConnected: () => connected,
    sendBuyPack: pack => connected && ws.send(JSON.stringify({ t: 'buyPack', pack })),
  });
}
