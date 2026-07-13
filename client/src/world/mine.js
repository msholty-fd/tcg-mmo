import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, signpost, spawnDuelist } from './lib.js';

// ---------- Cinderhollow Mine: an abandoned delving (x=-15 z=115) ----------
// A new archetype: industrial/abandoned, and the first landmark with NO NPC
// and NO duel — purely a scenic discovery due north in the Darkwood, seeding
// an obvious future hook (underground content, a mine-themed duelist/quest).
// The rocky rise is built from stacked M.rock boulders rather than relying on
// the terrain having a real hill here, so the timbered mouth reads correctly
// wherever it's placed; the "opening" is a near-black recessed plane framed
// by heavy timbers, backed by boulders (with colliders) so you can't walk
// into empty space. Tagged as a named place via constants.js CAMPS.

const MINE = { x: -15, z: 115 };

function boulder(x, z, s) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s), M.rock);
  r.position.set(x, groundH(x, z) + s * .35, z); r.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
  r.castShadow = true; r.receiveShadow = true; scene.add(r);
  addCircle(x, z, s * .85);
}

(function cinderhollowMine() {
  const { x, z } = MINE;
  // the rocky rise — a horseshoe of big boulders open to the south (+z),
  // where the entrance faces the approaching player.
  boulder(x, z - 5, 5.5);                       // back wall of the hill
  boulder(x - 6, z - 3, 4.5); boulder(x + 6, z - 3, 4.5);
  boulder(x - 5, z + 1, 3.2); boulder(x + 5, z + 1, 3.2);
  boulder(x - 3, z - 7, 3.5); boulder(x + 3, z - 7, 3.5);

  // timbered entrance frame at the front of the rise (opening faces +z)
  const g = new THREE.Group();
  for (const dx of [-1.5, 1.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.5, 3.4, .5), M.wood);
    post.position.set(dx, 1.7, 0); post.castShadow = true; g.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4, .6, .6), M.wood);
  lintel.position.set(0, 3.5, 0); lintel.castShadow = true; g.add(lintel);
  // the dark mouth — a near-black plane set back inside the frame
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.2), M.mineDark);
  mouth.position.set(0, 1.6, -.6); g.add(mouth);
  g.position.set(x, groundH(x, z), z + 3.2); scene.add(g);
  // block the threshold so the player stops at the mouth (no interior exists)
  addRect(x, z + 2.6, 3.4, .6, 0);
  addRect(x - 1.75, z + 3.2, .6, 1.5, 0); addRect(x + 1.75, z + 3.2, .6, 1.5, 0);

  // rail tracks + a couple of ties leading south out of the mouth
  for (let i = 0; i < 7; i++) {
    const tz = z + 4 + i * 1.3;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(1.6, .1, .28), M.rust);
    tie.position.set(x, groundH(x, tz) + .06, tz); scene.add(tie);
  }
  for (const dx of [-.6, .6]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.1, .12, 8.5), M.ironBand);
    const rz = z + 7.2;
    rail.position.set(x + dx, groundH(x, rz) + .14, rz); scene.add(rail);
  }

  // a tipped-over minecart just off the rails
  const cart = new THREE.Group();
  const bin = new THREE.Mesh(new THREE.BoxGeometry(1.3, .9, 1.6), M.rust);
  bin.position.y = .8; bin.castShadow = true; cart.add(bin);
  for (const [wx, wz] of [[-.6, .6], [.6, .6], [-.6, -.6], [.6, -.6]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .12, 10), M.ironBand);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, .35, wz); cart.add(wheel);
  }
  const cz = z + 6;
  cart.position.set(x + 3.2, groundH(x + 3.2, cz), cz); cart.rotation.z = .5; cart.rotation.y = .8;
  scene.add(cart);
  addCircle(x + 3.2, cz, 1.1);

  // spoil heaps — dark tailings the delving coughed up
  for (const [dx, dz, s] of [[-4, 6, 1.4], [3.5, 9, 1.1], [-2, 11, 1.3]]) {
    const heap = new THREE.Mesh(new THREE.ConeGeometry(s, s * .8, 7), M.charred);
    const hx = x + dx, hz = z + dz;
    heap.position.set(hx, groundH(hx, hz) + s * .35, hz); heap.castShadow = true; scene.add(heap);
    addCircle(hx, hz, s * .7);
  }

  // a warning signpost on the approach
  signpost(x + 2, z + 12, -.4);
})();

// Marrow the Delver (DESIGN.md) — graveyard-matters as a deck-wide identity.
// Cinderhollow Mine was seeded on purpose as "a landmark with no NPC and no
// duel... an intentional seed for future underground content (a mine-themed
// duelist...)" — this is that hook being claimed. Stationed clear of the
// boulders/rails/spoil heaps above, off to the east of the mine mouth, still
// well within the existing "Cinderhollow Mine" CAMPS radius (no new zone).
export const marrow = spawnDuelist('marrow', MINE.x + 12, MINE.z - 2, { shirt: 0x4a4438, hat: 0x2a2620 });
