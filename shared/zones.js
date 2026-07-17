// The realm's zone map — named places and the concentric wilderness rings —
// plus zoneAt(), the one canonical "where is (x,z)" implementation.
//
// Promoted here from client/src/constants.js (Phase 0 of the drafting epic,
// see .claude/DRAFTING.md) so the SERVER can derive duel location / nearest
// fire authoritatively; this was also the stated prerequisite for per-zone
// Field Effects (DESIGN.md "Card-game direction", 2026-07-13). Pure data +
// math: no DOM, no THREE, no fs — must stay runnable in browser and Node.

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

// Named camps, checked before the ZONES rings in zoneAt() — shared so the
// full map (client fullmap.js) can draw the same circles without a second
// hardcoded copy.
// Also doubles as the list of any other named, proximity-defined place that
// should out-rank the concentric ZONES rings above (camps are checked
// first). Highgate isn't a "camp" but reuses the exact same {x,z,r,name}
// shape rather than inventing a second mechanism.
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
  // A weathered sundial ring on the eastern grass, between Gruk's Hollow
  // and the Emberwatch Ruins — the realm's clock, made visible. See
  // DESIGN.md "The Dial Stone".
  { x: 165, z: 25, r: 16, name: 'The Dial Stone' },
  // A shepherd's grazing downs due west — the first pastoral place, in the
  // unclaimed wedge between Red-Sash Camp and Hollowmere. See DESIGN.md
  // "The Wether Downs".
  { x: -150, z: -10, r: 20, name: 'The Wether Downs' },
  // A fisher's landing on the realm's first true standing water, in the
  // northwest wedge beyond Red-Sash Camp — the pond sits on a natural flat
  // low in groundH (scanned, not terraformed). See DESIGN.md "Pell's Pond".
  { x: -141, z: 58, r: 18, name: "Pell's Pond" },
  // An apiary in a wildflower meadow in the deep southwest corner — honey
  // and candle-wax, the realm's sweet trade. Sited on the flattest ground
  // in the quadrant (scanned, not terraformed — the Pell's Pond technique).
  // See DESIGN.md "The Bee Meads".
  { x: -147, z: -93, r: 17, name: 'The Bee Meads' },
  // A working stonecutter's yard on the eastern grass, in the wedge between
  // Gruk's Hollow, the Dial Stone, and the world's edge — where the realm's
  // waystones, hearthstones, and wall-stone are cut. Sited on the flattest
  // ground in the wedge (scanned, not terraformed — the Pell's Pond
  // technique). See DESIGN.md "Hobb's Quarry".
  { x: 157, z: -20, r: 16, name: "Hobb's Quarry" },
  // A weaver's stead on the middle eastern grass, between Meadowbrook, the
  // Emberwatch road, and the Dial Stone — where Wynn's wool becomes the
  // realm's shirts. See DESIGN.md "The Loomstead".
  { x: 87, z: 46, r: 16, name: 'The Loomstead' },
  // A potter's yard on the southern grass, west-southwest of Highgate —
  // where the realm's crockery is dug, thrown, and fired. See DESIGN.md
  // "The Kilnyard".
  { x: -64, z: -165, r: 16, name: 'The Kilnyard' },
  // A smith's forge on the north-central upland grass, between the village,
  // the Emberwatch road, and the north road — where the realm's iron is
  // worked. See DESIGN.md "Bryn's Forge".
  { x: 46, z: 86, r: 16, name: "Bryn's Forge" },
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

// Named camps out-rank the concentric rings; first matching camp wins.
export function zoneAt(x, z) {
  for (const c of CAMPS) if (Math.hypot(x - c.x, z - c.z) < c.r) return c.name;
  const d = Math.hypot(x, z);
  for (const zn of ZONES) if (d < zn.r) return zn.name;
}
