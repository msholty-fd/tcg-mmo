// Meadowbrook Village: the starting settlement at the origin — houses (one
// with a walk-in interior), the well, torches, the town-expansion structures,
// flavor villagers, quest-givers Marla/Aldric, and duelists Rowan/Maren.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { humanoid } from '../entities.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, torch, torches, tavern, marketStall, hayBale, shrine, signpost,
         spawnCritter, spawnNPC, spawnDuelist, VILLAGER_SHIRTS } from './lib.js';

function house(x, z, rot, scale = 1) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(6 * scale, 3.6 * scale, 5 * scale), M.wall);
  b.position.y = 1.8 * scale; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(4.6 * scale, 2.6 * scale, 4), M.roof);
  r.position.y = 4.9 * scale; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 6 * scale, 5 * scale, rot);
  camCollidables.push(g);
}

// ---------- inline interior pilot (house 1 only) ----------
// Same footprint/position/rotation/roof as a plain house() shell (still
// reads as "the same house" from outside), but built from a floor + 4 wall
// faces + flat ceiling instead of one solid box, with a real gap in the
// wall facing local z=+2.5 (the old door decal's direction) — walking
// through the gap IS entering, no teleport/instance involved. Occupies the
// exact same coordinate space as the exterior (unlike the earlier
// pocket-dimension pilot, which built this room far away at world (3000,3000)
// and teleported the player there — rejected for feeling like a loading
// screen, not a continuous world).
const H1_WALL_H = 3.6, H1_WALL_T = .3, H1_DOOR_W = 2, H1_HW = 3, H1_HD = 2.5;

function house1Interior(x, z, rot) {
  const g = new THREE.Group();
  const c = Math.cos(rot), s = Math.sin(rot);
  // local (lx,lz) -> world offset, matching THREE's rotation.y convention
  // (same forward transform the old door-decal math used, and the inverse
  // of colliders.js addRect's local-space projection).
  const toWorld = (lx, lz) => ({ x: x + c * lx + s * lz, z: z - s * lx + c * lz });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(H1_HW * 2, .2, H1_HD * 2), M.wood);
  floor.position.y = -.1; floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(H1_HW * 2, .2, H1_HD * 2), M.wall);
  ceil.position.y = H1_WALL_H + .1; g.add(ceil);   // flat interior ceiling, sitting at the roof cone's base height

  function wall(w, d, lx, lz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, H1_WALL_H, d), M.wall);
    m.position.set(lx, H1_WALL_H / 2, lz); m.castShadow = true; m.receiveShadow = true; g.add(m);
    const wp = toWorld(lx, lz);
    addRect(wp.x, wp.z, w, d, rot);
  }
  wall(H1_HW * 2, H1_WALL_T, 0, -H1_HD);                          // back wall
  wall(H1_WALL_T, H1_HD * 2, -H1_HW, 0);                          // left wall
  wall(H1_WALL_T, H1_HD * 2, H1_HW, 0);                           // right wall
  const segW = (H1_HW * 2 - H1_DOOR_W) / 2;                       // front wall, split for the doorway gap
  wall(segW, H1_WALL_T, -(H1_DOOR_W / 2 + segW / 2), H1_HD);
  wall(segW, H1_WALL_T, (H1_DOOR_W / 2 + segW / 2), H1_HD);
  // No collider spans local z=+2.5, x=[-1,1] — that's the doorway gap.

  // warm interior light (was explicit playtest feedback: "house is very
  // dark") — small room, so a much tighter range than campfire()'s 16 to
  // avoid washing out the exterior through the doorway gap.
  const light = new THREE.PointLight(0xff8830, 1.1, 7);
  light.position.set(0, 2.3, -.3); g.add(light);

  // light interior dressing — a rug only; the footprint is tight enough that
  // a table risked a pinch point against the walls, so it's left out.
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), M.redSash);
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, .01, .6); g.add(rug);

  const r = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 4), M.roof);
  r.position.y = 4.9; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);

  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  camCollidables.push(g);
}

// Village
house1Interior(-13, 8, Math.PI * .9); house(14, 10, -Math.PI * .7);
house(12, -11, -Math.PI * .2); house(-8, -15, Math.PI * .15, 1.3);

