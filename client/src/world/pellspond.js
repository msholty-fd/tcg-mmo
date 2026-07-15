// Pell's Pond (DESIGN.md, 2026-07-15): a fisher's landing at (-141,58), the
// realm's first standing water beyond Hollowmere's bog puddles. Iteration 6
// of the worldbuilding loop: the northwest wedge (beyond Red-Sash Camp) was
// the biggest unclaimed stretch, and *fisherfolk* the missing food archetype
// (farm = Harrow, flock = Wynn, trade = Marla/Highgate — nothing from
// water). The pond sits on a natural flat low in groundH — scanned, not
// terraformed: within r=9 of this center the ground varies < 0.3, so a flat
// water disc reads as a pond with zero terrain edits.
// LORE relationship to the fire: TENDED — the smoking fire, kept low and
// kept always (smoke preserves what flame would eat).
// The "pond can host a duelist later" option was taken one iteration after
// the landmark shipped (the exact Wether Downs → Tolly gap): Dace the
// Netmender, below. Seeded hooks still open: whatever the fish over the
// deep hole have gone shy of, and who dug the pond. Do not pay either off
// without a content phase.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, crate, barrel, signpost, spawnCritter, spawnNPC, spawnDuelist } from './lib.js';

const PP = { x: -141, z: 58 };   // heart (constants.js CAMPS r=18)
const POND_R = 9;

// Local dressing palette — clean cool water, deliberately NOT M.bogWater
// (the mire's murk is Hollowmere's identity; this is living water).
const M_POND = new THREE.MeshLambertMaterial({ color: 0x2c4e58 });
const M_LILY = new THREE.MeshLambertMaterial({ color: 0x4a7a3e, side: THREE.DoubleSide });
const M_FISH = new THREE.MeshLambertMaterial({ color: 0x9aa8ac });
const M_DUCK = new THREE.MeshLambertMaterial({ color: 0x7a6248 });
const M_DUCKHEAD = new THREE.MeshLambertMaterial({ color: 0x2a5a3a });
const M_HULL = new THREE.MeshLambertMaterial({ color: 0x5a4632 });

// The water: one flat disc set just above the HIGHEST ground inside its rim,
// so no turf pokes through (sampled at build time — robust if the terrain
// math ever shifts). Shallow and walkable, like Hollowmere's pools: wading
// in is the charm, so no collider.
let waterY = -Infinity;
for (let ri = 0; ri <= 3; ri++) for (let ai = 0; ai < 14; ai++) {
  const d = (ri / 3) * POND_R, a = (ai / 14) * Math.PI * 2;
  waterY = Math.max(waterY, groundH(PP.x + Math.cos(a) * d, PP.z + Math.sin(a) * d));
}
waterY += .05;
{
  const p = new THREE.Mesh(new THREE.CircleGeometry(POND_R, 26), M_POND);
  p.rotation.x = -Math.PI / 2; p.position.set(PP.x, waterY, PP.z);
  p.receiveShadow = true; scene.add(p);
}

// Lily pads — small notched discs riding the water, the "living pond" read
// against Hollowmere's dead pools. Kept off the jetty's east lane.
for (const [dx, dz, r] of [[-2.5, -3, .55], [3, 3.5, .45], [-4, 3, .6], [1.5, -5, .5], [-5.5, -.5, .4]]) {
  const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 7, .5, 5.6), M_LILY);
  pad.rotation.x = -Math.PI / 2; pad.rotation.z = rand(0, Math.PI * 2);
  pad.position.set(PP.x + dx, waterY + .02, PP.z + dz); scene.add(pad);
}

// Reeds around the rim (same thin-stalk, no-collider stance as Hollowmere's
// — but no cattails: gone-to-seed heads are the mire's motif).
function reedClump(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const h = rand(.9, 1.7);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .05, h, 4), M.reed);
    r.position.set(rand(-.6, .6), h / 2, rand(-.6, .6)); r.rotation.z = rand(-.18, .18); g.add(r);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
}
for (const a of [.9, 1.6, 2.3, 3.1, 3.8, 4.6]) // rim angles, leaving the east (jetty) shore open
  reedClump(PP.x + Math.cos(a) * (POND_R + rand(.2, 1.2)), PP.z + Math.sin(a) * (POND_R + rand(.2, 1.2)));

// Shore stones — step-over pebbles, no colliders (wilds.js small-rock rule).
for (const a of [.3, 1.2, 2.7, 4.1, 5.3]) {
  const d = POND_R + rand(.3, 1);
  const x = PP.x + Math.cos(a) * d, z = PP.z + Math.sin(a) * d;
  const s = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(.3, .6)), M.rock);
  s.position.set(x, groundH(x, z) + .15, z); s.rotation.y = rand(0, Math.PI); s.castShadow = true;
  scene.add(s);
}

// The jetty — plank walk from the east bank out over the water, posts sunk
// through it. Solid (rect collider): planks at knee height would clip a
// wading player, so you fish beside it, not through it.
(function jetty() {
  const jz = 58.5, x0 = -131.8, x1 = -137.8;      // foot on the bank → out over the pond
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), .12, 1.4), M.wood);
  deck.position.set((x0 + x1) / 2, waterY + .55, jz); deck.castShadow = true; deck.receiveShadow = true; g.add(deck);
  for (const px of [-132.6, -135, -137.4]) for (const pz of [jz - .55, jz + .55]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 1.6, 5), M.wood);
    post.position.set(px, waterY - .2, pz); g.add(post);
  }
  scene.add(g);
  addRect((x0 + x1) / 2, jz, Math.abs(x1 - x0), 1.4, 0);
})();

