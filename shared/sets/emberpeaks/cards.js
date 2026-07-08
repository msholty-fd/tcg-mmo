// Emberpeaks set (set id 'emberpeaks') — the first zone-set beyond the core.
// Theme: FIRE, built around the game's signature resource, Kindle. Where core
// treats onKindle as a minor sub-theme, Emberpeaks makes "kindle payoff" the
// spine of the set — burn spells, ember creatures that reward kindling, and a
// persistent pyre enchantment that punishes the enemy every time you kindle.
//
// Built entirely from existing effect primitives (damage/heal/buff/
// grantKeyword/summon/emberGain/draw) and existing keywords — no engine
// changes. Registered via a side-effect import next to core (see
// client/src/duel/duelManager.js and server/duelRoom.js). Cards enter
// circulation through the Emberpeaks duelists' reward pools and the zone pack
// (Phase 3), NOT the Boarlands pack — "a new zone ships a new set" (DESIGN.md).
import { registerCards } from '../../engine/cards.js';

registerCards([
  // ---- creatures: ember-kin ----
  { id: 'ep_cinder_imp', set: 'emberpeaks', rarity: 'common', type: 'creature', cost: 1, atk: 1, hp: 1,
    triggers: { onKindle: [{ effect: 'buff', target: 'self', atk: 1, hp: 0 }] },
    name: 'Cinder Imp', text: 'When you kindle, this gains +1 attack.', flavor: 'It eats what you burn.' },
  { id: 'ep_ashling', set: 'emberpeaks', rarity: 'common', type: 'creature', cost: 2, atk: 2, hp: 2,
    name: 'Ashling', text: '', flavor: 'A handful of the mountain, still warm.' },
  { id: 'ep_magma_pup', set: 'emberpeaks', rarity: 'common', type: 'creature', cost: 2, atk: 3, hp: 1, keywords: ['ambush'],
    name: 'Magma Pup', text: '', flavor: 'Runs downhill. Always downhill.' },
  { id: 'ep_ember_drake', set: 'emberpeaks', rarity: 'uncommon', type: 'creature', cost: 3, atk: 3, hp: 2,
    triggers: { onPlay: [{ effect: 'damage', target: 'randomEnemy', amount: 2 }] },
    name: 'Ember Drake', text: 'When played, deal 2 damage to a random enemy.', flavor: 'Small wings. Large opinions.' },
  { id: 'ep_cinder_acolyte', set: 'emberpeaks', rarity: 'uncommon', type: 'creature', cost: 3, atk: 2, hp: 3,
    triggers: { onKindle: [{ effect: 'emberGain', amount: 1 }] },
    name: 'Cinder Acolyte', text: 'When you kindle, gain 1 Ember this turn.', flavor: 'Every offering, twice repaid.' },
  { id: 'ep_lavaback', set: 'emberpeaks', rarity: 'uncommon', type: 'creature', cost: 4, atk: 2, hp: 6, keywords: ['guardian'],
    name: 'Lavaback Tortoise', text: '', flavor: 'The shell cooled a thousand years ago. Barely.' },
  { id: 'ep_flame_revenant', set: 'emberpeaks', rarity: 'rare', type: 'creature', cost: 4, atk: 4, hp: 3, storiedKeyword: 'lifesteal',
    triggers: { onKindle: [{ effect: 'damage', target: 'randomEnemy', amount: 1 }] },
    name: 'Flame Revenant', text: 'When you kindle, deal 1 damage to a random enemy.', flavor: 'It remembers being a fire. It resents being less.' },
  { id: 'ep_obsidian_golem', set: 'emberpeaks', rarity: 'rare', type: 'creature', cost: 5, atk: 5, hp: 6, keywords: ['guardian'], storiedKeyword: 'piercing',
    name: 'Obsidian Golem', text: '', flavor: 'Glass that learned to hold a grudge.' },
  { id: 'ep_cinderwyrm', set: 'emberpeaks', rarity: 'rare', type: 'creature', cost: 6, atk: 6, hp: 6,
    triggers: { onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 2 }] },
    name: 'Cinderwyrm', text: 'When played, deal 2 damage to all enemy creatures.', flavor: 'The Emberpeaks are its long, slow exhale.' },

  // ---- spells: burn & kindle ----
  { id: 'ep_ember_lash', set: 'emberpeaks', rarity: 'common', type: 'spell', cost: 1,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 3 }] }, needsTarget: 'enemyUnit',
    name: 'Ember Lash', text: 'Deal 3 damage to an enemy creature.', flavor: 'A whip of live coal.' },
  { id: 'ep_fan_the_flames', set: 'emberpeaks', rarity: 'uncommon', type: 'spell', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'allAllies', atk: 1, hp: 0 }] },
    name: 'Fan the Flames', text: 'Your creatures get +1 attack.', flavor: 'Give it air and stand back.' },
  { id: 'ep_immolate', set: 'emberpeaks', rarity: 'uncommon', type: 'spell', cost: 3,
    triggers: { onPlay: [{ effect: 'damage', target: 'chosen', amount: 5 }] }, needsTarget: 'enemyUnit',
    name: 'Immolate', text: 'Deal 5 damage to an enemy creature.', flavor: 'Nothing personal. Everything final.' },
  { id: 'ep_wildfire', set: 'emberpeaks', rarity: 'rare', type: 'spell', cost: 5,
    triggers: { onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 3 }] },
    name: 'Wildfire', text: 'Deal 3 damage to all enemy creatures.', flavor: 'It does not check whose field it is.' },

  // ---- relic ----
  { id: 'ep_brand_of_embers', set: 'emberpeaks', rarity: 'uncommon', type: 'relic', cost: 2,
    triggers: { onPlay: [{ effect: 'buff', target: 'chosen', atk: 2, hp: 0 }, { effect: 'grantKeyword', target: 'chosen', keyword: 'piercing' }] }, needsTarget: 'ownUnit',
    name: 'Brand of Embers', text: 'Attach: your creature gets +2 attack and Piercing.', flavor: 'Marked once, burns forever.' },

  // ---- enchantment (persistent; onKindle re-fires every kindle) ----
  { id: 'ep_eternal_pyre', set: 'emberpeaks', rarity: 'rare', type: 'enchantment', cost: 3,
    triggers: {
      onPlay: [{ effect: 'damage', target: 'allEnemies', amount: 1 }],
      onKindle: [{ effect: 'damage', target: 'randomEnemy', amount: 1 }],
    },
    name: 'Eternal Pyre', text: 'When cast, deal 1 to all enemy creatures. Then whenever you kindle, deal 1 to a random enemy.',
    flavor: 'No one lit it. No one can put it out.' },

  // ---- reaction ----
  { id: 'ep_flare_trap', set: 'emberpeaks', rarity: 'common', type: 'reaction', cost: 2,
    reaction: { on: 'enemyAttack', effects: [{ effect: 'damage', target: 'trigger', amount: 3 }] },
    name: 'Flare Trap', text: 'Reaction: when an enemy creature attacks, deal 3 damage to it.', flavor: 'The ground itself flinches, then bites.' },
]);
