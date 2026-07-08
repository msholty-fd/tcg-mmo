// Emberpeaks duelists — the fire roster that lives in the volcanic basin
// beyond Cinderpass. Kept in the set's OWN folder (not core/duelists.js) so
// this never collides with the parallel core-duelist sessions; merged into
// the DUELISTS map at the two import sites (client/src/world.js and
// server/index.js) via `{ ...CORE_DUELISTS, ...EMBERPEAKS_DUELISTS }`.
//
// Decks are drawn from the `emberpeaks` set (ep_* ids, registered in
// ./cards.js). Beating these duelists is how the fire set enters circulation
// (reward pools) — the founding pillar: "shipping a new zone ships a new set."
// All decks are exactly 30 cards, ≤3 copies each, like every other roster.

// A lesser basin guardian — aggressive ember/burn tempo.
const ashmongerDeck = [
  'ep_cinder_imp', 'ep_cinder_imp', 'ep_cinder_imp',
  'ep_magma_pup', 'ep_magma_pup', 'ep_magma_pup',
  'ep_ashling', 'ep_ashling', 'ep_ashling',
  'ep_ember_drake', 'ep_ember_drake', 'ep_ember_drake',
  'ep_cinder_acolyte', 'ep_cinder_acolyte',
  'ep_ember_lash', 'ep_ember_lash',
  'ep_flame_revenant', 'ep_flame_revenant',
  'ep_immolate', 'ep_immolate',
  'ep_lavaback', 'ep_lavaback',
  'ep_fan_the_flames',
  'ep_brand_of_embers',
  'ep_flare_trap', 'ep_flare_trap',
  'ep_eternal_pyre', 'ep_eternal_pyre',
  'ep_wildfire',
  'ep_obsidian_golem',
];

// The zone boss — a control/finisher fire deck: kindle-punish, big burn, and
// Cinderwyrm/Obsidian Golem top end.
const pyrelordDeck = [
  'ep_cinder_imp', 'ep_cinder_imp', 'ep_cinder_imp',
  'ep_ember_lash', 'ep_ember_lash',
  'ep_flare_trap', 'ep_flare_trap',
  'ep_ember_drake', 'ep_ember_drake', 'ep_ember_drake',
  'ep_cinder_acolyte', 'ep_cinder_acolyte',
  'ep_eternal_pyre', 'ep_eternal_pyre', 'ep_eternal_pyre',
  'ep_immolate', 'ep_immolate', 'ep_immolate',
  'ep_flame_revenant', 'ep_flame_revenant', 'ep_flame_revenant',
  'ep_lavaback', 'ep_lavaback',
  'ep_wildfire', 'ep_wildfire',
  'ep_obsidian_golem', 'ep_obsidian_golem',
  'ep_cinderwyrm', 'ep_cinderwyrm', 'ep_cinderwyrm',
];

export const EMBERPEAKS_DUELISTS = {
  ashmonger: {
    name: 'Ashmonger Cael', deck: ashmongerDeck,
    rewards: [...ashmongerDeck, 'ep_ember_drake', 'ep_flame_revenant', 'ep_brand_of_embers'],
  },
  pyrelord: {
    name: 'Ignarok, the Pyrelord', deck: pyrelordDeck,
    rewards: [...pyrelordDeck, 'ep_cinderwyrm', 'ep_eternal_pyre', 'ep_obsidian_golem'],
  },
};
