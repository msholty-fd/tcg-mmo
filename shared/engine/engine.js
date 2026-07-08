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
//
// Reactions: type 'reaction' cards are set face-down (max 2) and auto-fire
// on the named enemy event (def.reaction.on): 'enemySpell' fires before the
// spell's effects (counterable), 'enemyCreature' after the creature's onPlay,
// 'enemyAttack' on declaration before damage. Revealed → resolved → graveyard.
// No priority windows, by design — see DESIGN.md "Reactions, not a stack".
//
// Enchantments: type 'enchantment' cards resolve onPlay like a relic, but
// then stay face-up in a persistent per-player zone (p.enchantments, max 4)
// instead of going to the graveyard. They fire again on player-wide events —
// 'startOfTurn'/'endOfTurn'/'onKindle' (same hooks creatures use, via
// fireEnchantmentTriggers), 'onAllySummon' (after you play a creature — lets
// an enchantment buff-on-cast-plus-buff-future-plays to read as a static
// aura) and 'onAllyDeath' (after one of your creatures dies). Unlike a
// reaction they are never consumed by firing — see DESIGN.md "Enchantments,
// a persistent axis".

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

// fire `side`'s persistent face-up enchantments for a player-wide event —
// the enchantment card instance stands in for `unitOrCard` in fireTriggers,
// so its def.triggers[when] effects run with ctx (e.g. ctx.unit for
// 'onAllySummon') exactly like a creature's own triggers would.
export function fireEnchantmentTriggers(duel, side, when, ctx = {}) {
  for (const e of [...duel.players[side].enchantments]) fireTriggers(duel, side, e, when, ctx);
}

// reveal + resolve `ownerSide`'s face-down reactions matching `on`, in the
// order they were set. ctx.trigger carries what tripped them ({unit} or
// {card}); returns ctx so callers can check ctx.countered.
export function fireReactions(duel, ownerSide, on, ctx = {}) {
  const p = duel.players[ownerSide];
  for (const r of [...p.reactions]) {
    const def = getCard(r.card);
    if (def.reaction?.on !== on) continue;
    const i = p.reactions.indexOf(r);
    if (i < 0) continue;
    p.reactions.splice(i, 1);
    p.graveyard.push(r);
    duel.log.push({ type: 'reactionReveal', side: ownerSide, card: r.card });
    say(duel, `${duel.names[ownerSide]} springs ${def.name}!`);
    // effects write back into the shared ctx (e.g. 'counter' sets
    // ctx.countered, which playCard checks) — don't hand them a copy
    ctx.card = r.card;
    ctx.srcIid = r.iid;
    for (const e of def.reaction.effects) runEffect(duel, ownerSide, e, ctx);
  }
  sweepDead(duel);
  return ctx;
}

export function sweepDead(duel) {
  let died = true;
  while (died) {
    died = false;
    // Splice out every currently-dead unit on both fields BEFORE firing any
    // onDeath trigger. onDeath effects (and the sweepDead(duel) call at the
    // end of fireTriggers) can recurse into this function — e.g. an AOE like
    // Gruk's "damage 2 to all enemy creatures" kills several units at once,
    // and the first one's onDeath trigger would otherwise re-enter this loop
    // while it's still mid-splice over the same p.field array, desyncing the
    // index and reading past the shrunk array. Removing the whole batch
    // first means a nested sweepDead only ever sees fields with no stale
    // corpses left to collide with.
    const casualties = [];
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
          casualties.push({ s, u });
        }
      }
    }
    for (const { s, u } of casualties) {
      fireTriggers(duel, s, u, 'onDeath');
      fireEnchantmentTriggers(duel, s, 'onAllyDeath', { unit: u });
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
  fireEnchantmentTriggers(duel, side, 'startOfTurn');
  drawCard(duel, side);
  duel.log.push({ type: 'turnStart', side, turn: duel.turn });
}

export function endTurn(duel) {
  const side = duel.active;
  for (const u of duel.players[side].field) fireTriggers(duel, side, u, 'endOfTurn');
  fireEnchantmentTriggers(duel, side, 'endOfTurn');
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
  for (const u of [...p.field]) fireTriggers(duel, side, u, 'onKindle');
  fireEnchantmentTriggers(duel, side, 'onKindle');
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
  if (def.type === 'reaction' && p.reactions.length >= 2) return false;
  if (def.type === 'enchantment' && p.enchantments.length >= 4) return false;
  return true;
}

export function playCard(duel, side, handIndex, target = null) {
  if (!canPlay(duel, side, handIndex)) return false;
  const p = duel.players[side];
  const def = getCard(p.hand[handIndex].card);
  if (def.needsTarget && !validTarget(duel, side, def, target)) return false;

  const c = p.hand.splice(handIndex, 1)[0];
  p.ember -= def.cost;

  if (def.type === 'reaction') {
    // set face-down — the chatter line must not leak which card it is
    p.reactions.push(c);
    duel.log.push({ type: 'setReaction', side, card: c.card });
    say(duel, `${duel.names[side]} sets a card face-down.`);
    return true;
  }

  duel.log.push({ type: 'play', side, card: c.card });
  say(duel, `${duel.names[side]} plays ${def.name}.`);

  if (def.type === 'creature') {
    const u = unitFromCard(c, side);
    p.field.push(u);
    duel.log.push({ type: 'summon', side, unit: u.uid, card: c.card });
    fireTriggers(duel, side, u, 'onPlay', { target });
    fireReactions(duel, 1 - side, 'enemyCreature', { trigger: { unit: u } });
    fireEnchantmentTriggers(duel, side, 'onAllySummon', { unit: u });
  } else if (def.type === 'spell') {
    const rctx = fireReactions(duel, 1 - side, 'enemySpell', { trigger: { card: c.card } });
    if (!rctx.countered) fireTriggers(duel, side, c, 'onPlay', { target });
    p.graveyard.push(c);
  } else if (def.type === 'enchantment') {
    // face-up and persistent — resolves onPlay like a relic, but joins its
    // own zone instead of the graveyard so it can fire again later
    p.enchantments.push(c);
    duel.log.push({ type: 'enchant', side, card: c.card });
    fireTriggers(duel, side, c, 'onPlay', { target });
  } else {
    // relic — resolve onPlay effects, then to the graveyard
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
  // the defender's reactions spring on declaration, before any damage; if
  // they kill the attacker or the target, the attack fizzles (still spent)
  fireReactions(duel, 1 - side, 'enemyAttack', { trigger: { unit } });
  if (unit.hp <= 0 || (target.unit && target.unit.hp <= 0)) return true;
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
