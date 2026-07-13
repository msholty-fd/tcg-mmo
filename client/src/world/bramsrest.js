import { campfire, fires, tent, signpost, crate, barrel, spawnNPC, spawnDuelist } from './lib.js';

// ---------- Bram's Rest: wayside stop on the road to Highgate (x=20 z=-70) ----------
// Right at the Boarlands/Darkwood seam (~73 from origin) — the last safe
// fire before the road to Highgate gets dangerous. Addresses DESIGN.md's
// open question on whether that walk reads as a destination or a slog: a
// small, unglamorous rest stop partway through, not another settlement.
// Reuses tent()/campfire()/signpost()/crate()/barrel() from the sections
// above. Old Bram is the first NPC to use the new n.flavor dialogue system
// (interact.js) — a non-duelist who ties earlier landmarks together in
// dialogue. Since Act I of the main quest (shared/quests.js `cold_hearth`,
// LORE.md) he also gives its opening quest; flavor lines return once no
// quest business is pending, as with every giver.

tent(17, -73, .7);
signpost(14, -68, -1.3);    // "back toward Meadowbrook"
signpost(27, -73, 1.9);     // "on to Highgate"
crate(23, -66, .3);
barrel(25, -68);
fires.push(campfire(20, -70));

export const bram = spawnNPC('Old Bram', 18, -71, { shirt: 0x6a5a4a, hat: 0x3a3428 });
bram.flavor = [
  "Sit if you want. Fire's free, my stories aren't — but I tell those free too.",
  "Vex used to run these woods before the west camp took her — good riddance, though she'd spit at hearing me say it.",
  "Gruk's Hollow went quiet after some fool actually beat him. Bones don't lie, they say.",
  "Highgate's not far now — half a day east if your legs are honest with you. Mind Tarn at the gate; he doesn't joke about tolls.",
  "Some nights there's a light out in the northeast ruins. No one tends a fire up there. Make of that what you will.",
  "I used to duel for coin, back when my knees agreed to it. Now I just watch the road and mind the fire.",
  "Feed the fire, friend. I mean it. Every night, without fail.",
];

export const footpad = spawnDuelist('footpad', 25, -74, { shirt: 0x7a2a2a, hat: 0x2a2a2a });
