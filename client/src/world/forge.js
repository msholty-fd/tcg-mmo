// Bryn's Forge (DESIGN.md, 2026-07-17): a smith's forge on the north-central
// upland grass at (46,86) — between the village, the Emberwatch road, and
// the north road to the delvings. The two-axis survey's archetype find:
// METALWORK, the realm's last unclaimed craft. Iron is everywhere — the
// gilded bands and arrows on every waystone, Hobb's chisels, the anvil in
// the village smithy, every hinge and nail — and no one was named who works
// it. Bryn's Forge retro-explains the realm's ironwork the way the Kilnyard
// did its crockery, the Loomstead its cloth, the quarry its waystones.
// Sited by the numeric scan (forge-scan): flattest r=10 disc in the gap
// (center h -2.18, max deviation 0.55 within r=10 — Loomstead precedent
// 0.59), zero terrain edits; clearances — Emberwatch 39.8, Loomstead 41.3,
// mine 49.5, off the north road 51.7 and finch's patrol 26.9 (a findable
// upland landmark; earned its road at iteration 26 — worn_edges gave it
// business at 25 — a spur forks north off the Emberwatch road to the
// south-edge stone, roads.js). A Forge duelist stays seeded for the next
// duelists.js window (the quarry/Loomstead cascade).
// LORE relationship to the fire: TENDED — and the THIRD distinct tended
// register: Ede's dye fire is a held breath, Fern's kiln is shut and
// trusted dark, Bryn's forge is the hungriest hearth in the realm, roared
// white with the bellows and never let to sleep.
// Seeded doors (DESIGN.md/LORE.md, do not answer here): the shoes she has
// forged three times that keep turning up back on her anvil, and the iron
// bar-stock that arrives stacked at her door on nobody's cart.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, fires, crate, barrel, signpost, spawnNPC } from './lib.js';

const F = { x: 46, z: 86 };   // heart (shared/zones.js CAMPS r=16)

// Soot-blacked stone and forge-glow against the grey outcrop — the yard's
// own palette (the Hollowmere/Pell/Loomstead/Kilnyard rule: new ground
// reads as itself, here warmer and sootier than Hobb's cold stone-grey).
const M_SOOT  = new THREE.MeshLambertMaterial({ color: 0x2b2723 });
const M_GLOW  = new THREE.MeshLambertMaterial({ color: 0xff7a20, emissive: 0xdd4400 });
const M_HOTIRON = new THREE.MeshLambertMaterial({ color: 0xc25a2a, emissive: 0x6a2400 });

// ---------- the forge hearth: the signature prop ----------
// A waist-high stone hearth with a raised chimney hood, the charcoal fire
// glowing in its mouth and a bellows lashed to its flank. The group carries
// userData.fire and registers in fires[] so the fire flickers like every
// tended hearth (the contract campfire() fulfills; this forge IS the yard's
// campfire — the loudest one in the realm).
(function hearth() {
  const hx = F.x - 1, hz = F.z + 1;
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.8), M_SOOT);
  base.position.y = .55; base.castShadow = true; base.receiveShadow = true; g.add(base);
  // the fire-bed: glowing coals in a shallow well on top
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, .18, 1.1), M_GLOW);
  bed.position.y = 1.15; g.add(bed);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(.42, .9, 6), M_GLOW);
  fire.position.y = 1.5; g.add(fire); g.userData.fire = fire;
  const light = new THREE.PointLight(0xff8830, 1.2, 15); light.position.set(0, 1.7, 0); g.add(light);
  // chimney hood rising off the back edge
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(.32, .9, 2.2, 6), M_SOOT);
  hood.position.set(0, 2.7, -.5); hood.castShadow = true; g.add(hood);
  // the bellows on the near flank — two boards and a nozzle
  const bel1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, .1, .7), M.wood);
  bel1.position.set(1.5, .95, .3); bel1.rotation.z = .12; g.add(bel1);
  const bel2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, .1, .7), M.hide);
  bel2.position.set(1.5, .72, .3); bel2.rotation.z = -.05; g.add(bel2);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, .8, 5), M.ironBand);
  nozzle.rotation.z = Math.PI / 2; nozzle.position.set(.7, .9, .3); g.add(nozzle);
  g.position.set(hx, groundH(hx, hz), hz); scene.add(g);
  addRect(hx, hz, 2.4, 1.8, 0);
  addCircle(hx + 1.5, hz + .3, .8);   // the bellows
  fires.push(g);   // explicit registration — the flame animates (0992af6)
})();

