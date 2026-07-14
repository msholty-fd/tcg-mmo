// The Dial Stone (DESIGN.md, 2026-07-14): a weathered sundial ring on the
// eastern grass at (165,25) — the empty wedge between Gruk's Hollow and the
// Emberwatch Ruins. The realm's first *skywatching* place, and a deliberate
// piece of mechanical diegesis: the game's server-synced hour is a real
// system (night duelists, Nocturnal, torch ramps), and until now nothing in
// the world talked about it. The gnomon casts a TRUE shadow from the moving
// directional sun, so the dial actually tells the shared game time.
// Merle the Skywatcher (flavour NPC, small-omens tier) is also the realm's
// gentle hint system for night content — the Sentinel's window and the
// wood's night walker are easy to never discover; Merle points sideways at
// both without explaining either. LORE fire tier: TENDED (one small fire,
// kept deliberately dim — bright eyes see less sky).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle } from '../colliders.js';
import { M, camCollidables, campfire, tent, crate, barrel, signpost, spawnNPC } from './lib.js';

const DS = { x: 165, z: 25 };   // heart (constants.js CAMPS r=16)

// Weathered dial face — between M.rock and M.waystone: pale enough that the
// gnomon's shadow reads on it, grayed enough that it doesn't read as new
// marble (the first render did — the ring is supposed to be OLD).
const M_DIAL = new THREE.MeshLambertMaterial({ color: 0x9a9a90 });

// The dial: a broad low plinth, a tall leaning gnomon, and a ring of hour
// stones — two of them fallen, one missing outright (the ring is old; folk
// things decay). The gnomon's real shadow sweeping the ring IS the feature.
(function dialStone() {
  const y = groundH(DS.x, DS.z);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, .5, 18), M_DIAL);
  plinth.position.set(DS.x, y + .25, DS.z);
  plinth.receiveShadow = true; scene.add(plinth);

  const gnomon = new THREE.Mesh(new THREE.BoxGeometry(.55, 4.6, .9), M.rock);
  gnomon.position.set(DS.x, y + 2.5, DS.z);
  gnomon.rotation.z = .38;   // the lean gives the shadow a blade edge
  gnomon.castShadow = true; gnomon.receiveShadow = true; scene.add(gnomon);
  addCircle(DS.x, DS.z, .9);

  for (let i = 0; i < 12; i++) {
    if (i === 7) continue;   // the missing hour — Merle won't say which it was
    const a = (i / 12) * Math.PI * 2, d = 4.4;
    const hx = DS.x + Math.cos(a) * d, hz = DS.z + Math.sin(a) * d;
    const fallen = i === 3 || i === 10;
    const s = new THREE.Mesh(new THREE.BoxGeometry(.5, fallen ? .35 : rand(.9, 1.2), .35), M.waystone);
    s.position.set(hx, y + (fallen ? .55 : .95), hz);
    s.rotation.y = a + (fallen ? rand(.4, .9) : rand(-.08, .08));
    s.castShadow = true; s.receiveShadow = true; scene.add(s);
  }
})();

// Merle's camp, downhill of the ring so the lean-to never shades the dial:
// a low tent, the kept-small fire, a chart crate, a rain barrel, and a
// signpost for the walk-up read.
tent(DS.x - 9, DS.z + 6, 2.2, .85);
campfire(DS.x - 6, DS.z + 8);
crate(DS.x - 10.5, DS.z + 8.5, .6); barrel(DS.x - 11.5, DS.z + 7);
signpost(DS.x - 4, DS.z + 12, -2.6);

// A watching bench: two flat stones facing the ring — Merle's, and a spare.
// "The spare is for whoever asks a good question."
for (const [bx, bz] of [[DS.x + 7.5, DS.z + 3], [DS.x + 8.2, DS.z + 1]]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, .45, .8), M.rock);
  b.position.set(bx, groundH(bx, bz) + .25, bz);
  b.rotation.y = Math.atan2(DS.x - bx, DS.z - bz);
  b.castShadow = true; b.receiveShadow = true; scene.add(b);
  addCircle(bx, bz, .6);
}

// Merle the Skywatcher — flavour NPC (small-omens tier, LORE.md). Their
// lines ground the shared clock diegetically, tip players toward the
// realm's night content (Emberwatch, the deep wood), and carry one seeded
// omen ("the nights feel longer") that leans on the myth without naming it.
export const merle = spawnNPC('Merle the Skywatcher', DS.x - 4, DS.z + 5, { shirt: 0x4a5568, hat: 0x2e3644 });
merle.flavor = [
  "Twelve stones and a shadow — that's all a clock is. The sky does the hard part.",
  "There are those in this realm that only keep night hours. The old watch's ruin has one. The deep wood has another. Bring your cards, and mind the hour.",
  "Highgate pays for star-charts, if you can believe it. Captains and farmers both want to know what the season's doing.",
  "People ask what I'm looking for up there. Wrong question. I'm keeping count.",
  "The nights come on the same as ever — I've measured. So why do they feel longer? Even the moths notice.",
  "One fire, kept small — bright eyes see more sky. But kept, mind. Always kept.",
];
