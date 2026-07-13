// Emberpeaks zone pack — completes the "a zone ships a set" pillar for the
// basin: reward pools (Ashmonger/Ignarok) put the set into circulation,
// this pack is the coin sink for chasing the rest of it. Priced above the
// Boarlands pack (end-game zone, lvl 5-6 quest gate to even get here) with
// a heavier rare weight since the set is only 16 cards.
// Vendor coords must match Sutler Varn's spawn in client/src/world.js.

export const EMBERPEAKS_PACKS = {
  emberpeaks: {
    id: 'emberpeaks',
    name: 'Cinder Cache',
    set: 'emberpeaks',
    price: 40,
    size: 5,
    weights: { common: 60, uncommon: 30, rare: 10 },
    desc: 'Five cards scavenged from the Emberpeaks. Still warm.',
    vendor: { name: 'Sutler Varn', x: 14, z: 196 },
  },
};
