// Hearth drafting (Phase 1 of the drafting epic, .claude/DRAFTING.md): every
// registry fire (shared/fires.js) holds a small server-owned pool of embers.
// hearthView reads a fire's offering; draftPick takes one — validated like
// everything that grants cards: proximity, per-player-per-fire cooldown, and
// pool membership, then the server mints authoritatively. Pools live in the
// worldstate table so what one player leaves behind is what the next finds,
// across restarts. Kindling is the pools' living faucet (Phase 2): feedFire
// is called from the duel module for every kindle in an online duel, so what
// players (and NPCs) burn nearby becomes what the next visitor can draft.
// The slow timed regen stays as the floor for fires nobody duels near.
// ctx supplies { send, sendProfile, markDirty, grant, VENDOR_RANGE, loadWorld, saveWorld }.

import { FIRES, fireById, rollEmber, seedFire, POOL_MAX, REGEN_MS, PICK_COOLDOWN_MS, KINDLE_FEED_RANGE, FIRE_COPY_CAP } from '../../shared/fires.js';
// card sets must be registered before any roll — idempotent side-effect
// imports, same trio as duelRoom.js
import '../../shared/sets/core/cards.js';
import '../../shared/sets/emberpeaks/cards.js';
import '../../shared/sets/darkwood/cards.js';

export function createHearthModule(ctx) {
  const { send, sendProfile, markDirty, grant, VENDOR_RANGE, loadWorld, saveWorld } = ctx;

  // { [fireId]: { cards: [cardId], lastRegen: ms } } — in-memory source of
  // truth, worldstate row is the durable copy (profiles.js pattern). New
  // registry fires seed on boot; removed ones keep their row harmlessly.
  const pools = loadWorld('firePools') || {};
  for (const f of FIRES) {
    if (!pools[f.id]) pools[f.id] = { cards: seedFire(f), lastRegen: Date.now() };
  }
  saveWorld('firePools', pools);

  // catch-up regen, computed on demand (no timers): one ember per REGEN_MS
  // up to POOL_MAX. A full pool doesn't bank time — the fire only starts
  // "remembering" again once something is taken.
  function regen(fire) {
    const p = pools[fire.id];
    const now = Date.now();
    if (p.cards.length >= POOL_MAX) { p.lastRegen = now; return; }
    let owed = Math.floor((now - p.lastRegen) / REGEN_MS);
    if (owed <= 0) return;
    while (owed-- > 0 && p.cards.length < POOL_MAX) {
      p.cards.push(rollEmber(fire));
      p.lastRegen += REGEN_MS;
    }
    if (p.cards.length >= POOL_MAX) p.lastRegen = now;
    saveWorld('firePools', pools);
  }

  function view(me, fire) {
    send(me, {
      t: 'hearthView', fire: fire.id, name: fire.name,
      cards: pools[fire.id].cards, poolMax: POOL_MAX,
      nextPickAt: ((me.profile.hearthPicks || {})[fire.id] || 0) + PICK_COOLDOWN_MS,
    });
  }

  function nearFire(me, msg) {
    const fire = fireById(msg.fire);
    if (!fire || me.room || me.trade) return null;
    if (Math.hypot(me.x - fire.x, me.z - fire.z) > VENDOR_RANGE) return null;
    return fire;
  }

  // Phase 2 — a kindled memory drifts into the nearest fire that can hear
  // the duel. A full pool is sated (no churn: griefers can't flush a fire's
  // holdings by burning trash — drafting is what makes room), and extra
  // copies past FIRE_COPY_CAP merge into the flame. Returns the fed fire's
  // id, or null if nothing was fed.
  function feedFire(x, z, cardId) {
    let best = null, bd = KINDLE_FEED_RANGE;
    for (const f of FIRES) {
      const d = Math.hypot(f.x - x, f.z - z);
      if (d < bd) { bd = d; best = f; }
    }
    if (!best) return null;
    const p = pools[best.id];
    if (p.cards.length >= POOL_MAX) return null;
    if (p.cards.filter(c => c === cardId).length >= FIRE_COPY_CAP) return null;
    p.cards.push(cardId);
    saveWorld('firePools', pools);
    return best.id;
  }

  const handlers = {
    hearthView(me, msg) {
      const fire = nearFire(me, msg);
      if (!fire) return;
      regen(fire);
      view(me, fire);
    },

    draftPick(me, msg) {
      const fire = nearFire(me, msg);
      if (!fire) return;
      regen(fire);
      const now = Date.now();
      const picks = (me.profile.hearthPicks ||= {});
      if ((picks[fire.id] || 0) + PICK_COOLDOWN_MS > now) {
        send(me, { t: 'draftResult', fire: fire.id, error: 'The fire has given you its due for now.' });
        return;
      }
      const pool = pools[fire.id];
      const idx = pool.cards.indexOf(msg.card);
      if (idx < 0) {
        send(me, { t: 'draftResult', fire: fire.id, error: 'That ember has already been taken.' });
        view(me, fire);
        return;
      }
      pool.cards.splice(idx, 1);
      picks[fire.id] = now;
      const inst = grant(me.profile, msg.card, 'Drafted from ' + fire.name);
      markDirty(me.profile);
      saveWorld('firePools', pools);
      sendProfile(me);   // the new card lands before the reveal renders
      send(me, { t: 'draftResult', fire: fire.id, cardId: inst.cardId, iid: inst.iid });
      view(me, fire);
      console.log(`${me.name} drafted ${inst.cardId} from ${fire.id}`);
    },
  };

  return { handlers, feedFire };
}
