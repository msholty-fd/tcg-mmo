// Core set — "Emberwood" (EMB). Keywords in play:
//   ambush    — can attack the turn it's played
//   guardian  — enemies must attack this unit first
//   ward      — can't be targeted by enemy spells
//   frenzy    — attacks twice per turn
//   lifesteal — attacking restores that much Hearth
//   piercing  — excess damage from kills carries to the enemy Hearth
//
// storiedKeyword: the keyword this card gains at Storied renown (Chronicle L3).
import { registerCards, getCard } from '../../engine/cards.js';
import { FAMILIES } from './families.js';
import { LEADERS } from './leaders.js';
import { matchesBanner } from './banners.js';

registerCards([
  // ---- creatures: boars & beasts ----
  { id: 'young_boar', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 2, hp: 1, storiedKeyword: 'ambush',
    name: 'Young Boar', text: '', flavor: 'All tusk, no plan.' },
  { id: 'wild_boar', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 3, storiedKeyword: 'piercing',
    name: 'Wild Boar', text: '', flavor: 'Turnip enthusiast.' },
  { id: 'tusker', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 3, hp: 2, keywords: ['ambush'], storiedKeyword: 'frenzy',
    name: 'Charging Tusker', text: '', flavor: 'Never saw a fence it respected.' },
  { id: 'boar_matron', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 2, hp: 4,
    triggers: { onDeath: [{ effect: 'summon', token: 'young_boar', count: 2 }] },
    name: 'Boar Matron', text: 'When she dies, summon two Young Boars.', flavor: 'The herd provides.' },
  { id: 'darkwood_wolf', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 3, hp: 3, storiedKeyword: 'lifesteal',
    triggers: { onAttack: [{ effect: 'buff', target: 'self', atk: 1 }] },
    name: 'Darkwood Wolf', text: 'Whenever this attacks, it gains +1 attack.', flavor: 'The pack remembers.' },
  { id: 'pack_alpha', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 4,
    triggers: { onPlay: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }] },
    name: 'Pack Alpha', text: 'When played, your other creatures get +1 attack.', flavor: 'First among tusks and teeth.' },
  { id: 'gruk', set: 'core', rarity: 'rare', type: 'creature', cost: 7, atk: 6, hp: 6, keywords: ['guardian'],
    triggers: { onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 2 }] },
    name: 'Gruk, the Boar King', text: 'When played, deal 2 damage to all enemy creatures.', flavor: 'The hollow of bones is his throne room.' },

  // ---- creatures: villagers & wardens ----
  { id: 'militia_recruit', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 2, keywords: ['guardian'],
    name: 'Militia Recruit', text: '', flavor: 'Standing exactly where he was told.' },
  { id: 'village_warden', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 2, hp: 5, keywords: ['guardian'],
    name: 'Village Warden', text: '', flavor: 'Keep to the roads after dark.' },
  { id: 'quartermaster', set: 'core', rarity: 'uncommon', type: 'creature', cost: 2, atk: 1, hp: 3,
    triggers: { onPlay: [{ effect: 'draw', amount: 1 }] },
    name: 'Quartermaster', text: 'When played, draw a card.', flavor: 'Everything in its place, twice counted.' },
  { id: 'hearth_keeper', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 4,
    triggers: { startOfTurn: [{ effect: 'heal', target: 'ownHearth', amount: 2 }] },
    name: 'Hearth Keeper', text: 'At the start of your turn, restore 2 to your Hearth.', flavor: 'The fire never dies on her watch.' },
  { id: 'beacon_mage', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 4, hp: 4, keywords: ['ward'],
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 2 }] },
    needsTarget: 'enemyUnit',
    name: 'Beacon Mage', text: 'When played, deal 2 damage to an enemy creature.', flavor: 'Light that answers back.' },

  // ---- creatures: bandits ----
  { id: 'red_sash_cutpurse', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 3, hp: 1, keywords: ['ambush'],
    name: 'Red-Sash Cutpurse', text: '', flavor: 'Taxes travelers with knives.' },
  { id: 'red_sash_duelist', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 3, keywords: ['frenzy'],
    name: 'Red-Sash Duelist', text: '', flavor: 'No manners. Twice.' },
  { id: 'camp_torcher', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 3,
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
  { id: 'controlled_burn', set: 'core', rarity: 'rare', type: 'spell', cost: 4,
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

  // ---- reactions (set face-down, max 2; auto-fire on the named enemy event) ----
  { id: 'hidden_snare', set: 'core', rarity: 'common', type: 'reaction', cost: 1,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 2 }] },
    name: 'Hidden Snare', text: 'Reaction: when an enemy creature attacks, deal 2 damage to it.', flavor: 'The path was too quiet.' },
  { id: 'boar_pit', set: 'core', rarity: 'uncommon', type: 'reaction', cost: 2,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 4 }] },
    name: 'Boar Pit', text: 'Reaction: when an enemy creature attacks, deal 4 damage to it.', flavor: 'Dug for boars. Works on everything.' },
  { id: 'alarm_bell', set: 'core', rarity: 'common', type: 'reaction', cost: 2,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'summon', token: 'militia_recruit', count: 1 }] },
    name: 'Alarm Bell', text: 'Reaction: when an enemy creature attacks, summon a Militia Recruit.', flavor: 'The village answers its own.' },
  { id: 'warding_bell', set: 'core', rarity: 'uncommon', type: 'reaction', cost: 2,
    reaction: { on: 'enemyCreature', effects: [{ effect: 'damage', target: 'trigger', amount: 2 }] },
    name: 'Warding Bell', text: 'Reaction: when your opponent plays a creature, deal 2 damage to it.', flavor: 'Rung once for wolves, twice for worse.' },
  { id: 'counterspark', set: 'core', rarity: 'rare', type: 'reaction', cost: 3,
    reaction: { on: 'enemySpell', effects: [{ effect: 'counter' }] },
    name: 'Counterspark', text: "Reaction: when your opponent plays a spell, its effects don't happen.", flavor: 'Fire, meet firebreak.' },

  // ---- kindle-matters (the signature resource becomes a build-around) ----
  { id: 'ash_sprite', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 2, storiedKeyword: 'ward',
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 1 }] },
    name: 'Ash Sprite', text: 'When you kindle, this gains +1/+1.', flavor: 'Born in the burnt page of a story.' },
  { id: 'flame_tender', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 4, storiedKeyword: 'guardian',
    triggers: { onKindle: [{ effect: 'heal', target: 'ownHearth', amount: 2 }] },
    name: 'Flame Tender', text: 'When you kindle, restore 2 to your Hearth.', flavor: 'Every offering earns a warmth back.' },
  { id: 'pyre_keeper', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 3, hp: 4, storiedKeyword: 'ward',
    triggers: { onKindle: [{ effect: 'damage', target: 'randomEnemy', amount: 1 }] },
    name: 'Pyre Keeper', text: 'When you kindle, deal 1 damage to a random enemy.', flavor: 'What burns for her, burns for you.' },
  { id: 'stoke_the_flames', set: 'core', rarity: 'uncommon', type: 'spell', cost: 1,
    triggers: { onPlay: [{ effect: 'resetKindle' }, { effect: 'draw', amount: 1 }] },
    name: 'Stoke the Flames', text: 'You may kindle again this turn. Draw a card.', flavor: 'The fire is never finished eating.' },

  // ---- graveyard-matters (the ashes remember) ----
  { id: 'ashen_shambler', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 2, storiedKeyword: 'lifesteal',
    triggers: { onPlay: [{ effect: 'graveBuff', filter: 'creature', atk: 1, hp: 1, cap: 4 }] },
    name: 'Ashen Shambler', text: 'When played, gains +1/+1 for each creature in your graveyard (up to +4/+4).', flavor: 'It walks the way grief does.' },
  { id: 'last_rites', set: 'core', rarity: 'uncommon', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'exhume', amount: 1 }] },
    name: 'Last Rites', text: 'Return a random creature from your graveyard to your hand.', flavor: 'Not yet, the words say. Not yet.' },
  { id: 'second_harvest', set: 'core', rarity: 'rare', type: 'spell', cost: 4,
    triggers: { onPlay: [{ effect: 'exhume', amount: 2 }, { effect: 'heal', target: 'ownHearth', amount: 2 }] },
    name: 'Second Harvest', text: 'Return two random creatures from your graveyard to your hand. Restore 2 Hearth.', flavor: 'The forest wastes nothing.' },

  // ---- new blood for existing families ----
  { id: 'forest_sow', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 4, keywords: ['guardian'], storiedKeyword: 'ward',
    name: 'Forest Sow', text: '', flavor: 'Do not stand between her and the piglets.' },
  { id: 'dire_wolf', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 4, hp: 3, storiedKeyword: 'frenzy',
    name: 'Dire Wolf', text: '', flavor: 'The howl you hoped was the wind.' },
  { id: 'red_sash_ambusher', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 3, hp: 2, keywords: ['ambush'], storiedKeyword: 'piercing',
    name: 'Red-Sash Ambusher', text: '', flavor: 'The toll is whatever you carry.' },
  { id: 'warden_captain', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 5, keywords: ['guardian'], storiedKeyword: 'ward',
    triggers: { onPlay: [{ effect: 'buff', target: 'allAllies', atk: 0, hp: 1 }] },
    name: 'Warden Captain', text: 'When played, your other creatures get +1 health.', flavor: 'Hold the line. The line is us.' },
  { id: 'thicket_beast', set: 'core', rarity: 'common', type: 'creature', cost: 4, atk: 3, hp: 5, storiedKeyword: 'guardian',
    name: 'Thicket Beast', text: '', flavor: 'Mostly moss. Partly teeth.' },

  // ---- enchantments (face-up, persistent, player-wide — see engine.js) ----
  { id: 'herd_instinct', set: 'core', rarity: 'uncommon', type: 'enchantment', cost: 3,
    triggers: {
      onPlay: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }],
      onAllySummon: [{ effect: 'buff', target: 'self', atk: 1, hp: 0 }],
    },
    name: 'Herd Instinct', text: 'When cast, your creatures get +1 attack. Creatures you play afterward enter with +1 attack too.',
    flavor: 'One tusk down, and the whole herd charges.' },
  { id: 'bastion_oath', set: 'core', rarity: 'rare', type: 'enchantment', cost: 4,
    triggers: { startOfTurn: [{ effect: 'buff', target: 'allAllies', atk: 0, hp: 1 }] },
    name: 'Bastion Oath', text: 'At the start of your turn, your creatures get +0/+1.',
    flavor: 'Every dawn, the wall grows a little thicker.' },
  { id: 'ember_communion', set: 'core', rarity: 'uncommon', type: 'enchantment', cost: 2,
    triggers: { onKindle: [{ effect: 'emberGain', amount: 1 }] },
    name: 'Ember Communion', text: 'Whenever you kindle, gain 1 Ember this turn.',
    flavor: 'Feed it once. It feeds you back.' },
  { id: 'ashen_vigil', set: 'core', rarity: 'common', type: 'enchantment', cost: 2,
    triggers: { onAllyDeath: [{ effect: 'heal', target: 'ownHearth', amount: 1 }] },
    name: 'Ashen Vigil', text: 'Whenever one of your creatures dies, restore 1 to your Hearth.',
    flavor: 'The bell tolls for the fallen, and the hearth burns on.' },

  // ---- Ashen Sentinel: deepening pass, "ashfall" (onDeath/onAllyDeath
  // payoffs) as a deck-wide identity (worldbuilding loop, DESIGN.md). Checked
  // every named landmark for an open new-NPC spot first: all are claimed
  // (Highgate/Verity+Tarn, Bram's Rest/Footpad, Hollowmere/Hessa, Cinderhollow
  // Mine/Marrow, Cinderpass/Halvard, Harrow's Field/Cobb) except Waystones
  // (deliberately card-light by design) and the Emberpeaks basin (Phase 3's
  // own duelists, a concurrent worktree, now merged as its own roster in
  // shared/sets/emberpeaks/ — not core). Neither is legitimate, so this falls
  // back to (a). Precisely counted swapped-in cards per duelist: the Sentinel
  // had only 3 (ash_sprite/flame_tender/ashen_shambler), the roster's
  // thinnest by a wide margin (next was Vex at 5) and the only long-standing
  // duelist with no self-named signature card. Her existing 3 cards already
  // dabble in kindle-matters and graveyard-matters, but both are now fully
  // owned elsewhere (Tarn, Marrow, and Hessa's hybrid of the two) — onDeath
  // triggers as an immediate-value payoff (distinct from graveyard-matters'
  // graveyard-count/exhume focus) was untouched: boar_matron/camp_torcher use
  // onDeath only as generic starter filler, and ashen_vigil (onAllyDeath, the
  // enchantment hook) had sat in Maren's reward pool but never in an actual
  // deck. All existing effect primitives (damage/heal/draw/emberGain/buff) —
  // no engine changes needed.
  { id: 'ember_husk', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 2,
    triggers: { onDeath: [{ effect: 'emberGain', amount: 1 }] },
    name: 'Ember Husk', text: 'When this dies, gain 1 Ember this turn.', flavor: 'Even snuffed out, it leaves a coal that still burns.' },
  { id: 'watchfire_whelp', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 2,
    triggers: { onDeath: [{ effect: 'draw', amount: 1 }] },
    name: 'Watchfire Whelp', text: 'When this dies, draw a card.', flavor: "It kept the watch until it couldn't." },
  { id: 'ashbound_warden', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 4, keywords: ['guardian'],
    triggers: { onDeath: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }] },
    name: 'Ashbound Warden', text: 'Guardian. When this dies, your other creatures get +1 attack.',
    flavor: "Its last duty is the easiest: fall so the others don't have to." },
  { id: 'feed_the_fire', set: 'core', rarity: 'uncommon', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 2 }, { effect: 'draw', amount: 1 }] }, needsTarget: 'ownUnit',
    name: 'Feed the Fire', text: 'Deal 2 damage to a creature you control. Draw a card.', flavor: 'What burns first, burns brightest.' },
  { id: 'cinderfall_rite', set: 'core', rarity: 'rare', type: 'enchantment', cost: 4,
    triggers: {
      onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 1 }],
      onAllyDeath: [{ effect: 'damage', target: 'randomEnemy', amount: 1 }],
    },
    name: 'Cinderfall Rite', text: 'When cast, deal 1 damage to all enemy creatures. Whenever one of your creatures dies, deal 1 damage to a random enemy.',
    flavor: 'The ruin remembers every fall as an ember owed.' },
  { id: 'sentinel', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 5, keywords: ['guardian'], storiedKeyword: 'ward',
    triggers: {
      onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 1 }],
      onDeath: [{ effect: 'draw', amount: 2 }],
    },
    name: 'The Ashen Sentinel', text: 'Guardian. When played, deal 1 damage to all enemy creatures. When this dies, draw 2 cards.',
    flavor: 'She has stood since before the fire had a name.' },
  { id: 'ashfall_colossus', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 5, hp: 6, keywords: ['guardian'],
    triggers: { onDeath: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 1 }] },
    name: 'Ashfall Colossus', text: 'Guardian. When this dies, your other creatures get +1/+1.',
    flavor: 'The mountain falls quietly. What it feeds does not.' },

  // ---- more new blood: keyword gaps + curve fillers ----
  { id: 'warded_acolyte', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 3, keywords: ['ward'],
    name: 'Warded Acolyte', text: '', flavor: 'Words that turn blades, if you say them right.' },
  { id: 'sanctum_guardian', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 2, hp: 5, keywords: ['ward', 'guardian'],
    name: 'Sanctum Guardian', text: '', flavor: 'Nothing gets past her. Nothing gets to her either.' },
  { id: 'tuskblade_berserker', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 4, hp: 3, keywords: ['frenzy'],
    name: 'Tuskblade Berserker', text: '', flavor: 'Straps two blades to a boar. Regrets nothing.' },
  { id: 'bloodmoon_wolf', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 2, hp: 3, keywords: ['lifesteal'],
    name: 'Bloodmoon Wolf', text: '', flavor: 'Hunts under a sky the color of its work.' },
  { id: 'warthog_battering_ram', set: 'core', rarity: 'uncommon', type: 'creature', cost: 5, atk: 5, hp: 5, keywords: ['piercing'],
    name: 'Warthog Battering Ram', text: '', flavor: 'Strapped in iron, pointed at the gate.' },
  { id: 'rootbound_titan', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 6, hp: 8, keywords: ['guardian'], storiedKeyword: 'piercing',
    name: 'Rootbound Titan', text: '', flavor: 'The forest does not forgive trespassers twice.' },
  { id: 'cinder_warden', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 6, keywords: ['guardian'],
    triggers: { onKindle: [{ effect: 'heal', target: 'ownHearth', amount: 1 }] },
    name: 'Cinder Warden', text: 'When you kindle, restore 1 to your Hearth.', flavor: 'She keeps the coals banked and the gate barred.' },
  { id: 'charnel_hound', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 3,
    triggers: { onPlay: [{ effect: 'graveBuff', filter: 'creature', atk: 1, hp: 0, cap: 3 }] },
    name: 'Charnel Hound', text: 'When played, gains +1 attack for each creature in your graveyard (up to +3).', flavor: 'It only answers to names no one remembers.' },
  { id: 'grave_caller', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 2,
    triggers: { onDeath: [{ effect: 'exhume', amount: 1 }] },
    name: 'Grave Caller', text: 'When this dies, return a random creature from your graveyard to your hand.', flavor: 'Her last word is never goodbye.' },
  { id: 'piercing_barb', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'piercing' }] }, needsTarget: 'ownUnit',
    name: 'Piercing Barb', text: 'Attach: your creature gets +1 attack and Piercing.', flavor: "Filed to a point that doesn't stop at bone." },
  { id: 'widows_kiss', set: 'core', rarity: 'common', type: 'relic', cost: 1,
    triggers: { onPlay: [{ effect: 'grantKeyword', target: 'chosen', keyword: 'lifesteal' }] }, needsTarget: 'ownUnit',
    name: "Widow's Kiss", text: 'Attach: your creature gains Lifesteal.', flavor: 'She always collects.' },
  { id: 'scout_ahead', set: 'core', rarity: 'common', type: 'spell', cost: 1,
    triggers: { onPlay: [{ effect: 'draw', amount: 1 }] },
    name: 'Scout Ahead', text: 'Draw a card.', flavor: "Better to know what's past the treeline." },
  { id: 'rally_the_line', set: 'core', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }] },
    name: 'Rally the Line', text: 'Your creatures get +1 attack.', flavor: 'One voice, and the whole line leans forward.' },

  // ---- Vex's Red-Sash: deepening ambush/bandit identity ----
  { id: 'red_sash_picklock', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 2, keywords: ['ambush'],
    triggers: { onPlay: [{ effect: 'draw', amount: 1 }] },
    name: 'Red-Sash Picklock', text: 'Ambush. When played, draw a card.', flavor: 'Lighter fingers, lighter purse.' },
  { id: 'masked_raider', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 3, hp: 2, keywords: ['ambush'], storiedKeyword: 'lifesteal',
    name: 'Masked Raider', text: 'Ambush.', flavor: 'Never the same face twice.' },
  { id: 'vex', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 3, keywords: ['ambush', 'lifesteal'],
    triggers: { onPlay: [{ effect: 'damage', target: 'randomEnemy', amount: 2 }] },
    name: 'Vex, the Red-Sash', text: 'Ambush, Lifesteal. When played, deal 2 damage to a random enemy.',
    flavor: 'She takes what she wants, then takes the rest.' },
  { id: 'stolen_blade', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'ambush' }] }, needsTarget: 'ownUnit',
    name: 'Stolen Blade', text: 'Attach: your creature gets +1 attack and Ambush.', flavor: 'Traded hands more times than owners.' },
  { id: 'ambush_horn', set: 'core', rarity: 'uncommon', type: 'reaction', cost: 2,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'summon', token: 'red_sash_cutpurse', count: 1 }] },
    name: 'Ambush Horn', text: 'Reaction: when an enemy creature attacks, summon a Red-Sash Cutpurse.',
    flavor: 'One horn blast, and the road empties of everything but blades.' },
  { id: 'shakedown', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 1 }, { effect: 'draw', amount: 1 }] }, needsTarget: 'enemyUnit',
    name: 'Shakedown', text: 'Deal 1 damage to an enemy creature. Draw a card.', flavor: 'Pay the toll or pay in blood.' },

  // ---- Maren the Shrinekeeper: the enchantment axis had zero duelist owners
  // (herd_instinct/bastion_oath/ember_communion/ashen_vigil, shipped with the
  // enchantment mechanic, sat unclaimed by any roster entry) — same for the
  // Ward keyword (warded_acolyte/sanctum_guardian, also unclaimed). New cards
  // lean into Ward-as-persistent-axis specifically, reusing only existing
  // effect primitives (grantKeyword/buff/heal) — no engine changes needed.
  { id: 'warding_litany', set: 'core', rarity: 'rare', type: 'enchantment', cost: 4,
    triggers: {
      onPlay: [{ effect: 'grantKeyword', target: 'allAllies', keyword: 'ward' }],
      onAllySummon: [{ effect: 'grantKeyword', target: 'self', keyword: 'ward' }],
    },
    name: 'Warding Litany', text: 'When cast, your creatures gain Ward. Creatures you play afterward enter with Ward too.',
    flavor: 'The shrine remembers every promise it was asked to keep.' },
  { id: 'blessed_icon', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 2 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'ward' }] }, needsTarget: 'ownUnit',
    name: 'Blessed Icon', text: 'Attach: your creature gets +0/+2 and Ward.', flavor: 'Carried from the shrine, still warm from the candles.' },
  { id: 'shrines_grace', set: 'core', rarity: 'common', type: 'reaction', cost: 1,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'heal', target: 'ownHearth', amount: 2 }] },
    name: "Shrine's Grace", text: 'Reaction: when an enemy creature attacks, restore 2 to your Hearth.',
    flavor: "A ward doesn't stop the blow. It just outlasts it." },
  { id: 'pilgrims_vow', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 1 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'ward' }] }, needsTarget: 'ownUnit',
    name: "Pilgrim's Vow", text: 'Give a creature +0/+1 and Ward.', flavor: "Say the shrine's words. Mean them." },
  { id: 'shrine_elder', set: 'core', rarity: 'uncommon', type: 'creature', cost: 5, atk: 3, hp: 6, keywords: ['ward'],
    triggers: { onPlay: [{ effect: 'heal', target: 'ownHearth', amount: 3 }] },
    name: 'Shrine Elder', text: 'Ward. When played, restore 3 to your Hearth.',
    flavor: 'She has buried more wards than she can count, and outlived them all.' },

  // ---- Duelist Rowan: deepening the Guardian/wall identity. Rowan's deck
  // was the least-developed roster entry (only 2 cards ever swapped in,
  // wardenplate/second_wind) despite Wardens leaning hardest on Guardian of
  // any theme in the set — Guardian had zero build-around cards anywhere
  // (every other keyword got at least one: darkwood_wolf/lifesteal,
  // ashen_shambler/graveyard, ash_sprite/kindle). He also had no self-named
  // signature card the way Gruk/Vex do.
  { id: 'line_holder', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 4, keywords: ['guardian'],
    name: 'Line Holder', text: '', flavor: "He doesn't move. That's the whole plan." },
  { id: 'shieldwall_sergeant', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 5, keywords: ['guardian'],
    name: 'Shieldwall Sergeant', text: '', flavor: 'Keeps the line straighter than the officers do.' },
  { id: 'stand_and_hold', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 2 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'guardian' }] }, needsTarget: 'ownUnit',
    name: 'Stand and Hold', text: 'Give a creature +0/+2 and Guardian.', flavor: 'Two words. Whole strategy.' },
  { id: 'watchers_oath', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'guardian' }] }, needsTarget: 'ownUnit',
    name: "Watcher's Oath", text: 'Attach: your creature gets +1 attack and Guardian.', flavor: 'Sworn once, kept every day since.' },
  { id: 'bulwark_doctrine', set: 'core', rarity: 'uncommon', type: 'enchantment', cost: 3,
    triggers: {
      onPlay: [{ effect: 'grantKeyword', target: 'allAllies', keyword: 'guardian' }],
      onAllySummon: [{ effect: 'grantKeyword', target: 'self', keyword: 'guardian' }],
    },
    name: 'Bulwark Doctrine', text: 'When cast, your creatures gain Guardian. Creatures you play afterward enter with Guardian too.',
    flavor: 'Rowan drilled it into every recruit: hold, do not chase.' },
  { id: 'rowan', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 3, hp: 5, keywords: ['guardian'],
    triggers: { onPlay: [{ effect: 'heal', target: 'ownHearth', amount: 3 }] },
    name: 'Duelist Rowan', text: 'Guardian. When played, restore 3 to your Hearth.',
    flavor: "He's still standing there when the fight ends. He was standing there when it started, too." },
  { id: 'bastion_keep', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 3, hp: 9, keywords: ['guardian'], storiedKeyword: 'ward',
    name: 'Bastion Keep', text: '', flavor: 'Every siege ends the same way: tired attackers, standing stone.' },

  // ---- Kestrel Twinstrike: Frenzy as a deck-wide identity. Guardian
  // (Rowan), Ambush (Vex), and Ward (Maren) each already had a duelist
  // owner; Frenzy — the other half of Red-Sash's own tagline ("Ambush and
  // Frenzy tempo", see STARTERS.redsash) — had none, and was the only
  // keyword in the set with no relic/spell that grants it (compare
  // wardenplate/stolen_blade/blessed_icon/piercing_barb/widows_kiss).
  { id: 'hotblood_recruit', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 3, keywords: ['frenzy'],
    name: 'Hotblood Recruit', text: 'Frenzy.', flavor: "Vex won't have him yet. He keeps volunteering anyway." },
  { id: 'twinblade_mercenary', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 2, hp: 3, keywords: ['frenzy'],
    name: 'Twinblade Mercenary', text: 'Frenzy.', flavor: 'One blade for the coin, one for the fun of it.' },
  { id: 'twin_fangs', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'frenzy' }] }, needsTarget: 'ownUnit',
    name: 'Twin Fangs', text: 'Attach: your creature gets +1 attack and Frenzy.', flavor: 'Bite once, bite again before it falls.' },
  { id: 'reckless_charge', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 1 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'frenzy' }] }, needsTarget: 'ownUnit',
    name: 'Reckless Charge', text: 'Give a creature +0/+1 and Frenzy.', flavor: 'Think it through on the way back, if there is one.' },
  { id: 'bandit_creed', set: 'core', rarity: 'rare', type: 'enchantment', cost: 5,
    triggers: {
      onPlay: [{ effect: 'grantKeyword', target: 'allAllies', keyword: 'frenzy' }],
      onAllySummon: [{ effect: 'grantKeyword', target: 'self', keyword: 'frenzy' }],
    },
    name: 'Bandit Creed', text: 'When cast, your creatures gain Frenzy. Creatures you play afterward enter with Frenzy too.',
    flavor: 'Kestrel\'s only rule: never let them get their breath back.' },
  { id: 'kestrel', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 3, hp: 3, keywords: ['frenzy'],
    triggers: { onPlay: [{ effect: 'damage', target: 'randomEnemy', amount: 1 }, { effect: 'damage', target: 'randomEnemy', amount: 1 }] },
    name: 'Kestrel Twinstrike', text: 'Frenzy. When played, deal 1 damage to a random enemy, twice.',
    flavor: "You hear the first cut. You're still flinching from it when the second one lands." },
  { id: 'warband_champion', set: 'core', rarity: 'uncommon', type: 'creature', cost: 5, atk: 4, hp: 4, keywords: ['frenzy'], storiedKeyword: 'lifesteal',
    name: 'Warband Champion', text: 'Frenzy.', flavor: 'Every scar is a fight the other guy lost twice.' },

  // ---- Gruk the Boar King: deepening Piercing. His deck was the roster's
  // thinnest (only 2 cards ever swapped in, ironhide_boar/emberwood_colossus
  // — both Piercing) despite Piercing being the exact keyword his existing
  // swap already leans on. Guardian/Ambush/Ward/Frenzy each picked up a
  // deck-wide owner in earlier iterations; Piercing was the one keyword left
  // with no spell that grants it (compare stand_and_hold/reckless_charge/
  // pilgrims_vow) and its keyword-gap relic (piercing_barb) sat unclaimed by
  // any roster entry.
  { id: 'boar_lancer', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 2, keywords: ['piercing'],
    name: 'Boar Lancer', text: 'Piercing.', flavor: 'Rides low, tusks first.' },
  { id: 'tusked_reaver', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 3, hp: 3, keywords: ['piercing'], storiedKeyword: 'lifesteal',
    name: 'Tusked Reaver', text: 'Piercing.', flavor: 'The Hollow keeps its own tally of what got through.' },
  { id: 'honed_tusks', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'piercing' }] }, needsTarget: 'ownUnit',
    name: 'Honed Tusks', text: 'Give a creature +1 attack and Piercing.', flavor: 'Sharpened on the same stone every winter.' },
  { id: 'tusks_of_the_hollow', set: 'core', rarity: 'rare', type: 'relic', cost: 3,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'piercing' }] }, needsTarget: 'ownUnit',
    name: 'Tusks of the Hollow', text: "Attach: your creature gets +2 attack and Piercing.", flavor: "Gruk's own, before Gruk was king of anything." },
  { id: 'boarlords_fury', set: 'core', rarity: 'rare', type: 'enchantment', cost: 4,
    triggers: {
      onPlay: [{ effect: 'grantKeyword', target: 'allAllies', keyword: 'piercing' }],
      onAllySummon: [{ effect: 'grantKeyword', target: 'self', keyword: 'piercing' }],
    },
    name: "Boarlord's Fury", text: 'When cast, your creatures gain Piercing. Creatures you play afterward enter with Piercing too.',
    flavor: 'The herd charges as one, and one is all it takes.' },

  // ---- Marrow the Delver: graveyard-matters as a deck-wide identity. Every
  // other new-blood build-around axis (Guardian/Ambush/Ward/Frenzy/Piercing)
  // picked up a duelist owner across the last five iterations; graveyard-
  // matters (exhume/graveBuff) never did — ashen_shambler/last_rites/
  // second_harvest are scattered across sentinel/hessa/tarn as shared filler,
  // but charnel_hound, grave_caller, and the ashen_vigil enchantment (shipped
  // with the mechanic) sat completely unclaimed by any roster deck. Folds
  // those three unclaimed cards in alongside 5 new ones, all built from
  // existing effect primitives (exhume/graveBuff/buff/draw — no engine
  // changes needed).
  { id: 'bone_delver', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 3,
    triggers: { onPlay: [{ effect: 'graveBuff', filter: 'creature', atk: 1, hp: 0, cap: 2 }] },
    name: 'Bone Delver', text: 'When played, gains +1 attack for each creature in your graveyard (up to +2).',
    flavor: 'Digs where the ground remembers.' },
  { id: 'charnel_colossus', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 4, hp: 7, keywords: ['guardian'],
    triggers: { onPlay: [{ effect: 'graveBuff', filter: 'creature', atk: 1, hp: 1, cap: 5 }] },
    name: 'Charnel Colossus', text: 'Guardian. When played, gains +1/+1 for each creature in your graveyard (up to +5/+5).',
    flavor: 'Cinderhollow gave up its dead, and they did not want to leave.' },
  { id: 'unquiet_grave', set: 'core', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'exhume', amount: 1 }, { effect: 'buff', target: 'chosen', atk: 1, hp: 1 }] }, needsTarget: 'ownUnit',
    name: 'Unquiet Grave', text: 'Return a random creature from your graveyard to your hand. Give a creature +1/+1.',
    flavor: "Marrow doesn't ask what's buried. Marrow asks what's still useful." },
  { id: 'delvers_pick', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 0 }, { effect: 'exhume', amount: 1 }] }, needsTarget: 'ownUnit',
    name: "Delver's Pick", text: 'Attach: your creature gets +1 attack. Return a random creature from your graveyard to your hand.',
    flavor: 'Worn smooth on the haft, sharp everywhere it matters.' },
  { id: 'marrow', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 3, hp: 5,
    triggers: { onPlay: [{ effect: 'draw', amount: 1 }, { effect: 'graveBuff', filter: 'creature', atk: 1, hp: 0, cap: 3 }] },
    name: 'Marrow, the Delver', text: 'When played, draw a card, then gain +1 attack for each creature in your graveyard (up to +3).',
    flavor: 'The mine took everyone it swallowed. Marrow just asks nicely for them back.' },

  // ---- Captain Verity: Lifesteal as a deck-wide identity. Guardian (Rowan)
  // and Ward (Maren) already own Wardens-adjacent defensive axes, so Verity
  // leans on the one keyword that reads as "the line that doesn't fall"
  // without duplicating either: Lifesteal had no spell that grants it
  // (compare stand_and_hold/pilgrims_vow/reckless_charge/honed_tusks) and no
  // enchantment (every other core keyword has one — herd_instinct/
  // warding_litany/bulwark_doctrine/bandit_creed/boarlords_fury), and its two
  // keyword-gap fillers (bloodmoon_wolf, widows_kiss) sat unclaimed by any
  // roster deck since they shipped.
  { id: 'sworn_medic', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 3, keywords: ['lifesteal'],
    name: 'Sworn Medic', text: 'Lifesteal.', flavor: 'She patches the line, then rejoins it.' },
  { id: 'hearthguard_veteran', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 4, keywords: ['lifesteal'],
    name: 'Hearthguard Veteran', text: 'Lifesteal.', flavor: 'Outlasted three captains. Reports to the fourth.' },
  { id: 'crimson_vow', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 1 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'lifesteal' }] }, needsTarget: 'ownUnit',
    name: 'Crimson Vow', text: 'Give a creature +0/+1 and Lifesteal.', flavor: 'Sworn on the gate, sealed in blood.' },
  { id: 'verities_oath', set: 'core', rarity: 'rare', type: 'enchantment', cost: 4,
    triggers: {
      onPlay: [{ effect: 'grantKeyword', target: 'allAllies', keyword: 'lifesteal' }],
      onAllySummon: [{ effect: 'grantKeyword', target: 'self', keyword: 'lifesteal' }],
    },
    name: "Verity's Oath", text: 'When cast, your creatures gain Lifesteal. Creatures you play afterward enter with Lifesteal too.',
    flavor: 'Every soldier who bleeds for the gate gets some of it back.' },
  { id: 'verity', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 4, keywords: ['guardian', 'lifesteal'],
    triggers: { onPlay: [{ effect: 'damage', target: 'randomEnemy', amount: 2 }, { effect: 'heal', target: 'ownHearth', amount: 2 }] },
    name: 'Captain Verity', text: 'Guardian, Lifesteal. When played, deal 2 damage to a random enemy and restore 2 to your Hearth.',
    flavor: 'She takes their strength to hold her ground.' },
  { id: 'hearthbound_champion', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 5, hp: 7, keywords: ['lifesteal'], storiedKeyword: 'guardian',
    name: 'Hearthbound Champion', text: 'Lifesteal.', flavor: 'The gate has fallen before. She has not.' },

  // ---- Halvard Stillwatch: reaction-heavy control as a deck-wide identity.
  // Checked the assigned candidate axes: kindle-matters already leans on the
  // Ashen Sentinel (ash_sprite/flame_tender in sentinelDeck), but "a deck
  // that builds primarily around reaction cards" was genuinely unclaimed —
  // every one of the 7 existing reaction cards (hidden_snare/boar_pit/
  // alarm_bell/warding_bell/counterspark/ambush_horn/shrines_grace) sits as
  // at most a single-copy splash in whichever deck carries it, never the
  // deck's own identity. New cards diversify the reaction toolkit across all
  // three trigger events (enemyAttack/enemySpell/enemyCreature) and add a
  // payoff for holding them: `graveBuff` already keys off `getCard(c.card)
  // .type`, so `filter: 'reaction'` counts *fired* reactions sitting in the
  // graveyard (fireReactions pushes them there on trigger) — a genuine
  // "reactions matter" payoff with no engine change.
  { id: 'patient_sentry', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 4, keywords: ['ward'], storiedKeyword: 'guardian',
    name: 'Patient Sentry', text: 'Ward.', flavor: "He has stood so long the moss doesn't know the difference." },
  { id: 'ridgewatch_warden', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 6, keywords: ['ward'],
    name: 'Ridgewatch Warden', text: 'Ward.', flavor: 'Every traveler gets counted. Not all get through.' },
  { id: 'cinderpass_snare', set: 'core', rarity: 'common', type: 'reaction', cost: 1,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 1 }, { effect: 'draw', amount: 1 }] },
    name: 'Cinderpass Snare', text: 'Reaction: when an enemy creature attacks, deal 1 damage to it and draw a card.',
    flavor: 'The path narrows. So do your options.' },
  { id: 'backdraft', set: 'core', rarity: 'common', type: 'reaction', cost: 1,
    reaction: { on: 'enemySpell', effects: [{ effect: 'damage', target: 'enemyHearth', amount: 2 }] },
    name: 'Backdraft', text: "Reaction: when your opponent plays a spell, deal 2 damage to their Hearth.",
    flavor: "The wind through the pass doesn't forgive haste." },
  { id: 'ashfall_recall', set: 'core', rarity: 'uncommon', type: 'reaction', cost: 2,
    reaction: { on: 'enemyCreature', effects: [{ effect: 'exhume', amount: 1 }] },
    name: 'Ashfall Recall', text: 'Reaction: when your opponent plays a creature, return a random creature from your graveyard to your hand.',
    flavor: 'What the mountain buries, the watch remembers.' },
  { id: 'sentrys_cloak', set: 'core', rarity: 'common', type: 'relic', cost: 1,
    triggers: { onPlay: [{ effect: 'grantKeyword', target: 'chosen', keyword: 'ward' }] }, needsTarget: 'ownUnit',
    name: "Sentry's Cloak", text: 'Attach: your creature gains Ward.', flavor: 'Grey wool, the color of standing still.' },
  { id: 'halvard', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 3, hp: 5, keywords: ['ward'],
    triggers: { onPlay: [{ effect: 'graveBuff', filter: 'reaction', atk: 1, hp: 1, cap: 3 }] },
    name: 'Halvard Stillwatch', text: 'Ward. Gains +1/+1 for each reaction card in your graveyard (up to +3/+3).',
    flavor: "He set two snares and lit no fire. He didn't need to." },

  // ---- Tarn the Tollkeeper: kindle-matters as a deck-wide identity. Tarn's
  // deck was tied with the Footpad as the roster's thinnest (only 2 cards
  // ever swapped in, dire_wolf/second_harvest — neither thematically tied to
  // anything, unlike the Footpad's ambush-flavored pair). Kindle-matters
  // (onKindle triggers) was the one build-around axis flagged as still open
  // beyond the Ashen Sentinel's existing lean: ash_sprite/flame_tender cover
  // costs 2-3 in sentinelDeck, but pyre_keeper (4c) sat in the Sentinel's
  // reward pool without ever being in an actual deck, and cinder_warden (5c)
  // and the ember_communion enchantment sat completely unclaimed by any
  // roster deck since they shipped. New cards round out the curve (1c and
  // 6c, where no kindle body existed) and diversify the onKindle payoff
  // beyond buff/heal/damage (draw, summon), all existing effect primitives.
  { id: 'toll_urchin', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 2,
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 0 }] },
    name: 'Toll Urchin', text: 'When you kindle, this gains +1 attack.', flavor: 'Counts coins faster than the ledger can write them down.' },
  { id: 'ledger_keeper', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 3,
    triggers: { onKindle: [{ effect: 'draw', amount: 1 }] },
    name: 'Ledger Keeper', text: 'When you kindle, draw a card.', flavor: 'Every toll paid gets a line. Every line gets remembered.' },
  { id: 'tollgate_ram', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 5, storiedKeyword: 'guardian',
    triggers: { onKindle: [{ effect: 'summon', token: 'young_boar', count: 1 }] },
    name: 'Tollgate Ram', text: 'When you kindle, summon a Young Boar.', flavor: 'One horn-blast, and the herd remembers whose road this is.' },
  { id: 'open_the_gate', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'resetKindle' }, { effect: 'buff', target: 'chosen', atk: 1, hp: 1 }] }, needsTarget: 'ownUnit',
    name: 'Open the Gate', text: 'You may kindle again this turn. Give a creature +1/+1.', flavor: 'Pay double, pass twice as fast.' },
  { id: 'tarn', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 3, hp: 6,
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 1 }, { effect: 'heal', target: 'ownHearth', amount: 1 }] },
    name: 'Tarn, the Tollkeeper', text: 'When you kindle, this gains +1/+1 and you restore 1 to your Hearth.',
    flavor: 'He has never once let anyone cross for free. He has never once turned anyone away, either.' },
  { id: 'tollroad_colossus', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 5, hp: 7, storiedKeyword: 'guardian',
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 1 }] },
    name: 'Tollroad Colossus', text: 'When you kindle, this gains +1/+1.', flavor: 'Every toll ever paid on this road, standing in one shape.' },

  // ---- Cobb the Farmhand: vanilla "curve" as a deck-wide identity. Every
  // build-around axis checked in the roster gap survey (Guardian/Ambush/Ward
  // /Frenzy/Piercing/kindle-matters/graveyard-matters/lifesteal/reaction
  // control) already has an owner. What's never been claimed as anyone's
  // *signature* is the opposite of a build-around: honest, keyword-free
  // bodies with the best raw stats-per-cost in the set — no triggers, no
  // targets, nothing to read before you play them. Existing "vanilla" filler
  // (young_boar/wild_boar/dire_wolf/thicket_beast) already sits near a
  // stat-total baseline of ~2×cost+1 with zero ability text; these six push
  // a full notch above that baseline at every cost (roughly 2×cost+2, split
  // evenly) since a plain body's only "upside" is its stat line. No engine
  // changes — every card below is `atk`/`hp` and nothing else.
  { id: 'farmhands_boy', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 2, hp: 2,
    name: "Farmhand's Boy", text: '', flavor: 'Small hands, big rows to weed.' },
  { id: 'stout_plowman', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 3, hp: 3,
    name: 'Stout Plowman', text: '', flavor: 'No tricks. Just a strong back and a longer day.' },
  { id: 'yoke_ox', set: 'core', rarity: 'common', type: 'creature', cost: 3, atk: 4, hp: 4,
    name: 'Yoke Ox', text: '', flavor: 'Pulls the plow, pulls the cart, pulls its weight.' },
  { id: 'old_drover', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 5, hp: 5,
    name: 'Old Drover', text: '', flavor: "Been driving stock to market since before Harrow's father worked this land." },
  { id: 'cobb', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 6, hp: 6,
    name: 'Cobb, the Farmhand', text: '', flavor: "Cobb doesn't have a trick. Cobb has never needed one." },
  { id: 'harrows_plow_ox', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 7, hp: 7,
    name: "Harrow's Plow Ox", text: '', flavor: 'Turned more soil than anyone can count, and never once hurried about it.' },

  // ---- A Footpad: "ambush the ambusher" as a deck-wide identity. The last
  // of the original 7 duelists left un-deepened by this loop; every other
  // open axis (Guardian/Ambush/Ward/Frenzy/Piercing/graveyard-matters/
  // lifesteal/reaction-control/kindle-matters/vanilla-curve) already has an
  // owner, and Ambush/Frenzy specifically both already belong to fellow
  // Red-Sash members Vex and Kestrel — so a third Red-Sash duelist needed an
  // angle that isn't "attacks first" or "attacks twice." A footpad preys on
  // travelers who move first: the deck leans entirely on `enemyAttack`
  // reactions (unlike Halvard, whose control shell spans all three reaction
  // events plus Ward walls), rewarding patience over tempo. All new effects
  // are existing primitives (damage/emberGain/summon/buff) — no engine
  // changes.
  { id: 'wayside_watcher', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 3,
    name: 'Wayside Watcher', text: '', flavor: 'Watches the road better than she walks it.' },
  { id: 'quick_fingers', set: 'core', rarity: 'common', type: 'reaction', cost: 1,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 1 }, { effect: 'emberGain', amount: 1 }] },
    name: 'Quick Fingers', text: 'Reaction: when an enemy creature attacks, deal 1 damage to it and gain 1 Ember this turn.',
    flavor: "Empty your pockets before you notice they're light." },
  { id: 'false_camp', set: 'core', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 3 }] }, needsTarget: 'ownUnit',
    name: 'False Camp', text: 'Attach: your creature gets +0/+3.', flavor: "Looks abandoned. Isn't." },
  { id: 'roadblock', set: 'core', rarity: 'uncommon', type: 'reaction', cost: 2,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 1 }, { effect: 'summon', token: 'young_boar', count: 1 }] },
    name: 'Roadblock', text: 'Reaction: when an enemy creature attacks, deal 1 damage to it and summon a Young Boar.',
    flavor: 'The road was never as clear as it looked.' },
  { id: 'turned_tables', set: 'core', rarity: 'rare', type: 'reaction', cost: 3,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 3 }, { effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }] },
    name: 'Turned Tables', text: 'Reaction: when an enemy creature attacks, deal 3 damage to it and your creatures gain +1 attack.',
    flavor: 'Every ambush works twice, if you wait for the second one.' },
  { id: 'red_sash_watchman', set: 'core', rarity: 'common', type: 'creature', cost: 4, atk: 4, hp: 4, keywords: ['guardian'],
    name: 'Red-Sash Watchman', text: 'Guardian.', flavor: 'Makes sure nobody leaves before the trap springs.' },
  { id: 'uninvited_guest', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 4, hp: 5,
    triggers: { onPlay: [{ effect: 'damage', target: 'randomEnemy', amount: 3 }] },
    name: 'The Uninvited Guest', text: 'When played, deal 3 damage to a random enemy creature.',
    flavor: "Old Bram never got a name for the one who robbed him. Nobody who's crossed that road at night has." },

  // ---- Old Hessa of the Mire: kindle+graveyard as a deck-wide identity —
  // a hybrid no other duelist has claimed (Tarn owns kindle-matters solo,
  // Marrow owns graveyard-matters solo). Hessa was the roster's thinnest
  // deck by far (only 2 cards ever swapped in, warding_bell/ashen_shambler)
  // and the only original-or-early duelist with no self-named signature
  // card. The bog setting makes the hybrid a natural fit rather than a
  // forced mashup: will-o'-the-wisps and marsh-gas fires are folklore's own
  // "kindle in a graveyard," and the deck plays that literally — cheap
  // bodies die, `mire_toll` lets their deaths refund a second kindle, and
  // her onKindle payoffs (graveBuff/exhume) turn that into card advantage
  // and a growing threat. All existing effect primitives (graveBuff/exhume/
  // resetKindle/buff/heal) — no engine changes needed.
  { id: 'willow_wisp', set: 'core', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 2,
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 0 }] },
    name: 'Willow Wisp', text: 'When you kindle, this gains +1 attack.',
    flavor: 'The lights that wander the mire, drawn to any spark.' },
  { id: 'bog_kindler', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 1, hp: 3,
    triggers: { onKindle: [{ effect: 'graveBuff', target: 'self', filter: 'creature', atk: 1, hp: 0, cap: 2 }] },
    name: 'Bog Kindler', text: 'When you kindle, gains +1 attack for each creature in your graveyard (up to +2).',
    flavor: 'She feeds the marsh-fire whatever the bog gives back.' },
  { id: 'mire_toll', set: 'core', rarity: 'uncommon', type: 'enchantment', cost: 3,
    triggers: { onAllyDeath: [{ effect: 'resetKindle' }] },
    name: 'Mire Toll', text: 'Whenever one of your creatures dies, you may kindle again this turn.',
    flavor: 'The mire always collects. What it takes, it lets you spend again.' },
  { id: 'rekindle_the_dead', set: 'core', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'resetKindle' }, { effect: 'exhume', amount: 1 }] },
    name: 'Rekindle the Dead', text: 'You may kindle again this turn. Return a random creature from your graveyard to your hand.',
    flavor: 'Old rites for old bones: light the pyre, and something answers.' },
  { id: 'pyre_caller', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 2, hp: 4,
    triggers: { onKindle: [{ effect: 'exhume', amount: 1 }] },
    name: 'Pyre Caller', text: 'When you kindle, return a random creature from your graveyard to your hand.',
    flavor: "He doesn't call the living. He never needs to." },
  { id: 'hessa', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 3, hp: 5,
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 1 }, { effect: 'exhume', amount: 1 }] },
    name: 'Old Hessa of the Mire', text: 'When you kindle, this gains +1/+1 and you return a random creature from your graveyard to your hand.',
    flavor: "She's been dealing cards to the dead so long, the living just call it luck." },
  { id: 'bogfire_colossus', set: 'core', rarity: 'rare', type: 'creature', cost: 6, atk: 5, hp: 6, keywords: ['guardian'],
    triggers: { onKindle: [{ effect: 'graveBuff', target: 'self', filter: 'creature', atk: 1, hp: 1, cap: 3 }] },
    name: 'Bogfire Colossus', text: 'Guardian. When you kindle, gains +1/+1 for each creature in your graveyard (up to +3).',
    flavor: 'Six feet of bog-fire and bone, and it hasn\'t finished rising.' },

  // ============================================================
  // NEW-MECHANICS PASS — five axes the set had never touched, each a new
  // engine primitive/field rather than a recombination of existing ones:
  //   • equipment  — a persistent card TYPE: rides a creature, and returns to
  //                  hand when the wielder falls (engine playCard/sweepDead)
  //   • additionalCost.discard — a play-time cost paid in cards, not Ember
  //   • discard    — hand disruption (effects.js), the opponent's hand as a
  //                  resource to attack
  //   • summonRandom — conjuration: pull anonymous bodies from a fixed pool
  //   • ability    — activated abilities: pay Ember, once/turn, on a creature
  // All five land as NEUTRAL families (see families.js) so they're freely
  // buildable and don't perturb any faction's rank ladder or balance sims.
  // ============================================================

  // ---- The Armory: equipment. Unlike a one-shot relic, gear rides its
  // wielder and returns to your hand when that creature dies, so the buff is
  // never spent for good — priced a notch above the equivalent relic for it.
  { id: 'emberforged_blade', set: 'core', rarity: 'uncommon', type: 'equipment', cost: 3,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 0 }] }, needsTarget: 'ownUnit',
    name: 'Emberforged Blade', text: 'Equip: your creature gets +2 attack. Returns to your hand when the wielder falls.',
    flavor: 'Reforged after every owner. It has outlived all of them.' },
  { id: 'oaken_aegis', set: 'core', rarity: 'uncommon', type: 'equipment', cost: 3,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 3 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'guardian' }] }, needsTarget: 'ownUnit',
    name: 'Oaken Aegis', text: 'Equip: your creature gets +0/+3 and Guardian. Returns to your hand when the wielder falls.',
    flavor: 'The shield remembers every arm that carried it.' },
  { id: 'travelers_cloak', set: 'core', rarity: 'common', type: 'equipment', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 0, hp: 2 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'ward' }] }, needsTarget: 'ownUnit',
    name: "Traveler's Cloak", text: 'Equip: your creature gets +0/+2 and Ward. Returns to your hand when the wielder falls.',
    flavor: 'Grey wool, road-worn, and quietly proof against the wrong kind of attention.' },
  { id: 'huntsmans_longbow', set: 'core', rarity: 'rare', type: 'equipment', cost: 4,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'piercing' }] }, needsTarget: 'ownUnit',
    name: "Huntsman's Longbow", text: 'Equip: your creature gets +2 attack and Piercing. Returns to your hand when the wielder falls.',
    flavor: 'Draws heavy, carries far, and never yet stayed with the fallen.' },
  { id: 'everburning_brand', set: 'core', rarity: 'rare', type: 'equipment', cost: 4,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 2 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'lifesteal' }] }, needsTarget: 'ownUnit',
    name: 'Everburning Brand', text: 'Equip: your creature gets +1/+2 and Lifesteal. Returns to your hand when the wielder falls.',
    flavor: 'It has never once gone out, no matter whose hand let it drop.' },

  // ---- Thieves' Cant: hand disruption. The opponent's hand is a resource,
  // and these attack it — random discards (hands are hidden, so no choosing).
  { id: 'sticky_fingers', set: 'core', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 2, keywords: ['ambush'],
    triggers: { onPlay: [{ effect: 'discard', who: 'enemy', amount: 1 }] },
    name: 'Sticky Fingers', text: 'Ambush. When played, your opponent discards a random card.',
    flavor: "You won't miss it until you reach for it." },
  { id: 'cutpurse_raid', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'discard', who: 'enemy', amount: 1 }, { effect: 'draw', amount: 1 }] },
    name: 'Cutpurse Raid', text: 'Your opponent discards a random card. Draw a card.',
    flavor: 'A fair trade, by the road\'s arithmetic: their card for yours.' },
  { id: 'extortionist', set: 'core', rarity: 'uncommon', type: 'creature', cost: 4, atk: 3, hp: 4,
    triggers: { onPlay: [{ effect: 'discard', who: 'enemy', amount: 1 }, { effect: 'draw', amount: 1 }] },
    name: 'Extortionist', text: 'When played, your opponent discards a random card and you draw a card.',
    flavor: 'He always leaves you poorer and never says how.' },
  { id: 'midnight_raid', set: 'core', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'discard', who: 'enemy', amount: 2 }] },
    name: 'Midnight Raid', text: 'Your opponent discards two random cards.',
    flavor: 'They wake to a lighter pack and a colder camp.' },

  // ---- Desperate Measures: additional costs. These pay in CARDS, not just
  // Ember — above-rate effects gated by pitching a card from your hand (which
  // feeds graveyard-matters on the way to the pile).
  { id: 'desperate_gambit', set: 'core', rarity: 'uncommon', type: 'spell', cost: 1, additionalCost: { discard: 1 },
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 4 }] }, needsTarget: 'any',
    name: 'Desperate Gambit', text: 'As an additional cost, discard a card. Deal 4 damage to anything.',
    flavor: 'Everything you have, spent on the one thing in front of you.' },
  { id: 'pyre_offering', set: 'core', rarity: 'uncommon', type: 'spell', cost: 2, additionalCost: { discard: 1 },
    triggers: { onPlay: [{ effect: 'draw', amount: 3 }] },
    name: 'Pyre Offering', text: 'As an additional cost, discard a card. Draw three cards.',
    flavor: 'Give the fire one page, and it reads you three in return.' },
  { id: 'grim_bargain', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 4, hp: 5, additionalCost: { discard: 1 },
    name: 'Grim Bargain', text: 'As an additional cost, discard a card.',
    flavor: 'Big as a barn door, and it cost you exactly one thing you wanted.' },

  // ---- The Wildcaller: conjuration. Spells that summon anonymous creatures
  // from a fixed pool — a board out of nowhere, at the mercy of the draw.
  // The family's entry point — its only common and only card under 4 Ember.
  // Priced as exactly half of wild_summons (4c → 2 beasts, same pool): a fair
  // rate paid in variance, which is the family's whole texture.
  { id: 'low_whistle', set: 'core', rarity: 'common', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'summonRandom', pool: ['young_boar', 'wild_boar', 'forest_sow', 'darkwood_wolf'], count: 1 }] },
    name: 'Low Whistle', text: 'Summon a random beast.',
    flavor: 'You barely hear it. Something does.' },
  { id: 'wild_summons', set: 'core', rarity: 'uncommon', type: 'spell', cost: 4,
    triggers: { onPlay: [{ effect: 'summonRandom', pool: ['young_boar', 'wild_boar', 'forest_sow', 'darkwood_wolf'], count: 2 }] },
    name: 'Wild Summons', text: 'Summon two random beasts.',
    flavor: 'You call. Something always comes. Rarely what you pictured.' },
  { id: 'call_of_the_wild', set: 'core', rarity: 'rare', type: 'spell', cost: 6,
    triggers: { onPlay: [{ effect: 'summonRandom', pool: ['wild_boar', 'darkwood_wolf', 'forest_sow', 'thicket_beast', 'dire_wolf', 'boar_lancer'], count: 3 }] },
    name: 'Call of the Wild', text: 'Summon three random beasts.',
    flavor: 'The whole treeline answers at once, and not one of them asks why.' },
  // The family's first creature — a body whose call outlives the caller. The
  // onDeath conjure makes it play unlike the two spells (sticky, happy to
  // trade); statted a notch under warband_champion (5-cost 4/4 frenzy) since
  // the deathrattle beast (wild_summons's pool, avg ~2 Ember) pays the gap.
  { id: 'old_whistler', set: 'core', rarity: 'uncommon', type: 'creature', cost: 5, atk: 3, hp: 4,
    triggers: { onDeath: [{ effect: 'summonRandom', pool: ['young_boar', 'wild_boar', 'forest_sow', 'darkwood_wolf'], count: 1 }] },
    name: 'Old Whistler', text: 'When this dies, summon a random beast.',
    flavor: 'The whistle carries further than the whistler.' },
  // The family's reaction — conjuration on the counterplay surface. Anchored
  // to ambush_horn (2c uncommon: enemyAttack → a guaranteed 2c 3/1); the same
  // rate paid in variance from the family's standard pool (avg ~2c body).
  { id: 'something_comes', set: 'core', rarity: 'uncommon', type: 'reaction', cost: 2,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'summonRandom', pool: ['young_boar', 'wild_boar', 'forest_sow', 'darkwood_wolf'], count: 1 }] },
    name: 'Something Comes', text: 'Reaction: when an enemy creature attacks, summon a random beast.',
    flavor: "You didn't call. It came anyway." },

  // ---- The Adepts: activated abilities (⚡, pay Ember, once per turn). A
  // creature that keeps paying off round after round instead of once on entry.
  { id: 'emberkin_adept', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 3,
    ability: { cost: 1, needsTarget: 'enemyUnit', text: '⚡1: deal 1 damage to an enemy creature.',
      effects: [{ effect: 'damage', target: 'chosen', amount: 1 }] },
    name: 'Emberkin Adept', text: '⚡1 (once per turn): deal 1 damage to an enemy creature.',
    flavor: 'A small flame, offered again and again, wears anything down.' },
  { id: 'hearth_channeler', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 1, hp: 4,
    ability: { cost: 2, text: '⚡2: restore 2 to your Hearth.',
      effects: [{ effect: 'heal', target: 'ownHearth', amount: 2 }] },
    name: 'Hearth Channeler', text: '⚡2 (once per turn): restore 2 to your Hearth.',
    flavor: 'She does not fight. She keeps the fire from going out, which is harder.' },
  { id: 'bog_witch', set: 'core', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 2,
    ability: { cost: 2, text: '⚡2: your opponent discards a random card.',
      effects: [{ effect: 'discard', who: 'enemy', amount: 1 }] },
    name: 'Bog Witch', text: '⚡2 (once per turn): your opponent discards a random card.',
    flavor: 'Every turn you leave her be, your hand gets a little emptier.' },
  { id: 'warcry_captain', set: 'core', rarity: 'rare', type: 'creature', cost: 4, atk: 3, hp: 4,
    ability: { cost: 2, needsTarget: 'ownUnit', text: '⚡2: give a friendly creature +1/+1.',
      effects: [{ effect: 'buff', target: 'chosen', atk: 1, hp: 1 }] },
    name: 'Warcry Captain', text: '⚡2 (once per turn): give a friendly creature +1/+1.',
    flavor: 'One word from her and the whole line stands an inch taller.' },
  { id: 'spark_conjurer', set: 'core', rarity: 'rare', type: 'creature', cost: 5, atk: 3, hp: 5,
    ability: { cost: 3, text: '⚡3: summon a random beast.',
      effects: [{ effect: 'summonRandom', pool: ['young_boar', 'wild_boar', 'forest_sow', 'darkwood_wolf', 'militia_recruit'], count: 1 }] },
    name: 'Spark Conjurer', text: '⚡3 (once per turn): summon a random beast.',
    flavor: 'He is never quite sure what he called until it is already standing there.' },
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

