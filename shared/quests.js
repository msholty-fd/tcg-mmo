// Quest definitions + gating logic — shared so the server can validate
// accepts/turn-ins and award progress, while the client renders text and
// markers from the same data.
//
// `giver` is purely a client-side dialogue/NPC-matching field — the server
// never reads it, so any NPC can be a giver (see client/src/quests.js's
// GIVERS map). Marla and Aldric are the original givers; Vex and Gruk also
// offer follow-up quests once the player has beaten them (via the Aldric
// quest that requires it as a prereq).
//
// Quest state lives in profile.quests: { [id]: { state: 'active'|'completed', have } }
// (absent = hidden). Two objective shapes today:
//   - duels: { target, need }   — win N duels vs a duelist id (or 'any').
//     Progress is event-driven (progressDuelWin increments st.have on wins).
//   - collect: { cardId, need } — own >= N copies of a card id. There's no
//     "own a card" event to hook, so this is checked live against
//     profile.cards (collectHave) rather than an incrementing counter.
//     Turning in does NOT remove the cards — see DESIGN.md card-economy
//     notes; taking a player's only copy of a card as a quest cost would be
//     an unusually punishing design for a card game, and nothing else in
//     the codebase consumes cards as a cost (trading is the only cards-out
//     path, and it's opt-in/two-sided).

