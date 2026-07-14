// Darkwood duelists — the Deep Darkwood's roster, Phase 3 of the zone plan
// (DESIGN.md). Kept in the set's OWN folder like emberpeaks/duelists.js and
// merged into the DUELISTS map at the two import sites (client/src/world/
// lib.js and server/index.js). Beating them is how the darkwood set enters
// circulation (reward pools) — the founding pillar.
//
// Both decks are exactly 30 cards, ≤3 copies. Weir only manifests at night
// (the Sentinel's visibility gate in main.js), so his nocturnal-heavy deck
// always fights on its home condition — the zone boss *belongs* to his
// field, the way DESIGN.md's card-game direction wants.

// The gate: a charcoal-burner working the wood's edge — day-reachable,
// deliberately easier (roads duel easier than the camps they lead to).
// Darkwood support over boarherd-ish vanilla bodies; light on nocturnal
// creatures ON PURPOSE — she duels by day, where they're understated (the
// first tuning pass at 17 darkwood cards simmed 27% — under even the
// route-trainer band; this mix sims gate-tier).
const tamsinDeck = [
  'dw_glowcap_sprite', 'dw_glowcap_sprite',
  'dw_thicket_prowler', 'dw_thicket_prowler', 'dw_thicket_prowler',
  'dw_dusk_moth',
  'dw_gloom_owl', 'dw_gloom_owl',
  'dw_carried_coal', 'dw_carried_coal',
  'dw_hunters_lament', 'dw_hunters_lament',
  'dw_circle_chip', 'dw_circle_chip',
  'dw_night_chorus',
  'young_boar', 'young_boar', 'young_boar',
  'wild_boar', 'wild_boar', 'wild_boar',
  'thicket_beast', 'thicket_beast', 'thicket_beast',
  'dire_wolf', 'dire_wolf', 'dire_wolf',
  'hearth_meal', 'hearth_meal',
  'emberwood_colossus',
];

// The zone boss: Weir the Forgotten, night-only at the Circle of Sighs.
// Nocturnal everywhere it counts, healing to stall for the night bodies.
const weirDeck = [
  'dw_glowcap_sprite', 'dw_glowcap_sprite', 'dw_glowcap_sprite',
  'dw_dusk_moth', 'dw_dusk_moth', 'dw_dusk_moth',
  'dw_thicket_prowler', 'dw_thicket_prowler', 'dw_thicket_prowler',
  'dw_gloom_owl', 'dw_gloom_owl', 'dw_gloom_owl',
  'dw_shade_of_the_wood', 'dw_shade_of_the_wood',
  'dw_gnarlwood_sentry', 'dw_gnarlwood_sentry',
  'dw_pale_hart',
  'dw_hollow_shade',
  'dw_carried_coal', 'dw_carried_coal',
  'dw_hunters_lament', 'dw_hunters_lament',
  'dw_night_chorus', 'dw_night_chorus',
  'dw_circle_chip', 'dw_circle_chip',
  'dw_moonlit_reprisal',
  'dw_wisp_ring',
  'dw_seventh_stone',
  'weir',
];

export const DARKWOOD_DUELISTS = {
  tamsin: {
    name: 'Tamsin the Charcoal-Burner', deck: tamsinDeck,
    rewards: [...tamsinDeck, 'dw_gnarlwood_sentry', 'dw_shade_of_the_wood', 'dw_wisp_ring'],
  },
  weir: {
    name: 'Weir the Forgotten', deck: weirDeck,
    rewards: [...weirDeck, 'weir', 'dw_pale_hart', 'dw_seventh_stone'],
  },
};
