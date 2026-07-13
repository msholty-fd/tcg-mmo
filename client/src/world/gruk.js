import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { boarMesh, makeLabel } from '../entities.js';
import { npcs } from '../state.js';
import { rand } from '../utils.js';
import { M, campfire, fires, DUELISTS } from './lib.js';

// Boss camp skull
{
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.9, 8, 7),
    new THREE.MeshLambertMaterial({ color: 0xe0d8c4 }));
  skull.position.set(104, groundH(104, -58) + .9, -58); skull.scale.z = 1.2; scene.add(skull);
}

fires.push(campfire(108, -62));

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
