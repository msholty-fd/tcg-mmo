# Emberwood Online — Model Guide (task routing by capability)

Written 2026-07-08 by a Fable-tier session; updated 2026-07-14 after ~20
merges under this routing (factions, three completed zones, the world/
split, LORE.md). For routing work to cheaper / smaller models (Haiku-tier,
Sonnet-tier) so they contribute safely and effectively. **Companion doc:
`.claude/VERIFICATION.md`** — the exact recipes for every check named here. If you are a smaller model reading this: the GREEN section is
your home turf — copy the cited reference pattern exactly, run the listed
checks, and you will produce work indistinguishable from a frontier model's.
The RED section is where plausible-looking changes quietly corrupt the
economy or break duels; don't improvise there, flag it for a stronger
session instead.

Why this codebase is unusually friendly to small models: it is deliberately
**data-driven at the edges and clever only in the middle**. Cards, quests,
duelists, art, packs, world props, and HUD panels are all *registrations* —
you add an object to a list that an existing engine consumes. The hard
invariants (server authority, instance identity, reaction timing) live in a
few small files you can simply avoid touching.

---

## Hard rails — every model, every task, no exceptions

These are cheap to follow and expensive to violate. When in doubt, the rule
is "add data, don't change machinery."

1. **Follow WORKFLOW.md**: worktree per task → `npm run build` +
   `node --check` on changed server/shared files → merge to main →
   update STATUS.md → **stop**. Never deploy, never `git push`, never merge
   a red build.
2. **`shared/` stays pure** — no DOM, no THREE, no fs, no `Date.now()`
   randomness outside `duel.rng()`. It runs identically in browser and Node.
3. **Never add a client-side path that mutates progression** (cards, coins,
   XP, quests, decks). The client renders and requests; the server decides.
4. **Never relitigate settled decisions.** DESIGN.md records what was
   considered and rejected, with reasons. The ones models keep wanting to
   "fix": Legend Budget (don't remove/soften), no MTG stack (reactions are
   deliberate), no crafting, autobattle earns full rewards, buildings are
   inline never instanced/teleported, pixel art never emoji. Read the
   DESIGN.md entry before touching anything adjacent to these.
5. **Check `git worktree list` and STATUS.md before starting** — other
   sessions may be active (e.g. one owned `shared/engine/` on
   `feat/enchantments` on 2026-07-08). Don't touch files another live
   branch is editing.
6. **Record verification honestly** in STATUS.md — what you ran and what
   you skipped. "Build passed, live check blocked by the preview gotcha"
   is a fine entry; a claimed check that didn't run is not.
7. **Read `.claude/LORE.md` before writing ANY player-facing text** — quest
   text, NPC dialogue, card names/flavor, UI copy, broadcast lines. It has
   voice rules (rank names not "points", fires have tiers, hooks are
   *referenced never explained*) and a who-knows-what ledger. Cheap models
   produce fine prose in the wrong voice; the voice IS the product here.
8. **Run the standing suites and compare counts against main's baseline**
   (test-packs / test-leaders / test-factions — see VERIFICATION.md §1).
   A dropped count means your branch broke a cross-file invariant even if
   your feature works. These suites exist precisely so smaller models get
   machine-checked instead of judgment-checked.

---

## GREEN — pattern-copy work (cheap models: start here)

Each entry: what it is, the reference pattern to copy, and the checklist.
The common shape: **find the newest existing example, imitate it exactly,
register everything, verify headlessly.**

### G1. New cards using existing mechanics
- **Files**: `shared/sets/core/cards.js` — or a zone set's cards.js; three
  sets exist now (`core`, `emberpeaks`, `darkwood`) and new sets are folders
  (+ art, see G2; + a duelist reward pool or a pack, or the card never
  enters circulation — see G3).
- **Faction mapping (new since factions, 2026-07-14)**: every card must
  resolve through `shared/factions.js` — core cards map via their
  deck-builder family (`FACTION_OF_FAMILY`), zone sets map wholesale
  (`FACTION_OF_SET`), unmapped families are deliberately neutral. A card in
  a gated family is rank-gated by rarity (common 0 / uncommon 1 / rare 2,
  champions +1) — so rarity is now a PROGRESSION decision, not just a pack
  weight. `node scripts/test-factions.mjs` checks the map end-to-end.
