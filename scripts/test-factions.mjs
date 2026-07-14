// Headless test for the Faction standing/rank progression system.
//   node scripts/test-factions.mjs
// Covers: the card→faction map, rank derivation, the deck gate (including
// the champion vouch), standing earn math from real duel logs, and the
// server validDeck contract with faction ranks.

import '../shared/sets/core/cards.js';
import '../shared/sets/emberpeaks/cards.js';
import '../shared/sets/darkwood/cards.js';
import { getCard, allCards } from '../shared/engine/cards.js';
import { newPlayerStarter, STARTER_DECKS } from '../shared/sets/core/cards.js';
import { LEADERS, STARTER_LEADERS } from '../shared/sets/core/leaders.js';
import { FACTIONS, factionOf, rankOf, standingRank, effectiveRanks, earnStanding, championFactionOf, RANK_THRESHOLDS, RANK_NAMES, MAX_RANK } from '../shared/factions.js';
import { evaluateDeck } from '../shared/deckConstraints.js';
import { createDuel } from '../shared/engine/state.js';
import { startTurn } from '../shared/engine/engine.js';
import { takeTurn } from '../shared/engine/ai.js';
import { mintCard } from '../shared/chronicle.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };
const defsOf = ids => ids.map(getCard);

// ---- 1. the map: every card resolves to a faction or neutral ---------------
console.log('1. card → faction map');
const FIDS = new Set(FACTIONS.map(f => f.id));
let counts = { neutral: 0 };
for (const c of allCards()) {
  const f = factionOf(c.id);
  ok(f === null || FIDS.has(f), `${c.id} maps to a real faction (got ${f})`);
  counts[f || 'neutral'] = (counts[f || 'neutral'] || 0) + 1;
}
console.log('   spread: ' + JSON.stringify(counts));
for (const f of FACTIONS) ok((counts[f.id] || 0) >= 10, `${f.id} has a real card pool (${counts[f.id] || 0} ≥ 10)`);
ok(counts.neutral >= 20, `neutral pool is substantial (${counts.neutral})`);
// zone sets map wholesale
ok(allCards().filter(c => c.set === 'emberpeaks').every(c => factionOf(c.id) === 'emberpeaks'), 'emberpeaks set → emberpeaks');
ok(allCards().filter(c => c.set === 'darkwood').every(c => factionOf(c.id) === 'darkwood'), 'darkwood set → darkwood');

// ---- 2. rank derivation -----------------------------------------------------
console.log('2. rank derivation');
for (const c of allCards()) {
  const r = rankOf(c.id);
  ok(r >= 0 && r <= MAX_RANK, `${c.id} rank in range (${r})`);
}
// starters are pinned open; champions ride +1 above their rarity
for (const id of [...new Set(Object.values(STARTER_DECKS).flat())]) ok(rankOf(id) === 0, `starter-pool ${id} pinned rank 0`);
for (const id of STARTER_LEADERS) ok(rankOf(id) === 0, `starter champion ${id} pinned rank 0`);
ok(rankOf('vex') === 3, `vex (rare champion) is Sworn-tier (got ${rankOf('vex')})`);
ok(standingRank(0) === 0 && standingRank(RANK_THRESHOLDS[1]) === 1 && standingRank(RANK_THRESHOLDS[3] + 500) === 3, 'standingRank thresholds');

