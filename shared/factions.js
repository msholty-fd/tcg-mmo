// Factions — THE progression system (Michael, 2026-07-14): playing a
// faction's cards earns *standing* with that faction; standing ranks gate
// which of its cards you may build into a deck. Pure and shared: the server
// (authoritative earn + validDeck) and the client (deck builder locks +
// progress UI) run the same math.
//
// The design in one breath: every card belongs to one faction or is neutral
// (factionOf). Each faction card you PLAY in a duel earns 1 standing with
// its faction (win doubles it, capped per duel — earnStanding). Standing
// crosses thresholds into RANKS (Stranger → Known → Trusted → Sworn), and a
// card's rank requirement derives from its rarity (rankOf). Owning one of a
// faction's champion Leaders grants +1 effective rank — "a champion vouches
// for you" (effectiveRanks). This REPLACES the Leaders ownership gate as the
// card gate (deckConstraints.js); Leaders keep their fielding rules and
// Legend Budget stays orthogonal.
//
// Extensibility (deliberate, Michael wants more factions later): factions,
// the family→faction and set→faction maps, thresholds, and rank names are
// all DATA. A new faction = one FACTIONS entry + map lines. A new set = one
// FACTION_OF_SET line (zone sets are wholly one faction by default).

import { LEADERS } from './sets/core/leaders.js';
import { getCard } from './engine/cards.js';
import { STARTER_POOL } from './sets/core/cards.js';
import { STARTER_LEADERS } from './sets/core/leaders.js';
import { FAMILIES } from './sets/core/families.js';
import { EMBERPEAKS_FAMILIES } from './sets/emberpeaks/families.js';

const ALL_FAMILIES = [...FAMILIES, ...EMBERPEAKS_FAMILIES];

export const FACTIONS = [
  { id: 'boarherd',   name: 'The Boarherd' },
  { id: 'wardens',    name: 'The Wardens' },
  { id: 'redsash',    name: 'The Red-Sash' },
  { id: 'emberpeaks', name: 'The Emberpeaks' },
  { id: 'darkwood',   name: 'The Darkwood' },
];
export const factionName = id => FACTIONS.find(f => f.id === id)?.name || id;

// Rank ladder. Standing never decays; rank = highest threshold reached.
export const RANK_NAMES = ['Stranger', 'Known', 'Trusted', 'Sworn'];
export const RANK_THRESHOLDS = [0, 40, 120, 300];
export const MAX_RANK = RANK_NAMES.length - 1;

export const standingRank = points => {
  let r = 0;
  for (let i = 1; i < RANK_THRESHOLDS.length; i++) if ((points || 0) >= RANK_THRESHOLDS[i]) r = i;
  return r;
};

// ---- card → faction ------------------------------------------------------
// Core cards map through their deck-builder family (families.js is a clean
// 1:1 map, same substrate banners.js gates on); zone sets map wholesale.
// Families absent here are NEUTRAL: playable by anyone, earn nothing, never
// gated (village_hearth is the shared teaching pool; the card-TYPE families
// are generic support).
const FACTION_OF_FAMILY = {
  boars_beasts: 'boarherd', piercing_vanguard: 'boarherd', graveyard_remembers: 'boarherd',
  wardens_of_the_line: 'wardens', ward_and_shrine: 'wardens', crimson_guard: 'wardens',
  redsash_bandits: 'redsash', frenzied_warband: 'redsash',
  // kindle/ash were always the mountain's kin — gives the Emberpeaks faction
  // an early-game on-ramp long before the player crosses Cinderpass.
  kindle_kin: 'emberpeaks', ashfall: 'emberpeaks', emberpeaks_fire: 'emberpeaks',
};
const FACTION_OF_SET = { emberpeaks: 'emberpeaks', darkwood: 'darkwood' };

// family lookup built lazily to keep this module import-order-safe with the
// card registries (banners.js builds the same map from the same source).
let FAMILY_BY_CARD = null;
function familyMap() {
  if (!FAMILY_BY_CARD) {
    FAMILY_BY_CARD = new Map();
    for (const fam of ALL_FAMILIES) for (const id of fam.cardIds) FAMILY_BY_CARD.set(id, fam.id);
  }
  return FAMILY_BY_CARD;
}

export function factionOf(cardId) {
  const def = getCard(cardId);
  if (!def) return null;
  if (FACTION_OF_SET[def.set]) return FACTION_OF_SET[def.set];
  const fam = familyMap().get(cardId);
  return (fam && FACTION_OF_FAMILY[fam]) || null;
}

// ---- card → rank requirement ---------------------------------------------
// Derived, not authored: commons are open (0), uncommons need Known (1),
// rares need Trusted (2), champions need Sworn (3). Everything a fresh
// character can be dealt (starter pool + starter champions) is pinned to 0 so
// a day-one deck edit never hits a lock on cards the player was handed.
const RANK_BY_RARITY = { common: 0, uncommon: 1, rare: 2 };
const ALWAYS_OPEN = new Set([...STARTER_POOL, ...STARTER_LEADERS]);

export function rankOf(cardId) {
  if (ALWAYS_OPEN.has(cardId)) return 0;
  const def = getCard(cardId);
  if (!def) return 0;
  let r = RANK_BY_RARITY[def.rarity] ?? 0;
  if (LEADERS[cardId]) r = Math.min(MAX_RANK, r + 1);
  return r;
}

// ---- profile → effective ranks -------------------------------------------
// A champion vouches for you: owning any card that is a Leader of a faction
// grants +1 effective rank with that faction (capped at Sworn).
export function championFactionOf(cardId) {
  const L = LEADERS[cardId];
  return L ? (FACTION_OF_FAMILY[L.banner] || null) : null;
}

// profileLike: { factions: {id: points}, cards: [{cardId}] }
export function effectiveRanks(profileLike) {
  const ranks = {};
  const vouched = new Set();
  for (const c of profileLike.cards || []) {
    const f = championFactionOf(c.cardId);
    if (f) vouched.add(f);
  }
  for (const f of FACTIONS) {
    const base = standingRank(profileLike.factions?.[f.id]);
    ranks[f.id] = Math.min(MAX_RANK, base + (vouched.has(f.id) ? 1 : 0));
  }
  return ranks;
}

// ---- earning --------------------------------------------------------------
// Walk a finished duel's log: each faction card YOU played earns 1 standing
// with its faction; a win doubles the haul. Capped at MAX_PLAYS_COUNTED
// faction plays per duel so marathon games don't outpace the ladder.
// Kindled (burned) cards deliberately earn nothing — a sacrifice is not a
// witnessing. Autobattle earns in full (standing is a reward; QoL decision).
const MAX_PLAYS_COUNTED = 8;
export function earnStanding(duelLog, side, won) {
  const gains = {};
  let counted = 0;
  for (const entry of duelLog) {
    if (counted >= MAX_PLAYS_COUNTED) break;
    if (entry.type !== 'play' || entry.side !== side) continue;
    const f = factionOf(entry.card);
    if (!f) continue;
    gains[f] = (gains[f] || 0) + (won ? 2 : 1);
    counted++;
  }
  return gains;   // {factionId: points} — empty object if nothing earned
}