- **Pattern**: any recent entry in cards.js. A card is one object:
  `{ id, set, rarity, type, cost, atk, hp, keywords?, triggers?,
  needsTarget?, storiedKeyword?, name, text, flavor }`.
- **Stay inside the existing vocabulary**: keywords `ambush, guardian,
  ward, frenzy, lifesteal, piercing`; effects registered in
  `shared/engine/effects.js` (`damage, heal, draw, buff, grantKeyword,
  refresh, summon, emberGain, counter, exhume, graveBuff, resetKindle`);
  triggers `onPlay, onDeath, onAttack, startOfTurn, onKindle` + reaction
  triggers; target selectors in `effects.js selectTargets()`. If your card
  idea needs a verb not in these lists, it is NOT a green task — see Y1/R1.
- **Checklist**: `text` describes rules, `flavor` is separate and italic-
  worthy; `needsTarget` set iff an effect uses `target:'chosen'`; rarity
  assigned (packs are rarity-weighted); CARD_ART entry exists (G2); card
  reachable via some duelist's rewards or `cardsInSet('core')` pack pull;
  headless sim (see Verification menu) shows no stuck games; build +
  `node --check` pass.
- **Gotcha**: card *stats and costs* are balance decisions. Adding a
  2-cost 4/4 with upside will pass every gate and still be wrong. Copy the
  stat curve of existing cards at the same cost; note the sim winrates in
  your handoff.

### G2. Card art (pixel grids)
- **Files**: `client/src/pixelArt.js`.
- **Pattern**: 16×16 palette-keyed character grids ('.' = transparent).
  Strongly prefer **reusing a sprite family with a palette swap** (all
  boars share `boar`; hooded humans share `hooded`) — that's the intended
  economy of the system. New grid only when no family fits.
- **Checklist**: every new card id has a CARD_ART entry; rows are exactly
  16 strings of 16 chars; every char appears in the palette; **no emoji,
  ever** (explicitly rejected). Verify by loading the collection or hover
  inspector — or at minimum confirm the module parses (`npm run build`).

### G3. New duelists from existing cards
- **Files**: `shared/sets/core/duelists.js`; spawn in `client/src/world.js`
  (`spawnDuelist`), optionally a quest (G4).
- **Pattern**: `footpad` / `sentinel` entries — take a starter deck, `swap()`
  a few cards toward a theme, list `rewards` (their deck + a few extras).
  Reward pools are how new cards enter circulation.
- **Checklist**: every id in deck/rewards exists in cards.js; deck stays a
  legal 30; prefer cards no other duelist uses (check with grep); server
  needs no changes (roster is shared). Note: the server validates NO
  duelist proximity/time-of-day — that's a documented, deliberate hole
  (DESIGN.md, Emberwatch entry); don't "fix" it for your one NPC.

### G4. New quests using existing objective shapes
- **Files**: `shared/quests.js` (definitions + gating), `client/src/quests.js`
  (GIVERS map), sometimes `client/src/interact.js`.
- **Pattern**: any QUESTS entry. Three objective shapes exist: `duels:
  {target, need}`, `collect: {cardId, need}`, and `visit: {x, z, r}`
  (added 2026-07-13; progressed server-side from the pos stream — good for
  discovery quests). `giver` is client-only; any NPC can give quests with
  zero server changes.
- **Checklist**: `minLvl`/`prereq` gate set thoughtfully (early content
  gates early — see `road_toll`); offer/obj/thanks text written in the
  established voice; collect quests do NOT consume cards (by design);
  **run the headless quest-gate test** — a ~14-assertion script pattern
  exists (STATUS.md, collect-quests entry): canAccept/canTurnin under
  prereq/level/progress permutations. A new objective *shape* is Y-tier,
  not green.

### G5. Worldbuilding: props, camps, landmarks, flavor NPCs
- **Files**: world authoring is now per-region modules (2026-07-13 split):
  a new place = new `client/src/world/<region>.js` built on `world/lib.js`
  (materials, prop builders, spawn helpers, registries), re-exported from
  the `world.js` barrel. Promote a builder into lib.js only once 2+ regions
  use it (the deadTree rule). Plus `client/src/colliders.js`
  (registration), `client/src/constants.js` (CAMPS zone entry),
  `client/src/interact.js` only if using `n.flavor`.
