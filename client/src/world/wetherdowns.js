// The Wether Downs (DESIGN.md, 2026-07-14): a shepherd's grazing downs at
// (-150,-10), the realm's first *pastoral* place — the due-west wedge
// between Red-Sash Camp and Hollowmere was the biggest unclaimed stretch of
// map, and wild/martial/mercantile/agricultural/industrial were all taken.
// LORE relationship to the fire: TENDED — one small fire, kept nightly (the
// cozy counterweight to the just-finished Darkwood). A drystone sheepfold,
// a shepherd's hut, Shepherd Wynn (flavour NPC, small-omens tier), the
// flock, and the dog. Card-light, world-module-only, no duelist — the downs
// can host a shepherd duelist later if the loop wants one (seeded hook:
// whatever the bellwether watches for in the west).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, hayBale, crate, barrel, signpost, spawnCritter, spawnNPC, spawnDuelist } from './lib.js';

const WD = { x: -150, z: -10 };   // heart (constants.js CAMPS r=20)

// Drystone wall segments — knee-high stacked-stone runs forming a C-shaped
// fold, gap facing east toward the hut. Cosmetic, no colliders: the
// Harrowfield fence decision applies (a low wall you'd step over beats an
// invisible-wall feel; if a pen ever must contain something, revisit).
function drystoneRun(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(len / 1.4));
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n;
    const px = x1 + dx * t, pz = z1 + dz * t;
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(rand(1.1, 1.5), rand(.55, .8), rand(.5, .7)), M.rock);
    s.position.set(px, groundH(px, pz) + .3, pz);
    s.rotation.y = Math.atan2(dx, dz) + rand(-.12, .12);
    s.castShadow = true; s.receiveShadow = true; scene.add(s);
  }
}

// The fold: an open octagonal ring, two east segments left out as the gap.
(function sheepfold() {
  const fx = WD.x - 4, fz = WD.z + 2, r = 7;
  for (let i = 0; i < 8; i++) {
    if (i === 0 || i === 7) continue;   // the east-facing gap
    const a1 = (i / 8) * Math.PI * 2 - Math.PI / 8, a2 = ((i + 1) / 8) * Math.PI * 2 - Math.PI / 8;
    drystoneRun(fx + Math.cos(a1) * r, fz + Math.sin(a1) * r,
                fx + Math.cos(a2) * r, fz + Math.sin(a2) * r);
  }
})();

// The shepherd's hut — smaller than a house, bigger than a tent: one room,
// a plank door, a turf-dark roof. Solid (collider + camera occluder).
(function hut() {
  const hx = WD.x + 7, hz = WD.z - 3, rot = -.5;
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 3.4), M.wood);
  walls.position.y = 1.3; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.8, 4), M.leafDark);
  roof.position.y = 3.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.9, .15), M.soil);
  door.position.set(0, .95, 1.71); g.add(door);
  g.position.set(hx, groundH(hx, hz), hz); g.rotation.y = rot; scene.add(g);
  addRect(hx, hz, 4.2, 3.4, rot);
  camCollidables.push(g);
})();

// The kept fire — small and outside the door, per Wynn's rule. campfire()
// registers in fires[] so it ramps with darkness like every tended hearth.
campfire(WD.x + 4.5, WD.z + .5);
hayBale(WD.x + 9.5, WD.z + 1); hayBale(WD.x + 10.5, WD.z - .5);
crate(WD.x + 9, WD.z - 5.5, .4); barrel(WD.x + 10, WD.z - 4.5);
signpost(WD.x + 12, WD.z + 5, 1.2);

// A herder's cairn on the rise north of the fold — waymark, not monument.
(function cairn() {
  const cx = WD.x - 2, cz = WD.z - 13;
  for (let i = 0; i < 5; i++) {
    const s = .6 - i * .09;
    const rock = new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * .8, s * 1.4), M.rock);
    rock.position.set(cx + rand(-.08, .08), groundH(cx, cz) + .35 + i * .42, cz + rand(-.08, .08));
    rock.rotation.y = rand(0, Math.PI); rock.castShadow = true; scene.add(rock);
  }
  addCircle(cx, cz, .7);
})();

