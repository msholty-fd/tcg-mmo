// Duel state + low-level mutations. Pure data — no DOM, no THREE.
// Decks are lists of card *instances* ({card, iid, level}) so a copy's
// Chronicle level affects its stats and its combat record can be credited
// back to it. duel.log is the machine event stream; duel.chatter is the
// human-readable line log; duel.stats accumulates per-instance combat stats.

import { getCard } from './cards.js';

let uidCounter = 0;
const uid = () => ++uidCounter;

export function makeRng(seed = Date.now() % 2147483647) {
  let s = seed || 1;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}

// deck items: 'card_id' (fresh anonymous copy) or {card, iid, level}
function normalizeItem(item) {
  if (typeof item === 'string') return { card: item, iid: 't' + uid(), level: 0 };
  return { card: item.card, iid: item.iid, level: item.level || 0 };
}

export function createDuel(deckA, deckB, opts = {}) {
  const rng = makeRng(opts.seed);
  const duel = {
    rng,
    turn: 0,
    active: 0,
    winner: null,
    log: [],
    chatter: [],
    stats: {},                                   // iid -> {kills, hearthDmg}
    names: opts.names || ['You', 'Opponent'],
    players: [makePlayer(deckA, rng), makePlayer(deckB, rng)],
  };
  for (let s = 0; s < 2; s++) for (let i = 0; i < 4; i++) drawCard(duel, s);
  return duel;
}

function makePlayer(deckItems, rng) {
  const deck = shuffle(deckItems.map(normalizeItem), rng);
  return {
    hearth: 20,
    ember: 0,
    emberMax: 0,
    kindledThisTurn: false,
    deck,
    hand: [],
    field: [],
    reactions: [],     // face-down reaction cards ({card, iid, level}), max 2
    enchantments: [],  // face-up persistent cards ({card, iid, level}), max 4 — see engine.js
    graveyard: [],
    fatigue: 0,
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function say(duel, text) {
  duel.chatter.push(text);
  if (duel.chatter.length > 80) duel.chatter.shift();
}

export function credit(duel, iid, key, n = 1) {
  if (!iid) return;
  const s = duel.stats[iid] || (duel.stats[iid] = { kills: 0, hearthDmg: 0 });
  s[key] += n;
}

export function drawCard(duel, side) {
  const p = duel.players[side];
  if (!p.deck.length) {
    p.fatigue++;
    damageHearth(duel, side, p.fatigue);
    duel.log.push({ type: 'fatigue', side, amount: p.fatigue });
    say(duel, `${duel.names[side]}'s deck is empty — fatigue for ${p.fatigue}!`);
    return;
  }
  const c = p.deck.pop();
  if (p.hand.length >= 10) {
    p.graveyard.push(c);
    duel.log.push({ type: 'burnCard', side, card: c.card });
    say(duel, `${duel.names[side]}'s hand is full — a card burns away.`);
  } else {
    p.hand.push(c);
    duel.log.push({ type: 'draw', side, card: c.card });
  }
}

// Chronicle level bonuses: Veteran +1/+1, Storied +2/+2 (+ card's storiedKeyword)
export function unitFromCard(c, side) {
  const def = getCard(c.card);
  const bonus = c.level >= 3 ? 2 : c.level >= 2 ? 1 : 0;
  const keywords = [...(def.keywords || [])];
  if (c.level >= 3 && def.storiedKeyword && !keywords.includes(def.storiedKeyword)) {
    keywords.push(def.storiedKeyword);
  }
  return {
    uid: c.iid,
    side,
    card: c.card,
    level: c.level,
    atk: def.atk + bonus,
    hp: def.hp + bonus,
    maxhp: def.hp + bonus,
    keywords,
    sick: !keywords.includes('ambush'),
    attacksLeft: keywords.includes('ambush') ? (keywords.includes('frenzy') ? 2 : 1) : 0,
  };
}

// tokens summoned by effects are always fresh anonymous copies
export function summonUnit(duel, side, cardId) {
  const p = duel.players[side];
  if (p.field.length >= 6) return null;
  const u = unitFromCard({ card: cardId, iid: 't' + uid(), level: 0 }, side);
  p.field.push(u);
  duel.log.push({ type: 'summon', side, unit: u.uid, card: cardId });
  say(duel, `A ${getCard(cardId).name} joins ${duel.names[side]}'s side.`);
  return u;
}

export function damageUnit(duel, unit, amount, srcIid = null) {
  unit.hp -= amount;
  duel.log.push({ type: 'unitDamage', unit: unit.uid, amount, hp: unit.hp });
  if (unit.hp <= 0) credit(duel, srcIid, 'kills');
}

export function damageHearth(duel, side, amount, srcIid = null) {
  const p = duel.players[side];
  p.hearth -= amount;
  duel.log.push({ type: 'hearthDamage', side, amount, hearth: p.hearth });
  credit(duel, srcIid, 'hearthDmg', amount);
  if (p.hearth <= 0 && duel.winner === null) {
    duel.winner = 1 - side;
    duel.log.push({ type: 'gameOver', winner: duel.winner });
    say(duel, `${duel.names[side]}'s Hearth is extinguished. ${duel.names[1 - side]} wins!`);
  }
}

export function healHearth(duel, side, amount) {
  const p = duel.players[side];
  p.hearth = Math.min(20, p.hearth + amount);
  duel.log.push({ type: 'hearthHeal', side, amount, hearth: p.hearth });
}

export function findUnit(duel, unitUid) {
  for (const p of duel.players) {
    const u = p.field.find(u => u.uid === unitUid);
    if (u) return u;
  }
  return null;
}
