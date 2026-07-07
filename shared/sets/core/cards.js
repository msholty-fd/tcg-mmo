// Core set — "Emberwood" (EMB). Keywords in play:
//   ambush    — can attack the turn it's played
//   guardian  — enemies must attack this unit first
//   ward      — can't be targeted by enemy spells
//   frenzy    — attacks twice per turn
//   lifesteal — attacking restores that much Hearth
//   piercing  — excess damage from kills carries to the enemy Hearth
//
// storiedKeyword: the keyword this card gains at Storied renown (Chronicle L3).
import { registerCards } from '../../engine/cards.js';

registerCards([
  // ---- creatures: boars & beasts ----
  { id: 'young_boar', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 2, hp: 1, storiedKeyword: 'ambush',
    name: 'Young Boar', text: '', flavor: 'All tusk, no plan.' },
  { id: 'wild_boar', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 3, storiedKeyword: 'piercing',
    name: 'Wild Boar', text: '', flavor: 'Turnip enthusiast.' },
  { id: 'tusker', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 4, hp: 2, keywords: ['ambush'], storiedKeyword: 'frenzy',
    name: 'Charging Tusker', text: '', flavor: 'Never saw a fence it respected.' },
  { id: 'boar_matron', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 5,
    triggers: { onDeath: [{ effect: 'summon', token: 'young_boar', count: 2 }] },
    name: 'Boar Matron', text: 'When she dies, summon two Young Boars.', flavor: 'The herd provides.' },
  { id: 'darkwood_wolf', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 3, hp: 3, storiedKeyword: 'lifesteal',
    triggers: { onAttack: [{ effect: 'buff', target: 'self', atk: 1 }] },
    name: 'Darkwood Wolf', text: 'Whenever this attacks, it gains +1 attack.', flavor: 'The pack remembers.' },
  { id: 'pack_alpha', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 4,
    triggers: { onPlay: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }] },
    name: 'Pack Alpha', text: 'When played, your other creatures get +1 attack.', flavor: 'First among tusks and teeth.' },
  { id: 'gruk', set: 'core', rarity: 'rare', type: 'creature', cost: 7, atk: 7, hp: 7, keywords: ['guardian'],
    triggers: { onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 2 }] },
    name: 'Gruk, the Boar King', text: 'When played, deal 2 damage to all enemy creatures.', flavor: 'The hollow of bones is his throne room.' },

  // ---- creatures: villagers & wardens ----
  { id: 'militia_recruit', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 2, keywords: ['guardian'],
    name: 'Militia Recruit', text: '', flavor: 'Standing exactly where he was told.' },
  { id: 'village_warden', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 2, hp: 4, keywords: ['guardian'],
    name: 'Village Warden', text: '', flavor: 'Keep to the roads after dark.' },
  { id: 'quartermaster', set: 'core', rarity: 'uncommon', type: 'creature', cost: 2, atk: 1, hp: 3,
    triggers: { onPlay: [{ effect: 'draw', amount: 1 }] },
    name: 'Quartermaster', text: 'When played, draw a card.', flavor: 'Everything in its place, twice counted.' },
  { id: 'hearth_keeper', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 3,
    triggers: { startOfTurn: [{ effect: 'heal', target: 'ownHearth', amount: 1 }] },
    name: 'Hearth Keeper', text: 'At the start of your turn, restore 1 to your Hearth.', flavor: 'The fire never dies on her watch.' },
  { id: 'beacon_mage', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 3, hp: 3, keywords: ['ward'],
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 2 }] },
    needsTarget: 'enemyUnit',
    name: 'Beacon Mage', text: 'When played, deal 2 damage to an enemy creature.', flavor: 'Light that answers back.' },

  // ---- creatures: bandits ----
  { id: 'red_sash_cutpurse', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 3, hp: 1, keywords: ['ambush'],
    name: 'Red-Sash Cutpurse', text: '', flavor: 'Taxes travelers with knives.' },
  { id: 'red_sash_duelist', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 3, keywords: ['frenzy'],
    name: 'Red-Sash Duelist', text: '', flavor: 'No manners. Twice.' },
  { id: 'camp_torcher', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 2,
    triggers: { onDeath: [{ effect: 'damage', target: 'randomEnemy', amount: 2 }] },
    name: 'Camp Torcher', text: 'When this dies, deal 2 damage to a random enemy.', flavor: 'Goes out with a bang.' },

  // ---- spells ----
  { id: 'ember_bolt', set: 'core', rarity: 'common', type: 'spell', cost: 1,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 2 }] }, needsTarget: 'any',
    name: 'Ember Bolt', text: 'Deal 2 damage to anything.', flavor: 'The forest\'s oldest argument.' },
  { id: 'kindled_fury', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 1 }] }, needsTarget: 'anyUnit',
    name: 'Kindled Fury', text: 'Give a creature +2/+1.', flavor: 'Feed the spark.' },
  { id: 'wolf_howl', set: 'core', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'summon', token: 'darkwood_wolf', count: 1 }, { effect: 'draw', amount: 1 }] },
    name: 'Wolf Howl', text: 'Summon a Darkwood Wolf and draw a card.', flavor: 'The dark answers.' },
  { id: 'controlled_burn', set: 'core', rarity: 'rare', type: 'spell', cost: 5,
    triggers: { onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 3 }] },
    name: 'Controlled Burn', text: 'Deal 3 damage to all enemy creatures.', flavor: 'Mostly controlled.' },
  { id: 'hearth_meal', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'heal', target: 'ownHearth', amount: 5 }] },
    name: 'Hearth Meal', text: 'Restore 5 to your Hearth.', flavor: 'Warm bread, warmer hearth.' },
  { id: 'sudden_spark', set: 'core', rarity: 'uncommon', type: 'spell', cost: 0,
    triggers: { onPlay: [{ effect: 'emberGain', amount: 2 }] },
    name: 'Sudden Spark', text: 'Gain 2 Ember this turn.', flavor: 'Now. NOW.' },

  // ---- creatures: new blood ----
  { id: 'nightstalker', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 4, hp: 2, keywords: ['ambush', 'lifesteal'],
    name: 'Darkwood Nightstalker', text: '', flavor: 'The dark under the trees, on the hunt.' },
  { id: 'ironhide_boar', set: 'core', rarity: 'uncommon', type: 'creature', cost: 5, atk: 4, hp: 6, keywords: ['piercing'],
    name: 'Ironhide Boar', text: '', flavor: 'Fences, walls, militias — all the same to him.' },
  { id: 'emberwood_colossus', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 6, hp: 6, keywords: ['guardian'], storiedKeyword: 'piercing',
    name: 'Emberwood Colossus', text: '', flavor: 'The forest, when it stands up.' },

  // ---- relics (attach to one of your creatures) ----
  { id: 'tusk_talisman', set: 'core', rarity: 'common', type: 'relic', cost: 1,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 0 }] }, needsTarget: 'ownUnit',
    name: 'Tusk Talisman', text: 'Attach: your creature gets +2 attack.', flavor: 'Worn tusk, sharp memory.' },
  { id: 'wardenplate', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 3 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'guardian' }] }, needsTarget: 'ownUnit',
    name: 'Wardenplate', text: 'Attach: your creature gets +3 health and Guardian.', flavor: 'Issued, dented, trusted.' },
  { id: 'ember_fang', set: 'core', rarity: 'rare', type: 'relic', cost: 3,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 1 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'lifesteal' }] }, needsTarget: 'ownUnit',
    name: 'Ember Fang', text: 'Attach: your creature gets +2/+1 and Lifesteal.', flavor: 'Still warm.' },

  // ---- new spells ----
  { id: 'second_wind', set: 'core', rarity: 'uncommon', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 2 }, { effect: 'refresh', target: 'chosen' }] }, needsTarget: 'ownUnit',
    name: 'Second Wind', text: 'Your creature gets +0/+2 and may attack again.', flavor: 'Get up.' },
  { id: 'ashen_rite', set: 'core', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 4 }] }, needsTarget: 'enemyUnit',
    name: 'Ashen Rite', text: 'Deal 4 damage to an enemy creature.', flavor: 'Ash remembers what fire forgets.' },
]);

