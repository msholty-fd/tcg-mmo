// The realm's road network: waystones, the Wayfarer, the route-trainer road
// duelists, and their realm-synced patrols.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { groundH } from '../terrain.js';
import { addCircle, resolveCollision } from '../colliders.js';
import { M, spawnNPC, spawnDuelist } from './lib.js';

// ---------- Waystones: the realm's road markers (DESIGN.md) ----------
// The world had grown into scattered points (village, camps, Highgate,
// ruins, swamp) with nothing tying them together — this is the connective
// tissue. Carved standing stones along the routes outward from the village,
// each with a gilded arrow pointing toward the place it marks the way to, so
// following the stones reads as travelling a connected realm rather than
// wandering between islands. Directly targets DESIGN.md's open question on
// whether the long walks feel like a slog: waymarkers give a walk direction
// and progress-legibility. Deliberately card-light — pure cosmetic props
// (like signposts/rocks) plus one flavour NPC, no new duelist/cards.
//
// A waystone sits at its own groundH (each is an independent 3D object, not a
// terrain-hugging decal), so there's no floating/z-fighting on slopes. The
// arrow's facing is computed from the stone's position toward its target:
// with THREE's rotation.y convention here, local +Z maps to world direction
// (sin rot, cos rot), so rot = atan2(dx-x, dz-z) aims local +Z at the target.

function waystone(x, z, tx, tz, scale = 1) {
  const g = new THREE.Group();
  const rot = Math.atan2(tx - x, tz - z);   // face local +Z toward (tx,tz)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.32 * scale, .5 * scale, 2.2 * scale, 5), M.waystone);
  shaft.position.y = 1.1 * scale; shaft.castShadow = true; g.add(shaft);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.44 * scale, .38 * scale, .28 * scale, 5), M.waystone);
  cap.position.y = 2.3 * scale; cap.castShadow = true; g.add(cap);
  // gilded band + arrow — marks it as an official roadmarker, not rubble
  const band = new THREE.Mesh(new THREE.TorusGeometry(.4 * scale, .05 * scale, 5, 12), M.gold);
  band.rotation.x = Math.PI / 2; band.position.y = 1.7 * scale; g.add(band);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.2 * scale, .45 * scale, 4), M.gold);
  arrow.rotation.x = Math.PI / 2;   // tip toward local +Z
  arrow.position.set(0, 1.7 * scale, .55 * scale); g.add(arrow);
  g.position.set(x, groundH(x, z), z); g.rotation.y = rot; scene.add(g);
  addCircle(x, z, .5 * scale);
}

// Coordinates of the places the roads lead (kept local — these mirror the
// spawn positions above and the CAMPS entries in constants.js).
const DEST = {
  highgate:  [40, -145],
  hollowmere:[-100, -90],
  emberwatch:[100, 100],
  gruk:      [107, -60],
  redsash:   [-90, 64],
  cinderpass:[0, 158],
  darkwood:  [118, -115],
  village:   [0, 0],
  wetherdowns:[-150, -10],
  pellspond: [-141, 58],
};

