// Deck-builder display grouping for the core set — a curated, low-diff
// mapping file kept separate from cards.js on purpose (see DESIGN.md): it
// lets the deck builder show "mini-set-feeling" sections without touching a
// field on all 137 card definitions, and without colliding with concurrent
// sessions that edit cards.js/duelists.js constantly.
//
// Cards are grouped primarily by their MECHANICAL identity — the same axes
// Michael named when deepening each duelist (Vex=ambush, Maren=ward,
// Rowan=guardian, Kestrel=frenzy, Gruk=piercing, Marrow=graveyard-matters,
// Verity=lifesteal, Tarn=kindle-matters) — because that's what actually
// matters when building a deck around a theme, plus three card-TYPE families
// (Relics/Reactions/Enchantments) that are already flavorful mini-categories
// in their own right, exactly like the brief's own example list. Cards with
// no owned keyword/trigger fall back to two flavor buckets: "Boars & Beasts"
// (wild creatures) and "Village & Hearth" (generic support/utility).
//
// A card not listed here (e.g. a brand-new card added by a future session
// before this file is updated) falls back to "Uncategorized" in the deck
// builder rather than crashing — see deckbuilder.js familyOf().
export const FAMILIES = [
  {
    id: 'boars_beasts', name: 'Boars & Beasts',
    cardIds: ['young_boar', 'wild_boar', 'boar_matron', 'darkwood_wolf', 'pack_alpha', 'dire_wolf', 'thicket_beast'],
  },
  {
    id: 'village_hearth', name: 'Village & Hearth',
    cardIds: [
      'quartermaster', 'hearth_keeper', 'ember_bolt', 'kindled_fury', 'wolf_howl', 'controlled_burn',
      'hearth_meal', 'sudden_spark', 'second_wind', 'ashen_rite', 'scout_ahead', 'rally_the_line',
      'shakedown', 'farmhands_boy', 'stout_plowman', 'yoke_ox', 'old_drover', 'cobb', 'harrows_plow_ox',
    ],
  },
  {
    id: 'redsash_bandits', name: 'Red-Sash Bandits',
    cardIds: [
      'tusker', 'red_sash_cutpurse', 'camp_torcher', 'nightstalker', 'red_sash_ambusher',
      'red_sash_picklock', 'masked_raider', 'vex', 'wayside_watcher', 'uninvited_guest',
    ],
  },
  {
    id: 'frenzied_warband', name: 'Frenzied Warband',
    cardIds: [
      'red_sash_duelist', 'tuskblade_berserker', 'scrap_dog', 'hotblood_recruit', 'twinblade_mercenary',
      'reckless_charge', 'kestrel', 'warband_champion',
    ],
  },
  {
    id: 'wardens_of_the_line', name: 'Wardens of the Line',
    cardIds: [
      'gruk', 'militia_recruit', 'village_warden', 'emberwood_colossus', 'forest_sow', 'warden_captain',
      'rootbound_titan', 'cinder_warden', 'line_holder', 'shieldwall_sergeant', 'stand_and_hold', 'rowan',
      'bastion_keep', 'charnel_colossus', 'red_sash_watchman', 'bogfire_colossus',
    ],
  },
  {
    id: 'ward_and_shrine', name: 'Ward & Shrine',
    cardIds: [
      'beacon_mage', 'warded_acolyte', 'sanctum_guardian', 'shrine_elder', 'pilgrims_vow',
      'patient_sentry', 'ridgewatch_warden', 'halvard',
    ],
  },
  {
    id: 'crimson_guard', name: 'Crimson Guard',
    cardIds: ['bloodmoon_wolf', 'sworn_medic', 'hearthguard_veteran', 'crimson_vow', 'verity', 'hearthbound_champion'],
  },
  {
    id: 'piercing_vanguard', name: 'Piercing Vanguard',
    cardIds: ['ironhide_boar', 'warthog_battering_ram', 'boar_lancer', 'tusked_reaver', 'honed_tusks', 'first_tusk'],
  },
  {
    id: 'graveyard_remembers', name: 'The Graveyard Remembers',
    cardIds: [
      'ashen_shambler', 'last_rites', 'second_harvest', 'charnel_hound', 'grave_caller',
      'bone_delver', 'unquiet_grave', 'marrow', 'charnel_pup',
    ],
  },
  {
    id: 'kindle_kin', name: 'Kindle-Kin',
    cardIds: [
      'ash_sprite', 'flame_tender', 'pyre_keeper', 'stoke_the_flames', 'toll_urchin', 'ledger_keeper',
      'tollgate_ram', 'open_the_gate', 'tarn', 'tollroad_colossus', 'willow_wisp', 'bog_kindler',
      'rekindle_the_dead', 'pyre_caller', 'hessa',
    ],
  },
  {
    id: 'ashfall', name: 'Ashfall',
    // The Ashen Sentinel's onDeath/onAllyDeath payoffs — previously
    // uncategorized; promoted to a gated banner so she can lead it (leaders.js).
    // cinderfall_rite (enchantment) is left neutral, mirroring the set-wide rule
    // that card-TYPE families stay neutral.
    cardIds: ['ember_husk', 'watchfire_whelp', 'ashbound_warden', 'feed_the_fire', 'sentinel', 'ashfall_colossus'],
  },
  {
    id: 'relics', name: 'Relics',
    cardIds: [
      'tusk_talisman', 'wardenplate', 'ember_fang', 'piercing_barb', 'widows_kiss', 'stolen_blade',
      'blessed_icon', 'watchers_oath', 'twin_fangs', 'tusks_of_the_hollow', 'delvers_pick',
      'sentrys_cloak', 'false_camp',
    ],
  },
  {
    id: 'reactions', name: 'Reactions',
    cardIds: [
      'hidden_snare', 'boar_pit', 'alarm_bell', 'warding_bell', 'counterspark', 'ambush_horn',
      'shrines_grace', 'cinderpass_snare', 'backdraft', 'ashfall_recall', 'quick_fingers',
      'roadblock', 'turned_tables',
    ],
  },
  {
    id: 'enchantments', name: 'Enchantments',
    cardIds: [
      'herd_instinct', 'bastion_oath', 'ember_communion', 'ashen_vigil', 'warding_litany',
      'bulwark_doctrine', 'bandit_creed', 'boarlords_fury', 'verities_oath', 'mire_toll',
    ],
  },

  // New-mechanics families (see cards.js "NEW-MECHANICS PASS"). Left out of
  // factions.js FACTION_OF_FAMILY on purpose, so — like the card-TYPE families
  // above — they stay NEUTRAL: freely buildable, earning no standing, gated by
  // nobody's rank ladder.
  {
    id: 'armory', name: 'The Armory',
    // equipment — persistent gear that returns to hand when its wielder falls
    cardIds: ['old_whetstone', 'emberforged_blade', 'oaken_aegis', 'travelers_cloak', 'huntsmans_longbow', 'everburning_brand'],
  },
  {
    id: 'thieves_cant', name: "Thieves' Cant",
    // hand disruption — attack the opponent's hand
    cardIds: ['sticky_fingers', 'cutpurse_raid', 'extortionist', 'midnight_raid', 'misdirection'],
  },
  {
    id: 'desperate_measures', name: 'Desperate Measures',
    // additional-cost (discard) — above-rate effects paid for in cards
    cardIds: ['desperate_gambit', 'pyre_offering', 'grim_bargain'],
  },
  {
    id: 'wildcaller', name: 'The Wildcaller',
    // conjuration — summon random creatures from a pool
    cardIds: ['low_whistle', 'wild_summons', 'call_of_the_wild', 'old_whistler', 'something_comes'],
  },
  {
    id: 'adepts', name: 'The Adepts',
    // activated abilities — creatures that pay off round after round
    cardIds: ['emberkin_adept', 'hearth_channeler', 'bog_witch', 'warcry_captain', 'spark_conjurer'],
  },
];