// The fisher's hut — the Wether Downs hut pattern verbatim (one room, plank
// door, dark roof; collider + camera occluder), door turned toward the pond.
(function hut() {
  const hx = PP.x + 12, hz = PP.z - 4, rot = -1.15;
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

// The smoking fire — LORE "tended," made literal: kept low, kept always,
// with the drying rack hung beside it. campfire() registers in fires[] so
// it ramps with darkness like every kept hearth in the realm.
campfire(PP.x + 10, PP.z + 2.5);

// Drying rack — two posts, a crossbar, and the catch hung to smoke.
(function rack() {
  const rx = PP.x + 11.5, rz = PP.z + 4.5, rot = .5;
  const g = new THREE.Group();
  for (const dx of [-1.1, 1.1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.9, 5), M.wood);
    post.position.set(dx, .95, 0); post.castShadow = true; g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.4, 5), M.wood);
  bar.rotation.z = Math.PI / 2; bar.position.y = 1.75; g.add(bar);
  for (const dx of [-.8, -.4, .1, .55, .9]) {
    const fish = new THREE.Mesh(new THREE.SphereGeometry(.09, 5, 4), M_FISH);
    fish.scale.set(.6, 2.2, .35); fish.position.set(dx, 1.42, 0); g.add(fish);
  }
  g.position.set(rx, groundH(rx, rz), rz); g.rotation.y = rot; scene.add(g);
  // Thin posts — no collider, the torch/banner rule.
})();

// The boat — hauled out and turned turtle on the south bank for patching.
(function boat() {
  const bx = PP.x - 2, bz = PP.z + 10.5, rot = .45;
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1.5, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), M_HULL);
  hull.scale.set(.55, .45, 1); hull.rotation.y = rot;
  hull.position.set(bx, groundH(bx, bz) + .1, bz); hull.castShadow = true; scene.add(hull);
  const keel = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, 2.6), M.wood);
  keel.rotation.y = rot; keel.position.set(bx, groundH(bx, bz) + .78, bz); scene.add(keel);
  addCircle(bx, bz, 1.2);
})();

crate(PP.x + 13.5, PP.z - .5, .3); barrel(PP.x + 14, PP.z + 1.5);
signpost(PP.x + 15, PP.z - 8, 2.2);   // greets the walk-in from the Red-Sash side

// The ducks — module-local mesh (single-region rule), paddling the shallows
// and waddling the bank via the ordinary critter wander.
function duckMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.22, 7, 6), M_DUCK);
  body.position.y = .2; body.scale.set(1, .75, 1.35); body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.11, 6, 5), Math.random() < .5 ? M_DUCKHEAD : M_DUCK);
  head.position.set(0, .42, .3); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 4),
    new THREE.MeshLambertMaterial({ color: 0xc8862a }));
  beak.rotation.x = Math.PI / 2; beak.position.set(0, .4, .45); g.add(beak);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.07, .2, 4), M_DUCK);
  tail.rotation.x = -Math.PI / 2.6; tail.position.set(0, .26, -.32); g.add(tail);
  return g;
}
for (const [dx, dz] of [[-3, 1], [3.5, -2.5], [-1, 5.5]]) spawnCritter(duckMesh, PP.x + dx, PP.z + dz);

// Fisher Pell — flavour NPC (Bram/Wayfarer/Harrow/Wynn tier: superstition
// and small omens, per LORE.md). Ties the pond into the realm's economy the
// way Harrow's and Wynn's lines do, keeps the fire rule without preaching
// it, and carries the zone's seeded hook sideways.
export const pell = spawnNPC('Fisher Pell', PP.x + 8.5, PP.z + .5, { shirt: 0x4a6a7a, hat: 0x6a5a42 });

// Dace the Netmender — the pond's duelist (the seeded option in this
// module's header, taken one iteration later — the exact Wether Downs →
// Tolly gap): a young netmender working beside the beached boat on the
// south bank, minimal footprint (Tolly/Cobb/Kestrel pattern — no new
// structure, no CAMPS change). Pell stays a flavour NPC on purpose:
// converting him would short-circuit his six lines behind the duelist
// interaction (the known dialogue-priority gap).
export const dace = spawnDuelist('dace', PP.x - 5.5, PP.z + 12, { shirt: 0x3e5a66, hat: 0x5a4a36 });
pell.flavor = [
  "Perch, mostly. Eel when the traps mind their business. Smoked right, a fish keeps the winter.",
  "Smoke keeps what flame would eat. Same log either way — the difference is patience.",
  "Marla trades me flour for a rackful and sells it on to Highgate at thrice. Knowing's not the same as minding.",
  "The herons come over from the mire of an evening. They never fish here. Polite of them, I've always thought.",
  "Shallow end bites all day. Over the deep hole they've gone shy, and that's a month now. Fish know things — they're just poor at saying.",
  "My grandmother netted this pond, and hers before that. Nobody living remembers who dug it. Somebody must have — ponds don't dig themselves.",
];
