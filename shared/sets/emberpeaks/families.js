// Emberpeaks banner grouping — the cross-set half of the Leader system.
//
// Mirrors core/families.js but for the `emberpeaks` set. banners.js merges
// this with the core families so the gate/constraint engine treats an
// Emberpeaks card exactly like a core banner card. Kept in the set's OWN folder
// (never core/) so it doesn't collide with core-authoring sessions — same
// rationale as emberpeaks/duelists.js and emberpeaks/cards.js.
//
// One gated banner: the fire creatures + spells. The three card-TYPE cards
// (ep_brand_of_embers relic, ep_flare_trap reaction, ep_eternal_pyre
// enchantment) are deliberately LEFT OUT — with no family they fall through to
// neutral (bannerOf → null), matching the set-wide rule that relics/reactions/
// enchantments stay playable in any deck.
export const EMBERPEAKS_FAMILIES = [
  {
    id: 'emberpeaks_fire', name: 'The Emberpeaks',
    cardIds: [
      'ep_cinder_imp', 'ep_ashling', 'ep_magma_pup', 'ep_ember_drake', 'ep_cinder_acolyte',
      'ep_lavaback', 'ep_flame_revenant', 'ep_obsidian_golem', 'ep_cinderwyrm',
      'ep_ember_lash', 'ep_fan_the_flames', 'ep_immolate', 'ep_wildfire',
    ],
  },
];