- **Pattern**: The Wether Downs (`world/wetherdowns.js`) is the newest
  worked example of a landmark; Bram's Rest (small), Emberwatch Ruins
  (landmark), Highgate (full hub) — read their DESIGN.md entries first;
  they document placement logic, what was reused, and what was deliberately
  not done. Reuse the existing primitives: tent/campfire/signpost/crate/
  barrel/`spawnNPC`/`spawnDuelist`, `groundH()` for terrain-following,
  `n.flavor` (string or string[]) for dialogue-only NPCs.
- **Scope by tier**: *landmark* (Harrowfield, Wether Downs precedent) =
  world module + flavor NPC only, no cards/duelist/quests — a flavor
  landmark earns a road/duelist when it earns content. *Zone* = the full
  phased playbook (see "The zone playbook" below). Picking the tier is a
  design call; executing a landmark is green.
- **Checklist**: every solid prop registers a collider (unregistered =
  walk-through; convention: banners/totems/bone piles stay uncollided);
  survey `CAMPS` in constants.js + the DESIGN.md map-survey entries for
  free space before placing (the map has grown past any coordinate list
  this file could keep current; world clamp ~210); fires follow LORE.md's
  fire tiers (kept/tended/cold — it's canon, not decoration); CAMPS entry
  if it should have a zone label; add a DESIGN.md entry recording your
  placement reasoning and open questions, matching the existing entries'
  format.
- **This is the best-proven cheap-model lane**: the worldbuilding loop
  iterations were nearly pure recombination of verified builders, and the
  risk note each time was "identical primitives to already-live code."

### G6. HUD panels and small client UI
- **Files**: `client/src/hudWindows.js` (`registerWindow(id, {label, key})`
  gives drag/close/persist for free), `client/src/escMenu.js` conventions
  (Esc = universal back), `client/src/cardZoom.js` (`[data-card]` gets the
  hover inspector for free).
- **Checklist**: use `registerWindow`, don't hand-roll drag/persist; card
  references carry `data-card`; Esc-close order respected.

### G7. Docs and status upkeep
STATUS.md handoff entries, DESIGN.md decision records, CLAUDE.md gotchas —
format-following work, and high-value. Copy the tone and structure of
recent entries (what merged, what was verified, what was skipped and why,
what to look at next session).

### G8. Wardrobe items (faction regalia) — new 2026-07-14
- **Files**: `shared/cosmetics.js` (`WARDROBE` entries), nothing else — the
  server validates and the client renders from the same data.
- **Pattern**: `{id, name, slot, faction, rank, color, glow?}`; slots map
  1:1 onto `humanoid()` parts. Copy an existing faction's four-piece spread
  (Known → body, Trusted → legs + head, Sworn → back/cape).
- **Checklist**: rank follows the Known/Trusted/Sworn convention; names in
  LORE voice (diegetic "wearing their colors", never "unlock"); `glow` only
  where the fiction earns it (the Emberpeaks mantle smolders). A new SLOT
  (vs item) touches `entities.js` mesh work — that's yellow, not green.

### G9. Zone packs + vendors — new since Phase 3b ×2 (both zones shipped
this exact shape with ZERO server changes)
- **Files**: new `shared/sets/<zone>/packs.js`, merged into core
  `packs.js`'s registry (hand-merge, same as banners/leaders — the
  promotion trigger for a real registry is recorded there: a fourth set);
  vendor NPC gets `.vendorPack` in its world module (`interact.js`/shop are
  generic over it).
- **Pattern**: Night-Gather (`shared/sets/darkwood/packs.js`) + Pedlar Rusk
  is the newest worked example; `openShop(pack)` and server `buyPack` are
  already generic (price, desc, vendor coords all live on the pack def).
- **Checklist**: 5-card rolls from the zone set; **price and rarity weights
  are economy decisions** — stay inside the established band (Boarlands 25 /
  Night-Gather 35 / Cinder Cache 40; weights ~60-65/28-30/8-10, rare weight
  kept modest so chase cards stay chases) and say so in the handoff; vendor
  placed at the zone edge on a road (the Varn/Rusk placement rule);
  `test-packs.mjs` green (it checks the vendor-coord invariant); raw-WS
  e2e of far-buy/poor-buy/real-buy (VERIFICATION.md §4).

