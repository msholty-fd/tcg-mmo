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
// (absent = hidden). Three objective shapes today:
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
//   - visit: { x, z, r }        — stand within r of a world spot, once.
//     Progressed server-side from the pos messages the server already
//     receives (progressVisit). Position is client-authoritative by
//     standing decision, so this gate is about discovery, not fairness —
//     the same call as the Emberwatch night gate (see DESIGN.md).

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
  // The Bee Meads — Marla's honey run (DESIGN.md worldbuilding iteration 11).
  // The realm's southwest discovery pointer: nothing else sends a player past
  // the downs into the flowers, and the meads' honey table was authored
  // "waiting on Marla" from day one. Visit-objective (the cold_hearth shape);
  // prereq'd on `practice`, not `twice_counted`, so the pointer doesn't wait
  // behind a collect grind (the Aldric vex/sash_spoils parallel-offer
  // precedent). Marla stays commerce-tier per LORE.md: late honey is boot
  // leather and shelf stock, never an omen.
  {
    id: 'honey_run', giver: 'marla', title: 'The Honey Run', minLvl: 3, prereq: 'practice',
    visit: { x: -147, z: -93, r: 12 }, xp: 240, coins: 25,
    offer: "Odo's honey is a month late and that shelf doesn't stock itself. He keeps bees in the meads down southwest — take the west road past Wynn's downs, then keep south till the grass turns to flowers. Odds are the pots are packed and sitting on his table while he stands around telling the bees about it. Go put eyes on the place for me. I'd send word, but word doesn't walk back with an answer.",
    obj: () => "Find Odo's apiary in the Bee Meads",
    thanks: "Full pots on a packed table, and the man's just slow. Good — slow I can plan around; empty I can't. That's for the boot leather. And when the honey does get here, you'll buy a pot at full price like everyone else.",
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
  // The Hall of Legends (hall.js, DESIGN.md "Narrative direction"): Yara
  // points newcomers at Chronicler Sela so the realm ledger is taught, not
  // stumbled on. Uses the visit objective; coords match chronicle.js HALL.
  {
    id: 'hall_of_legends', giver: 'yara', title: 'The Fire Remembers', minLvl: 3, prereq: 'highgate_gate',
    visit: { x: 20, z: -150, r: 8 }, xp: 150, coins: 10,
    offer: "You've seen the Chronicle work — every card you've ever won remembers who held it and what it did with them. Chronicler Sela reads the realm's ledger aloud at the shrine on the west side of the square. Go hear whose names the fire keeps. Traders respect a duelist who knows the company they're trying to join.",
    obj: () => "Hear the ledger at Highgate's shrine",
    thanks: "So now you know the names. The ledger has room for more — the fire doesn't care whose story it keeps, only that it's witnessed.",
  },
  // The stone order (2026-07-16, worldbuilding iteration 17 — DESIGN.md):
  // the realm's east pointer, the honey-run pattern verbatim — a commerce
  // giver sends the player to put eyes on a late order at a supplier's
  // yard, and the target prop has been authored waiting since the yard was
  // built (the half-cut waystone on the sledge, quarry.js: "the gilding's
  // Highgate's coin; the stone's ours"). The offer names the east road
  // (iteration 16) the way Marla's named the west walk — this quest is
  // what mints the east traffic both of iteration 16's seeds gate on.
  // Yara stays commerce-tier per LORE.md: a late stone is cartage and
  // gilders' fees, never an omen — she has no opinions on Hobb's doors.
  {
    id: 'stone_order', giver: 'yara', title: 'Bought and Paid For', minLvl: 4, prereq: 'highgate_gate',
    visit: { x: 157, z: -20, r: 12 }, xp: 260, coins: 30,
    offer: "The guild bought a waystone off Mason Hobb two seasons back — cut, gilded, and standing on the Highgate road, paid up front, because stone men don't lift a chisel otherwise. I hold a receipt and no stone. Take the Gruk road east past the hollow — there are new markers up, follow them — and put eyes on his yard for me. If my stone's cut and sitting on the sledge, the delay is the gilders' and I requote them. If it's still in the hill, I want my coin's worth of knowing.",
    obj: () => "Put eyes on Hobb's Quarry for the guild",
    thanks: "Cut, trued, on the sledge — and not a fleck of gilt on it. So Hobb kept his half of the paper and the gilders didn't, which is a different letter than the one I'd drafted, and a cheaper one. The guild pays for knowing; this is your share.",
  },
  // Where the Wool Goes (2026-07-17, worldbuilding iteration 20 — DESIGN.md):
  // the traffic-minting visit shape a third time (honey run → west, stone
  // order → east), now aimed at the Loomstead so the wool chain closes
  // end-to-end: Wynn shears, Nell carts, Ede weaves — and the player walks
  // the whole of it. Wynn is the realm's FIRST landmark-based giver (all
  // priors live in the village or Highgate); her entry in the client GIVERS
  // map is the only non-data change. Her register stays practical per
  // LORE.md — no omens, and the quest must never touch what the bellwether
  // watches for.
  {
    id: 'wool_run', giver: 'wynn', title: 'Where the Wool Goes', minLvl: 4, prereq: 'practice',
    visit: { x: 87, z: 46, r: 12 }, xp: 280, coins: 20,
    offer: "The season's clip went east on Nell's cart — weeks back now, and wool doesn't write letters. There's a weaver out past the crossroads who turns my fleeces into every shirt you've ever worn; I've never once seen her yard. Go where the wool goes. North off the Gruk road, they say — you'll know it by the cloth on the lines, dyed every color grass isn't. Tell me it got there.",
    obj: () => "Find where Wynn's wool goes",
    thanks: "Bolts on the line and my clip in her sacks. Good. Forty years I've sent wool east, and this is the first time east has a face. The flock won't care, but I'll sleep better knowing the whole of it — shear to shirt.",
  },
  // Worn to the Nub (2026-07-17, worldbuilding iteration 25 — DESIGN.md): the
  // realm's first CRAFT-TO-CRAFT errand (prior visit quests were commerce
  // giver -> supplier; this is one maker sending the player to another). Hobb
  // CUTS every waystone; Bryn BANDS them (the forge's work rack literally
  // hangs a gilded waystone band, forge.js) — two makers who complete each
  // other's work and, rooted to their yards, have never met. Hobb becomes a
  // giver (his first quest; the realm's second landmark-based giver after
  // Wynn) — one client GIVERS line, the only non-data change. This mints
  // Bryn's Forge's business, so its road (the downs rule) unlocks next. Hobb
  // stays small-omens/craft tier: worn edges and a smith's fire, never an
  // omen — the quest never touches his frost-split door, the millstone, or
  // Bryn's two doors.
  {
    id: 'worn_edges', giver: 'hobb', title: 'Worn to the Nub', minLvl: 4, prereq: 'practice',
    visit: { x: 46, z: 86, r: 12 }, xp: 280, coins: 25,
    offer: "My cutting edges are worn to the nub — thirty years of stone will do that — and there's one fire in this realm hot enough to draw new ones. North-central, past the Emberwatch road: a smith called Bryn. I've banded a thousand waystones with her iron and never once shaken her hand — a mason doesn't leave his yard, and she doesn't leave her fire. Go find her forge for me. Look for the smoke. Tell me it's real and it's hot, and I'll send the whole worn lot up on the next sledge.",
    obj: () => "Find Bryn's forge by its smoke, north of the Emberwatch road",
    thanks: "Real, then, and hot enough. Good. Thirty years I've trusted my edges to iron I never watched drawn — feels right that somebody's finally stood at both ends of it. The chisels go up on the next sledge. Here — mason's coin, for the miles.",
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
  // ── The main quest, Act I: "The Long Ash" (see .claude/LORE.md) ──────────
  // The realm's overarching story: the fires are going cold. Its own spine,
  // independent of the Vex/Gruk chain; threads existing landmarks only.
  // Bram gives his first quest here, and the Ashen Sentinel becomes a
  // quest-giver after being defeated (the Vex/Gruk precedent). The Sentinel
  // only manifests at night, so his offers/turn-ins are night-gated for free
  // (invisible NPCs can't be interacted with).
  {
    id: 'cold_hearth', giver: 'bram', title: 'The Fire That Won\'t', minLvl: 3, prereq: null,
    visit: { x: 112, z: -88, r: 10 }, xp: 250, coins: 20,
    offer: "You know I don't spook easy. But a fellow I shared this fire with for twenty years — Weir, a hunter, deep-wood sort — set a camp out past Gruk's road and never came back for his gear. Travelers say his firepit's gone cold. Say it won't take flame — not from flint, not from a carried coal. A fire that won't light isn't weather, friend. Go and look. I'd rather know.",
    obj: () => "Find Weir's camp in the Deep Darkwood",
    thanks: "Cold, then. Truly cold. Forty years I've sat this road and fed this fire every night of it, and I never once asked what it'd mean if one went out. Aldric needs to hear this — not from me. From you, who saw it.",
  },
  {
    id: 'ask_the_ash', giver: 'aldric', title: 'Ask the Ash', minLvl: 4, prereq: 'cold_hearth',
    duels: { target: 'sentinel', need: 1 }, xp: 400, coins: 35,
    offer: "A fire that won't take flame. Then it's starting — or ending, depending which version your grandmother told. The old story goes like this: the world's heart was a burning wood that never burned down, and everything it shone on, it remembered. When it went out, the memories didn't die — they banked. Every card you've ever played is one of them, still dreaming. And every hearth in this realm is a coal of that first fire, kept alive hand to hand since before there were kings. A hearth that dies, forgets — and the land around it forgets with it. You've walked the deep wood; that gloom isn't shade. There's one thing old enough to say whether the story's true, and it only walks after dark. The tower, northeast. Go at night. If it judges you worth answering, it answers with cards.",
    obj: have => `Defeat the Ashen Sentinel: ${have}/1`,
    thanks: "It spoke to you. Then the story's true enough to be worried about. Go back to it — whatever the watch was for, it's yours to hear now.",
  },
  {
    id: 'what_the_watch_keeps', giver: 'sentinel', title: 'What the Watch Keeps', minLvl: 4, prereq: 'ask_the_ash',
    collect: { cardId: 'ash_sprite', need: 2 }, xp: 300, coins: 25,
    offer: "The watch was never for the wood's return. We watched for the Going-Out to finish what it began. A cold hearth in the deep wood is how it starts. Bring me two embers that still dream — the small ones, the sprites of ash. Not to keep. To listen. I have not held a dreaming ember in four hundred years.",
    obj: have => `Ash Sprites owned: ${have}/2`,
    thanks: "…They still dream of the wood. Green, and burning, and glad. Then it is not finished — not yet. One older than my order would know how long we have: the fire that never banked, in the peaks where the heart fell. It does not answer questions. It answers duels.",
  },
  {
    id: 'where_the_heart_fell', giver: 'sentinel', title: 'Where the Heart Fell', minLvl: 6, prereq: 'what_the_watch_keeps',
    duels: { target: 'pyrelord', need: 1 }, xp: 750, coins: 75,
    offer: "North, past the pass, the first fire still burns unbound. The one who wears it calls himself a lord — Ignarok. He was old when my order raised its first stone. Beat him, and while his pride is smarting, ask him what a fire that cannot be relit means. Then come and tell me. I will be here. I am always here.",
    obj: have => `Defeat Ignarok, the Pyrelord: ${have}/1`,
    thanks: "So the Pyrelord is afraid. A thing of the first fire — afraid. He is right about one thing: what is coming is not cold. Cold is only what it leaves behind. Seven stones stand in the deep wood where an eighth has already fallen, and under the mountain the delvers dug too close to something buried on purpose. When you are ready to know more, one of those doors will open. I will keep the watch until then. I have gotten rather good at it.",
  },
  // ── The main quest, Act II: "What the Wood Kept" (see .claude/LORE.md) ───
  // The Circle of Sighs door opens (the Act I cliffhanger named it). Act II
  // answers one question — where the forgetting started, and who walks the
  // ring — and opens the next: who pulled the eighth stone down (the mine,
  // Act III's door). Weir is night-only at the Circle (the Sentinel gate),
  // so `what_the_wood_kept` is night-gated by the world itself.
  {
    id: 'the_fallen_stone', giver: 'sentinel', title: 'The Fallen Stone', minLvl: 6, prereq: 'where_the_heart_fell',
    visit: { x: 118, z: -115, r: 12 }, xp: 400, coins: 30,
    offer: "You asked what the Pyrelord fears. Here is where I would begin. Deep in the southeast wood there is a ring of stones — my order raised eight, one for each watchfire of the realm. The wood was not dark when we raised them. Go to the ring. Count what stands. I have not had the courage to ask anyone in a long time.",
    obj: () => 'Find the Circle of Sighs in the Deep Darkwood',
    thanks: "Seven, and one fallen. Still only one, then. You have stood where the forgetting started — the first watchfire to go out, so long ago the wood grew over its grave. What burns can be relit. What is forgotten must be remembered first. And something out there still remembers: the wisps do not circle for nothing. Go back at night.",
  },
  {
    id: 'what_the_wood_kept', giver: 'sentinel', title: 'What the Wood Kept', minLvl: 6, prereq: 'the_fallen_stone',
    duels: { target: 'weir', need: 1 }, xp: 600, coins: 50,
    offer: "Whatever walks the ring after dark is no beast — the wisps make way for it. If it was ever one of us, it will answer the old way: with cards. Duel it. Win or lose, learn its name.",
    obj: have => `Defeat what walks the Circle at night: ${have}/1`,
    thanks: "Weir. The hunter who would not stop looking for what killed his fire. The wood has half-forgotten him — and he it — but you dueled him, and a duel is a witnessing. That is how he is held here now: keep his story told. And mark this. The eighth stone did not crumble; it was pulled down. Nothing that lives in that wood pulls down a watchstone. Ask what the delvers found under the mountain that wanted a beacon put out.",
  },
  {
    id: 'a_coal_for_bram', giver: 'bram', title: 'A Coal for Bram', minLvl: 6, prereq: 'what_the_wood_kept',
    collect: { cardId: 'weir', need: 1 }, xp: 350, coins: 30,
    offer: "So it's him. Twenty years sharing this fire, and he goes and becomes a ghost story. The old watcher told you a witnessed ember burns brighter? Then witness him proper. His memory's out there in the wood, in the cards he plays — win a piece of it, carry it, let it be seen. Don't bring it to me to keep. Bring it everywhere. But come show me first, so an old man knows it's really him.",
    obj: have => `Weir the Forgotten (the card) owned: ${have}/1`,
    thanks: "That's his fletching on the sleeve, sure as sunrise. Hello, old friend. …Go on, take him with you. A fire that's fed doesn't die, and a story that's told doesn't either. I'll keep the first one going. You keep the second.",
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

export const objNeed = q => q.visit ? 1 : (q.duels || q.collect).need;

export function canTurnin(profile, id) {
  const q = questById(id);
  const st = profile.quests?.[id];
  if (!q || st?.state !== 'active') return false;
  return q.collect ? collectHave(profile, q) >= q.collect.need : st.have >= objNeed(q);
}

// visit progress: called from the server's pos handler with the player's
// (server-clamped) position; mutates profile.quests, returns [{id, have}]
// increments. Runs at pos-message rate (~10 Hz per client), so it's a plain
// scan with cheap early-outs — no allocation unless something progresses.
export function progressVisit(profile, x, z) {
  const events = [];
  for (const q of QUESTS) {
    if (!q.visit) continue;
    const st = profile.quests?.[q.id];
    if (st?.state !== 'active' || st.have >= 1) continue;
    const dx = x - q.visit.x, dz = z - q.visit.z;
    if (dx * dx + dz * dz <= q.visit.r * q.visit.r) {
      st.have = 1;
      events.push({ id: q.id, have: 1 });
    }
  }
  return events;
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
