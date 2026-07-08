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

## Open questions

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
  the steep ridge (terrain-clamp → upward gaze) — noted, not yet addressed.
- Renown pacing: thresholds 20/60/150 are untested against real play.
- Starter balance: boarherd ~75% vs redsash (AI-vs-AI); needs a card pass.
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
