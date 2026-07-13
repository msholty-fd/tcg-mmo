import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { emberElementalMesh } from '../entities.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, campfire, fires, signpost, spawnCritter, spawnNPC, spawnDuelist } from './lib.js';

// ==================================================================
// THE EMBERPEAKS — the first zone beyond the grassland (DESIGN.md)
// ------------------------------------------------------------------
// A volcanic biome walled off to the far north. The terrain ridge + basin +
// volcanic recolor live in terrain.js; the world boundary was grown to 300
// (main.js) to make the basin reachable. This section builds the *physical
// barrier* (a boulder wall along the ridge crest with a single pass gap —
// the raised terrain alone wouldn't stop anyone, since movement has no slope
// limit) and the basin's props + ambient ember elementals. Phase 1 of the
// full-zone build: duelists, the emberpeaks card set, a quest chain, and a
// zone pack come in later branches.
// ==================================================================

function obsidianRock(x, z, s, emissive) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s), emissive ? M.emberRock : M.obsidian);
  r.position.set(x, groundH(x, z) + s * .35, z);
  r.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6)); r.castShadow = true; r.receiveShadow = true;
  scene.add(r);
  addCircle(x, z, s * .8);
  return r;
}

// The ridge wall. TWO things make it a real barrier with one gap:
//  1) a SOLID collider — two long rects flanking the pass (originally this
//     was only per-boulder circles spaced 15 apart, which left ~6-unit
//     walk-through gaps all along the "wall", so the ridge was climbable
//     almost anywhere — the playtest miss this fix addresses).
//  2) dense visual boulders on top so it reads as an impassable mountain
//     spine. The pass gap is x∈[-14,14] (Cinderpass), matching the terrain
//     notch in terrain.js (groundH) that lowers the crest there.
const PASS_HALF = 14;   // half-width of the Cinderpass gap
// solid collision wall: left segment (x −300..−PASS_HALF) and right segment.
for (const seg of [[-300, -PASS_HALF], [PASS_HALF, 300]]) {
  const cx = (seg[0] + seg[1]) / 2, w = seg[1] - seg[0];
  addRect(cx, 158, w, 5, 0);            // one wide, thin, unbroken collider — no gaps to slip through
}
// dense visual boulders (every ~7 units, two staggered ranks) — purely
// cosmetic now that the rects do the blocking, so overlap/spacing is free.
for (let x = -300; x <= 300; x += 7) {
  if (Math.abs(x) < PASS_HALF) continue;          // leave the pass mouth clear
  obsidianRock(x, 158 + rand(-3, 3), rand(5, 7.5));
  obsidianRock(x + rand(-3, 3), 152 + rand(-3, 3), rand(3.5, 5.5));   // back rank, staggered
}
// gate pillars framing Cinderpass, so the opening reads as a deliberate gateway
obsidianRock(-PASS_HALF - 1, 158, 6.5); obsidianRock(PASS_HALF + 1, 158, 6.5);
// braziers flanking the pass mouth (light + a clear "this is the way through")
fires.push(campfire(-PASS_HALF + 2, 150), campfire(PASS_HALF - 2, 150));
signpost(-3, 146, 0);       // marker on the south (approach) side of the pass

// Halvard Stillwatch (DESIGN.md) — stationed on the grassland side of the
// pass gap itself (x=8, z=148, inside the x∈[-13,13] gap column, ~10 south
// of the boulder line), clear of the gate-pillar colliders (±15,158) and the
// signpost (-3,150). Deliberately the near/south approach, not the basin —
// the Emberpeaks basin is reserved for Phase 3's planned fire-elemental
// duelists (DESIGN.md "Emberpeaks" phase plan); a control-deck warden
// watching who tries to cross is a minimal-footprint fit for the edge of a
// landmark someone else just built, with zero overlap with that future work.
export const halvard = spawnDuelist('halvard', 8, 148, { shirt: 0x565f6a, hat: 0x333a42 });

// ---- The basin: lava pools, obsidian spires, smoking vents ----
const EP = { x: 0, z: 235 };   // basin centre

function lavaPool(x, z, r) {
  const p = new THREE.Mesh(new THREE.CircleGeometry(r, 14), M.lava);
  p.rotation.x = -Math.PI / 2; p.position.set(x, groundH(x, z) + .12, z); scene.add(p);
  const light = new THREE.PointLight(0xff5a1e, 1.1, r * 4); light.position.set(x, groundH(x, z) + 1.5, z); scene.add(light);
  // molten — no collider; stepping into lava is a cosmetic risk we accept
  // (no damage system exists), same walkable-decal call as the bog pools.
}

