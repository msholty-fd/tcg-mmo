// The open wilds between landmarks: the global tree/rock flora rings and the
// ambient wildlife bands (boars, wolves, deer, rabbits).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { boarMesh, wolfMesh, deerMesh, rabbitMesh } from '../entities.js';
import { rand } from '../utils.js';
import { addCircle } from '../colliders.js';
import { M, tree, spawnCritter } from './lib.js';

// Small landmark clearings the random flora must not intrude on. Only for
// OPEN-GROUND landmarks whose read depends on clear sightlines (a tree
// through the sundial ring, a pine inside the sheepfold) — forested zones
// (Darkwood) and walled/large places handle their own ground. Radii cover
// the built footprint, not the whole CAMPS circle.
const CLEARINGS = [
  { x: 165, z: 25, r: 16 },    // The Dial Stone — the shadow needs open sky
  { x: -150, z: -10, r: 16 },  // The Wether Downs fold + hut
];
const inClearing = (x, z) => CLEARINGS.some(c => Math.hypot(x - c.x, z - c.z) < c.r);

// Flora
for (let i = 0; i < 150; i++) {
  const a = rand(0, Math.PI * 2), d = rand(30, 190);
  const x = Math.cos(a) * d, z = Math.sin(a) * d;
  if (inClearing(x, z)) continue;
  tree(x, z, d > 85);
}
for (let i = 0; i < 45; i++) {
  const x = rand(-190, 190), z = rand(-190, 190);
  if (Math.hypot(x, z) < 30 || inClearing(x, z)) continue;
  const size = rand(.5, 1.8);
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(size), M.rock);
  r.position.set(x, groundH(x, z) + .2, z); r.castShadow = true; scene.add(r);
  if (size > .9) addCircle(x, z, size * .8); // small rocks are step-over pebbles
}

// Ambient wildlife
for (let i = 0; i < 9; i++) { const a = rand(0, Math.PI * 2), d = rand(30, 55); spawnCritter(() => boarMesh(0x8a6242, .8), Math.cos(a) * d, Math.sin(a) * d); }
for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2), d = rand(48, 75); spawnCritter(() => boarMesh(0x6e4a30, 1), Math.cos(a) * d, Math.sin(a) * d); }
for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2), d = rand(80, 120); spawnCritter(wolfMesh, Math.cos(a) * d, Math.sin(a) * d); }
// Deer graze the open meadows (mid-ring, away from the boar/wolf bands so
// the herds read as distinct); rabbits hop around close to the village.
// Both reuse the spawnCritter wander/collide system — purely ambient life
// to make the realm between landmarks feel inhabited, no gameplay hook.
for (let i = 0; i < 6; i++) { const a = rand(0, Math.PI * 2), d = rand(40, 68); spawnCritter(() => deerMesh(1), Math.cos(a) * d, Math.sin(a) * d); }
for (let i = 0; i < 8; i++) { const a = rand(0, Math.PI * 2), d = rand(16, 34); spawnCritter(() => rabbitMesh(1), Math.cos(a) * d, Math.sin(a) * d); }
