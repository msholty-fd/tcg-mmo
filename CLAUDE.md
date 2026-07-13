# Emberwood Online

An open-world MMO card game: walk a 3D world, challenge NPCs and real players
to card duels, collect card *instances* that accrue history and power.

Deeper notes live in `.claude/`:
- `.claude/DESIGN.md` — vision, design pillars, decisions and their reasoning
- `.claude/DEPLOYMENT.md` — deployment checklist (TLS, hashing, hosting…)
- `.claude/WORKFLOW.md` — **required working style**: worktree per task →
  verify → merge to main → deploy to Fly.io
- `.claude/STATUS.md` — session handoff: env state, test account, next steps
- `.claude/MODEL_GUIDE.md` — task routing by model capability: which work is
  safe pattern-copying for cheaper/smaller models (green), which needs care
  (yellow), and which is frontier-model-only (red). Smaller models: read it
  first and stay in your tier.

## Working style (see .claude/WORKFLOW.md for the full procedure)

- Do feature work in a **git worktree** on a `feat/…` branch, never directly
  on `main` (`git worktree add ../emberwood-<name> -b feat/<name>`; run
  `npm install` there — node_modules is gitignored). One worktree = one
  branch = one agent, so parallel agents can't conflict.
- The primary checkout (`~/dev/emberwood-online`) stays on `main`: it alone
  runs the dev servers (ports 8081/5175) and performs merges.
  Gates are light while the realm has no real players (tight-loop posture):
  `npm run build` + `node --check` on changed server/shared files. Revisit
  in WORKFLOW.md §2 when real users arrive.
- **Agents merge; Michael deploys (decided 2026-07-08).** After verification
  gates pass, merge (`--no-ff`, serially if multiple branches are ready),
  build the merged result, update STATUS.md with "deploy pending" + anything
  the deploy needs to know (schema changes, backups) — then STOP. Do not run
  `fly deploy`/`fly ssh`/`git push`; the deploy checklist in WORKFLOW.md §4
  is Michael's. Never merge with a failing build — main is what he ships.

## Run

```
npm run server   # WS game server on :8081 (node server/index.js)
npm run dev      # Vite client on :5175 (configured in ~/dev/.claude/launch.json as "emberwood")
```
Both must run. Client falls back to offline mode (local NPC duels, no
progression) when the server is down; it auto-reconnects every 4s.

## Architecture — the rules that keep this sane

- **`shared/` is pure** — the rules engine (`shared/engine/`), card sets
  (`shared/sets/`), quests, chronicle, and progression math run identically in
  browser and Node. No DOM, no THREE, no fs. If a change needs platform APIs,
  it doesn't belong in shared.
- **The world stays ONE seamless scene** (decided 2026-07-13, DESIGN.md
  "World architecture"): never instanced/portal zones. Scale via per-region
  authoring modules (world.js split — pending), then server-side interest
  management (~50 concurrent players), then client prop streaming — each has
  an explicit trigger in DESIGN.md; don't build them early. Rising graphical
  fidelity accelerates those triggers but doesn't change the shape (DESIGN.md
  "Graphical fidelity path": atmosphere → motion → InstancedMesh-gated
  geometry density → glTF+streaming; budget metric is draw calls + frame
  time, never memory).
- **Duel innovation direction (2026-07-13, DESIGN.md "Card-game direction"):**
  familiar TCG spine stays fixed; new design space comes from what MTG can't
  do — per-zone **Field Effects** (a region's standing rule applies to both
  sides of duels fought there) and, later, Chronicle-powered mechanics.
  Prerequisite for any field work: promote the zone map from
  `client/src/constants.js` CAMPS to `shared/` so the server derives the
  field from duel location authoritatively.
- **The server is authoritative for everything worth having**: card grants
  (minting), decks (validated: ownership, ≤3 copies, Legend Budget), XP/levels/
  coins, quest accepts/turn-ins/progress, duel outcomes. The client is a view;
  it renders sanitized duel views (opponent hands are nulls) and sends action
  requests. Never add a client-side path that mutates progression.
