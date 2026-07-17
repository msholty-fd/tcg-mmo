// The Kilnyard (DESIGN.md, 2026-07-16): a potter's yard on the southern
// grass at (-64,-165), west-southwest of Highgate's gates — the southern
// stretch between Highgate, Hollowmere, and the Bee Meads was the realm's
// biggest buildable unclaimed ground this survey. The archetype find:
// CLAY — every hearth in the realm holds a pot (the dye pot, the
// cauldrons, Marla's shelf stock) and none of it was fired anywhere. The
// Kilnyard retro-explains the realm's crockery the way the Loomstead
// retro-explained its shirts and the quarry its waystones.
// Sited by the numeric scan (kilnyard-scan): flattest r=10 disc in the
// region, center h -4.65, max deviation 0.64 within r=10 (quarry
// precedent 0.65), zero terrain edits; clearances — Highgate's circle
// 55.9, Hollowmere 61, Bee Meads 92, south world-bound 35 (the binding
// constraint). A potter sits near her market: Highgate is a short walk
// east, and the clay is under her feet.
// LORE relationship to the fire: TENDED — and deliberately the OTHER end
// of the tended spectrum from Ede's dye fire: the kiln is the hottest
// fire this side of the peaks, fed steady, shut in, and trusted dark
// ("you don't watch a kiln, you listen").
// Seeded doors (DESIGN.md/LORE.md, do not answer here): the firing that
// came out glazed when no glaze was put on, and the west pit that never
// runs dry.
// Earned its quest at iteration 28 (crock_order, Harrow's errand) and its
// road at 29 — a spur forks south off the Hollowmere road to the yard's
// north-edge stone (roads.js). A Kilnyard duelist stays seeded for the next
// duelists.js window (the Forge cascade's last step).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, fires, crate, barrel, signpost, spawnNPC } from './lib.js';

const K = { x: -64, z: -165 };   // heart (shared/zones.js CAMPS r=16)

// Fired terracotta against raw wet clay — the yard's own palette (the
// Hollowmere/Pell/Loomstead rule: new ground reads as itself).
const M_FIRED = new THREE.MeshLambertMaterial({ color: 0xb0623a });
const M_RAW   = new THREE.MeshLambertMaterial({ color: 0x8d7360 });
const M_WET   = new THREE.MeshLambertMaterial({ color: 0x74604f });
const M_GLAZE = new THREE.MeshLambertMaterial({ color: 0x5a7a6a });

// ---------- the kiln: the signature prop ----------
// A squat beehive kiln — brick drum, mud dome, an arched mouth with the
// fire banked inside. The group carries userData.fire and registers in
// fires[] so the mouth-glow flickers like every tended hearth (the same
// contract campfire() fulfills; the kiln IS this yard's campfire).
(function kiln() {
  const kx = K.x - 2, kz = K.z + 1;
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 1.6, 10), M_FIRED);
  drum.position.y = .8; drum.castShadow = true; drum.receiveShadow = true; g.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), M_RAW);
  dome.position.y = 1.6; dome.castShadow = true; g.add(dome);
  const flue = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, .8, 6), M_FIRED);
  flue.position.y = 3.3; g.add(flue);
  // the mouth: a dark arch facing the yard (east), fire banked inside
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.85, .95, .4), M.charred);
  mouth.position.set(1.35, .48, 0); g.add(mouth);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 6),
    new THREE.MeshLambertMaterial({ color: 0xff7a20, emissive: 0xdd4400 }));
  fire.position.set(1.42, .55, 0); g.add(fire); g.userData.fire = fire;
  const light = new THREE.PointLight(0xff8830, 1, 14); light.position.set(1.6, .9, 0); g.add(light);
  g.position.set(kx, groundH(kx, kz), kz); scene.add(g);
  addCircle(kx, kz, 1.9);
  fires.push(g);   // explicit registration — the flame animates (0992af6)
})();

// ---------- the clay pit: authored from props, zero terrain edits ----------
// A wet-slick disc flush with the ground (the pond technique, mud
// variant), a plank walk, a spade, and a pair of clay buckets. Walkable
// by design — you can stand in the potter's pit, it's mud, not a hole.
(function clayPit() {
  const px = K.x - 7.5, pz = K.z - 2.5;
  const h = Math.max(groundH(px, pz), groundH(px - 2, pz), groundH(px + 2, pz), groundH(px, pz - 2), groundH(px, pz + 2));
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, .08, 14), M_WET);
  pit.position.set(px, h + .05, pz); pit.receiveShadow = true; scene.add(pit);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(.7, .08, 3.4), M.wood);
  plank.position.set(px + 1.6, h + .14, pz + .8); plank.rotation.y = .4; scene.add(plank);
  const spade = new THREE.Group();
  const haft = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.5, 4), M.wood);
  haft.position.y = .75; haft.rotation.z = .5; spade.add(haft);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.26, .34, .05), M.metal);
  blade.position.set(.35, .18, 0); blade.rotation.z = .5; spade.add(blade);
  spade.position.set(px - 1.2, h + .05, pz - 1.4); scene.add(spade);
  for (const [bx, bz] of [[px + 2.6, pz - 1.8], [px + 3.1, pz - 1.1]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.28, .22, .5, 7), M.wood);
    b.position.set(bx, groundH(bx, bz) + .25, bz); b.castShadow = true; scene.add(b);
    const lump = new THREE.Mesh(new THREE.SphereGeometry(.2, 6, 5), M_WET);
    lump.position.set(bx, groundH(bx, bz) + .55, bz); lump.scale.y = .6; scene.add(lump);
  }
  addCircle(px + 2.85, pz - 1.45, .55);   // the bucket pair; the pit itself is walkable
})();

