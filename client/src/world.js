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
house(-13, 8, Math.PI * .9); house(14, 10, -Math.PI * .7);
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
