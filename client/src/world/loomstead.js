// The Loomstead (DESIGN.md, 2026-07-16): a weaver's stead on the middle
// eastern grass at (87,46) — the gap between Meadowbrook, the Emberwatch
// road, and the Dial Stone. The survey's archetype find: cloth is the
// realm's single most VISIBLE crafted material — the humanoid pass put a
// woven basketweave texture on every shirt in the realm — and nobody wove
// it anywhere. The Loomstead retro-explains everyone's clothes the way the
// Bee Meads retro-explained Highgate's candles and the quarry the
// waystones. It also closes an authored-but-dangling economy line:
// iteration 13 wrote Nell carting "Wynn's wool" east with no named
// destination — this is where the wool goes.
// Sited by the numeric scan (loomstead-scan): flattest r=10 disc in the
// region, center h 1.61, max deviation 0.59 within r=10, zero terrain
// edits; clearances — Emberwatch ruins 39.5, finch's patrol polyline 31.8,
// Dial Stone 64.8, village ring 60.
// LORE relationship to the fire: TENDED — the dye fire, kept low and even
// ("a dye pot wants a fire like a held breath").
// Seeded doors (DESIGN.md/LORE.md, do not answer here): the ash-grey bolt
// that won't take any dye, and the spring thief that robs the drying
// lines of red thread only.
// Earned its route at iteration 21 (wool_run gave it business at 20): a
// spur forks off the Emberwatch road and lands two stones from the yard's
// signpost (roads.js). The already-ripe Loomstead duelist stays seeded
// until duelists.js frees from the parallel /new-card sessions.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, fires, barrel, signpost, spawnNPC } from './lib.js';

const L = { x: 87, z: 46 };   // heart (shared/zones.js CAMPS r=16)

// The stead's palette is dyed cloth against undyed cream — nothing else in
// the realm carries these colors, so the drying lines read as themselves
// from a distance (the Hollowmere/Pell's-palette rule).
const M_CREAM  = new THREE.MeshLambertMaterial({ color: 0xe6dcc3, side: THREE.DoubleSide });
const M_MADDER = new THREE.MeshLambertMaterial({ color: 0xa8452f, side: THREE.DoubleSide });
const M_WOAD   = new THREE.MeshLambertMaterial({ color: 0x41628a, side: THREE.DoubleSide });
const M_WELD   = new THREE.MeshLambertMaterial({ color: 0xc9a83a, side: THREE.DoubleSide });
const CLOTHS = [M_CREAM, M_WOAD, M_WELD, M_MADDER];

// ---------- the weaver's hut (Wether Downs pattern verbatim) ----------
(function hut() {
  const hx = L.x - 1, hz = L.z + 7.5, rot = Math.PI + .15;   // north backdrop, door south into the yard
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 3.4), M.wood);
  walls.position.y = 1.3; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.8, 4), M.leafDark);
  roof.position.y = 3.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.9, .15), M.soil);
  door.position.set(0, .95, 1.71); g.add(door);
  g.position.set(hx, groundH(hx, hz), hz); g.rotation.y = rot; scene.add(g);
  addRect(hx, hz, 4.2, 3.4, rot);
  camCollidables.push(g);
})();

