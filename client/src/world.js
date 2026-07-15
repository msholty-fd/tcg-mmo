// world.js is now a barrel over per-region authoring modules (DESIGN.md
// "world.js per-region split", 2026-07-13): every import site keeps using
// './world.js' unchanged. world/lib.js holds shared materials, builders, and
// the cross-region registries; each region module builds one place. Order
// below is the original monolith's authoring order — registration order
// matters to nothing (colliders/npcs/critters are order-independent
// registries), but keep it stable anyway.
//
// Adding a region: create world/<region>.js building on world/lib.js,
// import/re-export it here, and keep world-spanning systems (flora bands,
// roads/patrols) in their own modules rather than inside a region.
export { M, camCollidables, fires, torches, tree, campfire, torch, tent, banner, crate, barrel,
         tavern, marketStall, hayBale, shrine, signpost, wallSeg, watchtower,
         spawnCritter, spawnNPC, spawnDuelist, DUELISTS, VILLAGER_SHIRTS } from './world/lib.js';
export { marla, aldric, rowan, maren } from './world/village.js';
import './world/wilds.js';
export { vex, kestrel } from './world/redsash.js';
export { grukNpc } from './world/gruk.js';
export { yara, verity, tarn, sela } from './world/highgate.js';
export { sentinel } from './world/emberwatch.js';
export { bram, footpad } from './world/bramsrest.js';
export { hessa, updateHollowmere } from './world/hollowmere.js';
export { wayfarer, sorrel, finch, brenna, nell, updatePatrols } from './world/roads.js';
export { harrow, cobb } from './world/harrowfield.js';
export { wynn, tolly } from './world/wetherdowns.js';
export { pell } from './world/pellspond.js';
export { odo } from './world/beemeads.js';
export { merle } from './world/dialstone.js';
export { updateDarkwood, tamsin, weir, rusk } from './world/darkwood.js';
export { marrow } from './world/mine.js';
export { halvard, ashmonger, pyrelord, varn } from './world/emberpeaks.js';