- **Cards are instances, not counts.** Every copy has an iid, origin, owners[],
  battle record, and renown (see `shared/chronicle.js`). The engine carries
  `{card, iid, level}` deck items so combat stats credit the exact copy
  (unit.uid === instance iid). Tokens/NPC cards are anonymous fresh instances.
- **Sets are folders** (`shared/sets/core/`). New cards = data registered via
  `registerCards()`; new mechanics = effect primitives via `registerEffect()`
  or keywords handled in `engine.js attack()`. Reaction cards (type
  `reaction`, set face-down, auto-fire via `fireReactions()`) are the
  counterplay surface — no priority/stack, by decision (DESIGN.md). Duelist
  roster in
  `shared/sets/core/duelists.js` is shared by client (world spawns) and server
  (authoritative decks/rewards).

## Key files

- `shared/engine/engine.js` — turn structure, actions, combat keywords
- `shared/engine/state.js` — duel state, instance normalization, stats/chatter
- `shared/engine/ai.js` — greedy duelist brain (NPCs, autobattle, headless sims)
- `server/index.js` — auth (name+password, scrypt + legacy-sha256 migration), profiles, presence, chat
- `server/duelRoom.js` — duel rooms: PvP + NPC(AI), reconnect grace, rewards
- `client/src/net.js` — connection, remote players, profile sync
- `client/src/duel/` — duel UI (duelUI.js) + mode bridge (duelManager.js)
- `client/src/trade.js` — player trading window (T near a player; invite →
  offers+coins → double-confirm; server messages trade*/`server/index.js`)
- `client/src/pixelArt.js` — card art: hand-authored 16×16 palette-keyed pixel
  grids rendered to data-URLs (`image-rendering: pixelated`). One sprite serves
  a family via palette swaps (all boars share `boar`; hooded humans share
  `hooded`). New cards need a CARD_ART entry: reuse a sprite + palette, or
  author a new grid. No emoji in card art — this replaced it deliberately.
- `server/profiles.db` — ALL player data, SQLite via `server/db.js`
  (node:sqlite, one JSON row per profile; gitignored; wipe = full reset).
  A legacy `profiles.json` is imported once on boot, then renamed `.migrated`.
- `client/src/hudWindows.js` — draggable/closable HUD panels (Q/H/P hotkeys);
  new panels get drag/close/persist via `registerWindow(id, {label, key})`
- `client/src/escMenu.js` — Esc menu (resume / controls / log out); Esc closes
  the deck builder first if it's open
