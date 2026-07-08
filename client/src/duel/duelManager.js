// Bridges world <-> engine <-> UI. Two modes:
//  - local:  NPC duels — engine + bot AI run right here
//  - remote: PvP duels — server is authoritative; we send actions and
//            render the sanitized views it broadcasts

import '../../../shared/sets/core/cards.js';        // register core set
import '../../../shared/sets/emberpeaks/cards.js';  // register Emberpeaks set
import { createDuel } from '../../../shared/engine/state.js';
import { startTurn, endTurn, playCard, kindle, attack } from '../../../shared/engine/engine.js';
import { takeTurn } from '../../../shared/engine/ai.js';
import { openDuel, closeDuel, updateDuel, render, setMsg, showResult, initDuelUI } from './duelUI.js';
import { getDeckItems, grantCard } from '../collection.js';
import { player } from '../state.js';
import { log } from '../ui.js';
import { ri } from '../utils.js';

export let duelActive = false;

let duel = null;         // local mode: the real engine state
let currentFoe = null;   // local mode: duelist definition {id, name, deck, rewards}
const ME = 0, FOE = 1;

// ---------- local (NPC) duels ----------
let localAuto = false;

export function startDuel(duelist) {
  if (duelActive) return;
  duelActive = true;
  localAuto = false;
  currentFoe = duelist;
  duel = createDuel(getDeckItems(), [...duelist.deck], { names: [player.name, duelist.name] });
  startTurn(duel);   // player goes first
  openDuel(duel, ME, duelist.name, {
    onPlay(i, target) { if (playCard(duel, ME, i, target)) afterAction(); else setMsg("Can't play that."); },
    onKindle(i) { if (kindle(duel, ME, i)) afterAction(); },
    onAttack(unit, target) { if (attack(duel, ME, unit, target)) afterAction(); else setMsg('Invalid attack — Guardians first.'); },
    onEndTurn() {
      endTurn(duel);
      render();
      setMsg(currentFoe.name + ' is thinking…');
      setTimeout(botTurn, 700);
    },
    onConcede() { duel.winner = FOE; finish(); },
    onAuto(on) { localAuto = on; if (on) setTimeout(autoTurn, 500); },
    onClose() { closeDuel(); duelActive = false; duel = null; },
  });
  setMsg('Your turn. Kindle a card to grow your Ember.');
  log('Duel started against ' + duelist.name + '!', 'sys');
}

function autoTurn() {
  if (!duel || duel.winner !== null || !localAuto || duel.active !== ME) return;
  takeTurn(duel, ME);
  render();
  if (duel.winner !== null) { finish(); return; }
  setMsg(currentFoe.name + ' is thinking…');
  setTimeout(botTurn, 700);
}

function botTurn() {
  if (!duel || duel.winner !== null) { finish(); return; }
  takeTurn(duel, FOE);
  render();
  if (duel.winner !== null) { finish(); return; }
  if (localAuto) { setMsg('Autobattling…'); setTimeout(autoTurn, 700); }
  else setMsg('Your turn.');
}

function afterAction() {
  render();
  setMsg('');
  if (duel.winner !== null) finish();
}

function finish() {
  if (!duel) return;
  const won = duel.winner === ME;
  const rewards = [];
  if (won) {
    const pool = currentFoe.rewards || currentFoe.deck;
    for (let i = 0; i < 2; i++) {
      const id = pool[ri(0, pool.length - 1)];
      grantCard(id);
      rewards.push(id);
    }
    log('You defeated ' + currentFoe.name + ' and won ' + rewards.length + ' cards!', 'ding');
    log('(Offline duel — XP and quest progress require a connection.)', 'sys');
  } else {
    log(currentFoe.name + ' has bested you at the table.', 'bad');
  }
  render();
  showResult(won, rewards);
}

// ---------- remote (PvP) duels ----------
export function startRemoteDuel(foeName, side, view, sendAction, kind = 'pvp') {
  duelActive = true;
  duel = null;
  const ser = t => !t ? null : t.hearth !== undefined ? { hearth: t.hearth } : { unitUid: t.unit.uid };
  openDuel(view, side, kind === 'pvp' ? foeName + ' ⚔ (player)' : foeName, {
    onPlay(i, target) { sendAction({ kind: 'play', i, target: ser(target) }); },
    onKindle(i) { sendAction({ kind: 'kindle', i }); },
    onAttack(unit, target) { sendAction({ kind: 'attack', unitUid: unit.uid, target: ser(target) }); },
    onEndTurn() { sendAction({ kind: 'end' }); },
    onConcede() { sendAction({ kind: 'concede' }); },
    onAuto(on) { sendAction({ kind: 'auto', on }); },
    onClose() { closeDuel(); duelActive = false; },
  });
  setMsg(view.active === side ? 'Your turn.' : foeName + "'s turn…");
  log((kind === 'pvp' ? 'PvP duel' : 'Duel') + ' started against ' + foeName + '!', kind === 'pvp' ? 'ding' : 'sys');
}

export function applyRemoteView(view) {
  updateDuel(view);
}

// msg: {won, foe, rewards} — rewards, XP, and quest progress are all
// handled server-side; the profileUpdate that follows syncs our numbers
export function endRemoteDuel(msg) {
  if (msg.won) log('You defeated ' + msg.foe + ' and won ' + msg.rewards.length + ' cards!', 'ding');
  else log(msg.foe + ' has bested you at the table.', 'bad');
  showResult(msg.won, msg.rewards);
}

export function initDuels() { initDuelUI(); }
