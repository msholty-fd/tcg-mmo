// Shared world-building library: materials, prop builders, spawn helpers,
// and the cross-region registries (camCollidables/fires/torches). Every
// region module under world/ imports from here; region-specific builders
// (bone piles, waystones, lava pools...) live in their region's module.
// Split out of the monolithic world.js 2026-07-13 (DESIGN.md "world.js
// per-region split") — code is verbatim from there, only exports added.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { humanoid, makeLabel } from '../entities.js';
import { critters, npcs } from '../state.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { DUELISTS as CORE_DUELISTS } from '../../../shared/sets/core/duelists.js';
import { EMBERPEAKS_DUELISTS } from '../../../shared/sets/emberpeaks/duelists.js';

export const M = {
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
  // Waystone dressing — a weathered pale stone plus a gilded painted band/
  // arrow (same gold as Highgate's finial) that marks these as official
  // realm roadmarkers rather than the grey rubble scattered elsewhere.
  waystone: new THREE.MeshLambertMaterial({ color: 0xb8b0a2 }),
  // Farmstead dressing — tilled soil + crop green, distinct from the wild
  // meadow so cultivated land reads as worked-by-hand at a glance.
  soil: new THREE.MeshLambertMaterial({ color: 0x5a4230 }),
  crop: new THREE.MeshLambertMaterial({ color: 0x6f9a3a }),
  burlap: new THREE.MeshLambertMaterial({ color: 0xb89a5a }),
  // Mine dressing — a near-black mouth that reads as "depth" against the
  // grey rock, plus a rusted-iron for the cart/rails.
  mineDark: new THREE.MeshLambertMaterial({ color: 0x0a0a0c }),
  rust:     new THREE.MeshLambertMaterial({ color: 0x6a4a30 }),
  // Emberpeaks dressing — obsidian ridge/spires, glowing lava, ashen scree.
  obsidian:  new THREE.MeshLambertMaterial({ color: 0x201c22 }),
  emberRock: new THREE.MeshLambertMaterial({ color: 0x35291f, emissive: 0x300a00 }),
  lava:      new THREE.MeshLambertMaterial({ color: 0xff5a1e, emissive: 0xdd3300, side: THREE.DoubleSide }),
  ash:       new THREE.MeshLambertMaterial({ color: 0x4a4038 }),
};

export function tree(x, z, dark) {
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

export function campfire(x, z) {
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

// Cross-region registries: regions push their own campfires/torches as they
// build (Red-Sash camp, Gruk's hollow, Highgate, Bram's Rest...); main.js
// animates whatever ends up here. Order is irrelevant.
export const fires = [];
export const torches = [];

export function torch(x, z) {
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

export function tent(x, z, rot, scale = 1) {
  const g = new THREE.Group();
  // A stretched 4-sided pyramid reads as a peaked ridge-tent silhouette.
  const body = new THREE.Mesh(new THREE.ConeGeometry(1.5 * scale, 2.1 * scale, 4), M.hide);
  body.scale.z = 1.6; body.position.y = 1.05 * scale; body.castShadow = true; g.add(body);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.3 * scale, 5), M.wood);
  pole.position.y = 1.1 * scale; g.add(pole);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, 3 * scale, 3 * scale * 1.6, rot);
}

export function banner(x, z, rot, mat = M.redSash) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 3.4, 5), M.wood);
  pole.position.y = 1.7; pole.castShadow = true; g.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), mat);
  cloth.position.set(.56, 2.25, 0); g.add(cloth);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  // Thin pole, like torches — no collider.
}

export function crate(x, z, rot) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .9), M.wood);
  b.position.y = .45; b.castShadow = true; g.add(b);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addRect(x, z, .9, .9, rot);
}

export function barrel(x, z) {
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

export function tavern(x, z, rot) {
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

export function marketStall(x, z, rot) {
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

export function hayBale(x, z) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1, 10), M.hay);
  b.rotation.z = Math.PI / 2; b.castShadow = true;
  b.position.set(x, groundH(x, z) + .6, z); scene.add(b);
  addCircle(x, z, .6);
}

export function shrine(x, z, rot) {
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

export function signpost(x, z, rot) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.4, 5), M.wood);
  post.position.y = 1.2; post.castShadow = true; g.add(post);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, .5, .1), M.wood);
  board.position.set(0, 2, 0); g.add(board);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  // Thin post, like torches/banners — no collider.
}

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

export const VILLAGER_SHIRTS = [0x8a6a4a, 0x5a7a5a, 0x7a5a6a, 0x4a6a8a, 0x9a8a4a, 0x6a4a4a];

// ---------- duelist NPCs (roster shared with the server) ----------
export const DUELISTS = { ...CORE_DUELISTS, ...EMBERPEAKS_DUELISTS };

export function spawnDuelist(id, x, z, opts) {
  const def = DUELISTS[id];
  const n = spawnNPC(def.name, x, z, opts);
  n.duelist = { id, ...def };
  const badge = makeLabel('⚔ Duelist', '#e0b050', 20);
  badge.position.y = 3.35; n.mesh.add(badge);
  return n;
}

export function wallSeg(x, z, len, rot) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(len, 4.4, 1.2), M.wall);
  g.position.set(x, groundH(x, z) + 2.2, z); g.rotation.y = rot;
  g.castShadow = true; g.receiveShadow = true; scene.add(g);
  addRect(x, z, len, 1.2, rot);
  camCollidables.push(g);
}

export function watchtower(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 6.5, 8), M.wall);
  body.position.y = 3.25; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 2.6, 8), M.roof);
  roof.position.y = 7.8; roof.castShadow = true; g.add(roof);
  g.position.set(x, groundH(x, z), z); scene.add(g);
  addCircle(x, z, 2.1);
  camCollidables.push(g);
}
