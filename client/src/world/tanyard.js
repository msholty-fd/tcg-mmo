// The Tanyard (DESIGN.md, 2026-07-17): a tanner's yard on the west-central
// grass at (-97,5) — the realm's LAST unclaimed craft archetype. The
// two-axis survey: with the craft economy otherwise complete (farm/flock/
// fish/honey/stone/charcoal/cloth/clay/iron) and both big standing threads
// closed, LEATHER was the one hole — every boot, belt, strap, tent-hide, and
// book-binding in the realm is leather, and nothing tanned it. The Tanyard
// retro-explains the realm's leather the way the Kilnyard did its crockery
// and the Forge its iron. Sited here (not the crowded mid-west) for room and
// grounding: it's off the West Road that carts Wynn's flock, in the western
// hide-country, removed from town as a reeking tanyard should be.
// Sited by the numeric flat-scan (tannery-scan): flattest r=14 disc in the
// west-central gap (center h 4.67, max deviation 0.50 within r=14 — under
// the quarry's 0.65), zero terrain edits; edge clearance 35 to the nearest
// zone (Wether Downs / Red-Sash), far past the ~9 precedent.
// LORE relationship to the fire: TENDED, but WARY — a small fire kept at the
// yard's downwind edge, well away from the oils and the drying hides ("flame
// and cured hide don't mix; I keep my hearth small and downwind"). A fresh
// register: the one craft yard whose fire is held at arm's length from its
// own work.
// Seeded doors (DESIGN.md/LORE.md, do not answer here): the leather that
// never wears out (folk bring their oldest boots back to be buried, not
// mended), and the tanyard that has never once stunk.
// New geometry gets its own palette (the Hollowmere/Pell rule): murky
// tanning-liquor browns and pale lime pits, distinct from the bright farm
// soil and the pond's slate.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { rand } from '../utils.js';
import { addCircle, addRect } from '../colliders.js';
import { M, camCollidables, campfire, fires, crate, barrel, signpost, spawnNPC } from './lib.js';

const T = { x: -97, z: 5 };   // heart (shared/zones.js CAMPS r=14)

// The yard's own palette: dark oak-bark tanning liquor, pale milky lime,
// warm finished leather — distinct from the farmstead's soil and crop.
const M_TAN     = new THREE.MeshLambertMaterial({ color: 0x4a2f1c });   // tanning-liquor pit
const M_LIME    = new THREE.MeshLambertMaterial({ color: 0x8a8474 });   // lime/soaking pit
const M_LEATHER = new THREE.MeshLambertMaterial({ color: 0x9a6a3e });   // finished leather
const M_BARK    = new THREE.MeshLambertMaterial({ color: 0x5a4028 });   // oak-bark tannin

// ---------- the pits: rows of soaking/tanning liquor, flush + walkable ----------
// Authored from props (the Kilnyard clay-pit technique) — shallow discs of
// liquor set just above the sampled ground, no collider (a tanyard you can
// step to the edge of). Lime pits pale, tanning pits dark.
function pit(dx, dz, r, mat) {
  const px = T.x + dx, pz = T.z + dz;
  const h = Math.max(groundH(px, pz), groundH(px - r, pz), groundH(px + r, pz), groundH(px, pz - r), groundH(px, pz + r));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .18, 5, 14), M.soil);
  rim.rotation.x = Math.PI / 2; rim.position.set(px, h + .04, pz); scene.add(rim);
  const liquor = new THREE.Mesh(new THREE.CircleGeometry(r, 14), mat);
  liquor.rotation.x = -Math.PI / 2; liquor.position.set(px, h + .06, pz); liquor.receiveShadow = true; scene.add(liquor);
}
pit(-6, 2, 1.9, M_LIME); pit(-6, -2.4, 1.9, M_LIME);          // soaking/liming pits
pit(-1.5, 2.2, 2.1, M_TAN); pit(-1.5, -2.6, 2.1, M_TAN); pit(2.8, .2, 2.0, M_TAN);  // tanning pits

// ---------- stretching frames: hides pulled taut to dry ----------
function stretchFrame(dx, dz, rot) {
  const fx = T.x + dx, fz = T.z + dz;
  const g = new THREE.Group();
  for (const px of [-1.4, 1.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.1, .13, 2.4, 6), M.wood);
    post.position.set(px, 1.2, 0); post.castShadow = true; g.add(post);
  }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3.0, 6), M.wood);
  top.rotation.z = Math.PI / 2; top.position.y = 2.3; g.add(top);
  // the hide, stretched — a slightly irregular panel
  const hide = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.7, .06), M.hide);
  hide.position.y = 1.35; hide.rotation.z = rand(-.03, .03); hide.castShadow = true; g.add(hide);
  g.position.set(fx, groundH(fx, fz), fz); g.rotation.y = rot; scene.add(g);
  addRect(fx, fz, 3.0, .5, rot);
}
stretchFrame(6, 3.5, .3); stretchFrame(7.2, 0, .1); stretchFrame(6.3, -3.6, -.25);

