import * as THREE from 'three';
import { scene } from './scene.js';
import { groundH } from './terrain.js';
import { humanoid, boarMesh, wolfMesh, makeLabel } from './entities.js';
import { critters, npcs } from './state.js';
import { rand } from './utils.js';
import { addCircle, addRect } from './colliders.js';

const M = {
  trunk:    new THREE.MeshLambertMaterial({ color: 0x6b4a2f }),
  leaf:     new THREE.MeshLambertMaterial({ color: 0x3a6132 }),
  leaf2:    new THREE.MeshLambertMaterial({ color: 0x4a7338 }),
  leafDark: new THREE.MeshLambertMaterial({ color: 0x2a4426 }),
  rock:     new THREE.MeshLambertMaterial({ color: 0x8a8f88 }),
  wall:     new THREE.MeshLambertMaterial({ color: 0xcbb598 }),
  wood:     new THREE.MeshLambertMaterial({ color: 0x7a5a38 }),
  roof:     new THREE.MeshLambertMaterial({ color: 0x9c4a3c }),
  // Camp dressing — deliberately grimier/darker than the village palette so
  // Vex's and Gruk's camps read as distinct places at a glance.
  hide:     new THREE.MeshLambertMaterial({ color: 0x5c4a38 }), // tent canvas/hide
  redSash:  new THREE.MeshLambertMaterial({ color: 0xa03030, side: THREE.DoubleSide }), // banner cloth
  ironBand: new THREE.MeshLambertMaterial({ color: 0x2e2a24 }),
  bone:     new THREE.MeshLambertMaterial({ color: 0xcfc2a0 }),
  charred:  new THREE.MeshLambertMaterial({ color: 0x2a241f }),
  // Village-expansion dressing — same clean palette family as houses, one
  // accent material per new structure type.
  awning:   new THREE.MeshLambertMaterial({ color: 0x3a7a6a, side: THREE.DoubleSide }), // market stall canvas
  metal:    new THREE.MeshLambertMaterial({ color: 0x585d64 }), // anvil / tools
  hay:      new THREE.MeshLambertMaterial({ color: 0xcf9a3a }), // straw bales
  gold:     new THREE.MeshLambertMaterial({ color: 0xd4af37 }), // shrine finial
  // Highgate dressing — a cool blue/gold "capital" banner, distinct from the
  // Red-Sash camp's red, on the same cloth-plane shape as banner().
  capitalBanner: new THREE.MeshLambertMaterial({ color: 0x2f4d8a, side: THREE.DoubleSide }),
  // Hollowmere dressing — desaturated/dark palette so the swamp reads as
  // visually distinct from every green-forest camp so far.
  deadwood: new THREE.MeshLambertMaterial({ color: 0x5a5248 }),
  bogWater: new THREE.MeshLambertMaterial({ color: 0x1a2e28 }),
  reed:     new THREE.MeshLambertMaterial({ color: 0x5a6e3a }),
};

function tree(x, z, dark) {
  const g = new THREE.Group(), h = groundH(x, z);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 2.6, 6), M.trunk);
  t.position.y = 1.3; t.castShadow = true; g.add(t);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(2.4 - i * .55, 2.6, 7), dark ? M.leafDark : (i % 2 ? M.leaf : M.leaf2));
    c.position.y = 2.6 + i * 1.5; c.castShadow = true; g.add(c);
  }
  g.position.set(x, h, z); scene.add(g);
  addCircle(x, z, .55); // trunk only — canopy overhang is walkable
}

// Camera collision registry: solid meshes the orbit camera should pull in
// front of rather than clip through (see main.js's camera raycast). Houses
// only, by design — 150 thin-trunked trees would be cheap to raycast but
// risk a twitchy camera darting in/out near every trunk; the priority is
// "never see inside a house" over "never clip a twig." Revisit if house
// collision alone doesn't feel like enough coverage once it's played live.
export const camCollidables = [];

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

function campfire(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1.4, 5), M.wood);
    l.rotation.z = Math.PI / 2.4; l.rotation.y = i / 5 * Math.PI * 2; l.position.y = .25; g.add(l);
  }
  const fire = new THREE.Mesh(new THREE.ConeGeometry(.45, 1, 6),
    new THREE.MeshLambertMaterial({ color: 0xff7a20, emissive: 0xdd4400 }));
  fire.position.y = .7; g.add(fire); g.userData.fire = fire;
  const light = new THREE.PointLight(0xff8830, 1, 16); light.position.y = 1.4; g.add(light);
  g.position.set(x, groundH(x, z), z); scene.add(g);
  addCircle(x, z, .9);
  return g;
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

