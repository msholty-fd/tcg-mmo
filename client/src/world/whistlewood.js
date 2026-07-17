// The Whistlewood (DESIGN.md, 2026-07-17): an old-growth grove deep in the
// southwest wilds at (-137,-147) — the realm's first place defined not by a
// CRAFT but by the WILD itself. The two-axis survey: with the craft economy
// complete end-to-end (every yard has its full grammar), the realm was heavy
// on workshops and thin on wilderness with a face; and the wildcaller card
// family (wild_summons, call_of_the_wild, old_whistler, low_whistle,
// something_comes — five cards, conjuration: calling wild beasts into being)
// had no home. The Whistlewood is that home: a grove where Rook the
// Wildcaller whistles up the wild, and — the striking image — the wild
// things GATHER to her small fire, calm, when every wild thing else in the
// realm flees a flame. The conjuration duelist (Rook's apprentice, the young
// caller) is seeded here for the next duelists.js window (the "title looking
// for an owner" from iteration 15 finds its grove; the master is flavour,
// the apprentice duels — the Odo->Wick precedent).
// Sited by the numeric flat-scan (grove-scan): flattest r=9 disc in the
// realm's biggest clean gap (center h 2.54, max deviation 0.32 within r=9 —
// under the quarry's 0.65), zero terrain edits; clearances — Bee Meads 38,
// Kilnyard 59, world-bound 45. Deep SW past the Kiln Road's end, removed and
// wild, as a hermit caller's grove should be.
// LORE relationship to the fire: TENDED — and a FRESH register no craft yard
// has: a small fire the WILD has forgiven. Every hearth is a banked coal of
// the old wood; hers the beasts have learned to sit beside (one light echo,
// never explained: "everything wild fears a fire; mine, they've made their
// peace with").
// Seeded doors (DESIGN.md/LORE.md, do not answer here): the black hind that
// comes to the fire on no whistle she knows, and the whistle itself — no one
// taught her, she woke knowing it.
// New geometry gets its own palette (the Hollowmere/Pell rule): deep
// moss-green old-growth OAKS, not the realm's conical pines, so the grove
// reads as its own ancient wood.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, fires, spawnNPC } from './lib.js';

const W = { x: -137, z: -147 };   // heart (shared/zones.js CAMPS r=15)

// Deep old-growth palette — mossy canopy + dark wet bark, distinct from the
// realm's brighter pines (M.leaf/leaf2) so the grove reads as ancient wood.
const M_OAK  = new THREE.MeshLambertMaterial({ color: 0x2f4a2a });
const M_OAK2 = new THREE.MeshLambertMaterial({ color: 0x3a5a30 });
const M_BARK = new THREE.MeshLambertMaterial({ color: 0x4a3a2c });
const M_MOSS = new THREE.MeshLambertMaterial({ color: 0x46662f });
const M_HIDE = new THREE.MeshLambertMaterial({ color: 0x6a5540 });

// ---------- old-growth oaks: gnarled trunk + big rounded canopy ----------
function oldOak(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.45 * s, .7 * s, 3.4 * s, 7), M_BARK);
  trunk.position.y = 1.7 * s; trunk.castShadow = true; g.add(trunk);
  // two low gnarled boughs
  for (const a of [rand(0, 6), rand(0, 6)]) {
    const bough = new THREE.Mesh(new THREE.CylinderGeometry(.12 * s, .2 * s, 1.8 * s, 5), M_BARK);
    bough.position.set(Math.cos(a) * .6 * s, 2.6 * s, Math.sin(a) * .6 * s);
    bough.rotation.z = Math.cos(a) * .7; bough.rotation.x = -Math.sin(a) * .7; g.add(bough);
  }
  // broad rounded canopy — overlapping spheres, deep moss-green
  for (const [dx, dy, dz, r, m] of [[0, 4.6, 0, 2.6, M_OAK], [1.4, 4.2, .6, 1.9, M_OAK2], [-1.2, 4.0, -.8, 1.8, M_OAK], [.4, 5.3, -1.0, 1.6, M_OAK2]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(r * s, 8, 6), m);
    c.position.set(dx * s, dy * s, dz * s); c.castShadow = true; g.add(c);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rand(0, 6); scene.add(g);
  addCircle(x, z, .7 * s);   // trunk only — canopy overhangs, walkable
}
// a rough ring of oaks around the clearing (center kept open for the camp)
for (const [dx, dz, s] of [
  [-9, -3, 1.15], [-7, 6, 1.0], [-2, 10, 1.1], [6, 8, .95], [10, 2, 1.2],
  [9, -6, 1.0], [3, -10, 1.1], [-5, -10, .95], [-11, 4, 1.05], [11, -1, .9],
  [-3, 11, .9], [7, -9, 1.05],
]) oldOak(W.x + dx, W.z + dz, s);

// ---------- mossy grove floor: flat patches, no collider ----------
for (let i = 0; i < 10; i++) {
  const mx = W.x + rand(-9, 9), mz = W.z + rand(-9, 9);
  const patch = new THREE.Mesh(new THREE.CircleGeometry(rand(1.2, 2.4), 7), M_MOSS);
  patch.rotation.x = -Math.PI / 2; patch.position.set(mx, groundH(mx, mz) + .04, mz);
  patch.receiveShadow = true; scene.add(patch);
}
// a few mossy fallen logs (flat clutter, no collider)
for (const [dx, dz, rot] of [[-4, 3, .6], [5, -2, -1.1], [-2, -5, 2.2]]) {
  const lx = W.x + dx, lz = W.z + dz;
  const log = new THREE.Mesh(new THREE.CylinderGeometry(.4, .45, rand(2.4, 3.4), 6), M_BARK);
  log.rotation.z = Math.PI / 2; log.rotation.y = rot;
  log.position.set(lx, groundH(lx, lz) + .35, lz); log.castShadow = true; scene.add(log);
}

