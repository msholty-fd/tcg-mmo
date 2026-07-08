// Effect primitives — the extensibility layer. New sets can register new
// primitives via registerEffect(). ctx carries {card, srcIid, unit, target}.

import { getCard } from './cards.js';
import { drawCard, damageUnit, damageHearth, healHearth, summonUnit, say } from './state.js';

const registry = {};

export function registerEffect(name, fn) { registry[name] = fn; }
export function getEffect(name) {
  const fn = registry[name];
  if (!fn) throw new Error('Unknown effect primitive: ' + name);
  return fn;
}

function selectTargets(duel, side, sel, ctx) {
  const me = duel.players[side], foe = duel.players[1 - side];
  switch (sel) {
    case 'enemyHearth': return [{ hearth: 1 - side }];
    case 'ownHearth':   return [{ hearth: side }];
    case 'self':        return ctx.unit ? [{ unit: ctx.unit }] : [];
    case 'chosen':      return ctx.target ? [ctx.target] : [];
    case 'trigger':     return ctx.trigger?.unit ? [{ unit: ctx.trigger.unit }] : [];
    case 'randomEnemy': {
      const pool = foe.field.filter(u => u.hp > 0);
      return pool.length ? [{ unit: pool[Math.floor(duel.rng() * pool.length)] }] : [{ hearth: 1 - side }];
    }
    case 'allEnemies':  return foe.field.map(u => ({ unit: u }));
    case 'allAllies':   return me.field.map(u => ({ unit: u }));
    default: throw new Error('Unknown target selector: ' + sel);
  }
}

export function runEffect(duel, side, effect, ctx = {}) {
  getEffect(effect.effect)(duel, side, effect, ctx);
}

const srcName = ctx => ctx.card ? getCard(ctx.card).name : 'An effect';

// ---- built-in primitives ----

registerEffect('damage', (duel, side, e, ctx) => {
  for (const t of selectTargets(duel, side, e.target, ctx)) {
    if (t.hearth !== undefined) {
      say(duel, `${srcName(ctx)} scorches the Hearth for ${e.amount}.`);
      damageHearth(duel, t.hearth, e.amount, ctx.srcIid);
    } else if (t.unit) {
      say(duel, `${srcName(ctx)} hits ${getCard(t.unit.card).name} for ${e.amount}.`);
      damageUnit(duel, t.unit, e.amount, ctx.srcIid);
    }
  }
});

registerEffect('heal', (duel, side, e, ctx) => {
  for (const t of selectTargets(duel, side, e.target, ctx)) {
    if (t.hearth !== undefined) healHearth(duel, t.hearth, e.amount);
    else if (t.unit) {
      t.unit.hp = Math.min(t.unit.maxhp, t.unit.hp + e.amount);
      duel.log.push({ type: 'heal', unit: t.unit.uid, amount: e.amount });
    }
  }
});

registerEffect('draw', (duel, side, e) => {
  for (let i = 0; i < (e.amount || 1); i++) drawCard(duel, side);
});

registerEffect('buff', (duel, side, e, ctx) => {
  for (const t of selectTargets(duel, side, e.target, ctx)) {
    if (!t.unit) continue;
    t.unit.atk += e.atk || 0;
    t.unit.maxhp += e.hp || 0;
    t.unit.hp += e.hp || 0;
    duel.log.push({ type: 'buff', unit: t.unit.uid, atk: e.atk || 0, hp: e.hp || 0 });
  }
});

registerEffect('grantKeyword', (duel, side, e, ctx) => {
  for (const t of selectTargets(duel, side, e.target, ctx)) {
    if (!t.unit || t.unit.keywords.includes(e.keyword)) continue;
    t.unit.keywords.push(e.keyword);
    if (e.keyword === 'ambush') t.unit.sick = false;
    duel.log.push({ type: 'grantKeyword', unit: t.unit.uid, keyword: e.keyword });
    say(duel, `${getCard(t.unit.card).name} gains ${e.keyword}.`);
  }
});

// ready a creature to attack (again) this turn
registerEffect('refresh', (duel, side, e, ctx) => {
  for (const t of selectTargets(duel, side, e.target, ctx)) {
    if (!t.unit) continue;
    t.unit.sick = false;
    t.unit.attacksLeft++;
    duel.log.push({ type: 'refresh', unit: t.unit.uid });
    say(duel, `${getCard(t.unit.card).name} readies for another strike.`);
  }
});

registerEffect('summon', (duel, side, e) => {
  for (let i = 0; i < (e.count || 1); i++) summonUnit(duel, side, e.token);
});

registerEffect('emberGain', (duel, side, e) => {
  const p = duel.players[side];
  p.ember = Math.min(p.emberMax + 2, p.ember + e.amount);
  duel.log.push({ type: 'emberGain', side, amount: e.amount });
});

// cancel the effects of the spell that tripped this reaction (engine checks
// ctx.countered before firing the spell's onPlay; the ember stays spent)
registerEffect('counter', (duel, side, e, ctx) => {
  ctx.countered = true;
  duel.log.push({ type: 'counter', side, card: ctx.trigger?.card || null });
  say(duel, `${srcName(ctx)} snuffs the spell out!`);
});

// return random creature card(s) from your graveyard to your hand
registerEffect('exhume', (duel, side, e) => {
  const p = duel.players[side];
  for (let i = 0; i < (e.amount || 1); i++) {
    const pool = p.graveyard.filter(c => getCard(c.card).type === 'creature');
    if (!pool.length || p.hand.length >= 10) return;
    const c = pool[Math.floor(duel.rng() * pool.length)];
    p.graveyard.splice(p.graveyard.indexOf(c), 1);
    p.hand.push(c);
    duel.log.push({ type: 'exhume', side, card: c.card });
    say(duel, `${getCard(c.card).name} is pulled back from the ashes.`);
  }
});

// buff the source unit per matching card in your graveyard, up to e.cap
registerEffect('graveBuff', (duel, side, e, ctx) => {
  if (!ctx.unit) return;
  const p = duel.players[side];
  const n = Math.min(
    p.graveyard.filter(c => !e.filter || getCard(c.card).type === e.filter).length,
    e.cap ?? Infinity,
  );
  if (!n) return;
  ctx.unit.atk += (e.atk || 0) * n;
  ctx.unit.maxhp += (e.hp || 0) * n;
  ctx.unit.hp += (e.hp || 0) * n;
  duel.log.push({ type: 'buff', unit: ctx.unit.uid, atk: (e.atk || 0) * n, hp: (e.hp || 0) * n });
  say(duel, `${getCard(ctx.unit.card).name} draws strength from ${n} fallen.`);
});

// let this player kindle again this turn
registerEffect('resetKindle', (duel, side) => {
  duel.players[side].kindledThisTurn = false;
  duel.log.push({ type: 'resetKindle', side });
});
