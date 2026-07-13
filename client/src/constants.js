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
// Also doubles as the list of any other named, proximity-defined place that
// should out-rank the concentric ZONES rings above (see zoneAt() in
// main.js — camps are checked first). Highgate isn't a "camp" but reuses the
// exact same {x,z,r,name} shape rather than inventing a second mechanism.
export const CAMPS = [
  { x: 107, z: -60, r: 26, name: "Gruk's Hollow" },
  { x: -90, z: 64,  r: 24, name: 'Red-Sash Camp' },
  // Southern trade capital — deliberately far from spawn (~187 units, near
  // the 210 world-boundary clamp) so it reads as its own destination, not an
  // extension of Meadowbrook. r=50 covers the walls plus the road just
  // outside the gate (Tarn the Tollkeeper). See DESIGN.md "Highgate".
  { x: 40,  z: -145, r: 50, name: 'Highgate' },
  // A wayside rest stop on the Meadowbrook->Highgate road, right at the
  // Boarlands/Darkwood seam (~73 from origin) — the last safe fire before
  // the road gets dangerous. See DESIGN.md "Bram's Rest".
  { x: 20,  z: -70, r: 14, name: "Bram's Rest" },
  // A sunken swamp in the unclaimed southwest quadrant — every other named
  // place sits NW/SE/S/NE of origin. See DESIGN.md "Hollowmere".
  { x: -100, z: -90, r: 22, name: 'Hollowmere' },
  // The heart of the forest the outer ZONES ring has always labeled
  // "Darkwood" — a real destination in the southeast quadrant, between
  // Gruk's Hollow and Highgate. Listed AFTER both so their entries win the
  // small circle overlaps on the roads between them. See DESIGN.md
  // "Deep Darkwood".
  { x: 118, z: -115, r: 45, name: 'The Deep Darkwood' },
  // An abandoned mine dug into a rocky rise due north, in the Darkwood — a
  // scenic discovery, not enterable (seeds future underground content). See
  // DESIGN.md "Cinderhollow Mine".
  { x: -15, z: 115, r: 18, name: 'Cinderhollow Mine' },
  // ---- The Emberpeaks: the first zone beyond the grassland (2026-07-08) ----
  // A volcanic mountain range walling off the far north. You cross the ridge
  // through Cinderpass (a gap in the boulder wall at x=0, z~158) into the
  // Emberpeaks basin beyond. Listed before the basin so the pass label wins
  // in their small overlap. See DESIGN.md "Emberpeaks". The terrain, ridge,
  // and volcanic recolor live in terrain.js; the world boundary was grown
  // 210→300 (main.js) to make the basin reachable.
  { x: 0, z: 158, r: 15, name: 'Cinderpass' },
  { x: 0, z: 235, r: 92, name: 'The Emberpeaks' },
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
  "Bonkstick: anyone made it to Highgate yet? that walk is LONG",
  'xXfrostgirlXx: Tarn wrecked me right outside the gate lol',
];
