// A server-authoritative duel. Side 0 is always the human challenger and
// goes first. Side 1 is either another player or an AI-driven NPC duelist.
// Players carry deckItems ({card, iid, level}) so Chronicle levels apply and
// combat stats credit back to the exact card instance.

import '../shared/sets/core/cards.js';
import '../shared/sets/emberpeaks/cards.js';
import '../shared/sets/darkwood/cards.js';
import { createDuel, findUnit } from '../shared/engine/state.js';
import { startTurn, endTurn, playCard, kindle, offer, attack, activateAbility } from '../shared/engine/engine.js';
import { takeTurn } from '../shared/engine/ai.js';

const RECONNECT_GRACE_MS = 60_000;
const TURN_TIMEOUT_MS = 90_000;   // idle turns auto-end so nobody is held hostage
const MAX_TURN_TIMEOUTS = 3;      // consecutive skips before forfeit

export class DuelRoom {
  // a, b: {name, deckItems, ws|null, ai?, profile?, token?, live?}
  constructor(a, b, opts) {
    this.players = [a, b];
    this.kind = opts.kind;
    this.npcId = opts.npcId || null;
    this.rewardsPool = opts.rewardsPool || null;
    this.onEnd = opts.onEnd;
    this.grant = opts.grant;
    this.onWin = opts.onWin;
    this.onChronicle = opts.onChronicle;
    this.onKindle = opts.onKindle;
    this.onOffer = opts.onOffer;
    this.logCursor = 0;   // duel.log scan position (see broadcast)
    this.dcTimers = [null, null];
    this.botPending = false;
    this.autoSides = new Set();   // human sides that toggled autobattle
    this.turnTimer = null;
    this.turnTimeouts = [0, 0];   // consecutive idle-turn skips per side
    // night comes from the server-synced game hour at room creation
    // (opts.night via roomOpts in index.js) and is fixed for the whole duel
    this.duel = createDuel([...a.deckItems], [...b.deckItems], { names: [a.name, b.name], night: opts.night });
    startTurn(this.duel);
    for (let s = 0; s < 2; s++) this.sendStart(s);
    this.maybeBotTurn();
    this.armTurnTimer();
  }