// Flora
for (let i = 0; i < 150; i++) {
  const a = rand(0, Math.PI * 2), d = rand(30, 190);
  tree(Math.cos(a) * d, Math.sin(a) * d, d > 85);
}
for (let i = 0; i < 45; i++) {
  const x = rand(-190, 190), z = rand(-190, 190);
  if (Math.hypot(x, z) < 30) continue;
  const size = rand(.5, 1.8);
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(size), M.rock);
  r.position.set(x, groundH(x, z) + .2, z); r.castShadow = true; scene.add(r);
  if (size > .9) addCircle(x, z, size * .8); // small rocks are step-over pebbles
}

export const fires = [campfire(-92, 62), campfire(-86, 70), campfire(108, -62)];

// Village torches — ambiance for the night hours; lights ramp up after dusk
function torch(x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 2.4, 5), M.wood);
  pole.position.y = 1.2; pole.castShadow = true; g.add(pole);
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(.22, .16, .3, 5), M.rock);
  cage.position.y = 2.5; g.add(cage);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.18, .45, 5),
    new THREE.MeshLambertMaterial({ color: 0xff9a30, emissive: 0xdd5500 }));
  flame.position.y = 2.85; g.add(flame);
  const light = new THREE.PointLight(0xff8830, 0, 13);
  light.position.y = 2.9; g.add(light);
  g.position.set(x, groundH(x, z), z); scene.add(g);
  return { flame, light, phase: rand(0, Math.PI * 2) };
}
export const torches = [
  torch(-8, 2), torch(9, 7), torch(4, -9), torch(-11, -8), torch(13, 3), torch(-2, 12),
];

// Boss camp skull
{
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.9, 8, 7),
    new THREE.MeshLambertMaterial({ color: 0xe0d8c4 }));
  skull.position.set(104, groundH(104, -58) + .9, -58); skull.scale.z = 1.2; scene.add(skull);
}

// ---------- Vex's Red-Sash camp (western woods, x=-88 z=66) ----------
// A crude bandit camp: lean-to tents, a red-sash banner, scattered
// crates/barrels. Reuses the campfires already placed at (-92,62)/(-86,70).

function tent(x, z, rot, scale = 1) {
  const g = new THREE.Group();
  // A stretched 4-sided pyramid reads as a peaked ridge-tent silhouette.
  const body = new THREE.Mesh(new THREE.ConeGeometry(1.5 * scale, 2.1 * scale, 4), M.hide);
  body.scale.z = 1.6; body.position.y = 1.05 * scale; body.castShadow = true; g.add(body);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.3 * scale, 5), M.wood);
  pole.position.y = 1.1 * scale; g.add(pole);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 3 * scale, 3 * scale * 1.6, rot);
}

function banner(x, z, rot, mat = M.redSash) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 3.4, 5), M.wood);
  pole.position.y = 1.7; pole.castShadow = true; g.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), mat);
  cloth.position.set(.56, 2.25, 0); g.add(cloth);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  // Thin pole, like torches — no collider.
}

function crate(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .9), M.wood);
  b.position.y = .45; b.castShadow = true; g.add(b);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, .9, .9, rot);
}

function barrel(x, z) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, 1.1, 8), M.wood);
  b.position.y = .55; b.castShadow = true; g.add(b);
  for (const dy of [.25, .85]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(.52, .04, 5, 10), M.ironBand);
    band.rotation.x = Math.PI / 2; band.position.y = dy; g.add(band);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
  addCircle(x, z, .5);
}

tent(-97, 63, .6);
tent(-80, 72, -1.1, 1.15);
banner(-85, 61, .3);
crate(-90, 58, .4); crate(-83, 68, -.5); crate(-95, 70, .2);
barrel(-79, 62); barrel(-93, 75);

// ---------- Gruk's hollow of bones (east past the ridge, x=107 z=-60) ----------
// Grim and sparse: bone piles and rough stakes topped with skulls, built
// around the existing boss skull (104,-58) and campfire (108,-62) rather
// than duplicating them.

function bone(len) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, len, 5), M.bone);
  shaft.rotation.z = Math.PI / 2; shaft.castShadow = true; g.add(shaft);
  for (const s of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.13, 6, 5), M.bone);
    knob.position.x = s * len / 2; g.add(knob);
  }
  return g;
}

