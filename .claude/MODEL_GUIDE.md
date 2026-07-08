# Emberwood Online — Model Guide (task routing by capability)

Written 2026-07-08 by a Fable-tier session, for routing work to cheaper /
smaller models (Haiku-tier, Sonnet-tier) so they contribute safely and
effectively. If you are a smaller model reading this: the GREEN section is
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

---

## GREEN — pattern-copy work (cheap models: start here)

Each entry: what it is, the reference pattern to copy, and the checklist.
The common shape: **find the newest existing example, imitate it exactly,
register everything, verify headlessly.**

### G1. New cards using existing mechanics
- **Files**: `shared/sets/core/cards.js` (+ art, see G2; + a duelist reward
  pool or the pack, or the card never enters circulation — see G3).
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
- **Pattern**: any QUESTS entry. Two objective shapes exist: `duels:
  {target, need}` and `collect: {cardId, need}`. `giver` is client-only;
  any NPC can give quests with zero server changes.
- **Checklist**: `minLvl`/`prereq` gate set thoughtfully (early content
  gates early — see `road_toll`); offer/obj/thanks text written in the
  established voice; collect quests do NOT consume cards (by design);
  **run the headless quest-gate test** — a ~14-assertion script pattern
  exists (STATUS.md, collect-quests entry): canAccept/canTurnin under
  prereq/level/progress permutations. A new objective *shape* is Y-tier,
  not green.

### G5. Worldbuilding: props, camps, landmarks, flavor NPCs
- **Files**: `client/src/world.js` (builders), `client/src/colliders.js`
  (registration), `client/src/constants.js` (CAMPS zone entry),
  `client/src/interact.js` only if using `n.flavor`.
- **Pattern**: Bram's Rest (small), Emberwatch Ruins (landmark), Highgate
  (full hub) — read their DESIGN.md entries first; they document placement
  logic, what was reused, and what was deliberately not done. Reuse the
  existing primitives: tent/campfire/signpost/crate/barrel/`spawnNPC`/
  `spawnDuelist`, `groundH()` for terrain-following, `n.flavor`
  (string or string[]) for dialogue-only NPCs.
- **Checklist**: every solid prop registers a collider (unregistered =
  walk-through; convention: banners/totems/bone piles stay uncollided);
  placement clear of existing sites (spawn (0,9), village r≈38, Vex
  (-88,66), Gruk (107,-60), Highgate (40,-145), Emberwatch (100,100),
  Bram's Rest (20,-70); world clamp ~210); CAMPS entry if it should have a
  zone label; add a DESIGN.md entry recording your placement reasoning and
  open questions, matching the existing entries' format.
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
  analytically not. The open item: boarherd beats redsash ~75% AI-vs-AI.
  Sims are cheap — iterate with data, not vibes.
- **Y4. New quest objective shapes** (a third sibling to duels/collect):
  touches shared validation + server progress events + client rendering.
  The `collect` implementation is the worked example — including the latent
  `interact.js` crash it had to fix (code that assumed `.duels.need`).
- **Y5. Building interiors / new geometry patterns**: must follow the
  inline `house1Interior()` pattern (wall segments + doorway gap +
  per-segment colliders). The teleport/pocket-room approach is REJECTED —
  proposing it again is an instant fail.
- **Y6. Shop/vendor-like flows**: client window (`shop.js` pattern) is
  green, but the paired server handler (validate coins + proximity, mint
  server-side) is the part that needs care — mirror `buyPack` exactly.
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
- **R6. Design-space decisions** — anything DESIGN.md marks as an open
  question (renown thresholds, starter balance direction, fast travel),
  anything that adds a new *system* (crafting, marketplaces, instancing),
  and anything touching the settled decisions in the hard-rails list.
  These aren't coding tasks; they're judgment calls with recorded history,
  and several are explicitly Michael's to make.

---

## Verification menu, cheapest first

Match the check to the change; don't reach for the browser when a sim
answers the question.

1. `node --check <file>` — syntax on any changed server/shared file. Free.
2. `npm run build` — required gate, catches client import/parse errors.
3. **Headless quest-gate script** — fake profile objects against
   `shared/quests.js` (canAccept/canTurnin/progressDuelWin permutations).
4. **Headless balance sim** — `createDuel` + `ai.takeTurn` loop in Node;
   20 games in seconds; check winner spread + no stuck games. Required
   when touching `shared/engine/` or `shared/sets/`.
5. **Raw-WS driver** — second `WebSocket('ws://localhost:8081')` to
   simulate another player (join/challenge/duel/trade messages).
6. **Live browser via preview** — the most expensive and the flakiest:
   see CLAUDE.md's `document.hidden === true` gotcha (game loop silently
   suspended; confirm with a per-frame value read twice ~1s apart before
   debugging anything). If it's stuck, fall back to 1–5 and say so in
   STATUS.md rather than burning a session fighting it. Cheap models
   especially: do not rabbit-hole here.

## One-line router

> Registering data into an existing list (card, quest, duelist, sprite,
> prop, panel)? **Green — go.** Adding a new primitive/shape the engine
> consumes? **Yellow — go carefully, test headlessly, before/after sims.**
> Changing what the engine, server, or protocol *does*, or making a
> design call? **Red — leave it for a frontier session and flag it in
> STATUS.md.**
