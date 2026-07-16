// Hobb's Quarry (DESIGN.md, 2026-07-15): a working stonecutter's yard at
// (157,-20) — the east band between Gruk's Hollow, the Dial Stone, and the
// world's edge became the realm's biggest unclaimed stretch once the western
// circuit closed, and *stone* the missing craft archetype: the realm is full
// of worked stone (every waystone on every road, Highgate's walls, the
// village hearthstones, two stone circles, a sundial) and none of it was cut
// anywhere. The quarry retro-explains the realm's most visible crafted
// objects the way the Bee Meads retro-explained Highgate's candles.
// Sited by the Pell's Pond numeric-scan technique: flattest r=10 disc in the
// whole wedge (max deviation 0.65), zero terrain edits; the worked face is
// authored from props (the Cinderhollow Mine precedent — stacked rock,
// wherever placed, reads as the hill being eaten into).
// LORE relationship to the fire: TENDED — Hobb's kept fire by the hut, and
// the trade itself: every hearth in the realm is mostly stone ("fire gets
// the songs; stone does the holding" — one light echo, never explained).
// Seeded hooks (see DESIGN.md/LORE.md): frost-split blocks coming out of the
// face in midsummer, and the dressed millstone waiting on a mill nobody has
// built. The quarry duelist landed one loop later as seeded (Hew, iteration
// 15, the Tolly/Dace/Wick precedent); the yard now has business, so an east
// road is the region's open seed (the downs rule).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, fires, crate, barrel, signpost, spawnNPC, spawnDuelist } from './lib.js';

const Q = { x: 157, z: -20 };   // heart (constants.js CAMPS r=16)

// Fresh-cut stone — brighter than M.waystone's weathered pale, so new work
// reads new against the grey outcrop (the tilled-soil trick: squared corners
// and clean faces say worked-by-hand at a glance).
const M_CUT = new THREE.MeshLambertMaterial({ color: 0xcbc4b2 });

// ---------- the worked face: benched ledges on the yard's east side ----------
// Two stepped tiers of long cut ledges, flanked and capped by natural
// boulders (M.rock) so the face reads as a grass hillside being cut away,
// open toward the western approach.
function ledge(x, z, w, h, d, rot) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_CUT);
  b.position.set(x, groundH(x, z) + h / 2, z); b.rotation.y = rot;
  b.castShadow = true; b.receiveShadow = true; scene.add(b);
  addRect(x, z, w, d, rot);
}
function boulder(x, z, s) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s), M.rock);
  r.position.set(x, groundH(x, z) + s * .35, z);
  r.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
  r.castShadow = true; r.receiveShadow = true; scene.add(r);
  addCircle(x, z, s * .85);
}
// lower bench — a shallow arc facing the yard
ledge(Q.x + 6.5, Q.z - 4, 2.6, 2.0, 6.5, Math.PI / 2 - .15);
ledge(Q.x + 7, Q.z + 2.5, 2.6, 1.8, 6, Math.PI / 2 + .12);
// upper tier, set back — the step silhouette
ledge(Q.x + 9.5, Q.z - 1, 2.8, 3.4, 8.5, Math.PI / 2 - .04);
// unworked cap and flanks
boulder(Q.x + 12.5, Q.z - 1, 3.0);
boulder(Q.x + 11, Q.z - 8, 2.6);
boulder(Q.x + 11.5, Q.z + 6, 2.3);

// grit heaps — pale rubble the cutting coughs up (the mine's spoil-heap
// shape, grey instead of charred: tailings of stone, not coal)
for (const [dx, dz, s] of [[3, -8.5, 1.2], [4.5, 6.5, 1.0]]) {
  const heap = new THREE.Mesh(new THREE.ConeGeometry(s, s * .8, 7), M.rock);
  const hx = Q.x + dx, hz = Q.z + dz;
  heap.position.set(hx, groundH(hx, hz) + s * .35, hz); heap.castShadow = true; scene.add(heap);
  addCircle(hx, hz, s * .7);
}