// A hub crossroads just south of the village where the roads diverge, then
// stepping-stones stepping outward along each route toward its destination.
const CROSSROADS = [7, -30];
waystone(CROSSROADS[0], CROSSROADS[1], ...DEST.highgate, 1.35);   // tall central marker
// toward Highgate (south) — reinforces the Bram's Rest road
waystone(14, -52, ...DEST.highgate);
waystone(30, -112, ...DEST.highgate);
// toward Hollowmere (southwest)
waystone(-24, -44, ...DEST.hollowmere);
waystone(-62, -72, ...DEST.hollowmere);
// toward Emberwatch Ruins (northeast)
waystone(40, 42, ...DEST.emberwatch);
waystone(74, 78, ...DEST.emberwatch);
// toward Gruk's Hollow (east)
waystone(56, -36, ...DEST.gruk);
// toward the Red-Sash Camp (northwest)
waystone(-46, 38, ...DEST.redsash);
// toward Cinderpass & the Emberpeaks (far north) — a marked route so the
// zone is findable, not a hill you stumble over (playtest feedback)
waystone(2, 34, ...DEST.cinderpass);
waystone(-8, 96, ...DEST.cinderpass);
waystone(-4, 134, ...DEST.cinderpass);   // last marker before the pass, near the mine
// the Darkwood road: the first route that connects two OUTER places rather
// than radiating from the village — Gruk's Hollow south through the Deep
// Darkwood heart, then on west to Highgate's gate (world/darkwood.js keeps
// its flora out of this corridor; keep the two in sync via ROAD there)
waystone(111, -80, ...DEST.darkwood);
waystone(115, -98, ...DEST.darkwood);
waystone(118, -115, ...DEST.highgate, 1.2);   // heart marker, by the stone circle
waystone(95, -113, ...DEST.highgate);
waystone(68, -110, ...DEST.highgate);
// the West Road (2026-07-15, worldbuilding iteration 9 — DESIGN.md): the
// downs rule — "a flavour landmark earns a route when it earns content" —
// has now fired for BOTH western landmarks (the Wether Downs got Tolly, the
// pond got Dace), so one route serves both: due west from the crossroads to
// the downs, then the stones bend north along the realm's western edge to
// Pell's Pond. The downs-edge marker is the onward pointer (Darkwood
// heart-marker precedent) — the realm's second outer-to-outer road, so each
// landmark teaches the other exists. The Bee Meads stays roadless on
// purpose: same rule, no business there yet.
waystone(-34, -22, ...DEST.wetherdowns);
waystone(-76, -17, ...DEST.wetherdowns);
waystone(-114, -13, ...DEST.wetherdowns);
waystone(-147, 8, ...DEST.pellspond, 1.2);   // downs-edge marker, pointing on north
waystone(-145, 33, ...DEST.pellspond);

// The Wayfarer — a roaming teller who keeps the roads' stories, stationed at
// the crossroads hub. First flavour NPC placed out in the Boarlands rather
// than inside a settlement; its lines name each waystone's destination so a
// new player reads the crossroads as "roads go HERE, and HERE" instead of
// just decoration. Reuses the n.flavor system (interact.js), no quest/duel.
export const wayfarer = spawnNPC('The Wayfarer', CROSSROADS[0] + 2, CROSSROADS[1] + 1, { shirt: 0x4a5a7a, hat: 0x6a5a3a });
wayfarer.flavor = [
  "Every stone's an arrow, friend. Follow the gilded marks and no road in the realm stays a stranger.",
  "South road's the long one — Bram's fire first, then Highgate's walls past the tree line. Mind Tarn at the gate.",
  "West-and-south the ground goes soft: Hollowmere, where Old Hessa deals cards to the dead. Bring dry boots.",
  "Northeast the markers thin out. There's a ruin that lights itself after dark — I don't follow that road at night, and neither should you.",
  "East for Gruk's bones, northwest for the Red-Sash. Both roads end in a duel; that's the realm for you.",
  "West's the newest road — Wynn's downs first, then the stones bend north for Pell's water. Sheep, then fish. Even the quiet end of the realm wants finding.",
  "I don't duel, I don't trade. I just walk the roads and remember who's on them. Someone has to.",
  "Roads remember feet the way fires remember faces — that's what my mother said. I keep walking so something remembers me.",
];