// ---------- the anvil on its stump, hammer resting ----------
(function anvil() {
  const ax = F.x + 2.5, az = F.z - .5;
  const g = new THREE.Group();
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, .8, 9), M.wood);
  stump.position.y = .4; stump.castShadow = true; g.add(stump);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.9, .3, .45), M.metal);
  body.position.y = .95; body.castShadow = true; g.add(body);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(.14, .5, 6), M.metal);
  horn.rotation.z = -Math.PI / 2; horn.position.set(.6, 1.0, 0); g.add(horn);
  const waist = new THREE.Mesh(new THREE.BoxGeometry(.4, .2, .3), M.metal);
  waist.position.y = .78; g.add(waist);
  // a hot bar resting across the face — the piece in work
  const work = new THREE.Mesh(new THREE.BoxGeometry(.7, .05, .07), M_HOTIRON);
  work.position.set(-.15, 1.13, 0); work.rotation.y = .3; g.add(work);
  // hammer leaning on the stump
  const haft = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .8, 5), M.wood);
  haft.position.set(.45, .55, .3); haft.rotation.z = .55; g.add(haft);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.22, .12, .12), M.metal);
  head.position.set(.72, .87, .3); g.add(head);
  g.position.set(ax, groundH(ax, az), az); g.rotation.y = -.4; scene.add(g);
  addCircle(ax, az, .6);
})();

// ---------- the slack tub: a half-barrel of quench water ----------
(function slackTub() {
  const tx = F.x + 3.4, tz = F.z + 1.6;
  const g = new THREE.Group();
  const tub = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .8, 10), M.wood);
  tub.position.y = .4; tub.castShadow = true; g.add(tub);
  for (const dy of [.2, .68]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(.57, .04, 5, 12), M.ironBand);
    band.rotation.x = Math.PI / 2; band.position.y = dy; g.add(band);
  }
  const water = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .05, 10),
    new THREE.MeshLambertMaterial({ color: 0x2f3a3e }));
  water.position.y = .78; g.add(water);
  g.position.set(tx, groundH(tx, tz), tz); scene.add(g);
  addCircle(tx, tz, .65);
})();

// ---------- finished-work rack: the realm's iron, retro-explained ----------
// A leaning frame hung with the shapes the whole realm carries — a gilded
// waystone band (the roads' own mark), horseshoes, hinges, a chisel, a
// hook. This is the zone's read: "so THIS is where all that came from."
(function workRack() {
  const rx = F.x - 4.5, rz = F.z - 1, rot = .5;
  const g = new THREE.Group();
  for (const px of [-1.4, 1.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.2, 5), M.wood);
    post.position.set(px, 1.1, 0); post.castShadow = true; g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 3, 5), M.wood);
  bar.rotation.z = Math.PI / 2; bar.position.y = 2.0; g.add(bar);
  // a gilded waystone band (roads.js's gold, the realm's signature mark)
  const band = new THREE.Mesh(new THREE.TorusGeometry(.28, .05, 6, 14), M.gold);
  band.position.set(-1.0, 1.5, 0); g.add(band);
  // horseshoes
  for (const [px, py] of [[-.3, 1.55], [-.1, 1.35], [.1, 1.6]]) {
    const shoe = new THREE.Mesh(new THREE.TorusGeometry(.16, .045, 5, 10, Math.PI * 1.4), M.metal);
    shoe.position.set(px, py, 0); shoe.rotation.z = rand(0, 6); g.add(shoe);
  }
  // hinges + a chisel + a hook
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(.34, .18, .05), M.ironBand);
  hinge.position.set(.7, 1.5, 0); g.add(hinge);
  const chisel = new THREE.Mesh(new THREE.CylinderGeometry(.03, .05, .4, 5), M.metal);
  chisel.position.set(1.05, 1.45, 0); g.add(chisel);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.1, .03, 5, 8, Math.PI * 1.3), M.ironBand);
  hook.position.set(1.25, 1.6, 0); g.add(hook);
  g.position.set(rx, groundH(rx, rz), rz); g.rotation.y = rot; scene.add(g);
  addRect(rx, rz, 3, .5, rot);
})();

