// The Deep Darkwood (DESIGN.md, 2026-07-13): the heart of the forest that
// "Darkwood" has only ever labeled — a real destination in the southeast
// quadrant (heart 118,-115), the biggest empty stretch of map, between
// Gruk's Hollow and Highgate. Phase 1 of the zone playbook (Emberpeaks
// precedent: terrain → card set → duelists/quests → pack/vendor): ground
// tint (terrain.js), signature flora, landmarks, ambient wolves, and the
// Gruk↔Highgate road that threads through it (roads.js waystones). No
// cards, no NPCs yet — Phases 2/3 hooks are seeded below on purpose.
//
// First region authored as a world/ module rather than into the old
// monolith — build on lib.js, keep zone-specific builders local.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { wolfMesh } from '../entities.js';
import { rand } from '../utils.js';
import { addCircle } from '../colliders.js';
import { M, tree, tent, crate, signpost, spawnCritter } from './lib.js';

const DW = { x: 118, z: -115 };   // zone heart (constants.js CAMPS r=45)

// Local materials — a pale sickly glow for the mushrooms, cold mossy stone
// for the ring. Kept module-local (single-region) per the lib.js rule.
const M_GLOW = new THREE.MeshLambertMaterial({ color: 0xb8e6c0, emissive: 0x3a7a50 });
const M_MOSSTONE = new THREE.MeshLambertMaterial({ color: 0x5a6656 });

// The road corridor must stay walkable: two segments, Gruk's Hollow → heart
// and heart → Highgate's gate. Flora scatter skips anything near them.
const ROAD = [
  [[107, -60], [DW.x, DW.z]],
  [[DW.x, DW.z], [40, -107]],
];
function nearRoad(x, z, w = 7) {
  for (const [[ax, az], [bx, bz]] of ROAD) {
    const dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
    if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < w) return true;
  }
  return false;
}

// Gnarltrees — the zone's signature silhouette: a crooked deadwood trunk
// with heavy, ball-shaped dark canopies (nothing like the tidy cones of the
// pine tree()). Tall enough to loom.
function gnarltree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.3 * scale, .55 * scale, 4.2 * scale, 6), M.deadwood);
  trunk.position.y = 2.1 * scale; trunk.rotation.z = rand(-.12, .12); trunk.castShadow = true; g.add(trunk);
  for (const [dx, dy, dz, s] of [[0, 4.6, 0, 2.1], [1.2, 3.8, .6, 1.4], [-1.1, 4.1, -.5, 1.5], [.3, 5.4, -.8, 1.2]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(s * scale, 7, 6), M.leafDark);
    c.position.set(dx * scale, dy * scale, dz * scale); c.castShadow = true; g.add(c);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rand(0, Math.PI * 2); scene.add(g);
  addCircle(x, z, .6 * scale);
}

// Glowcap clusters — pale mushrooms that read at dusk without costing a
// PointLight each (emissive only; the zone's night identity on the cheap).
function glowcaps(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < rand(3, 6); i++) {
    const s = rand(.12, .3);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(s * .3, s * .4, s * 1.6, 5), M.waystone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(s, s * .9, 6), M_GLOW);
    const px = rand(-.8, .8), pz = rand(-.8, .8);
    stem.position.set(px, s * .8, pz); cap.position.set(px, s * 1.8, pz);
    g.add(stem, cap);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
  // Low clutter — walkable, no collider (same call as bone piles / crops).
}

// The Circle of Sighs — a ring of mossy standing stones at the zone heart.
// Deliberately unexplained in Phase 1: this is the seeded hook for the
// zone's night content / duelist (Phase 3), the way the Cinderhollow Mine
// seeded Marrow and Emberwatch seeded the Sentinel.
(function circleOfSighs() {
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, d = 8;
    const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
    const s = rand(.9, 1.15);
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.1 * s, rand(2.6, 3.6) * s, .8 * s), M_MOSSTONE);
    stone.position.set(x, groundH(x, z) + 1.4 * s, z);
    stone.rotation.y = a + rand(-.3, .3); stone.rotation.z = rand(-.08, .08);
    stone.castShadow = true; stone.receiveShadow = true; scene.add(stone);
    addCircle(x, z, .8 * s);
  }
  // a fallen eighth stone, half-sunk — the ring is old and incomplete
  const fx = DW.x + 11, fz = DW.z + 3;
  const fallen = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.2, .8), M_MOSSTONE);
  fallen.position.set(fx, groundH(fx, fz) + .5, fz);
  fallen.rotation.z = Math.PI / 2.2; fallen.rotation.y = .7; fallen.castShadow = true; scene.add(fallen);
  addCircle(fx, fz, 1.2);
})();

// The Hunter's Rest — an abandoned camp on the road's north fork: a torn
// tent, a COLD firepit (charred logs, no flame, no light — every other camp
// in the realm burns; this one conspicuously doesn't), and a scattered
// cache. Seeded Phase-3 hook: whoever left it, left in a hurry.
(function huntersRest() {
  const hx = 112, hz = -88;   // just off the Gruk-side road segment
  tent(hx, hz, .9, .9);
  const pit = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 1.2, 5), M.charred);
    l.rotation.z = Math.PI / 2.4; l.rotation.y = i / 5 * Math.PI * 2; l.position.y = .22; pit.add(l);
  }
  pit.position.set(hx + 2.5, groundH(hx + 2.5, hz + 1), hz + 1); scene.add(pit);
  addCircle(hx + 2.5, hz + 1, .8);
  crate(hx - 2, hz + 2.5, .7);
  signpost(hx + 1, hz + 4, 2.6);
})();

// Signature flora: gnarltrees loom through the heart, dense dark pines fill
// the ground between them, glowcaps pool in the shade. Everything skips the
// road corridor and the stone circle's clearing (r 12 around the heart).
for (let i = 0; i < 14; i++) {
  const a = rand(0, Math.PI * 2), d = rand(14, 40);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z)) continue;
  gnarltree(x, z, rand(.9, 1.35));
}
for (let i = 0; i < 60; i++) {
  const a = rand(0, Math.PI * 2), d = rand(13, 44);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z)) continue;
  tree(x, z, true);
}
for (let i = 0; i < 9; i++) {
  const a = rand(0, Math.PI * 2), d = rand(10, 36);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z, 4)) continue;
  glowcaps(x, z);
}

// The wood has its own pack — denser than the thin wolf band the wilds
// scatter at d 80-120 from origin.
for (let i = 0; i < 6; i++) {
  const a = rand(0, Math.PI * 2), d = rand(12, 38);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z, 4)) continue;
  spawnCritter(wolfMesh, x, z);
}
