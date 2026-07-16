// Starter deck choices — shown on the intro screen. Purely cosmetic outfit
// plus which STARTER_DECKS list seeds the player's collection.
export const STARTERS = {
  boarherd: {
    name: 'Boarherd', icon: '🐗', shirt: 0x8a4a3a, hat: 0x555c66,
    desc: 'Aggressive creatures that hit hard and fast. Overwhelm before they can answer.',
  },
  wardens: {
    name: 'Wardens', icon: '🛡️', shirt: 0x55636e, hat: 0x3a444c,
    desc: 'Guardians, healing, and card draw. Outlast everything, then win at leisure.',
  },
  redsash: {
    name: 'Red-Sash', icon: '🗡️', shirt: 0xa03a3a, hat: 0x2a2a2a,
    desc: 'Ambush and Frenzy tempo. Strike from nowhere and never stop swinging.',
  },
};

// The zone map (ZONES rings, named CAMPS, zoneAt) lives in shared/zones.js
// since the drafting epic's Phase 0 (see .claude/DRAFTING.md) so the server
// can derive duel location authoritatively. Re-exported here so the many
// client consumers (world/*.js, fullmap.js, main.js) keep one import site.
export { ZONES, CAMPS, zoneAt } from '../../shared/zones.js';

export const BOTCHAT = [
  'Legolaz: anyone beaten Gruk at the table yet? his deck is unfair',
  'Bonkstick: WTS Pack Alpha, cheap',
  'xXfrostgirlXx: Vex keeps ambushing me turn 2 lol',
  'Bonkstick: brb mom needs the computer',
  'Legolaz: how do u get more cards in this game',
  'xXfrostgirlXx: someone pulled GRUK from a reward?? grats',
  'Bonkstick: DING!',
  'Legolaz: nice',
  "Bonkstick: anyone made it to Highgate yet? that walk is LONG",
  'xXfrostgirlXx: Tarn wrecked me right outside the gate lol',
];