// ---------- charcoal heap: Tamsin's charcoal, the fuel ----------
(function charcoal() {
  const cx = F.x - 3, cz = F.z + 3.5;
  const heap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.0, 8), M.charred);
  heap.position.set(cx, groundH(cx, cz) + .4, cz); heap.castShadow = true; scene.add(heap);
  // a few loose lumps at the base (flat clutter, no collider)
  for (let i = 0; i < 6; i++) {
    const lump = new THREE.Mesh(new THREE.TetrahedronGeometry(rand(.1, .2)), M.charred);
    lump.position.set(cx + rand(-1.4, 1.4), groundH(cx, cz) + .1, cz + rand(-1.4, 1.4));
    lump.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6)); scene.add(lump);
  }
  addCircle(cx, cz, 1.35);
})();

// ---------- iron bar-stock leaning in a rack (the seeded-supply door) ----------
(function barStock() {
  const bx = F.x + 4.5, bz = F.z - 2;
  const g = new THREE.Group();
  const cradle = new THREE.Mesh(new THREE.BoxGeometry(1.4, .3, .3), M.wood);
  cradle.position.y = .5; g.add(cradle);
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, 2.2), M.ironBand);
    bar.position.set(-.5 + i * .22, .95 + i * .02, 0); bar.rotation.x = .32;
    bar.rotation.z = rand(-.05, .05); g.add(bar);
  }
  g.position.set(bx, groundH(bx, bz), bz); g.rotation.y = .8; scene.add(g);
  addCircle(bx, bz, .7);
})();

// ---------- grindstone: a foot-cranked sharpening wheel ----------
(function grindstone() {
  const gx = F.x - 5.5, gz = F.z + 3;
  const g = new THREE.Group();
  for (const px of [-.5, .5]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.0, .12), M.wood);
    leg.position.set(px, .5, 0); g.add(leg);
  }
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .14, 14), M.rock);
  wheel.rotation.x = Math.PI / 2; wheel.position.y = 1.0; g.add(wheel);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .7, 5), M.ironBand);
  axle.rotation.x = Math.PI / 2; axle.position.y = 1.0; g.add(axle);
  g.position.set(gx, groundH(gx, gz), gz); scene.add(g);
  addCircle(gx, gz, .7);
})();

// ---------- the smith's hut (Wether Downs pattern verbatim) ----------
(function hut() {
  const hx = F.x + .5, hz = F.z + 7, rot = Math.PI + .12;   // north backdrop, door south into the yard
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

crate(F.x - 6.5, F.z + 5.5, .3); barrel(F.x - 5.5, F.z + 6.2);
signpost(F.x - 9, F.z + 1, -1.9);   // greets the walk-in from the village side (southwest)

// ---------- Smith Bryn — flavour NPC (small omens tier, LORE.md) ----------
// Ties iron into the economy end-to-end (Tamsin's charcoal in, the realm's
// ironwork out — waystone bands, Hobb's chisels, every hinge and shoe) and
// carries the yard's two seeded doors sideways, unexplained. Stands between
// the anvil and the hearth; nearest colliders: anvil 1.9, hearth ~2.6,
// slack tub ~2.8 (labels stay clear).
export const bryn = spawnNPC('Smith Bryn', F.x + 1, F.z - .5, { shirt: 0x4a3f38, hat: 0x2e2824 });
bryn.flavor = [
  "Every gilded band on every waystone, every chisel in Hobb's fist, every hinge on every door between here and Highgate — came off this anvil, or one I taught. There's just the one anvil, mind.",
  "Tamsin's charcoal burns hottest, and I'll forge with nothing else. I've told her so to her face, which she pretends is a bother and isn't.",
  "A forge is the hungriest hearth there is. Feed it, or it sulks; feed it right and it'll bend you anything you ask. Same as most things, if you're honest.",
  "Iron doesn't lie. Heat it, watch the color, strike when it's right — too soon and it cracks, too late and you've wasted the heat. The whole trade's in the waiting.",
  "I've shod a certain grey mare three times now. Nail them on sound of an evening — and come morning the shoes are back on my anvil, cold, and the mare barefoot in her field. I've stopped charging for it.",
  "The bar-iron comes stacked at my door of a morning, more than I ordered and nobody's cart-tracks in the dew. I used to sit up to catch who left it. Now I just thank the dark and get to work.",
];
