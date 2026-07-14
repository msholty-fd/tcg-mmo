// Supply packs — the coin sink. Zone-scoped: a pack pulls only from its
// zone's set, so "shipping a zone = shipping a set" holds for the shop too.
// Crafting was considered and rejected (DESIGN.md): packs complement trading,
// targeted minting would replace it. Server rolls and mints; the client only
// reads name/price/vendor for the shop UI.

import { cardsInSet } from '../../engine/cards.js';
import { EMBERPEAKS_PACKS } from '../emberpeaks/packs.js';
import { DARKWOOD_PACKS } from '../darkwood/packs.js';

// The pack registry is GLOBAL across sets, aggregated here like banners.js/
// leaders.js (the de-facto global registry pattern). The third-set promotion
// note fired with darkwood (2026-07-14): the merge was kept anyway — three
// static spreads are still cheaper than registry machinery, and banners/
// leaders remain at two sets (darkwood ships neither). Promote all three
// registries together when a FOURTH set lands or when any single set needs
// banners + leaders + packs at once (rationale in DESIGN.md, Darkwood 3b).
export const PACKS = {
  boarlands: {
    id: 'boarlands',
    name: 'Boarlands Supply Pack',
    set: 'core',
    price: 25,
    size: 5,
    weights: { common: 70, uncommon: 24, rare: 6 },
    desc: 'Five cards from the Boarlands. No promises on which five.',
    vendor: { name: 'Quartermaster Marla', x: 3.5, z: 4 },   // must match her world.js spawn
  },
  ...EMBERPEAKS_PACKS,
  ...DARKWOOD_PACKS,
};

// Roll `pack.size` card ids: pick a rarity by weight, then a uniform card
// within it. rng injectable for deterministic tests.
export function rollPack(pack, rng = Math.random) {
  const byRarity = {};
  for (const c of cardsInSet(pack.set)) (byRarity[c.rarity] ||= []).push(c.id);
  const entries = Object.entries(pack.weights).filter(([r]) => byRarity[r]?.length);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  const ids = [];
  for (let i = 0; i < pack.size; i++) {
    let roll = rng() * total, rarity = entries[entries.length - 1][0];
    for (const [r, w] of entries) { roll -= w; if (roll <= 0) { rarity = r; break; } }
    const pool = byRarity[rarity];
    ids.push(pool[Math.floor(rng() * pool.length)]);
  }
  return ids;
}
