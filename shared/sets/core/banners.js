// Banners: the deck-building identity axis the Leader system gates on.
//
// A *banner* is one of the mechanical-identity families from families.js
// promoted to a GATED pool: you may not include any of a banner's cards in a
// deck unless you field a Leader of that banner (see shared/deckConstraints.js
// and shared/sets/core/leaders.js). Families that are generic support or
// card-TYPE buckets stay NEUTRAL — playable in any deck, no Leader required.
//
// Design decisions this encodes (see DESIGN.md "Leaders"):
//   - Gate on FAMILY (families.js is a clean 1:1 map — no overlap, easy to
//     reason about). bannerOf(cardId) is a card's single gating banner.
//   - Count demand on FAMILY *or* KEYWORD (matchesBanner) so small banners
//     (piercing has only 5 family cards) can still reach a Leader's demand by
//     pulling in same-keyword cards that happen to live in another family.
// The split lives here rather than as a field on 160 card defs, for the same
// reason families.js does: low-diff, no collision with card-authoring sessions.

import { FAMILIES } from './families.js';
import { EMBERPEAKS_FAMILIES } from '../emberpeaks/families.js';

// The banner registry is GLOBAL across sets. It lives in core/ for historical
// reasons, but aggregates every set's families here — a new set adds its
// families to this merge (and its Leaders to leaders.js). If a third set lands,
// consider promoting this to a per-set registry instead of a hand-merge.
const ALL_FAMILIES = [...FAMILIES, ...EMBERPEAKS_FAMILIES];

// Families that are NOT banners: generic support + the card-TYPE families +
// the new-mechanics families (armory/thieves_cant/desperate_measures/
// wildcaller/adepts — kept neutral to match factions.js, so they're freely
// buildable and need no Leader). Everything else (a creature/keyword
// identity) is gated.
const NEUTRAL_FAMILIES = new Set([
  'village_hearth', 'relics', 'reactions', 'enchantments',
  'armory', 'thieves_cant', 'desperate_measures', 'wildcaller', 'adepts',
]);

// A banner's signature keyword, used only to BROADEN demand counting (not
// gating). Trigger-themed banners (boars, graveyard, kindle) have no single
// keyword and count by family membership alone.
export const BANNER_KEYWORD = {
  redsash_bandits: 'ambush',
  frenzied_warband: 'frenzy',
  wardens_of_the_line: 'guardian',
  ward_and_shrine: 'ward',
  crimson_guard: 'lifesteal',
  piercing_vanguard: 'piercing',
};

// cardId -> family id (1:1, across all sets)
const FAMILY_BY_CARD = new Map();
for (const fam of ALL_FAMILIES) for (const id of fam.cardIds) FAMILY_BY_CARD.set(id, fam.id);

// The gated banners, in family order, with display names.
export const BANNERS = ALL_FAMILIES
  .filter(f => !NEUTRAL_FAMILIES.has(f.id))
  .map(f => ({ id: f.id, name: f.name, keyword: BANNER_KEYWORD[f.id] || null }));

const GATED = new Set(BANNERS.map(b => b.id));

// A card's single gating banner, or null if it's neutral / uncategorized.
export function bannerOf(cardId) {
  const fam = FAMILY_BY_CARD.get(cardId);
  return fam && GATED.has(fam) ? fam : null;
}

export function isGated(cardId) { return bannerOf(cardId) !== null; }

export function bannerName(bannerId) {
  const b = BANNERS.find(x => x.id === bannerId);
  return b ? b.name : bannerId;
}

// Does a card COUNT toward a banner's demand? Its own family matches, OR it
// carries the banner's signature keyword (broadening across families).
export function matchesBanner(def, bannerId) {
  if (!def) return false;
  if (FAMILY_BY_CARD.get(def.id) === bannerId) return true;
  const kw = BANNER_KEYWORD[bannerId];
  return !!kw && Array.isArray(def.keywords) && def.keywords.includes(kw);
}