// Starter decks (30 cards) — what a new character begins with,
// and what village-tier duelists play.
export const STARTER_DECKS = {
  boarherd: [
    'young_boar','young_boar','young_boar','wild_boar','wild_boar','wild_boar',
    'tusker','tusker','boar_matron','boar_matron','darkwood_wolf','darkwood_wolf',
    'pack_alpha','militia_recruit','militia_recruit','quartermaster','quartermaster',
    'ember_bolt','ember_bolt','ember_bolt','kindled_fury','kindled_fury',
    'wolf_howl','hearth_meal','hearth_meal','sudden_spark','sudden_spark',
    'village_warden','village_warden','gruk',
  ],
  wardens: [
    'militia_recruit','militia_recruit','militia_recruit','village_warden','village_warden','village_warden',
    'quartermaster','quartermaster','hearth_keeper','hearth_keeper','beacon_mage','beacon_mage',
    'wild_boar','wild_boar','darkwood_wolf','darkwood_wolf','pack_alpha',
    'ember_bolt','ember_bolt','ember_bolt','hearth_meal','hearth_meal','hearth_meal',
    'kindled_fury','kindled_fury','controlled_burn','sudden_spark','sudden_spark',
    'camp_torcher','camp_torcher',
  ],
  redsash: [
    'red_sash_cutpurse','red_sash_cutpurse','red_sash_cutpurse','red_sash_duelist','red_sash_duelist','red_sash_duelist',
    'camp_torcher','camp_torcher','camp_torcher','tusker','tusker','young_boar','young_boar',
    'ember_bolt','ember_bolt','ember_bolt','kindled_fury','kindled_fury','sudden_spark','sudden_spark',
    'wild_boar','wild_boar','darkwood_wolf','darkwood_wolf','quartermaster','quartermaster',
    'controlled_burn','wolf_howl','hearth_meal','pack_alpha',
  ],
};
