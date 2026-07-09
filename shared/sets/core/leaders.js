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

export const LEADERS = {
  // --- starter-tier Leaders (modest demand, no exotic rules) ---
  // These are the marquee non-boss cards a fresh character is handed with a
  // coherent starter deck, so new players meet the system on card one.
  pack_alpha:         { banner: 'boars_beasts',        constraints: [{ kind: 'minBanner', n: 8 }] },
  shieldwall_sergeant:{ banner: 'wardens_of_the_line', constraints: [{ kind: 'minBanner', n: 10 }] },
  red_sash_ambusher:  { banner: 'redsash_bandits',     constraints: [{ kind: 'minBanner', n: 8 }] },

  // --- earned "boss" Leaders (won from duelists) — heavier commitment ---
  vex:                { banner: 'redsash_bandits',     constraints: [{ kind: 'minBanner', n: 12 }] },
  rowan:              { banner: 'wardens_of_the_line', constraints: [{ kind: 'minBanner', n: 12 }] },
  kestrel:            { banner: 'frenzied_warband',    constraints: [{ kind: 'minBanner', n: 8 }] },
  verity:             { banner: 'crimson_guard',       constraints: [{ kind: 'minBanner', n: 6 }] },
  tusked_reaver:      { banner: 'piercing_vanguard',   constraints: [{ kind: 'minBanner', n: 6 }] },

  // Gruk plays with no tricks: an all-guardian wall, and not a single reaction.
  gruk:               { banner: 'wardens_of_the_line', constraints: [{ kind: 'minBanner', n: 10 }, { kind: 'banType', type: 'reaction' }] },

  // --- showcase bespoke constraints (a Leader is a puzzle, not a counter) ---
  // Tarn the Tollkeeper takes his cut in odd coins: odd costs only.
  tarn:               { banner: 'kindle_kin',          constraints: [{ kind: 'minBanner', n: 8 }, { kind: 'costParity', parity: 'odd' }] },
  // Marrow's grave is lean and hungry: one of each card, no duplicates.
  marrow:             { banner: 'graveyard_remembers', constraints: [{ kind: 'minBanner', n: 6 }, { kind: 'singleton' }] },
  // Halvard holds the shrine through counterplay: at least four reactions set.
  halvard:            { banner: 'ward_and_shrine',     constraints: [{ kind: 'minBanner', n: 6 }, { kind: 'requireType', type: 'reaction', n: 4 }] },
};

// cardIds that can be designated as Leaders (for quick membership checks).
export const isLeaderCard = cardId => Object.prototype.hasOwnProperty.call(LEADERS, cardId);
