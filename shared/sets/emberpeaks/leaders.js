// Emberpeaks champions — merged into the global roster by core/leaders.js.
// Both are marquee cards (the fire set has no self-named boss card), each
// already in an Emberpeaks duelist's reward pool (emberpeaks/duelists.js):
//   ep_obsidian_golem ← Ashmonger Cael (and Ignarok)
//   ep_cinderwyrm     ← Ignarok, the Pyrelord
// Banner id 'emberpeaks_fire' is defined in emberpeaks/families.js.
export const EMBERPEAKS_LEADERS = {
  // The lesser guardian's champion — splashable fire behind a wall.
  ep_obsidian_golem: { banner: 'emberpeaks_fire', constraints: [{ kind: 'minBanner', n: 8 }] },
  // Ignarok's Cinderwyrm — all-in mono-fire devotion, the zone-boss finisher.
  ep_cinderwyrm:     { banner: 'emberpeaks_fire', constraints: [{ kind: 'minBanner', n: 12 }] },
};
