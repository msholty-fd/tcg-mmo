import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle } from '../colliders.js';
import { M, campfire, fires, deadTree, spawnDuelist } from './lib.js';

// ---------- Hollowmere: sunken swamp (x=-100 z=-90) ----------
// A sparse, wild place in the unclaimed southwest — deliberately no
// buildings (see DESIGN.md), just dead trees, bog pools, and reeds around
// Old Hessa's fire. First use of a genuinely new visual family (everything
// so far reused the green pine tree() or hand-built structures); the
// desaturated M.deadwood/bogWater/reed palette is what makes this camp read
// as a swamp rather than "more forest."

function bogPool(x, z, r) {
  const p = new THREE.Mesh(new THREE.CircleGeometry(r, 10), M.bogWater);
  p.rotation.x = -Math.PI / 2; p.position.set(x, groundH(x, z) + .03, z); scene.add(p);
  // Shallow and walkable, like the village well's surrounding puddle would
  // be — no collider, purely a visual read.
}

function reedCluster(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const h = rand(.9, 1.6);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .05, h, 4), M.reed);
    r.position.set(rand(-.5, .5), h / 2, rand(-.5, .5)); r.rotation.z = rand(-.15, .15); g.add(r);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
  // Thin stalks, like torches/banners — no collider.
}

for (const [dx, dz, rot, s] of [
  [-8, 6, .3, 1.1], [6, -10, 1.4, .9], [-14, -12, 2.1, 1.2], [10, 8, -.7, 1],
  [-4, -18, .5, .8], [15, -4, -1.8, 1.1],
]) deadTree(-100 + dx, -90 + dz, rot, s);

for (const [dx, dz, r] of [[-3, 3, 2.4], [8, -6, 1.8], [-10, -8, 2.1], [3, -14, 1.6]])
  bogPool(-100 + dx, -90 + dz, r);

for (const [dx, dz] of [[-1, 4, ], [9, -4], [-9, -7]]) reedCluster(-100 + dx, -90 + dz);

fires.push(campfire(-100, -90));

export const hessa = spawnDuelist('hessa', -100, -87, { shirt: 0x3a4a3e, hat: 0x2a2a24 });
