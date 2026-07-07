// Card registry. Sets register their cards here at import time.
// A card definition:
// {
//   id, name, set, rarity: 'common'|'uncommon'|'rare',
//   type: 'creature'|'spell'|'enchantment'|'relic',
//   cost, atk?, hp?, text,
//   keywords?: ['ambush','ward','frenzy',...],
//   triggers?: { onPlay: [effects], onDeath: [effects], startOfTurn: [effects], onAttack: [effects] },
//   needsTarget?: 'enemyUnit'|'anyUnit'|'any'   (for chosen-target spells)
// }

const registry = new Map();

export function registerCards(cards) {
  for (const c of cards) {
    if (registry.has(c.id)) throw new Error('Duplicate card id: ' + c.id);
    registry.set(c.id, c);
  }
}

export function getCard(id) {
  const c = registry.get(id);
  if (!c) throw new Error('Unknown card: ' + id);
  return c;
}

export function allCards() { return [...registry.values()]; }
export function cardsInSet(set) { return allCards().filter(c => c.set === set); }