// ---------- the warp-weighted loom, under a lean-to ----------
// The signature prop: an upright frame strung with cream warp, a woven
// band growing from the top, and a row of hanging loom-weights below —
// the realm's shirts, mid-birth.
(function loom() {
  const lx = L.x + 6, lz = L.z + 1, rot = Math.PI / 2 + .25;
  const g = new THREE.Group();
  // lean-to: two front posts + a slanted plank roof onto shorter rear posts
  for (const [px, pz, h] of [[-1.6, 1.2, 3.0], [1.6, 1.2, 3.0], [-1.6, -1.2, 2.2], [1.6, -1.2, 2.2]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, h, 5), M.wood);
    post.position.set(px, h / 2, pz); post.castShadow = true; g.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.9, .12, 3.1), M.leafDark);
  roof.position.set(0, 2.62, 0); roof.rotation.x = .32; roof.castShadow = true; g.add(roof);
  // the loom frame
  for (const px of [-1.1, 1.1]) {
    const up = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.3, 5), M.wood);
    up.position.set(px, 1.15, .2); up.rotation.x = -.12; g.add(up);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.4, 5), M.wood);
  beam.rotation.z = Math.PI / 2; beam.position.set(0, 2.22, .07); g.add(beam);
  // woven band (madder) growing down from the beam, warp (cream) below it
  const woven = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .7), M_MADDER);
  woven.position.set(0, 1.82, .13); woven.rotation.x = -.12; g.add(woven);
  const warp = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.1), M_CREAM);
  warp.position.set(0, .92, .24); warp.rotation.x = -.12; g.add(warp);
  // loom weights: a row of small stones tensioning the warp
  for (let i = 0; i < 6; i++) {
    const w = new THREE.Mesh(new THREE.IcosahedronGeometry(.09), M.rock);
    w.position.set(-1.05 + i * .42, .3, .32); g.add(w);
  }
  g.position.set(lx, groundH(lx, lz), lz); g.rotation.y = rot; scene.add(g);
  addRect(lx, lz, 3.9, 3.1, rot);
})();

// ---------- drying lines: the palette carrier ----------
// Two posts, a line, and four hanging bolts — cream, woad, weld, madder.
// Visible from the Emberwatch road like flags; this is the zone's read.
(function dryingLines() {
  const ax = L.x - 5, az = L.z - 2.5, bx = L.x + 1, bz = L.z - 4;
  const len = Math.hypot(bx - ax, bz - az), rot = Math.atan2(bx - ax, bz - az);
  const g = new THREE.Group();
  for (const [px, pz] of [[ax, az], [bx, bz]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.5, 5), M.wood);
    post.position.set(px - L.x, 1.25, pz - L.z); post.castShadow = true; g.add(post);
    addCircle(px, pz, .35);
  }
  const line = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, len, 4), M.charred);
  line.position.set((ax + bx) / 2 - L.x, 2.35, (az + bz) / 2 - L.z);
  line.rotation.z = Math.PI / 2; line.rotation.y = -rot; g.add(line);
  for (let i = 0; i < 4; i++) {
    const t = .17 + i * .22;
    const bolt = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.5), CLOTHS[i]);
    bolt.position.set(ax + (bx - ax) * t - L.x, 1.58, az + (bz - az) * t - L.z);
    bolt.rotation.y = -rot + rand(-.15, .15);
    bolt.castShadow = true; g.add(bolt);
  }
  g.position.set(L.x, groundH(L.x - 2, L.z - 3.2), L.z); scene.add(g);
})();

// ---------- tenter frame: cloth stretched to dry taut ----------
(function tenter() {
  const tx = L.x - 7.5, tz = L.z + 2.5, rot = 1.1;
  const g = new THREE.Group();
  for (const px of [-1.5, 1.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1.9, 5), M.wood);
    post.position.set(px, .95, 0); post.castShadow = true; g.add(post);
  }
  for (const py of [.55, 1.7]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 3.2, 4), M.wood);
    rail.rotation.z = Math.PI / 2; rail.position.y = py; g.add(rail);
  }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.05), M_WOAD);
  cloth.position.y = 1.12; g.add(cloth);
  g.position.set(tx, groundH(tx, tz), tz); g.rotation.y = rot; scene.add(g);
  addCircle(tx - Math.cos(rot) * 1.5, tz + Math.sin(rot) * 1.5, .3);
  addCircle(tx + Math.cos(rot) * 1.5, tz - Math.sin(rot) * 1.5, .3);
})();

// ---------- dye vats: lib barrels wearing their colors ----------
for (const [dx, dz, mat] of [[4.2, -2.2, M_WOAD], [5.6, -1.2, M_WELD]]) {
  const vx = L.x + dx, vz = L.z + dz;
  barrel(vx, vz);   // registers its own collider
  const dye = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, .06, 8), mat);
  dye.position.set(vx, groundH(vx, vz) + 1.13, vz); scene.add(dye);
}