export const QUESTS = [
  {
    id: 'ropes', giver: 'marla', title: 'Learning the Ropes', minLvl: 1, prereq: null,
    duels: { target: 'rowan', need: 1 }, xp: 120, coins: 10,
    offer: "New face, new deck. Rowan by the well fancies himself the village champion — go show him what your cards can do. Win or lose, you'll learn something.",
    obj: have => `Defeat Duelist Rowan: ${have}/1`,
    thanks: "Beat Rowan at his own table! He'll sulk for a week. The realm thanks you.",
  },
  {
    id: 'practice', giver: 'marla', title: 'Table Stakes', minLvl: 2, prereq: 'ropes',
    duels: { target: 'any', need: 3 }, xp: 200, coins: 15,
    offer: "Talent needs sharpening. Win three duels — I don't care against whom. Every opponent plays the game differently, and you should see it all.",
    obj: have => `Win duels: ${have}/3`,
    thanks: "Three wins. You're getting a reputation around the hearth.",
  },
  {
    id: 'vex', giver: 'aldric', title: 'Red Sashes at Dusk', minLvl: 2, prereq: null,
    duels: { target: 'vex', need: 1 }, xp: 280, coins: 20,
    offer: "The Red-Sash camp in the western woods runs on one thing: Vex never loses a duel. Beat her in front of her own crew and the whole outfit loses its swagger.",
    obj: have => `Defeat Vex the Red-Sash: ${have}/1`,
    thanks: "Vex, beaten at her own game. The road breathes easier tonight.",
  },
  {
    id: 'gruk', giver: 'aldric', title: 'The Boar King', minLvl: 3, prereq: 'vex',
    duels: { target: 'gruk', need: 1 }, xp: 500, coins: 50,
    offer: "East past the ridge there's a hollow of bones, and in it, Gruk — the Boar King. They say he plays cards. They say nobody's ever won. Don't be like everybody.",
    obj: have => `Defeat Gruk the Boar King: ${have}/1`,
    thanks: "You out-played the Boar King himself. You'll be a story in this village for a hundred years.",
  },
  {
    id: 'sash_spoils', giver: 'aldric', title: 'Spoils of the Sash', minLvl: 3, prereq: 'vex',
    collect: { cardId: 'red_sash_cutpurse', need: 2 }, xp: 150, coins: 15,
    offer: "Beating Vex doesn't scatter her crew — it just makes them careless. Bring me a couple of their cutpurses, the ones that go for your throat before you've drawn a card. Proof the camp's still worth watching.",
    obj: have => `Red-Sash Cutpurses owned: ${have}/2`,
    thanks: "Two cutpurses, out of circulation. Vex's crew keeps getting smaller.",
  },
  {
    id: 'hollow_bones', giver: 'aldric', title: "Bones Don't Lie", minLvl: 4, prereq: 'gruk',
    collect: { cardId: 'ironhide_boar', need: 2 }, xp: 350, coins: 30,
    offer: "Gruk's hollow didn't empty out just because he lost. Something's still moving bone in there — ironhide boars, thick-skinned things that shrugged off militia steel. Bring me two, and we'll know the hollow's finally quiet.",
    obj: have => `Ironhide Boars owned: ${have}/2`,
    thanks: "Two ironhides, accounted for. The hollow's bones can rest.",
  },
  {
    id: 'twice_counted', giver: 'marla', title: 'Twice Counted', minLvl: 3, prereq: 'practice',
    collect: { cardId: 'quartermaster', need: 2 }, xp: 180, coins: 18,
    offer: "You know what keeps a shop running? Someone who counts twice. Bring me two Quartermasters for the counter — the card, not gossip about my life choices.",
    obj: have => `Quartermasters owned: ${have}/2`,
    thanks: "Two counted, twice each. That's how you keep a shop — and a village — standing.",
  },
  // Vex and Gruk become quest-givers here: after losing to the player once
  // (the prereq quest, given by Aldric), each offers a follow-up of their own.
  {
    id: 'vex_rematch', giver: 'vex', title: 'Best Two of Three', minLvl: 3, prereq: 'vex',
    duels: { target: 'vex', need: 2 }, xp: 240, coins: 25,
    offer: "You beat me once. Everyone gets a lucky night. Beat me twice more and I'll believe it wasn't the cards' doing.",
    obj: have => `Defeat Vex again: ${have}/2`,
    thanks: "Fine. FINE. You're better than the sash. Don't let it go to your head — I still run these woods.",
  },
  {
    id: 'kings_portrait', giver: 'gruk', title: 'A Card for a King', minLvl: 4, prereq: 'gruk',
    collect: { cardId: 'gruk', need: 1 }, xp: 260, coins: 25,
    offer: "You want to call yourself a boar king someday? Carry a piece of me into battle first. I hear I hit like one.",
    obj: have => `Gruk (the card) owned: ${have}/1`,
    thanks: "There. Now when you lose a duel, you'll have someone appropriately embarrassing to blame.",
  },
  {
    id: 'forest_standing', giver: 'aldric', title: 'The Forest, Standing', minLvl: 5, prereq: 'hollow_bones',
    collect: { cardId: 'emberwood_colossus', need: 1 }, xp: 450, coins: 40,
    offer: "Gruk's hollow is quiet, the cutpurses have thinned out — but something bigger moved through those woods once, and it left more than bones. Bring me proof the forest itself can still stand up and fight. One will do; I don't expect a forest to spare more.",
    obj: have => `Emberwood Colossus owned: ${have}/1`,
    thanks: "The forest, standing, and you're the one who found it. Aldric doesn't say this often: well done.",
  },
  // Highgate's chain — Guildmaster Yara, gating on the two Highgate duelists
  // rather than on the Aldric chain, so the capital is reachable independent
  // of the Vex/Gruk storyline (it's a separate destination, see DESIGN.md).
  {
    id: 'highgate_gate', giver: 'yara', title: 'Papers, or a Duel', minLvl: 3, prereq: null,
    duels: { target: 'verity', need: 1 }, xp: 300, coins: 25,
    offer: "Highgate doesn't let strangers in on a smile. Captain Verity holds the gate — beat her at the table and she'll vouch for you. It's cheaper than the toll, if you're any good.",
    obj: have => `Defeat Captain Verity: ${have}/1`,
    thanks: "Verity vouched for you herself — that's rarer than it should be. Welcome to Highgate.",
  },
  {
    id: 'highgate_road', giver: 'yara', title: "The Tollkeeper's Due", minLvl: 3, prereq: 'highgate_gate',
    duels: { target: 'tarn', need: 1 }, xp: 320, coins: 30,
    offer: "Every caravan that reaches these walls paid Tarn's toll first — cards, not coin. Beat him on the road and I'll waive it for every trader who says your name.",
    obj: have => `Defeat Tarn the Tollkeeper: ${have}/1`,
    thanks: "Word travels faster than a caravan. The road to Highgate is a little safer with you on it.",
  },
  {
    id: 'highgate_ledger', giver: 'yara', title: 'Good for the Ledger', minLvl: 4, prereq: 'highgate_road',
    collect: { cardId: 'warden_captain', need: 1 }, xp: 220, coins: 20,
    offer: "A trade capital runs on guarantees. Bring me a Warden Captain for the ledger — proof this city's escorts are worth what we charge for them.",
    obj: have => `Warden Captain owned: ${have}/1`,
    thanks: "Filed and countersigned. Highgate's word is good again, and that's worth more than the card.",
  },
  // Emberwatch Ruins — a night-only landmark (DESIGN.md). The Sentinel only
  // manifests after dark (client-side visibility gate in world.js/main.js),
  // so this quest is discovery flavor: Aldric points at the rumor, finding
  // the guardian itself means being out there at the right hour.
  {
    id: 'ashen_sentinel', giver: 'aldric', title: 'A Light After Dark', minLvl: 4, prereq: 'gruk',
    duels: { target: 'sentinel', need: 1 }, xp: 400, coins: 35,
    offer: "Northeast past the wilds, there's a watchtower that's been a ruin longer than anyone's lived to remember it — and travelers swear it's lit at night, though no one tends a flame up there. If something's keeping watch, I want to know if it still remembers how to fight.",
    obj: have => `Defeat the Ashen Sentinel: ${have}/1`,
    thanks: "So it does still watch. Whatever's up in that tower, you've earned its respect — or at least its notice.",
  },
  // Bram's Rest — a wayside stop on the Meadowbrook->Highgate road
  // (DESIGN.md). Early/low-level, on purpose: it's the first thing a player
  // heading toward Highgate runs into, well before Highgate's own chain.
  {
    id: 'road_toll', giver: 'aldric', title: 'The Toll Nobody Asked For', minLvl: 2, prereq: 'practice',
    duels: { target: 'footpad', need: 1 }, xp: 180, coins: 15,
    offer: "There's a rest stop east of here, past the tree line — travelers call it Bram's Rest. Lately someone's been working the fire-light, robbing anyone who stops to warm their hands. Old Bram won't say it outright, but he'd sleep easier with that road clear.",
    obj: have => `Defeat the footpad: ${have}/1`,
    thanks: "Bram's fire burns easier tonight. That road was never going to clear itself.",
  },
  // Hollowmere — a sunken swamp in the unclaimed southwest (DESIGN.md).
  // minLvl 3, no prereq: an independent discovery like Vex, not gated
  // behind the Aldric late-game chain.
  {
    id: 'hessa', giver: 'aldric', title: 'What the Mire Remembers', minLvl: 3, prereq: null,
    duels: { target: 'hessa', need: 1 }, xp: 300, coins: 25,
    offer: "Southwest of the Boarlands the ground gives out into a sunken mire — Hollowmere, the old maps call it. An old woman lives out there among the dead trees, and she plays cards like she's still settling scores with people who died before you were born. Go find out what she remembers.",
    obj: have => `Defeat Old Hessa of the Mire: ${have}/1`,
    thanks: "You've met Hessa and lived to talk about it. Most people just hear the stories and stay well clear.",
  },
  // The Emberpeaks chain — Aldric sends the player north through Cinderpass
  // into the volcanic basin. End-game gated; the two fire duelists live at
  // z~210+ past the ridge. Beating them is how the emberpeaks set enters
  // circulation (their reward pools). See DESIGN.md "Emberpeaks Phase 3".
  {
    id: 'ep_ashfall', giver: 'aldric', title: 'Through Cinderpass', minLvl: 5, prereq: 'gruk',
    duels: { target: 'ashmonger', need: 1 }, xp: 450, coins: 40,
    offer: "Far north, past the mine, the mountains wall off a valley that smokes without a fire. There's a way through — Cinderpass — and a fellow named Ashmonger Cael who dares travelers to duel among the lava. Cross the pass and put him in his place.",
    obj: have => `Defeat Ashmonger Cael: ${have}/1`,
    thanks: "You crossed into the Emberpeaks and walked back out. Few do. But Ashmonger only guards the door — something older holds the deep basin.",
  },
  {
    id: 'ep_pyrelord', giver: 'aldric', title: 'The Pyrelord', minLvl: 6, prereq: 'ep_ashfall',
    duels: { target: 'pyrelord', need: 1 }, xp: 700, coins: 70,
    offer: "The thing at the heart of the basin has a name the old maps only whisper: Ignarok, the Pyrelord. They say his deck burns as hot as the mountain and never runs cold. Go north, past Ashmonger, all the way in. Beat him, and the Emberpeaks are yours to walk.",
    obj: have => `Defeat Ignarok, the Pyrelord: ${have}/1`,
    thanks: "The Pyrelord, beaten at cards in his own caldera. The mountain still smokes — but it smokes for you now.",
  },
];