// The preselected pool a fresh character's starter deck is rolled from: every
// card that appears in any hand-built STARTER_DECK (dedup). Vetted,
// village-tier cards only — nothing here is a surprise.
export const STARTER_POOL = [...new Set(Object.values(STARTER_DECKS).flat())];

// Roll a randomized-but-playable 30-card starter deck from STARTER_POOL,
// honoring the ≤3-copies rule. Creature-heavy (8–10 spells, the rest
// creatures) so a new player always has a board to play; the exact list
// varies per character. All fresh cards are level 1 (renown 0), so this costs
// 0 Legend Budget at creation. Server-side authority: only the server rolls a
// starter (see server/index.js newProfile).
export function rollStarterDeck() {
  const DECK_SIZE = 30, MAX_COPIES = 3;
  const creatures = STARTER_POOL.filter(id => getCard(id)?.type === 'creature');
  const spells = STARTER_POOL.filter(id => getCard(id)?.type !== 'creature');
  const counts = {};
  const deck = [];
  // pick a random id from `from` that still has copies left; false if none
  const draw = from => {
    const avail = from.filter(id => (counts[id] || 0) < MAX_COPIES);
    if (!avail.length) return false;
    const id = avail[Math.floor(Math.random() * avail.length)];
    counts[id] = (counts[id] || 0) + 1;
    deck.push(id);
    return true;
  };
  const spellTarget = 8 + Math.floor(Math.random() * 3); // 8–10 spells
  while (deck.length < spellTarget && draw(spells)) {}
  while (deck.length < DECK_SIZE && draw(creatures)) {}
  // safety net if a category ran dry (won't with the current pool sizes)
  while (deck.length < DECK_SIZE && draw(STARTER_POOL)) {}
  return deck;
}

