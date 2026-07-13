import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { M, campfire, fires, wallSeg, watchtower, spawnDuelist } from './lib.js';

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
