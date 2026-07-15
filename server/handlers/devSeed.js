// Dev seeding — LOCAL RIG ONLY (scripts/dev-rig.mjs; VERIFICATION.md §5).
// The `devSeed` message puts the CALLER's own profile into an arbitrary
// progression state so tests skip the stop-server/edit-db/restart dance.
//
// It is never available in production — triple-gated:
//   1. createDevSeedHandlers returns {} unless DEV_SEED=1, an env var only
//      the rig sets (deploys set nothing beyond PORT — DEPLOYMENT.md);
//   2. the connection must be loopback (me.ip, stamped at join);
//   3. it can only touch the caller's own profile — no cross-player surface.

import { applyXP } from '../../shared/progression.js';
import { mintCard } from '../../shared/chronicle.js';
import { FACTIONS } from '../../shared/factions.js';
import { getCard } from '../../shared/engine/cards.js';
import { sanitizeAppearance, validAppearance } from '../../shared/cosmetics.js';

const isLoopback = ip => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

export function createDevSeedHandlers(ctx) {
  if (process.env.DEV_SEED !== '1') return {};
  console.log('⚠ DEV_SEED enabled — devSeed accepted from loopback. Local development only.');
  const { send, sendProfile, markDirty } = ctx;

  return {
    devSeed(me, msg) {
      if (!isLoopback(me.ip)) return;
      const s = msg.seed || {};
      if (s.factions && typeof s.factions === 'object') {
        for (const f of FACTIONS) {
          if (s.factions[f.id] !== undefined) me.profile.factions[f.id] = Math.max(0, +s.factions[f.id] || 0);
        }
      }
      if (Number.isFinite(+s.coins)) me.profile.coins = Math.max(0, Math.floor(+s.coins));
      if (Number.isFinite(+s.xp) && +s.xp > 0) applyXP(me.profile, Math.floor(+s.xp));
      if (Array.isArray(s.cards)) {
        for (const id of s.cards.slice(0, 100)) {
          if (getCard(id)) me.profile.cards.push(mintCard(id, 'Dev rig', me.name));
        }
      }
      if (s.appearance) {
        // still validated — seed standing in the same message if you want
        // rank-gated pieces (factions apply above, before this check)
        const app = sanitizeAppearance(s.appearance);
        if (validAppearance(me.profile, app)) { me.profile.appearance = app; me.appearance = app; }
      }
      markDirty(me.profile);
      sendProfile(me);
      send(me, { t: 'devSeeded' });
      console.log(`devSeed: ${me.name}`);
    },
  };
}
