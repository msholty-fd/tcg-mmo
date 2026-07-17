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
  swap(
    swap(STARTER_DECKS.boarherd, ['young_boar', 'militia_recruit'], ['ironhide_boar', 'emberwood_colossus']),
    ['quartermaster', 'quartermaster', 'kindled_fury', 'kindled_fury', 'wolf_howl', 'wild_boar', 'wild_boar'],
    ['boar_lancer', 'tusked_reaver', 'honed_tusks', 'tusks_of_the_hollow', 'boarlords_fury', 'piercing_barb', 'warthog_battering_ram'],
  ),
  // the last militia_recruit out for the vanguard's chase rare — the Boar
  // King fields no militia; the First Tusk leads his charge (see DESIGN.md)
  ['militia_recruit'], ['first_tusk'],
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
// Second swap (worldbuilding loop, deepening pass): the Sentinel was by far
// the roster's thinnest deck (only 3 cards ever swapped in, the least of any
// duelist) and the only long-standing duelist with no self-named signature
// card. Her existing 3 cards dabble in kindle-matters and graveyard-matters,
// both now fully owned elsewhere (Tarn; Marrow; Hessa's hybrid of the two) —
// "ashfall" (onDeath/onAllyDeath triggers as immediate-value payoffs, not
// graveyard-count buffing) was the one build-around axis still open, and
// ashen_vigil (the enchantment mechanic's onAllyDeath hook) had sat unclaimed
// in Maren's reward pool but never in an actual deck. Folds in 7 new cards
// plus ashen_vigil, replacing generic burn filler that shares no theme with her.
const sentinelDeck = swap(
  swap(STARTER_DECKS.boarherd, ['wild_boar', 'wild_boar', 'tusker'], ['ash_sprite', 'flame_tender', 'ashen_shambler']),
  ['ember_bolt', 'ember_bolt', 'ember_bolt', 'kindled_fury', 'kindled_fury', 'sudden_spark', 'hearth_meal', 'wolf_howl'],
  ['ember_husk', 'watchfire_whelp', 'ashbound_warden', 'feed_the_fire', 'cinderfall_rite', 'sentinel', 'ashfall_colossus', 'ashen_vigil'],
);
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
  swap(
    STARTER_DECKS.redsash,
    ['controlled_burn', 'wolf_howl', 'hearth_meal', 'pack_alpha', 'kindled_fury', 'kindled_fury', 'sudden_spark'],
    ['hotblood_recruit', 'twinblade_mercenary', 'twin_fangs', 'reckless_charge', 'bandit_creed', 'kestrel', 'warband_champion'],
  ),
  // the generic 1-drops out for the warband's own curve-starter — the camp
  // mutt bites twice, like everything else Kestrel drills (see DESIGN.md)
  ['young_boar', 'young_boar'], ['scrap_dog', 'scrap_dog'],
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
// Road duelists (DESIGN.md "Route trainers", 2026-07-13) — minor duelists
// stationed on the waystone routes that had nobody to duel between
// settlements (Gruk road E, Emberwatch road NE, Hollowmere road SW).
// Deliberately LIGHT: a single 2-card swap on a starter, like the original
// footpad — NOT deepened boss identities. They're commoners who share their
// family's staples, and a road should duel easier than the camp it leads to.
// scout_ahead / forest_sow / thicket_beast / rally_the_line get their first
// deck owners here (all four shipped straight to pack/reward pools and had
// never been in an actual deck).
const sorrelDeck = swap(
  STARTER_DECKS.boarherd,
  ['militia_recruit', 'militia_recruit'],
  ['forest_sow', 'thicket_beast'],
);
const finchDeck = swap(
  STARTER_DECKS.redsash,
  ['young_boar', 'young_boar'],
  ['scout_ahead', 'scout_ahead'],
);
const brennaDeck = swap(
  STARTER_DECKS.wardens,
  ['wild_boar', 'wild_boar'],
  ['rally_the_line', 'counterspark'],
);
// Tolly (the Wether Downs) — the shepherd plays the herd: boarherd base
// trading burn for flock-wide buffs. Gives `herd_instinct` its FIRST deck
// owner (it was the last unclaimed core card — every other card is played
// or dropped by someone).
// Tuned in sims (500/side vs each starter): 56/72/58 vs boarherd/wardens/
// redsash. The wardens number rides the documented greedy-AI defense blind
// spot (the plain boarherd starter already hits 60 there). Rejected: two
// herd_instincts (~79 vs wardens), tusker-out-for-meal (27 vs redsash —
// tusker is load-bearing in that matchup).
const tollyDeck = swap(
  STARTER_DECKS.boarherd,
  ['ember_bolt', 'sudden_spark'],
  ['herd_instinct', 'hearth_meal'],
);
// Dace (Pell's Pond) — the netmender fishes with patience: wardens base
// trading arson for tackle. camp_torcher is the one card a fisher would
// never carry; in come hidden_snare (a net is a snare set underwater) and
// patient_sentry (the trade IS waiting). Route-trainer tier like Tolly —
// commoners sharing family staples, not a deepened boss identity.
// Tuned in sims (500/side vs each starter): 36/46/44 vs boarherd/wardens/
// redsash — the route-trainer band (a landing duels easier than a camp;
// brenna's plain wardens base sims 32/41/40, so the swap is a gentle nudge
// up, not a power shift). Rejected: a deeper 4-card trap lean (+boar_pit/
// warding_bell over burn — 41/52/49, but route trainers are single light
// swaps by decision, not deepened identities), and a redsash base with the
// same two cards (46/47/49, and it reads bandit, not fisher).
const daceDeck = swap(
  STARTER_DECKS.wardens,
  ['camp_torcher', 'camp_torcher'],
  ['hidden_snare', 'patient_sentry'],
);
// Wick (the Bee Meads) — the waxwright keeps the hive's rules: redsash base
// (bees are the realm's smallest tempo family — quick, cheap, many, stinging;
// and it evens the route-trainer bases at 2 boarherd / 2 wardens / 2 redsash)
// trading open flame for the hive's answer. Two of the base's three
// camp_torchers go — around skeps the fire stays small and the smoke cool;
// the third stays, because a waxwright's trade runs on one careful flame
// under the wax pot (it's the mob of torches he won't have). In come
// alarm_bell (rile the hive and the whole hive answers) and quick_fingers
// (the sting: brush the comb, lose a drop). Route-trainer tier
// like Tolly/Dace — a single light swap, not a deepened identity; his
// micro-read is "don't poke the hive" (both ins punish enemyAttack), distinct
// from Dace's set-and-wait snares and Tolly's herd-wide buffs.
// Tuned in sims (500/side vs each starter): 45/44/48 vs boarherd/wardens/
// redsash — the route-trainer band (dace 36/46/44, brenna 32/41/40; finch's
// near-plain redsash base sims 49/53/52, so trading two proactive torcher
// bodies for reactions nudges the mead gently easier than the roads, which
// fits — an apiary duels friendlier than a bandit route). Rejected variants,
// both simmed at 500/side: alarm_bell+hidden_snare (45/45/48 — statistically
// indistinguishable, so theme decided it: the snare is Dace's signature move,
// while the sting's ember drop reads bee), and a wardens base with the same
// two ins (34/43/41 — route-trainer legal, but it duplicates Dace's exact
// shape: same base, same camp_torcher outs, two wardens landings in a row).
const wickDeck = swap(
  STARTER_DECKS.redsash,
  ['camp_torcher', 'camp_torcher'],
  ['alarm_bell', 'quick_fingers'],
);
// Nell (the west road's meads arm) — the realm's first trainer on a forked
// road: the carter who hauls the west's goods east when the trades call for
// it (Wynn's wool, Pell's fish, Odo's honey, Wick's candles — the Wayfarer's
// own "sheep, fish, and honey" line made a person). Wardens base — carters
// are common working folk, and the destination grammar forces it: roads duel
// easier than the places they lead to, and this road's ends are Wick
// (45/44/48) and Tolly, so a boarherd base can't get low enough (see
// rejected variants below). Out go kindled_fury x2 — a carter doesn't pick
// fights, and nothing kindled rides beside a loaded wain; NOT Dace's
// camp_torcher outs, deliberately (same-base trainers must not share the
// same shape). In come yoke_ox ("pulls the cart, pulls its weight" — the
// wain's puller by its own printed flavor) and wayside_watcher ("watches the
// road better than she walks it" — the road's own small body). Micro-read:
// "the load comes through" — a steady puller and eyes on the road, no fury,
// distinct from Dace's set-and-wait snares, Wick's punish-attack, and
// Tolly's herd buffs.
// Tuned in sims (500/side vs each starter, 0 stuck anywhere): 43/54/49 vs
// boarherd/wardens/redsash — between dace (36/46/44) and finch (49/53/52),
// just under the meads' own duelist. Rejected variants, all simmed at
// 500/side: boarherd ember_bolt x2 -> yoke_ox+old_drover (60/73/62 — the
// carter's full team, but it out-duels BOTH destinations and tops sorrel's
// road ceiling; a spur trainer must not be the strongest thing on its road);
// boarherd wild_boar x2 -> same ins (55/68/58 — Tolly-tier, still above the
// destination); wardens camp_torcher x2 -> yoke_ox+old_drover (45/57/53 —
// band-legal but it duplicates Dace's exact shape: same base, same outs);
// wardens kindled_fury x2 -> yoke_ox+stout_plowman (46/57/53 — statistically
// close to the pick, so theme decided it: wayside_watcher is the road's card).
const nellDeck = swap(
  STARTER_DECKS.wardens,
  ['kindled_fury', 'kindled_fury'],
  ['yoke_ox', 'wayside_watcher'],
);
// Hew (Hobb's Quarry) — the prentice splitter plays the way stone teaches:
// boarherd base (the quarry is the east's yard — Gruk's Hollow and Sorrel's
// road are its neighbors, boar country; and it evens the route-trainer bases
// at 3 boarherd / 3 wardens / 2 redsash) trading fury for patience. Out go
// kindled_fury x2 — fury wastes rock: strike a seam angry and you've made
// gravel, not a waystone. NOT Tolly's ember_bolt/sudden_spark outs or
// Sorrel's militia_recruit outs — same-base trainers must not share the same
// shape. In come line_holder ("He doesn't move. That's the whole plan." — a
// stonecutter's whole plan) and stand_and_hold ("Two words. Whole strategy."
// — what a prentice is told a hundred times a day). Micro-read: "the stone
// holds" — a guardian body and a guardian grant, no haste, distinct from
// Tolly's herd buffs, Dace's snares, Wick's punish-attack, and Nell's
// steady puller.
// Tuned in sims (500/side vs each starter, 0 stuck anywhere): 49/60/52 vs
// boarherd/wardens/redsash — between finch (49/53/52) and Tolly (56/72/58),
// under Sorrel's measured 56/66/58 (the east's road trainer serves Gruk's
// boss camp, so his band runs high), and power-neutral vs the plain boarherd
// base (60/52 in the starter spread — staples traded for staples). The 60
// vs wardens rides the documented greedy-AI defense blind spot. Room stays
// open below (dace 36/46/44, brenna 32/41/40) for a future east-road
// trainer — roads duel easier than the places they lead to. Rejected
// variants, all simmed at 500/side: boarherd wolf_howl+pack_alpha -> same
// ins (37/45/39 — "no pack at the yard" reads nice but howl/alpha are the
// base's engine: it guts the deck AND cramps the band a future east-road
// trainer must fit under); redsash kindled_fury x2 -> same ins (49/51/54 —
// band-legal, but a bandit sash on an honest mason's prentice reads wrong,
// the Dace-survey objection verbatim); boarherd kindled_fury x2 ->
// line_holder+watchers_oath (47/57/49 — statistically a tie with the pick,
// so theme decided it: stand_and_hold IS the apprentice's whole instruction,
// and the oath relic serves better as his reward escalation).
const hewDeck = swap(
  STARTER_DECKS.boarherd,
  ['kindled_fury', 'kindled_fury'],
  ['line_holder', 'stand_and_hold'],
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
    rewards: [...grukDeck, 'ironhide_boar', 'emberwood_colossus', 'ember_fang', 'rootbound_titan'],   // first_tusk rides in via the deck spread (boss pools carry rares — the faction gate's chase path)
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
  sorrel: {
    name: 'Sorrel the Boartracker', deck: sorrelDeck,
    rewards: [...sorrelDeck, 'dire_wolf', 'old_whistler', 'something_comes'],   // "The whistle carries further than the whistler." — a tracker learns the old calls (both uncommon, within the route-trainer reward band; deck untouched, so tuning holds)
  },
  finch: {
    name: 'Finch the Relic-Runner', deck: finchDeck,
    rewards: [...finchDeck, 'quick_fingers'],
  },
  brenna: {
    name: 'Brenna Lampwright', deck: brennaDeck,
    rewards: [...brennaDeck, 'second_wind'],
  },
  tolly: {
    name: 'Tolly the Lambward', deck: tollyDeck,
    rewards: [...tollyDeck, 'forest_sow', 'low_whistle'],   // "You barely hear it. Something does." — a shepherd's whistle calls the flock (common, route-trainer reward band; deck untouched, so tuning holds)
  },
  dace: {
    name: 'Dace the Netmender', deck: daceDeck,
    rewards: [...daceDeck, 'boar_pit'],
  },
  wick: {
    name: 'Wick the Waxwright', deck: wickDeck,
    rewards: [...wickDeck, 'warding_bell'],   // the bigger alarm — the waxwright's escalation (Dace's boar_pit pattern)
  },
  nell: {
    name: 'Nell the Carter', deck: nellDeck,
    rewards: [...nellDeck, 'roadblock'],   // "The road was never as clear as it looked." — the carter's escalation (Dace's boar_pit pattern)
  },
  hew: {
    name: 'Hew the Splitter', deck: hewDeck,
    rewards: [...hewDeck, 'watchers_oath'],   // "Sworn once, kept every day since." — a prenticeship in one line (Dace's boar_pit pattern; deliberately not shieldwall_sergeant, a Leader, nor bastion_keep, a rare — route trainers reward modestly)
  },
};
