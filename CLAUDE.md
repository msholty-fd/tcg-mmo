# Emberwood Online

An open-world MMO card game: walk a 3D world, challenge NPCs and real players
to card duels, collect card *instances* that accrue history and power.

Deeper notes live in `.claude/`:
- `.claude/DESIGN.md` — vision, design pillars, decisions and their reasoning
- `.claude/DEPLOYMENT.md` — deployment checklist (TLS, hashing, hosting…)
- `.claude/STATUS.md` — session handoff: env state, test account, next steps

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
  or keywords handled in `engine.js attack()`. Duelist roster in
  `shared/sets/core/duelists.js` is shared by client (world spawns) and server
  (authoritative decks/rewards).

## Key files

- `shared/engine/engine.js` — turn structure, actions, combat keywords
- `shared/engine/state.js` — duel state, instance normalization, stats/chatter
- `shared/engine/ai.js` — greedy duelist brain (NPCs, autobattle, headless sims)
- `server/index.js` — auth (name+password, scrypt TODO), profiles, presence, chat
- `server/duelRoom.js` — duel rooms: PvP + NPC(AI), reconnect grace, rewards
- `client/src/net.js` — connection, remote players, profile sync
- `client/src/duel/` — duel UI (duelUI.js) + mode bridge (duelManager.js)
- `client/src/pixelArt.js` — card art: hand-authored 16×16 palette-keyed pixel
  grids rendered to data-URLs (`image-rendering: pixelated`). One sprite serves
  a family via palette swaps (all boars share `boar`; hooded humans share
  `hooded`). New cards need a CARD_ART entry: reuse a sprite + palette, or
  author a new grid. No emoji in card art — this replaced it deliberately.
- `server/profiles.json` — ALL player data (gitignore-worthy; wipe = full reset)
- `client/src/hudWindows.js` — draggable/closable HUD panels (Q/H/P hotkeys);
  new panels get drag/close/persist via `registerWindow(id, {label, key})`
- `client/src/escMenu.js` — Esc menu (resume / controls / log out); Esc closes
  the deck builder first if it's open
- `client/src/cardZoom.js` — hover inspector for any `[data-card]` element

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

## Current state / known issues

- Balance: boarherd starter beats redsash ~75% in AI-vs-AI.
- Autobattle earns full renown/XP (idle-farming policy undecided).
- World position is persisted server-side (profile.x/z/yaw, updated in memory
  per pos msg, saved on disconnect + any other profile save; `welcome` carries
  it and the client snaps to it — works cross-device). Fresh characters spawn
  at (0, 9).
- Trading not built yet — Chronicle `owners[]` ledger is ready for it.
