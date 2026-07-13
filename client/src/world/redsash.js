import { campfire, fires, tent, banner, crate, barrel, spawnDuelist } from './lib.js';

// ---------- Vex's Red-Sash camp (western woods, x=-88 z=66) ----------
// A crude bandit camp: lean-to tents, a red-sash banner, scattered
// crates/barrels. Reuses the campfires already placed at (-92,62)/(-86,70).


fires.push(campfire(-92, 62), campfire(-86, 70));

tent(-97, 63, .6);
tent(-80, 72, -1.1, 1.15);
banner(-85, 61, .3);
crate(-90, 58, .4); crate(-83, 68, -.5); crate(-95, 70, .2);
barrel(-79, 62); barrel(-93, 75);

export const vex = spawnDuelist('vex', -88, 66, { shirt: 0xa03a3a, hat: 0x2a2a2a });

// Kestrel Twinstrike (DESIGN.md) — a second Red-Sash duelist, stationed at a
// quiet corner of Vex's own camp (away from her tents/banner/crates, still
// well within the "Red-Sash Camp" CAMPS radius) rather than a new landmark.
// Drills the crew's Frenzy half of the Red-Sash tagline while Vex runs the
// Ambush side.
export const kestrel = spawnDuelist('kestrel', -100, 58, { shirt: 0x8a3030, hat: 0x402020 });
