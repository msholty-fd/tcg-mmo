// Hand-authored 16x16 pixel art for cards, rendered to data-URLs at load.
// Sprites are palette-keyed character grids; cards map to a sprite plus
// palette overrides, so one boar sprite serves the whole boar family.
// '.' = transparent. Display with image-rendering: pixelated.

const SPRITES = {
  // ---- creature portraits ----
  boar: {
    pal: { k: '#1a120c', d: '#8a6242', D: '#6e4a30', n: '#d8a8a0', m: '#7a4a44', e: '#2a1c14', w: '#f0e8d0' },
    rows: [
      '................',
      '..kk........kk..',
      '.kddk......kddk.',
      '.kdDdkkkkkkdDdk.',
      '.kddddddddddddk.',
      'kdddddddddddddDk',
      'kddDddddddddDddk',
      'kdkedddddddekddk',
      'kddddddddddddddk',
      'kDdddddddddddDdk',
      '.kddddnnnnddddk.',
      '.kdddnnnnnndddk.',
      '.wkddnmnnmnddkw.',
      '.wkDddnnnnddDkw.',
      '..kkkkkkkkkkkk..',
      '................',
    ],
  },
  gruk: {
    pal: { k: '#160e08', d: '#4a2e1c', D: '#38210f', n: '#b08078', m: '#5a3a34', e: '#ffb040', w: '#f0e8d0', g: '#ffd76a' },
    rows: [
      '..g..g..g..g..g.',
      '..gggggggggggg..',
      '.kddk......kddk.',
      '.kdDdkkkkkkdDdk.',
      '.kddddddddddddk.',
      'kdddddddddddddDk',
      'kddDddddddddDddk',
      'kdkedddddddekddk',
      'kddddddddddddddk',
      'kDdddddddddddDdk',
      '.kddddnnnnddddk.',
      'wkdddnnnnnndddkw',
      'wkddnmnnnmnddkkw',
      'wkDddnnnnnddDkkw',
      '.kkkkkkkkkkkkk..',
      '................',
    ],
  },
  wolf: {
    pal: { k: '#12141a', g: '#555860', G: '#484b52', e: '#c8d8f0', n: '#36393e', w: '#e8e8e8' },
    rows: [
      '................',
      '..kk........kk..',
      '.kggk......kggk.',
      '.kgGgk....kgGgk.',
      '.kggggkkkkggggk.',
      'kggggggggggggggk',
      'kgGggggggggggGgk',
      'kgkegggggggekggk',
      'kggggggggggggggk',
      '.kgggggggggggGk.',
      '.kGgggggggggggk.',
      '..kgggnnnngggk..',
      '..kwggnnnnggwk..',
      '...kggnnnnggk...',
      '....kkkkkkkk....',
      '................',
    ],
  },
  colossus: {
    pal: { k: '#101408', l: '#3a6132', L: '#2a4426', t: '#6b4a2f', T: '#57391f', e: '#aef07a' },
    rows: [
      '....kkkkkkkk....',
      '..kkllLllLllkk..',
      '.klLlllllllLllk.',
      '.kllLlkkkkllLlk.',
      '..kkkttttttkkk..',
      '..ktttTttTtttk..',
      '.kttTttttttTttk.',
      '.ktkettttttektk.',
      '.kttttTTTTttttk.',
      '.kTttttttttttTk.',
      '..kttTkkkkTttk..',
      '..kttkTTTTkttk..',
      '..kTtttttttTtk..',
      '...kttT..Tttk...',
      '...kkk....kkk...',
      '................',
    ],
  },
  hooded: {
    pal: { k: '#14101c', h: '#55636e', H: '#3a444c', s: '#d9a878', e: '#2a1c14', m: '#8a6a58' },
    rows: [
      '................',
      '....kkkkkkkk....',
      '...khhhhhhhhk...',
      '..khHhhhhhhHhk..',
      '..khhhkkkkhhhk..',
      '..khhkssssKhhk..'.replace('K', 's'),
      '.khHkssssssKHhk.'.replace('K', 's'),
      '.khhkseksekshhk.',
      '.khhkssssssKhhk.'.replace('K', 's'),
      '.khHksssssskHhk.',
      '..khkksmmskkhk..',
      '..khhkkkkkkhhk..',
      '..khHhhhhhhHhk..',
      '...kkkkkkkkkk...',
      '................',
      '................',
    ],
  },

  // ---- spell sigils ----
  bolt: {
    pal: { k: '#1a0e04', f: '#ff7a20', F: '#ffd050', r: '#dd4400' },
    rows: [
      '................',
      '..........kkk...',
      '.........kfFk...',
      '........kfFk....',
      '.......kfFFk....',
      '......kfFFk.....',
      '....kkfFFFkkk...',
      '...kfFFFFFFrk...',
      '...kkkfFFkkk....',
      '.....kfFFk......',
      '....kfFrk.......',
      '....kfrk........',
      '...kfrk.........',
      '...krk..........',
      '...kk...........',
      '................',
    ],
  },
  fury: {
    pal: { k: '#1a0e04', f: '#ff7a20', F: '#ffd050', r: '#dd4400', d: '#8a4a3a' },
    rows: [
      '................',
      '......kFk.......',
      '.....kfFfk......',
      '....kfFFFfk.....',
      '...kfFrFrFfk....',
      '...kfFFFFFfk....',
      '..kfrFFFFFrfk...',
      '..kfFFdddFFfk...',
      '..kFFkdddkFFk...',
      '..krfkdddkfrk...',
      '...kkdddddkk....',
      '...kdddddddk....',
      '...kddkkkddk....',
      '....kkk.kkk.....',
      '................',
      '................',
    ],
  },
  howl: {
    pal: { k: '#0c0e16', g: '#484b52', m: '#cfd8ff', M: '#8a94c0' },
    rows: [
      '................',
      '.........kmmk...',
      '........kmMMmk..',
      '.......kmM..mk..',
      '.......kmM..mk..',
      '.......kmM.mk...',
      '........kmmk....',
      '..k......kk.....',
      '..kk............',
      '..kgk...k.......',
      '..kggk.kgk......',
      '..kgggkgggk.....',
      '..kgggggggkk....',
      '..kggggggggggk..',
      '..kkkkkkkkkkkk..',
      '................',
    ],
  },
  burn: {
    pal: { k: '#1a0e04', f: '#ff7a20', F: '#ffd050', r: '#dd4400' },
    rows: [
      '................',
      '....k....kF.....',
      '...kFk..kfFk....',
      '..kfFk..kFfk....',
      '..kfFFk.kfFFk...',
      '.kfrFFk.kFrFk...',
      '.kfFFFFkkfFFFk..',
      'kfrFFFFkkFFFrFk.',
      'kfFFrFFFkFrFFFk.',
      'kfFFFFrFFFFFFFk.',
      '.kfFFFFFFFrFFk..',
      '.kfrFFFrFFFFfk..',
      '..kffFFFFFffk...',
      '...kkffffkkk....',
      '.....kkkk.......',
      '................',
    ],
  },
  meal: {
    pal: { k: '#140f0a', p: '#4a4038', P: '#33291f', f: '#ff7a20', F: '#ffd050', s: '#cfe8ff' },
    rows: [
      '................',
      '.....s..s..s....',
      '....s..s..s.....',
      '.....s..s..s....',
      '................',
      '..kkkkkkkkkkkk..',
      '.kppppppppppppk.',
      'kkkkkkkkkkkkkkkk',
      'kpppppppppppppPk',
      'kpPpppppppppppPk',
      '.kppppppppppppk.',
      '.kPpppppppppPpk.',
      '..kppppppppppk..',
      '..kkkfkkkkfkkk..',
      '....kFk..kFk....',
      '.....kkkkkk.....',
    ],
  },
  spark: {
    pal: { k: '#1a1204', F: '#ffd050', f: '#ff7a20', w: '#fff8e0' },
    rows: [
      '................',
      '.......kk.......',
      '.......kFk......',
      '...k...kFk...k..',
      '...kk..kFk..kk..',
      '....kF.kFk.Fk...',
      '.....kFkFkFk....',
      '..kkkkFwwFkkkk..',
      '..kFFFFwwFFFFk..',
      '.....kFkFkFk....',
      '....kF.kFk.Fk...',
      '...kk..kFk..kk..',
      '...k...kFk...k..',
      '.......kFk......',
      '.......kk.......',
      '................',
    ],
  },
  wind: {
    pal: { k: '#0e1410', w: '#aef07a', W: '#6ac96a' },
    rows: [
      '................',
      '.......kk.......',
      '......kwwk......',
      '.....kwWWwk.....',
      '....kwW..Wwk....',
      '...kwW....Wwk...',
      '..kwW......Wwk..',
      '..kk........kk..',
      '.......kk.......',
      '......kwwk......',
      '.....kwWWwk.....',
      '....kwW..Wwk....',
      '...kwW....Wwk...',
      '..kwW......Wwk..',
      '..kk........kk..',
      '................',
    ],
  },
  rite: {
    pal: { k: '#171310', b: '#e0d8c4', B: '#b8ac90', e: '#ff7a20', f: '#ffd050' },
    rows: [
      '................',
      '......kfk.......',
      '.....kefek......',
      '......kfk.......',
      '....kkkkkkk.....',
      '...kbbbbbbbk....',
      '..kbbbbbbbbbk...',
      '..kbBbbbbbBbk...',
      '..kbbbbbbbbbk...',
      '..kbkekbkekbk...',
      '..kbbbbbbbbbk...',
      '...kbbkbkbbk....',
      '...kBbbbbbBk....',
      '....kbkbkbk.....',
      '.....kkkkk......',
      '................',
    ],
  },

  // ---- reaction icons ----
  snare: {
    pal: { k: '#1a1408', r: '#a8845a', R: '#86653e', g: '#3a6132' },
    rows: [
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkrrrrrrkk...',
      '..krrkkkkkkrrk..',
      '..krk......krk..',
      '.krk........krk.',
      '.kRk........krk.',
      '.krk........kRk.',
      '..krk......krk..',
      '..krrkkkkkkrrk..',
      '...kkrRrrRrkk...',
      '.....kkkkkk.....',
      '..g...g..g...g..',
      '.gggggggggggggg.',
      '................',
    ],
  },
  bell: {
    pal: { k: '#14100a', b: '#c8a24a', B: '#9a7a30', w: '#f0e8d0', r: '#86653e' },
    rows: [
      '................',
      '.......kk.......',
      '......krrk......',
      '......krrk......',
      '.....kkbbkk.....',
      '....kbbbbbbk....',
      '...kbwbbbbbbk...',
      '...kbbbbbbbBk...',
      '..kbbbbbbbbbBk..',
      '..kbbbbbbbbbBk..',
      '..kBbbbbbbbbBk..',
      '.kBBbbbbbbbbBBk.',
      '.kkkkkkkkkkkkkk.',
      '......kbbk......',
      '.......kk.......',
      '................',
    ],
  },

  // ---- new creature portraits ----
  wraith: {
    pal: { k: '#14121a', a: '#8a8a92', A: '#64646e', e: '#ff7a20', s: '#4a4a54' },
    rows: [
      '................',
      '.....kkkkkk.....',
      '....kaaaaaak....',
      '...kaaaaaaaak...',
      '...kaAaaaaAak...',
      '..kaaeaaaaeaak..',
      '..kaaaaaaaaaak..',
      '..kaAaaaaaaAak..',
      '..kaaaaaaaaaak..',
      '...kaaAaaAaak...',
      '...kaaaaaaaak...',
      '....kaAaaAak....',
      '....kasaasak....',
      '.....ks..sk.....',
      '......k..k......',
      '................',
    ],
  },
  emberling: {
    pal: { k: '#1a0e04', f: '#ff7a20', F: '#ffd050', r: '#dd4400', e: '#fff8e0' },
    rows: [
      '................',
      '.......kk.......',
      '......kfFk......',
      '......kFfk......',
      '.....kfFFfk.....',
      '....kfFFFFfk....',
      '....kFFrFFFk....',
      '...kfFFFFFFfk...',
      '...kFeFFFFeFk...',
      '...kfFFFFFFfk...',
      '...kFFFrFFFFk...',
      '....kfFFFFfk....',
      '....krFFFFrk....',
      '.....kfrrfk.....',
      '......kkkk......',
      '................',
    ],
  },

  // ---- relic icons ----
  talisman: {
    pal: { k: '#171008', c: '#7a5a38', w: '#f0e8d0', W: '#c8b890' },
    rows: [
      '................',
      '....kccccccck...',
      '...kc.......ck..',
      '..kc.........ck.',
      '..kc.........ck.',
      '..kc.........ck.',
      '...kc.......ck..',
      '....kc.....ck...',
      '.....kkc.ckk....',
      '......kkwkk.....',
      '......kwWwk.....',
      '.....kwWwk......',
      '.....kwWk.......',
      '....kwWk........',
      '....kkk.........',
      '................',
    ],
  },
  plate: {
    pal: { k: '#10141a', p: '#8a94a0', P: '#5a636e', g: '#c8a24a' },
    rows: [
      '................',
      '..kkk......kkk..',
      '.kpppk....kpppk.',
      '.kpPpkkkkkkpPpk.',
      '.kppppppppppppk.',
      '..kppPppppPppk..',
      '..kpppppppppp k'.replace(' ', ''),
      '..kppgppppgppk..',
      '..kpppPffPpppk..'.replace('ff', 'PP'),
      '...kppppppppk...',
      '...kpPppppPpk...',
      '...kpppgppppk...',
      '....kppppppk....',
      '....kkkkkkkk....',
      '................',
      '................',
    ],
  },
  fang: {
    pal: { k: '#1a1008', w: '#f0e8d0', W: '#c8b890', f: '#ff7a20', F: '#ffd050' },
    rows: [
      '................',
      '....f.......... '.replace(' ', ''),
      '...kwwk...f.....',
      '...kwWwk........',
      '...kwwWwk...f...',
      '....kwWwk.......',
      '....kwwWwk..f...',
      '.....kwWwk......',
      '.....kwwWwk.f...',
      '......kwWwk.....',
      '......kwwwk..f..',
      '.......kwWwk....',
      '.......kwwk.f...',
      '........kwk.....',
      '.........k......',
      '................',
    ],
  },

  // ---- wardrobe garments (faction regalia icons, wardrobe.js) ------------
  // One sprite per dress slot; every item is a palette swap: c cloth,
  // C cloth shade, h highlight (the smolder tint on glow items), k outline,
  // t leather trim. Cloth colors are derived from the item's mesh color in
  // wardrobe.js so icon and 3D look can never drift apart.
  garb_head: {
    pal: { k: '#14100c', c: '#8a8578', C: '#5e5a50', h: '#b8b2a2' },
    rows: [
      '................',
      '.......kk.......',
      '......khck......',
      '......kcck......',
      '.....kchcck.....',
      '.....kcccck.....',
      '....kcchccck....',
      '...kccchcccck...',
      '...kcccccccck...',
      '..kCccccccccCk..',
      '.kkkkkkkkkkkkkk.',
      '.kCCCCCCCCCCCCk.',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
      '................',
    ],
  },
  garb_body: {
    pal: { k: '#14100c', c: '#8a8578', C: '#5e5a50', h: '#b8b2a2', t: '#3a2c1c' },
    rows: [
      '................',
      '..kkkkkkkkkkkk..',
      '.kcchccccccchck.',
      'kcckcccccccckcck',
      'kcckcccccccckcck',
      'kkkkcccccccckkkk',
      '...kcccccccck...',
      '...kttttttttk...',
      '...kcccccccck...',
      '..kcccccccccck..',
      '..kCccccccccCk..',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  garb_legs: {
    pal: { k: '#14100c', c: '#8a8578', C: '#5e5a50', h: '#b8b2a2', t: '#3a2c1c' },
    rows: [
      '................',
      '..kkkkkkkkkkkk..',
      '.kttttttttttttk.',
      '.kcccccccccccck.',
      '.kccccckkccccck.',
      '.kcccck..kcccck.',
      '.kchcck..kcchck.',
      '.kcccck..kcccck.',
      '.kcccck..kcccck.',
      '.kCccck..kccCck.',
      '.kCCCCk..kCCCCk.',
      '.kkkkkk..kkkkkk.',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  garb_back: {
    pal: { k: '#14100c', c: '#8a8578', C: '#5e5a50', h: '#b8b2a2' },
    rows: [
      '................',
      '.....kkkkkk.....',
      '....kcchccck....',
      '...kcccccccck...',
      '..kcChccccChck..',
      '.kccCccccccCcck.',
      '.kccCcchhccCcck.',
      '.kccCccccccCcck.',
      '.kccCccccccCcck.',
      '.kccCccccccCcck.',
      '.kcCCccccccCCck.',
      '.kCCCCCCCCCCCCk.',
      '.kk.kkk..kkk.kk.',
      '................',
      '................',
      '................',
    ],
  },
};

// Render any sprite with palette overrides — for non-card art (the wardrobe
// garment icons). Same 16x16 canvas machinery as artFor, keyed per palette.
const spriteCache = new Map();
export function spriteArt(name, pal = {}) {
  const key = name + JSON.stringify(pal);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const sprite = SPRITES[name];
  if (!sprite) return null;
  const url = renderSprite(sprite, { ...sprite.pal, ...pal });
  spriteCache.set(key, url);
  return url;
}

function renderSprite(sprite, pal) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const col = pal[row[x]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
    }
  });
  return c.toDataURL();
}

// card -> {sprite, pal overrides}
const CARD_ART = {
  young_boar:        { sprite: 'boar', pal: { d: '#a8815e', D: '#8a6242' } },
  wild_boar:         { sprite: 'boar' },
  tusker:            { sprite: 'boar', pal: { d: '#7a4a30', D: '#5e3620', e: '#ffb040' } },
  ironhide_boar:     { sprite: 'boar', pal: { d: '#6e7278', D: '#54585e', n: '#9a9ba0', m: '#54585e' } },
  boar_matron:       { sprite: 'boar', pal: { d: '#9a6a52', D: '#7e523e', n: '#e8b8b0' } },
  gruk:              { sprite: 'gruk' },
  darkwood_wolf:     { sprite: 'wolf' },
  pack_alpha:        { sprite: 'wolf', pal: { g: '#6e5a3c', G: '#57452c', e: '#ffd050' } },
  nightstalker:      { sprite: 'wolf', pal: { g: '#2e2a3a', G: '#221e2c', e: '#e04a3a', n: '#1a1822' } },
  militia_recruit:   { sprite: 'hooded', pal: { h: '#7a6a4a', H: '#5e5138' } },
  village_warden:    { sprite: 'hooded', pal: { h: '#55636e', H: '#3a444c' } },
  quartermaster:     { sprite: 'hooded', pal: { h: '#7a5aa8', H: '#5e4384' } },
  hearth_keeper:     { sprite: 'hooded', pal: { h: '#a8623a', H: '#84492a', e: '#ff7a20' } },
  beacon_mage:       { sprite: 'hooded', pal: { h: '#4a5ac0', H: '#3a2a6a', e: '#8ff0f0' } },
  red_sash_cutpurse: { sprite: 'hooded', pal: { h: '#a03a3a', H: '#7a2828', m: '#5a1e1e' } },
  red_sash_duelist:  { sprite: 'hooded', pal: { h: '#7a2828', H: '#571b1b', m: '#3f1212', e: '#e0b050' } },
  camp_torcher:      { sprite: 'hooded', pal: { h: '#8a5a2a', H: '#6a441e', e: '#ffd050' } },
  emberwood_colossus:{ sprite: 'colossus' },

  ember_bolt:        { sprite: 'bolt' },
  kindled_fury:      { sprite: 'fury' },
  wolf_howl:         { sprite: 'howl' },
  controlled_burn:   { sprite: 'burn' },
  hearth_meal:       { sprite: 'meal' },
  sudden_spark:      { sprite: 'spark' },
  second_wind:       { sprite: 'wind' },
  ashen_rite:        { sprite: 'rite' },

  tusk_talisman:     { sprite: 'talisman' },
  wardenplate:       { sprite: 'plate' },
  ember_fang:        { sprite: 'fang' },

  hidden_snare:      { sprite: 'snare' },
  boar_pit:          { sprite: 'snare', pal: { r: '#6b4a2f', R: '#57391f' } },
  alarm_bell:        { sprite: 'bell', pal: { b: '#8a94a0', B: '#5a636e' } },
  warding_bell:      { sprite: 'bell' },
  counterspark:      { sprite: 'spark', pal: { k: '#0a1420', F: '#8ff0f0', f: '#4a5ac0', w: '#e0ffff' } },

  ash_sprite:        { sprite: 'emberling' },
  flame_tender:      { sprite: 'hooded', pal: { h: '#c07a3a', H: '#96562a', e: '#ffd050' } },
  pyre_keeper:       { sprite: 'emberling', pal: { f: '#dd4400', F: '#ff7a20', r: '#8a1c00' } },
  stoke_the_flames:  { sprite: 'burn', pal: { f: '#ff9a40', F: '#ffe080' } },

  ashen_shambler:    { sprite: 'wraith' },
  last_rites:        { sprite: 'rite', pal: { b: '#c8c8d0', B: '#9a9aa8' } },
  second_harvest:    { sprite: 'rite', pal: { e: '#6ac96a', f: '#aef07a' } },

  forest_sow:        { sprite: 'boar', pal: { d: '#7a6242', D: '#60492e', n: '#c8a890' } },
  dire_wolf:         { sprite: 'wolf', pal: { g: '#3a3d44', G: '#2c2f36', e: '#ff5a3a' } },
  red_sash_ambusher: { sprite: 'hooded', pal: { h: '#b04848', H: '#883434', m: '#661f1f' } },
  warden_captain:    { sprite: 'hooded', pal: { h: '#4a6a8a', H: '#33506a', e: '#c8a24a' } },
  thicket_beast:     { sprite: 'colossus', pal: { l: '#4a7a3a', L: '#375c2c', t: '#7a5a38' } },

  // ---- enchantments (face-up, persistent) ----
  herd_instinct:     { sprite: 'boar', pal: { d: '#c8a24a', D: '#9a7a30', n: '#f0e0b0', e: '#ffe080' } },
  bastion_oath:      { sprite: 'plate', pal: { p: '#c8a24a', P: '#9a7a30', g: '#f0e8d0' } },
  ember_communion:   { sprite: 'spark', pal: { F: '#ff9a40', f: '#dd4400', w: '#ffe0c0' } },
  ashen_vigil:       { sprite: 'bell', pal: { b: '#8a8a92', B: '#64646e', w: '#d8d8e0', r: '#5a5a64' } },

  // ---- keyword-gap and curve-filler new blood ----
  warded_acolyte:      { sprite: 'hooded', pal: { h: '#3a6a7a', H: '#2a4e5c', e: '#8ff0f0' } },
  sanctum_guardian:    { sprite: 'hooded', pal: { h: '#9aa8b8', H: '#727e8c', e: '#f0f4ff' } },
  tuskblade_berserker: { sprite: 'boar', pal: { d: '#8a3a2a', D: '#6e2c1e', e: '#ffb040' } },
  bloodmoon_wolf:      { sprite: 'wolf', pal: { g: '#5a2a2a', G: '#441f1f', e: '#ff8a70' } },
  warthog_battering_ram:{ sprite: 'boar', pal: { d: '#5e5a54', D: '#46433e', n: '#a8a49c', m: '#46433e' } },
  rootbound_titan:     { sprite: 'colossus', pal: { l: '#2e4a24', L: '#22381b', t: '#5a3f22', T: '#43301a', e: '#c8f07a' } },
  cinder_warden:       { sprite: 'hooded', pal: { h: '#8a4a2a', H: '#6a381e', e: '#ffb040' } },
  charnel_hound:       { sprite: 'wolf', pal: { g: '#4a5a4a', G: '#384438', e: '#aef07a', n: '#2a332a' } },
  grave_caller:        { sprite: 'hooded', pal: { h: '#3a2a4a', H: '#2a1e38', e: '#b070ff' } },
  piercing_barb:       { sprite: 'fang', pal: { w: '#c8ccd0', W: '#9aa0a8', f: '#ff7a20', F: '#ffd050' } },
  widows_kiss:         { sprite: 'talisman', pal: { c: '#5a2a4a', w: '#f0c8d8', W: '#c890a8' } },
  scout_ahead:         { sprite: 'rite', pal: { b: '#c8d8f0', B: '#9ab0d0', e: '#4a7ac0', f: '#8ff0f0' } },
  rally_the_line:      { sprite: 'fury', pal: { f: '#4a7ac0', F: '#ffd050', r: '#2a4e8a', d: '#c8a24a' } },

  // ---- Vex's Red-Sash: deepening ambush/bandit identity ----
  red_sash_picklock:   { sprite: 'hooded', pal: { h: '#8a3a5a', H: '#6a2c46', m: '#4a1e34' } },
  masked_raider:       { sprite: 'hooded', pal: { h: '#5a3a8a', H: '#432c6a', m: '#2e1e4a' } },
  vex:                 { sprite: 'hooded', pal: { h: '#8a1a2a', H: '#661420', m: '#3a0e14', e: '#ffd050' } },
  stolen_blade:        { sprite: 'fang', pal: { w: '#c8b8a0', W: '#9a8a70', f: '#8a3a3a', F: '#a85050' } },
  ambush_horn:         { sprite: 'bell', pal: { b: '#8a3a3a', B: '#661f1f', w: '#f0d8c8', r: '#4a1414' } },
  shakedown:           { sprite: 'bolt', pal: { f: '#8a3a3a', F: '#c85a4a', r: '#5a1e1e' } },

  // ---- Maren the Shrinekeeper: Ward as a persistent axis ----
  warding_litany:      { sprite: 'plate', pal: { p: '#e8e0c8', P: '#c8b890', g: '#8fd0ff' } },
  blessed_icon:        { sprite: 'talisman', pal: { c: '#d8c890', w: '#eaf6ff', W: '#bcd8f0' } },
  shrines_grace:       { sprite: 'bell', pal: { b: '#eaf6ff', B: '#bcd8f0', w: '#ffffff', r: '#8fa8c0' } },
  pilgrims_vow:        { sprite: 'rite', pal: { b: '#eaf6ff', B: '#bcd8f0', e: '#8fd0ff', f: '#ffffff' } },
  shrine_elder:        { sprite: 'hooded', pal: { h: '#d8d0c0', H: '#b0a890', e: '#8fd0ff' } },

  // ---- Duelist Rowan: deepening the Guardian/wall identity ----
  line_holder:         { sprite: 'hooded', pal: { h: '#4a5866', H: '#333e48' } },
  shieldwall_sergeant: { sprite: 'hooded', pal: { h: '#5e6b78', H: '#44505c', e: '#c8a24a' } },
  stand_and_hold:      { sprite: 'rite', pal: { b: '#c8d0d8', B: '#98a4b0', e: '#c8a24a' } },
  watchers_oath:       { sprite: 'plate', pal: { p: '#4a5c68', P: '#333f48', g: '#c8a24a' } },
  bulwark_doctrine:    { sprite: 'plate', pal: { p: '#7a8896', P: '#566068', g: '#ffe080' } },
  rowan:               { sprite: 'hooded', pal: { h: '#3a4a5e', H: '#293643', e: '#c8a24a' } },
  bastion_keep:        { sprite: 'colossus', pal: { l: '#6a7078', L: '#4e545c', t: '#8a94a0', T: '#5a636e', e: '#c8a24a' } },

  // ---- Kestrel Twinstrike: Frenzy as a deck-wide identity ----
  hotblood_recruit:    { sprite: 'hooded', pal: { h: '#c05030', H: '#8a3a20', m: '#5a2412' } },
  twinblade_mercenary: { sprite: 'hooded', pal: { h: '#b03838', H: '#852a2a', m: '#5a1c1c', e: '#e0b050' } },
  twin_fangs:          { sprite: 'fang', pal: { w: '#c8b8a0', W: '#9a8a70', f: '#ff3a3a', F: '#ff8a50' } },
  reckless_charge:     { sprite: 'fury', pal: { f: '#e04040', F: '#ffb040', r: '#8a1a1a', d: '#5a2a2a' } },
  bandit_creed:        { sprite: 'plate', pal: { p: '#6a2a2a', P: '#481c1c', g: '#e0b050' } },
  kestrel:             { sprite: 'hooded', pal: { h: '#7a1f3a', H: '#591530', m: '#3a0e20', e: '#ffcf40' } },
  warband_champion:    { sprite: 'hooded', pal: { h: '#8a4a2a', H: '#66351c', m: '#4a2814', e: '#ffb040' } },

  // ---- Gruk the Boar King: deepening Piercing ----
  boar_lancer:         { sprite: 'boar', pal: { d: '#8a6a3a', D: '#6a4e26' } },
  tusked_reaver:       { sprite: 'boar', pal: { d: '#5a3a2a', D: '#432a1e', e: '#ffb040' } },
  honed_tusks:         { sprite: 'fury', pal: { f: '#d8c8a0', F: '#fff0d0', r: '#8a7040', d: '#5a4a2a' } },
  tusks_of_the_hollow: { sprite: 'fang', pal: { w: '#e0d0a0', W: '#b8a878', f: '#ff8a20', F: '#ffd060' } },
  boarlords_fury:      { sprite: 'plate', pal: { p: '#8a6a3a', P: '#6a4e26', g: '#ffcf40' } },

  // ---- Marrow the Delver: graveyard-matters as a deck-wide identity ----
  bone_delver:         { sprite: 'wraith', pal: { a: '#c8bc98', A: '#a89870', e: '#5a6e4a', s: '#3a3424' } },
  charnel_colossus:    { sprite: 'colossus', pal: { l: '#c8c0b0', L: '#a89c88', t: '#8a7a5a', T: '#6a5c40', e: '#d8f0c8' } },
  unquiet_grave:       { sprite: 'rite', pal: { b: '#c8c0a8', B: '#9a9078', e: '#8a70b0', f: '#b090d8' } },
  delvers_pick:        { sprite: 'fang', pal: { w: '#8a7050', W: '#6a5638', f: '#b8a060', F: '#d8c080' } },
  marrow:              { sprite: 'wraith', pal: { a: '#4a3a5a', A: '#342846', e: '#b070ff', s: '#1e1828' } },

  // ---- Captain Verity: Lifesteal as a deck-wide identity ----
  sworn_medic:         { sprite: 'hooded', pal: { h: '#7a2e3a', H: '#5c2129', e: '#ff6a6a' } },
  hearthguard_veteran: { sprite: 'hooded', pal: { h: '#8a3244', H: '#661f2c', e: '#ffb0b0' } },
  crimson_vow:         { sprite: 'rite', pal: { b: '#e8c8c8', B: '#c09090', e: '#c81a1a', f: '#ff6a6a' } },
  verities_oath:       { sprite: 'plate', pal: { p: '#6e2530', P: '#4f1a22', g: '#ff6a6a' } },
  verity:              { sprite: 'hooded', pal: { h: '#5a1f2c', H: '#40151f', e: '#c8a24a' } },
  hearthbound_champion:{ sprite: 'hooded', pal: { h: '#6e2530', H: '#4f1a22', e: '#ffd050' } },

  // ---- Halvard Stillwatch: reaction-heavy control, Cinderpass Warden ----
  // slate-grey + ember-orange accent — new to the roster (distinct from
  // Rowan's steel-blue, Maren's pale-icy, Verity's crimson, Vex/Kestrel's
  // bandit red, Gruk's bronze, Marrow's purple).
  patient_sentry:      { sprite: 'plate', pal: { p: '#5a6068', P: '#3c4046', g: '#8fa8c0' } },
  ridgewatch_warden:   { sprite: 'plate', pal: { p: '#4a5058', P: '#2e3238', g: '#ff8a3a' } },
  cinderpass_snare:    { sprite: 'snare', pal: { r: '#6a6a72', R: '#4e4e56', g: '#ff7a2a' } },
  backdraft:           { sprite: 'spark', pal: { F: '#ff8a3a', f: '#c8401a', w: '#fff0d8' } },
  ashfall_recall:      { sprite: 'rite', pal: { b: '#8a8a92', B: '#64646e', e: '#5a6e88', f: '#aebedc' } },
  sentrys_cloak:       { sprite: 'talisman', pal: { c: '#4a525c', w: '#c8d0da', W: '#8a94a0' } },
  halvard:             { sprite: 'hooded', pal: { h: '#4a525c', H: '#333a42', e: '#ff8a3a' } },

  // ---- Tarn the Tollkeeper: kindle-matters as a deck-wide identity ----
  // warm brass/amber accent — new to the roster (distinct from the Ashen
  // Sentinel's ember-orange, Gruk's bronze, Rowan's steel-blue).
  toll_urchin:         { sprite: 'hooded', pal: { h: '#8a6a2a', H: '#6a501e', e: '#ffd050' } },
  ledger_keeper:       { sprite: 'hooded', pal: { h: '#7a5a3a', H: '#5c4229', e: '#c8a24a' } },
  tollgate_ram:        { sprite: 'boar', pal: { d: '#9a7a42', D: '#785e30', e: '#ffcf70' } },
  open_the_gate:       { sprite: 'rite', pal: { b: '#e8d8a0', B: '#c0a868', e: '#ffb040', f: '#ffe080' } },
  tarn:                { sprite: 'hooded', pal: { h: '#6a4e1e', H: '#4c3814', e: '#ffcf40' } },
  tollroad_colossus:   { sprite: 'colossus', pal: { l: '#8a6a3a', L: '#6a4e26', t: '#5a4020', e: '#ffcf40' } },

  // ---- Cobb the Farmhand: vanilla curve, no gimmick — earthy
  // green/homespun-brown accent, new to the roster (distinct from every
  // prior duelist's palette).
  farmhands_boy:       { sprite: 'hooded', pal: { h: '#6a7a4a', H: '#4e5c36', m: '#7a5a3a' } },
  stout_plowman:       { sprite: 'hooded', pal: { h: '#7a8a4a', H: '#5c6936', m: '#8a6a3a' } },
  yoke_ox:             { sprite: 'boar', pal: { d: '#8a7862', D: '#6e5e4a', n: '#c8b8a0' } },
  old_drover:          { sprite: 'hooded', pal: { h: '#8a9a5a', H: '#697544', m: '#9a7a4a', e: '#c8a24a' } },
  cobb:                { sprite: 'hooded', pal: { h: '#5a6a3a', H: '#43502a', m: '#8a6a3a', e: '#c8a24a' } },
  harrows_plow_ox:     { sprite: 'colossus', pal: { l: '#7a6a4a', L: '#5e5038', t: '#8a7862', T: '#6e5e4a', e: '#e0d0a0' } },

  // ---- A Footpad: "ambush the ambusher" — dark shadow-green + pale
  // moonlight-tan accent, new to the roster (distinct from Cobb's bright
  // green/homespun-brown, Vex/Kestrel's bandit red, Marrow's purple, and
  // every other prior duelist's palette — reads as underbrush at night
  // rather than gang colors, even though this is a third Red-Sash duelist).
  wayside_watcher:     { sprite: 'hooded', pal: { h: '#3a4438', H: '#283020', m: '#5a4a30' } },
  quick_fingers:       { sprite: 'snare', pal: { r: '#8a9878', R: '#6a7a5c', g: '#c8c090' } },
  false_camp:          { sprite: 'talisman', pal: { c: '#3a4438', w: '#c8c090', W: '#9a9870' } },
  roadblock:           { sprite: 'snare', pal: { r: '#5a6a4c', R: '#425038', g: '#c8c090' } },
  turned_tables:       { sprite: 'snare', pal: { r: '#2e3a26', R: '#1e2818', g: '#c8c090' } },
  red_sash_watchman:   { sprite: 'hooded', pal: { h: '#5e3a3a', H: '#452a2a', m: '#3a4438' } },
  uninvited_guest:     { sprite: 'wraith', pal: { a: '#3a4438', A: '#283020', e: '#c8c090', s: '#1c2416' } },

  // ---- Old Hessa: kindle+graveyard hybrid — bog-fire (sickly green ember
  // instead of orange) distinguishes her from Tarn's orange kindle palette
  // and Marrow's purple grave palette, reusing existing sprites throughout.
  willow_wisp:         { sprite: 'emberling', pal: { f: '#5adf8a', F: '#c8ffb0', r: '#1e6a38', e: '#eafff0' } },
  bog_kindler:         { sprite: 'hooded', pal: { h: '#4a6a4a', H: '#344c34', e: '#7aff9a' } },
  mire_toll:           { sprite: 'bell', pal: { b: '#5a6a48', B: '#3c4a30', w: '#d8e8c0', r: '#2a3320' } },
  rekindle_the_dead:   { sprite: 'rite', pal: { b: '#c8d0b8', B: '#9aa888', e: '#5adf8a', f: '#c8ffb0' } },
  pyre_caller:         { sprite: 'wraith', pal: { a: '#4a6a52', A: '#324a3a', e: '#5adf8a', s: '#243830' } },
  hessa:               { sprite: 'hooded', pal: { h: '#3a5a3e', H: '#243c28', e: '#7aff9a' } },
  bogfire_colossus:    { sprite: 'colossus', pal: { l: '#3a5a3e', L: '#243c28', t: '#5a4a30', T: '#3c3020', e: '#7aff9a' } },

  // ---- The Ashen Sentinel: deepening pass, "ashfall" (onDeath payoffs) —
  // charcoal-ash + dying-ember-red accent, new to the roster (distinct from
  // her own existing ember-orange, Halvard's slate-blue-grey + ember-orange,
  // Tarn's warm brass/amber, and Emberpeaks' brighter orange/red). No new
  // grids authored.
  ember_husk:          { sprite: 'emberling', pal: { f: '#5c4a3e', F: '#9a7a5a', r: '#7a2010', e: '#d8b888' } },
  watchfire_whelp:     { sprite: 'wraith', pal: { a: '#5c564e', A: '#403a34', e: '#d8b888', s: '#2a2620' } },
  ashbound_warden:     { sprite: 'hooded', pal: { h: '#5c564e', H: '#3f3a34', e: '#c8a888' } },
  feed_the_fire:       { sprite: 'burn', pal: { f: '#7a5c48', F: '#c8a888', r: '#5c1810' } },
  cinderfall_rite:     { sprite: 'rite', pal: { b: '#5c564e', B: '#3f3a34', e: '#7a2010', f: '#c8503a' } },
  sentinel:            { sprite: 'hooded', pal: { h: '#3a3632', H: '#242220', e: '#c8503a' } },
  ashfall_colossus:    { sprite: 'colossus', pal: { l: '#4a443e', L: '#332e2a', t: '#6a5648', T: '#4a3c30', e: '#992e14' } },

  // ---- Emberpeaks set (fire zone) — all reuse existing sprites with fiery
  // palettes; the ember/burn/bolt/fury/spark sprites are already orange so
  // they need little override. No new grids authored.
  ep_cinder_imp:       { sprite: 'emberling', pal: { f: '#ff8a30', r: '#cc3300' } },
  ep_ashling:          { sprite: 'emberling', pal: { f: '#9a8a7a', F: '#c8b8a0', r: '#5a4a3a', e: '#e8e0d0' } },
  ep_magma_pup:        { sprite: 'wolf', pal: { g: '#a83a1e', G: '#7e2a14', e: '#ffd050', n: '#3a1a10', w: '#ff9a40' } },
  ep_ember_drake:      { sprite: 'wraith', pal: { a: '#a83a1e', A: '#7e2a14', e: '#ffd050', s: '#4a1a10' } },
  ep_cinder_acolyte:   { sprite: 'hooded', pal: { h: '#a83a2a', H: '#7e2a1c', m: '#c85a3a', e: '#ff7a20' } },
  ep_lavaback:         { sprite: 'colossus', pal: { l: '#3a2a24', L: '#241a16', t: '#5a3020', T: '#3e2014', e: '#ff6a1a' } },
  ep_flame_revenant:   { sprite: 'wraith', pal: { a: '#5a2a1e', A: '#3e1c14', e: '#ffb040', s: '#2a1410' } },
  ep_obsidian_golem:   { sprite: 'colossus', pal: { l: '#2a2630', L: '#1a1620', t: '#3a3440', T: '#26222c', e: '#ff6a1a' } },
  ep_cinderwyrm:       { sprite: 'colossus', pal: { l: '#7a2a18', L: '#561c10', t: '#9a3a1e', T: '#6e2814', e: '#ffd050' } },
  ep_ember_lash:       { sprite: 'bolt', pal: { f: '#ff8a30', r: '#cc3300' } },
  ep_fan_the_flames:   { sprite: 'fury' },
  ep_immolate:         { sprite: 'burn', pal: { f: '#ff6a1a', r: '#aa2200' } },
  ep_wildfire:         { sprite: 'burn', pal: { f: '#ffaa30', F: '#fff0a0', r: '#dd3300' } },
  ep_brand_of_embers:  { sprite: 'talisman', pal: { c: '#7a2a14', w: '#ff9a40', W: '#dd5a20' } },
  ep_eternal_pyre:     { sprite: 'rite', pal: { b: '#ffb050', B: '#cc7a20', e: '#ff5a1a', f: '#ffd050' } },
  ep_flare_trap:       { sprite: 'snare', pal: { r: '#c85a2a', R: '#8e3a18', g: '#ff7a20' } },

  // ---- Darkwood set (shared/sets/darkwood/) — cool moss-greens, moon
  // silvers, and void violets: light-starved palettes, distinct from every
  // duelist scheme and from the Emberpeaks' fire. Existing grids only.
  dw_glowcap_sprite:   { sprite: 'emberling', pal: { f: '#7ac9a0', F: '#b8f0d0', r: '#3a6e54', e: '#eafff0' } },
  dw_dusk_moth:        { sprite: 'wraith', pal: { a: '#6a5a7a', A: '#4c3f5a', e: '#d8c8f0', s: '#2a2436' } },
  dw_thicket_prowler:  { sprite: 'wolf', pal: { g: '#2c3328', G: '#1e241c', e: '#9adf70', n: '#141a12' } },
  dw_gloom_owl:        { sprite: 'emberling', pal: { f: '#5a6478', F: '#8a94a8', r: '#3a4250', e: '#ffe9a0' } },
  dw_shade_of_the_wood:{ sprite: 'hooded', pal: { h: '#26302a', H: '#182018', m: '#101610', e: '#a8e8c0' } },
  dw_gnarlwood_sentry: { sprite: 'colossus', pal: { l: '#3a4a34', L: '#28341f', t: '#4e3a28', T: '#36281a', e: '#9adf70' } },
  dw_pale_hart:        { sprite: 'boar', pal: { d: '#dfe4e8', D: '#b8c0c8', n: '#f4f8fa', m: '#9aa4ae', e: '#8fd0ff' } },
  dw_hollow_shade:     { sprite: 'wraith', pal: { a: '#2e2a3a', A: '#1e1a28', e: '#c0f0d8', s: '#12101a' } },
  dw_carried_coal:     { sprite: 'burn', pal: { f: '#ff9a40', F: '#ffd9a0' } },
  dw_hunters_lament:   { sprite: 'bolt', pal: { f: '#8fa8c0', F: '#c8d8ea', r: '#4a5a6e' } },
  dw_night_chorus:     { sprite: 'howl' },
  dw_circle_chip:      { sprite: 'talisman', pal: { c: '#5a6e54', w: '#c8d8c0', W: '#8fa886' } },
  dw_moonlit_reprisal: { sprite: 'snare', pal: { r: '#8a94a8', R: '#5a636e' } },
  dw_wisp_ring:        { sprite: 'spark', pal: { k: '#101820', F: '#c0f0d8', f: '#5a8f7a', w: '#eafff0' } },
  dw_seventh_stone:    { sprite: 'rite', pal: { b: '#9aa89a', B: '#6e7a6e', e: '#a8e8c0', f: '#d8e8d0' } },
  // Weir — a hunter half-faded: worn leathers gone grey-green, wisp-pale
  // eyes (the Circle's light, not a living one).
  weir:                { sprite: 'hooded', pal: { h: '#4e584a', H: '#363e34', m: '#242a22', e: '#c0f0d8' } },

  // ---- NEW-MECHANICS PASS (see cards.js) ----
  // The Armory: equipment (blades on 'fang', shields/cloaks on 'plate', a brand on 'talisman')
  emberforged_blade:   { sprite: 'fang', pal: { w: '#d8c0a0', W: '#a88a60', f: '#ff5a20', F: '#ffd050' } },
  oaken_aegis:         { sprite: 'plate', pal: { p: '#8a6a3a', P: '#664926', g: '#c8a24a' } },
  travelers_cloak:     { sprite: 'plate', pal: { p: '#8a8f96', P: '#5e636a', g: '#bcc0c8' } },
  huntsmans_longbow:   { sprite: 'fang', pal: { w: '#c8a878', W: '#9a7c50', f: '#6a4a2a', F: '#8a6238' } },
  everburning_brand:   { sprite: 'talisman', pal: { c: '#dd4400', w: '#ffe080', W: '#ff9a40' } },

  // Thieves' Cant: hand disruption (hooded thieves; night deeds on 'rite'/'howl')
  sticky_fingers:      { sprite: 'hooded', pal: { h: '#3a3a44', H: '#26262e', m: '#5a4a44' } },
  cutpurse_raid:       { sprite: 'rite', pal: { b: '#9a9aa4', B: '#64646e', e: '#c85a4a', f: '#e08070' } },
  extortionist:        { sprite: 'hooded', pal: { h: '#5a2a2a', H: '#401f1f', m: '#3a1414' } },
  midnight_raid:       { sprite: 'howl', pal: { g: '#2a2e44', m: '#8a94c0', M: '#5a648a' } },

  // Desperate Measures: additional-cost (ashen 'bolt', a pyre on 'burn', a grim 'colossus')
  desperate_gambit:    { sprite: 'bolt', pal: { f: '#c8c0a0', F: '#fff8e0', r: '#8a7a5a' } },
  pyre_offering:       { sprite: 'burn', pal: { f: '#ff9a40', F: '#ffe0a0', r: '#c83400' } },
  grim_bargain:        { sprite: 'colossus', pal: { l: '#5a5060', L: '#423a4a', t: '#6a5a4a', T: '#4a3e32', e: '#c85a4a' } },

  // The Wildcaller: conjuration (a summoning howl, greened)
  wild_summons:        { sprite: 'howl', pal: { g: '#3a6132', m: '#aef07a', M: '#6a9a4a' } },
  call_of_the_wild:    { sprite: 'howl', pal: { g: '#4a5a2a', m: '#c8f07a', M: '#8aa84a' } },

  // The Adepts: activated abilities (an ember imp; hooded channelers)
  emberkin_adept:      { sprite: 'emberling', pal: { f: '#ff9a30', F: '#ffe070', r: '#c83400' } },
  hearth_channeler:    { sprite: 'hooded', pal: { h: '#b0703a', H: '#8a542a', e: '#ff9a20', s: '#e8b890' } },
  bog_witch:           { sprite: 'hooded', pal: { h: '#3a5a3a', H: '#2a422a', s: '#a8b890', e: '#aef07a', m: '#2e3e2a' } },
  warcry_captain:      { sprite: 'hooded', pal: { h: '#8a4a3a', H: '#66352a', e: '#ffcf40', s: '#d8a878' } },
  spark_conjurer:      { sprite: 'hooded', pal: { h: '#5a3a8a', H: '#43296a', e: '#b070ff', s: '#c8a8d8' } },
};

const cache = new Map();

export function artFor(cardId) {
  if (cache.has(cardId)) return cache.get(cardId);
  const def = CARD_ART[cardId];
  if (!def) { cache.set(cardId, null); return null; }
  const sprite = SPRITES[def.sprite];
  const url = renderSprite(sprite, { ...sprite.pal, ...(def.pal || {}) });
  cache.set(cardId, url);
  return url;
}
