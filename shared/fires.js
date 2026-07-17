// The realm's draftable fires — Phase 1 of the drafting epic
// (.claude/DRAFTING.md): every tended fire holds a small pool of embers
// players can draft from (E at the fire when no NPC business is nearer).
// The world is the pack: whoever visits next sees what the last drafter
// left behind.
//
// Pure and shared (no DOM/THREE/fs): the client reads FIRES for the
// interact prompt and window copy; the server owns the pools and validates
// every pick against the same registry. Coordinates mirror the campfire()
// call sites in client/src/world/*.js — a registry fire with no visible
// campfire (or vice versa) is a content bug, so keep them in sync.
//
// Deliberate exclusions (v1): Meadowbrook Village has torches but no
// campfire (a village hearth is a future worldbuilding iteration, not a
// registry line); the Deep Darkwood is COLD by lore — no fires, no
// drafting, the forgetting made mechanical; the Kilnyard's kiln and Bryn's
// forge are their yards' hearths but not campfires — candidates once
// drafting proves out.

import { cardsInSet } from './engine/cards.js';
import { factionOf } from './factions.js';

// Pool + pick pacing. The pool refills slowly on its own (Phase 2 makes
// kindling the real faucet); the per-player pick cooldown is per FIRE, so
// touring the realm is how you draft faster — that's the point.
export const POOL_MAX = 5;                        // embers a fire can hold
export const REGEN_MS = 30 * 60 * 1000;           // one ember per half hour
export const PICK_COOLDOWN_MS = 60 * 60 * 1000;   // per player, per fire
export const HEARTH_RANGE = 6;                    // client prompt radius (server allows slack)
// Phase 2 — kindle feeds the fire: a duel fought within this range of a fire
// drifts every kindled memory into its pool (both sides — NPCs kindle too).
export const KINDLE_FEED_RANGE = 40;              // how far a fire "hears" a duel
export const FIRE_COPY_CAP = 2;                   // max copies of one card per fire (extra dupes merge into the flame)

// {id, x, z, name, set, faction?} — `set` scopes which card set the fire's
// embers roll from ("shipping a zone = shipping a set" holds for fires like
// it does for packs); `faction` softly biases the roll (BIAS_CHANCE below)
// so a camp's fire remembers its own people. Coords are the campfire() call
// sites, not the CAMPS centers.
export const FIRES = [
  { id: 'brams_rest',   x: 20,     z: -70,   name: "Bram's fire",          set: 'core', faction: null },
  { id: 'gruks_hollow', x: 108,    z: -62,   name: "the Boar King's fire", set: 'core', faction: 'boarherd' },
  { id: 'redsash_camp', x: -92,    z: 62,    name: 'the Red-Sash fire',    set: 'core', faction: 'redsash' },
  { id: 'hollowmere',   x: -100,   z: -90,   name: "Hessa's fire",         set: 'core', faction: null },
  { id: 'emberwatch',   x: 100,    z: 103,   name: "the Sentinel's ember", set: 'core', faction: null },
  { id: 'wether_downs', x: -145.5, z: -9.5,  name: "Wynn's fire",          set: 'core', faction: 'boarherd' },
  { id: 'pells_pond',   x: -131,   z: 60.5,  name: "Pell's smoking fire",  set: 'core', faction: 'wardens' },
  { id: 'bee_meads',    x: -142.5, z: -93.5, name: "the keeper's fire",    set: 'core', faction: 'redsash' },
  { id: 'dial_stone',   x: 159,    z: 33,    name: "the skywatcher's fire",set: 'core', faction: null },
  { id: 'quarry',       x: 152.5,  z: -24.5, name: "the masons' fire",     set: 'core', faction: 'boarherd' },
  { id: 'loomstead',    x: 85.5,   z: 47.5,  name: 'the loomstead fire',   set: 'core', faction: null },
  // The pass braziers draw from the Emberpeaks set — the zone's cards enter
  // circulation at the zone's threshold, same pillar as zone packs.
  { id: 'cinderpass',   x: -11,    z: 150,   name: 'the pass braziers',    set: 'emberpeaks', faction: null },
];

export const fireById = id => FIRES.find(f => f.id === id) || null;

// Same rarity weighting as the Boarlands pack (packs.js) — fires are
// commons-heavy with occasional gold, like any draft pool.
const RARITY_WEIGHTS = { common: 70, uncommon: 24, rare: 6 };
const BIAS_CHANCE = 0.6;   // odds a biased fire restricts a roll to its faction

// Roll ONE ember (card id) for a fire: rarity by weight, then uniform within
// the fire's set — restricted to the fire's faction on a biased roll, falling
// back to the whole set when the faction has no cards at that rarity.
// rng injectable for deterministic tests.
export function rollEmber(fire, rng = Math.random) {
  const cards = cardsInSet(fire.set);
  const byRarity = {};
  for (const c of cards) (byRarity[c.rarity] ||= []).push(c.id);
  const entries = Object.entries(RARITY_WEIGHTS).filter(([r]) => byRarity[r]?.length);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total, rarity = entries[entries.length - 1][0];
  for (const [r, w] of entries) { roll -= w; if (roll <= 0) { rarity = r; break; } }
  let pool = byRarity[rarity];
  if (fire.faction && rng() < BIAS_CHANCE) {
    const biased = pool.filter(id => factionOf(id) === fire.faction);
    if (biased.length) pool = biased;
  }
  return pool[Math.floor(rng() * pool.length)];
}

export function seedFire(fire, rng = Math.random) {
  const cards = [];
  for (let i = 0; i < POOL_MAX; i++) cards.push(rollEmber(fire, rng));
  return cards;
}