// ---------- drying boards: rows of green ware waiting for the kiln ----------
function dryingBoard(x, z, rot) {
  const g = new THREE.Group();
  for (const px of [-1.3, 1.3]) {
    const trestle = new THREE.Mesh(new THREE.BoxGeometry(.12, .8, .7), M.wood);
    trestle.position.set(px, .4, 0); g.add(trestle);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.1, .09, .8), M.wood);
  board.position.y = .84; board.castShadow = true; g.add(board);
  for (let i = 0; i < 6; i++) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rand(.09, .13), rand(.07, .1), rand(.18, .3), 7), M_RAW);
    pot.position.set(-1.25 + i * .5, .98, rand(-.15, .15)); pot.castShadow = true; g.add(pot);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 3.1, .8, rot);
}
dryingBoard(K.x + 4, K.z - 3.5, .35);
dryingBoard(K.x + 5.2, K.z - 1.2, .5);

// ---------- fired stock: stacked crocks, one glazed showpiece ----------
(function potStacks() {
  const sx = K.x + 3.5, sz = K.z + 2.8;
  const g = new THREE.Group();
  for (const [px, pz, s, mat] of [[0, 0, .42, M_FIRED], [.75, .2, .34, M_FIRED], [.3, .7, .3, M_FIRED], [-.55, .45, .28, M_GLAZE]]) {
    const crock = new THREE.Mesh(new THREE.CylinderGeometry(s, s * .8, s * 1.9, 8), mat);
    crock.position.set(px, s * .95, pz); crock.castShadow = true; g.add(crock);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(s, .04, 5, 10), mat);
    lip.rotation.x = Math.PI / 2; lip.position.set(px, s * 1.9, pz); g.add(lip);
  }
  g.position.set(sx, groundH(sx, sz), sz); scene.add(g);
  addCircle(sx + .15, sz + .35, 1.15);
})();

// shard heap — the kiln's tax, flat clutter like bone piles: no collider
(function shards() {
  const hx = K.x + 6.3, hz = K.z + .6;
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(rand(.09, .18)), M_FIRED);
    shard.position.set(rand(-.7, .7), .06, rand(-.7, .7));
    shard.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6)); g.add(shard);
  }
  g.position.set(hx, groundH(hx, hz), hz); scene.add(g);
})();

// ---------- the potter's wheel ----------
(function wheel() {
  const wx = K.x + .5, wz = K.z - 2.2;
  const g = new THREE.Group();
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .45, 7), M.wood);
  stool.position.set(.8, .22, 0); g.add(stool);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.55, .62, .18, 10), M.wood);
  base.position.y = .1; g.add(base);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .08, 12), M_WET);
  disc.position.y = .65; g.add(disc);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .5, 5), M.wood);
  spindle.position.y = .4; g.add(spindle);
  const halfpot = new THREE.Mesh(new THREE.CylinderGeometry(.14, .18, .2, 7), M_WET);
  halfpot.position.y = .79; g.add(halfpot);
  g.position.set(wx, groundH(wx, wz), wz); g.rotation.y = -.6; scene.add(g);
  addCircle(wx, wz, .7);
})();

// ---------- the potter's hut (Wether Downs pattern verbatim) ----------
(function hut() {
  const hx = K.x + .5, hz = K.z + 7, rot = Math.PI - .1;   // north backdrop, door south into the yard
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

crate(K.x - 3.5, K.z + 5.5, .4); barrel(K.x - 2.2, K.z + 6.2);
signpost(K.x + 11, K.z + 2, 1.35);   // greets the walk-in from Highgate, east

// ---------- Potter Fern — flavour NPC (small omens tier, LORE.md) ----------
// Ties clay into the economy end-to-end (the pit under her feet, Tamsin's
// charcoal in the kiln, crocks to Marla's shelf and Highgate's market) and
// carries the yard's two seeded doors sideways, unexplained. Stands
// mid-yard between the wheel and the kiln; nearest colliders: wheel 2.4,
// kiln 3.6, drying board ~3.2 (labels stay clear).
export const fern = spawnNPC('Potter Fern', K.x + 1.5, K.z + .3, { shirt: 0x9a6a4a, hat: 0x6a5040 });
fern.flavor = [
  "Marla sells my crocks and Highgate haggles over them — then buys the lot anyway. Every hearth in this realm has a pot of mine on it or one it broke.",
  "Clay's honest. Center it true and it stays true; force it and it wobbles forever. People too, mostly.",
  "Tamsin's charcoal burns hot enough for stoneware — wood's for warming, charcoal's for making. Her sacks walk a long way south to end up in my kiln.",
  "The kiln's the hottest fire this side of the peaks, and it still minds me. Feed it steady, shut the door, and trust it dark — you don't watch a kiln, you listen to it.",
  "One firing last spring came out glazed rim to foot — a good glaze, a green I've never mixed — and I put no glaze on that load at all. Sold the lot by noon. Couldn't do it again if you paid me.",
  "The west pit never runs dry. Dig it to the boards on market day, it's smooth and full by the next. Good clay, better manners. I don't ask.",
];