---

## The zone playbook — the proven macro-arc for new zones

Two zones (Emberpeaks, Deep Darkwood) shipped complete through the same
phase sequence; it is now the default shape for "add a zone". Each phase is
a separate branch/session, tiered independently:

1. **Phase 1 — terrain + props + seeded hooks** (G5, green): the place
   exists, with 1-2 *named but unexplained* hooks for later phases (the
   Circle of Sighs pattern — a door named before its content exists).
2. **Phase 2 — the zone card set** (yellow): 15-16 cards on one mechanical
   axis the zone owns (emberpeaks: kindle-matters; darkwood:
   night-matters). Usually includes ONE engine addition (Y1/R1 depending
   on depth — `nocturnal` was a state.js touch). Cards stay OUT of
   circulation this phase, by precedent.
3. **Phase 3 — duelists + quest chain** (G3/G4 + Y for any new gating):
   the hooks pay off; reward pools put the set into circulation.
4. **Phase 3b — pack + vendor + polish** (G9, green): the coin sink,
   plus any UI debt flagged earlier (the night badge pattern).

Phase boundaries are where cheap models hand off cleanly: each phase ends
with suites green, a STATUS.md entry, and the next phase's hooks named.
Don't reorder (circulation before duelists breaks the chase-card economy)
and don't compress phases into one branch.

---

## YELLOW — moderate reasoning (mid-tier model, or cheap model + review)

Doable by a careful mid-tier model; the failure modes are subtle rather
than catastrophic. Budget extra verification.

- **Y1. New effect primitives** (`registerEffect()` in
  `shared/engine/effects.js`): the registry pattern is simple, but you must
  reason about: `duel.rng()` for all randomness (determinism), pushing a
  `duel.log` entry + `say()` chatter, hand-size/graveyard edge cases (see
  `exhume`), and how the effect reads inside reaction context
  (`ctx.trigger`, `ctx.countered`). Copy `exhume`/`graveBuff` as templates.
  Add engine scenario checks like the 26 used for the reactions merge.
- **Y2. AI changes** (`shared/engine/ai.js`, 88 lines, greedy): one brain
  serves NPCs + autobattle + balance sims, so any change moves all three.
  Always run before/after sims (20+ games per matchup) and report spreads.
- **Y3. Balance passes** (stats/costs in cards.js): mechanically trivial,
  analytically not. Current tuned spread (2026-07-13): boarherd 60% vs
  wardens, 52% vs redsash, wardens 47% vs redsash — wardens below sim
  parity ON PURPOSE (the greedy AI undervalues defense). Run
  `node scripts/sim-starters.mjs` before AND after; report both spreads.
  Prefer card-definition tweaks over deck-list edits (13 duelist decks
  `swap()` hard-coded starter ids; list edits risk silent size breakage).
- **Y4. New quest objective shapes** (a third sibling to duels/collect):
  touches shared validation + server progress events + client rendering.
  The `collect` implementation is the worked example — including the latent
  `interact.js` crash it had to fix (code that assumed `.duels.need`).
- **Y5. Building interiors / new geometry patterns**: must follow the
  inline `house1Interior()` pattern (wall segments + doorway gap +
  per-segment colliders). The teleport/pocket-room approach is REJECTED —
  proposing it again is an instant fail.
- **Y6. NEW shop/vendor-like flows**: a standard zone pack + vendor is
  green now (G9 — `buyPack`/`openShop` are generic). Yellow is a *new kind*
  of purchasable: the client window stays easy, but the paired server
  handler (validate coins + proximity, mint server-side) is the part that
  needs care — mirror `buyPack` exactly, and e2e the refusal paths.
- **Y7. Day/night–gated content**: client-side `gameHour` checks are the
  established pattern (Sentinel), but remember the hour is server-synced;
  test via offline mode or right after a fresh Vite start (STATUS.md
  gotcha: the server's 10 Hz state broadcast overrides `setGameHour()`
  within ~100ms).

---

## RED — high-reasoning only (frontier model, fresh context)

Small models should not edit these files beyond mechanical, reviewed
changes. The cost of a subtle bug here is corrupted player data, a
down realm, or a broken economy — and the bugs *look* fine locally.

