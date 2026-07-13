import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { humanoid } from '../entities.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, torch, torches, tavern, shrine, marketStall, crate, barrel, banner,
         wallSeg, watchtower, spawnCritter, spawnNPC, spawnDuelist, VILLAGER_SHIRTS } from './lib.js';

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
