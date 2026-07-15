// The Bee Meads (DESIGN.md, 2026-07-15): an apiary in a wildflower meadow at
// (-147,-93) — the deep southwest corner became the realm's biggest unclaimed
// stretch once Pell's Pond took the northwest, and *sweetness* the missing
// food/craft archetype (farm = Harrow, flock = Wynn, fish = Pell, trade =
// Marla/Highgate — nothing sweet, and no wax: half the realm's candles have
// to come from somewhere). Sited by the Pell's Pond numeric scan: the
// flattest r=12 disc in the whole quadrant (max deviation 0.35), zero
// terrain edits.
// LORE relationship to the fire: TENDED — the keeper's fire, plus the wax
// trade that feeds every candle on Highgate's hill; and the smoker, which
// gentles bees by making them forget their quarrel (a deliberate light echo,
// never explained).
// Card-light, world-module-only, no duelist — the meads can host one later
// if the loop wants it (Wether Downs → Tolly precedent). Seeded hooks: the
// hive that emptied at midsummer with the honey untouched, and the bees
// refusing the mire's edge. Do not pay either off without a content phase.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, crate, barrel, signpost, spawnCritter, spawnNPC } from './lib.js';

const BM = { x: -147, z: -93 };   // heart (constants.js CAMPS r=17)

// Local dressing palette. Straw is deliberately paler than M.hay so skeps
// read as woven baskets, not feed bales.
const M_STRAW  = new THREE.MeshLambertMaterial({ color: 0xcbb27a });
const M_STRAWB = new THREE.MeshLambertMaterial({ color: 0xa8905c });
const M_HONEY  = new THREE.MeshLambertMaterial({ color: 0xc98a2a });
const M_BEE    = new THREE.MeshLambertMaterial({ color: 0x2a2418 });
const M_BEE2   = new THREE.MeshLambertMaterial({ color: 0xc9a83a });
// Flower heads — a small folk palette shared across drifts (materials are
// shared so 40-odd heads cost 4 materials, not 40).
const M_FLOWERS = [0xd8b83a, 0xd8d4c4, 0x7a6aa8, 0xb85a6a]
  .map(c => new THREE.MeshLambertMaterial({ color: c }));

// Wildflower drifts — the meadow's identity. Same budget stance as the
// Darkwood's glowcaps (clusters of 2-mesh low clutter, walkable, no
// collider): 8 drifts x 5-6 flowers ≈ 90 small meshes.
function flowerDrift(x, z) {
  const g = new THREE.Group();
  const mat = M_FLOWERS[Math.floor(rand(0, M_FLOWERS.length))];
  const mat2 = M_FLOWERS[Math.floor(rand(0, M_FLOWERS.length))];
  for (let i = 0; i < rand(5, 7); i++) {
    const h = rand(.3, .55), px = rand(-1.2, 1.2), pz = rand(-1.2, 1.2);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.02, .03, h, 4), M.reed);
    stem.position.set(px, h / 2, pz);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.07, .12)), rand(0, 1) < .5 ? mat : mat2);
    head.position.set(px, h + .04, pz);
    g.add(stem, head);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
}
for (const [dx, dz] of [[-6, 4], [-10, -1], [-8, -7], [-3, 8], [-12, 5], [2, 10], [-2, -10], [-13, -5]])
  flowerDrift(BM.x + dx, BM.z + dz);

// Bee skeps — woven straw dome hives on low plank benches, an arc of five
// facing the flowers. Waist-high and solid: small circle colliders.
function skep(x, z, rot) {
  const g = new THREE.Group();
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, .12, .9), M.wood);
  bench.position.y = .42; bench.castShadow = true; g.add(bench);
  for (const [dx, dz2] of [[-.4, -.3], [.4, -.3], [-.4, .3], [.4, .3]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .42, 5), M.wood);
    leg.position.set(dx, .21, dz2); g.add(leg);
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.48, 8, 7), M_STRAW);
  dome.position.y = .84; dome.scale.set(1, .95, 1); dome.castShadow = true; g.add(dome);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.44, .05, 5, 12), M_STRAWB);
  band.rotation.x = Math.PI / 2; band.position.y = .66; g.add(band);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.16, .1, .08), M.charred);
  mouth.position.set(0, .55, .46); g.add(mouth);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addCircle(x, z, .7);
}
for (const [dx, dz, rot] of [[-4.5, -2.5, .5], [-6, .5, .9], [-6.5, 3.5, 1.3], [-5.5, 6.5, 1.7], [-3, 9, 2.1]])
  skep(BM.x + dx, BM.z + dz, rot);

