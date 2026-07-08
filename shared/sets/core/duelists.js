// NPC duelist roster — used by the client to spawn them in the world and by
// the server to run their duels authoritatively. Their reward pools are where
// the new-blood cards enter circulation: beat the duelist, win their cards.

import { STARTER_DECKS } from './cards.js';

const swap = (deck, out, ins) => {
  const d = [...deck];
  for (const [o, n] of ins.map((n, i) => [out[i], n])) {
    const idx = d.indexOf(o);
    if (idx >= 0) d[idx] = n;
  }
  return d;
};

const rowanDeck = swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['wardenplate', 'second_wind']);
const vexDeck = swap(STARTER_DECKS.redsash, ['young_boar', 'young_boar'], ['nightstalker', 'tusk_talisman']);
const grukDeck = [
  ...swap(STARTER_DECKS.boarherd.filter(c => c !== 'gruk'), ['young_boar', 'militia_recruit'], ['ironhide_boar', 'emberwood_colossus']),
  'gruk', 'gruk', 'gruk',
];
// Highgate's roster (see DESIGN.md) — a Wardens-based gate captain and a
// Boarherd-based road warden, swapped with cards no earlier duelist uses.
const verityDeck = swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['warden_captain', 'counterspark']);
const tarnDeck = swap(STARTER_DECKS.boarherd, ['young_boar', 'young_boar'], ['dire_wolf', 'second_harvest']);

export const DUELISTS = {
  rowan: {
    name: 'Duelist Rowan', deck: rowanDeck,
    rewards: [...rowanDeck, 'wardenplate', 'second_wind', 'ashen_rite'],
  },
  vex: {
    name: 'Vex the Red-Sash', deck: vexDeck,
    rewards: [...vexDeck, 'nightstalker', 'tusk_talisman', 'ashen_rite'],
  },
  gruk: {
    name: 'Gruk the Boar King', deck: grukDeck,
    rewards: [...grukDeck, 'ironhide_boar', 'emberwood_colossus', 'ember_fang'],
  },
  verity: {
    name: 'Captain Verity', deck: verityDeck,
    rewards: [...verityDeck, 'warden_captain', 'counterspark', 'pyre_keeper'],
  },
  tarn: {
    name: 'Tarn the Tollkeeper', deck: tarnDeck,
    rewards: [...tarnDeck, 'dire_wolf', 'second_harvest', 'thicket_beast'],
  },
};
