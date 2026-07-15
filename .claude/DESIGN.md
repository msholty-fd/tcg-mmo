# Emberwood Online — Design Notes

Running record of the vision and the decisions made along the way, with the
reasoning. Add to this as decisions land; don't rewrite history.

## The vision (Michael, 2026-07-06)

Physical TCG cards felt *alive*: a worn Blue-Eyes had a history — trades,
games, owners — even though its power never changed. Emberwood should
recapture that digitally, and go further: because we can remember everything,
each card copy accrues a real, verifiable story.

Pillar: **the world and the card game are the same universe.** Zones map to
card themes; beating a zone's duelists is how its cards enter circulation.
Shipping a new world zone and shipping a new card set are the same act.

## The Chronicle (card identity system)

- Every copy is a minted **instance**: iid, origin ("Won from Gruk the Boar
  King"), owners[] provenance chain, battle record (duels/wins/kills/hearth
  damage), renown.
- Renown from duels (server-computed): participation (win 5 / loss 2) +
  2/kill + hearthDmg/3, capped 20 per duel.
- Levels: Fresh → Seasoned (20, cosmetic patina) → **Veteran** (60, +1/+1) →
  **Storied** (150, +2/+2 + card-specific `storiedKeyword`). Frames patina and
  gild with ★ by level.

### The balance resolution (important)

Michael explicitly did NOT want cosmetic-only ("I don't want the card to
evolve and still be weak") but had no answer for balance. The resolution:
**growth is real but decks carry a Legend Budget** (8 points; Veteran=1,
Storied=2, enforced server-side). You can't field 30 legends — you build
*around* your storied cards, which is exactly the deck-with-a-soul feeling.
Don't quietly remove the budget or make growth cosmetic; both directions were
considered and rejected.

## Combat design

- Resource: **Kindle** — burn any card from hand (once/turn) for +1 permanent
  Ember. Cards are both resource and fuel; choosing what to burn is the game.
  (Solves mana screw; creates real decisions.)
- Keywords: ambush, guardian, ward, frenzy, lifesteal, piercing. Keywords are
  the extensibility surface — prefer new keywords/effect primitives over
  special-cased rules.
- Card types: creature, spell, relic (attach = buff+grantKeyword effects),
  reaction (set face-down, max 2, auto-fires on the named enemy event — see
  "Reactions, not a stack" below), enchantment (face-up, persistent,
  player-wide — see "Enchantments, a persistent axis" below).
- Rules text and flavor are separate fields (`text` vs `flavor`); the hover
  inspector shows keyword glossary + rules + italic flavor.

## History of major pivots

1. Started as a WoW-style RPG (classes/abilities/mob grinding) — single HTML
   file refactored into modules.
2. Pivoted to MMO card game: classes → starter decks (Boarherd/Wardens/
   Red-Sash), mobs → ambient wildlife, kill quests → duel quests, boss mob
   Gruk → boss *duelist* Gruk.
3. Networking: real WS server, presence, PvP challenges, then full server
   authority (cards → progression → quests) added incrementally.
4. Chronicle + Legend Budget + rules-depth pass (relics, lifesteal/piercing,
   duel log, help panel) in one push.

## Decisions & rationale (append here)

- **Auth**: name+password recovers a character from any device; server issues a
  device token for auto-login. Logout is non-destructive.
- **Autobattle**: the shared AI plays your side (server flag `auto`). Improving
  `shared/engine/ai.js` upgrades NPCs, autobattle, and balance sims together.
- **Offline mode**: local NPC duels work without the server but earn no
  renown/XP/quest progress — stated honestly in the UI, by design.
- **NPC duels run server-side when online** so rewards/renown are authoritative;
  the local engine path is kept only as the offline fallback.

- **Pixel art over emoji** (explicit user call: emoji is "boring"): 16×16
  hand-authored grids in pixelArt.js, palette-swapped per family. Portraits
  for creatures, sigils for spells, icons for relics. Keep the style.
- **Rules + flavor are separate card fields** — inspector shows keyword
  glossary, rules, then italic flavor like a printed card.
- **UI philosophy**: HUD panels are player-owned (drag/close/hotkey/persist);
  hover-zoom answers "what does this card do" everywhere; Esc = universal back.
- **Night design**: night is a real phase (20-min days), never pitch black,
  torch-lit settlements as warm islands; moonlight is a fixed light so shadows
  don't crawl. Potential future hook: night-only content.

- **Trading (2026-07-07)** — the vision item, designed for trust and story:
  - *Proximity ritual*: you trade by walking up to someone (same range as a
    challenge) and pressing **T** — invite → accept, like duels. Trading is a
    thing you do *in the world*, not a global marketplace; scarcity of
    encounter is part of the fantasy (physical-TCG feel).
  - *Double-confirm with anti-scam reset*: both sides build offers (cards +
    coins); ANY change to either offer clears BOTH confirmations. Classic MMO
    pattern; prevents last-second swaps.
  - *Active-deck cards can't be traded* — keeps every deck permanently valid
    (30 cards) and makes "I'd have to un-deck it first" a natural friction on
    parting with a card you actually use.
  - *Provenance is the product*: on transfer the recipient is appended to the
    instance's owners[] chain; renown/level travel with the card. A Storied
    card that passed through four hands is the whole point of the game.
  - *Server-authoritative and atomic*: offers validated on every change AND
    re-validated at execution; both sides' cards/coins move in one step or
    not at all. Max 8 cards per side per trade. Blocked while dueling (and
    vice versa). Online-only — offline mode has no trading.

- **Card economy: packs yes, crafting no (2026-07-08)**. Coins had no sink
  (only trade-sweetening) and no repeatable faucet (95 total from quests).
  Decision: **packs complement trading, crafting substitutes for it** —
  randomness creates the dupes/gaps that make players trade, while targeted
  minting would price-ceiling every card and remove the reason to seek
  players (the Hearthstone-vs-physical-TCG split). So:
  - *Faucet*: coins per duel win — 5 NPC / 10 PvP. (Initially shipped with
    autobattled wins paying 0; reversed the same day — see the autobattle
    decision below.)
  - *Sink*: zone-scoped supply packs (shared/sets/core/packs.js), sold
    **in-world by Quartermaster Marla** (E when she has no quest business) —
    same philosophy as proximity trading, no global shop UI. Boarlands pack:
    25 coins, 5 cards from the core set, rarity-weighted 70/24/6. Pack mints
    are fresh instances (origin "Bought from Quartermaster Marla", renown 0),
    so storied traded copies stay strictly more valuable than anything money
    buys. Server validates coins + proximity and mints; client only renders.
  - *No crafting* unless pack luck proves painful in real play; then
    dupe-transmute only (same-set, same-rarity, priced above trading).
  - Considered and declined for now: surfacing duelist reward pools in
    dialogue ("Vex is known to carry…") — liked, but drop pools stay
    discovered knowledge for now.

- **Autobattle earns full rewards — coins, XP, renown (Michael, 2026-07-08)**.
  Autobattle is a **quality-of-life feature, not an exploit surface**: anyone
  who wanted to automate battling could do it other ways (the client is
  scriptable, position is client-authoritative), so nerfing the built-in
  convenience only punishes honest players. The `usedAuto` coin gate shipped
  earlier the same day was removed. This closes the long-open "idle-farming
  policy" question: idle farming is accepted. Don't re-add reward penalties
  for autobattle without revisiting this decision.

- **Reactions, not a stack (2026-07-08)**. Assessed MTG-style stack/priority
  and rejected it: priority windows multiply the timer/disconnect/AFK surface,
  fight the casual world-MMO pacing, and would force the shared AI (NPCs +
  autobattle) to reason about held-back responses. Instead: **Reaction cards**
  (Hearthstone-secret-shaped) — counterplay with zero protocol changes.
  - *Card type `reaction`*: played face-down on your turn (cost paid then),
    max **2 set** at once. Opponent sees a face-down card, not what it is.
  - *Auto-trigger*: fires on the named enemy event, is revealed, resolves,
    goes to the graveyard. If several match one event they fire in the order
    they were set. No prompts, no priority — resolution stays synchronous.
  - *Trigger events (v1)*: `enemySpell` (opponent plays a spell — fires
    BEFORE its effects, so `counter` can cancel them; ember stays spent),
    `enemyCreature` (fires AFTER the creature's onPlay resolves — reactions
    punish the body, they don't preempt the battlecry), `enemyAttack` (fires
    on attack declaration, before damage; if the attacker or the target dies
    to the reaction, the attack fizzles and the attack is still consumed).
  - *AI*: greedy brain sets reactions like any other playable card and does
    NOT play around enemy reactions (v1) — acceptable; NPCs telegraphing
    nothing is part of learning the pool. Revisit if autobattle win rates
    warp.
  - *Documented next rung if counterspells need to feel more active*: a
    depth-1 reaction window ("Reflex") with auto-pass — deliberately NOT
    built now. Full MTG stack: rejected, revisit only on a competitive pivot.
- **Set expansion direction (2026-07-08)**: grow the CORE set in place
  (~17 cards, 29 → 46) rather than opening a second zone-set — the Boarlands
  pack pulls from `cardsInSet('core')` so new cards enter the economy with no
  shop changes, and a second zone deserves its own worldbuilding push. Theme
  the mechanics around what's already unique here: **kindle-matters**
  (`onKindle` triggers — the signature resource becomes a build-around),
  **graveyard-matters** (`exhume` / `graveBuff` primitives — the graveyard
  was tracked but unused), plus the reaction suite and curve fillers for
  sprite families we already have art for. New engine primitives: `counter`,
  `exhume`, `graveBuff`, `resetKindle`; new trigger hook `onKindle`; new
  target selector `trigger` (the unit that tripped a reaction).

- **Enchantments, a persistent axis (2026-07-08)**: implemented the
  `enchantment` type this doc had marked "reserved but unimplemented." Picked
  to be a genuinely new axis rather than a reskin of an existing type: a
  relic attaches to *one creature* and dies with it; a reaction is face-down,
  one-shot, and consumed on trigger. An enchantment is **face-up, persistent,
  and player-wide** — it resolves its `onPlay` trigger like a relic, but then
  joins a new zone (`p.enchantments`, max 4) instead of the graveyard, so it
  keeps firing for the rest of the duel. Fits the existing trigger
  architecture instead of bolting on parallel logic: a new
  `fireEnchantmentTriggers()` in engine.js just calls the existing
  `fireTriggers()` for each card in the zone, wired into the turn-structure
  hooks creatures already use (`startOfTurn`, `endOfTurn`, `onKindle`) plus
  two new hooks — `onAllySummon` (after you play a creature; combined with an
  `onPlay` effect targeting `allAllies`, this lets one card buff your current
  board on cast AND buff future creatures as they're summoned, which reads
  as a static aura without needing a continuous-recompute system) and
  `onAllyDeath` (fired from `sweepDead` when your own creature dies — the
  graveyard-matters payoff hook). Cards are still instances (iid/level) like
  relics, but — also like relics — level doesn't mechanically scale an
  enchantment's effect magnitude; that's an existing pattern, not a new gap.
  Shipped 4 to start (Herd Instinct/boar aura, Bastion Oath/wardens
  compounding defense, Ember Communion/kindle-matters, Ashen Vigil/
  graveyard-matters) plus 13 more cards filling keyword gaps (ward, frenzy,
  lifesteal, piercing) and the thin cost-5/6 end of the curve — core set
  46 → 63 cards. Starter decks deliberately left untouched (existing decks
  are curated; no enchantment felt like a mandatory showcase). In the same
  pass, found and separately flagged (not fixed — out of scope for a feature
  branch) a pre-existing `sweepDead()` reentrancy bug: an AOE effect that
  kills 2+ creatures in one trigger can desync the recursive sweep's loop
  indices and throw; reproduced on unmodified `main` too, so it predates this
  work.

- **Buildings must be inline, never instanced (2026-07-08)**: a first pilot
  let players "enter" a house by teleporting them to a small room built far
  away in world space (invisible from the village via scene fog). Michael
  tested it and rejected it: mechanically it worked, but it read as an
  instance/loading-screen moment, not a seamless world — he wants a
  WoW-style single continuous open world. Redone as a true inline interior:
  the house's exterior box became 5 separate wall meshes (one wall split
  into two segments around a 2-unit doorway gap) sitting at the house's real
  world coordinates, with a flat interior ceiling, a small warm point light,
  and per-segment colliders — no teleport, no position jump, walking through
  the gap IS entering, exactly like walking through any other opening.
  `client/src/world.js`'s `house1Interior()` is the reference pattern for
  any future building interior. **Do not propose pocket-dimension/teleport
  rooms again** — this was tried and explicitly rejected.
- **Highgate — southern trade capital (2026-07-08)**: the "second zone"
  worldbuilding push flagged as deferred in the set-expansion decision above.
  Michael asked for a bigger city separate from the starting zone; scoped as
  a **trade hub/capital**, full-hub tier (worldbuilding + NPCs + duelists).
  Decisions:
  - *Reachable, not adjacent*: centered at (40,-145), ~187 units from spawn
    (near the 210 world-boundary clamp) — walking there is a real trip, not
    a village extension. Placed south, clear of both existing camps (Gruk's
    Hollow, Red-Sash Camp). Tagged via the existing CAMPS proximity mechanism
    (constants.js) rather than a new zone system — Highgate isn't a "camp"
    but the {x,z,r,name} shape and zoneAt()/full-map wiring already fit.
  - *Walled, not open*: a 76×76 wall square with corner watchtowers and a
    single north gate (facing back toward the village) — reads as a real
    capital rather than a bigger village, and gives the two new duelists a
    reason to exist (someone has to guard the gate and the road).
  - *No new cards or pack*: deliberately reuses existing core-set cards for
    both new duelists' decks/rewards (`warden_captain`, `counterspark`,
    `pyre_keeper`, `dire_wolf`, `second_harvest`, `thicket_beast` — all
    previously unused by any duelist). Consistent with the set-expansion
    decision above (grow core in place); a Highgate-specific pack/set is a
    plausible future step, not done here. No new vendor either — the
    Boarlands pack stays Marla's thing.
  - *Roster*: Captain Verity (Wardens-based, guards the gate) and Tarn the
    Tollkeeper (Boarherd-based, guards the road just outside it — reachable
    before you even enter). Guildmaster Yara is a non-duelist quest-giver in
    the Merchant Hall, gating a 3-quest chain (`highgate_gate` →
    `highgate_road` → `highgate_ledger`) independent of the Aldric/Vex/Gruk
    chain, so Highgate is its own destination rather than a reward for
    finishing the first one.
  - Not done, flagged for later: a Highgate-specific supply pack/vendor, a
    second card set themed around the capital, fast travel (the walk is
    part of the design intent, but revisit if it feels punishing once played
    live).

- **Emberwatch Ruins — night-only landmark (2026-07-08)**: the first
  standing-loop worldbuilding iteration (Michael asked for the world to keep
  growing autonomously in a self-paced loop, committing as it goes). Picked
  deliberately *different* from a camp/town: a ruined watchtower in the
  unclaimed northeast wilds (100,100) whose guardian, the Ashen Sentinel,
  only manifests 20:00–6:00 game-time. This is the "night-only content" hook
  the night-design decision above flagged as a future possibility — first
  time night is a mechanic, not just ambiance.
  - *Mechanism*: `sentinel.mesh.visible` is toggled by a hard `gameHour`
    check in main.js's per-frame `update()` (already has `gameHour` and
    already imports NPCs from world.js, so no new import cycle).
    `interact.js`'s `nearestInteract()` now skips NPCs with
    `mesh.visible === false` generically — reusable by any future
    conditionally-visible NPC, not Sentinel-specific.
  - *Deliberately client-side only, not server-validated*: checked first —
    the server's `npcduel` handler (server/index.js) validates NO duelist's
    proximity or time-of-day, ever (Rowan/Vex/Gruk/Verity/Tarn included), so
    a scripted client could already challenge any of them from anywhere.
    Adding a server-side night check for just the Sentinel would be a new,
    inconsistent security boundary for one landmark while leaving the same
    "hole" open everywhere else. Matches the existing
    client-authoritative-position and autobattle precedents (both above) —
    the gate is about discovery/atmosphere, not fairness.
  - *Roster*: Boarherd-based deck swapped toward the ash/ember card family
    (`ash_sprite`, `flame_tender`, `ashen_shambler`) that no other duelist
    uses — ties into the still-unused "kindle-matters"/ash flavor from the
    set-expansion decision above. An eternal, untended campfire (always lit,
    day or night) marks the ruin even before dark. Quest is discovery
    flavor: Aldric (prereq `gruk`, so it surfaces after the existing
    late-game chain) points at the rumor; finding the guardian itself means
    being out there at the right hour, no map marker.

- **Bram's Rest — wayside stop on the Highgate road (2026-07-08)**: second
  standing-loop iteration. Directly targets the open question below about
  whether the Meadowbrook->Highgate walk reads as a destination or a slog:
  a small, unglamorous rest stop at the Boarlands/Darkwood seam (20,-70),
  roughly a third of the way there — not another settlement, just a fire,
  a lean-to, and a reason to stop.
  - *Old Bram*: the first NPC using a new, generic `n.flavor` dialogue
    system added to `interact.js` (string or string[], picks randomly if an
    array; falls back to the original hardcoded line for every NPC without
    `.flavor`, so nothing earlier changes behavior). Bram is deliberately
    non-mechanical — no quest, no duel, no shop — his only job is rotating
    flavor lines that reference Vex, Gruk, Highgate/Tarn, and the Emberwatch
    rumor, so a player who's found several landmarks hears them tied
    together instead of experienced as isolated content drops.
  - *A Footpad*: a minor Red-Sash-based duelist working the rest stop,
    swapped toward the two remaining ambush/road-flavored cards
    (`red_sash_ambusher`'s flavor text — "The toll is whatever you
    carry" — was too on-the-nose not to use). Gated early (`road_toll`,
    minLvl 2, prereq `practice`) and deliberately independent of the
    Highgate/Aldric-late-game chains — this is content for a player who
    hasn't gotten far yet, on the same road Highgate sits at the end of.