function bonePile(x, z, count = 5) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const b = bone(rand(.5, 1.1));
    b.position.set(rand(-.6, .6), rand(.06, .22), rand(-.6, .6));
    b.rotation.y = rand(0, Math.PI * 2); b.rotation.z = rand(-.3, .3);
    g.add(b);
  }
  g.position.set(x, groundH(x, z), z); scene.add(g);
  // Flat clutter, like small pebbles/canopy — no collider.
}

function totem(x, z, rot) {
  const g = new THREE.Group();
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 2.6, 5), M.charred);
  stake.position.y = 1.3; stake.castShadow = true; g.add(stake);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.32, 7, 6), M.bone);
  skull.position.y = 2.5; skull.scale.z = 1.15; g.add(skull);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  // Thin stake, like torches — no collider.
}

bonePile(110, -55, 6); bonePile(98, -63, 5); bonePile(104, -68, 4); bonePile(115, -66, 5);
totem(94, -57, .4); totem(119, -55, -.6); totem(108, -74, 1.2);

// ---------- Meadowbrook Village expansion ----------
// The original 4 houses + well cluster at radius ~15-17 from origin. These
// add a tavern, smithy, market stall, stable, and shrine at radius ~24-32 so
// the village reads as a small town rather than a handful of houses, without
// crowding Marla (3.5,4), Aldric (-4,-6), or Rowan (8,-3). Same
// primitive-geometry/groundH/addRect-addCircle conventions as house() and
// the camp props above. ZONES[0].r was bumped to 38 (constants.js) so these
// still read as "Meadowbrook Village" on the HUD/map.

function tavern(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(9, 4.4, 6.5), M.wall);
  b.position.y = 2.2; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3, 4), M.roof);
  r.position.y = 5.9; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2.6, 5), M.wood);
  post.position.set(0, 1.3, 4); g.add(post);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, .15), M.roof);
  sign.position.set(0, 2.5, 4); g.add(sign);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 9, 6.5, rot);
  camCollidables.push(g);
}

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

function marketStall(x, z, rot) {
  const g = new THREE.Group();
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, .9, 1), M.wood);
  counter.position.y = .45; counter.castShadow = true; g.add(counter);
  for (const [px, pz] of [[-1.2, -.4], [1.2, -.4], [-1.2, .4], [1.2, .4]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.2, 5), M.wood);
    p.position.set(px, 1.1, pz); g.add(p);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3, .15, 1.6), M.awning);
  canopy.position.y = 2.2; g.add(canopy);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 3, 1.6, rot);
  // Open-air stall, like tents — left off camCollidables (thin posts, no roofline to hide behind).
}

function hayBale(x, z) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1, 10), M.hay);
  b.rotation.z = Math.PI / 2; b.castShadow = true;
  b.position.set(x, groundH(x, z) + .6, z); scene.add(b);
  addCircle(x, z, .6);
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

function shrine(x, z, rot) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, .6, 8), M.rock);
  base.position.y = .3; base.castShadow = true; g.add(base);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 2.6, 6), M.wall);
    col.position.set(Math.cos(a) * 1.6, 1.9, Math.sin(a) * 1.6); g.add(col);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), M.roof);
  roof.position.y = 3.6; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), M.gold);
  finial.position.y = 4.5; g.add(finial);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addCircle(x, z, 2.4);
  camCollidables.push(g);
}

function signpost(x, z, rot) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.4, 5), M.wood);
  post.position.y = 1.2; post.castShadow = true; g.add(post);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, .5, .1), M.wood);
  board.position.set(0, 2, 0); g.add(board);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  // Thin post, like torches/banners — no collider.
}

tavern(28, 2, -.3);
smithy(-26, -7, .5);
marketStall(0, 24, 0);
stable(4, -25, .2); hayBale(10, -23); hayBale(11, -28);
shrine(-30, 5, -.4);
signpost(-6, 3, .2); // town-square marker near the original well

// Critter / NPC spawn helpers
export function spawnCritter(meshFactory, x, z) {
  const mesh = meshFactory();
  mesh.position.set(x, groundH(x, z), z); scene.add(mesh);
  const c = { mesh, x, z, sx: x, sz: z, wanderT: rand(1, 4), tx: x, tz: z };
  critters.push(c); return c;
}

