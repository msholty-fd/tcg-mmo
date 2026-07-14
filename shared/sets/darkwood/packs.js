// Darkwood zone pack — completes the zone playbook for the wood (Phase 3b):
// reward pools (Tamsin/Weir) put the set into circulation, this pack is the
// coin sink for chasing the rest of it. Priced between the Boarlands pack
// (starter zone, 25) and the Cinder Cache (end-game basin, 40) — the wood
// sits mid-realm on the Gruk↔Highgate road. Rare weight stays modest (8) on
// purpose: `weir` is Act II's chase card and a trade driver (a_coal_for_bram);
// the pack should feed the chase, not end it.
// Vendor coords must match Pedlar Rusk's spawn in client/src/world/darkwood.js.

export const DARKWOOD_PACKS = {
  darkwood: {
    id: 'darkwood',
    name: 'Night-Gather',
    set: 'darkwood',
    price: 35,
    size: 5,
    weights: { common: 64, uncommon: 28, rare: 8 },
    desc: 'Five cards gathered under the dark boughs. Picked in daylight, every one.',
    vendor: { name: 'Pedlar Rusk', x: 106, z: -72 },
  },
};
