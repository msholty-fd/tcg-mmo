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
// Captain Verity was the roster's thinnest deck alongside Tarn/Footpad (only
// these 2 cards ever swapped in). Guardian (Rowan) and Ward (Maren) already
// own the set's other defensive axes, so the second swap leans Verity into
// Lifesteal instead — "the line that doesn't fall" without duplicating
// either: Lifesteal had no spell/enchantment that granted it before this,
// and its keyword-gap fillers (bloodmoon_wolf, widows_kiss) sat unclaimed.
const verityDeck = swap(
  swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['warden_captain', 'counterspark']),
  ['kindled_fury', 'kindled_fury', 'sudden_spark', 'sudden_spark', 'camp_torcher', 'camp_torcher', 'ember_bolt', 'hearth_meal'],
  ['sworn_medic', 'hearthguard_veteran', 'crimson_vow', 'verities_oath', 'verity', 'hearthbound_champion', 'bloodmoon_wolf', 'widows_kiss'],
);
// Tarn the Tollkeeper — kindle-matters as a deck-wide identity (DESIGN.md).
// Tied with the Footpad as the roster's thinnest deck (only 2 cards ever
// swapped in); picked Tarn because dire_wolf/second_harvest share no theme
// with each other, while the Footpad's pair is at least ambush-flavored.
// Kindle-matters was the one build-around axis still open beyond the Ashen
// Sentinel's existing lean (ash_sprite/flame_tender, costs 2-3): pyre_keeper
// (4c) had never been in an actual deck (only the Sentinel's reward pool),
// and cinder_warden (5c) plus the ember_communion enchantment sat completely
// unclaimed. The second swap folds in 6 new kindle cards (rounding out the
// curve at 1c/6c, where no kindle body existed) plus those 3 previously-
// unclaimed cards, replacing generic filler.
const tarnDeck = swap(
  swap(STARTER_DECKS.boarherd, ['young_boar', 'young_boar'], ['dire_wolf', 'second_harvest']),
  ['ember_bolt', 'ember_bolt', 'kindled_fury', 'kindled_fury', 'sudden_spark', 'sudden_spark', 'hearth_meal', 'wolf_howl', 'quartermaster'],
  ['toll_urchin', 'ledger_keeper', 'tollgate_ram', 'open_the_gate', 'tarn', 'tollroad_colossus', 'cinder_warden', 'ember_communion', 'pyre_keeper'],
);
// The Ashen Sentinel — night-only guardian of Emberwatch Ruins (DESIGN.md).
// Boarherd-based, swapped toward ash/ember-flavored cards no other duelist uses.
const sentinelDeck = swap(STARTER_DECKS.boarherd, ['wild_boar', 'wild_boar', 'tusker'], ['ash_sprite', 'flame_tender', 'ashen_shambler']);
// The footpad who works Bram's Rest (DESIGN.md) — Red-Sash-based, swapped
// toward the two remaining ambush/road-themed cards no other duelist uses.
// Second swap (worldbuilding loop, "existing NPC" case): the last of the
// original 7 duelists left un-deepened. Ambush/bandit is Vex's and Frenzy is
// Kestrel's — both Red-Sash themes already — so this footpad needed an
// angle distinct from its own family. "Ambush the ambusher": a deck built
// entirely around punishing enemyAttack (hidden_snare was always the
// footpad's one build-around hint, but sat alone) — narrower than Halvard's
// reaction-control (which spans all three trigger events plus Ward walls).
// Kept the roster's only anonymous entry anonymous: the road_toll quest
// flavor text ("Old Bram won't say it outright") deliberately frames this
// duelist as unidentified, so the signature card (The Uninvited Guest) plays
// on that instead of giving them a name.
const footpadDeck = swap(
  swap(STARTER_DECKS.redsash, ['tusker', 'tusker'], ['red_sash_ambusher', 'hidden_snare']),
  ['camp_torcher', 'ember_bolt', 'ember_bolt', 'controlled_burn', 'wolf_howl', 'hearth_meal', 'pack_alpha'],
  ['wayside_watcher', 'quick_fingers', 'false_camp', 'roadblock', 'turned_tables', 'red_sash_watchman', 'uninvited_guest'],
);
// Old Hessa of Hollowmere (DESIGN.md) — Wardens-based, warding_bell is the
// last fully-untouched signature card in the core set; ashen_shambler is
// reused here (its "walks the way grief does" graveyard flavor fits a bog
// hermit better than anywhere it's been used so far).
// Second swap (worldbuilding loop, deepening pass): Hessa was by far the
// roster's thinnest deck (only 2 cards ever swapped in, tied for lowest
// with the Ashen Sentinel's 3) and the only long-standing duelist with no
// self-named signature card. Kindle-matters (Tarn) and graveyard-matters
// (Marrow) each already have a solo owner, but nobody had combined them —
// a bog witch dealing "cards to the dead" is a natural fit for both at
// once (will-o'-the-wisps / marsh-fire are folklore's own kindle-in-a-
// graveyard). Folds in 7 new cards leaning on that hybrid, replacing
// generic burn/tempo filler that shares no theme with her.
const hessaDeck = swap(
  swap(STARTER_DECKS.wardens, ['wild_boar', 'wild_boar'], ['warding_bell', 'ashen_shambler']),
  ['camp_torcher', 'camp_torcher', 'ember_bolt', 'ember_bolt', 'kindled_fury', 'kindled_fury', 'sudden_spark'],
  ['willow_wisp', 'bog_kindler', 'mire_toll', 'rekindle_the_dead', 'pyre_caller', 'hessa', 'bogfire_colossus'],
);
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
// Halvard Stillwatch (DESIGN.md) — Red-Sash-based (the roster's least-used
// base at 3 duelists vs Wardens'/Boarherd's 4, keeping any one base from
// stacking a 5th). "A deck that builds primarily around reaction cards" was
// the one thing on the assigned candidate list with zero owner — every
// existing reaction card is a single-copy splash in someone else's deck.
// Swaps out Red-Sash's aggressive burn/tempo filler (camp_torcher x3,
// ember_bolt x3, controlled_burn, wolf_howl, hearth_meal) for a genuinely
// reactive control shell: two Ward walls to stall behind, three new
// reactions spanning all three trigger events, a cheap Ward-granting relic,
// his own signature card, and the two previously-unclaimed reactions
// (boar_pit, alarm_bell — both sat only in the Footpad's reward pool, never
// a deck).
const halvardDeck = swap(
  STARTER_DECKS.redsash,
  ['camp_torcher', 'camp_torcher', 'camp_torcher', 'ember_bolt', 'ember_bolt', 'ember_bolt', 'controlled_burn', 'wolf_howl', 'hearth_meal'],
  ['patient_sentry', 'ridgewatch_warden', 'cinderpass_snare', 'backdraft', 'ashfall_recall', 'sentrys_cloak', 'halvard', 'boar_pit', 'alarm_bell'],
);
// Cobb the Farmhand (DESIGN.md) — Boarherd-based (fits the Boarlands/rural
// flavor of Harrow's Field, and every starter base was tied at 4 duelists
// already, so no tiebreak was available on usage alone). Every build-around
// axis surveyed (Guardian/Ambush/Ward/Frenzy/Piercing/kindle-matters/
// graveyard-matters/lifesteal/reaction control) already has a deck-wide
// owner; "vanilla curve" — plain, keyword-free bodies with the best raw
// stats in the set — was the one identity nobody had claimed. Swaps in the
// full 1-6 cost curve of new vanilla bodies (plus his own signature at 5,
// the only signature in the roster with zero rules text) for one copy each
// of the boarherd starter's redundant/off-theme cards.
const cobbDeck = swap(
  STARTER_DECKS.boarherd,
  ['young_boar', 'wild_boar', 'tusker', 'boar_matron', 'pack_alpha', 'kindled_fury'],
  ['farmhands_boy', 'stout_plowman', 'yoke_ox', 'old_drover', 'cobb', 'harrows_plow_ox'],
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
  halvard: {
    name: 'Halvard Stillwatch', deck: halvardDeck,
    rewards: [...halvardDeck, 'warding_bell', 'hidden_snare'],
  },
  cobb: {
    name: 'Cobb the Farmhand', deck: cobbDeck,
    rewards: [...cobbDeck, 'quartermaster', 'hearth_meal'],
  },
};