// ---- 3. the gate + the champion vouch ---------------------------------------
console.log('3. gate + vouch');
{
  const stranger = effectiveRanks({ factions: {}, cards: [] });
  ok(FACTIONS.every(f => stranger[f.id] === 0), 'no standing, no cards → Stranger everywhere');
  // a genuinely gated rare — rankOf 2 excludes starter-pinned rares like
  // beacon_mage (the legacy starter lists contain a few, deliberately open)
  const rare = allCards().find(c => factionOf(c.id) === 'wardens' && rankOf(c.id) === 2);
  const filler = STARTER_DECKS.wardens.slice(0, 29);   // pinned rank-0 pool — isolates the rare under test
  ok(!evaluateDeck(defsOf([...filler, rare.id]), [], stranger).valid, `stranger cannot deck a wardens rare (${rare.id})`);
  const trusted = effectiveRanks({ factions: { wardens: RANK_THRESHOLDS[2] }, cards: [] });
  ok(evaluateDeck(defsOf([...filler, rare.id]), [], trusted).valid, 'Trusted standing unlocks the same deck');
  const vouched = effectiveRanks({ factions: { wardens: RANK_THRESHOLDS[1] }, cards: [{ cardId: 'rowan' }] });
  ok(vouched.wardens === 2, 'Known + rowan champion vouch = effective Trusted');
  ok(evaluateDeck(defsOf([...filler, rare.id]), [], vouched).valid, 'the vouch unlocks the rare without Trusted standing');
  ok(championFactionOf('rowan') === 'wardens' && championFactionOf('wild_boar') === null, 'championFactionOf resolves');
}

// ---- 4. earning: real duel logs ---------------------------------------------
console.log('4. standing earn from real duels');
{
  let earnedSomething = false, capRespected = true, neutralOnly = true;
  for (let g = 0; g < 10; g++) {
    const d = createDuel([...STARTER_DECKS.wardens], [...STARTER_DECKS.redsash], { seed: g });
    startTurn(d);
    let t = 0;
    while (d.winner === null && t++ < 200) takeTurn(d, d.active);
    for (const side of [0, 1]) {
      const gains = earnStanding(d.log, side, d.winner === side);
      const total = Object.values(gains).reduce((a, b) => a + b, 0);
      if (total > 0) earnedSomething = true;
      // cap: ≤8 plays counted, ×2 on a win
      if (total > 8 * 2) capRespected = false;
      for (const f of Object.keys(gains)) if (!FIDS.has(f)) neutralOnly = false;
    }
  }
  ok(earnedSomething, 'starter-vs-starter duels earn standing');
  ok(capRespected, 'per-duel cap respected (≤16 with win double)');
  ok(neutralOnly, 'gains only for real factions');
  // win doubling: same log, flip won
  const d = createDuel([...STARTER_DECKS.wardens], [...STARTER_DECKS.redsash], { seed: 42 });
  startTurn(d);
  let t = 0;
  while (d.winner === null && t++ < 200) takeTurn(d, d.active);
  const lose = earnStanding(d.log, 0, false), win = earnStanding(d.log, 0, true);
  ok(Object.keys(lose).every(f => win[f] === lose[f] * 2), 'win doubles every gain');
}

// ---- 5. server contract: fresh profile lifecycle ----------------------------
console.log('5. server validDeck contract with ranks');
{
  const s = newPlayerStarter();
  const cards = s.deck.map(id => mintCard(id, 'Starter deck', 'Tester'));
  const profile = { cards, deck: cards.map(c => c.iid), factions: {} };
  const ranks = effectiveRanks(profile);
  ok(evaluateDeck(profile.deck.map(iid => getCard(cards.find(c => c.iid === iid).cardId)), [], ranks).valid,
    'fresh minted profile can re-save its dealt deck');
  // swap in an owned-but-locked rare: own it, cannot deck it
  const rare = allCards().find(c => factionOf(c.id) === 'redsash' && rankOf(c.id) === 2);
  const rareInst = mintCard(rare.id, 'Won from Vex', 'Tester');
  profile.cards.push(rareInst);
  const swapped = [...profile.deck.slice(0, 29), rareInst.iid];
  const defs = swapped.map(iid => getCard(profile.cards.find(c => c.iid === iid).cardId));
  ok(!evaluateDeck(defs, [], effectiveRanks(profile)).valid, 'owned-but-locked rare cannot be decked (own ≠ deck)');
  profile.factions.redsash = RANK_THRESHOLDS[2];
  ok(evaluateDeck(defs, [], effectiveRanks(profile)).valid, 'earning Trusted standing unlocks the swap');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
