export const player = {
  name: 'Adventurer', outfit: null, outfitKey: null, lvl: 1, xp: 0, coins: 0,
  factions: {},   // faction standing points — server-authoritative mirror
  appearance: {}, // equipped faction regalia {slot: itemId} — server-authoritative mirror
  x: 0, z: 9, vy: 0, yaw: 0, speed: 7, mesh: null,
};

export const critters = [];   // ambient wildlife + flavor villagers — scenery, not combatants
export const npcs = [];
export const bots = [];