// The smoker — a little bellows-can by the skep row. Thin prop, no collider
// (the torch/banner rule).
(function smoker() {
  const sx = BM.x - 3.5, sz = BM.z - 1;
  const g = new THREE.Group();
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.14, .17, .45, 7), M.metal);
  can.position.y = .55; g.add(can);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(.09, .3, 6), M.metal);
  spout.position.y = .9; g.add(spout);
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, .34, 7), M.trunk);
  stump.position.y = .17; g.add(stump);
  g.position.set(sx, groundH(sx, sz), sz); scene.add(g);
})();

// The keeper's hut — the Wether Downs hut pattern verbatim (one room, plank
// door, dark roof; collider + camera occluder), door turned toward the skeps.
(function hut() {
  const hx = BM.x + 8, hz = BM.z - 4, rot = 2.35;
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

// The keeper's fire — small, outside the door. campfire() registers in
// fires[] so it ramps with darkness like every tended hearth in the realm.
campfire(BM.x + 4.5, BM.z - .5);

// The honey table — plank table with the season's pots, waiting on Marla.
(function honeyTable() {
  const tx = BM.x + 6.5, tz = BM.z + 2.5, rot = .4;
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, .1, 1), M.wood);
  top.position.y = .8; top.castShadow = true; g.add(top);
  for (const dx of [-.75, .75]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.12, .8, .9), M.wood);
    leg.position.set(dx, .4, 0); g.add(leg);
  }
  for (const [dx, dz] of [[-.5, .15], [-.05, -.2], [.45, .1], [.2, .3]]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.11, .13, .26, 7), M_HONEY);
    pot.position.set(dx, .98, dz); g.add(pot);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .04, 7), M.wood);
    lid.position.set(dx, 1.13, dz); g.add(lid);
  }
  g.position.set(tx, groundH(tx, tz), tz); g.rotation.y = rot; scene.add(g);
  addRect(tx, tz, 1.8, 1, rot);
})();

crate(BM.x + 10.5, BM.z - .5, .2); barrel(BM.x + 11, BM.z + 1.5);
signpost(BM.x + 12, BM.z + 6, .9);   // greets the walk-in from the Hollowmere side

// The bees — two drifting swarm motes: a knot of specks at chest height that
// wanders the skep row via the ordinary critter wander (module-local mesh,
// single-region rule). Always out — hour-gating would need a main.js update
// hook this module deliberately doesn't add.
function beeSwarm() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 4, 3), rand(0, 1) < .3 ? M_BEE2 : M_BEE);
    b.position.set(rand(-.3, .3), 1.2 + rand(-.25, .25), rand(-.3, .3));
    g.add(b);
  }
  return g;
}
spawnCritter(beeSwarm, BM.x - 5, BM.z + 2);
spawnCritter(beeSwarm, BM.x - 8, BM.z + 6);

// Beeman Odo — flavour NPC (Bram/Wayfarer/Harrow/Wynn/Pell tier:
// superstition and small omens, per LORE.md). Ties the meads into the
// realm's economy the way Pell's lines do the pond — and carries the zone's
// two seeded hooks sideways, unexplained.
export const odo = spawnNPC('Beeman Odo', BM.x + 2, BM.z + 1.5, { shirt: 0x8a7a4e, hat: 0xcbb27a });
odo.flavor = [
  "Honey goes to Marla; the wax walks to Highgate. Half the candles on that hill are my bees' summer. Nobody thinks of that, lighting one.",
  "You're to tell the bees the news — weddings, deaths, who won big at the table. Skip the telling and they take it hard. Take it hard enough, they leave. Where to, nobody's ever followed.",
  "Smoke gentles them. They forget what they were cross about, just for a moment. Useful. I try not to think on it past useful.",
  "They'll work every flower from here to the downs, but not east past the reeds. Sweetest blossom I ever saw grows on the mire's edge and not one bee will touch it. Bees have their reasons. They've never once shared them with me.",
  "Come autumn I put a barrel of mead up. The Wayfarer swears it's the best in the realm. The Wayfarer swears that about most barrels.",
  "Lost a hive at midsummer. Not sickness — comb full, honey to the brim, not one bee left in it, and none dead on the board neither. Twelve years keeping. They don't do that. They did it.",
];