- **R1. `shared/engine/engine.js` + `state.js`** — turn structure, combat
  keywords, and especially **reaction timing semantics** (`enemySpell`
  fires BEFORE the spell's effects so `counter` works; `enemyCreature`
  fires AFTER onPlay; `enemyAttack` can fizzle a consumed attack). These
  orderings are design decisions with rationale (DESIGN.md); an
  innocent-looking refactor that reorders them changes the game. New
  keywords live in `attack()` — engine surgery, not registration.
- **R2. `server/index.js`** — auth (scrypt + legacy migration), session
  tokens, trading (atomic two-sided execution, anti-scam confirm reset,
  re-validation at execution time), minting, coin/XP grants, rate limits,
  input clamps. This is the security boundary; every handler must assume
  a hostile scripted client.
- **R3. `server/duelRoom.js`** — duel lifecycle, reconnect grace, reward
  authority, PvP vs NPC paths. Timing/disconnect edge cases dominate.
- **R4. `client/src/net.js` + protocol changes** — message shapes are an
  implicit contract between deployed clients and the server; changing
  them interacts with deploy ordering and reconnects.
- **R5. `server/db.js` / profile schema** — one JSON row per profile;
  schema changes need migration thinking, pre-deploy backups, and a
  STATUS.md flag for the deploy. History: schema changes have forced
  full wipes before.
- **R6. `shared/factions.js` + `shared/deckConstraints.js` math** — THE
  progression system (2026-07-14). Adding a faction or a wardrobe item is
  data (green); changing standing earn rates, rank thresholds, the
  rarity→rank derivation, the champion vouch, or how `validDeck` composes
  its gates reprices every player's progress at once. These numbers were
  chosen deliberately (DESIGN.md "Factions"); a plausible-looking tweak
  passes all 399 assertions and still breaks the economy.
- **R7. Design-space decisions** — anything DESIGN.md marks as an open
  question (renown thresholds, starter balance direction, fast travel),
  anything that adds a new *system* (crafting, marketplaces, instancing),
  and anything touching the settled decisions in the hard-rails list.
  These aren't coding tasks; they're judgment calls with recorded history,
  and several are explicitly Michael's to make.

---

## Verification menu, cheapest first

Match the check to the change; don't reach for the browser when a sim
answers the question. **Full recipes with exact commands, env vars, and
gotchas live in `.claude/VERIFICATION.md`** — this is just the menu.

1. `node --check <file>` — syntax on any changed server/shared file. Free.
2. `npm run build` — required gate, catches client import/parse errors.
3. **The standing suites** — `scripts/test-packs.mjs`, `test-leaders.mjs`,
   `test-factions.mjs`, `sim-starters.mjs`. Run on main first for the
   baseline, then on your branch; a dropped count = broken invariant.
4. **Headless quest-gate script** — fake profile objects against
   `shared/quests.js` (canAccept/canTurnin/progress permutations).
5. **Headless balance sim** — `createDuel` + `ai.takeTurn` loop in Node;
   20 games in seconds; check winner spread + no stuck games. Required
   when touching `shared/engine/` or `shared/sets/`.
6. **Raw-WS e2e** — throwaway server (`PORT=8099 DB_FILE=<temp>`), plain
   WebSocket driver; assert the REFUSAL paths, not just success. The
   standard check for anything server-authoritative.
7. **Live browser via preview** — the most expensive and the flakiest:
   the `document.hidden === true` rAF stall (confirm with a per-frame
   value read twice ~1s apart before debugging anything). More survives
   the stall than the old notes said — evals, WS, DOM, screenshots
   (forced paint), manual `renderer.render()` for world shots
   (VERIFICATION.md §6) — but movement never does. If it's stuck, verify
   what you can, fall back to 1–6 for the rest, and say so in STATUS.md.
   Cheap models especially: do not rabbit-hole here.

## One-line router

> Registering data into an existing list (card, quest, duelist, sprite,
> prop, panel, wardrobe item, zone pack)? **Green — go.** Adding a new
> primitive/shape the engine consumes? **Yellow — go carefully, test
> headlessly, before/after sims.** Changing what the engine, server,
> protocol, or progression math *does*, or making a design call?
> **Red — leave it for a frontier session and flag it in STATUS.md.**