- **Hollowmere — sunken swamp (2026-07-08)**: fourth standing-loop
  iteration, placed in the one quadrant (southwest, negative x/negative z)
  every prior landmark left empty. Deliberately no buildings, unlike every
  earlier camp/town — dead trees, bog pools, and reed clusters around Old
  Hessa's fire, using a new desaturated `M.deadwood`/`bogWater`/`reed`
  palette so it reads as a swamp rather than "more forest" (`deadTree()` is
  the first genuinely new tree silhouette — bare trunk + angled bare
  branches — since every earlier iteration reused the green pine `tree()`).
  - *Card budget note*: before picking Hessa's deck, checked which
    duelist-signature cards were still untouched across all 7 existing
    duelists (rowan/vex/gruk/verity/tarn/sentinel/footpad) — only
    `warding_bell` was. The 2026-07-08 set-expansion decision's
    exclusive-card budget is effectively spent; Hessa reuses
    `ashen_shambler` (its graveyard flavor text fits a bog hermit better
    than anywhere it's landed so far) alongside it. This is expected and
    fine (precedent: `ashen_rite` is already shared by Rowan and Vex) but
    worth flagging — genuinely fresh duelist-signature cards need the
    second card set, which is now more concretely motivated than when it
    was first flagged as a someday-item.
  - *Old Hessa*: an independent discovery (`hessa` quest via Aldric, minLvl
    3, no prereq) — same tier as Vex, not gated behind the late-game chain.

- **Vex the Red-Sash — 6 new ambush/bandit cards (2026-07-08)**: this
  iteration of the worldbuilding loop deepens an *existing* duelist rather
  than adding a new one. Picked Vex over the other six because Red-Sash/
  ambush was already her sharpest identity (Nightstalker + Tusk Talisman)
  but had two clear gaps: no relic granted Ambush, and she had no
  self-named signature card the way Gruk does (the `gruk` card is played by
  Gruk the duelist). Filled both: `stolen_blade` (first Ambush-granting
  relic) and `vex` (5c 4/3, Ambush+Lifesteal, pings a random enemy on
  play — same "boss plays themself" pattern as Gruk, folded into her deck
  at the cost of generic filler). Also added `red_sash_picklock` and
  `masked_raider` (curve-filling Ambush bodies) and two non-creature
  bandit cards, `ambush_horn` (reaction: summon a Red-Sash Cutpurse when
  attacked) and `shakedown` (cheap damage+draw). Deliberately did not touch
  the Footpad's cards even though he's also Red-Sash-based — he already has
  his own exclusive pair (`red_sash_ambusher`, `hidden_snare`) from the
  Bram's Rest iteration, and this pass's new cards are folded into Vex's
  deck/rewards specifically, not shared.

- **Maren the Shrinekeeper — new duelist, Ward as a persistent axis
  (2026-07-08)**: this iteration adds a genuinely *new* duelist (the
  loop's other case, alternating with the Vex deepening above). Checked
  `duelists.js` for gaps first: the `enchantment` card type — shipped as
  a whole new mechanic — had **zero duelist owners**; none of
  `herd_instinct`/`bastion_oath`/`ember_communion`/`ashen_vigil` appeared
  in any roster deck or reward pool. The Ward keyword's two keyword-gap
  fillers (`warded_acolyte`, `sanctum_guardian`) were likewise completely
  unclaimed. Both gaps, one duelist: Ward as a deck-wide persistent theme,
  which an enchantment (persistent, player-wide by construction) is the
  natural home for.
  - *Placement*: deliberately the smallest possible footprint per this
    iteration's scope (a duelist with a place to stand, not a landmark
    push). Stationed at the village shrine `client/src/world.js`'s
    `shrine(-30, 5, -.4)` — built during the town-expansion pass and
    purely decorative until now. No new structure, no CAMPS entry: the
    win is giving an existing building a reason to matter.
  - *Cards*: 5 new (`warding_litany`, `blessed_icon`, `shrines_grace`,
    `pilgrims_vow`, `shrine_elder`), all built from existing effect
    primitives — no engine changes needed. `warding_litany` (rare
    enchantment) mirrors Herd Instinct's onPlay+onAllySummon shape
    exactly, but grants the Ward keyword instead of a stat buff — the
    first enchantment to grant a keyword rather than a number.
  - *Deck*: Wardens-based via the standard `swap()` pattern — the 5 new
    cards plus `bastion_oath` (its first duelist owner) and the two
    unclaimed Ward bodies, replacing 8 generic filler cards. Reward pool
    also includes `ashen_vigil`, the one enchantment left unclaimed after
    this pass — flagged for whichever future duelist wants it.
  - Not done / untested live: visual placement at the shrine and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — same `spawnDuelist`/`interact.js` code path as every other
    duelist, so risk is judged low but it's a real gap, not a formality.

- **Waystones — the realm's road network (2026-07-08)**: after four
  iterations of *adding places*, the world was a set of scattered points
  with no connective tissue. This adds the tissue instead of another point:
  carved standing stones along the routes out of the village, each with a
  gilded arrow aimed at the place it marks the way to (Highgate, Hollowmere,
  Emberwatch, Gruk's Hollow, Red-Sash Camp), radiating from a central
  crossroads just south of the village at (7,-30). Following the stones is
  meant to make the realm read as *connected roads* rather than islands —
  a direct attempt at the standing "does the long walk feel like a slog"
  open question (a marked road with visible progress beats trackless field).
  - *Card-light by design, and by circumstance*: chosen partly because a
    concurrent session was actively editing `duelists.js`/`cards.js`/
    `pixelArt.js` (the Vex-bandits work) — staying entirely in `world.js`
    with no new duelist/cards meant zero collision risk. Good reminder that
    "what's a safe lane right now" is a legitimate input to picking the next
    iteration, not just "what's most exciting."
  - *Arrow-facing math*: a waystone is an independent 3D object at its own
    `groundH` (no terrain-hugging decal → no float/z-fight on slopes). The
    arrow's `rot = atan2(tx-x, tz-z)` because THREE's `rotation.y` here maps
    local +Z to world (sin rot, cos rot) — documented inline in world.js for
    the next person who adds a directional prop.
  - *The Wayfarer*: a flavour NPC (n.flavor system from Bram's Rest) at the
    crossroads whose lines name each road's destination, so the crossroads
    reads as "roads lead HERE and HERE," not just decoration. First flavour
    NPC placed out in the open Boarlands rather than inside a settlement.

- **Ambient wildlife variety — deer & rabbits (2026-07-08)**: sixth
  worldbuilding-loop iteration, and the first that adds *life* rather than
  *places or paths*. Before this the only ambient creatures were boars and
  wolves (both duel-themed — they mirror the boarherd/darkwood cards). Deer
  (grazing the mid-ring meadows, 40-68 from origin) and rabbits (hopping
  around the village, 16-34) are purely atmospheric — no card, no duel, no
  quest hook — to make the space *between* landmarks feel inhabited, a
  natural complement to the Waystones connecting them. New `deerMesh()` /
  `rabbitMesh()` builders in `entities.js` follow the exact box-group idiom
  of `boarMesh`/`wolfMesh`; both ride the existing `spawnCritter`
  wander/collide system, so zero new movement code. Chosen as a card-light,
  `entities.js`+`world.js`-only change specifically because a concurrent
  session was editing `cards.js`/`duelists.js`/`pixelArt.js` (the
  Shrinekeeper work) — same "pick a safe lane when the repo is busy"
  reasoning as the Waystones iteration.

- Duelist Rowan: Guardian as a deepened wall identity (2026-07-08). This
  iteration of the worldbuilding loop deepens an existing duelist (the
  loop's other case, alternating with the Maren new-duelist entry above).
  Checked every roster deck for how many cards had ever been swapped in past
  generic starter filler: Rowan had only 2 (wardenplate/second_wind), the
  least of any duelist, despite his Wardens deck leaning harder on the
  Guardian keyword than any other duelist leans on its own theme. Guardian
  was also the one keyword in the set with zero build-around/payoff cards -
  every other keyword (ambush, lifesteal, piercing, frenzy) had at least
  one - and Rowan had no self-named signature card the way Gruk/Vex do.
  7 new cards, all reusing existing effect primitives: two curve-filling
  Guardian bodies (line_holder, shieldwall_sergeant), a spell and a relic
  that grant Guardian (stand_and_hold, watchers_oath), bulwark_doctrine
  (an uncommon enchantment granting Guardian board-wide on cast and to
  creatures played afterward - the third card to use the Herd Instinct/
  Warding Litany onPlay+onAllySummon shape), his signature rowan (boss
  plays themself, like Gruk/Vex), and bastion_keep (a 6-drop wall
  finisher - Wardens had no top-end card before this). Folded into
  rowanDeck via a second chained swap(), replacing generic removal/tempo
  filler (camp_torcher x2, ember_bolt, kindled_fury x2, sudden_spark x2).

- **Harrow's Field — a working farmstead (2026-07-08)**: seventh
  worldbuilding-loop iteration. Every location so far is wild (camps,
  swamp, ruins), martial (duelists), or mercantile (Highgate, Marla) —
  nothing showed where Meadowbrook's *food* comes from. A barn, a fenced
  paddock, tilled crop rows, a scarecrow, and Farmer Harrow (flavour NPC)
  at (-55,-28), west-southwest of the village. New builders `barn()`,
  `fenceRun()`, `cropRow()`, `scarecrow()` in world.js; reuses
  `hayBale`/`crate`/`barrel`. Card-light, world.js-only (safe lane — the
  Rowan-guardian session was in the card/duelist/art files).
  - *Fences are cosmetic* (no colliders): a knee-high rail you'd step over,
    same call as the open market stall and banners. Post-only colliders
    would leave walk-through gaps between posts — a janky
    invisible-wall-with-holes feel — so a clean visual boundary with no
    collision is the better trade for a low fence. If a *pen* ever needs to
    actually contain something, revisit with a continuous rect collider per
    fence segment rather than per-post circles.
  - *Harrow's flavour ties the economy together*: his lines reference Marla
    buying his surplus for the tavern, boars raiding the field, turnips vs
    stories — grounding the farm as Meadowbrook's larder rather than set
    dressing. Third flavour NPC (after Bram, the Wayfarer), all on the same
    n.flavor system.

- **Kestrel Twinstrike — new duelist, Frenzy as a deck-wide identity
  (2026-07-08)**: this iteration of the worldbuilding loop adds a genuinely
  *new* duelist (alternating with the Rowan-deepening entry above). Checked
  `duelists.js` for gaps: Guardian (Rowan), Ambush (Vex), and Ward (Maren)
  each already had an owner; Frenzy — the other half of Red-Sash's own
  tagline ("Ambush and Frenzy tempo", `STARTERS.redsash`) — had none, and was
  the only keyword in the set with zero relic/spell that grants it. 7 new
  cards, all reusing existing effect primitives: two curve-filling Frenzy
  bodies (`hotblood_recruit`, `twinblade_mercenary`), a relic and a spell
  that grant Frenzy (`twin_fangs`, `reckless_charge`), `bandit_creed` (a rare
  enchantment granting Frenzy board-wide on cast and to creatures played
  afterward — the fourth card to use the Herd Instinct/Warding Litany/
  Bulwark Doctrine onPlay+onAllySummon shape), her signature `kestrel`
  (boss plays themself, like Gruk/Vex/Rowan), and `warband_champion` (a
  5-drop Frenzy+lifesteal finisher). Folded into `kestrelDeck` via `swap()`
  on `STARTER_DECKS.redsash`, replacing generic/off-theme filler
  (`controlled_burn`/`wolf_howl`/`hearth_meal`/`pack_alpha`/2x
  `kindled_fury`/1x `sudden_spark`).
  - *Placement*: deliberately the smallest possible footprint — stationed at
    a quiet corner of Vex's own Red-Sash Camp (-100, 58), clear of her
    tents/banner/crates but inside the existing `CAMPS` radius. No new
    structure, no new `CAMPS` entry: Kestrel drills the crew's Frenzy half
    while Vex runs Ambush, same camp, same `spawnDuelist` pattern as every
    other duelist.
  - Not done / untested live: visual placement at the camp and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — same code path as every other duelist, so risk is judged low
    but it's a real gap, not a formality.

- **Cinderhollow Mine — abandoned delving (2026-07-08)**: eighth
  worldbuilding-loop iteration, and a deliberate break from the pattern —
  the first landmark with **no NPC and no duel**, purely a scenic discovery
  due north in the Darkwood (-15,115). A new archetype (industrial/
  abandoned) to widen the world's visual vocabulary beyond wild/martial/
  mercantile/agricultural: a timbered mine mouth (near-black recessed plane
  framed by heavy posts + lintel), a rocky rise, rail tracks + ties, a
  tipped minecart, dark spoil heaps, a warning signpost.
  - *Self-contained hill*: the rise is built from stacked `M.rock` boulders
    rather than assuming the terrain has a real hill at that spot, so the
    mouth reads correctly regardless of `groundH` there. The `mineDark`
    plane is backed by collidered boulders + threshold rects so the player
    stops at the mouth — it is NOT enterable (no interior).
  - *Named but empty, on purpose*: registered as a `CAMPS` entry so finding
    it is a real "discovered a place" moment on the map/HUD, but it holds no
    content yet. This is an intentional **seed** for future underground
    content (a mine-themed duelist, a cave interior à la the inline-interior
    pattern, or a quest) — a hook placed in the world before the content
    exists, so the world hints at more than it currently holds.

- **Gruk the Boar King — Piercing as his signature keyword (2026-07-08)**:
  this iteration of the worldbuilding loop deepens an *existing* duelist
  (alternating with the new-NPC case). Assigned candidate list was Gruk,
  Captain Verity, Tarn the Tollkeeper, the Ashen Sentinel, and the Footpad
  (Rowan/Vex/Maren/Kestrel already deepened). Gruk, Verity, Tarn, and the
  Footpad were all tied at only 2 cards ever swapped into their decks — the
  thinnest in the roster — while the Ashen Sentinel had 3 and already leans
  hard on kindle-matters. Of that tied group, Gruk's own 2 swapped cards
  (`ironhide_boar`, `emberwood_colossus`) are both Piercing — an axis he was
  already leaning on but had never deepened. Checked keyword ownership:
  Guardian/Ambush/Ward/Frenzy each already had a deck-wide owner from earlier
  iterations (Rowan/Vex/Maren/Kestrel); Piercing was the one keyword left
  with no spell that grants it, and its keyword-gap relic (`piercing_barb`)
  sat unclaimed by any duelist. 5 new cards, all reusing existing effect
  primitives: two curve-filling Piercing bodies (`boar_lancer`,
  `tusked_reaver`), a spell and a relic that grant Piercing (`honed_tusks`,
  `tusks_of_the_hollow`), and `boarlords_fury` (a rare enchantment granting
  Piercing board-wide on cast and to creatures played afterward — the fifth
  card to use the Herd Instinct/Warding Litany/Bulwark Doctrine/Bandit Creed
  onPlay+onAllySummon shape). Gruk already had a self-named signature card
  (`gruk`, present since the original starter deck), so no new one was
  added. Folded into `grukDeck` via a second chained `swap()`, replacing
  generic filler (`quartermaster` x2, `kindled_fury` x2, `wolf_howl`,
  `wild_boar` x2) with the 5 new cards plus two previously-unclaimed
  Piercing fillers (`piercing_barb`, `warthog_battering_ram`); reward pool
  adds `rootbound_titan`, the last unclaimed Piercing finisher.

- **Marrow the Delver — new duelist, graveyard-matters as a deck-wide
  identity (2026-07-08)**: this iteration adds a genuinely *new* duelist
  (the loop's other case, alternating with the Gruk-deepening entry above).
  Checked `duelists.js`/`cards.js` for the thinnest remaining axis per the
  assigned candidate list (lifesteal, kindle-matters, graveyard-matters,
  reaction-heavy control): Guardian/Ambush/Ward/Frenzy/Piercing already had
  deck-wide owners (Rowan/Vex/Maren/Kestrel/Gruk); kindle-matters already
  leans on the Ashen Sentinel; but graveyard-matters (`exhume`/`graveBuff`)
  had never been claimed as a deck identity — `ashen_shambler`/`last_rites`/
  `second_harvest` are scattered as shared filler across sentinel/hessa/tarn,
  and `charnel_hound`, `grave_caller`, and the `ashen_vigil` enchantment
  (shipped with the enchantment mechanic) sat completely unclaimed by any
  roster deck — `ashen_vigil` was explicitly flagged in this file's Maren
  entry as "for whichever future duelist wants it."
  - *Placement*: claims a hook `DESIGN.md` planted on purpose — Cinderhollow
    Mine was built as "an intentional seed for future underground content (a
    mine-themed duelist...)" with no NPC of its own. Marrow stands at
    `MINE.x+12, MINE.z-2` (`client/src/world.js`), east of the mine mouth,
    clear of the boulders/rail/spoil-heap colliders but still inside the
    existing "Cinderhollow Mine" `CAMPS` radius — no new structure, no new
    zone, same `spawnDuelist`/`interact.js` code path as every other duelist.
  - *Cards*: 5 new (`shared/sets/core/cards.js`), all built from existing
    effect primitives (`exhume`/`graveBuff`/`buff`/`draw` — no engine
    changes needed): `bone_delver` (2c, curve-filling graveBuff body) and
    `charnel_colossus` (6c Guardian finisher, higher-cap graveBuff) round out
    the curve above/below the existing `ashen_shambler`(3c)/`charnel_hound`
    (4c); `unquiet_grave` (spell) and `delvers_pick` (relic) both pair
    `exhume`+`buff` at different costs/slots — the same relic-mirrors-spell
    shape as `blessed_icon`/`pilgrims_vow` for Ward; `marrow` (her signature
    card, 5c, draws a card then scales off the graveyard — the "boss plays
    themself" pattern already used for Gruk/Vex/Rowan/Kestrel).
  - *Deck*: Boarherd-based via the standard `swap()` pattern (tied with
    Red-Sash as the roster's least-used starter base, keeping Wardens from
    stacking a 5th duelist) — the 5 new cards plus the 3 previously-unclaimed
    graveyard cards (`charnel_hound`, `grave_caller`, `ashen_vigil`),
    replacing 8 generic filler cards. Reward pool adds `last_rites` and
    `second_harvest` on top of the deck.
  - Not done / untested live: visual placement at the mine and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — same `spawnDuelist`/`interact.js` code path as every other
    duelist, so risk is judged low but it's a real gap, not a formality.

- **Emberpeaks — the first zone BEYOND the grassland (Michael, 2026-07-08)**.
  Michael asked for a genuinely separate biome you leave the grassland to
  reach (options offered: lakeside fish-folk / fire mountains / underground).
  Chose **fire-elemental mountains**, built as a **seamless continuous
  biome** (not a portal/instance — honours the "one continuous world"
  decision), at **full scope** (zone + its own card set + duelists). This is
  the game's founding pillar finally realised literally: "shipping a new
  world zone and shipping a new card set are the same act."
  - *How "separate" works without instancing*: the overworld is one ground
    plane. Rather than a loading transition, the Emberpeaks are walled off by
    a **mountain ridge** to the far north; you cross through **Cinderpass**
    (a gap in the wall) into the volcanic basin beyond. Leaving the grassland
    is a *spatial/visual* threshold (climb through the pass, the ground turns
    to basalt and ember), not a loading screen. Underground was declined for
    now precisely because it can't be done seamlessly on a single ground
    plane — it would need the rejected teleport/instance system.
  - *Terrain (terrain.js)*: plane grown 480→640 (±320, matching the
    fog-of-war map's HALF=320); `groundH` gains a ridge Gaussian (crest ~39 at
    z≈160) + a raised basin, **both gated on `z` via smoothstep(135,185)** so
    the entire existing world (all content sits at z≤130, incl. Cinderhollow
    Mine at z=115) is bit-for-bit unchanged (verified: max height delta
    0.0002 across existing POIs). Volcanic vertex recolor (basalt/ash/ember
    glow) blended in by northness. World boundary grown 210→300 (main.js) so
    the basin is reachable.
  - *The ridge is a visual wall; the real barrier is collision*: movement has
    no slope limit, so raised terrain alone wouldn't stop anyone walking over
    the mountain. A dense line of collidered obsidian boulders along the crest
    (68 colliders) forms the actual wall, with the pass as the one gap.
  - *Phase plan (this is a multi-branch epic)*: **Phase 1 (DONE, this branch
    `feat/emberpeaks-terrain`)** — terrain, ridge+pass barrier, volcanic
    recolor, zone labels (Cinderpass / The Emberpeaks), basin props (lava
    pools, obsidian spires, fumaroles, scree) and ambient **ember elementals**
    (new `emberElementalMesh`, glowing emissive, wanders via spawnCritter).
    All client-only (terrain/main/entities/world/constants) — deliberately
    zero card-file touch so it can't collide with the duelist-adding sessions.
    **Phase 2 (next)** — the `emberpeaks` **card set as its own folder**
    (`shared/sets/emberpeaks/cards.js`, registered via side-effect import
    alongside core in duelManager.js + duelRoom.js), fire-themed, leaning into
    the existing Kindle/ember resource; keeps new cards OUT of the contended
    `core/cards.js`. **Phase 3** — fire-elemental **duelists** in the basin
    (roster in `shared/sets/emberpeaks/duelists.js`, merged into the spawn
    lists at the world.js + server import sites), a **quest chain** to send
    players north through the pass, and a **zone-scoped Emberpeaks pack** +
    vendor (the pillar: beating the zone's duelists / buying its pack is how
    its cards enter circulation).

- **Captain Verity — Lifesteal as a deck-wide identity (2026-07-08)**: this
  iteration of the worldbuilding loop deepens an *existing* duelist
  (alternating with the new-NPC case). Assigned candidate list was Captain
  Verity, Tarn the Tollkeeper, the Ashen Sentinel, and the Footpad
  (Rowan/Vex/Maren/Kestrel/Gruk/Marrow already deepened). Verity, Tarn, and
  the Footpad were tied at only 2 cards ever swapped into their decks — the
  thinnest in the roster — while the Ashen Sentinel had 3 and already leans
  hard on kindle-matters. Verity's Wardens deck naturally suggested Guardian
  or Ward as her next axis, but both already have deck-wide owners (Rowan,
  Maren); Tarn is Boarherd-flavored and the Footpad is Red-Sash/ambush
  territory Vex and Kestrel already share, so neither fit Verity's own
  "Wardens captain" identity better than she did. Picked **Lifesteal**
  instead — sustain-through-battle reads as "the line that doesn't fall," a
  defensive flavor distinct from Guardian's redirect-tanking and Ward's
  spell-immunity. Checked keyword ownership: Lifesteal was the one keyword
  in the set with no spell or enchantment that granted it (compare
  stand_and_hold/pilgrims_vow/reckless_charge/honed_tusks for spells,
  herd_instinct/warding_litany/bulwark_doctrine/bandit_creed/boarlords_fury
  for enchantments), and its two keyword-gap fillers (`bloodmoon_wolf`,
  `widows_kiss`) sat completely unclaimed by any roster deck since they
  shipped.
  - **6 new cards** (`shared/sets/core/cards.js`), all reusing existing
    effect primitives (buff/grantKeyword/damage/heal — no engine changes
    needed): `sworn_medic` (2c 1/3 Lifesteal) and `hearthguard_veteran` (4c
    3/4 Lifesteal) are curve-filling Lifesteal bodies; `crimson_vow` (spell)
    grants Lifesteal, filling the keyword-grant gap (Lifesteal had no
    keyword-granting spell before this — its only two grant sources were
    relics, `ember_fang`/`widows_kiss`); `verities_oath` (rare enchantment)
    grants Lifesteal board-wide on cast and to creatures played afterward —
    the sixth card to use the Herd Instinct/Warding Litany/Bulwark
    Doctrine/Bandit Creed/Boarlord's Fury onPlay+onAllySummon shape, and the
    first enchantment for Lifesteal; `verity` (her signature card, 5c 4/4
    Guardian+Lifesteal, deals 2 to a random enemy and restores 2 Hearth on
    play — same "boss plays themself" pattern as Gruk/Vex/Rowan/Kestrel/
    Marrow — she's the one card in this pass that pairs Lifesteal with
    Guardian, since a captain reads as both); `hearthbound_champion` (6c 5/7
    Lifesteal, storiedKeyword guardian — Verity's deck had no top-end finisher
    before this).
  - **Deck**: `verityDeck` in `shared/sets/core/duelists.js` chains a second
    `swap()` onto the original `warden_captain`/`counterspark` one, folding in
    the 6 new cards plus the two previously-unclaimed Lifesteal keyword-gap
    fillers (`bloodmoon_wolf`, `widows_kiss`), replacing generic filler
    (`kindled_fury` x2, `sudden_spark` x2, `camp_torcher` x2, `ember_bolt`,
    `hearth_meal`). Reward pool unchanged (`[...verityDeck, 'warden_captain',
    'counterspark', 'pyre_keeper']`) — the spread already carries all 6 new
    cards plus the two reused fillers.
  - **CARD_ART**: all 6 new cards reuse existing sprites (`hooded`/`rite`/
    `plate`) with new crimson/maroon palettes (distinct from Rowan's
    steel-blue Guardian, Maren's pale-icy Ward, and Vex/Kestrel's brighter
    bandit reds) — no new grids authored.
  - Not done / untested live: visual placement at Highgate's gate and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — same `spawnDuelist`/`interact.js` code path as every other
    duelist, so risk is judged low but it's a real gap, not a formality.

- **Halvard Stillwatch — new duelist, reaction-heavy control as a deck-wide
  identity (2026-07-08)**: this iteration adds a genuinely *new* duelist (the
  loop's other case, alternating with the Verity-deepening entry above).
  Checked the assigned candidate axes: kindle-matters already leans on the
  Ashen Sentinel (`ash_sprite`/`flame_tender` in `sentinelDeck`), but "a deck
  that builds primarily around reaction cards" was genuinely unclaimed — all
  7 existing reaction cards (`hidden_snare`/`boar_pit`/`alarm_bell`/
  `warding_bell`/`counterspark`/`ambush_horn`/`shrines_grace`) sit as at most
  a single-copy splash in whichever deck happens to carry them, never a
  deck's own identity.
  - *Placement*: per the task's steer toward The Emberpeaks' edge if it
    doesn't collide — checked DESIGN.md's Emberpeaks phase plan first: Phase
    3 (not yet built) explicitly reserves the *basin* for fire-elemental
    duelists in their own `shared/sets/emberpeaks/` folder. Placing a
    core-set duelist there would preempt that. Instead, Halvard stands on the
    grassland (south) side of Cinderpass itself — `client/src/world.js`,
    (8, 148), inside the boulder wall's x∈[-13,13] gap column, clear of the
    gate-pillar colliders and the approach signpost, still inside the
    existing "Cinderpass" `CAMPS` radius. A warden watching who tries to
    cross is a minimal-footprint fit for the edge of a landmark someone else
    just built, with zero overlap with the planned Phase 3 basin roster.
  - *Cards*: 7 new (`shared/sets/core/cards.js`), all built from existing
    effect primitives — no engine changes needed: `patient_sentry` (2c 1/4
    Ward) and `ridgewatch_warden` (4c 3/6 Ward) are curve-filling walls to
    stall behind; three new reactions spread across all three trigger events
    (`cinderpass_snare` on enemyAttack: damage+draw; `backdraft` on
    enemySpell: punish the caster's Hearth directly, distinct from
    `counterspark`'s pure counter; `ashfall_recall` on enemyCreature: exhume
    a creature back — first reaction to use `exhume`); `sentrys_cloak` (a
    bare 1-cost Ward-only relic, cheaper than `blessed_icon`'s stat+keyword
    combo); `halvard` (his signature card, 5c 3/5 Ward, gains +1/+1 per
    reaction card in his graveyard up to +3/+3 — `graveBuff`'s `filter`
    already keys off `getCard(c.card).type`, and `fireReactions` pushes spent
    reactions into the graveyard, so `filter: 'reaction'` is a genuine
    "reactions matter" payoff using an existing primitive with no engine
    change — the "boss plays themself" pattern already used for
    Gruk/Vex/Rowan/Kestrel/Marrow/Verity).
  - *Deck*: `halvardDeck` swaps `STARTER_DECKS.redsash` (the roster's
    least-used base at 3 duelists vs Wardens'/Boarherd's 4) — cutting the
    aggressive burn/tempo filler (`camp_torcher` x3, `ember_bolt` x3,
    `controlled_burn`, `wolf_howl`, `hearth_meal`) for the 7 new cards plus
    the two previously-unclaimed reactions (`boar_pit`, `alarm_bell` — both
    sat only in the Footpad's reward pool, never in an actual deck).
  - **CARD_ART**: all 7 new cards get a slate-grey + ember-orange accent
    palette (new to the roster, distinct from every existing duelist's
    scheme) on existing sprites (`plate`/`snare`/`spark`/`rite`/`talisman`/
    `hooded`) — no new grids authored.
  - Not done / untested live: visual placement at Cinderpass and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — same `spawnDuelist`/`interact.js` code path as every other
    duelist, so risk is judged low but it's a real gap, not a formality. Also
    worth a live look alongside the existing open Emberpeaks question below:
    does (8,148) actually read as "standing in the pass mouth," or does it
    look off-center against the boulder wall.

- **Tarn the Tollkeeper — kindle-matters as a deck-wide identity (2026-07-08)**:
  this iteration completes the first full pass through every original
  duelist — Vex, Maren, Rowan, Kestrel, Gruk, Marrow, Verity, and Halvard
  were already deepened, leaving only Tarn and the Footpad. Both were tied
  at only 2 cards ever swapped in, but Tarn's pair (`dire_wolf`/
  `second_harvest`) shares no theme with each other, while the Footpad's
  pair (`red_sash_ambusher`/`hidden_snare`) is at least ambush-flavored —
  Tarn was the more generic of the two, so he got the pass. Kindle-matters
  (`onKindle` triggers) was the one build-around axis still open beyond the
  Ashen Sentinel's existing lean: `pyre_keeper` (4c) had never actually been
  in a deck (only the Sentinel's reward pool), and `cinder_warden` (5c) plus
  the `ember_communion` enchantment sat completely unclaimed since they
  shipped.
  - **6 new cards** (`shared/sets/core/cards.js`), all reusing existing
    effect primitives (buff/draw/summon/heal/resetKindle — no engine changes
    needed): `toll_urchin` (1c) and `tollroad_colossus` (6c finisher) round
    out the curve at costs no kindle body had covered before; `ledger_keeper`
    (3c, onKindle draw) and `tollgate_ram` (4c, onKindle summon a Young Boar)
    diversify the onKindle payoff beyond buff/heal/damage; `open_the_gate`
    (spell) is a second kindle-enabler alongside `stoke_the_flames`; `tarn`
    (his signature card, 5c 3/6, onKindle +1/+1 and heals 1 Hearth) is the
    "boss plays themself" pattern already used for
    Gruk/Vex/Rowan/Kestrel/Marrow/Verity/Halvard — Tarn had no signature
    card before this.
  - **Deck**: `tarnDeck` chains a second `swap()` onto the original
    `dire_wolf`/`second_harvest` one (kept, matching the precedent of Rowan/
    Verity/Gruk preserving their original swap), folding in the 6 new cards
    plus the 3 previously-unclaimed kindle cards, replacing generic filler.
  - Not done / untested live: visual placement at Tarn's existing
    Highgate-road spot and the challenge-prompt flow weren't browser-verified
    (worktrees have no dev server) — no world.js change was made this
    iteration since his placement already exists, so risk is judged very low.

- **Cobb the Farmhand — vanilla stat-stick curve as a deck-wide identity
  (2026-07-08)**: this iteration adds a genuinely *new* duelist (alternating
  with Tarn's existing-NPC deepening above). Every build-around axis in the
  roster (Guardian/Ambush/Ward/Frenzy/Piercing/kindle-matters/graveyard-
  matters/lifesteal/reaction-heavy control) already had a deck-wide owner.
  What was still open: plain, keyword-free bodies with the best raw
  stats-per-cost in the set — a legitimate archetype ("just efficient
  bodies") that teaches new players the fundamentals rather than a gimmick,
  and something no duelist had ever built a deck around, even though scraps
  of it already existed as generic filler (`young_boar`/`wild_boar`/
  `dire_wolf`/`thicket_beast` — vanilla bodies with no ability text at all).
  - **6 new cards** (`shared/sets/core/cards.js`), all bare `atk`/`hp` with
    zero keywords or triggers — no engine changes needed: `farmhands_boy` (1c
    2/2), `stout_plowman` (2c 3/3), `yoke_ox` (3c 4/4), `old_drover` (4c
    5/5), `cobb` (5c 6/6, his signature — the *only* signature card in the
    whole roster with zero rules text, which is the point), `harrows_plow_ox`
    (6c 7/7). Stats sit a clean notch above the pre-existing vanilla-filler
    baseline (~2×cost+1) since a plain body's only upside is its stat line.
  - *Placement*: claims a gap nobody had closed — Harrow's Field (the
    farmstead from an earlier iteration) had a flavour NPC (Farmer Harrow)
    but no duelist, the one landmark with no duel attached. Cobb stands at
    `(-35, -28)` in `client/src/world.js`, east of the paddock's fenced
    field, clear of the barn/hayBale/crate/fence colliders. No new
    structure, no `CAMPS` entry — matching Harrow's Field's own precedent of
    never being a named zone.
  - *Deck*: `cobbDeck` swaps `STARTER_DECKS.boarherd` (Boarlands/rural flavor
    fits the farmstead; all three starter bases were tied at 4 duelists each
    by this point, so no usage tiebreak was available) — the 6 new cards
    replace one copy each of `young_boar`/`wild_boar`/`tusker`/`boar_matron`/
    `pack_alpha`/`kindled_fury`. Reward pool adds `quartermaster` and
    `hearth_meal`.
  - Headless sim note: Cobb went 3-5 against the raw boarherd starter he was
    built from (vs. favorable results mirror/wardens/redsash) — plausible for
    a deliberately no-upside archetype diluting an already-strong starter,
    not investigated further (no keyword-mechanic change, same posture as
    prior card-only iterations).
  - Not done / untested live: visual placement at Harrow's Field and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — same `spawnDuelist`/`interact.js` code path as every other
    duelist, so risk is judged low, but it's a real gap, not a formality.

- **A Footpad — "ambush the ambusher" as a deck-wide identity (2026-07-08)**:
  the last of the original 7 duelists (Rowan/Vex/Gruk/Verity/Tarn/Sentinel/
  Footpad) left un-deepened by this loop; every other axis already has an
  owner (Guardian=Rowan, Ambush=Vex, Ward=Maren, Frenzy=Kestrel,
  Piercing=Gruk, graveyard-matters=Marrow, Lifesteal=Verity,
  reaction-control=Halvard, kindle-matters=Tarn, vanilla-curve=Cobb).
  Ambush/bandit and Frenzy both already belong to fellow Red-Sash duelists
  (Vex/Kestrel), so a third Red-Sash duelist needed a genuinely different
  angle: punishing `enemyAttack` specifically — a footpad preys on whoever
  moves first — narrower than Halvard's reaction-control (which spans all
  three trigger events plus Ward walls). `hidden_snare` was always the
  footpad's one build-around hint but sat alone in a 2-card deck.
  - **7 new cards** (`shared/sets/core/cards.js`): `wayside_watcher` (1c 1/3
    bait body), `quick_fingers` (1c reaction, enemyAttack → 1 dmg + 1 Ember),
    `false_camp` (2c relic, +0/+3), `roadblock` (2c reaction, enemyAttack → 1
    dmg + summon Young Boar), `turned_tables` (3c reaction, enemyAttack → 3
    dmg + team +1 attack), `red_sash_watchman` (4c 4/4 Guardian),
    `uninvited_guest` (5c 4/5 signature, onPlay deals 3 to a random enemy).
    All existing effect primitives (damage/emberGain/summon/buff) — no
    engine changes.
  - **Deck**: `footpadDeck` chains a second `swap()` onto the original
    `red_sash_ambusher`/`hidden_snare` one (kept, matching the Rowan/Verity/
    Gruk/Tarn precedent), replacing `camp_torcher`/`ember_bolt`×2/
    `controlled_burn`/`wolf_howl`/`hearth_meal`/`pack_alpha`. Verified at
    exactly 30 cards.
  - **Naming**: kept "A Footpad" anonymous — the `road_toll` quest flavor
    text ("Old Bram won't say it outright") deliberately frames them as
    unidentified, so the signature card (`uninvited_guest`) plays on that
    instead of giving them a proper name. Grepped the repo for other
    references first; all (quests.js, world.js spawn key, duelists.js
    comments) already use the lowercase/generic "footpad" consistently.
  - Headless sim: 20 `createDuel`+`ai.takeTurn` games vs the other 12
    duelists, no crashes/hangs (200-turn cap), Footpad went 12-8.
  - Not done / untested live: visual placement at Bram's Rest (pre-existing,
    unchanged this iteration) and the challenge-prompt flow weren't
    browser-verified (worktrees have no dev server) — same code path as
    every other duelist, risk judged low.

- **Emberpeaks Phase 2 — the `emberpeaks` card set (2026-07-08)**. The first
  zone-set beyond core, and the first set to live in its OWN folder
  (`shared/sets/emberpeaks/cards.js`) — a deliberate architecture choice: the
  new cards stay out of the hotly-contended `core/cards.js` that the parallel
  duelist sessions edit constantly, so this branch never collides with them.
  Registered via a side-effect import next to core in BOTH
  `client/src/duel/duelManager.js` and `server/duelRoom.js` (the two places
  that already `import '.../core/cards.js'`). `cardsInSet()` filters by the
  `set` field, so packs/reward-pools can pull `emberpeaks` cards without any
  other wiring.
  - *Theme = FIRE, spine = Kindle.* Core treats onKindle as a minor
    sub-theme; Emberpeaks makes kindle-payoff the build-around. 16 cards (5
    common / 6 uncommon / 5 rare; 9 creatures, 4 spells, 1 relic, 1
    enchantment, 1 reaction): ember-kin that grow/ramp/burn when you kindle
    (Cinder Imp, Cinder Acolyte, Flame Revenant), burn spells (Ember Lash,
    Immolate, Wildfire), a Piercing-granting relic (Brand of Embers), a
    Cinderwyrm finisher (2-to-all on play, à la Gruk), and the signature
    **Eternal Pyre** enchantment — deals 1 to all on cast, then 1 to a random
    enemy *every time you kindle* for the rest of the duel (leans on the
    persistent-enchantment onKindle re-fire from the enchantment system).
  - *All existing primitives, no engine change* (damage/heal/buff/
    grantKeyword/summon/emberGain + existing keywords). `ep_`-prefixed ids to
    keep the namespace clean and collision-free.
  - *Not in circulation yet* — cards register (so they appear in the deck
    builder) but nothing grants them until Phase 3 adds the Emberpeaks
    duelists (reward pools) and the zone pack. That's intended: "a new zone
    ships a new set," and the set is the prerequisite for the duelists.
  - *Verified*: build + node --check clean; headless — all 16 register and
    resolve via getCard, `cardsInSet('emberpeaks')` returns 16; a 30-game
    AI-vs-AI sim with an emberpeaks-heavy deck ran 0 crashes / 0 stuck
    (exercises the onKindle creatures, the Eternal Pyre kindle re-fire, burn,
    the reaction, and the relic in real duels); live client check confirmed
    all 16 `artFor()` calls return real pixel-art data URLs with zero console
    errors. The raw emberpeaks pile won only 5/30 vs the boarherd starter, but
    that's an untuned pile vs the strongest starter — irrelevant, since these
    cards ship inside curated Phase-3 duelist decks, not as a deck.
- **Starter deck: rolled, not chosen (2026-07-08, `feat/no-deck-select`)** —
  Michael's steer: the intro screen shouldn't ask a brand-new player to pick a
  deck archetype (a meaningful choice they have no information to make yet).
  The login screen is now just name + password. A fresh character's 30-card
  deck is **rolled server-side** from `STARTER_POOL` (the dedup union of the
  three hand-built `STARTER_DECKS`, i.e. the vetted village-tier cards) via
  `rollStarterDeck()` in `shared/sets/core/cards.js`: creature-heavy (8–10
  spells, rest creatures), ≤3 copies, so it's random-per-character but always
  playable. All fresh cards are level 1 → renown 0 → 0 Legend points, so no
  Legend Budget concern at creation. The three `STARTER_DECKS` lists live on
  (village duelists still play them). Outfit (cosmetic shirt/hat/icon, once
  tied to the archetype pick) is now chosen at random by the client on new
  character creation and stored in the session; server profile.outfit stays
  authoritative for what other players see. The server is the only place that
  builds a starter deck — the client no longer sends one on join, and
  `newProfile` ignores any client-supplied deck (server authority preserved).

- **Old Hessa — kindle+graveyard hybrid as a deck-wide identity (2026-07-08,
  worldbuilding loop iteration 12)**: deepens an *existing* duelist. Checked
  the 8 named landmarks for an open (b) spot first (per the task's lean
  toward a new NPC): all are claimed except Waystones (deliberately
  card-light, its own flavor NPC The Wayfarer, "no new duelist/cards" by
  design) and the Emberpeaks basin (explicitly reserved for Phase 3's
  fire-elemental duelists in their own `shared/sets/emberpeaks/` folder — and
  a concurrent worktree was actively building exactly that). Neither is a
  legitimate opening, so (a) was correct despite two (b)-leaning iterations
  in a row. Precisely computed the thinnest deck (multiset-diff of each
  duelist's deck against its base `STARTER_DECKS` archetype): Hessa had only
  2 (`warding_bell`/`ashen_shambler`), the strict minimum in the roster.
  Kindle-matters (Tarn) and graveyard-matters (Marrow) each already have a
  solo owner, but nobody had combined them — a bog witch is a natural fit for
  both at once (will-o'-the-wisps / marsh-fire read as folklore's own
  kindle-in-a-graveyard).
  - **7 new cards** (`shared/sets/core/cards.js`), all existing effect
    primitives (`graveBuff`/`exhume`/`resetKindle`/`buff` — no engine
    changes): `willow_wisp` (1c) and `bog_kindler` (2c) are onKindle curve
    fillers; `mire_toll` (enchantment) is the hybrid's core piece —
    `onAllyDeath -> resetKindle`, letting a creature's death refund a second
    kindle that turn, a trigger/effect combo no card had used before;
    `rekindle_the_dead` (spell) fuses `resetKindle` + `exhume` directly;
    `pyre_caller` (4c) is a repeatable onKindle `exhume` engine (same power
    tier as `ledger_keeper`'s onKindle draw); `hessa` (5c) is her first-ever
    signature card — the last long-standing duelist without one — onKindle
    self +1/+1 and `exhume`; `bogfire_colossus` (6c Guardian finisher) does
    onKindle `graveBuff`, matching the `tollroad_colossus`/`charnel_colossus`
    top-end pattern.
  - **Deck**: `hessaDeck` chains a second `swap()` onto the original
    `warding_bell`/`ashen_shambler` one, replacing `camp_torcher`×2/
    `ember_bolt`×2/`kindled_fury`×2/`sudden_spark` (generic burn filler with
    no thematic tie to her). Verified at exactly 30 cards.
  - **CARD_ART**: all 7 reuse existing sprites (`emberling`/`hooded`/`bell`/
    `rite`/`wraith`/`colossus`) with a new sickly-green bog-fire palette,
    distinct from Tarn's orange kindle palette and Marrow's purple grave
    palette — no new grids.
  - Headless sim: 20 `createDuel`+`ai.takeTurn` games vs the other 12
    duelists, 0 crashes/0 stuck (200-turn cap); Hessa went 6-14 (weaker side,
    consistent with the existing "card-only iterations aren't rebalanced
    further" posture — see Cobb's 3-5 note above). A separate 30-40 game pass
    confirmed the new triggers actually fire in play (`resetKindle` 35x,
    `exhume` 41x, `mire_toll` cast 13/40 games).
  - Not done / untested live: visual placement at Hollowmere and the
    challenge-prompt flow weren't browser-verified (worktrees have no dev
    server) — no world.js change was needed since her placement already
    exists, so risk is judged low; `mire_toll`'s `onAllyDeath` trigger wasn't
    isolated in its own test, only inferred from aggregate counts.

- **Emberpeaks Phase 3a — fire duelists + quest chain (2026-07-08)**. Makes
  the basin an actual destination: two fire duelists whose decks are built
  from the `emberpeaks` set, so beating them is how that set enters
  circulation (reward pools) — the founding pillar realized end-to-end for
  the first new zone.
  - *Roster in the set's own folder*: `shared/sets/emberpeaks/duelists.js`
    exports `EMBERPEAKS_DUELISTS`, merged into the DUELISTS map at BOTH import
    sites (`client/src/world.js`, `server/index.js`) via
    `{ ...CORE_DUELISTS, ...EMBERPEAKS_DUELISTS }` — deliberately NOT editing
    `core/duelists.js`, so this never collides with the parallel core-duelist
    sessions. `ashmonger` (Ashmonger Cael, aggressive ember/burn gate) at
    (-22,211); `pyrelord` (Ignarok the Pyrelord, control/finisher boss) at
    (0,249) with an ember point-light + a lava pool at his back.
  - *Difficulty gradient*: headless vs the boarherd starter (strongest), the
    gate deck wins ~3/16 and the boss ~10/16 — Ashmonger is beatable on the
    way in, Ignarok is a real wall. Both decks are legal 30 / ≤3-copies and
    fully resolve; 0 crashes/stuck across 32 games.
  - *Quest chain* (`shared/quests.js`, giver Aldric): `ep_ashfall` (minLvl 5,
    prereq `gruk` → defeat Ashmonger) → `ep_pyrelord` (minLvl 6, prereq
    `ep_ashfall` → defeat Ignarok). End-game gated; sends the player north
    through Cinderpass. This is the in-world signposting the zone lacked.
  - *Verified*: build + node --check clean; headless deck-legality +
    playability sim + quest-gating all pass; live module check confirmed both
    spawn in the basin at the right coords with 30-card decks and the merged
    DUELISTS resolves client-side, zero console errors. NOT visually
    eyeballed — the frozen-preview gotcha (document.hidden) recurred, so the
    boss's on-screen look/glow is unconfirmed (cosmetic only; spawn + duel
    path are proven).
  - *Phase 3b remaining*: a zone-scoped Emberpeaks **pack + basin vendor**.
    Deferred because the shop UI is currently single-pack/single-vendor
    (Marla/boarlands hardcoded in shop.js + interact.js) — adding a second
    vendor needs the shop to pick the pack by nearest vendor, a small UI
    generalization worth its own focused branch. Reward pools already satisfy
    "cards enter circulation," so the pack is a secondary sink, not a blocker.

- **Deck builder reorganized — family sections + a real set filter
  (2026-07-08)**. Michael's ask: the deck builder's 137-card grid was one
  flat cost-sorted list with zero organization, and he specifically asked
  about filtering by set. When this branch started, core was the only set
  (so a set filter would've been a no-op); by the time it merged,
  `feat/emberpeaks-duelists` had landed a real second set, so this does
  both: a genuine Core/Emberpeaks/All set-tab filter AND flavorful family
  sections within the core set.
  - *Why a separate mapping file over a per-card field*: adding a `family`
    field to all 137 `cards.js` entries would touch nearly every line of the
    file a parallel session (card/duelist/pixel-art content) edits
    constantly — a large, avoidable merge-conflict surface for a purely
    presentational grouping. `shared/sets/core/families.js` (`FAMILIES =
    [{id, name, cardIds}]`) is additive, isolated, and a card missing from it
    falls back to "Uncategorized" instead of crashing — safe for future
    cards added before this file catches up.
  - *Why keyword-first grouping*: rather than generic type buckets
    ("creatures"/"spells", the thing Michael was implicitly reacting
    against), cards are grouped primarily by the mechanical identity axis
    Michael has been deepening duelist-by-duelist (ambush/Vex, ward/Maren,
    guardian/Rowan, frenzy/Kestrel, piercing/Gruk, graveyard-matters/Marrow,
    lifesteal/Verity, kindle-matters/Tarn) — the same grouping a player
    would actually want when building a themed deck. Relics/Reactions/
    Enchantments stayed as their own type-based sections since those types
    are already distinct play patterns (attach/trap/persistent), not a
    generic catchall; the two flavor-only leftover buckets (Boars & Beasts,
    Village & Hearth) catch cards with no owned keyword or build-around
    trigger. Result: 13 families, 0 uncategorized, 0 duplicates across all
    137 core cards (verified by script against the live registry).
  - *Emberpeaks stays ungrouped for now*: only 16 cards, already a single
    coherent fire/kindle theme — a family breakdown would be over-engineering
    at this size. It gets its own set-tab section instead; the deckbuilder
    code reads sets generically off `card.set` so a third set (or Emberpeaks
    families later) needs no further changes.
  - *Verified*: build + node --check clean; headless script confirms every
    core card resolves to exactly one family via the real card registry, and
    set/family filter combinations produce the expected counts (`all`+`all`
    → 153 across 14 sections, `core`+`all` → 137, `emberpeaks`+`all` → 16).
    **Not live-verified** — no dev server was reachable from the worktree
    (see STATUS.md for detail); this is a DOM/CSS-only change with the same
    click/context-menu handlers as before, so risk is judged low, but
    Michael should press B in-world after deploying to confirm the section
    headers, tabs, and chips actually look right.

- **The Ashen Sentinel — "ashfall" (onDeath payoffs) as a deck-wide identity
  (2026-07-08, worldbuilding loop iteration 13)**: deepens an *existing*
  duelist. Checked every named landmark for an open new-NPC spot first, per
  the task's lean toward (b): Highgate (Verity/Tarn), Bram's Rest (Footpad),
  Hollowmere (Hessa), Cinderhollow Mine (Marrow), and Cinderpass (Halvard) are
  all claimed; Waystones is deliberately card-light by design; the Emberpeaks
  basin is Phase 3's own fire-elemental duelist roster, which had just merged
  from a concurrent worktree (`feat/emberpeaks-duelists`, `shared/sets/
  emberpeaks/duelists.js` — a separate roster, not core). None was legitimate,
  so this falls back to (a). Precisely counted swapped-in cards per duelist
  (multiset-diff against each `STARTER_DECKS` base): the Sentinel had only 3
  (`ash_sprite`/`flame_tender`/`ashen_shambler`), the roster's thinnest by a
  wide margin (next was Vex at 5), and the only long-standing duelist with no
  self-named signature card. Her existing 3 cards dabble in kindle-matters and
  graveyard-matters, but both are now fully owned elsewhere (Tarn; Marrow;
  Hessa's hybrid of the two) — onDeath/onAllyDeath triggers as an *immediate*
  battlefield payoff (distinct from graveyard-matters' graveyard-count/exhume
  focus) was the one axis still open: `boar_matron`/`camp_torcher` use onDeath
  only as generic, unthemed starter filler, and `ashen_vigil` (the onAllyDeath
  enchantment hook) had sat in Maren's reward pool but never in an actual deck.
  - **7 new cards** (`shared/sets/core/cards.js`), all existing effect
    primitives (`emberGain`/`draw`/`buff`/`damage` — no engine changes
    needed): `ember_husk` (1c, onDeath gain 1 Ember) and `watchfire_whelp` (2c,
    onDeath draw 1) are cheap curve-filling death-fodder; `ashbound_warden`
    (3c Guardian, onDeath buff the board +1 attack) makes trading a wall away
    a real upside; `feed_the_fire` (2c spell, `needsTarget: 'ownUnit'` —
    damage your own creature + draw) is a sacrifice enabler that lets the
    payoff fire on your terms, a new-to-the-set combo of existing primitives;
    `cinderfall_rite` (4c rare enchantment) pairs an onPlay AOE with an
    onAllyDeath damage trigger — the deck's aggregate payoff across every
    creature that falls; `sentinel` (her first-ever signature card, 5c
    Guardian, onPlay AOE + onDeath draw 2) is the "boss plays themself"
    pattern already used by every other long-standing duelist; `ashfall_
    colossus` (6c Guardian finisher, onDeath buff the board +1/+1) rounds out
    the curve.
  - **Deck**: `sentinelDeck` chains a second `swap()` onto the original
    single-swap one, folding in the 7 new cards plus `ashen_vigil` (previously
    unclaimed by any deck), replacing 8 generic burn-filler cards
    (`ember_bolt`×3/`kindled_fury`×2/`sudden_spark`/`hearth_meal`/
    `wolf_howl`) that shared no theme with her. Verified at exactly 30 cards.
  - **CARD_ART**: all 7 reuse existing sprites (`emberling`/`wraith`/`hooded`/
    `burn`/`rite`/`colossus`) with a new charcoal-ash + dying-ember-red accent
    palette — distinct from her own existing ember-orange, Halvard's
    slate-blue-grey + ember-orange, Tarn's warm brass/amber, and Emberpeaks'
    brighter orange/red. No new grids authored.
  - Headless sim: 56 `createDuel`+`ai.takeTurn` games total across all 12
    other core duelists (varied seeds, alternating who goes first), 0
    crashes/0 stuck; Sentinel went a combined 34-22 (~61%) — stronger than the
    card-only-pass norm (compare Hessa 6-14, Cobb 3-5) but not alarming, and
    consistent with the "no rebalance beyond adding cards" posture used for
    every prior card-only iteration. The new `ember_husk` onDeath→emberGain
    trigger fired 9 times in a 20-game sample, confirming the mechanic
    actually engages in real play (not just registers).
  - Not done / untested live: no `world.js` change was needed this
    iteration (her Emberwatch Ruins placement and night-only visibility
    toggle already exist, untouched), so risk there is judged very low; the
    challenge-prompt flow with the new cards wasn't browser-verified
    (worktrees have no dev server).

- **Quest markers on the full map (2026-07-08, `feat/quest-map-markers`)** —
  the M map now draws a marker per active quest at the place you go to advance
  it: a gold diamond + the quest title, or green ("return to giver") once the
  objective is met — mirroring the tracker colors and the in-world `!`/`?` head
  markers. Design choices:
  - *Locations are derived, never hardcoded.* Duel quests point at the target
    duelist's spawn (`npcs` lookup by `duelist.id`); collect quests point at the
    duelist whose reward pool drops the card (`duelist.rewards.includes(cardId)`,
    first match in spawn order). This means new quests/duelists get correct
    markers for free — no second coordinate table to keep in sync. Lives in
    `client/src/quests.js` (`activeQuestMarkers()`), rendered by `fullmap.js`.
  - *"Win N anywhere" quests (`target:'any'`, e.g. Table Stakes) get no marker*
    — there's no single place, and inventing one would mislead.
  - *Markers draw ON TOP of the fog-of-war*, unlike everything else on the map.
    The whole point is to show where to head, including zones you haven't
    reached yet — the quest text already hints the region, so this isn't a
    fog-reveal exploit, just a "you're looking for a spot over there" arrow.
  - Verified: `npm run build` clean; a headless pass confirmed all 18 quests
    resolve to a sensible destination (duel→target duelist, collect→a duelist
    that actually drops the card). Not browser-verified live — worktrees have no
    dev server, and the map/marker render is a faithful copy of the existing
    `fullmap.js` canvas drawing.

- **Leaders & banners — deck-building constraints (2026-07-09, `feat/leaders`)**:
  the first real answer to "you can mix-and-match anything, so there are no hard
  deckbuilding decisions." Design converged with Michael over several rounds
  (see the shape of the questions asked). The system:
  - A **Leader** is an ordinary card you own that you *designate* to fly a
    **banner** (a gated card-identity). It stays one of the 30 and pays Legend
    Budget like any card — Q decided "in the deck, budget as normal," NOT a
    separate command zone (that fantasy was considered and declined for v1 to
    avoid new engine/zone work).
  - **Two-way lock** (the keystone, Michael's idea — it's what actually kills
    mix-and-match): (1) the GATE — a card whose family is a gated banner can't
    be in a deck without that banner's Leader; (2) per-Leader CONSTRAINTS run
    against the 30. Zero Leaders = a *neutral-only* deck, so the "30 best cards"
    pile is genuinely dead, not merely discouraged.
  - Constraints are a **primitive registry** (`shared/deckConstraints.js`), not
    special-cased rules — same posture as engine effects/keywords. `minBanner{n}`
    (field the Leader, owe ≥N of its banner) is the reciprocal of the gate and
    the common case, but it's one primitive among many: `costParity`, `singleton`,
    `requireType`/`banType`/`maxType`, `minKeyword`/`banKeyword`, `maxCost`. This
    is the Companion/Highlander design family (MTG Ikoria, HS even/odd), adapted.
    Michael's instinct that "constraints should be unique, not just counts" is
    what pushed it from a demand-number to a registry.
  - **Vocabulary decision (important)**: constraints reference only Emberwood's
    EXISTING axes — cost, type, rarity, keyword, and the `families.js` family.
    The game deliberately has **no tribe/element** field; Michael chose "existing
    axes now, tribe later," so the registry dispatches on `constraint.kind` and a
    future tribe/element axis is new kinds + a card attribute with zero rework.
    Don't add a tribe field casually — it was explicitly deferred.
  - **Gate on family, count demand on family-OR-keyword**: `banners.js` gates by
    the clean 1:1 `families.js` map (no overlap), but `matchesBanner` also counts
    same-keyword cards from other families so small banners (piercing has 5 family
    cards) can still reach a Leader's demand.
  - **Which families are banners**: the 9 mechanical/creature-identity families
    are gated; `village_hearth` + the three card-TYPE families (relics/reactions/
    enchantments) stay neutral (~55 neutral cards to build around a banner).
    This split lives in `banners.js`, not on card defs — same low-diff rationale
    as `families.js` itself.
  - **Roster is content/tuning, not architecture** (`shared/sets/core/leaders.js`):
    Leaders are the existing duelist legend cards (vex/rowan/kestrel/marrow/verity/
    tarn/halvard/gruk…) plus starter-tier non-boss leaders (pack_alpha/
    shieldwall_sergeant/red_sash_ambusher) so a fresh character meets the system on
    card one. Demand numbers and bespoke constraints are meant to be tuned freely.
    Showcase bespoke rules shipped: tarn = odd-cost only (his card is cost 5 — the
    test caught an earlier even-cost typo that his own card couldn't satisfy),
    marrow = singleton, halvard = ≥4 reactions, gruk = no reactions.
  - **STARTER_DECKS left untouched** — those are duelist swap() bases and shifting
    them would ripple through every NPC deck's balance. Player starters are a
    separate `newPlayerStarter()` that builds a banner-coherent deck by
    construction (leader + banner cards to demand + neutral filler) so no fresh
    character ever spawns invalid.
  - Leaders are **purely a deckbuilding constraint** — they do nothing mechanical
    in a duel (the Leader card just plays normally). Kept scope tight; a
    board/passive payoff was considered and left for later.
  - Verified: 144 headless assertions (`scripts/test-leaders.mjs`) — roster
    consistency, every banner has a Leader, every Leader can build a legal 30,
    the gate, negative cases, and a faithful mirror of server `validDeck` over
    minted instances. Build passes. Live browser check of the deckbuilder UI:
    see STATUS.md (the worktree/preview mismatch — done post-merge on `main`).

- **Leaders — regional champions & the collectible rule (2026-07-09,
  `feat/champions`)**: Michael's follow-up — "a few champions per region to give
  the player choices," and champions are collectible, NOT granted by default
  (with the clarification that the *starter* deck ships with ONE champion so it
  works out of the box; everything else is earned).
  - **No new mechanics** — the reward system already makes champions collectible:
    beating an NPC grants 2 random cards from that duelist's pool, and every
    boss's signature card is baked into its own deck (the "boss plays themself"
    pattern), so it's in the pool at ~1-in-15 per drop. So this was purely a
    ROSTER expansion in `leaders.js`; `duelists.js`, `banners.js`, the server,
    the client, and the starter were all left untouched.
  - **Two tiers**: three starter-tier champions (`pack_alpha`/`shieldwall_sergeant`/
    `red_sash_ambusher`, exported as `STARTER_LEADERS`) are handed with the
    coherent starter deck AND are also collectible elsewhere. The rest are
    collect-only. `newPlayerStarter` was already correct (grants one) — the
    earlier worry about "granted by default" was resolved by Michael: starter
    champion yes, rest earned.
  - **Choice per region** — added a SECOND champion to each thin banner with a
    distinct constraint (splashable vs all-in / bespoke), each dropped by its
    region's duelist: `warband_champion` (Frenzy, Red-Sash Camp/Kestrel),
    `hearthbound_champion` (Lifesteal, Highgate/Verity), `hessa` (Kindle,
    Hollowmere — its first champion), `boar_lancer` (Piercing, Gruk's Hollow),
    `grave_caller` (Graveyard, Cinderhollow Mine), `sanctum_guardian` (Ward,
    Meadowbrook/Maren — Maren previously dropped no champion). Every one was
    already in the right family AND the right reward pool, so zero content risk.
  - **New invariant, tested**: `test-leaders.mjs` now asserts every Leader is
    either starter-tier or reachable from some `DUELISTS` reward pool (so no
    champion is ever un-winnable), and starter champions are ALSO collectible.
    184 assertions pass. `npm run build` + `node --check` clean.
  - **Deliberately deferred (need a design call, flagged for Michael)**: the
    Ashen Sentinel (Emberwatch Ruins) and the two Emberpeaks bosses have no
    champion. Sentinel's "ashfall/onDeath" identity has no `families.js` family,
    so making her a champion means either shoehorning her into an existing
    banner (muddy) or minting a NEW "Ashfall" banner from her ash-card cluster.
    Emberpeaks champions need cross-set banner support (families.js/banners.js
    are core-only today). Both are real scope, not one-liners — left for a
    follow-up rather than guessed at.

- **Leaders — Ashfall banner + cross-set (Emberpeaks) champions (2026-07-09,
  `feat/champion-coverage`)**: closed both gaps flagged above.
  - **Ashfall banner (core)**: the Sentinel's 7 onDeath cards were all
    uncategorized, so a new `ashfall` family in `families.js` (6 of them —
    `cinderfall_rite` left neutral, mirroring the enchantments-are-neutral rule)
    became a gated banner with zero theft from other families. Champion
    `sentinel` (already in her own reward pool → collectible at Emberwatch
    Ruins): `minBanner 6 + requireType creature 16` ("ashfall needs bodies to
    burn").
  - **Cross-set banners (Emberpeaks)**: made the banner + Leader registries
    GLOBAL rather than core-only. `banners.js` now merges
    `emberpeaks/families.js` (new file, one `emberpeaks_fire` banner = the 13
    fire creatures/spells; the relic/reaction/enchantment stay neutral);
    `leaders.js` merges `emberpeaks/leaders.js` (new file) into `LEADERS`. The
    Emberpeaks set has no self-named boss card, so champions are marquee cards
    already in the bosses' pools: `ep_obsidian_golem` (minBanner 8) from
    Ashmonger, `ep_cinderwyrm` (minBanner 12, all-in) from Ignarok. **No
    deckbuilder change needed** — the grid computes `bannerOf` per card, so the
    fire cards lock correctly inside the existing ungrouped "The Emberpeaks"
    set-section.
  - **Architecture note**: the merges are hand-written in `banners.js`/
    `leaders.js`, which live in `core/` but are de facto the global registry.
    Documented tradeoff — if a THIRD set lands, promote to a real per-set
    registry rather than growing the hand-merge.
  - 11 gated banners now. `test-leaders.mjs` registers both sets, builds
    champion decks from the full pool, and merges both duelist rosters for the
    collectible check — **198 assertions pass**. Build + `node --check` clean.
    Not live-checked in-browser (the cross-set gating is pure `bannerOf` logic
    covered headlessly, and the bundle compiles with the new cross-set imports;
    the `document.hidden` preview bug persists).

- **Emberpeaks Phase 3b — zone pack + basin vendor (2026-07-13,
  `feat/emberpeaks-pack`)**. Completes the Emberpeaks zone: the last phase of
  the plan (terrain → set → duelists/quests → pack & vendor). The zone now
  realizes "shipping a zone = shipping a set" for the shop economy too.
  - **Cinder Cache** (`shared/sets/emberpeaks/packs.js`): 5 cards from the
    16-card `emberpeaks` set, **40 coins** (vs Boarlands' 25 — end-game zone
    behind a lvl 5-6 quest gate) with a heavier rare weight (60/30/10 vs
    70/24/6) since the set is small and pulls repeat. Reward pools (the two
    bosses) remain the primary circulation; the pack is the coin sink for
    chasing the rest, same complement-not-substitute stance as crafting's
    rejection.
  - **Vendor: Sutler Varn** at (14, 196), just inside the pass by the entrance
    signpost — you meet him walking in, not deep in boss territory. A sutler
    (camp provisioner) fits a vendor who follows danger to sell to it.
  - **Shop UI generalized** (the prerequisite this phase was blocked on):
    `openShop(pack)` takes the pack instead of hardcoding `PACKS.boarlands`;
    vendor name/pack name/desc/price all render from the pack def (`desc` is
    now data, moved out of index.html). Vendor NPCs are any NPC with
    `.vendorPack` set (world.js) — interact.js and the E-prompt key off that,
    not `n === marla`. One shop window serves all vendors, by design — a
    per-vendor window would be new UI surface for zero gameplay.
  - **Pack registry is global across sets** like banners/leaders: core
    `packs.js` spreads `EMBERPEAKS_PACKS` in. Same third-set promotion note
    applies.
  - The server's `buyPack` needed **zero changes** — it was already generic
    over `PACKS[msg.pack]` and validates proximity against the pack's own
    vendor coords. `scripts/test-packs.mjs` guards the coord agreement between
    packs.js and world.js (the one cross-file invariant a typo could break).

- **World architecture: stay ONE seamless world; scale by chunked authoring +
  interest management, not by zone isolation (2026-07-13, Michael asked
  whether the all-in-memory single world is sustainable).** Answer: yes, and
  isolating regions into separate loaded zones would be solving the wrong
  problem while breaking a design pillar (the Emberpeaks decision explicitly
  chose seamless/continuous over portals/instances — walking north and
  watching the grass turn to basalt IS the product).
  - **Memory is not the bottleneck and won't be for a long time.** The world
    is untextured low-poly primitives — a few thousand meshes across 640×640
    units. Browsers handle an order of magnitude more before "loaded at once"
    matters. Don't spend complexity budget here.
  - **The real scaling walls, in the order they'll actually arrive:**
    1. *Authoring collisions* — `world.js` is a single 1,100+-line module
       every region shares; parallel worktree sessions already dance around
       each other in it. **Fix soon, cheap:** split into per-region modules
       (`world/village.js`, `world/emberpeaks.js`, …) that register into the
       same shared arrays (npcs/critters/colliders). Pure refactor, zero
       runtime change, and it's the same "sets are folders" move that already
       worked for cards.
    2. *Broadcast fan-out* — the server ships every player to every player at
       10 Hz (`state` snapshot) with no interest management: O(n²) messages.
       Irrelevant at current population; the first REAL zone-ish change when
       it bites is server-side proximity filtering (only broadcast players
       within ~80u), which needs no client or content change. **Trigger:
       revisit at ~50 concurrent players.**
    3. *Client build/draw cost* — lazy-build region props on approach +
       dispose behind (streaming within the one scene, not zones). **Trigger:
       initial world build > ~2s or fps problems on real hardware.**
  - **If a region ever genuinely wants separation** (e.g. a Cinderhollow Mine
    interior), prefer a *seam* (fog-choked corridor that streams the interior
    in) over an instanced zone — the "no pocket-dimension/teleport" note
    above already points this way for building interiors.
  - What we deliberately give up by staying seamless: per-zone server
    sharding. Acceptable — this game's ceiling is "a realm of friends," not
    thousands per shard, per the vision.

- **Graphical fidelity path (2026-07-13, Michael): polish over time is the
  plan — and it still doesn't justify zone isolation.** **STATUS: DEFERRED —
  documentation only. Michael explicitly chose not to act on this yet (same
  session); no stage, not even Stage 0, starts until he green-lights it.
  The same deferral covers the other two 2026-07-13 entries (world.js
  per-region split, Field Effects + shared zone map): direction is recorded,
  work is not queued.** Michael kept the look
  simple to build fast and wants to raise fidelity gradually. This
  ACCELERATES the scale plan's timeline but doesn't change its shape: modern
  seamless worlds at any fidelity are built on streaming + LOD + instancing
  *within one scene*; zones are a design choice, never a graphics necessity.
  Staged path, ordered by fidelity-per-effort and by how little architecture
  each stage risks:
  - **Stage 0 — atmosphere (start anytime, zero memory/architecture cost):**
    lighting, fog, and post-processing are per-pixel, not per-world. Bloom on
    embers/lava, per-zone fog color + color grading (volcanic haze in the
    basin, cold blue night — this also reinforces per-zone identity, same
    instinct as Field Effects), better shadow tuning. The renderer already
    runs PCFSoft shadows + antialias; there's headroom here.
  - **Stage 1 — motion:** procedural animation (walk bob, idle sway, cloth),
    particles (drifting ash, chimney smoke, fireflies at night). Small CPU
    cost, transforms perceived quality — a world that *moves* reads as
    higher-fidelity than a static one with better meshes.
  - **Stage 2 — geometry/material density, gated on instancing:** today
    every prop is an individual `THREE.Mesh` (~hundreds of draw calls,
    zero `InstancedMesh`). BEFORE any 10× prop-count pass, migrate repeated
    props (trees, boulders, scree, grass tufts) to `InstancedMesh` — one
    draw call per prop *type*. This is the first real perf-engineering move
    and it works entirely within the one scene. Texture atlases if/when
    materials go beyond flat colors.
  - **Stage 3 — real assets:** if the game moves from programmatic
    primitives to authored models (glTF), loading cost appears for the first
    time — and THAT is when the scale plan's "client prop streaming" item
    (build regions on approach, dispose behind) moves from deferred to
    active. Fidelity pulls that trigger earlier; it was always the plan's
    answer, not zones.
  - **Invariants that survive every stage:** `groundH()` stays the single
    source of truth for height/placement/collision (fidelity comes from
    materials, detail meshes, and lighting on top of the same heightfield);
    colliders stay the simple 2D registry (visual complexity must never leak
    into collision complexity); the budget metric is **draw calls + frame
    time, never memory** — add a perf overlay when the art pass starts.
  - **Open art-direction question (decide before Stage 2):** "low-poly but
    exquisitely lit" is a legitimate destination (strong lighting + motion on
    simple geometry reads as intentional style), and the pixel-art card faces
    are a deliberate aesthetic anchor. Decide whether the world levels up
    while cards stay pixel (contrast can be a signature — it works for
    Inscryption) or both move together — before investing in Stage 2/3
    assets, not after.

- **Starter balance pass (2026-07-13, `balance/redsash-starter`): 8-card
  tuning, deck lists untouched.** The known-issues note ("boarherd ~75% vs
  redsash") turned out stale on re-measurement: the real spread was boarherd
  **79%** vs wardens, 59% vs redsash, and wardens 37% vs redsash — wardens
  (all low-attack walls + heal, no finisher) was the weak deck, boarherd the
  strong one. New `scripts/sim-starters.mjs` (round-robin, sides alternated,
  500 games/pairing) is the measuring stick.
  - **Why card tweaks, not deck-list edits:** 13 duelist decks `swap()`
    hard-coded ids out of the STARTER_DECKS lists — editing the lists risks
    silently breaking deck sizes across the roster. Card-definition changes
    can't break any list, and they fix the root cause everywhere the card
    appears.
  - **Nerfs (boarherd's exclusives/staples):** tusker 4/2→3/2, boar_matron
    3/5→2/4, gruk 7/7→6/6 (his signature "2 to all" AoE untouched).
  - **Buffs (wardens' exclusives + underdog-shared):** hearth_keeper 2/3→2/4
    and heal 1→2, beacon_mage 3/3→4/4, village_warden 2/4→2/5, camp_torcher
    2/2→2/3, controlled_burn 5c→4c (torcher/burn appear only in the two
    underdog decks — differential anti-boarherd levers).
  - **Result: 79/59/37 → 60/52/47.** Stopped at 60 deliberately: each further
    knob bought ~1 point, and the greedy AI structurally undervalues
    guardian/ward/heal — a defensive deck simming 40-47% is plausibly at or
    above parity when a human pilots it. Overtuning to sim-50% risks
    oppressive wardens in real hands. Revisit with real-play data.
  - **Ripple checked:** all 15 duelist decks still 30 valid cards, 180-game
    roster sanity sim (12/duelist vs boarherd) — 0 crashes/stuck, gradient
    intact (Ashmonger still a gate, bosses still strong). controlled_burn's
    cost parity flip (5→4, odd→even) trips no Leader rule in practice
    (test-leaders 198/198).

- **Card-game direction: familiar spine, novel edges — and the world itself
  is the design space (2026-07-13, Michael).** Steer: stop treating the duel
  engine as an MTG clone; ground it in enough shared TCG vocabulary to feel
  learnable, then push mechanics MTG *can't* do — especially per-zone rules
  so each region plays differently. Recorded direction + design framework:
  - **Keep the familiar spine (unchanged):** ember ramp, creature combat with
    keywords, 30-card decks, 20 Hearth, ≤3 copies. This is the "I already
    basically know how to play" surface — it stays boring on purpose. The
    no-priority-stack reaction decision also stands; innovation must not
    reintroduce a stack by the back door.
  - **The two assets MTG doesn't have are already built:** (1) duels happen at
    a *place and time* in a persistent world (zones, server-synced day/night);
    (2) cards are *instances with history* (Chronicle: origin, owners, battle
    record, renown). Innovation should spend these, not generic
    mechanic-space.
  - **Headline mechanic: Field Effects (per-zone duel rules).** Dueling in a
    region applies that region's standing rule to BOTH sides for the whole
    duel — the land is effectively a shared enchantment nobody cast. Sketches
    (illustrative, to be designed/simmed properly per zone):
    - *Emberpeaks — Ashfall:* end of each turn, each side's leftmost creature
      takes 1 damage (feeds the set's onDeath/kindle identities; hostile to
      go-wide grassland decks — you feel the heat).
    - *Hollowmere bog:* creatures that die return face-down under their
      owner's deck's bottom, or first exhume each duel costs 0 (graveyard
      density rises — Hessa's home advantage).
    - *The Boarlands:* first creature each turn costs 1 less (open pasture —
      teaches ramp-tempo to new players in the starter zone).
    - *Night, anywhere:* a time-of-day condition, not a zone — e.g. cards
      with a `nocturnal` bonus wake up (hour is already server-synced and in
      every `state` broadcast; Emberwatch Ruins night-gating shows the
      pattern).
    The payoffs: geography becomes deck-building input ("what do I bring to
    the Emberpeaks?"), zone NPCs get built around their home field so bosses
    *belong*, and traveling is mechanically meaningful, not just scenery.
  - **Architecture landing (all pieces exist):** promote the zone map from
    `client/src/constants.js` CAMPS to `shared/` (server must authoritatively
    derive the field from duel location — never client-claimed); duelRoom/
    duelManager pass `opts.field` into `createDuel` (opts already exists);
    the engine applies field hooks at `startTurn`/end-of-turn via the same
    `registerEffect` primitive registry; the duel UI shows the field as a
    banner card so the rule is legible. AI (`ai.js`) needs to at least not
    crash into fields; teaching it to *play around* them can lag.
  - **Second axis, later: Chronicle-powered play** — cards that reference
    their own instance history ("this copy's kills") would be genuinely novel
    (no paper game can do it). Deliberately deferred: it flirts with
    pay-to-grind power creep, and the balance resolution above (levels are
    modest) must not be undermined. Design it after Field Effects prove the
    innovation loop works.
  - **Costs acknowledged:** every field effect multiplies the balance surface
    (headless sims should run per-field, not just per-matchup) and adds a
    rules-legibility burden on the duel UI. Ship fields one zone at a time,
    starter zone last (new players should learn the vanilla game first —
    or get the gentlest field, not none; open question below).

- **Route trainers — road duelists between settlements (2026-07-13,
  `feat/road-duelists`)**: Michael's call, Pokémon-trainer framing: the wilds
  between POIs were legible (waystones, Bram's Rest) but inert — every duel
  lived at a destination, and ambient critters are pure cosmetics. Answer:
  *more people to duel*, not mobs (which pivot #2 deliberately removed) and
  not per-client wandering (critter wander is per-client randomness, so a
  roaming duelist would stand in different places for different players —
  the "revisit with server-seeded paths" note was picked up the same day;
  see the Realm-synced patrols entry below). Three minor duelists on the
  three routes
  that had nobody: Sorrel the Boartracker (Gruk road E, 62,-40, Boarherd),
  Finch the Relic-Runner (Emberwatch road NE, 58,60, Red-Sash), Brenna
  Lampwright (Hollowmere road SW, -44,-58, Wardens). South/Highgate already
  has the footpad; north/Cinderpass passes Marrow's mine.
  - *Deliberately LIGHT decks* — a single 2-card swap on a starter, the
    original-footpad pattern, NOT deepened boss identities: roads should
    duel easier than the camps they lead to. Sim (100/side): sorrel 57-67%,
    finch 51-59%, brenna 31-42% vs starters (wardens-base sims low, greedy-AI
    defense blind spot — known). Zero stuck games.
  - `scout_ahead`, `rally_the_line`, `forest_sow`, `thicket_beast` get their
    first deck owners (all had shipped straight to pack/reward pools).
  - *Player-initiated only*, like every duelist — no proximity aggro, ever.
  - *Economy note*: three more repeatable 5-coin NPC faucets; fine at current
    scale, but count faucets before adding many more.
  - Verified: build + syntax gates, headless deck sim, and a live raw-WS
    duel against each of the three through the real server (duelStart with
    correct name/kind, concede → duelEnd, no server errors). Positions are
    dead-reckoned near waystones (same caveat as the stones — worst case an
    NPC stands in a tree; cosmetic).

- **Realm-synced patrols — road duelists walk, and everyone agrees where
  (2026-07-13, `feat/duelist-patrols`)**: Michael's follow-up to route
  trainers: wandering duelists must look the same for every player logged
  in — "not a client side thing but a server side thing." The mechanism
  chosen is the day/night pattern, not per-frame NPC broadcasts: position
  is a **pure function of the server-synced game hour** (`welcome` + 10 Hz
  `state` carry the wall-clock-derived hour; clients advance it smoothly
  between syncs). Every client computes the identical spot from the shared
  timeline, late joiners and reconnects agree by construction, and zero NPC
  traffic crosses the wire. True server-side *simulation* was rejected as
  strictly worse here: the server has no terrain/collider data (client-only
  registries), and for deterministic waypoint patrols a broadcast would
  just duplicate what each client can already derive — this IS the
  server-authoritative clock driving positions, the same way the whole
  realm shares one sky.
  - *Shape*: each road duelist ping-pongs along a hand-authored polyline
    following its road's waystones, one out-and-back per game hour (50 real
    seconds, ~1.6-2.0 u/s walk), with ~2s standing at each end so players
    can walk up and challenge (`PATROLS`/`updatePatrols()` in world.js,
    called from main.js's update alongside critter wander). Interact
    prompts track live `n.x/n.z`, so challenging mid-walk works. The
    `resolveCollision` safety push-out is deterministic over the static
    collider registry, so it can't diverge between clients either.
  - *Camp duelists don't move* — patrols are a road-duelist thing; a boss
    pacing away from their own camp set-dressing would read as wrong.
  - *Offline mode*: local clock fallback, solo player, nobody to disagree
    with — consistent by vacuity.
  - Caught in verification: a float fallthrough in leg selection snapped
    unequal-leg paths (sorrel's) back to the last leg's start at the
    turnaround — a once-per-loop teleport. Fixed with cumulative leg
    starts + clamped t; the headless replica test (endpoints, dwell,
    ping-pong symmetry, midnight wrap, bounded speed) now passes 24/24.

- **The Deep Darkwood — Phase 1 (2026-07-13, `feat/darkwood`)**: Michael
  asked to expand the world with new zones in the open areas. Candidates
  surveyed: SE quadrant forest, a western lake (Mirrormere), a port south of
  Highgate (Saltreach). He picked the SE forest — the biggest empty stretch
  of map, it gives the outer ZONES ring's "Darkwood" label an actual
  destination, it creates the first outer-to-outer road (Gruk's Hollow ↔
  Highgate), and unlike the water zones it needs zero new rendering tech.
  Zone heart (118,-115), CAMPS r=45 ("The Deep Darkwood"; listed after
  Gruk's Hollow and Highgate so their labels win the road overlaps).
  Follows the Emberpeaks playbook — this is Phase 1 (terrain + landmarks);
  Phase 2 = a `shared/sets/darkwood/` card set (shadow/ambush/night is the
  natural theme; ambush is Red-Sash's axis, so differentiate — night-matters
  is genuinely unowned), Phase 3 = duelists + quest chain, 3b = zone pack +
  vendor. **First region authored as a `world/` module** (world/darkwood.js)
  rather than into the old monolith — the split earned its keep same-day.
  - *Ground tint* (terrain.js): a radial "gloom" blend around the heart
    (full inside ~r18, gone by ~r52), cool light-starved greens with mossy
    mottling — same isolation promise as the volcanic blend (distance-gated,
    nothing else in the world shifts). First pass was too subtle (~22%
    darker than the Darkwood ring baseline — invisible in a live render);
    deepened to ~40%, confirmed live by sampling terrain vertex colors.
  - *Signature flora*: gnarltrees (crooked deadwood trunks, ball canopies —
    a silhouette nothing else uses), dense dark pines, glowcap mushroom
    clusters (emissive-only, no PointLights — night identity on the cheap).
    All scatter skips the road corridor (ROAD/nearRoad in darkwood.js —
    keep in sync with the waystones in roads.js).
  - *Landmarks, both deliberately unexplained Phase-3 hooks*: the **Circle
    of Sighs** (seven mossy standing stones + one fallen, ringing the heart
    waystone — seeded for the zone's night content/duelist, the way the
    Mine seeded Marrow and Emberwatch seeded the Sentinel) and the
    **Hunter's Rest** (an abandoned camp with a conspicuously COLD firepit —
    every other camp in the realm burns; whoever left, left in a hurry).
  - *The Darkwood road* (roads.js): waystones Gruk's Hollow → heart →
    Highgate's gate. Obstruction profile sampled live: equal to or better
    than the existing village→Highgate road (trees brushing roads is the
    realm-wide status quo).
  - *Wildlife*: the wood has its own wolf pack (6, denser than the wilds'
    thin band; road corridor kept clear).
  - Verified live via a worktree dev server (launch.json can point vite at
    a worktree — new trick, works): zone labels correct at heart/roads/
    neighbor overlaps, road walkable, critters 54→58, terrain tint sampled
    at vertices, **manual renderer.render() + screenshot** (bypasses the
    rAF-stall gotcha entirely — camera aimed at the heart, one-off render,
    real screenshots of the zone) — stone circle, gnarltrees, glowcaps,
    Hunter's Rest, and the Gruk's Hollow/Highgate sightlines all eyeballed.
    Zero console errors; build clean.

- **Deep Darkwood immersion pass — "the living gloom" (2026-07-13,
  `feat/darkwood-gloom`)**: Michael playtested Phase 1: "nothing that makes
  me feel like I'm entering a scary dark wood." Diagnosis: the zone had
  props but no *atmosphere* — scary woods are made of failing light and
  dying sightlines, not objects. His ask is taken as the green-light for
  **zone-scoped** atmosphere only; DESIGN.md's global Stage 0 (bloom/post/
  per-zone grading everywhere) stays deferred.
  - *The gloom* (the headline): `updateDarkwood(hour, px, pz)` in
    world/darkwood.js returns a 0..1 factor from the player's distance to
    the heart (0 by r56 — Gruk's camp at 56 away keeps normal weather; 1
    inside r24). main.js's day/night block applies it every frame: fog
    pulls from (70,300) to (16,60), fog/sky colors lerp to a murky green
    (day) or near-black (night), sun/hemi dim ~50-60%, and the sun/moon
    discs + stars fade out — you can't see the sky through this canopy.
    Every application is an exact no-op at gloom 0 (verified numerically:
    fog restores to exactly 70/300; village and Gruk's camp read 0).
    Because it keys on player position, the whole realm's weather is
    per-viewer — which is correct: atmosphere is what YOUR sky looks like,
    and two players in different zones each get their own. Nothing here is
    shared-world state (unlike NPC positions).
  - *Circle wisps*: three pale bobbing lights over the Circle of Sighs,
    visible 20:00-6:00 only (the Sentinel's window) — the stone circle is
    lit by something that isn't fire. Emissive-only, no PointLights.
    Night-duelist bait for Phase 3.
  - *Shades*: four hooded, coal-black silhouettes with pale eyes drifting
    between the trees on the critter wander system — critters are never
    interactable, so what they are stays an open question until Phase 3.
  - *Darkwolves*: the zone pack got darker coats + amber emissive eyeshine
    (reads through the fog before the wolf does).
  - *Flora*: hanging moss strands under every gnarltree canopy; 8 bare
    snags (deadTree, promoted Hollowmere→lib.js under the 2+ regions rule).
  - *Not done, noted for later*: audio (no sound system exists in the game
    at all — a first howl/wind pass would be its own decision), and any
    gameplay teeth (shades that watch you, night-only spawns) belong to
    Phase 3, not ambience.
  - Verified live (worktree dev server + manual renderer.render):
    noon-in-the-wood and night-in-the-wood screenshots both eyeballed
    (fog closes in, wisps float, glowcaps read in the dark), wisp gating
    0-at-noon/3-at-night, gloom-0 restoration exact, zero console errors,
    build clean.

- **Narrative direction — the founding myth & the main quest (2026-07-13,
  Michael)**: Michael's ask — "no compelling overarching story or goal, no
  factions at war, no real engagement for MMO users." Three layers were
  proposed: (1) a founding myth + main quest chain, (2) the Chronicle made
  social (a Hall of Legends in Highgate — the realm's most storied card
  instances as visible, chase-able status), (3) faction *allegiance* (a
  Wardens/Red-Sash/Guild cold conflict over the roads, rep + writs paying out
  through the existing banners/leaders systems, later feeding Field Effects
  via contested roads). Michael picked **(1) to develop first**; (2) and (3)
  are recorded candidates, not commitments — (2) is the cheap high-leverage
  next step, (3) is a real epic touching server state.
  - **The myth (canon lives in `.claude/LORE.md` — read it before writing any
    quest/dialogue/flavor text)**: the world's heart was the Emberwood, a fire
    that *remembered* everything in its light; it went out (the Going-Out —
    cause never explained, by rule); **cards are embers** — bound memories —
    which retro-explains instances (an ember is one memory, singular), Kindle
    (feeding a memory back to the fire), renown (an ember burns brighter the
    more it's witnessed; Storied = half-woken), and the Chronicle (the record
    the fire keeps). Every hearth is a banked coal of the old wood; a fire
    that dies *forgets*, and the land around it forgets too — which
    retro-explains the Deep Darkwood's gloom. The hook: **the fires are going
    cold** — Hunter's Rest's cold firepit (already built as an unexplained
    seed) is the first fire in living memory that won't take flame. The
    player is a *witness*, not a chosen one: dueling/trading/leveling cards
    literally keeps memories burning. Chosen precisely because it explains
    what's already built (Ember* names, Kindle, Chronicle, the Sentinel, the
    cold firepit) instead of bolting a plot onto the side.
  - **Act I chain — "The Long Ash"** (4 quests, full draft text in LORE.md):
    `cold_hearth` (Bram's first quest — visit Hunter's Rest) →
    `ask_the_ash` (Aldric tells the myth once, in full — defeat the Ashen
    Sentinel at night) → `what_the_watch_keeps` (the Sentinel becomes a
    quest-giver, Vex/Gruk precedent — collect 2 `ash_sprite`, winnable from
    the Sentinel itself) → `where_the_heart_fell` (defeat the Pyrelord and
    ask what he fears; overlaps `ep_pyrelord`'s target, vex/vex_rematch
    precedent). Threads existing landmarks ONLY — no new places or duelists.
    The cliffhanger names the two Act II/III doors that already exist as
    seeded hooks: the Circle of Sighs (pays off with Darkwood Phase 3) and
    Cinderhollow Mine ("the delvers dug too close to something buried on
    purpose"). Its own spine, independent of the Vex/Gruk chain.
  - **New quest objective shape: `visit {x, z, r}`** — the one mechanical
    addition Act I needs (quests.js supports only duels/collect today, and
    the chain's opening beat is *go look at the cold firepit*, which no
    existing shape expresses). Server progresses it from the pos messages it
    already receives (proximity check, early-exit unless the profile has an
    active visit quest — the 10 Hz path stays cheap). Position is
    client-authoritative by standing decision, so a scripted client can fake
    a visit — same call as the Emberwatch night gate: the objective is about
    discovery, not fairness. Offline mode: no progress, like all quests —
    already stated honestly in the UI. Client-side, visit quests carry their
    own x/z so the existing quest-map-markers system needs no duelist lookup.
    Reusable for every future discovery beat (Circle of Sighs, the mine…).
  - **Flavor-line pass ships with Act I**: Bram/Wayfarer/Harrow/Hessa/Marla
    get one small-omen line each (drafts in LORE.md) via the existing
    `n.flavor` rotation — ambient reinforcement, never the full myth (Aldric
    tells it once; that's a LORE.md voice rule).
  - **Implementation**: worktree `feat/narrative-act1` — visit objective in
    shared/quests.js + server pos-handler progression + the 4 quests +
    sentinel giver wiring (client GIVERS map) + flavor lines. Gates: build,
    node --check, and a headless quest-logic test driving accept →
    pos-progress → turn-in over the visit shape. Text is the product here:
    Michael should read LORE.md's quest drafts before or during the branch.

- **The Hall of Legends — the Chronicle made social (2026-07-13,
  `feat/hall-of-legends`)**: layer 2 of the narrative direction above,
  green-lit by Michael's blanket "take agency on implementing this" while
  away. The MMO goal the myth points at ("become part of what the fire
  remembers") gets its surface: the realm's most renowned card instances,
  visible to everyone, in the world.
  - **Chronicler Sela** stands at Highgate's shrine — the Maren pattern
    (a decorative structure gains a reason to matter), and the right city:
    Highgate is the trade capital, and provenance is what trading trades in.
    E opens **the Hall of Legends window** (`client/src/hall.js`, shop-shaped
    panel): top 12 instances realm-wide with rank, pixel art, ★ level +
    renown, current holder, win/duel/kill record, origin line, and the
    owners[] provenance chain. Rows carry `[data-card]` so the hover
    inspector works. Esc/Close per the shop pattern.
  - **Server-authoritative ranking**: new `hall` message — proximity-gated
    against a shared `HALL` constant in `shared/chronicle.js` (the packs.js
    vendor-coords pattern, so client spawn and server check can't drift).
    The server scans all profiles, ranks by renown, ships only the top N —
    rank can't be spoofed and the full ledger never leaves the store. Full
    scan per request is fine at current scale; revisit alongside the
    interest-management trigger if profiles grow.
  - **Realm-wide Chronicle broadcasts**: `onChronicle` already computed
    level crossings per instance; it now broadcasts Veteran/Storied
    ascensions to everyone — "The fire remembers: NAME's CARD is now
    Storied." Seasoned (level 1) deliberately not announced (too common).
    This is the diegetic status moment the Hall trades in, and the first
    time one player's progression is visible to the whole realm.
  - **Taught, not stumbled on**: new quest `hall_of_legends` (Yara, prereq
    `highgate_gate`) sends players to hear the ledger — the second user of
    the Act-I `visit` objective, exactly the reuse it was built for.
  - Deliberately NOT done: pagination/filters (top 12 is a leaderboard, not
    a browser), per-player "my legends" view (the deck builder/Chronicle
    panel already shows your own), and any coupling to trading. Layer 3
    (faction allegiance) remains a recorded candidate — it's a real epic
    touching server state and Field Effects; not started on blanket agency.

- **Deep Darkwood Phase 2 — the `darkwood` card set + the `nocturnal`
  mechanic (2026-07-14, autonomous under Michael's blanket agency)**: the
  zone plan's Phase 2 (the Phase-1 entry above reserved "night-matters —
  genuinely unowned" as this set's axis; ambush is Vex's, so shadow/ambush
  was out). 15 cards in `shared/sets/darkwood/cards.js` (`dw_` prefix,
  5 common / 6 uncommon / 4 rare; 8 creatures, 3 spells, 1 relic,
  1 reaction, 2 enchantments), registered via side-effect import next to
  core/emberpeaks in duelManager.js + duelRoom.js — the Emberpeaks Phase-2
  playbook exactly, including "registered but nothing grants them yet"
  (circulation arrives with Phase 3 duelist reward pools + the 3b pack).
  - **The one engine addition: `nocturnal: {atk, hp}`** — the creature
    enters play with the bonus when the duel is under night. Night is a new
    `createDuel` opt (`duel.night`), **fixed at duel start** (a standing
    condition like the coming Field Effects — no mid-duel stat swings when
    the clock crosses 20:00), derived from the server-synced game hour at
    room creation (`isNight()` in index.js, 20:00–6:00 — the same window as
    the Sentinel/wisps) and from the local clock in the offline fallback
    (`getGameHour()` export in main.js). Applied in `unitFromCard` (third
    param), so played cards and summoned tokens behave identically and
    Chronicle level bonuses stack on top. This is deliberately NOT Field
    Effects (still deferred pending Michael's green light): night is a
    *card* field on one set, not a zone's standing rule applied to both
    sides — but the hour-into-the-duel plumbing it adds (opts.night,
    view().night) is exactly the shape fields will reuse.
  - *Duel views ship `night`* (duelRoom.view + local state) but the duel UI
    does not render an indicator yet — flagged for Phase 3 alongside the
    zone's duelists (a moon glyph by the turn banner is the likely shape;
    rules text on every nocturnal card states the condition meanwhile).
  - *LORE.md grounding*: the wood's creatures are what moves in a place the
    land is forgetting (canon fact 7) — stronger where the light is not.
    Flavor references Weir's camp, the wisps, and the Circle of Sighs
    (`dw_seventh_stone`, `dw_circle_chip`) without explaining them; Act II
    stays reserved.
  - *Verification*: build + `node --check` clean; test-leaders 198/198;
    headless suite — registry (15/15 resolve, 8 nocturnal), unitFromCard
    day/night/Veteran-stacking/asymmetric-bonus/core-cards-unaffected,
    played-card stats in real duels both states, 60 AI games (day+night ×
    3 starters) 0 crashes/0 stuck, and the identity check: a mono-darkwood
    test deck wins 6/30 by day vs 19/30 at night. Starter round-robin
    re-run: 60/52/47, byte-identical to the documented spread (engine path
    regression-clean). test-packs is 4433/4436 on this branch AND on main —
    pre-existing: the world.js split broke the test's vendor-coord regex
    against the old monolith path; flagged as a separate task, not fixed
    here.
  - *Balance note*: the mono-set deck's 20% day winrate is an artifact of
    the artificial test deck, not a shipped experience — no player can even
    assemble it yet. Real balance tuning happens in Phase 3 when the zone's
    duelist decks are built (sim per the usual duelist-pass procedure, and
    sim BOTH night states — first set where that matters).

- **Deep Darkwood Phase 3 — duelists + main quest Act II (2026-07-14,
  Michael green-lit "ok, lets go")**: the zone plan's Phase 3, fused with
  the narrative's Act II — the Circle of Sighs door the Act I cliffhanger
  named. Canon written in LORE.md (facts 11–12): the Circle is the
  Emberwatch's **watchfire ring** (eight stones, one per beacon of the old
  order); the fallen eighth marks the FIRST fire to go out — the Darkwood is
  the oldest wound, not a new one — and the stone was **pulled down**, not
  crumbled (Act III's question; the mine). Who walks the ring at night:
  **Weir the Forgotten** — Bram's missing hunter from Act I, half-faded by a
  place that forgets, held in the world by being witnessed (duels, and his
  `weir` card being carried — the myth's witnessing theme made mechanical).
  - **Roster** (`shared/sets/darkwood/duelists.js`, merged at the two
    DUELISTS sites like emberpeaks): **Tamsin the Charcoal-Burner** (gate,
    day, ON the Highgate-side road corridor at 95,-110) and **Weir** (boss,
    at the Circle among the wisps, night-only via the Sentinel's
    visibility-gate pattern in main.js — which also means his
    nocturnal-heavy deck always fights on its home condition: the zone boss
    *belongs* to his field, per the card-game direction). Their reward
    pools put the darkwood set into circulation — the founding pillar.
    New 16th set card: `weir` (5c 4/3 Ambush, nocturnal +1/+1, onPlay ping —
    the boss-plays-themself pattern).
  - **Act II quests** (`the_fallen_stone` visit → `what_the_wood_kept`
    defeat Weir → `a_coal_for_bram` own the `weir` card): prereq'd on Act
    I's finale; the coda deliberately makes "carry his memory" a collect
    quest on the boss's signature drop (~1-in-33 pool odds per win, plus
    tradeable — the Chronicle economy IS the quest).
  - *Tuning*: Tamsin's first pass (17 darkwood cards) simmed 27% vs
    starters — nocturnal commons are day-weak and she duels by day; retuned
    to 15 darkwood/15 vanilla-body mix → 35% (route-trainer band; Brenna
    ships at 31-42%). Weir sims 77% at night (boss-tier, between Ashmonger
    and Pyrelord), 23% by day (unreachable state, simmed for crash coverage
    only). 0 stuck/0 crashes across all 180 games.
  - *Verification*: build + node --check clean; test-leaders 198/198;
    test-packs 4436/4436 (the parallel fix session's repair held); headless
    suite ALL PASS (deck legality, reward resolution, signature-in-pool,
    winrate bands, full Act II gating chain incl. visit progress at the
    heart); live raw-WS duels vs both through the real server (duelStart
    name/kind + `night` in the view, concede → duelEnd, zero errors). NOT
    verified live: Weir/Tamsin visual placement and the night-gate flip
    (same spawnDuelist/visibility code paths as Sentinel/every duelist;
    dead-reckoned coords — worst case cosmetic).
  - *Remaining for the zone*: Phase 3b (zone pack + vendor — deferred this
    pass partly because packs.js/test-packs was another session's active
    lane) and the duel-UI night indicator flagged in the Phase 2 entry.

- **Factions — THE progression system (2026-07-14, Michael)**: "as you play
  with cards in that faction you earn points which allow you to play higher
  level or newer cards from that faction." Decisions via AskUserQuestion:
  **5 factions** to start (Boarherd/Wardens/Red-Sash from the starter
  identities + Emberpeaks/Darkwood as zone factions), everything data-driven
  so more can land later; **full re-gate** of the existing pool (this IS the
  progression system) with a profiles.db wipe at deploy; Leaders integration
  left to my judgment with "interesting but not overbearing" as the bar.
  - **The judgment call — champion = +1 rank, not a second lock**: faction
    rank is now the ONE card gate. The old Leader-ownership banner gate is
    REMOVED from deckConstraints; owning any of a faction's champion Leaders
    grants +1 effective rank with that faction ("a champion vouches for
    you"). Leaders keep everything else — designation, fielding rules
    (minBanner/costParity/singleton/…), Legend Budget stays orthogonal — so
    net rule count for a player is unchanged: one gate type, one leader-rule
    system, one budget. Chosen over keep-both (double locks on one card
    read as noise) and over rank-replaces-leaders-entirely (demotes shipped
    champions to cosmetics).
  - **Mechanics** (`shared/factions.js`, pure/shared): `factionOf` maps core
    cards via their families.js family (boars/piercing/graveyard → boarherd;
    wardens/ward/crimson → wardens; bandits/warband → redsash; kindle_kin +
    ashfall → emberpeaks, an early on-ramp to the zone faction) and zone
    sets wholesale; village_hearth + the card-TYPE families are neutral —
    never gated, earn nothing. **Standing**: each faction card you PLAY in
    a duel = 1 point (win ×2, ≤8 plays counted/duel; kindle-burns
    deliberately earn nothing — a sacrifice is not a witnessing; autobattle
    earns in full per the standing QoL decision). **Ranks**: Stranger →
    Known (40) → Trusted (120) → Sworn (300); requirement derives from
    rarity (common 0 / uncommon 1 / rare 2, champions +1) — legible, zero
    per-card data. The legacy starter pool + starter champions are pinned
    rank 0.
  - **Fresh characters**: `buildBannerStarter` no longer deals rares — a
    new player is a Stranger whose DEALT champion vouches them to Known in
    their own archetype, which is exactly what makes their dealt uncommons
    legal. Day-one decks re-save under the player's own ranks by
    construction (tested, 30 rolls). Caveat: trading away your only
    champion drops the vouch — the deck still plays but won't re-save with
    its uncommons until standing catches up; acceptable friction, flag if
    playtests disagree.
  - **Server**: standing is earned in onChronicle from `duel.log` (both
    PvP + NPC), stored in `profile.factions`, shipped in profileUpdate +
    a `standing` message (client logs gains and rank-ups); `validDeck`
    passes `effectiveRanks(profile)` into the shared `evaluateDeck`.
  - **Client**: deck builder locks show `🔒 <Faction>: <RankName>`; a new
    `#db-factions` standing strip shows rank/points/next-threshold per
    faction, gilded ▲ when a champion vouches.
  - **Verification**: `scripts/test-factions.mjs` (new, 399 assertions:
    map totals, rank derivation, gate + vouch, earn math from real AI duel
    logs incl. win-doubling and caps, server-contract lifecycle incl.
    own-but-can't-deck); test-leaders reworked for the new gate (198, incl.
    the deliberate flip: starter with no designated Leaders is now VALID);
    test-packs 4436/4436; starter sims byte-identical (60/52/47); raw-WS
    e2e through the real server (autobattled duel → standing gains + sync,
    locked save rejected, standing-seeded save accepted, persisted across
    resume). NOT live-verified: the deck-builder standing strip + lock
    badges visually (same DOM patterns as the banner locks they replace).
  - **DEPLOY REQUIRES a profiles.db wipe** (Michael chose full re-gate):
    existing profiles lack `factions` and their decks hold now-gated cards.

- **Faction regalia — cosmetic wardrobe earned by standing (2026-07-14,
  Michael)**: "as you progress through the factions you get unlockable
  clothes for various body parts to look more and more like a faction."
  Standing's visible payoff: each faction offers 4 pieces across the
  humanoid's dress slots (body / legs / head / back), gated by **effective
  rank** — the same `effectiveRanks` math that gates deck-building, so a
  champion's vouch opens the wardrobe too (a fresh character can wear their
  starter faction's rank-1 coat on day one; deliberate, it mirrors the
  deck-builder vouch and gives new players an immediate visible identity).
  Ladder: Known → the coat, Trusted → leggings + headwear, Sworn → a cape
  (new `cape` part on `humanoid()`; the Emberpeaks mantle smolders via the
  campfire emissive trick). Purely cosmetic — no stats, by design; the
  Field-Effects direction owns gameplay-side zone identity.
  - **Shared**: `shared/cosmetics.js` — WARDROBE data (20 items),
    `sanitizeAppearance` (garbage-proof), `validAppearance` (rank check).
    Items are DATA like factions.js: a new faction's regalia = 4 entries.
  - **Server authoritative**: `setAppearance` re-validates against the
    profile (client can't dress above its standing), persists
    `profile.appearance {slot: itemId}`, echoes `appearance`; the 10 Hz
    presence snapshot carries `appearance` so remotes render regalia and
    live-swap meshes when it changes. Additive schema — old profiles
    default to `{}`, **no db wipe needed**.
  - **Client (v2 fitting room, same day — Michael's playtest feedback:
    "I need to see my character", "only show items I have unlocked",
    "just blocks on the screen sucks")**: the panel (O, Esc-chained) is a
    fitting room — a live rotating mannequin (its own small THREE
    renderer on `#w-canvas`; `renderPreviewFrame` exported for the
    rAF-stall workaround) wears your current set, **hovering a piece
    tries it on** (mannequin only — player mesh and server untouched
    until click), clicking equips/doffs. **Inventory semantics: only
    earned pieces are listed** — locked items are hidden entirely,
    factions with nothing earned don't appear; each row teases the next
    rank that offers more ("more when you are Trusted"), and a no-faction
    character gets diegetic empty-state copy. Items render as
    **palette-swapped 16×16 garment sprites** (one per slot in
    pixelArt.js, new `spriteArt()` export) tinted from the item's mesh
    color so icon and 3D look can't drift. "Plain clothes" resets; bare
    slots fall back to the starter outfit's colors (`lookOpts`).
  - **Voice**: diegetic throughout — "wear the colors of those who know
    you", rejection is "They don't know you well enough to wear that";
    never "unlock" (LORE.md rule).
  - **Verification** (v1 + v2): headless cosmetics checks (data sanity,
    sanitize, rank gating, vouch); raw-WS e2e through the real server
    (Stranger over-rank rejected, vouched rank-1 accepted, seeded-Sworn
    full set accepted + persisted across restart/reconnect, observer's
    snapshot carries the regalia). v2 live client (worktree servers
    :5176/:8082, rAF alive this session): O opens via the real handler,
    mannequin renders and spins, real hover swapped the mannequin's hat
    to the Crest Helm without touching player/server, real click equipped
    it (observer snapshot confirmed server-side), inventory hides locked
    items + unearned factions, tease line renders, all 12 icons
    pixel-art. Debug lesson re-learned the hard way: mid-session file
    edits split eval imports from the app's module instances (the
    documented HMR gotcha) AND two THREE renderers on one canvas render
    garbage — restart Vite before eval-driven verification. Synthetic
    browser-pane keypresses lack `e.code` (all hotkeys gate on it) —
    dispatch a real KeyboardEvent instead.

- **Deep Darkwood Phase 3b — zone pack + vendor + night indicator
  (2026-07-14, `feat/darkwood-pack`)**: the zone playbook's last phase
  (Emberpeaks precedent: terrain → set → duelists/quests → pack & vendor)
  plus the duel-UI night indicator flagged since Phase 2. **The Deep
  Darkwood is now complete** — the worldbuilding loop returns to general
  iteration.
  - **Night-Gather** (`shared/sets/darkwood/packs.js`): 5 cards from the
    16-card darkwood set, **35 coins** (between Boarlands' 25 and the
    Cinder Cache's 40 — the wood is mid-realm on the Gruk↔Highgate road),
    weights 64/28/8. Rare weight deliberately below the Cinder Cache's:
    `weir` is Act II's chase card and a trade driver (`a_coal_for_bram`);
    at 8/5 rares a pack pull is ~8% to hold him (~10 packs expected) — the
    pack feeds the chase without ending it.
  - **Vendor: Pedlar Rusk** at (106, −72), just inside the zone edge on the
    Gruk-side road (the Varn placement rule: you meet him walking in, not
    deep among the stones), ~3u off the walkline with his crate of wares.
    LORE.md knowledge tier: small omens — he sells by daylight and is gone
    by dusk. Zero shop/server changes needed: `openShop(pack)` and
    `buyPack` were already generic (the Phase-3b generalization paying off).
  - **Duel-UI night badge** (`#d-night`, index.html + duelUI.render): a
    "🌙 Night" chip beside the foe name whenever `duel.night`, tooltip
    explaining Nocturnal. Rules text still carries the condition — the
    badge is the board-level "it's live" cue, day duels show nothing.
  - **The third-set promotion note FIRED and was deliberately not taken**:
    darkwood is the third pack in core packs.js's hand-merge. Kept the
    spread anyway — three static entries are still cheaper than registry
    machinery, and banners/leaders remain at two sets (darkwood ships
    neither: its cards flow through reward pools + this pack, and the
    faction rank gate already covers them). New promotion trigger, recorded
    in packs.js: a FOURTH set, or any single set needing banners + leaders
    + packs at once.

- **Pell's Pond — the fisher's landing, the realm's first standing water
  (2026-07-15, worldbuilding loop iteration 6)**: with the Downs, Dial
  Stone, and Hollowmere passes done, the survey found two gaps that one
  place fills. *Map*: the northwest wedge (x −110…−200, z 55…150, beyond
  Red-Sash Camp toward the mountains) is now the biggest unclaimed stretch.
  *Archetype*: the realm has NO standing water beyond Hollowmere's four
  bog-pool discs, and the food economy names farm (Harrow), flock
  (Wynn/Tolly), and trade (Marla/Highgate) — nothing from water.
  Landmark tier on purpose (Harrowfield/Wether Downs precedent):
  card-light, world-module-only, no duelist, plain bundle deploy.
  - **Siting is the interesting part**: the terrain has no basins (groundH
    is gentle sinusoids), so instead of terraforming, a numeric scan found
    a natural flat low at **(−141, 58)** — center h −1.97 with the whole
    r=9 disc within 0.27 of it. The water is one flat CircleGeometry disc
    set just above the highest ground inside its rim (sampled at build
    time), so nothing pokes through and the shore sits nearly flush —
    zero terrain edits, and the technique is reusable for any future pond.
    Walkable like Hollowmere's pools (wading is the charm); the jetty gets
    a rect collider instead, since knee-high planks would clip a wader.
  - **The place** (`client/src/world/pellspond.js`, CAMPS (−141,58) r=18,
    wilds.js CLEARINGS r=15 so the random pines stay out of the water):
    pond + lily pads (deliberately a *living*-water palette — M_POND is
    cool slate, not M.bogWater's murk, and no cattails: gone-to-seed heads
    are the mire's motif), reed clumps, shore stones, plank jetty, the
    Wether-Downs-pattern hut (collider + camera occluder), a drying rack
    hung with the catch, an upturned boat, and 3 ducks (module-local mesh,
    single-region rule — entities.js untouched, a parallel session owns
    it). LORE relationship to the fire: **tended** — the smoking fire
    (campfire(), ramps at night) kept low and kept always: smoke preserves
    what flame would eat, the fire-that-keeps made economic.
  - **Fisher Pell** — flavour NPC, small-omens tier (LORE.md updated): six
    lines tying fish to Marla/Highgate (the economy read, like Harrow's
    and Wynn's), the herons to Hollowmere (they never fish here — cross-
    zone texture), and two gentle seeded doors: the fish over the deep
    hole have gone shy, and nobody living remembers who dug the pond.
    Deliberately NOT water-remembers phrasing — memory-without-fire is
    Hessa's reserved thread; Pell's omens stay about fish and smoke.
  - **Rejected this survey**: burial/memorial ground (the realm is already
    stone-heavy — cairn, waystones, Circle of Sighs, Dial Stone — and
    graves-and-forgetting grazes the reserved acts' themes), an orchard
    (second agricultural, redundant with Harrowfield), deepening the
    Emberwatch Ruins environmentally (its sparseness IS the read, and it
    is Act I staging), anything Hollowmere/Hessa (reserved).
  - No northwest road on purpose (the Wether Downs rule verbatim: a
    flavour landmark earns a route when it earns content). Seeded for
    later: a pond duelist (Tolly precedent), and the deep-hole omen.

- **The Wether Downs — pastoral shepherd landmark (2026-07-14,
  `feat/wether-downs`)**: worldbuilding-loop iteration under Michael's
  "continue expanding the world out." With the Darkwood complete, the map
  survey found the due-west wedge (between Red-Sash Camp and Hollowmere,
  x −120…−200) the biggest unclaimed stretch — and *pastoral* the missing
  archetype (wild/martial/mercantile/agricultural/industrial all taken).
  Landmark-tier scope on purpose (Harrowfield precedent): card-light,
  world-module-only, no duelist, plain bundle deploy.
  - **The place** (`client/src/world/wetherdowns.js`, CAMPS (−150,−10)
    r=20): a C-shaped drystone sheepfold (cosmetic low wall — the
    Harrowfield fence decision applies verbatim), a shepherd's hut
    (collider + camera occluder), a kept campfire (LORE relationship to
    the fire: **tended** — the cozy counterweight to the cold wood), a
    herder's cairn, hay/crate/barrel/signpost dressing.
  - **The flock**: 7 sheep + lambs (module-local `sheepMesh`, single-region
    rule), a tan off-duty dog by the fire, and **the bellwether** — a
    darker lead ewe grazing apart on the western rise. She is the zone's
    seeded hook: Wynn's omen line has her staring west at nothing
    ("the world's edge"), a door named before its content exists (the
    Mine pattern). Do not pay it off without a content phase.
  - **Shepherd Wynn** — flavour NPC, small-omens tier (LORE.md list
    updated): six lines tying wool to Marla/Highgate (economy, like
    Harrow's), wolves to the wood, plus the bellwether omen and a
    keep-the-fire line ("a dark camp is a borrowed camp — never did say
    borrowed from whom").
  - No west road/waystones on purpose: routes mark destinations with
    business (camps, duels, vendors); a flavour landmark earns a route
    when it earns content. Revisit if playtests never find it.

- **Hollowmere "the mire breathes" — life + night pass (2026-07-14,
  `feat/mire-life`)**: worldbuilding-loop iteration 5. Hollowmere was the
  realm's thinnest place — bones (pools, reeds, snags) and no movement —
  and its Hessa thread is reserved (Act II/III), so the deepening is
  strictly environmental: nothing interactable, nothing explained.
  - **Life**: 3 herons (module-local tall-wader mesh, stalk the pool edges
    via the critter wander system), 5 frogs, cattails ringing the pools.
  - **Mire-sparks** — the night layer, and LORE fact 7 made visible
    without a word of text: the mire remembers WITHOUT burning, so its
    night lights are cold, low, and many — deliberately unlike both fire
    and the Darkwood's three tall wisps (those mark a place; these are
    ambient). 8 emissive dots drifting over the pools 20:00–6:00, no
    PointLights (the glowcap budget trick), gated by new
    `updateHollowmere(hour)` — same shape and main.js call site as
    updateDarkwood.
  - Deliberately NOT done: mire fog/atmosphere (that's the Darkwood's
    identity; Hollowmere's is water + cold memory), any hint surface for
    Hessa's mystery.

- **Tolly the Lambward — the Wether Downs' duelist (2026-07-14,
  `feat/downs-duelist`)**: worldbuilding-loop iteration 4, taking the
  seeded option recorded one iteration earlier ("the downs can host a
  shepherd duelist later"). Route-trainer tier: existing cards only, no
  new art, no CAMPS/structure change — the landmark now has business,
  which is the bar the "no west road yet" note set for earning a route.
  - **The deck** (`swap()` on the boarherd starter): burn out, flock in —
    `ember_bolt`/`sudden_spark` → **`herd_instinct`** + `hearth_meal`.
    herd_instinct was the LAST unclaimed core card (every other card is
    played or dropped by some duelist) and it is thematically exact: the
    shepherd plays the herd. Reward pool adds `forest_sow`.
  - **Tuning** (500 games/side vs each starter): 56/72/58 vs boarherd/
    wardens/redsash. The 72 rides the documented greedy-AI defense blind
    spot (plain boarherd starter already hits 60 vs wardens). Rejected
    variants: double herd_instinct (~79 vs wardens), tusker-out (27 vs
    redsash — tusker is load-bearing there).
  - **Wynn deliberately stays a flavour NPC** — converting them would
    short-circuit their six lines behind the duelist interaction (the
    known dialogue-priority gap). Tolly is a separate young shepherd at
    the fold's west edge.
  - Session gotcha worth recording: the harness shell's cwd silently
    reset from the worktree to the primary checkout mid-iteration —
    gates/sims quietly ran against MAIN's code (the roster check passed
    with 16 duelists, tolly absent). Caught via a "16 vs 17" count.
    Worktree sessions should assert `pwd`/branch before trusting any
    gate output.

- **The Dial Stone — skywatcher landmark, the clock made visible
  (2026-07-14, `feat/dial-stone`)**: worldbuilding-loop iteration 3. The
  east wedge between Gruk's Hollow and the Emberwatch Ruins was the last
  big empty stretch, and the pick does double duty as *mechanical
  diegesis*: the server-synced hour is a real system (night duelists,
  Nocturnal, torch ramps, the shared sky) and nothing in the world ever
  talked about it.
  - **The place** (`client/src/world/dialstone.js`, CAMPS (165,25) r=16):
    a weathered sundial — low plinth (local mid-gray material; the first
    render's M.waystone read as new marble, retoned), a leaning gnomon
    whose REAL shadow from the moving directional sun sweeps the ring
    (the feature costs nothing — shadows already exist), and 12 hour
    stones with two fallen and one missing ("Merle won't say which").
    Merle's camp downhill so the tent never shades the dial; two watching
    benches.
  - **Merle the Skywatcher** — flavour NPC, small-omens tier: grounds the
    clock ("twelve stones and a shadow"), ties to the economy (Highgate
    buys star-charts), and — the load-bearing line — **points players at
    the realm's night content** ("there are those that only keep night
    hours: the old watch's ruin has one, the deep wood has another"),
    answering the long-standing "is the Sentinel's window discoverable?"
    open question with an in-world hint instead of UI. One seeded omen:
    the nights measure the same but *feel* longer.
  - **Flora clearings** (`wilds.js`): the global random tree/rock scatter
    (d 30–190, re-rolled each load) could drop a pine inside the dial
    ring or the Wether Downs fold on any given load — caught live when
    one did. New small CLEARINGS list in wilds.js for open-ground
    landmarks whose read needs clear sightlines; forested zones and
    walled places deliberately not listed.

- **Cinderpass fix (2026-07-08, `fix/cinderpass`)** — Michael playtested Phase
  1 and hit the predicted problem: "walked over a big hill that wasn't very
  clear I could climb." Two real flaws, both fixed:
  1. *The pass climbed over the peak.* The ridge Gaussian raised the ground
     ~39 even at the gap, so "the pass" was climbing the crest where boulders
     happened to be missing. Fixed by notching `groundH` near x=0 (a
     `passNotch` factor) so Cinderpass is a genuine LOW corridor (~10 units)
     between tall (~42) peaks — verified live.
  2. *The boulder wall was porous.* Boulders every 15 units with ~4-5-radius
     colliders left ~6-unit walk-through gaps all along it, so the ridge was
     climbable almost anywhere. Fixed by replacing the per-boulder colliders
     as the barrier with TWO solid `addRect` wall segments flanking the pass
     (boulders are now just visual dressing) — verified live via direct
     `resolveCollision` tests: crossing is blocked at x=50/120 and open at
     x=0/10 (the pass).
  Also: (a) the ridge recolor was fixed — it read as a green hill because the
  volcanic blend started too far north; now high terrain (h>16) north of the
  seam reads as dark rock regardless of northness, so the peaks look like
  rock (confirmed in a live basin screenshot — dark ridge, ember-red basalt
  ground, glowing fumarole, "THE EMBERPEAKS" zone label). (b) Added a marked
  route: `cinderpass` waystones from the crossroads north past the mine, so
  the zone is findable, not stumbled-over. **This zone is now genuinely
  eyeballed live** (the preview loop happened to run this session). Remaining
  polish: the third-person camera gets "lifted" awkwardly when you stand on
  the steep ridge (terrain-clamp → upward gaze) — FIXED 2026-07-13
  (`fix/camera-ridge`, merge `f1913be`): uphill terrain now occludes the
  camera (ray-march over groundH pulls it in, like the house raycast);
  flat-ground sky-gazing verified unchanged. Confirm feel on the ridge in
  the next live pass.
- Field Effects (per-zone duel rules — direction decided 2026-07-13, nothing
  built, **deferred: do not start until Michael green-lights**): which zone
  ships the first field? Emberpeaks is the natural
  flagship (complete zone, thematically loud, its set already rewards the
  ashfall/kindle synergies a fire field would feed) — but it's also the
  end-game zone, so few duels happen there to playtest against. Does the
  starter Boarlands get a gentle field or no field (learn vanilla first)?
  And what does autobattle/AI do about fields — `ai.js` must tolerate them
  before any field ships, but how much field-awareness does the greedy brain
  need before autobattling in a hostile zone feels like throwing?
- World.js per-region split: **DONE 2026-07-13** (`feat/world-split`, Michael
  green-lit it as the prerequisite for the Deep Darkwood zone). world.js is
  now a barrel over `client/src/world/` — `lib.js` (materials, shared prop
  builders, spawn helpers, the fires/torches/camCollidables registries) plus
  one module per region (village, wilds, redsash, gruk, highgate, emberwatch,
  bramsrest, hollowmere, roads, harrowfield, mine, emberpeaks). Import sites
  unchanged. Extraction was done by exact line ranges (scripted, verbatim);
  equivalence proven live: two dev servers (main vs branch) produced
  byte-identical world fingerprints — all 25 NPCs (name/pos/duelist/vendor/
  flavor), 54 critters, 8 fires, 12 torches, 24 camCollidables, 645 scene
  objects, matching patrol positions. Rule for new zones: one module per
  region built on lib.js; world-spanning systems (flora, roads) get their
  own modules.
- Renown pacing: thresholds 20/60/150 are untested against real play.
- Starter balance: ADDRESSED 2026-07-13 (`balance/redsash-starter`, see the
  decision entry). The documented "boarherd ~75% vs redsash" was stale — at
  pass time the real spread was boarherd 79% vs WARDENS, 59% vs redsash,
  wardens 37% vs redsash. After an 8-card tuning pass: 60/52/47 (500 games
  per pairing, sides alternated). Wardens sims at 40-47% deliberately — the
  greedy AI undervalues guardian/ward/heal, so sim-parity for a defensive
  deck would likely read as oppressive under human piloting. Re-run
  `node scripts/sim-starters.mjs` after any starter-pool card change.
- Highgate placement/scale is untested in real play — verify the walk feels
  like a destination, not a slog, and that the wall gate doesn't create a
  collision pinch point. Bram's Rest (below) is a first attempt at breaking
  up that walk — worth checking in the same live pass whether one waypoint
  is enough or the middle third still drags.
- Emberwatch Ruins' 20:00-6:00 window is a first guess (~1/2.4 of a 20-min
  day, ~8 real minutes) — untested whether that's a fair amount of time to
  stumble onto it. The visibility toggle itself (mesh.visible via gameHour)
  is also a new pattern — worth a live check that it flips cleanly at both
  boundaries with no flicker.
- Bram's Rest sits at r≈73 from origin, just inside the Boarlands ring
  (r<78) — untested whether the CAMPS r=14 override reads cleanly on the
  minimap/full-map against the ring boundary right behind it, or whether
  the zone label flickers between "Bram's Rest" and "The Boarlands" right
  at the edge.
- Waystones are placed by dead reckoning (never live-verified — the preview
  gotcha again). Two things want an in-game look: (a) whether each gilded
  arrow actually points at its destination (the atan2 facing is reasoned,
  not seen), and (b) whether the ~10 stones sit at sensible spacing/height
  along the routes or land awkwardly on hills / inside tree clusters. All
  are cosmetic with a small collider, so worst case is visual, not blocking.
  If arrows point wrong, the fix is the sign/axis in `waystone()`'s `rot`.