function obsidianSpire(x, z, h) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.ConeGeometry(h * .22, h, 5), M.obsidian);
  s.position.y = h / 2; s.castShadow = true; g.add(s);
  // ember veins glowing up the spire
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(.14, h * .4, .14), M.emberRock);
    v.position.set(Math.cos(i * 2) * h * .1, h * (.25 + i * .2), Math.sin(i * 2) * h * .1); g.add(v);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rand(0, 6); scene.add(g);
  addCircle(x, z, h * .2);
}

function fumarole(x, z) {   // a smoking vent — a low ashen cone with an ember glow
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.3, 7), M.ash);
  cone.position.y = .65; cone.castShadow = true; g.add(cone);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, .3, 7), M.lava);
  glow.position.y = 1.25; g.add(glow);
  const light = new THREE.PointLight(0xff7a20, .6, 8); light.position.y = 1.6; g.add(light);
  g.position.set(x, groundH(x, z), z); scene.add(g);
  addCircle(x, z, 1);
}

lavaPool(EP.x - 20, EP.z - 15, 7); lavaPool(EP.x + 24, EP.z + 6, 9);
lavaPool(EP.x - 6, EP.z + 30, 6); lavaPool(EP.x + 40, EP.z - 20, 5);
lavaPool(EP.x - 44, EP.z + 18, 6);
obsidianSpire(EP.x + 12, EP.z - 4, 11); obsidianSpire(EP.x - 30, EP.z + 2, 14);
obsidianSpire(EP.x + 34, EP.z + 24, 9); obsidianSpire(EP.x - 14, EP.z + 40, 12);
obsidianSpire(EP.x + 55, EP.z + 4, 10);
fumarole(EP.x - 12, EP.z + 12); fumarole(EP.x + 18, EP.z - 26); fumarole(EP.x + 6, EP.z + 46);
// scattered obsidian scree + a few ember-glowing rocks
for (let i = 0; i < 14; i++) {
  const a = rand(0, Math.PI * 2), d = rand(10, 70);
  const rx = EP.x + Math.cos(a) * d, rz = EP.z + Math.sin(a) * d;
  if (rz < 180) continue;   // keep scree inside the basin, north of the ridge
  obsidianRock(rx, rz, rand(1.2, 3), rand(0, 1) > .7);
}
signpost(EP.x + 2, 180, Math.PI);   // "The Emberpeaks" marker just inside the basin

// Ambient ember elementals drifting the basin (reuse the critter system)
for (let i = 0; i < 6; i++) {
  const a = rand(0, Math.PI * 2), d = rand(12, 62);
  const ex = EP.x + Math.cos(a) * d, ez = EP.z + Math.sin(a) * d;
  if (ez < 182) continue;
  spawnCritter(() => emberElementalMesh(1), ex, ez);
}

// ---- Emberpeaks duelists (Phase 3) — the fire roster (shared/sets/
// emberpeaks/duelists.js), merged into DUELISTS above. Ashmonger guards the
// near basin; Ignarok the Pyrelord holds the deep end, ringed by lava and
// marked with an ember glow so the boss reads at a distance. Beating them is
// how the emberpeaks card set enters circulation (reward pools).
export const ashmonger = spawnDuelist('ashmonger', EP.x - 22, EP.z - 24, { shirt: 0x8a3320, hat: 0x3a1810 });
export const pyrelord = spawnDuelist('pyrelord', EP.x, EP.z + 14, { shirt: 0x5a1a10, hat: 0xdd4400 });
const pyreGlow = new THREE.PointLight(0xff5a1e, 1.6, 14); pyreGlow.position.y = 2.6; pyrelord.mesh.add(pyreGlow);
lavaPool(EP.x, EP.z + 20, 5);   // a lava basin at the boss's back

// ---- Emberpeaks vendor (Phase 3b) — Sutler Varn sells the zone pack just
// inside the pass, by the entrance signpost, so you meet him on the way in
// (not deep in boss territory). Coords must match shared/sets/emberpeaks/
// packs.js vendor (the server validates purchase proximity against those).
export const varn = spawnNPC('Sutler Varn', EP.x + 14, EP.z - 39, { shirt: 0xa85a2a, hat: 0x4a2a1a });
varn.vendorPack = 'emberpeaks';