// ---------- the yard ----------
// Stacked cut blocks — neat squared piles, the quarry's shelf stock.
function blockStack(x, z, rot, tall) {
  const g = new THREE.Group();
  for (const [dx, dy, dz, ry] of tall
    ? [[-.5, .35, 0, .06], [.55, .35, .1, -.04], [0, 1.05, 0, .12]]
    : [[-.45, .35, 0, -.05], [.5, .35, -.05, .08]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, .7, .9), M_CUT);
    b.position.set(dx, dy, dz); b.rotation.y = ry; b.castShadow = true; g.add(b);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 2.6, 1.2, rot);
}
blockStack(Q.x - 1, Q.z - 5.5, .3, true);
blockStack(Q.x + 1.5, Q.z + 5, -.4, false);

// The half-cut waystone on its sledge — the signature prop: the exact shaft
// shape of every roadmarker in the realm (roads.js waystone()), lying on its
// side, no gilded band yet — the gilding is Highgate's coin, the stone is
// Hobb's.
(function sledge() {
  const sx = Q.x - 3.5, sz = Q.z + 1, rot = .55;
  const g = new THREE.Group();
  for (const dx of [-.55, .55]) {
    const runner = new THREE.Mesh(new THREE.BoxGeometry(.18, .22, 3), M.wood);
    runner.position.set(dx, .11, 0); g.add(runner);
  }
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.3, .12, 2.6), M.wood);
  bed.position.y = .28; bed.castShadow = true; g.add(bed);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.32, .5, 2.2, 5), M_CUT);
  shaft.rotation.x = Math.PI / 2; shaft.position.y = .74; shaft.castShadow = true; g.add(shaft);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.44, .38, .28, 5), M_CUT);
  cap.rotation.x = Math.PI / 2; cap.position.set(.45, .5, 1.05); g.add(cap);
  g.position.set(sx, groundH(sx, sz), sz); g.rotation.y = rot; scene.add(g);
  addRect(sx, sz, 1.5, 3.1, rot);
})();

// Shear-legs hoist over the face's lower bench — three lashed poles and a
// hanging rope. Thin poles: no collider (the torch/banner rule).
(function shearLegs() {
  const hx = Q.x + 4.2, hz = Q.z - 1;
  const g = new THREE.Group();
  const apexY = 3.3;
  for (const a of [0, 2.1, 4.2]) {
    const foot = 1.5;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 3.7, 5), M.wood);
    pole.position.set(Math.cos(a) * foot * .5, apexY / 2, Math.sin(a) * foot * .5);
    pole.rotation.z = Math.cos(a) * .42; pole.rotation.x = -Math.sin(a) * .42;
    pole.castShadow = true; g.add(pole);
  }
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.6, 4), M.charred);
  rope.position.y = apexY - .9; g.add(rope);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 5, 8), M.ironBand);
  hook.position.y = apexY - 1.75; g.add(hook);
  g.position.set(hx, groundH(hx, hz), hz); scene.add(g);
})();

// Mallet and chisel resting on a waist-high block — someone works here.
(function tools() {
  const tx = Q.x + 3, tz = Q.z + 2.2;
  const g = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(.9, .75, .8), M_CUT);
  block.position.y = .375; block.castShadow = true; g.add(block);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .28, 7), M.wood);
  head.rotation.z = Math.PI / 2; head.position.set(-.1, .82, .1); g.add(head);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 5), M.wood);
  handle.rotation.x = Math.PI / 2.3; handle.position.set(-.1, .84, -.15); g.add(handle);
  const chisel = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, .4), M.metal);
  chisel.position.set(.25, .78, 0); chisel.rotation.y = .5; g.add(chisel);
  g.position.set(tx, groundH(tx, tz), tz); g.rotation.y = -.3; scene.add(g);
  addCircle(tx, tz, .55);
})();

