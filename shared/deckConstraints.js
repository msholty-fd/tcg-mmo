// Deck-building constraint engine — pure and shared so the server
// (authoritative validateDeck) and the client deckbuilder run the SAME
// checks. See DESIGN.md "Leaders" and the Factions entry for the design.
//
// Two layers:
//   1. The GATE (global): FACTION RANK (shared/factions.js) — a faction
//      card may only be in a deck whose owner has earned that card's rank
//      requirement with its faction (standing comes from playing the
//      faction's cards; owning one of its champions vouches +1). This
//      REPLACED the original Leader-ownership banner gate (2026-07-14):
//      one lock type, earned by play. Neutral cards are never gated.
//   2. Per-Leader CONSTRAINTS (unchanged): each fielded Leader carries a
//      list of constraint primitives run against the 30. `minBanner`
//      (field this Leader, owe ≥N of its banner) is the most common one,
//      but it's just one primitive among many (costParity, singleton,
//      requireType…).
//
// Constraints are DATA (`{kind, ...params}`), dispatched through the PRIMS
// registry — the same "composable primitives over special-cased rules" posture
// the engine takes with effects/keywords. Adding a rule = one PRIMS entry;
// adding a future tribe/element axis = new kinds + a card attribute, with zero
// change to evaluateDeck or its callers.

import { matchesBanner, bannerName } from './sets/core/banners.js';
import { LEADERS } from './sets/core/leaders.js';
import { factionOf, rankOf, factionName, RANK_NAMES } from './factions.js';

const parityOf = cost => (cost % 2 === 0 ? 'even' : 'odd');
const countType = (defs, type) => defs.filter(d => d.type === type).length;
const countKeyword = (defs, kw) => defs.filter(d => Array.isArray(d.keywords) && d.keywords.includes(kw)).length;

// Each primitive: rule(params, banner) -> human label (the static rule text
// shown in the UI); check({defs, banner, p}) -> boolean (is it satisfied).
const PRIMS = {
  minBanner: {
    rule: (p, banner) => `≥${p.n} ${bannerName(banner)} cards`,
    check: ({ defs, banner, p }) => defs.filter(d => matchesBanner(d, banner)).length >= p.n,
  },
  costParity: {
    rule: p => `${p.parity}-cost cards only`,
    check: ({ defs, p }) => defs.every(d => parityOf(d.cost) === p.parity),
  },
  singleton: {
    rule: () => 'no duplicate cards (singleton)',
    check: ({ defs }) => {
      const seen = new Set();
      for (const d of defs) { if (seen.has(d.id)) return false; seen.add(d.id); }
      return true;
    },
  },
  requireType: {
    rule: p => `≥${p.n} ${p.type} cards`,
    check: ({ defs, p }) => countType(defs, p.type) >= p.n,
  },
  banType: {
    rule: p => `no ${p.type} cards`,
    check: ({ defs, p }) => countType(defs, p.type) === 0,
  },
  maxType: {
    rule: p => `≤${p.n} ${p.type} cards`,
    check: ({ defs, p }) => countType(defs, p.type) <= p.n,
  },
  minKeyword: {
    rule: p => `≥${p.n} ${p.keyword} cards`,
    check: ({ defs, p }) => countKeyword(defs, p.keyword) >= p.n,
  },
  banKeyword: {
    rule: p => `no ${p.keyword} cards`,
    check: ({ defs, p }) => countKeyword(defs, p.keyword) === 0,
  },
  maxCost: {
    rule: p => `every card costs ≤${p.n}`,
    check: ({ defs, p }) => defs.every(d => d.cost <= p.n),
  },
};

// The rule labels a Leader imposes (for the deckbuilder to display).
export function leaderRules(cardId) {
  const L = LEADERS[cardId];
  if (!L) return [];
  return L.constraints.map(c => (PRIMS[c.kind] ? PRIMS[c.kind].rule(c, L.banner) : c.kind));
}

// Evaluate a full deck (array of card DEFS) under a set of chosen Leaders
// (array of Leader cardIds) and the owner's effective faction ranks
// (shared/factions.js effectiveRanks — {factionId: rank}; omitted ranks
// read as 0/Stranger, so passing {} is the strictest evaluation).
// Returns { valid, failures: [{text, faction?, leader?}] }.
// Callers resolve deck iids -> card defs and leader iids -> cardIds first.
export function evaluateDeck(defs, leaderCardIds = [], effRanks = {}) {
  const failures = [];
  for (const id of leaderCardIds) {
    const L = LEADERS[id];
    if (!L) failures.push({ leader: id, text: `Unknown Leader: ${id}` });
  }

  // (1) gate — every faction card must be within the owner's earned rank
  const short = new Map();   // factionId -> highest unmet requirement
  for (const d of defs) {
    const f = factionOf(d.id);
    if (!f) continue;
    const req = rankOf(d.id);
    if (req > (effRanks[f] ?? 0)) short.set(f, Math.max(short.get(f) || 0, req));
  }
  for (const [f, req] of short) {
    failures.push({ faction: f, text: `Needs ${factionName(f)} ${RANK_NAMES[req]} — earn standing by playing ${factionName(f)} cards` });
  }

  // (2) per-Leader: must be in the deck, and its constraints must hold
  for (const id of leaderCardIds) {
    const L = LEADERS[id];
    if (!L) continue;
    if (!defs.some(d => d.id === id)) {
      failures.push({ leader: id, text: `${bannerName(L.banner)} Leader must be in your deck` });
    }
    for (const c of L.constraints) {
      const prim = PRIMS[c.kind];
      if (!prim) { failures.push({ leader: id, text: `Unknown constraint: ${c.kind}` }); continue; }
      if (!prim.check({ defs, banner: L.banner, p: c })) {
        failures.push({ leader: id, text: `${bannerName(L.banner)} Leader: ${prim.rule(c, L.banner)}` });
      }
    }
  }

  return { valid: failures.length === 0, failures };
}
