// Leveling math — used by the server to apply XP and by the client to draw
// the XP bar.

export const xpNeed = lvl => 100 + (lvl - 1) * 85;

// Mutates profile {xp, lvl}. Returns the number of levels gained.
export function applyXP(profile, amount) {
  profile.xp += amount;
  let levels = 0;
  while (profile.xp >= xpNeed(profile.lvl)) {
    profile.xp -= xpNeed(profile.lvl);
    profile.lvl++;
    levels++;
  }
  return levels;
}