// ---------- wool sacks: Wynn's fleeces, arrived on Nell's cart ----------
(function woolSacks() {
  const sx = L.x + 2.5, sz = L.z + 3.5;
  const g = new THREE.Group();
  for (const [px, pz, s] of [[0, 0, .55], [.9, .3, .45], [.4, .8, .4]]) {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 6), M_CREAM);
    sack.position.set(px, s * .75, pz); sack.scale.y = .78; sack.castShadow = true; g.add(sack);
  }
  g.position.set(sx, groundH(sx, sz), sz); scene.add(g);
  addCircle(sx + .4, sz + .3, 1.1);
})();

// ---------- the dye fire: TENDED, low and even, under a tripod pot ----------
fires.push(campfire(L.x - 1.5, L.z + 1.5));
(function dyepot() {
  const px = L.x - 1.5, pz = L.z + 1.5;
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.1, 4), M.wood);
    leg.position.set(Math.cos(a) * .55, 1, Math.sin(a) * .55);
    leg.rotation.z = Math.cos(a) * .5; leg.rotation.x = -Math.sin(a) * .5; g.add(leg);
  }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.4, .32, .5, 8), M.charred);
  pot.position.y = 1.15; g.add(pot);
  const dye = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .05, 8), M_MADDER);
  dye.position.y = 1.42; g.add(dye);
  g.position.set(px, groundH(px, pz), pz); scene.add(g);
  // no collider of its own: campfire() already registered r=.9 at this spot,
  // and the tripod legs are thin (the torch rule)
})();

// ---------- the dye garden: weld and woad drifts (meads drift pattern) ----------
const M_DYEHEADS = [M_WELD, new THREE.MeshLambertMaterial({ color: 0x5a7a4a })];
function dyeDrift(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < rand(5, 7); i++) {
    const h = rand(.25, .5), px = rand(-1.1, 1.1), pz = rand(-1.1, 1.1);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.02, .03, h, 4), M.reed);
    stem.position.set(px, h / 2, pz);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.06, .1)),
      M_DYEHEADS[Math.floor(rand(0, M_DYEHEADS.length))]);
    head.position.set(px, h + .04, pz);
    g.add(stem, head);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
}
for (const [dx, dz] of [[-10, -4], [-12, -1], [-10.5, -7], [-8, -6.5]]) dyeDrift(L.x + dx, L.z + dz);

// a greeting for the walk-in from the village side (southwest)
signpost(L.x - 11, L.z - 5, -2.3);

// ---------- Weaver Ede — flavour NPC (small omens tier, LORE.md) ----------
// Ties the cloth trade into the realm's economy end-to-end (Wynn's wool in
// on Nell's cart, bolts out to Highgate and the village) and carries the
// stead's two seeded doors sideways, unexplained. Stands mid-yard between
// the fire and the lines; clearances re-scanned after the layout fix (see
// DESIGN.md): fire 2.9, lines post ~3.3, sacks ~4.3 (labels stay clear).
export const ede = spawnNPC('Weaver Ede', L.x + 1, L.z - .5, { shirt: 0x41628a, hat: 0x6a5a3a });
ede.flavor = [
  "Wynn's fleeces come east on Nell's cart, and they leave here as bolts for Highgate's backs. Every shirt in this realm crossed a loom like mine — mind your elbows on the warp.",
  "Warp first, weft after, and no hurrying either. The loom counts better than I do, and it holds a grudge if you argue.",
  "I can hear Nell's axle before I see the cart. That's washing day decided for me — wool waits for nobody's plans.",
  "A dye pot wants a fire like a held breath — low, even, never let it think it's a bonfire. Ruin the fire, ruin the color.",
  "One bolt from last winter won't take dye. Not madder, not woad, not weld — comes out the same ash-grey every time. I blame the water. I keep it folded at the bottom of the chest all the same.",
  "Every spring something robs my lines, and only ever the red thread. Magpies, I expect. Though I'll say this: I've never once caught a magpie at it.",
];