// ---------- Rook's lean-to: bark roof on two posts, a hide draped ----------
(function leanTo() {
  const hx = W.x - 2, hz = W.z - 3, rot = .5;
  const g = new THREE.Group();
  for (const px of [-1.6, 1.6]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.11, .14, 2.0, 6), M_BARK);
    post.position.set(px, 1.0, .9); post.castShadow = true; g.add(post);
  }
  for (const px of [-1.6, 1.6]) {
    const back = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .9, 6), M_BARK);
    back.position.set(px, .45, -.9); g.add(back);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.6, .16, 2.4), M_HIDE);
  roof.position.set(0, 1.5, 0); roof.rotation.x = -.5; roof.castShadow = true; g.add(roof);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.8, .18, 1.0), M_MOSS);
  bed.position.set(0, .12, -.4); g.add(bed);
  g.position.set(hx, groundH(hx, hz), hz); g.rotation.y = rot; scene.add(g);
  addRect(hx, hz, 3.6, 2.4, rot);
  camCollidables.push(g);
})();

// Rook's small tended fire — the wild's forgiven flame. Explicit fires.push
// so the flame animates (campfire() does not self-register; the 0992af6
// lesson).
fires.push(campfire(W.x + 1.5, W.z - 1.5));

// a log seat by the fire
(function logSeat() {
  const sx = W.x + 3.4, sz = W.z - .5;
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(.45, .48, 2.2, 7), M_BARK);
  seat.rotation.z = Math.PI / 2; seat.rotation.y = .4;
  seat.position.set(sx, groundH(sx, sz) + .45, sz); seat.castShadow = true; scene.add(seat);
  addCircle(sx, sz, .7);
})();

// ---------- the gathered wild: calm beasts at the fire (module-local) ----------
// The zone's signature: wild things sitting by a flame. Static, calm — "the
// wild that came." Simple module-local meshes (the single-region rule — no
// entities.js changes for one grove's ambience).
// r128 has no CapsuleGeometry (CLAUDE.md) — bodies are cylinders + sphere
// caps, ears/head are small spheres. Simple module-local meshes.
const M_DEER = new THREE.MeshLambertMaterial({ color: 0x7a5a3e });
const M_HARE = new THREE.MeshLambertMaterial({ color: 0x8a7a5e });
function hind(x, z, rot) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.0, 7), M_DEER);
  body.rotation.z = Math.PI / 2; body.position.y = 1.0; g.add(body);
  for (const ex of [.5, -.5]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.3, 7, 6), M_DEER);
    cap.position.set(ex, 1.0, 0); g.add(cap);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, .8, 6), M_DEER);
  neck.position.set(.7, 1.35, 0); neck.rotation.z = -.7; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.19, 7, 6), M_DEER);
  head.position.set(1.0, 1.6, 0); head.scale.x = 1.5; g.add(head);
  for (const [lx, lz] of [[.55, .22], [.55, -.22], [-.55, .22], [-.55, -.22]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.0, 5), M_DEER);
    leg.position.set(lx, .5, lz); g.add(leg);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addCircle(x, z, .5);
}
function hare(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.2, 7, 6), M_HARE);
  body.scale.set(1.5, 1, 1); body.position.set(0, .28, 0); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 6, 5), M_HARE);
  head.position.set(.28, .4, 0); g.add(head);
  for (const ez of [-.06, .06]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(.03, .05, .3, 5), M_HARE);
    ear.position.set(.28, .62, ez); ear.rotation.z = .15; g.add(ear);
  }
  g.position.set(x, groundH(x, z), z); g.rotation.y = rand(0, 6); scene.add(g);
}
hind(W.x + 4.5, W.z + 2, -2.0);
hind(W.x - 3.5, W.z + 3.5, 1.0);
hare(W.x + 2.2, W.z + .3); hare(W.x - .5, W.z + 2.4); hare(W.x + 3.6, W.z - 3);

// ---------- Rook the Wildcaller — flavour NPC (small omens tier, LORE.md) ----------
// The grove's master caller: the wild answers her whistle, and gathers to
// her fire. Small-omens tier — she knows beasts and the wood, not the myth.
// Ties the wild into the realm (Sorrel hunts it, Wynn's flock fears its
// edge, the Darkwood's dark) and carries the grove's two seeded doors
// sideways, unexplained. Stands by the fire among the gathered beasts;
// nearest colliders: fire ~2.6, log seat ~2.9, lean-to ~3.4 (labels clear).
export const rook = spawnNPC('Rook the Wildcaller', W.x - .5, W.z + .5, { shirt: 0x3f5236, hat: 0x2e3a26 });
rook.flavor = [
  "Sorrel tracks the wild and Wynn fences it out. I just whistle, and it comes. Different trades, same country.",
  "Everything wild fears a fire — bolts from the first spark. Mine, they've made their peace with. Took years. I don't rush a thing that has claws.",
  "The whistle? Nobody taught me. I woke one morning past the Kiln Road knowing it, the way you know your own name. I've stopped wondering why. The wood didn't send an explanation.",
  "A black hind comes to my fire some nights that I never once called. Sits across the coals like she's owed the warmth. I let her. You don't refuse the wood its guests.",
  "Beasts remember kindness longer than people do, and grudges longer still. Feed a thing once, it's yours for life. Cross it once, the same.",
  "Folk call it conjuring, the calling — like I pull them out of nothing. I don't. They were always here. I just let them know they're welcome.",
];
