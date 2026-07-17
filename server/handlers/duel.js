// Duels: PvP challenge/accept, NPC duels, per-action forwarding, plus the
// post-duel reward + Chronicle hooks handed to each DuelRoom. This is where
// XP, coins, card renown, and faction standing are written authoritatively.
// ctx supplies { players, activeDuels, challenges, DUELISTS, DuelRoom,
//   send, broadcast, sendProfile, markDirty, grant, deckItems, gameHour,
//   CHALLENGE_TTL_MS, CHALLENGE_RANGE }.

import { applyXP } from '../../shared/progression.js';
import { progressDuelWin } from '../../shared/quests.js';
import { getCard } from '../../shared/engine/cards.js';
import { levelOf, LEVEL_NAMES, renownFromDuel } from '../../shared/chronicle.js';
import { earnStanding } from '../../shared/factions.js';

export function createDuelModule(ctx) {
  const { players, activeDuels, challenges, DUELISTS, DuelRoom,
    send, broadcast, sendProfile, markDirty, grant, deckItems, gameHour,
    CHALLENGE_TTL_MS, CHALLENGE_RANGE, feedFire } = ctx;

  // duel victory: XP + quest progress
  function onDuelWin(w, room) {
    const winner = room.players[w];
    if (winner.ai || !winner.profile) return;
    applyXP(winner.profile, room.kind === 'npc' ? 40 : 60);
    // coin faucet — autobattle earns full rewards by decision (DESIGN.md
    // 2026-07-08: it's QoL, automation is possible either way)
    const coins = room.kind === 'npc' ? 5 : 10;
    winner.profile.coins += coins;
    const events = progressDuelWin(winner.profile, room.npcId);
    markDirty(winner.profile);
    if (winner.live) {
      if (coins) send(winner.live, { t: 'coinGain', amount: coins });
      for (const ev of events) send(winner.live, { t: 'questEvent', kind: 'progress', ...ev });
    }
  }

  // after every duel: write each participating instance's story into its ledger
  function onChronicle(room) {
    const w = room.duel.winner;
    for (let s = 0; s < 2; s++) {
      const p = room.players[s];
      if (p.ai || !p.profile) continue;
      const byId = new Map(p.profile.cards.map(c => [c.iid, c]));
      const events = [];
      for (const item of p.deckItems) {
        const inst = byId.get(item.iid);
        if (!inst) continue;
        const stats = room.duel.stats[item.iid];
        const before = levelOf(inst.renown);
        inst.renown += renownFromDuel(stats, s === w);
        inst.record.duels++;
        if (s === w) inst.record.wins++;
        if (stats) { inst.record.kills += stats.kills; inst.record.hearthDmg += stats.hearthDmg; }
        const after = levelOf(inst.renown);
        if (after > before) {
          events.push({ iid: inst.iid, cardId: inst.cardId, level: after, levelName: LEVEL_NAMES[after] });
          // realm-wide moment: an ember waking to Veteran/Storied is rare and
          // is exactly the visible status the Hall of Legends trades in.
          // Seasoned (level 1) is deliberately not announced — too common.
          if (after >= 2) {
            broadcast({ t: 'chat', from: '[Chronicle]', text: `The fire remembers: ${p.profile.name}'s ${getCard(inst.cardId).name} is now ${LEVEL_NAMES[after]}.` });
          }
        }
      }
      // faction standing — THE progression system (DESIGN.md "Factions"):
      // each faction card this side PLAYED earns standing with its faction,
      // doubled on a win, capped per duel (shared/factions.js earnStanding).
      // Autobattle earns in full, same as every other duel reward.
      const gains = earnStanding(room.duel.log, s, s === w);
      const gainedFactions = Object.keys(gains);
      if (gainedFactions.length) {
        p.profile.factions = p.profile.factions || {};
        for (const f of gainedFactions) p.profile.factions[f] = (p.profile.factions[f] || 0) + gains[f];
      }
      markDirty(p.profile);
      if (p.live) {
        if (events.length) send(p.live, { t: 'chronicle', events });
        if (gainedFactions.length) send(p.live, { t: 'standing', gains });
        sendProfile(p.live);
      }
    }
  }

  function endRoom(room) {
    for (const p of room.players) {
      if (p.token) activeDuels.delete(p.token);
      if (p.live) p.live.room = null;
    }
  }

  // night matches the Sentinel/wisp window (20:00–6:00), evaluated when the
  // room is created — nocturnal cards (Darkwood set) key off it for the whole
  // duel. Same server-synced clock every client renders, so the duel's night
  // state always agrees with the sky the players are looking at.
  const isNight = () => { const h = gameHour(); return h >= 20 || h < 6; };
  // drafting Phase 2: every kindle (either side — NPCs and autobattle too)
  // drifts into the nearest fire that can hear the duel. The duel's location
  // is the kindling side's live player position (frozen at duel start — the
  // client stops sending pos while dueling); an AI side borrows its human
  // opponent's spot, since that's where the duel is happening.
  const onKindle = (room, side, cardId) => {
    const live = room.players[side].live || room.players[1 - side].live;
    if (live && feedFire) feedFire(live.x, live.z, cardId);
  };
  const roomOpts = extra => ({ onEnd: endRoom, grant, onWin: onDuelWin, onChronicle, onKindle, night: isNight(), ...extra });

  const handlers = {
    challenge(me, msg) {
      const target = players.get(msg.target);
      if (target && !target.room && !me.room && !target.trade && !me.trade && target !== me
          && Math.hypot(target.x - me.x, target.z - me.z) <= CHALLENGE_RANGE) {
        challenges.set(me.id + ':' + target.id, Date.now() + CHALLENGE_TTL_MS);
        send(target, { t: 'challenged', from: me.id, name: me.name });
      }
    },

    accept(me, msg) {
      // only start a duel the other side actually asked for
      const key = msg.from + ':' + me.id;
      const expiry = challenges.get(key);
      challenges.delete(key);
      if (!expiry || expiry < Date.now()) return;
      const ch = players.get(msg.from);
      if (ch && !ch.room && !me.room && !ch.trade && !me.trade && ch !== me) {
        const a = { name: ch.name, deckItems: deckItems(ch.profile), ws: ch.ws, profile: ch.profile, token: ch.token, live: ch };
        const b = { name: me.name, deckItems: deckItems(me.profile), ws: me.ws, profile: me.profile, token: me.token, live: me };
        const room = new DuelRoom(a, b, roomOpts({ kind: 'pvp' }));
        ch.room = room; me.room = room;
        activeDuels.set(ch.token, { room, side: 0 });
        activeDuels.set(me.token, { room, side: 1 });
      }
    },

    npcduel(me, msg) {
      const def = DUELISTS[msg.npc];
      if (!def || me.room || me.trade) return;
      const a = { name: me.name, deckItems: deckItems(me.profile), ws: me.ws, profile: me.profile, token: me.token, live: me };
      const b = { name: def.name, deckItems: [...def.deck], ws: null, ai: true };
      const room = new DuelRoom(a, b, roomOpts({ kind: 'npc', npcId: msg.npc, rewardsPool: def.rewards }));
      me.room = room;
      activeDuels.set(me.token, { room, side: 0 });
    },

    duel(me, msg) {
      if (me.room) me.room.onAction(me.room.players.findIndex(p => p.live === me), msg.act);
    },
  };

  return { handlers };
}