// ---------- the scraping beam: a curved log over which hides are worked ----------
(function beam() {
  const bx = T.x + 3.2, bz = T.z + 4.2;
  const g = new THREE.Group();
  const log = new THREE.Mesh(new THREE.CylinderGeometry(.4, .42, 2.4, 10), M.wood);
  log.rotation.z = Math.PI / 2; log.position.y = .9; g.add(log);
  for (const lx of [-.9, .9]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, .95, 5), M.wood);
    leg.position.set(lx, .45, .3); leg.rotation.x = .3; g.add(leg);
  }
  // a half-scraped hide draped over it, and a scraper
  const draped = new THREE.Mesh(new THREE.BoxGeometry(1.4, .05, 1.6), M.hide);
  draped.position.set(0, 1.12, 0); draped.rotation.x = .2; g.add(draped);
  const scraper = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .16), M.metal);
  scraper.position.set(.2, 1.2, .5); scraper.rotation.y = .4; g.add(scraper);
  g.position.set(bx, groundH(bx, bz), bz); g.rotation.y = -.5; scene.add(g);
  addCircle(bx, bz, .8);
})();

// ---------- oak-bark heaps: the tannin, and rolled finished leather ----------
for (const [dx, dz, s] of [[-9, 5, 1.1], [-10, 1.5, .9]]) {
  const hx = T.x + dx, hz = T.z + dz;
  const heap = new THREE.Mesh(new THREE.ConeGeometry(s, s * .9, 7), M_BARK);
  heap.position.set(hx, groundH(hx, hz) + s * .4, hz); heap.castShadow = true; scene.add(heap);
  addCircle(hx, hz, s * .8);
}
(function leatherRolls() {
  const sx = T.x - 8, sz = T.z - 3;
  const g = new THREE.Group();
  for (const [dx, dy, dz] of [[0, .35, 0], [.75, .35, .1], [.35, 1.0, .05]]) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 1.3, 10), M_LEATHER);
    roll.rotation.z = Math.PI / 2; roll.position.set(dx, dy, dz); roll.castShadow = true; g.add(roll);
  }
  g.position.set(sx, groundH(sx, sz), sz); g.rotation.y = .4; scene.add(g);
  addCircle(sx + .35, sz + .05, 1.0);
})();

// ---------- the tanner's shed (Wether Downs hut pattern verbatim) ----------
(function hut() {
  const hx = T.x - 4, hz = T.z + 8, rot = Math.PI - .12;   // north backdrop, door south into the yard
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 3.4), M.wood);
  walls.position.y = 1.3; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.8, 4), M.leafDark);
  roof.position.y = 3.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.9, .15), M.soil);
  door.position.set(0, .95, 1.71); g.add(door);
  // hides hung to air along the eave
  for (const px of [-1.3, 0, 1.3]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.2, .05), M.hide);
    h.position.set(px, 1.5, 1.8); h.rotation.z = rand(-.04, .04); g.add(h);
  }
  g.position.set(hx, groundH(hx, hz), hz); g.rotation.y = rot; scene.add(g);
  addRect(hx, hz, 4.2, 3.4, rot);
  camCollidables.push(g);
})();

// Corb's small fire — TENDED but WARY, held at the yard's downwind (east)
// edge, well away from the pits and the drying hides. Explicit fires.push so
// the flame animates (campfire() does not self-register; the 0992af6 lesson).
fires.push(campfire(T.x + 10, T.z - 5));

crate(T.x - 6, T.z + 6, .5); barrel(T.x - 4.5, T.z + 5.5);
signpost(T.x + 12, T.z + 3, -1.9);   // greets the walk-in from the West Road, east

// ---------- Corb the Tanner — flavour NPC (small omens tier, LORE.md) ----------
// Closes the realm's craft economy: hides in (Wynn's flock, the east's
// boars, the wood's game), leather out (every boot, belt, strap, and
// binding). Ties to Wynn (fleece to Ede, hide to Corb — the same beast, two
// trades) and carries the yard's two seeded doors sideways, unexplained.
// Stands between the tanning pits and the frames; nearest colliders: beam
// ~2.9, frame ~3.4, leather rolls ~4 (labels stay clear).
export const corb = spawnNPC('Corb the Tanner', T.x - 2.5, T.z - .5, { shirt: 0x6a4a30, hat: 0x4a3320 });
corb.flavor = [
  "Same sheep gives Wynn her fleece and me her hide — she gets the warm half, I get the lasting half. Every boot between here and Highgate started on one of my frames.",
  "Bark, piss, and patience — that's the whole trade, and I'll thank you not to ask which pit's which. A hide takes a year in the liquor and comes out able to turn a season of rain.",
  "Boar hide off the east for the hard-wearing work, sheep and deer for the soft. Gruk's crew sell me skins and pretend they don't. A boar's meaner cured than it ever was alive.",
  "I keep my fire small and downwind, over there. Flame and a shed full of oil-cured hide have exactly one conversation, and it's a short one. You learn that lesson once.",
  "Leather I cure doesn't wear out. That's not a boast — it's a nuisance. Folk bring me their grandfather's boots to be BURIED, not mended, because they'll outlast the grandchildren too.",
  "A tanyard should reek to the treeline — everyone says so, holding their nose before they've even arrived. Mine never has. Not once, not a whiff. My master swore it was the bark. I've tried every bark there is.",
];