// Well
{
  const w = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 1.1, 10), M.rock);
  base.position.y = .55; base.castShadow = true; w.add(base);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.7, .9, 6), M.roof);
  top.position.y = 2.6; w.add(top);
  for (const dx of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 2, 5), M.wood);
    p.position.set(dx, 1.5, 0); w.add(p);
  }
  w.position.set(0, groundH(0, 0), 0); scene.add(w);
  addCircle(0, 0, 1.6);
}

// Village torches — ambiance for the night hours; lights ramp up after dusk
torches.push(torch(-8, 2), torch(9, 7), torch(4, -9), torch(-11, -8), torch(13, 3), torch(-2, 12));

// ---------- Meadowbrook Village expansion ----------
// The original 4 houses + well cluster at radius ~15-17 from origin. These
// add a tavern, smithy, market stall, stable, and shrine at radius ~24-32 so
// the village reads as a small town rather than a handful of houses, without
// crowding Marla (3.5,4), Aldric (-4,-6), or Rowan (8,-3). Same
// primitive-geometry/groundH/addRect-addCircle conventions as house() and
// the camp props above. ZONES[0].r was bumped to 38 (constants.js) so these
// still read as "Meadowbrook Village" on the HUD/map.

function smithy(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4.5), M.wall);
  b.position.y = 1.5; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2, 4), M.roof);
  r.position.y = 4; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(.3, .35, 2, 6), M.rock);
  chim.position.set(1.6, 4.2, -1); g.add(chim);
  // anvil out front
  const anvilBase = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, .5, 6), M.wood);
  anvilBase.position.set(0, .25, 3); g.add(anvilBase);
  const anvilBody = new THREE.Mesh(new THREE.BoxGeometry(.9, .35, .35), M.metal);
  anvilBody.position.set(0, .68, 3); g.add(anvilBody);
  const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(.15, .6, 6), M.metal);
  anvilHorn.rotation.z = Math.PI / 2; anvilHorn.position.set(.6, .68, 3); g.add(anvilHorn);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 5, 4.5, rot);
  camCollidables.push(g);
}

function stable(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 4), M.wood);
  b.position.y = 1.5; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(4.5, 1.8, 4), M.roof);
  r.position.y = 3.9; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 7, 4, rot);
  camCollidables.push(g);
}

tavern(28, 2, -.3);
smithy(-26, -7, .5);
marketStall(0, 24, 0);
stable(4, -25, .2); hayBale(10, -23); hayBale(11, -28);
shrine(-30, 5, -.4);
signpost(-6, 3, .2); // town-square marker near the original well

// Ambient flavor villagers — purely cosmetic wandering townsfolk, distinct
// from the two quest-givers and the duelist roster. There's no existing
// "flavor NPC" concept in the codebase (only npcs[] for interactable
// quest-givers/duelists, checked by interact.js, and critters[] for
// wandering wildlife). Rather than invent a third system, these reuse
// spawnCritter + the existing humanoid() builder (same one Marla/Aldric/
// duelists use, just no hat): they land in critters[], get the same
// wander-and-collide behavior as boars/wolves in main.js, and — because
// interact.js only ever looks at npcs[] — are guaranteed to never produce
// an "E to speak" prompt, no dialogue/quest code needed.

const VILLAGER_SPOTS = [[6, -8], [-9, -2], [18, 20], [-20, -16], [10, -18], [-24, 10]];
VILLAGER_SPOTS.forEach(([x, z], i) =>
  spawnCritter(() => humanoid({ shirt: VILLAGER_SHIRTS[i % VILLAGER_SHIRTS.length] }), x, z));

export const marla = spawnNPC('Quartermaster Marla', 3.5, 4, { shirt: 0x7a5aa8 });
marla.vendorPack = 'boarlands';   // interact.js: E on a .vendorPack NPC opens their pack shop
export const aldric = spawnNPC('Warden Aldric', -4, -6, { shirt: 0x55636e, hat: 0x3a444c });

export const rowan = spawnDuelist('rowan', 8, -3, { shirt: 0x3a6b8a, hat: 0x2a3a4a });

// Maren the Shrinekeeper (DESIGN.md) — stands watch at the village shrine
// (shrine(-30, 5, -.4) above, built during the town-expansion pass and
// purely decorative until now). Deliberately minimal footprint: no new
// structure, no CAMPS entry — she's a reason for a building that already
// exists to matter, not a new destination.
export const maren = spawnDuelist('maren', -33, 8, { shirt: 0xd8d0c0, hat: 0x9a8a6a });
