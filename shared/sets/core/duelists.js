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

// Rowan was the least-developed roster entry (only 2 cards ever swapped in)
// despite the Wardens deck leaning hardest on Guardian of any theme in the
// set, and Guardian had zero build-around cards anywhere (every other
// keyword got at least one). The second swap folds in 7 Guardian-identity
// cards plus his own signature card (the "boss plays themself" pattern
// already used for Gruk/Vex), replacing generic removal/tempo filler.
const rowanDeck = swap(
  swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['wardenplate', 'second_wind']),
  ['camp_torcher', 'camp_torcher', 'ember_bolt', 'kindled_fury', 'kindled_fury', 'sudden_spark', 'sudden_spark'],
  ['line_holder', 'shieldwall_sergeant', 'stand_and_hold', 'watchers_oath', 'bulwark_doctrine', 'rowan', 'bastion_keep'],
);
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
// Gruk was the roster's thinnest deck (only these 2 cards ever swapped in,
// both Piercing) despite already leaning on that exact keyword. The second
// swap deepens it: two curve-filling Piercing bodies, the spell/relic/
// enchantment that grant it (Piercing had none of the three before this —
// compare stand_and_hold/reckless_charge/pilgrims_vow), plus the previously
// -unclaimed piercing_barb/warthog_battering_ram keyword-gap fillers.
const grukDeck = swap(
  swap(STARTER_DECKS.boarherd, ['young_boar', 'militia_recruit'], ['ironhide_boar', 'emberwood_colossus']),
  ['quartermaster', 'quartermaster', 'kindled_fury', 'kindled_fury', 'wolf_howl', 'wild_boar', 'wild_boar'],
  ['boar_lancer', 'tusked_reaver', 'honed_tusks', 'tusks_of_the_hollow', 'boarlords_fury', 'piercing_barb', 'warthog_battering_ram'],
);
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
// Maren the Shrinekeeper (DESIGN.md) — Wardens-based. The enchantment type
// (herd_instinct/bastion_oath/ember_communion/ashen_vigil) had zero duelist
// owners since it shipped, and the Ward keyword's two keyword-gap fillers
// (warded_acolyte/sanctum_guardian) were likewise unclaimed — Maren leans
// into Ward as a persistent, deck-wide axis: 5 new cards plus bastion_oath
// (the enchantment mechanic's first duelist owner) and the two Ward bodies.
const marenDeck = swap(
  STARTER_DECKS.wardens,
  ['wild_boar', 'wild_boar', 'darkwood_wolf', 'darkwood_wolf', 'camp_torcher', 'camp_torcher', 'kindled_fury', 'sudden_spark'],
  ['warding_litany', 'bastion_oath', 'blessed_icon', 'shrines_grace', 'pilgrims_vow', 'shrine_elder', 'warded_acolyte', 'sanctum_guardian'],
);
// Kestrel Twinstrike (DESIGN.md) — Red-Sash-based. Guardian/Ambush/Ward each
// already had a duelist owner (Rowan/Vex/Maren); Frenzy — the other half of
// Red-Sash's own tagline ("Ambush and Frenzy tempo") — had none, and no
// relic/spell in the whole set granted it. Folds in all 7 new Frenzy cards,
// replacing off-theme/generic filler (wolf_howl, hearth_meal, pack_alpha,
// controlled_burn, two kindled_fury, one sudden_spark).
const kestrelDeck = swap(
  STARTER_DECKS.redsash,
  ['controlled_burn', 'wolf_howl', 'hearth_meal', 'pack_alpha', 'kindled_fury', 'kindled_fury', 'sudden_spark'],
  ['hotblood_recruit', 'twinblade_mercenary', 'twin_fangs', 'reckless_charge', 'bandit_creed', 'kestrel', 'warband_champion'],
);
// Marrow the Delver (DESIGN.md) — Boarherd-based (tied with Red-Sash as the
// roster's least-used base, keeping Wardens from stacking a 5th duelist).
// Graveyard-matters (exhume/graveBuff) was the one build-around axis with no
// deck-wide owner: charnel_hound, grave_caller, and the ashen_vigil
// enchantment sat completely unclaimed since they shipped. Folds those three
// in alongside 5 new cards (bone_delver/charnel_colossus curve fillers,
// unquiet_grave/delvers_pick spell+relic exhume-and-buff, and her own
// signature marrow), replacing generic non-thematic filler.
const marrowDeck = swap(
  STARTER_DECKS.boarherd,
  ['quartermaster', 'quartermaster', 'kindled_fury', 'kindled_fury', 'sudden_spark', 'sudden_spark', 'wolf_howl', 'ember_bolt'],
  ['bone_delver', 'grave_caller', 'charnel_hound', 'ashen_vigil', 'marrow', 'charnel_colossus', 'unquiet_grave', 'delvers_pick'],
);

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
    rewards: [...grukDeck, 'ironhide_boar', 'emberwood_colossus', 'ember_fang', 'rootbound_titan'],
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
  maren: {
    name: 'Maren the Shrinekeeper', deck: marenDeck,
    rewards: [...marenDeck, 'ashen_vigil'],
  },
  kestrel: {
    name: 'Kestrel Twinstrike', deck: kestrelDeck,
    rewards: [...kestrelDeck, 'tuskblade_berserker'],
  },
  marrow: {
    name: 'Marrow the Delver', deck: marrowDeck,
    rewards: [...marrowDeck, 'last_rites', 'second_harvest'],
  },
};
