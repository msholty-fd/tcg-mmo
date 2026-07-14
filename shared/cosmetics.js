// Faction regalia — cosmetic wardrobe unlocked by faction standing (Michael,
// 2026-07-14): each faction offers pieces for the humanoid's dress slots,
// gated by EFFECTIVE rank with that faction (same effectiveRanks math that
// gates deck-building, factions.js — a champion's vouch opens the wardrobe
// too). Purely cosmetic: no stats, no gameplay. Pure and shared: the server
// validates setAppearance with the same code the client uses to draw locks.
//
// Diegetically this is "wearing their colors": a faction dresses people it
// knows. Known lends you a coat, Trusted adds the working gear (legs + head),
// Sworn drapes the cape on your shoulders. Rank names in UI copy, never
// "points" or "unlock" (LORE.md voice rules).
//
// Extensibility mirrors factions.js: items are DATA. A new faction's regalia
// = four WARDROBE entries; a new slot = a SLOTS entry + a humanoid() part.

import { effectiveRanks } from './factions.js';

// Slots map 1:1 onto humanoid() parts (client/src/entities.js):
// body → shirt+arms color, legs → legs color, head → hat, back → cape.
export const SLOTS = ['head', 'body', 'legs', 'back'];

// {id, name, slot, faction, rank, color, glow?} — color is the mesh tint;
// glow is an optional emissive tint (the campfire trick — Emberpeaks pieces
// smolder). rank is the required effective rank: 1 Known, 2 Trusted, 3 Sworn.
export const WARDROBE = [
  // The Boarherd — hide, tusk, and drover's wool
  { id: 'boar_jerkin', name: 'Boarhide Jerkin',        slot: 'body', faction: 'boarherd', rank: 1, color: 0x7a4a30 },
  { id: 'boar_spuns',  name: "Drover's Rough-Spuns",   slot: 'legs', faction: 'boarherd', rank: 2, color: 0x5a4632 },
  { id: 'boar_helm',   name: 'Tusked Half-Helm',       slot: 'head', faction: 'boarherd', rank: 2, color: 0x8a8578 },
  { id: 'boar_cloak',  name: "Herd-Chief's Cloak",     slot: 'back', faction: 'boarherd', rank: 3, color: 0x6b3826 },
  // The Wardens — steel and line-grey
  { id: 'ward_coat',   name: "Warden's Line-Coat",     slot: 'body', faction: 'wardens', rank: 1, color: 0x4a6070 },
  { id: 'ward_greaves',name: 'Greaves of the Line',    slot: 'legs', faction: 'wardens', rank: 2, color: 0x39434b },
  { id: 'ward_helm',   name: "Warden's Crest Helm",    slot: 'head', faction: 'wardens', rank: 2, color: 0x6e7d88 },
  { id: 'ward_mantle', name: 'Mantle of the Line',     slot: 'back', faction: 'wardens', rank: 3, color: 0x2f4a5a },
  // The Red-Sash — crimson over cutthroat black
  { id: 'sash_vest',   name: "Cutthroat's Vest",       slot: 'body', faction: 'redsash', rank: 1, color: 0x842e2e },
  { id: 'sash_wraps',  name: "Ambusher's Wraps",       slot: 'legs', faction: 'redsash', rank: 2, color: 0x262626 },
  { id: 'sash_hood',   name: "Bandit's Hood",          slot: 'head', faction: 'redsash', rank: 2, color: 0x1d1d1d },
  { id: 'sash_long',   name: 'The Long Red Sash',      slot: 'back', faction: 'redsash', rank: 3, color: 0xb32424 },
  // The Emberpeaks — char and kindled cloth; the Sworn mantle smolders
  { id: 'ember_tunic', name: 'Kindle-Kin Tunic',       slot: 'body', faction: 'emberpeaks', rank: 1, color: 0xa04818 },
  { id: 'ember_legs',  name: 'Ashwalker Leggings',     slot: 'legs', faction: 'emberpeaks', rank: 2, color: 0x3a2f28 },
  { id: 'ember_cap',   name: 'Cindercap',              slot: 'head', faction: 'emberpeaks', rank: 2, color: 0xcc5a1a },
  { id: 'ember_mantle',name: 'Ashfall Mantle',         slot: 'back', faction: 'emberpeaks', rank: 3, color: 0x552211, glow: 0x882200 },
  // The Darkwood — weirbark and quiet green
  { id: 'dark_coat',   name: 'Weirbark Coat',          slot: 'body', faction: 'darkwood', rank: 1, color: 0x3c4a34 },
  { id: 'dark_legs',   name: 'Mirewalker Leggings',    slot: 'legs', faction: 'darkwood', rank: 2, color: 0x33392c },
  { id: 'dark_hood',   name: 'Hood of Quiet Boughs',   slot: 'head', faction: 'darkwood', rank: 2, color: 0x2a3324 },
  { id: 'dark_cloak',  name: "The Wood's Own Cloak",   slot: 'back', faction: 'darkwood', rank: 3, color: 0x243020 },
];

const BY_ID = new Map(WARDROBE.map(i => [i.id, i]));
export const itemById = id => BY_ID.get(id) || null;

// Strip an untrusted appearance object down to {slot: knownItemId} — unknown
// slots and unknown/mistyped item ids are dropped, null/absent means "bare"
// (the starter look for that slot). Never throws on garbage input.
export function sanitizeAppearance(raw) {
  const app = {};
  if (!raw || typeof raw !== 'object') return app;
  for (const slot of SLOTS) {
    const v = raw[slot];
    if (typeof v === 'string' && BY_ID.get(v)?.slot === slot) app[slot] = v;
  }
  return app;
}

// May this profile wear every piece in (an already-sanitized) appearance?
// profileLike: {factions, cards} — same shape effectiveRanks takes.
export function validAppearance(profileLike, appearance) {
  const ranks = effectiveRanks(profileLike);
  for (const slot of SLOTS) {
    const item = itemById(appearance[slot]);
    if (appearance[slot] && !item) return false;
    if (item && (ranks[item.faction] || 0) < item.rank) return false;
  }
  return true;
}
