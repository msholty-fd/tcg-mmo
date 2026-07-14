// Collection & economy handlers: deck submit, cosmetic appearance, quest
// accept/turn-in, pack purchase, Hall of Legends read. Everything here that
// grants cards/coins or gates cosmetics is validated server-side.
// ctx supplies { profiles, send, sendProfile, markDirty, validDeck, grant, VENDOR_RANGE }.

import { sanitizeAppearance, validAppearance } from '../../shared/cosmetics.js';
import { questById, canAccept, canTurnin } from '../../shared/quests.js';
import { applyXP } from '../../shared/progression.js';
import { PACKS, rollPack } from '../../shared/sets/core/packs.js';
import { levelOf, HALL } from '../../shared/chronicle.js';

export function createCollectionHandlers(ctx) {
  const { profiles, send, sendProfile, markDirty, validDeck, grant, VENDOR_RANGE } = ctx;

  return {
    deck(me, msg) {
      const leaders = Array.isArray(msg.leaders) ? msg.leaders : [];
      if (validDeck(me.profile, msg.deck, leaders)) {
        me.profile.deck = [...msg.deck];
        me.profile.leaders = [...leaders];
        markDirty(me.profile);
      } else {
        send(me, { t: 'chat', from: '[Server]', text: 'Deck rejected — invalid cards, Legend Budget, or Leader rules not met.' });
      }
    },

    setAppearance(me, msg) {
      // cosmetic, but rank-gated like deck-building: re-derive the wearer's
      // right to every piece from their profile (shared/cosmetics.js) — a
      // client can't dress above its standing
      const app = sanitizeAppearance(msg.appearance);
      if (!validAppearance(me.profile, app)) {
        send(me, { t: 'chat', from: '[Server]', text: 'They don’t know you well enough to wear that.' });
        return;
      }
      me.profile.appearance = app;
      me.appearance = app;   // presence snapshot shows the new look next tick
      markDirty(me.profile);
      send(me, { t: 'appearance', appearance: app });
    },

    questAccept(me, msg) {
      if (canAccept(me.profile, msg.id)) {
        me.profile.quests[msg.id] = { state: 'active', have: 0 };
        markDirty(me.profile);
        send(me, { t: 'questEvent', kind: 'accepted', id: msg.id });
        sendProfile(me);
      }
    },

    questTurnin(me, msg) {
      if (canTurnin(me.profile, msg.id)) {
        const q = questById(msg.id);
        me.profile.quests[msg.id].state = 'completed';
        applyXP(me.profile, q.xp);
        me.profile.coins += q.coins;
        markDirty(me.profile);
        send(me, { t: 'questEvent', kind: 'completed', id: msg.id });
        sendProfile(me);
      }
    },

    buyPack(me, msg) {
      // proximity vendor purchase — validated like everything else that
      // grants cards: server checks coins + range and mints authoritatively
      const pack = PACKS[msg.pack];
      if (!pack || me.room || me.trade) return;
      if (Math.hypot(me.x - pack.vendor.x, me.z - pack.vendor.z) > VENDOR_RANGE) return;
      if (me.profile.coins < pack.price) {
        send(me, { t: 'packResult', error: 'Not enough coins.' });
        return;
      }
      me.profile.coins -= pack.price;
      const pulls = rollPack(pack).map(id => grant(me.profile, id, 'Bought from ' + pack.vendor.name));
      markDirty(me.profile);
      sendProfile(me);   // coins + new cards land before the reveal renders
      send(me, { t: 'packResult', pack: pack.id, cards: pulls.map(c => ({ cardId: c.cardId, iid: c.iid })) });
      console.log(`${me.name} bought a ${pack.name} (${pulls.map(c => c.cardId).join(', ')})`);
    },

    hall(me) {
      // Hall of Legends — a proximity-gated read of the realm's ledger
      // (Chronicler Sela in Highgate; coords shared via chronicle.js HALL).
      // Scans every profile, ranks by renown server-side, ships only the
      // top N — the read is authoritative and rank can't be spoofed. A
      // full scan per request is fine at current scale; revisit alongside
      // the interest-management trigger in DESIGN.md if profiles grow.
      if (Math.hypot(me.x - HALL.x, me.z - HALL.z) > VENDOR_RANGE) return;
      const ranked = [];
      for (const token in profiles) {
        const pr = profiles[token];
        for (const c of pr.cards || []) {
          if (c.renown > 0) ranked.push({ c, owner: pr.name });
        }
      }
      ranked.sort((a, b) => b.c.renown - a.c.renown);
      send(me, {
        t: 'hallOfLegends',
        entries: ranked.slice(0, HALL.top).map(({ c, owner }) => ({
          cardId: c.cardId, renown: c.renown, level: levelOf(c.renown),
          owner, origin: c.origin, owners: c.owners || [], record: c.record,
        })),
      });
    },
  };
}