// ---------- Road duelists: route trainers (DESIGN.md, 2026-07-13) ----------
// Every duel so far lives at a destination (village, camps, Highgate, ruins);
// the roads between them are legible (waystones) but inert. These three are
// the Pokémon-route-trainer answer: minor duelists standing ON the routes
// that had nobody — Gruk road E, Emberwatch road NE, Hollowmere road SW.
// (South/Highgate has the footpad at Bram's Rest; north/Cinderpass passes
// Marrow's mine — those routes already have someone.) Player-initiated like
// every duelist; they never approach or auto-challenge. The spawn coords are
// just the patrol midpoints — updatePatrols() below owns their position from
// the first frame.
export const sorrel = spawnDuelist('sorrel', 62, -40, { shirt: 0x7a5a34, hat: 0x4a3620 });
export const finch = spawnDuelist('finch', 58, 60, { shirt: 0x9a4030, hat: 0x30302a });
export const brenna = spawnDuelist('brenna', -44, -58, { shirt: 0x4a5a6a, hat: 0x3a3228 });

// Road duelists PATROL their routes, and the realm agrees where they are:
// position is a pure function of the server-synced game hour (the same
// shared clock that drives the sky — welcome + 10 Hz state broadcasts, local
// advance between syncs), NOT per-client randomness like critter wander. No
// NPC positions cross the wire; every client computes the identical spot,
// and a player logging in mid-walk lands on the same timeline as everyone
// else. Offline mode uses the local clock fallback — solo, so no one to
// disagree with. Ping-pong along a road polyline once per PATROL_PERIOD
// game hours (divides 24, so the midnight wrap is seamless), with a short
// stand at each end so they're easy to walk up to and challenge. The
// resolveCollision safety push-out is deterministic over the static
// collider registry, so it can't diverge between clients either.
const PATROLS = [
  // paths must stay CLEAR of colliders (incl. the waystones' own r=.5
  // circles) — a path through one makes the push-out flip sides as the
  // sweep crosses it: a teleport, twice per loop (caught live on sorrel)
  { npc: sorrel, path: [[40, -26], [57, -33], [76, -46]] },     // Gruk road, past its waystone
  { npc: finch, path: [[44, 46], [58, 60], [72, 74]] },         // Emberwatch road, between its waystones
  { npc: brenna, path: [[-30, -48], [-44, -58], [-58, -68]] },  // Hollowmere road, between its waystones
];
const PATROL_PERIOD = 1;   // game hours per out-and-back (= 50 real seconds)
for (const p of PATROLS) {
  p.legs = []; p.total = 0;
  for (let i = 1; i < p.path.length; i++) {
    const [ax, az] = p.path[i - 1], [bx, bz] = p.path[i];
    const len = Math.hypot(bx - ax, bz - az);
    p.legs.push({ ax, az, bx, bz, len, start: p.total });   // start: cumulative distance to this leg
    p.total += len;
  }
}
// remap each half-loop so ~8% of it (≈2s real) is spent standing at the ends
const dwell = q => Math.min(1, Math.max(0, (q - .08) / .84));

export function updatePatrols(hour) {
  for (const p of PATROLS) {
    const s = ((hour % PATROL_PERIOD) + PATROL_PERIOD) % PATROL_PERIOD / PATROL_PERIOD;
    const forward = s < .5;
    const u = forward ? dwell(s * 2) : dwell(2 - s * 2);   // 0..1 along the path
    // cumulative leg starts + clamped t: float drift past the last boundary
    // pins to the far end instead of snapping back to the leg's start
    const dist = u * p.total;
    let leg = p.legs[p.legs.length - 1];
    for (const l of p.legs) if (dist <= l.start + l.len) { leg = l; break; }
    const t = Math.min(Math.max((dist - leg.start) / leg.len, 0), 1);
    let x = leg.ax + (leg.bx - leg.ax) * t, z = leg.az + (leg.bz - leg.az) * t;
    ({ x, z } = resolveCollision(x, z, .5));
    const n = p.npc;
    n.x = x; n.z = z;
    n.mesh.position.set(x, groundH(x, z), z);
    n.mesh.rotation.y = Math.atan2(leg.bx - leg.ax, leg.bz - leg.az) + (forward ? 0 : Math.PI);
  }
}
