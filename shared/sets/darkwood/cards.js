// Darkwood set (set id 'darkwood') — the Deep Darkwood's zone set, Phase 2
// of the zone plan (DESIGN.md "The Deep Darkwood"). Theme: NIGHT-MATTERS —
// the one axis no duelist owns. New card field `nocturnal: {atk, hp}`: the
// creature enters play with the bonus when the duel is under night (the
// server-synced 20:00–6:00 window, fixed at duel start — see
// engine/state.js unitFromCard). Everything else reuses existing effect
// primitives and keywords; the only engine change is the nocturnal field.
//
// LORE.md grounding: the wood is where the land is *forgetting* (canon fact
// 7). Its creatures are what moves in a place the fire no longer remembers —
// they are stronger where the light is not. Flavor references the Circle of
// Sighs, Weir's camp, and the wisps without explaining any of them (Act II
// is reserved; see LORE.md rules).
//
// Registered via side-effect import next to core/emberpeaks (duelManager.js,
// duelRoom.js). Cards enter circulation with Phase 3 (the zone's duelists'
// reward pools) and 3b (zone pack) — the Emberpeaks Phase-2 precedent.
import { registerCards } from '../../engine/cards.js';

registerCards([
  // ---- creatures: what walks the gloom ----
  { id: 'dw_glowcap_sprite', set: 'darkwood', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 1,
    nocturnal: { atk: 1, hp: 1 }, storiedKeyword: 'ward',
    name: 'Glowcap Sprite', text: 'Nocturnal — at night: +1/+1.', flavor: 'It sleeps through noon and calls it mercy.' },
  { id: 'dw_dusk_moth', set: 'darkwood', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 3,
    nocturnal: { atk: 2, hp: 0 },
    name: 'Dusk Moth', text: 'Nocturnal — at night: +2 attack.', flavor: 'It knows every light left burning in the wood.' },
  { id: 'dw_thicket_prowler', set: 'darkwood', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 2,
    nocturnal: { atk: 1, hp: 1 },
    name: 'Thicket Prowler', text: 'Nocturnal — at night: +1/+1.', flavor: 'Day is for hiding. Night is for the road.' },
  { id: 'dw_gloom_owl', set: 'darkwood', rarity: 'common', type: 'creature', cost: 3, atk: 2, hp: 2,
    nocturnal: { atk: 1, hp: 1 },
    triggers: { onPlay: [{ effect: 'draw', amount: 1 }] },
    name: 'Gloom Owl', text: 'When played, draw a card. Nocturnal — at night: +1/+1.',
    flavor: "It has seen what puts the fires out. It isn't telling." },
  { id: 'dw_shade_of_the_wood', set: 'darkwood', rarity: 'uncommon', type: 'creature', cost: 3, atk: 3, hp: 2, keywords: ['lifesteal'],
    nocturnal: { atk: 1, hp: 1 },
    name: 'Shade of the Wood', text: 'Lifesteal. Nocturnal — at night: +1/+1.',
    flavor: 'Not everything the wood forgot agreed to go.' },
  { id: 'dw_gnarlwood_sentry', set: 'darkwood', rarity: 'uncommon', type: 'creature', cost: 4, atk: 2, hp: 6, keywords: ['guardian'],
    nocturnal: { atk: 1, hp: 1 },
    name: 'Gnarlwood Sentry', text: 'Guardian. Nocturnal — at night: +1/+1.',
    flavor: 'The trees crooked themselves around something worth guarding.' },
  { id: 'dw_pale_hart', set: 'darkwood', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 4, storiedKeyword: 'guardian',
    nocturnal: { atk: 2, hp: 2 },
    triggers: { onPlay: [{ effect: 'heal', target: 'ownHearth', amount: 4 }] },
    name: 'The Pale Hart', text: 'When played, restore 4 Hearth. Nocturnal — at night: +2/+2.',
    flavor: 'Seen at dusk, at a distance, once. Nobody follows.' },
  { id: 'dw_hollow_shade', set: 'darkwood', rarity: 'rare', type: 'creature', cost: 6, atk: 6, hp: 6,
    nocturnal: { atk: 2, hp: 2 },
    name: 'Hollow Shade', text: 'Nocturnal — at night: +2/+2.',
    flavor: "What the land forgets doesn't always forget the land." },

  // ---- spells ----
  { id: 'dw_carried_coal', set: 'darkwood', rarity: 'common', type: 'spell', cost: 1,
    triggers: { onPlay: [{ effect: 'heal', target: 'ownHearth', amount: 3 }] },
    name: 'Carried Coal', text: 'Restore 3 Hearth.',
    flavor: 'A coal from a tended fire, cupped against the dark.' },
  { id: 'dw_hunters_lament', set: 'darkwood', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 4 }] }, needsTarget: 'enemyUnit',
    name: "Hunter's Lament", text: 'Deal 4 damage to an enemy creature.',
    flavor: "Weir's last arrow, found stuck in nothing." },
  { id: 'dw_night_chorus', set: 'darkwood', rarity: 'uncommon', type: 'spell', cost: 4,
    triggers: { onPlay: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 1 }] },
    name: 'Night Chorus', text: 'Your creatures get +1/+1.',
    flavor: 'After dark the wood sings, and the song has teeth.' },

  // ---- relic ----
  { id: 'dw_circle_chip', set: 'darkwood', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 3 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'ward' }] }, needsTarget: 'ownUnit',
    name: 'Circle Chip', text: 'Attach: your creature gets +3 health and Ward.',
    flavor: 'A chip of the fallen eighth stone. It still hums.' },

  // ---- reaction ----
  { id: 'dw_moonlit_reprisal', set: 'darkwood', rarity: 'rare', type: 'reaction', cost: 3,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 3 }] },
    name: 'Moonlit Reprisal', text: 'Reaction — when an enemy attacks: deal 3 damage to it.',
    flavor: 'The wood answers after dark.' },

  // ---- enchantments (persistent) ----
  { id: 'dw_wisp_ring', set: 'darkwood', rarity: 'uncommon', type: 'enchantment', cost: 3,
    triggers: { endOfTurn: [{ effect: 'heal', target: 'ownHearth', amount: 1 }] },
    name: 'Wisp Ring', text: 'At the end of your turn, restore 1 Hearth.',
    flavor: 'The wisps circle where the stones remember a fire.' },
  { id: 'dw_seventh_stone', set: 'darkwood', rarity: 'rare', type: 'enchantment', cost: 5,
    triggers: { startOfTurn: [{ effect: 'heal', target: 'allAllies', amount: 1 }] },
    name: 'The Seventh Stone', text: 'At the start of your turn, restore 1 health to your creatures.',
    flavor: "Seven still stand. Ask the eighth what leaving costs." },
]);
