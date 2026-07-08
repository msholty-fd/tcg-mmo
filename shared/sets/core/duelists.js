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
// Vex's Red-Sash roster deepened (worldbuilding loop iteration, DESIGN.md):
// the original swap gave her ambush+lifesteal (nightstalker) and a tempo
// relic; the second swap folds in her own signature card plus two more
// ambush bandits, replacing generic beast/support filler.
const vexDeck = swap(
  swap(STARTER_DECKS.redsash, ['young_boar', 'young_boar'], ['nightstalker', 'tusk_talisman']),
  ['wild_boar', 'wild_boar', 'quartermaster'],
  ['red_sash_picklock', 'masked_raider', 'vex'],
);
// boarherd already carries one 'gruk' (the "boss plays themself" pattern
// also used for Vex/vex below) — no need to strip and re-append it.
const grukDeck = swap(STARTER_DECKS.boarherd, ['young_boar', 'militia_recruit'], ['ironhide_boar', 'emberwood_colossus']);
// Highgate's roster (see DESIGN.md) — a Wardens-based gate captain and a
// Boarherd-based road warden, swapped with cards no earlier duelist uses.
const verityDeck = swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['warden_captain', 'counterspark']);
const tarnDeck = swap(STARTER_DECKS.boarherd, ['young_boar', 'young_boar'], ['dire_wolf', 'second_harvest']);
// The Ashen Sentinel — night-only guardian of Emberwatch Ruins (DESIGN.md).
// Boarherd-based, swapped toward ash/ember-flavored cards no other duelist uses.
const sentinelDeck = swap(STARTER_DECKS.boarherd, ['wild_boar', 'wild_boar', 'tusker'], ['ash_sprite', 'flame_tender', 'ashen_shambler']);
// The footpad who works Bram's Rest (DESIGN.md) — Red-Sash-based, swapped
// toward the two remaining ambush/road-themed cards no other duelist uses.
const footpadDeck = swap(STARTER_DECKS.redsash, ['tusker', 'tusker'], ['red_sash_ambusher', 'hidden_snare']);
// Old Hessa of Hollowmere (DESIGN.md) — Wardens-based, warding_bell is the
// last fully-untouched signature card in the core set; ashen_shambler is
// reused here (its "walks the way grief does" graveyard flavor fits a bog
// hermit better than anywhere it's been used so far). The exclusive-card
// budget from the 2026-07-08 set-expansion decision is now fully allocated
// across 7 duelists — see DESIGN.md, a real second set is the next unlock
// for fresh duelist-signature cards.
const hessaDeck = swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['warding_bell', 'ashen_shambler']);

export const DUELISTS = {
  rowan: {
    name: 'Duelist Rowan', deck: rowanDeck,
    rewards: [...rowanDeck, 'wardenplate', 'second_wind', 'ashen_rite'],
  },
  vex: {
    name: 'Vex the Red-Sash', deck: vexDeck,
    rewards: [...vexDeck, 'nightstalker', 'tusk_talisman', 'ashen_rite', 'stolen_blade', 'ambush_horn', 'shakedown'],
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
  sentinel: {
    name: 'The Ashen Sentinel', deck: sentinelDeck,
    rewards: [...sentinelDeck, 'stoke_the_flames', 'last_rites', 'pyre_keeper'],
  },
  footpad: {
    name: 'A Footpad', deck: footpadDeck,
    rewards: [...footpadDeck, 'boar_pit', 'forest_sow', 'alarm_bell'],
  },
  hessa: {
    name: 'Old Hessa of the Mire', deck: hessaDeck,
    rewards: [...hessaDeck, 'warding_bell', 'last_rites', 'second_harvest'],
  },
};