- `client/src/cardZoom.js` — hover inspector for any `[data-card]` element
- `shared/sets/core/packs.js` — supply-pack definitions + rarity-weighted
  `rollPack()`. Coin economy: duel wins pay 5 (NPC) / 10 (PvP) — autobattle
  included (QoL decision, DESIGN.md); packs are the sink,
  sold in-world by Marla (`client/src/shop.js`, E when no quest business).
  Server validates coins + proximity and mints (`buyPack` in server/index.js).
  No crafting — deliberate, see DESIGN.md ("packs complement trading,
  crafting substitutes for it").
- `client/src/colliders.js` — 2D collision registry: world.js builders register
  circles (trees/well/rocks/campfires) and rotated rects (houses) alongside
  their meshes; `resolveCollision(x, z, r)` push-out runs after movement in
  main.js (player + critters). New obstacles must register here or they're
  walk-through. Client-side only — position is cosmetic/client-authoritative.

## Client conventions

- Auth: name+password creates/recovers characters; server issues a device
  token (`emberwood.token`) for auto-login; session (`emberwood.session`)
  auto-enters the world with saved position. Log Out (Esc menu) clears both.
- Day/night: 20 real min/day (`main.js update()`). The hour is **server-synced**:
  the server derives it from wall clock (`(Date.now()/50_000) % 24` — no stored
  state, survives restarts) and ships it in `welcome` + the 10 Hz `state`
  broadcast; `net.js` calls `setGameHour()` so all players share one sky.
  Offline mode falls back to the local 10:00 start. At night the directional
  light becomes a FIXED "moon" (a horizon-grazing moving light casts sweeping
  shadow streaks — that bug is why). Visible sun/moon discs are fog-immune
  sprites in scene.js, positioned each frame. `setGameHour(h)` exported for
  testing. Village torches (world.js) ramp with darkness.
- Camera: full 360° yaw; pitch −.55…1.45. The terrain clamp can block the
  camera from dipping low — the blocked amount converts to upward gaze
  (`lift` in main.js) so looking at the sky works on flat ground.

## Testing patterns that work here

- **Headless balance sim**: `createDuel` + `ai.takeTurn` in a loop (browser eval
  or Node) — 20 games in seconds; check winner spread and stuck games.
- **Raw-WS driver**: open a second `WebSocket('ws://localhost:8081')` in a
  preview eval to simulate another player (join/challenge/duel actions).
- **Gotcha**: after Vite HMR, `import('/src/x.js')` in preview evals gets a
  DIFFERENT module instance than the app (`?t=` versioning). Restart the Vite
  server before evals that poke module state, or assert via DOM/localStorage.
- **Gotcha**: verify UI through real bubbling clicks — driving handlers
  directly missed a targeting bug that bubbling immediately cancelled.
- **Gotcha**: the preview browser tab can get stuck with `document.hidden ===
  true` mid-session (observed 2026-07-08 after several `preview_stop`/
  `preview_start` cycles across a long session) — this fully suspends
  `requestAnimationFrame`, so the ENTIRE game loop stalls silently: no
  movement, no animation, no console errors, `started`/gating flags all
  read correctly. Confirm before debugging "input isn't working": read a
  value the loop updates every frame (e.g. `(await
  import('/src/world.js')).fires[0].userData.fire.scale.y`) twice with a
  ~1s gap — if it hasn't changed, it's this, not a code bug. A full
  `preview_stop` + `preview_start` did NOT fix it in the observed case; no
  reliable workaround found yet. Recurred 2026-07-08 (Bram's Rest session):
  a brand-new preview server + brand-new tab (never previously used this
  session) still came up with `document.hidden === true` from the start —
  so it isn't only a degrade-over-a-long-session thing, and clicking the
  page/canvas doesn't clear it either. When this happens, fall back to
  build + `node --check` + headless logic tests and say so honestly in
  STATUS.md rather than blocking the merge on a live check that isn't
  currently possible. **Partial workaround (discovered 2026-07-13, Phase 3b
  session): the stall only kills rAF — JS eval, WS networking, DOM, and CSS
  all still work.** So you CAN still verify a lot live: token auto-login
  (mint a char over raw WS, set `emberwood.token` + `emberwood.session` in
  localStorage, reload), drive module functions directly via
  `import('/src/x.js')`, read the DOM, and — key discovery — `computer
  screenshot` forces a one-off paint, so HUD windows/overlays opened via
  eval DO appear in screenshots. Movement/animation stay impossible; only
  the game loop is dead, not the page.

## Current state / known issues

- Balance: starter spread tuned 2026-07-13 to boarherd 60% vs wardens, 52%
  vs redsash, wardens 47% vs redsash (was 79/59/37; the old "~75% vs redsash"
  note was stale). Wardens sims below parity on purpose — the greedy AI
  undervalues defense. Measure with `node scripts/sim-starters.mjs` before
  and after any starter-pool card change.
- Autobattle earns full rewards (coins/XP/renown) — decided 2026-07-08, it's
  a QoL feature; see DESIGN.md before adding any autobattle penalty.
- World position is persisted server-side (profile.x/z/yaw, updated in memory
  per pos msg, saved on disconnect + any other profile save; `welcome` carries
  it and the client snaps to it — works cross-device). Fresh characters spawn
  at (0, 9).
- Trading is live (2026-07-07): proximity invite, cards+coins, anti-scam
  confirm reset, deck cards untradable, owners[] provenance appended on
  transfer. See DESIGN.md for the reasoning.
