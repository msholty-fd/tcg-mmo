// Headless test for the Leader / banner deck-building system.
//   node scripts/test-leaders.mjs
// Registers the core set, then checks the constraint engine, the roster's
// internal consistency, starter validity, and a battery of pos/neg cases.

import '../shared/sets/core/cards.js';            // registers the core set
import '../shared/sets/emberpeaks/cards.js';      // registers the emberpeaks set (cross-set banners)
import { getCard, allCards } from '../shared/engine/cards.js';
import { newPlayerStarter } from '../shared/sets/core/cards.js';
import { LEADERS } from '../shared/sets/core/leaders.js';
import { BANNERS, bannerOf, matchesBanner } from '../shared/sets/core/banners.js';
import { evaluateDeck, leaderRules } from '../shared/deckConstraints.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };
const defsOf = ids => ids.map(getCard);
const parity = c => (c % 2 === 0 ? 'even' : 'odd');

// ---- 1. roster consistency -------------------------------------------------
console.log('1. roster consistency');
for (const b of BANNERS) {
  ok(Object.values(LEADERS).some(L => L.banner === b.id), `banner "${b.id}" has at least one Leader`);
}
for (const [id, L] of Object.entries(LEADERS)) {
  let def; try { def = getCard(id); } catch {}
  ok(!!def, `Leader card "${id}" is registered`);
  ok(bannerOf(id) === L.banner, `Leader "${id}" belongs to its banner "${L.banner}" (got ${bannerOf(id)})`);
  // a Leader must satisfy its OWN single-card constraints (it's always in the deck)
  for (const c of L.constraints) {
    if (c.kind === 'costParity') ok(def && parity(def.cost) === c.parity, `Leader "${id}" cost ${def?.cost} matches its own ${c.parity} rule`);
    if (c.kind === 'banType') ok(def && def.type !== c.type, `Leader "${id}" isn't the ${c.type} its own rule bans`);
    if (c.kind === 'maxCost') ok(def && def.cost <= c.n, `Leader "${id}" cost ≤ its own maxCost ${c.n}`);
  }
}

// ---- 2. starter decks are valid by construction ----------------------------
console.log('2. starter validity (30 rolls)');
for (let i = 0; i < 30; i++) {
  const s = newPlayerStarter();
  ok(s.deck.length === 30, 'starter has 30 cards');
  const copies = {}; s.deck.forEach(id => copies[id] = (copies[id] || 0) + 1);
  ok(Object.values(copies).every(n => n <= 3), 'starter respects ≤3 copies');
  const res = evaluateDeck(defsOf(s.deck), s.leaders);
  ok(res.valid, 'starter passes evaluateDeck: ' + res.failures.map(f => f.text).join('; '));
}

// ---- 3. the gate: removing the Leader invalidates the deck ------------------
console.log('3. gate enforcement');
{
  const s = newPlayerStarter();
  const res = evaluateDeck(defsOf(s.deck), []);   // no Leader
  ok(!res.valid && res.failures.some(f => f.banner), 'gated cards without a Leader → invalid');
}

// ---- 4. generic satisfiability per Leader (catches self-contradictions) ----
console.log('4. every Leader can build a legal deck');
function buildFor(leaderId) {
  const L = LEADERS[leaderId];
  const cons = Object.fromEntries(L.constraints.map(c => [c.kind, c]));
  const singleton = 'singleton' in cons;
  const cap = singleton ? 1 : 3;
  const parityReq = cons.costParity?.parity;
  const banType = cons.banType?.type;
  const maxCost = cons.maxCost?.n;
  const allow = def => def
    && (!parityReq || parity(def.cost) === parityReq)
    && (!banType || def.type !== banType)
    && (maxCost == null || def.cost <= maxCost);

  const deck = [], counts = {};
  const add = id => {
    const def = getCard(id);
    if (deck.length >= 30 || (counts[id] || 0) >= cap || !allow(def)) return false;
    counts[id] = (counts[id] || 0) + 1; deck.push(id); return true;
  };
  const pool = allCards();   // all registered sets (core + emberpeaks)
  const bannerPool = pool.filter(c => matchesBanner(c, L.banner) && bannerOf(c.id) === L.banner);
  const neutralPool = pool.filter(c => bannerOf(c.id) === null);

  add(leaderId);
  // requireType (e.g. reactions) — pull from neutral pool of that type
  if (cons.requireType) {
    const t = cons.requireType.type;
    for (let p = 0; p < cap && counts && deck.filter(id => getCard(id).type === t).length < cons.requireType.n; p++)
      for (const c of neutralPool) { if (deck.filter(id => getCard(id).type === t).length >= cons.requireType.n) break; if (c.type === t) add(c.id); }
  }
  // minBanner
  const need = cons.minBanner?.n || 0;
  for (let p = 0; p < cap; p++) for (const c of bannerPool) { if (deck.filter(id => matchesBanner(getCard(id), L.banner)).length >= need) break; add(c.id); }
  // fill to 30 with neutral
  for (let p = 0; p < cap && deck.length < 30; p++) for (const c of neutralPool) { if (deck.length >= 30) break; add(c.id); }
  return deck;
}
for (const id of Object.keys(LEADERS)) {
  const deck = buildFor(id);
  const res = evaluateDeck(defsOf(deck), [id]);
  ok(deck.length === 30 && res.valid, `Leader "${id}" builds a legal 30 (n=${deck.length}): ${res.failures.map(f => f.text).join('; ')}`);
}

