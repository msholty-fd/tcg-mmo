// The rules engine: legal actions, trigger resolution, turn structure,
// combat keywords. Pure functions over duel state — identical on server,
// in bot AI, and in the offline client.
//
// Combat keywords:
//   ambush    — can attack the turn it's played
//   guardian  — enemies must attack this unit first
//   ward      — can't be targeted by enemy spells
//   frenzy    — attacks twice per turn
//   lifesteal — attacking restores that much Hearth
//   piercing  — excess damage from kills carries to the enemy Hearth

import { getCard } from './cards.js';
import { drawCard, damageUnit, damageHearth, healHearth, findUnit, unitFromCard, say } from './state.js';
import { runEffect } from './effects.js';

const uname = u => getCard(u.card).name;

// ---- triggers ----
export function fireTriggers(duel, side, unitOrCard, when, ctx = {}) {
  const def = getCard(unitOrCard.card);
  const effects = def.triggers?.[when];
  if (!effects) return;
  const srcIid = unitOrCard.iid || unitOrCard.uid || null;
  for (const e of effects) {
    runEffect(duel, side, e, { ...ctx, card: unitOrCard.card, srcIid, unit: unitOrCard.uid ? unitOrCard : ctx.unit });
  }
  sweepDead(duel);
}

export function sweepDead(duel) {
  let died = true;
  while (died) {
    died = false;
    for (let s = 0; s < 2; s++) {
      const p = duel.players[s];
      for (let i = p.field.length - 1; i >= 0; i--) {
        const u = p.field[i];
        if (u.hp <= 0) {
          died = true;
          p.field.splice(i, 1);
          p.graveyard.push({ card: u.card, iid: u.uid, level: u.level });
          duel.log.push({ type: 'death', side: s, unit: u.uid, card: u.card });
          say(duel, `${uname(u)} is destroyed.`);
          fireTriggers(duel, s, u, 'onDeath');
        }
      }
    }
  }
}

// ---- turn structure ----
export function startTurn(duel) {
  duel.turn++;
  const side = duel.active;
  const p = duel.players[side];
  p.ember = p.emberMax;
  p.kindledThisTurn = false;
  say(duel, `— ${duel.names[side]}'s turn —`);
  for (const u of p.field) {
    u.sick = false;
    u.attacksLeft = u.keywords.includes('frenzy') ? 2 : 1;
    fireTriggers(duel, side, u, 'startOfTurn');
  }
  drawCard(duel, side);
  duel.log.push({ type: 'turnStart', side, turn: duel.turn });
}

export function endTurn(duel) {
  const side = duel.active;
  for (const u of duel.players[side].field) fireTriggers(duel, side, u, 'endOfTurn');
  duel.active = 1 - side;
  duel.log.push({ type: 'turnEnd', side });
  startTurn(duel);
}

// ---- player actions ----
export function canKindle(duel, side) {
  const p = duel.players[side];
  return duel.active === side && !p.kindledThisTurn && p.hand.length > 0 && duel.winner === null;
}

export function kindle(duel, side, handIndex) {
  if (!canKindle(duel, side)) return false;
  const p = duel.players[side];
  const c = p.hand.splice(handIndex, 1)[0];
  if (!c) return false;
  p.emberMax++;
  p.ember++;
  p.kindledThisTurn = true;
  p.graveyard.push(c);
  duel.log.push({ type: 'kindle', side, card: c.card, emberMax: p.emberMax });
  say(duel, `${duel.names[side]} kindles a card (${p.emberMax} Ember).`);
  return true;
}

export function canPlay(duel, side, handIndex) {
  const p = duel.players[side];
  if (duel.active !== side || duel.winner !== null) return false;
  const c = p.hand[handIndex];
  if (!c) return false;
  const def = getCard(c.card);
  if (def.cost > p.ember) return false;
  if (def.type === 'creature' && p.field.length >= 6) return false;
  return true;
}

export function playCard(duel, side, handIndex, target = null) {
  if (!canPlay(duel, side, handIndex)) return false;
  const p = duel.players[side];
  const def = getCard(p.hand[handIndex].card);
  if (def.needsTarget && !validTarget(duel, side, def, target)) return false;

  const c = p.hand.splice(handIndex, 1)[0];
  p.ember -= def.cost;
  duel.log.push({ type: 'play', side, card: c.card });
  say(duel, `${duel.names[side]} plays ${def.name}.`);

  if (def.type === 'creature') {
    const u = unitFromCard(c, side);
    p.field.push(u);
    duel.log.push({ type: 'summon', side, unit: u.uid, card: c.card });
    fireTriggers(duel, side, u, 'onPlay', { target });
  } else {
    // spell / relic — resolve onPlay effects, then to the graveyard
    fireTriggers(duel, side, c, 'onPlay', { target });
    p.graveyard.push(c);
  }
  sweepDead(duel);
  return true;
}

function validTarget(duel, side, def, target) {
  if (!target) return false;
  if (target.unit) {
    const u = findUnit(duel, target.unit.uid ?? target.unit);
    if (!u || u.hp <= 0) return false;
    if (u.keywords.includes('ward') && u.side !== side) return false;
    if (def.needsTarget === 'enemyUnit' && u.side === side) return false;
    if (def.needsTarget === 'ownUnit' && u.side !== side) return false;
    return true;
  }
  if (target.hearth !== undefined) return def.needsTarget === 'any';
  return false;
}

export function canAttack(duel, side, unit) {
  return duel.active === side && duel.winner === null && !unit.sick && unit.attacksLeft > 0 && unit.atk > 0;
}

export function attack(duel, side, unit, target) {
  if (!canAttack(duel, side, unit)) return false;
  const foe = duel.players[1 - side];
  const guardians = foe.field.filter(u => u.keywords.includes('guardian') && u.hp > 0);
  if (guardians.length && !(target.unit && guardians.includes(target.unit))) return false;

  unit.attacksLeft--;
  fireTriggers(duel, side, unit, 'onAttack', { target });

  if (target.hearth !== undefined) {
    duel.log.push({ type: 'attackHearth', side, unit: unit.uid });
    say(duel, `${uname(unit)} strikes the Hearth for ${unit.atk}.`);
    damageHearth(duel, 1 - side, unit.atk, unit.uid);
    if (unit.keywords.includes('lifesteal')) {
      healHearth(duel, side, unit.atk);
      say(duel, `${uname(unit)} drinks deep — ${unit.atk} Hearth restored.`);
    }
  } else if (target.unit) {
    const t = target.unit;
    duel.log.push({ type: 'attackUnit', side, unit: unit.uid, target: t.uid });
    say(duel, `${uname(unit)} strikes ${uname(t)} for ${unit.atk}.`);
    const hpBefore = t.hp;
    damageUnit(duel, t, unit.atk, unit.uid);
    if (unit.keywords.includes('lifesteal')) {
      healHearth(duel, side, unit.atk);
      say(duel, `${uname(unit)} drinks deep — ${unit.atk} Hearth restored.`);
    }
    if (unit.keywords.includes('piercing') && t.hp < 0 && hpBefore > 0) {
      const excess = -t.hp;
      say(duel, `${uname(unit)} pierces through for ${excess}!`);
      damageHearth(duel, 1 - side, excess, unit.uid);
    }
    if (t.atk > 0) damageUnit(duel, unit, t.atk, t.uid);
  }
  sweepDead(duel);
  return true;
}