  send(side, msg) {
    const ws = this.players[side].ws;
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  sendStart(side) {
    if (this.players[side].ai) return;
    this.send(side, { t: 'duelStart', side, foe: this.players[1 - side].name, kind: this.kind, state: this.view(side) });
  }

  view(side) {
    const d = this.duel;
    return {
      turn: d.turn, active: d.active, winner: d.winner, night: d.night,
      chatter: d.chatter.slice(-12),
      players: d.players.map((p, i) => ({
        hearth: p.hearth, ember: p.ember, emberMax: p.emberMax,
        kindledThisTurn: p.kindledThisTurn, offersUsed: p.offersUsed,
        hand: i === side ? p.hand : p.hand.map(() => null),
        reactions: i === side ? p.reactions : p.reactions.map(() => null),
        enchantments: p.enchantments,   // face-up and persistent — visible to both sides
        field: p.field,
        deckCount: p.deck.length, graveCount: p.graveyard.length,
      })),
    };
  }

  resolveTarget(t) {
    if (!t) return null;
    if (t.hearth !== undefined) return { hearth: t.hearth };
    if (t.unitUid !== undefined) {
      const u = findUnit(this.duel, t.unitUid);
      return u ? { unit: u } : null;
    }
    return null;
  }

  onAction(side, act) {
    const d = this.duel;
    if (d.winner !== null || !act || side < 0) return;
    this.turnTimeouts[side] = 0;
    switch (act.kind) {
      case 'play':
        playCard(d, side, act.i, this.resolveTarget(act.target));
        break;
      case 'kindle':
        kindle(d, side, act.i);
        break;
      case 'offer':
        // the Offering — only ever reaches here from a live human client
        // (AI and autobattle act via takeTurn, which never offers); the
        // collection-side migration happens in the onOffer hook below
        offer(d, side, act.i);
        break;
      case 'attack': {
        const unit = findUnit(d, act.unitUid);
        if (!unit || unit.side !== side) return;
        const target = this.resolveTarget(act.target);
        if (!target) return;
        attack(d, side, unit, target);
        break;
      }
      case 'activate': {
        const unit = findUnit(d, act.unitUid);
        if (!unit || unit.side !== side) return;
        activateAbility(d, side, unit, this.resolveTarget(act.target));
        break;
      }
      case 'end':
        if (d.active === side) endTurn(d);
        break;
      case 'concede':
        d.winner = 1 - side;
        break;
      case 'auto':
        if (act.on) this.autoSides.add(side);
        else this.autoSides.delete(side);
        break;
      default:
        return;
    }
    this.broadcast();
  }

  broadcast() {
    // every state change funnels through here (human actions, AI turns,
    // timeouts), so scanning the log delta catches EVERY kindle — human,
    // NPC, and autobattle alike (drafting Phase 2: kindle feeds the fire)
    {
      const log = this.duel.log;
      for (let i = this.logCursor; i < log.length; i++) {
        if (log[i].type === 'kindle' && this.onKindle) this.onKindle(this, log[i].side, log[i].card);
        if (log[i].type === 'offer' && this.onOffer) this.onOffer(this, log[i]);
      }
      this.logCursor = log.length;
    }
    for (let s = 0; s < 2; s++) if (!this.players[s].ai) this.send(s, { t: 'duelState', state: this.view(s) });
    if (this.duel.winner !== null) this.finish();
    else { this.maybeBotTurn(); this.armTurnTimer(); }
  }

  // any action re-arms the clock; only human, non-autobattling sides need one
  // (bots act on their own). Repeated idle turns forfeit — this also frees
  // rooms abandoned mid-NPC-duel.
  armTurnTimer() {
    clearTimeout(this.turnTimer);
    this.turnTimer = null;
    const side = this.duel.active;
    if (this.duel.winner !== null) return;
    if (this.players[side].ai || this.autoSides.has(side)) return;
    this.turnTimer = setTimeout(() => {
      if (this.duel.winner !== null || this.duel.active !== side) return;
      this.turnTimeouts[side]++;
      if (this.turnTimeouts[side] >= MAX_TURN_TIMEOUTS) return this.forfeit(side);
      for (let s = 0; s < 2; s++) {
        this.send(s, { t: 'chat', from: '[Server]', text: this.players[side].name + "'s turn timed out." });
      }
      endTurn(this.duel);
      this.broadcast();
    }, TURN_TIMEOUT_MS);
  }

  // plays the active side's turn if it belongs to the NPC AI or an
  // autobattling human — the same duelist brain either way
  maybeBotTurn() {
    const side = this.duel.active;
    const driven = this.players[side]?.ai || this.autoSides.has(side);
    if (!driven || this.duel.winner !== null || this.botPending) return;
    this.botPending = true;
    setTimeout(() => {
      this.botPending = false;
      if (this.duel.winner !== null) return;
      if (!(this.players[this.duel.active]?.ai || this.autoSides.has(this.duel.active))) return;  // toggled off meanwhile
      takeTurn(this.duel, this.duel.active);
      this.broadcast();
    }, 900);
  }

  // ---- disconnect / resume ----
  detach(side) {
    if (side < 0) return;
    this.players[side].ws = null;
    this.send(1 - side, { t: 'chat', from: '[Server]', text: this.players[side].name + ' disconnected — they have 60s to return.' });
    this.dcTimers[side] = setTimeout(() => this.forfeit(side), RECONNECT_GRACE_MS);
  }

  attach(side, ws) {
    clearTimeout(this.dcTimers[side]);
    this.dcTimers[side] = null;
    this.players[side].ws = ws;
    this.sendStart(side);
    this.send(1 - side, { t: 'chat', from: '[Server]', text: this.players[side].name + ' reconnected.' });
  }

  forfeit(side) {
    if (this.duel.winner === null) {
      this.duel.winner = 1 - side;
      this.finish();
    }
  }

  finish() {
    for (const t of this.dcTimers) clearTimeout(t);
    clearTimeout(this.turnTimer);
    const w = this.duel.winner;
    const rewards = [];
    const winner = this.players[w];
    if (!winner.ai && winner.profile) {
      const loserName = this.players[1 - w].name;
      const pool = this.kind === 'npc' ? this.rewardsPool : this.players[1 - w].deckItems.map(i => i.card);
      for (let i = 0; i < 2; i++) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        this.grant(winner.profile, id, 'Won from ' + loserName);
        rewards.push(id);
      }
    }
    for (let s = 0; s < 2; s++) {
      if (this.players[s].ai) continue;
      this.send(s, {
        t: 'duelEnd',
        won: s === w,
        foe: this.players[1 - s].name,
        rewards: s === w ? rewards : [],
      });
    }
    if (this.onWin) this.onWin(w, this);
    if (this.onChronicle) this.onChronicle(this);
    this.onEnd(this);
  }
}