export function spawnNPC(name, x, z, opts) {
  const mesh = humanoid(opts);
  mesh.position.set(x, groundH(x, z), z);
  const label = makeLabel(name, '#a8e8a0', 22); label.position.y = 2.9; mesh.add(label);
  const mark = makeLabel('!', '#f0d060', 48, 64); mark.position.y = 3.7; mark.visible = false; mesh.add(mark);
  mesh.rotation.y = rand(0, Math.PI * 2); scene.add(mesh);
  const n = { name, x, z, mesh, mark }; npcs.push(n); return n;
}

// Ambient wildlife
for (let i = 0; i < 9; i++) { const a = rand(0, Math.PI * 2), d = rand(30, 55); spawnCritter(() => boarMesh(0x8a6242, .8), Math.cos(a) * d, Math.sin(a) * d); }
for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2), d = rand(48, 75); spawnCritter(() => boarMesh(0x6e4a30, 1), Math.cos(a) * d, Math.sin(a) * d); }
for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2), d = rand(80, 120); spawnCritter(wolfMesh, Math.cos(a) * d, Math.sin(a) * d); }

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
const VILLAGER_SHIRTS = [0x8a6a4a, 0x5a7a5a, 0x7a5a6a, 0x4a6a8a, 0x9a8a4a, 0x6a4a4a];
const VILLAGER_SPOTS = [[6, -8], [-9, -2], [18, 20], [-20, -16], [10, -18], [-24, 10]];
VILLAGER_SPOTS.forEach(([x, z], i) =>
  spawnCritter(() => humanoid({ shirt: VILLAGER_SHIRTS[i % VILLAGER_SHIRTS.length] }), x, z));

export const marla = spawnNPC('Quartermaster Marla', 3.5, 4, { shirt: 0x7a5aa8 });
export const aldric = spawnNPC('Warden Aldric', -4, -6, { shirt: 0x55636e, hat: 0x3a444c });

// ---------- duelist NPCs (roster shared with the server) ----------
import { DUELISTS } from '../../shared/sets/core/duelists.js';

export function spawnDuelist(id, x, z, opts) {
  const def = DUELISTS[id];
  const n = spawnNPC(def.name, x, z, opts);
  n.duelist = { id, ...def };
  const badge = makeLabel('⚔ Duelist', '#e0b050', 20);
  badge.position.y = 3.35; n.mesh.add(badge);
  return n;
}

export const rowan = spawnDuelist('rowan', 8, -3, { shirt: 0x3a6b8a, hat: 0x2a3a4a });
export const vex = spawnDuelist('vex', -88, 66, { shirt: 0xa03a3a, hat: 0x2a2a2a });

// Gruk — the final boss duelist, boar-shaped, in his hollow of bones
export const grukNpc = (() => {
  const def = DUELISTS.gruk;
  const mesh = boarMesh(0x4a2e1c, 2.1);
  mesh.position.set(107, groundH(107, -60), -60);
  const label = makeLabel(def.name, '#ffb040', 30); label.position.y = 3.6; mesh.add(label);
  const badge = makeLabel('⚔ Duelist', '#e0b050', 20); badge.position.y = 2.9; mesh.add(badge);
  const mark = makeLabel('!', '#f0d060', 48, 64); mark.position.y = 4.4; mark.visible = false; mesh.add(mark);
  scene.add(mesh);
  const n = { name: def.name, x: 107, z: -60, mesh, mark, duelist: { id: 'gruk', ...def } };
  npcs.push(n); return n;
})();

// ---------- Highgate: southern trade capital (x=40 z=-145) ----------
// A walled capital, deliberately far south of Meadowbrook Village (~187
// units from spawn, near the 210 world-boundary clamp) so reaching it reads
// as its own journey rather than a village extension — see DESIGN.md
// "Highgate". Square wall footprint (76×76) with a gate gap on the north
// face (the side closest to the origin/village); constants.js's CAMPS entry
// (x=40,z=-145,r=50) tags the walls plus the road just outside the gate.
// Reuses tavern()/shrine()/marketStall()/crate()/barrel()/banner() from the
// village/camp sections above rather than one-off buildings, per the same
// primitive-geometry/groundH/addRect-addCircle conventions.

const HG = { x: 40, z: -145, half: 38 };

function wallSeg(x, z, len, rot) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(len, 4.4, 1.2), M.wall);
  g.position.set(x, groundH(x, z) + 2.2, z); g.rotation.y = rot;
  g.castShadow = true; g.receiveShadow = true; scene.add(g);
  addRect(x, z, len, 1.2, rot);
  camCollidables.push(g);
}

