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
import { rand, smoothstep } from '../utils.js';
import { addCircle } from '../colliders.js';
import { M, tree, tent, crate, signpost, deadTree, spawnCritter, spawnNPC, spawnDuelist } from './lib.js';

const DW = { x: 118, z: -115 };   // zone heart (constants.js CAMPS r=45)

// Local materials — a pale sickly glow for the mushrooms, cold mossy stone
// for the ring. Kept module-local (single-region) per the lib.js rule.
const M_GLOW = new THREE.MeshLambertMaterial({ color: 0xb8e6c0, emissive: 0x3a7a50 });
const M_MOSSTONE = new THREE.MeshLambertMaterial({ color: 0x5a6656 });
const M_MOSS = new THREE.MeshLambertMaterial({ color: 0x2f4630 });                       // hanging moss
const M_SHADE = new THREE.MeshLambertMaterial({ color: 0x0c100c });                       // shade bodies
const M_EYE_PALE = new THREE.MeshLambertMaterial({ color: 0xbfe8c8, emissive: 0x7ab890 }); // shade/wisp glow
const M_EYE_AMBER = new THREE.MeshLambertMaterial({ color: 0xd89a30, emissive: 0xb86a10 });// wolf eyeshine

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
  // hanging moss — drooping strands under the canopy, the "something brushes
  // your shoulder" layer that makes the wood read overgrown, not planted
  for (let i = 0; i < 3; i++) {
    const strand = new THREE.Mesh(new THREE.ConeGeometry(.13 * scale, rand(.9, 1.7) * scale, 4), M_MOSS);
    strand.rotation.x = Math.PI;   // tip down
    strand.position.set(rand(-1.4, 1.4) * scale, rand(2.9, 3.8) * scale, rand(-1.2, 1.2) * scale);
    g.add(strand);
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
// scatter at d 80-120 from origin, darker-coated, and with amber eyeshine
// that reads through the gloom before the wolf itself does.
function darkwolf() {
  const m = wolfMesh();
  m.traverse(o => { if (o.isMesh) o.material.color.multiplyScalar(.6); });   // wolfMesh mints fresh materials per call — safe to darken in place
  for (const dx of [-.1, .1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.045, 5, 4), M_EYE_AMBER);
    eye.position.set(dx, .92, 1.06); m.add(eye);
  }
  return m;
}
for (let i = 0; i < 6; i++) {
  const a = rand(0, Math.PI * 2), d = rand(12, 38);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z, 4)) continue;
  spawnCritter(darkwolf, x, z);
}

// Shades — hooded silhouettes that drift between the trees, pale eyes and
// no face. Pure ambience via the critter wander system (interact.js never
// looks at critters, so they can't be spoken to — deliberately: whatever
// they are is a Phase-3 question). The zone's "did that just move?" layer.
function shadeMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.7, 7), M_SHADE);
  body.position.y = .95; body.castShadow = true; g.add(body);
  for (const dx of [-.12, .12]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 5, 4), M_EYE_PALE);
    eye.position.set(dx, 1.3, .38); g.add(eye);
  }
  return g;
}
for (let i = 0; i < 4; i++) {
  const a = rand(0, Math.PI * 2), d = rand(16, 40);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z, 5)) continue;
  spawnCritter(shadeMesh, x, z);
}

// Bare snags among the living trees (deadTree, promoted to lib from
// Hollowmere) — a wood where some of the trees have died reads older and
// wronger than uniform green.
for (let i = 0; i < 8; i++) {
  const a = rand(0, Math.PI * 2), d = rand(12, 42);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  if (nearRoad(x, z)) continue;
  deadTree(x, z, rand(0, Math.PI * 2), rand(.9, 1.3));
}

// ---- The living gloom (immersion pass, 2026-07-13) ----
// Michael's playtest note: "nothing that makes me feel like I'm entering a
// scary dark wood." The zone's atmosphere is driven from main.js's update():
// updateDarkwood() returns a 0..1 gloom factor from the player's distance
// to the heart, and main.js uses it to close the fog in, kill the sun/sky,
// and hide the sun/moon discs (you can't see the sky through this canopy).
// Zone-scoped application of DESIGN.md's Stage-0 atmosphere idea — the
// GLOBAL Stage 0 (bloom/post/per-zone grading everywhere) stays deferred.
// Also animates the circle wisps: pale lights over the Circle of Sighs,
// night hours only (20:00-6:00, the Sentinel's window) — the stone circle
// is lit by something, and it isn't fire. Phase-3 night-duelist bait.
const WISPS = [];
for (let i = 0; i < 3; i++) {
  const a = i / 3 * Math.PI * 2 + .5, d = rand(3, 5.5);
  const x = DW.x + Math.cos(a) * d, z = DW.z + Math.sin(a) * d;
  const w = new THREE.Mesh(new THREE.SphereGeometry(.2, 7, 6), M_EYE_PALE);
  const baseY = groundH(x, z) + rand(1.8, 2.6);
  w.position.set(x, baseY, z); w.visible = false; scene.add(w);
  WISPS.push({ mesh: w, baseY, phase: rand(0, Math.PI * 2) });
}

// ---- Phase 3: the zone's duelists (DESIGN.md "Deep Darkwood Phase 3") ----
// Tamsin works the Highgate-side road ~30% out from the heart — ON the
// kept-clear corridor (nearRoad w=7), day-reachable, the zone's gate duelist.
export const tamsin = spawnDuelist('tamsin', 95, -110, { shirt: 0x3a332c, hat: 0x1f1b16 });

// Weir the Forgotten — the Circle of Sighs' night walker (main quest Act II,
// LORE.md). Stands inside the stone ring among the wisps; only manifests
// 20:00–6:00 via the Sentinel's visibility-gate pattern (main.js), which
// also means his nocturnal-heavy deck always fights on its home condition.
// interact.js skips invisible NPCs generically, so no other wiring needed.
export const weir = spawnDuelist('weir', DW.x - 3, DW.z + 3, { shirt: 0x26302a, hat: 0x182018 });
weir.mesh.visible = false;   // corrected within the first frame by main.js's gameHour check
const weirGlow = new THREE.PointLight(0xbfe8c8, 1.1, 10);
weirGlow.position.y = 2.4; weir.mesh.add(weirGlow);

// ---- Phase 3b: the zone vendor (DESIGN.md "Deep Darkwood Phase 3b") ----
// Pedlar Rusk sells the Night-Gather pack just inside the zone edge on the
// Gruk-side road — you meet him walking in, not deep among the stones (the
// Sutler Varn placement rule). Off the walkline (~3u west) so patrol paths
// and players don't clip him; his crate of wares beside him. Coords must
// match shared/sets/darkwood/packs.js (test-packs guards the invariant).
// LORE.md knowledge tier: small omens — he sells by daylight, gone by dusk.
export const rusk = spawnNPC('Pedlar Rusk', 106, -72, { shirt: 0x8a7a4a, hat: 0x5a4a33 });
rusk.vendorPack = 'darkwood';   // interact.js: E on a .vendorPack NPC opens their pack shop
crate(104.5, -71, .7);

export function updateDarkwood(hour, px, pz) {
  const night = hour >= 20 || hour < 6;
  const t = performance.now() * .001;
  for (const w of WISPS) {
    w.mesh.visible = night;
    if (night) w.mesh.position.y = w.baseY + Math.sin(t * .8 + w.phase) * .5;
  }
  return smoothstep(56, 24, Math.hypot(px - DW.x, pz - DW.z));
}
