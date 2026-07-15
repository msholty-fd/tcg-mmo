import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle } from '../colliders.js';
import { M, campfire, fires, deadTree, spawnDuelist, spawnCritter } from './lib.js';

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

// ---- The mire breathes (2026-07-14): life + night pass ----
// Hollowmere had bones (pools, reeds, snags) and no movement. Everything
// below is ambience only — no colliders, no interactions, and nothing that
// touches Hessa's reserved thread (LORE.md: her mystery is Act II/III's).

const HM = { x: -100, z: -90 };
const M_CATTAIL = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
const M_HERON = new THREE.MeshLambertMaterial({ color: 0x8a9298 });
const M_FROG = new THREE.MeshLambertMaterial({ color: 0x4a6a3a });
const M_SPARK = new THREE.MeshLambertMaterial({ color: 0xbfd8e8, emissive: 0x6a90a8 });

// Cattails — reeds that have gone to seed, ringing the pools. Same
// no-collider stance as reedCluster.
function cattails(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < rand(2, 4); i++) {
    const h = rand(1.1, 1.7), px = rand(-.6, .6), pz = rand(-.6, .6);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, h, 4), M.reed);
    stalk.position.set(px, h / 2, pz);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .32, 5), M_CATTAIL);
    head.position.set(px, h + .12, pz);
    g.add(stalk, head);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
}
for (const [dx, dz] of [[-5, 5], [10, -7], [-11, -10], [5, -15], [1, 2], [-8, -5]])
  cattails(HM.x + dx, HM.z + dz);

// Herons — tall waders that stalk the pool edges via the critter wander
// system (slow by nature of the small wander radius). Module-local mesh,
// single-region rule.
function heronMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.28, 7, 6), M_HERON);
  body.position.y = .85; body.scale.set(1, .8, 1.3); body.castShadow = true; g.add(body);
  for (const dx of [-.09, .09]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .8, 4), M.deadwood);
    leg.position.set(dx, .4, 0); g.add(leg);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .55, 5), M_HERON);
  neck.position.set(0, 1.25, .22); neck.rotation.x = -.35; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.11, 6, 5), M_HERON);
  head.position.set(0, 1.5, .34); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.035, .3, 4), M_CATTAIL);
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.48, .55); g.add(beak);
  return g;
}
for (const [dx, dz] of [[-3, 1], [9, -5], [-9, -9]]) spawnCritter(heronMesh, HM.x + dx, HM.z + dz);

// Frogs — small green hoppers around the pool rims.
function frogMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.13, 6, 5), M_FROG);
  body.position.y = .1; body.scale.set(1, .7, 1.15); g.add(body);
  for (const dx of [-.07, .07]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 5, 4), M_HERON);
    eye.position.set(dx, .2, .08); g.add(eye);
  }
  return g;
}
for (const [dx, dz] of [[-2, 4], [7, -7], [-10, -6], [4, -13], [2, 1]])
  spawnCritter(frogMesh, HM.x + dx, HM.z + dz);

// Mire-sparks — the night layer. Tiny cold lights that drift low over the
// bog pools, 20:00–6:00 (the realm's night window). LORE fact 7 made
// visible without a word of text: the mire remembers WITHOUT burning, so
// its lights are cold, low, and many — nothing like a fire, and nothing
// like the Darkwood's three tall wisps (those mark a place; these are
// ambient). No PointLights — emissive dots, same budget trick as glowcaps.
const MIRE_SPARKS = [];
const POOLS = [[-3, 3, 2.4], [8, -6, 1.8], [-10, -8, 2.1], [3, -14, 1.6]];
for (const [px, pz, pr] of POOLS) {
  for (let i = 0; i < 2; i++) {
    const a = rand(0, Math.PI * 2), d = rand(0, pr * .8);
    const x = HM.x + px + Math.cos(a) * d, z = HM.z + pz + Math.sin(a) * d;
    const s = new THREE.Mesh(new THREE.SphereGeometry(.06, 5, 4), M_SPARK);
    const baseY = groundH(x, z) + rand(.3, .8);
    s.position.set(x, baseY, z); s.visible = false; scene.add(s);
    MIRE_SPARKS.push({ mesh: s, baseY, phase: rand(0, Math.PI * 2), drift: rand(.5, 1.1) });
  }
}

// Same shape as updateDarkwood's wisp block — called from main.js update().
export function updateHollowmere(hour) {
  const night = hour >= 20 || hour < 6;
  const t = performance.now() * .001;
  for (const s of MIRE_SPARKS) {
    s.mesh.visible = night;
    if (night) {
      s.mesh.position.y = s.baseY + Math.sin(t * s.drift + s.phase) * .25;
      s.mesh.position.x += Math.sin(t * .3 + s.phase) * .002;
    }
  }
}