function watchtower(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 6.5, 8), M.wall);
  body.position.y = 3.25; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 2.6, 8), M.roof);
  roof.position.y = 7.8; roof.castShadow = true; g.add(roof);
  g.position.set(x, groundH(x, z), z); scene.add(g);
  addCircle(x, z, 2.1);
  camCollidables.push(g);
}

function warehouse(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 6), M.wood);
  b.position.y = 1.7; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(5, 1.6, 4), M.roof);
  r.position.y = 4.3; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 7, 6, rot);
  camCollidables.push(g);
}

function fountain(x, z) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, .6, 12), M.rock);
  base.position.y = .3; base.castShadow = true; g.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2, .18, 6, 16), M.rock);
  rim.rotation.x = Math.PI / 2; rim.position.y = .65; g.add(rim);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.15, .2, 1.4, 6), M.rock);
  spout.position.y = 1.1; g.add(spout);
  g.position.set(x, groundH(x, z), z); scene.add(g);
  addCircle(x, z, 2.2);
}

// Walls — two north segments leave an 8-wide gate gap centered on HG.x
wallSeg(HG.x - 21, HG.z + HG.half, 34, 0);
wallSeg(HG.x + 21, HG.z + HG.half, 34, 0);
wallSeg(HG.x, HG.z - HG.half, 76, 0);              // south wall
wallSeg(HG.x - HG.half, HG.z, 76, Math.PI / 2);    // west wall
wallSeg(HG.x + HG.half, HG.z, 76, Math.PI / 2);    // east wall

watchtower(HG.x - HG.half, HG.z + HG.half);
watchtower(HG.x + HG.half, HG.z + HG.half);
watchtower(HG.x - HG.half, HG.z - HG.half);
watchtower(HG.x + HG.half, HG.z - HG.half);
banner(HG.x - 5, HG.z + HG.half, 0, M.capitalBanner);
banner(HG.x + 5, HG.z + HG.half, Math.PI, M.capitalBanner);

// Interior: Merchant Hall (Yara), Counting House, warehouse, market plaza, fountain
tavern(HG.x, HG.z - 15, 0);
shrine(HG.x - 22, HG.z - 8, -.3);
warehouse(HG.x + 22, HG.z - 8, .3);
marketStall(HG.x - 10, HG.z + 8, .2);
marketStall(HG.x + 10, HG.z + 8, -.2);
marketStall(HG.x, HG.z + 14, 0);
fountain(HG.x, HG.z);
crate(HG.x + 25, HG.z - 11, .3); crate(HG.x + 19, HG.z - 12, -.2);
barrel(HG.x + 23, HG.z - 5);

torches.push(
  torch(HG.x - HG.half + 3, HG.z + HG.half - 3),
  torch(HG.x + HG.half - 3, HG.z + HG.half - 3),
  torch(HG.x - HG.half + 3, HG.z - HG.half + 3),
  torch(HG.x + HG.half - 3, HG.z - HG.half + 3),
  torch(HG.x - 6, HG.z - 15),
  torch(HG.x + 6, HG.z - 15),
);

// Ambient flavor villagers, same reuse pattern as Meadowbrook's VILLAGER_SPOTS
const HIGHGATE_SPOTS = [[25, -147], [55, -147], [25, -163], [55, -163], [40, -170]];
HIGHGATE_SPOTS.forEach(([x, z], i) =>
  spawnCritter(() => humanoid({ shirt: VILLAGER_SHIRTS[i % VILLAGER_SHIRTS.length] }), x, z));

export const yara = spawnNPC('Guildmaster Yara', 40, -155, { shirt: 0x8a6a2a, hat: 0x5a4a1a });
export const verity = spawnDuelist('verity', 40, -112, { shirt: 0x2f4d8a, hat: 0x1e3060 });
export const tarn = spawnDuelist('tarn', 40, -98, { shirt: 0x6a5a3a, hat: 0x3a2e1c });

// ---------- Emberwatch Ruins: night-only landmark (x=100 z=100) ----------
// A crumbling watchtower in the unclaimed northeast wilds — clear of every
// other POI (Vex's camp NW, Gruk's Hollow SE, Highgate S). The ruin itself
// (tower + broken wall stubs + rubble) is always there; its guardian only
// manifests after dark, turning night from pure ambiance into an actual
// mechanic — DESIGN.md's night-design decision flagged "night-only content"
// as a potential future hook, and this is it. Reuses wallSeg()/watchtower()
// from the Highgate section above (shorter wall stubs read as "broken").
// Visibility is toggled every frame in main.js's update() (has gameHour in
// scope already, no new import cycle); interact.js's nearestInteract() skips
// invisible NPCs so the Sentinel can't be challenged in daylight. This is a
// client-side discoverability gate only — the server never validates NPC
// duel proximity or time-of-day for ANY duelist (checked: `npcduel` in
// server/index.js only checks the DUELISTS map and room/trade state), so a
// scripted client could challenge it early. Consistent with the existing
// client-authoritative-position/autobattle posture (DESIGN.md) — not worth
// a special-cased server check for one landmark.