export const questById = id => QUESTS.find(q => q.id === id);

export const stateOf = (profile, id) => profile.quests?.[id]?.state || 'hidden';

export function canAccept(profile, id) {
  const q = questById(id);
  return !!q && stateOf(profile, id) === 'hidden' && profile.lvl >= q.minLvl &&
    (!q.prereq || stateOf(profile, q.prereq) === 'completed');
}

// live count of a card id owned — collect objectives check the player's
// actual current collection, not a stored/incrementing counter, so gaining
// or trading away copies is reflected immediately.
export function collectHave(profile, q) {
  return (profile.cards || []).filter(c => c.cardId === q.collect.cardId).length;
}

export const objNeed = q => (q.duels || q.collect).need;

export function canTurnin(profile, id) {
  const q = questById(id);
  const st = profile.quests?.[id];
  if (!q || st?.state !== 'active') return false;
  return q.collect ? collectHave(profile, q) >= q.collect.need : st.have >= q.duels.need;
}

// duel-win progress: mutates profile.quests, returns [{id, have}] increments.
// npcId is null for PvP wins (only 'any' quests progress). Collect quests
// have no duel hook — skipped here, checked live via collectHave instead.
export function progressDuelWin(profile, npcId) {
  const events = [];
  for (const q of QUESTS) {
    if (!q.duels) continue;
    const st = profile.quests?.[q.id];
    if (st?.state === 'active' && st.have < q.duels.need &&
        (q.duels.target === 'any' || q.duels.target === npcId)) {
      st.have++;
      events.push({ id: q.id, have: st.have });
    }
  }
  return events;
}
