// Simple greedy duelist AI. Returns a list of actions it took.
// Used by NPC duelists now; later a server can run the same brain.

import { getCard } from './cards.js';
import { canKindle, kindle, canPlay, playCard, canAttack, attack, endTurn, canActivate, activateAbility } from './engine.js';

export function takeTurn(duel, side) {
  const p = duel.players[side];
  const foe = duel.players[1 - side];

  // 1. Kindle: ramp until 7, or when hand is clogged with unplayable cards
  if (canKindle(duel, side) && (p.emberMax < 7 || p.hand.length > 7)) {
    const idx = worstCardIndex(p);
    if (idx >= 0) kindle(duel, side, idx);
  }

  // 2. Play cards greedily, most expensive playable first
  let played = true;
  while (played && duel.winner === null) {
    played = false;
    const order = p.hand
      .map((c, i) => ({ i, def: getCard(c.card) }))
      .sort((a, b) => b.def.cost - a.def.cost);
    for (const { i, def } of order) {
      if (!canPlay(duel, side, i)) continue;
      const target = pickTarget(duel, side, def);
      if (def.needsTarget && !target) continue;
      if (playCard(duel, side, i, target)) { played = true; break; }
    }
  }

  // 2.5 Activate abilities greedily (cheapest impact first is fine — the AI
  // just spends spare Ember on any ready ability whose target it can pick)
  let acted = true;
  while (acted && duel.winner === null) {
    acted = false;
    for (const u of [...p.field]) {
      if (!canActivate(duel, side, u)) continue;
      const ab = getCard(u.card).ability;
      const target = ab.needsTarget ? pickTargetFor(duel, side, ab.needsTarget) : null;
      if (ab.needsTarget && !target) continue;
      if (activateAbility(duel, side, u, target)) { acted = true; break; }
    }
  }

  // 3. Attack: favorable trades first, then face
  let attacked = true;
  while (attacked && duel.winner === null) {
    attacked = false;
    for (const u of [...p.field]) {
      if (!canAttack(duel, side, u)) continue;
      const guardians = foe.field.filter(e => e.keywords.includes('guardian'));
      const pool = guardians.length ? guardians : foe.field;
      // favorable trade: we kill it and survive, or kill something bigger than us
      const trade = pool.find(e => u.atk >= e.hp && (e.atk < u.hp || e.atk >= u.atk));
      if (guardians.length) {
        if (attack(duel, side, u, { unit: trade || guardians[0] })) attacked = true;
      } else if (trade && foe.hearth > u.atk) {
        if (attack(duel, side, u, { unit: trade })) attacked = true;
      } else {
        if (attack(duel, side, u, { hearth: 1 - side })) attacked = true;
      }
      if (attacked) break;
    }
  }

  if (duel.winner === null) endTurn(duel);
}

function worstCardIndex(p) {
  if (!p.hand.length) return -1;
  let worst = 0, worstScore = Infinity;
  p.hand.forEach((c, i) => {
    const def = getCard(c.card);
    // kindle cheap duplicates / low-impact cards; keep rares
    const score = def.cost + (def.rarity === 'rare' ? 10 : def.rarity === 'uncommon' ? 3 : 0);
    if (score < worstScore) { worstScore = score; worst = i; }
  });
  return worst;
}

function pickTarget(duel, side, def) {
  if (!def.needsTarget) return null;
  return pickTargetFor(duel, side, def.needsTarget);
}

// pick a target for the given needsTarget selector — shared by card plays and
// activated abilities. Greedy: hit the biggest enemy, buff the biggest ally.
function pickTargetFor(duel, side, needsTarget) {
  const foe = duel.players[1 - side];
  const me = duel.players[side];
  const enemies = foe.field.filter(u => !u.keywords.includes('ward'));
  if (needsTarget === 'enemyUnit') {
    if (!enemies.length) return null;
    return { unit: enemies.reduce((a, b) => (a.atk > b.atk ? a : b)) };
  }
  if (needsTarget === 'anyUnit' || needsTarget === 'ownUnit') {
    // buff own biggest creature
    if (!me.field.length) return null;
    return { unit: me.field.reduce((a, b) => (a.atk > b.atk ? a : b)) };
  }
  if (needsTarget === 'any') {
    if (foe.hearth <= 2) return { hearth: 1 - side };
    if (enemies.length) return { unit: enemies.reduce((a, b) => (a.atk > b.atk ? a : b)) };
    return { hearth: 1 - side };
  }
  return null;
}