watchtower(100, 100);
wallSeg(93, 91, 8, .5);
wallSeg(109, 93, 6, -.35);
for (const [dx, dz, s] of [[3, -3, .8], [-4, 4, 1.1], [2, 6, .6], [-3, -4, .5]]) {
  const rx = 100 + dx, rz = 100 + dz;
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s), M.rock);
  r.position.set(rx, groundH(rx, rz) + s * .3, rz); r.castShadow = true; scene.add(r);
}
fires.push(campfire(100, 103));   // an ember that burns with no one tending it — always lit, day or night

export const sentinel = spawnDuelist('sentinel', 100, 100, { shirt: 0x2a1a14, hat: 0xdd5500 });
sentinel.mesh.visible = false;   // corrected within the first frame by main.js's gameHour check
const sentinelGlow = new THREE.PointLight(0xff6a1a, 1.4, 12);
sentinelGlow.position.y = 2.4; sentinel.mesh.add(sentinelGlow);

// ---------- Bram's Rest: wayside stop on the road to Highgate (x=20 z=-70) ----------
// Right at the Boarlands/Darkwood seam (~73 from origin) — the last safe
// fire before the road to Highgate gets dangerous. Addresses DESIGN.md's
// open question on whether that walk reads as a destination or a slog: a
// small, unglamorous rest stop partway through, not another settlement.
// Reuses tent()/campfire()/signpost()/crate()/barrel() from the sections
// above. Old Bram is the first NPC to use the new n.flavor dialogue system
// (interact.js) — a non-duelist, non-quest-giver who exists purely to make
// the world feel lived-in and tie earlier landmarks together in dialogue.

tent(17, -73, .7);
signpost(14, -68, -1.3);    // "back toward Meadowbrook"
signpost(27, -73, 1.9);     // "on to Highgate"
crate(23, -66, .3);
barrel(25, -68);
fires.push(campfire(20, -70));

export const bram = spawnNPC('Old Bram', 18, -71, { shirt: 0x6a5a4a, hat: 0x3a3428 });
bram.flavor = [
  "Sit if you want. Fire's free, my stories aren't — but I tell those free too.",
  "Vex used to run these woods before the west camp took her — good riddance, though she'd spit at hearing me say it.",
  "Gruk's Hollow went quiet after some fool actually beat him. Bones don't lie, they say.",
  "Highgate's not far now — half a day east if your legs are honest with you. Mind Tarn at the gate; he doesn't joke about tolls.",
  "Some nights there's a light out in the northeast ruins. No one tends a fire up there. Make of that what you will.",
  "I used to duel for coin, back when my knees agreed to it. Now I just watch the road and mind the fire.",
];

export const footpad = spawnDuelist('footpad', 25, -74, { shirt: 0x7a2a2a, hat: 0x2a2a2a });

// ---------- Hollowmere: sunken swamp (x=-100 z=-90) ----------
// A sparse, wild place in the unclaimed southwest — deliberately no
// buildings (see DESIGN.md), just dead trees, bog pools, and reeds around
// Old Hessa's fire. First use of a genuinely new visual family (everything
// so far reused the green pine tree() or hand-built structures); the
// desaturated M.deadwood/bogWater/reed palette is what makes this camp read
// as a swamp rather than "more forest."

function deadTree(x, z, rot, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.22 * scale, .4 * scale, 3.2 * scale, 6), M.deadwood);
  trunk.position.y = 1.6 * scale; trunk.castShadow = true; g.add(trunk);
  for (const [dy, a, len] of [[2.4, .6, 1.6], [2.0, -1.1, 1.3], [2.8, 2.4, 1.1]]) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(.05 * scale, .1 * scale, len * scale, 5), M.deadwood);
    branch.position.set(Math.cos(a) * len * scale * .4, dy * scale, Math.sin(a) * len * scale * .4);
    branch.rotation.z = Math.PI / 2 - a; branch.rotation.y = a; branch.castShadow = true; g.add(branch);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addCircle(x, z, .3 * scale);
}

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
