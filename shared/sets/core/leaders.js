// The Leader roster — the CONTENT/TUNING surface of the Leader system.
//
// A Leader is an ordinary card you own (it sits in your 30 and pays Legend
// Budget like any card) that you *designate* to fly a banner. Doing so:
//   - unlocks that banner's gated cards (you can't run them otherwise), and
//   - imposes the Leader's constraints on your whole deck.
// Stacking Leaders stacks constraints against a fixed 30, which is the
// difficulty knob (see DESIGN.md "Leaders"). Zero Leaders = a neutral-only deck.
//
// Every gated banner (banners.js BANNERS) MUST have at least one Leader here,
// or its cards would be unplayable — the test in scripts/test-leaders.mjs
// asserts exactly that, plus that each Leader's card exists and belongs to its
// banner. `banner` is a families.js/banners.js family id.
//
// Constraint primitives (shared/deckConstraints.js): minBanner{n},
// costParity{parity}, singleton, requireType{type,n}, banType{type},
// maxType{type,n}, minKeyword{keyword,n}, banKeyword{keyword}, maxCost{n}.
// Tune the numbers freely — bigger `n` = more all-in, smaller = more splashable.
//
// ROSTER SHAPE (see DESIGN.md "Leaders — regional champions"):
//   - The three starter-tier Leaders are handed with a fresh deck (a working
//     banner deck on card one). Every OTHER Leader is COLLECTIBLE only — its
//     card sits in a region duelist's reward pool, never granted. The test in
//     scripts/test-leaders.mjs asserts every Leader card is either starter-tier
//     or reachable from some DUELISTS reward pool.
//   - Most banners offer TWO champions so a region gives the player a choice of
//     playstyle: a splashable one and an all-in / bespoke-rule one. The comments
//     name the region + duelist whose pool drops each collectible champion.

// The starter-granted champions (also collectible elsewhere, see below).
export const STARTER_LEADERS = ['pack_alpha', 'shieldwall_sergeant', 'red_sash_ambusher'];

export const LEADERS = {
  // ============ STARTER-TIER (granted with a fresh deck) ============
  // Modest demand, no exotic rules — the training champions.
  pack_alpha:         { banner: 'boars_beasts',        constraints: [{ kind: 'minBanner', n: 8 }] },
  shieldwall_sergeant:{ banner: 'wardens_of_the_line', constraints: [{ kind: 'minBanner', n: 10 }] },
  red_sash_ambusher:  { banner: 'redsash_bandits',     constraints: [{ kind: 'minBanner', n: 8 }] },

  // ============ MEADOWBROOK VILLAGE (Rowan, Maren) ============
  // Rowan → Wardens (guardian). All-in wall vs the starter sergeant's splash.
  rowan:              { banner: 'wardens_of_the_line', constraints: [{ kind: 'minBanner', n: 12 }] },
  // Maren the Shrinekeeper → Ward. A pure ward wall (the choice-partner to
  // Cinderpass's reaction-heavy Halvard). Previously Maren dropped no champion.
  sanctum_guardian:   { banner: 'ward_and_shrine',     constraints: [{ kind: 'minBanner', n: 10 }] },

  // ============ RED-SASH CAMP (Vex, Kestrel) ============
  vex:                { banner: 'redsash_bandits',     constraints: [{ kind: 'minBanner', n: 12 }] },
  kestrel:            { banner: 'frenzied_warband',    constraints: [{ kind: 'minBanner', n: 8 }] },
  // Warband Champion → Frenzy. Kestrel's all-in partner: pure aggression, no
  // reaction tricks (mirrors Gruk's no-tricks identity for a different banner).
  warband_champion:   { banner: 'frenzied_warband',    constraints: [{ kind: 'minBanner', n: 10 }, { kind: 'banType', type: 'reaction' }] },

  // ============ GRUK'S HOLLOW (Gruk) ============
  // Gruk plays with no tricks: an all-guardian wall, and not a single reaction.
  gruk:               { banner: 'wardens_of_the_line', constraints: [{ kind: 'minBanner', n: 10 }, { kind: 'banType', type: 'reaction' }] },
  tusked_reaver:      { banner: 'piercing_vanguard',   constraints: [{ kind: 'minBanner', n: 6 }] },
  // Boar Lancer → Piercing. The all-in tusker charge vs the Reaver's splash.
  boar_lancer:        { banner: 'piercing_vanguard',   constraints: [{ kind: 'minBanner', n: 10 }] },

  // ============ HIGHGATE (Verity, Tarn) ============
  verity:             { banner: 'crimson_guard',       constraints: [{ kind: 'minBanner', n: 6 }] },
  // Hearthbound Champion → Lifesteal. The heavy-commitment crimson finisher.
  hearthbound_champion:{ banner: 'crimson_guard',      constraints: [{ kind: 'minBanner', n: 9 }] },
  // Tarn the Tollkeeper takes his cut in odd coins: odd costs only.
  tarn:               { banner: 'kindle_kin',          constraints: [{ kind: 'minBanner', n: 8 }, { kind: 'costParity', parity: 'odd' }] },

  // ============ HOLLOWMERE (Hessa) ============
  // Old Hessa → Kindle. Mono-kindle devotion vs Tarn's odd-cost gimmick — a
  // second kindle champion, and Hollowmere's first champion of any kind.
  hessa:              { banner: 'kindle_kin',          constraints: [{ kind: 'minBanner', n: 12 }] },

  // ============ CINDERHOLLOW MINE (Marrow) ============
  // Marrow's grave is lean and hungry: one of each card, no duplicates.
  marrow:             { banner: 'graveyard_remembers', constraints: [{ kind: 'minBanner', n: 6 }, { kind: 'singleton' }] },
  // Grave Caller → Graveyard. The big, redundant grave-grinder — the opposite
  // of Marrow's lean singleton build.
  grave_caller:       { banner: 'graveyard_remembers', constraints: [{ kind: 'minBanner', n: 10 }] },

  // ============ CINDERPASS (Halvard) ============
  // Halvard holds the shrine through counterplay: at least four reactions set.
  halvard:            { banner: 'ward_and_shrine',     constraints: [{ kind: 'minBanner', n: 6 }, { kind: 'requireType', type: 'reaction', n: 4 }] },
};

// cardIds that can be designated as Leaders (for quick membership checks).
export const isLeaderCard = cardId => Object.prototype.hasOwnProperty.call(LEADERS, cardId);
