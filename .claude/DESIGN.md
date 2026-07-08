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

## Open questions

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