// The flock — round woolly bodies, dark faces and legs, built local to the
// region (single-region rule, like the Darkwood's darkwolf). Lambs are the
// same mesh at .7 scale. Wander via spawnCritter like all ambient life.
function sheepMesh(scale = 1) {
  const g = new THREE.Group();
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c }));
  const wool = mk(new THREE.SphereGeometry(.55, 8, 7), 0xd8d4c8);
  wool.position.y = .62; wool.scale.set(1, .85, 1.25); wool.castShadow = true; g.add(wool);
  const head = mk(new THREE.BoxGeometry(.3, .3, .38), 0x3a352e);
  head.position.set(0, .72, .72); g.add(head);
  for (const [dx, dz] of [[-.22, .3], [.22, .3], [-.22, -.3], [.22, -.3]]) {
    const leg = mk(new THREE.CylinderGeometry(.05, .05, .4, 5), 0x3a352e);
    leg.position.set(dx, .2, dz); g.add(leg);
  }
  g.scale.setScalar(scale);
  return g;
}
for (let i = 0; i < 7; i++) {
  const a = rand(0, Math.PI * 2), d = rand(3, 12);
  spawnCritter(() => sheepMesh(rand(0, 1) < .3 ? .7 : 1), WD.x - 4 + Math.cos(a) * d, WD.z + 2 + Math.sin(a) * d);
}
// the bellwether — the flock's lead ewe, a shade darker, grazing apart on
// the western rise. Wynn's flavour lines watch her watching the west.
spawnCritter(() => {
  const m = sheepMesh(1.1);
  m.traverse(o => { if (o.isMesh) o.material.color.multiplyScalar(.82); });
  return m;
}, WD.x - 14, WD.z - 2);
// the dog — wolf-shaped but smaller, tan, and off-duty by the fire.
spawnCritter(() => {
  const g = new THREE.Group();
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c }));
  const b = mk(new THREE.BoxGeometry(.45, .42, 1), 0x9a7a4e); b.position.y = .42; b.castShadow = true; g.add(b);
  const h = mk(new THREE.BoxGeometry(.32, .32, .38), 0x8a6a40); h.position.set(0, .66, .62); g.add(h);
  const t = mk(new THREE.BoxGeometry(.1, .1, .45), 0x8a6a40); t.position.set(0, .56, -.65); g.add(t);
  return g;
}, WD.x + 3, WD.z + 2.5);

// Shepherd Wynn — flavour NPC (Bram/Wayfarer/Harrow tier: superstition and
// small omens, per LORE.md). Ties the downs into the realm's economy the way
// Harrow's lines do the farm, and carries the zone's seeded hook sideways.
// Tolly the Lambward — the downs' duelist (the seeded option in this
// module's header, taken one iteration later): a young shepherd drilling
// the herd, minimal footprint at a quiet edge of the fold (Cobb/Kestrel
// pattern — no new structure, no CAMPS change). Wynn stays a flavour NPC
// on purpose: converting them would short-circuit their six lines behind
// the duelist interaction (the known dialogue-priority gap).
export const tolly = spawnDuelist('tolly', WD.x - 12, WD.z + 8, { shirt: 0x7a7464, hat: 0x8a6a3a });

export const wynn = spawnNPC('Shepherd Wynn', WD.x + 2.5, WD.z - 1, { shirt: 0x7a7464, hat: 0x4e4638 });
wynn.flavor = [
  "Mind the fold wall — such as it is. More suggestion than law, but the flock respects it, and that's most of shepherding.",
  "Wool goes to Marla come shearing, and the fine stuff walks to Highgate. Everything walks, out here.",
  "Wolves come west out of the wood, some winters. The dog handles the honest ones.",
  "Quietest work in the realm, sheep. You get to thinking. Then you get to wishing you hadn't.",
  "The bellwether's taken to staring west of an evening. Nothing out there but grass and the world's edge. I'd give good coin to know what she thinks she's looking at.",
  "I keep the fire small, but I keep it. My mother said a dark camp is a borrowed camp. Never did say borrowed from whom.",
];