// The banner-coherent starters a fresh character is handed (Leader system).
// Kept separate from STARTER_DECKS — those are curated duelist bases that
// duelists.js swap()s on, and must not shift. Each archetype is a modest
// starter-tier Leader (see leaders.js) flying one banner; buildBannerStarter
// assembles a deck that PASSES evaluateDeck by construction: leader + enough
// of its banner to meet minBanner, then neutral (ungated) filler to 30. New
// players thus never spawn with an invalid deck. Verified in test-leaders.mjs.
const STARTER_ARCHETYPES = [
  { leader: 'pack_alpha',          banner: 'boars_beasts' },
  { leader: 'shieldwall_sergeant', banner: 'wardens_of_the_line' },
  { leader: 'red_sash_ambusher',   banner: 'redsash_bandits' },
];

// families that are playable in any deck (mirror of banners.js NEUTRAL set) —
// used as coherent filler that never trips the gate.
const NEUTRAL_FILL_FAMILY = 'village_hearth';

function buildBannerStarter(arch) {
  const DECK_SIZE = 30, MAX_COPIES = 3;
  const counts = {};
  const deck = [];
  const add = id => {
    if (deck.length >= DECK_SIZE || (counts[id] || 0) >= MAX_COPIES) return false;
    counts[id] = (counts[id] || 0) + 1;
    deck.push(id);
    return true;
  };

  const bannerFam = FAMILIES.find(f => f.id === arch.banner);
  // no rares: faction ranks (shared/factions.js) gate rares at Trusted, and
  // a fresh character is a Stranger whose dealt starter champion vouches
  // them only to Known — commons (open) + uncommons (Known) keep the dealt
  // deck exactly re-saveable under the player's own day-one ranks.
  const bannerCards = bannerFam ? bannerFam.cardIds.filter(id => { try { return getCard(id).rarity !== 'rare'; } catch { return false; } }) : [];
  const neutralFam = FAMILIES.find(f => f.id === NEUTRAL_FILL_FAMILY);
  const neutral = neutralFam ? neutralFam.cardIds.filter(id => { try { return !!getCard(id); } catch { return false; } }) : [];

  add(arch.leader);   // the Leader is one of the 30
  // fill the banner to a couple past its demand so minBanner is comfortably met
  const demand = (LEADERS[arch.leader].constraints.find(c => c.kind === 'minBanner')?.n || 8) + 2;
  const onBanner = () => deck.filter(id => matchesBanner(getCard(id), arch.banner)).length;
  outer: for (let pass = 0; pass < MAX_COPIES; pass++) {
    for (const id of bannerCards) {
      if (onBanner() >= demand) break outer;
      add(id);
    }
  }
  // fill the rest with neutral support (≤3 each, round-robin for variety)
  for (let pass = 0; pass < MAX_COPIES && deck.length < DECK_SIZE; pass++) {
    for (const id of neutral) { if (deck.length >= DECK_SIZE) break; add(id); }
  }
  return { deck, leaders: [arch.leader] };
}

// A fresh character's deck + designated Leaders (random archetype).
export function newPlayerStarter() {
  const arch = STARTER_ARCHETYPES[Math.floor(Math.random() * STARTER_ARCHETYPES.length)];
  return buildBannerStarter(arch);
}