// The mason's hut — the Wether Downs hut pattern verbatim (collider + camera
// occluder), door turned east toward the yard and the face.
(function hut() {
  const hx = Q.x - 8, hz = Q.z - 3, rot = 1.45;
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

// The millstone — dressed, trued, and leaning against the hut: ten years
// waiting on a mill that's still all talk (a seeded door the windmill option
// in DESIGN.md's ledger can walk through one day).
(function millstone() {
  const mx = Q.x - 6.2, mz = Q.z - .8;
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .3, 16), M_CUT);
  disc.rotation.x = Math.PI / 2 - .28;   // leaning back against the hut wall
  disc.position.y = 1.0; disc.castShadow = true; g.add(disc);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .34), M.charred);
  eye.rotation.x = -.28; eye.position.set(0, 1.0, .02); g.add(eye);
  g.position.set(mx, groundH(mx, mz), mz); g.rotation.y = 1.45; scene.add(g);
  addCircle(mx, mz, .9);
})();

// Hobb's kept fire, outside the hut door — TENDED, and registered in fires[]
// so the flame animates like every other tended hearth (note: explicit push;
// campfire() itself does not self-register).
fires.push(campfire(Q.x - 4.5, Q.z - 4.5));

crate(Q.x - 8.5, Q.z + 2.5, .5); barrel(Q.x - 7, Q.z + 3.8);
signpost(Q.x - 12, Q.z + 1, -1.8);   // greets the walk-in from the west

// Mason Hobb — flavour NPC (Bram/Wayfarer/Harrow/Wynn/Pell tier:
// superstition and small omens, per LORE.md). Ties the yard into the realm's
// economy the way Pell's lines do the pond — waystones, hearthstones,
// Highgate's walls — and carries the zone's two seeded hooks sideways,
// unexplained. Stands mid-yard between the sledge and the face; nearest
// colliders: tool block 2.8, block stack ~3.5, sledge ~4 (labels stay clear).
export const hobb = spawnNPC('Mason Hobb', Q.x + .5, Q.z + .5, { shirt: 0x8a8578, hat: 0x4e483c });
// Hew the Splitter — the quarry's duelist (worldbuilding iteration 15, the
// seeded apprentice cutter): Hobb marks the seams, Hew sets the feathers and
// wedges and splits the blocks out, and drills with cards between splits —
// splitting and dueling are the same lesson: read the seam, set your line,
// and hold. Stands in the open working ground between the block stacks and
// the lower bench (numeric clearance scan: tall block stack 1.38, lower
// bench ~1.6, Hobb 5.1 — labels and the ⚔ badge stay clear). Route-trainer
// tier: deck/rewards in shared/sets/core/duelists.js, no server change.
export const hew = spawnDuelist('hew', Q.x + 1.5, Q.z - 4.5, { shirt: 0xa39a84, hat: 0x7a715c });

hobb.flavor = [
  "Highgate's walls, the village hearthstones, half the cairns you've walked past — this yard's cut, or my father's, or his. Stone doesn't say who shaped it. So I'm saying.",
  "Every waystone on every road in the realm went out of here on a sledge. The gilding's Highgate's coin. The stone's ours.",
  "A hearth is mostly stone, friend. Fire gets the songs; the stone does the holding. Neither works alone.",
  "That's a millstone — dressed, trued, ten years waiting on a mill somebody keeps meaning to build. Harrow still carts his grain to Highgate whole. I keep it swept. It'll keep.",
  "Stone splits along frost, so you learn winter's calendar or you waste good rock. Lately I'm pulling frost-split blocks out of that face in midsummer. Thirty years cutting. The calendar's never been wrong before.",
  "The skywatcher came round wanting an hour stone cut, to make that ring twelve again. Wouldn't name the hour it stands for. How do you cut a stone for an hour nobody will own?",
];
