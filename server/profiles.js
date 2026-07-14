// Profile store: the persistent, instance-based card collections plus the
// card/deck rules that need the store. The in-memory map is the runtime
// source of truth (game code mutates profiles in place); the DB is the
// durable copy, written per-profile. See db.js for the SQLite layer.
//
// createProfiles() bundles this so index.js gets one object and the auth /
// deck logic lives beside the store it mutates. Nothing here touches sockets
// or live players — that's index.js and the handler modules.

import crypto from 'node:crypto';
import { openProfileStore } from './db.js';
import { newPlayerStarter } from '../shared/sets/core/cards.js';
import { getCard } from '../shared/engine/cards.js';
import { evaluateDeck } from '../shared/deckConstraints.js';
import { isLeaderCard } from '../shared/sets/core/leaders.js';
import { mintCard, levelOf, levelPoints, LEGEND_BUDGET } from '../shared/chronicle.js';
import { effectiveRanks } from '../shared/factions.js';

const MAX_COPIES = 3;

export function createProfiles(dbFile, legacyFile) {
  const store = openProfileStore(dbFile, legacyFile);
  const profiles = store.loadAll();

  const tokenOf = new Map(Object.entries(profiles).map(([t, p]) => [p, t]));
  function registerProfile(token, profile) {
    profiles[token] = profile;
    tokenOf.set(profile, token);
  }

  const dirty = new Set();   // tokens with unsaved changes
  let saveT = null;
  function markDirty(profile) {
    const token = tokenOf.get(profile);
    if (!token) return console.error('markDirty: unregistered profile', profile && profile.name);
    dirty.add(token);
    if (saveT) return;
    saveT = setTimeout(flushProfiles, 1000);
  }

  function flushProfiles() {
    clearTimeout(saveT);
    saveT = null;
    if (!dirty.size) return;
    const entries = [...dirty].map(t => [t, profiles[t]]);
    dirty.clear();
    try {
      store.saveMany(entries);
    } catch (err) {
      console.error('profile save failed:', err.message);
      for (const [t] of entries) dirty.add(t);   // retried on the next flush
    }
  }

  // scrypt for new passwords; legacy single-round sha256 profiles are verified
  // with the old scheme and upgraded in place on their next successful login
  const hashPwLegacy = (pw, salt) => crypto.createHash('sha256').update(salt + ':' + pw).digest('hex');
  const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

  function setPassword(profile, pw) {
    profile.salt = crypto.randomBytes(16).toString('hex');
    profile.passwordHash = hashPw(pw, profile.salt);
    profile.pwAlg = 'scrypt';
    markDirty(profile);
  }

  function verifyPw(profile, pw) {
    if (!pw) return false;
    const expected = profile.pwAlg === 'scrypt' ? hashPw(pw, profile.salt) : hashPwLegacy(pw, profile.salt);
    const a = Buffer.from(expected), b = Buffer.from(String(profile.passwordHash || ''));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    if (profile.pwAlg !== 'scrypt') setPassword(profile, pw);
    return true;
  }

  const findByName = name =>
    Object.entries(profiles).find(([, p]) => p.name.toLowerCase() === name.toLowerCase());

  function newProfile(name, outfit) {
    // Roll a fresh, banner-coherent starter deck + its Leader server-side.
    const starter = newPlayerStarter();
    const cards = starter.deck.map(id => mintCard(id, 'Starter deck', name));
    // designate the leader instance(s): the first minted copy of each leader card
    const leaders = starter.leaders.map(cid => cards.find(c => c.cardId === cid)?.iid).filter(Boolean);
    return { name, outfit, cards, deck: cards.map(c => c.iid), leaders, xp: 0, lvl: 1, coins: 0, quests: {}, factions: {}, appearance: {} };
  }

  // Validate a deck + its designated Leaders. Base rules (30 / ≤3 / Legend
  // Budget), then the faction-rank gate + per-Leader constraints via the
  // shared engine (deckConstraints.js). leaderIids must be owned instances
  // that are in the deck and whose card is a registered Leader.
  function validDeck(profile, iids, leaderIids = []) {
    if (!Array.isArray(iids) || iids.length !== 30 || new Set(iids).size !== 30) return false;
    const byId = new Map(profile.cards.map(c => [c.iid, c]));
    const copies = {};
    let legend = 0;
    for (const iid of iids) {
      const inst = byId.get(iid);
      if (!inst) return false;
      copies[inst.cardId] = (copies[inst.cardId] || 0) + 1;
      if (copies[inst.cardId] > MAX_COPIES) return false;
      legend += levelPoints(levelOf(inst.renown));
    }
    if (legend > LEGEND_BUDGET) return false;

    // Leaders: each must be owned, in the deck, distinct, and a real Leader card.
    if (!Array.isArray(leaderIids)) return false;
    const deckSet = new Set(iids);
    if (new Set(leaderIids).size !== leaderIids.length) return false;
    const leaderCardIds = [];
    for (const iid of leaderIids) {
      const inst = byId.get(iid);
      if (!inst || !deckSet.has(iid) || !isLeaderCard(inst.cardId)) return false;
      leaderCardIds.push(inst.cardId);
    }
    const defs = iids.map(iid => getCard(byId.get(iid).cardId));
    return evaluateDeck(defs, leaderCardIds, effectiveRanks(profile)).valid;
  }

  // mint a won card into a profile; returns the instance
  function grant(profile, cardId, origin) {
    const inst = mintCard(cardId, origin, profile.name);
    profile.cards.push(inst);
    markDirty(profile);
    return inst;
  }

  // deck items handed to the engine: instances carry their Chronicle level
  function deckItems(profile) {
    const byId = new Map(profile.cards.map(c => [c.iid, c]));
    return profile.deck.map(iid => {
      const inst = byId.get(iid);
      return { card: inst.cardId, iid, level: levelOf(inst.renown) };
    });
  }

  return {
    profiles, registerProfile, markDirty, flushProfiles,
    setPassword, verifyPw, findByName, newProfile,
    validDeck, grant, deckItems,
  };
}
