// Player card collection: a list of card *instances*, each with its own
// Chronicle (renown, battle record, provenance). The server is authoritative
// when online; localStorage mirrors it for offline play.

import { STARTER_DECKS } from '../../shared/sets/core/cards.js';
import { mintCard, levelOf } from '../../shared/chronicle.js';

const KEY = 'emberwood.collection.v2';

let data = null;   // {cards: [instance], deck: [iid]}

export function initCollection(starterName, playerName) {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { data = JSON.parse(raw); return; }
  } catch {}
  const starter = STARTER_DECKS[starterName] || STARTER_DECKS.boarherd;
  const cards = starter.map(id => mintCard(id, 'Starter deck', playerName));
  data = { cards, deck: cards.map(c => c.iid) };
  save();
}

function save() { localStorage.setItem(KEY, JSON.stringify(data)); }

export function getCards() { return data.cards; }
export function getDeck() { return [...data.deck]; }
export function getInstance(iid) { return data.cards.find(c => c.iid === iid); }

// deck as engine items ({card, iid, level}) — for offline local duels
export function getDeckItems() {
  return data.deck.map(iid => {
    const inst = getInstance(iid);
    return { card: inst.cardId, iid, level: levelOf(inst.renown) };
  });
}

// deck as plain card ids — sent on join so the server can seed a new profile
export function getDeckCardIds() {
  return data.deck.map(iid => getInstance(iid).cardId);
}

// offline reward: mint locally (no renown gain offline)
export function grantCard(cardId, origin = 'Won offline') {
  data.cards.push(mintCard(cardId, origin));
  save();
}

// server is authoritative when online
export function adoptProfile(profile) {
  data = { cards: profile.cards.map(c => ({ ...c })), deck: [...profile.deck] };
  save();
}

export function setDeck(iids) {
  data.deck = [...iids];
  save();
}