// ---- 5. specific negative cases --------------------------------------------
console.log('5. negative cases');
{
  // gruk bans reactions: a deck with a reaction + gruk should fail
  const gruk = buildFor('gruk');
  const reaction = allCards().find(c => c.type === 'reaction');
  const bad = [...gruk.slice(0, 29), reaction.id];
  ok(!evaluateDeck(defsOf(bad), ['gruk']).valid, 'gruk + a reaction → invalid (banType)');
}
{
  // marrow is singleton: duplicate a card
  const marrow = buildFor('marrow');
  const dupTarget = marrow.find(id => id !== 'marrow');
  const bad = [dupTarget, ...marrow.slice(0, 29)];   // now two of dupTarget
  ok(!evaluateDeck(defsOf(bad), ['marrow']).valid, 'marrow + a duplicate → invalid (singleton)');
}
ok(leaderRules('tarn').length === 2 && leaderRules('tarn').some(r => /odd|even/.test(r)), 'leaderRules(tarn) reads sensibly: ' + JSON.stringify(leaderRules('tarn')));

// ---- 6. server contract: mint a starter, run the validDeck shape ----------
console.log('6. server validDeck contract');
import { mintCard } from '../shared/chronicle.js';
import { isLeaderCard } from '../shared/sets/core/leaders.js';
// faithful mirror of server/index.js validDeck (ownership + leaders-in-deck +
// engine), to prove the minted-instance contract end to end.
function serverValidDeck(profile, iids, leaderIids) {
  if (iids.length !== 30 || new Set(iids).size !== 30) return false;
  const byId = new Map(profile.cards.map(c => [c.iid, c]));
  const copies = {};
  for (const iid of iids) {
    const inst = byId.get(iid); if (!inst) return false;
    copies[inst.cardId] = (copies[inst.cardId] || 0) + 1;
    if (copies[inst.cardId] > 3) return false;
  }
  const deckSet = new Set(iids);
  const leaderCardIds = [];
  for (const iid of leaderIids) {
    const inst = byId.get(iid);
    if (!inst || !deckSet.has(iid) || !isLeaderCard(inst.cardId)) return false;
    leaderCardIds.push(inst.cardId);
  }
  return evaluateDeck(iids.map(iid => getCard(byId.get(iid).cardId)), leaderCardIds).valid;
}
{
  const s = newPlayerStarter();
  const cards = s.deck.map(id => mintCard(id, 'Starter deck', 'Tester'));
  const leaders = s.leaders.map(cid => cards.find(c => c.cardId === cid).iid);
  const profile = { cards, deck: cards.map(c => c.iid) };
  ok(serverValidDeck(profile, profile.deck, leaders), 'minted starter passes server validDeck');
  ok(!serverValidDeck(profile, profile.deck, []), 'same deck with no leaders → rejected (gate)');
  // a leader iid that isn't in the deck is rejected
  const orphan = mintCard(s.leaders[0], 'x', 'y');
  ok(!serverValidDeck({ cards: [...cards, orphan], deck: profile.deck }, profile.deck, [orphan.iid]),
    'leader instance not in the deck → rejected');
}

// ---- 7. every Leader is starter-granted OR collectible from a duelist ------
console.log('7. champions are collectible (or starter-granted)');
import { DUELISTS as CORE_DUELISTS } from '../shared/sets/core/duelists.js';
import { EMBERPEAKS_DUELISTS } from '../shared/sets/emberpeaks/duelists.js';
import { STARTER_LEADERS } from '../shared/sets/core/leaders.js';
const DUELISTS = { ...CORE_DUELISTS, ...EMBERPEAKS_DUELISTS };
{
  for (const id of Object.keys(LEADERS)) {
    const starter = STARTER_LEADERS.includes(id);
    const droppedBy = Object.entries(DUELISTS).filter(([, d]) => d.rewards.includes(id)).map(([k]) => k);
    ok(starter || droppedBy.length > 0,
      `Leader "${id}" is starter-tier or in a duelist reward pool (dropped by: ${droppedBy.join(',') || 'none'})`);
  }
  // and every starter Leader is ALSO collectible (so any player can win it)
  for (const id of STARTER_LEADERS) {
    const droppedBy = Object.entries(DUELISTS).filter(([, d]) => d.rewards.includes(id)).map(([k]) => k);
    ok(droppedBy.length > 0, `starter Leader "${id}" is also collectible (dropped by: ${droppedBy.join(',') || 'NONE'})`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
