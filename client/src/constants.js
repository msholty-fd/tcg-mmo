// Starter deck choices — shown on the intro screen. Purely cosmetic outfit
// plus which STARTER_DECKS list seeds the player's collection.
export const STARTERS = {
  boarherd: {
    name: 'Boarherd', icon: '🐗', shirt: 0x8a4a3a, hat: 0x555c66,
    desc: 'Aggressive creatures that hit hard and fast. Overwhelm before they can answer.',
  },
  wardens: {
    name: 'Wardens', icon: '🛡️', shirt: 0x55636e, hat: 0x3a444c,
    desc: 'Guardians, healing, and card draw. Outlast everything, then win at leisure.',
  },
  redsash: {
    name: 'Red-Sash', icon: '🗡️', shirt: 0xa03a3a, hat: 0x2a2a2a,
    desc: 'Ambush and Frenzy tempo. Strike from nowhere and never stop swinging.',
  },
};

export const ZONES = [
  // Bumped 26 -> 38 (town-expansion): new village structures (tavern, smithy,
  // market stall, stable, shrine) sit out to ~radius 30-32; 38 keeps their
  // outer edges reading as "Meadowbrook Village" on the HUD/map instead of
  // "The Boarlands". Nowhere near CAMPS (Gruk's Hollow/Red-Sash, both
  // ~110-120 from origin), so no overlap with zoneAt()'s camp check, which
  // runs first anyway.
  { r: 38,  name: 'Meadowbrook Village' },
  { r: 78,  name: 'The Boarlands' },
  { r: 1e9, name: 'Darkwood' },
];

// Named camps, checked before the ZONES rings in main.js's zoneAt() — shared
// here so the full map (fullmap.js) can draw the same circles without a
// second hardcoded copy.
export const CAMPS = [
  { x: 107, z: -60, r: 26, name: "Gruk's Hollow" },
  { x: -90, z: 64,  r: 24, name: 'Red-Sash Camp' },
];

export const BOTCHAT = [
  'Legolaz: anyone beaten Gruk at the table yet? his deck is unfair',
  'Bonkstick: WTS Pack Alpha, cheap',
  'xXfrostgirlXx: Vex keeps ambushing me turn 2 lol',
  'Bonkstick: brb mom needs the computer',
  'Legolaz: how do u get more cards in this game',
  'xXfrostgirlXx: someone pulled GRUK from a reward?? grats',
  'Bonkstick: DING!',
  'Legolaz: nice',
];
