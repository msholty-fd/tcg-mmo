import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, hayBale, crate, barrel, spawnNPC, spawnDuelist } from './lib.js';

// ---------- Harrow's Field: a working farmstead (x=-55 z=-28) ----------
// The first *cultivated* place — every location so far is wild, martial, or
// mercantile; nothing showed where Meadowbrook's food actually comes from.
// A barn, a fenced paddock, tilled crop rows, a scarecrow, and Farmer Harrow
// (a flavour NPC) west-southwest of the village in the Boarlands. Reuses
// hayBale()/crate()/barrel() plus three new farm builders. Card-light,
// world.js-only. Fences are cosmetic (no colliders) — a low rail you'd step
// over, same call as the open market stall/banners; avoids a janky
// invisible-wall-with-gaps feel from post-only colliders.

function barn(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 6), M.wood);
  b.position.y = 2.25; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.8, 4), M.roof);
  r.position.y = 5.9; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  // big dark barn door on the +z face, plus a hayloft hatch above it
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, .15), M.soil);
  door.position.set(0, 1.5, 3.01); g.add(door);
  const loft = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, .15), M.soil);
  loft.position.set(0, 4, 3.01); g.add(loft);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 8, 6, rot);
  camCollidables.push(g);
}

// A run of fence posts + top rail between two points. Cosmetic (see note).
function fenceRun(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(len / 2.2)), rot = Math.atan2(dx, dz);
  for (let i = 0; i <= n; i++) {
    const px = x1 + dx * (i / n), pz = z1 + dz * (i / n);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 1.1, 5), M.wood);
    post.position.set(px, groundH(px, pz) + .55, pz); post.castShadow = true; scene.add(post);
  }
  // two rails (upper/lower) spanning the whole run, laid at the midpoint
  const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
  for (const ry of [.5, .9]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.06, .08, len), M.wood);
    rail.position.set(mx, groundH(mx, mz) + ry, mz); rail.rotation.y = rot; scene.add(rail);
  }
}

function cropRow(x, z, rot, len) {
  const g = new THREE.Group();
  const mound = new THREE.Mesh(new THREE.BoxGeometry(.7, .18, len), M.soil);
  mound.position.y = .09; g.add(mound);
  const tufts = Math.max(2, Math.round(len / 1.1));
  for (let i = 0; i < tufts; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 5), M.crop);
    t.position.set(rand(-.15, .15), .38, -len / 2 + (i + .5) * (len / tufts)); g.add(t);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  // Low crops — walkable, no collider (same as flat clutter elsewhere).
}

function scarecrow(x, z, rot) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 2.4, 5), M.wood);
  post.position.y = 1.2; post.castShadow = true; g.add(post);
  const arms = new THREE.Mesh(new THREE.BoxGeometry(1.8, .12, .12), M.wood);
  arms.position.y = 1.7; g.add(arms);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.34, .38, .34), M.burlap);
  head.position.y = 2.15; head.castShadow = true; g.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(.34, .4, 6), M.hay);
  hat.position.y = 2.45; g.add(hat);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(.5, .7, .3), M.crop);
  shirt.position.y = 1.35; g.add(shirt);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addCircle(x, z, .3);
}

barn(-58, -31, .35);
// paddock: three fenced edges around the crop field, west side left open
fenceRun(-50, -35, -39, -35);
fenceRun(-39, -35, -39, -22);
fenceRun(-39, -22, -50, -22);
cropRow(-47, -28.5, 0, 9); cropRow(-44, -28.5, 0, 9); cropRow(-41.5, -28.5, 0, 9);
scarecrow(-44, -25, .3);
hayBale(-55, -25); hayBale(-52.5, -24);
crate(-60, -27, .2); barrel(-61, -30);

export const harrow = spawnNPC('Farmer Harrow', -59, -27, { shirt: 0x6a7a4a, hat: 0xcf9a3a });
harrow.flavor = [
  "Careful of the rows, would you? Those greens feed half of Meadowbrook come harvest.",
  "Boars get into the field some nights. I'd duel one if they knew how to hold cards.",
  "Marla buys my surplus for the tavern. Everyone eats, even card-players.",
  "Scarecrow's more for my nerves than the crows, truth be told. Quiet company, though.",
  "You want a quiet life? Grow turnips. You want a story? Well — that's what the roads are for.",
  "Frost in the planting rows this morning. In midsummer. My grandfather would've thrown salt over both shoulders and blamed the hearth.",
];

// Cobb the Farmhand (DESIGN.md) — a new duelist, minimal footprint: no new
// structure, no CAMPS entry, just a reason for the existing farmstead to
// hold one more person. Stands east of the paddock's fenced field, clear of
// the barn/hayBale/crate/barrel cluster around Harrow and of the fence/crop
// colliders, still visibly "at the farm" without crowding it.
export const cobb = spawnDuelist('cobb', -35, -28, { shirt: 0x6a7a4a, hat: 0x8a6a3a });
