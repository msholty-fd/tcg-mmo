// The Chronicle: every card copy is an individual instance with a history.
// Renown is earned in duels (server-authoritative) and drives level growth:
//   Fresh -> Seasoned (cosmetic) -> Veteran (+1/+1) -> Storied (+2/+2 + keyword)
// The Legend Budget keeps veteran power real but bounded: a deck can carry at
// most LEGEND_BUDGET points (Veteran = 1, Storied = 2).

export const LEVEL_NAMES = ['Fresh', 'Seasoned', 'Veteran', 'Storied'];
export const RENOWN_THRESHOLDS = [20, 60, 150];   // xp needed for L1, L2, L3
export const LEGEND_BUDGET = 8;

// The Hall of Legends — the Chronicle made social (DESIGN.md "Narrative
// direction"). Chronicler Sela reads the realm's ledger aloud at Highgate's
// shrine; the client spawns her at these coords and the server validates
// hall requests against the same ones (the packs.js vendor pattern — shared
// so the two can't drift). `top` caps how many entries the ledger shows.
export const HALL = { x: 20, z: -150, name: 'Chronicler Sela', top: 12 };

export const levelOf = renown =>
  renown >= RENOWN_THRESHOLDS[2] ? 3 :
  renown >= RENOWN_THRESHOLDS[1] ? 2 :
  renown >= RENOWN_THRESHOLDS[0] ? 1 : 0;

export const levelPoints = level => level >= 3 ? 2 : level >= 2 ? 1 : 0;

export function deckLegendPoints(instances) {
  return instances.reduce((sum, c) => sum + levelPoints(levelOf(c.renown)), 0);
}

// Renown earned by one card instance from one duel, given its combat stats.
export function renownFromDuel(stats, won) {
  const s = stats || { kills: 0, hearthDmg: 0 };
  return Math.min(20, (won ? 5 : 2) + s.kills * 2 + Math.floor(s.hearthDmg / 3));
}

let mintCounter = 0;
export function mintCard(cardId, origin, owner) {
  return {
    iid: 'c' + Date.now().toString(36) + (++mintCounter).toString(36) + Math.random().toString(36).slice(2, 6),
    cardId,
    renown: 0,
    minted: Date.now(),
    origin,                       // "Won from Gruk the Boar King" / "Starter deck"
    owners: owner ? [owner] : [], // provenance — grows with trades
    record: { duels: 0, wins: 0, kills: 0, hearthDmg: 0 },
  };
}
