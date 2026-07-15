# Emberwood Online — Verification Cookbook

Written 2026-07-14 by a Fable-tier session, distilling the recipes that
actually worked across ~20 merges (2026-07-08 → 07-14). Companion to
MODEL_GUIDE.md's "verification menu": that file tells you *which* check a
task needs; this file tells you *exactly how to run it*. Every recipe here
has shipped at least one real merge.

Two principles:

1. **Cheapest check that answers the question.** A headless sim answers a
   balance question in seconds; don't open a browser for it. Conversely, a
   new UI surface needs at least one real screenshot — a passing build
   proves nothing about layout.
2. **Record honestly in STATUS.md**: what ran, what was skipped, and why.
   "NOT verified: X (reason) — worth a post-deploy look" is the established
   format and it is *good* — every recent entry has one. A claimed check
   that didn't run is the one unforgivable sin.

---

## 1. The standing suites (run these, always)

All headless, all fast, all from the repo root. **Run them on `main` first
to get the baseline, then on your branch — the DIFF is the signal, not the
absolute count** (counts grow as content lands; the numbers below are the
2026-07-14 baseline and WILL go stale).

| Command | Covers | Baseline (2026-07-14) |
|---|---|---|
| `npm run build` | client imports/parse — required gate | clean |
| `git diff main --name-only -- 'server/*.js' 'shared/**/*.js' \| xargs -r -n1 node --check` | server/shared syntax — required gate | clean |
| `node scripts/test-packs.mjs` | pack registries, rarity rolls, the packs.js↔world vendor-coord invariant | 6653/6653 |
| `node scripts/test-leaders.mjs` | banners, Leaders, deck-rule mirrors of server `validDeck` | 198/198 |
| `node scripts/test-factions.mjs` | card→faction map, ranks, gate+vouch, standing earn math | 399/399 |
| `node scripts/sim-starters.mjs` | starter round-robin winrates (arg = games/side, default 100) | ~60/52/47 |

When required:
- Touched `shared/sets/` or `shared/engine/` → all four scripts.
- Touched cards in the starter pools → `sim-starters.mjs` before AND after,
  report both spreads (target band is the documented 60/52/47 — wardens
  reads low on purpose; the greedy AI undervalues defense).
- Touched world spawns/vendors → `test-packs.mjs` (it reads
  `client/src/world/*.js` as text for vendor coords).
- Anything else → the two required gates at minimum.

**If a suite count DROPS below main's baseline, your branch broke an
invariant — even if your feature "works".** A count that catches you by
surprise has already caught a real bug once (see §7, stale-origin gotcha).

## 2. Headless duel sims (balance, stuck-game, crash checks)

The engine is pure shared code, so Node plays full games in milliseconds:

```js
// node --input-type=module -e '...' or a scratch .mjs in the scratchpad
import '../shared/sets/core/cards.js';        // register the sets you need
import { createDuel } from '../shared/engine/state.js';
import { startTurn } from '../shared/engine/engine.js';
import { takeTurn } from '../shared/engine/ai.js';

const duel = createDuel([...deckA], [...deckB], { seed: 42 /*, night: true*/ });
startTurn(duel);
let turns = 0;
while (duel.winner === null && ++turns < 200) takeTurn(duel, duel.active);
// duel.winner === null after 200 turns ⇒ STUCK GAME — always report these
```

`scripts/sim-starters.mjs` is the worked example — copy its loop. 20+ games
per matchup minimum; check winner spread, zero stuck games, zero throws.
Seed the rng for reproducibility. `night: true` exercises nocturnal cards.

## 3. Headless quest-gate checks

Fake profile objects against `shared/quests.js` — no server, no browser:
permute `canAccept`/`canTurnin`/progress functions across prereq/level/
progress states (~14 assertions is the established pattern; grep STATUS.md
history for "quest-gate"). Required for any quest definition change; a new
objective *shape* additionally needs the server progress event tested (§4).

## 4. Raw-WS end-to-end (the server-authority check)

The single most valuable recipe here: exercise the REAL server handler with
a throwaway server + throwaway DB. This is how minting, shops, trading,
standing, appearance, and quest progress were all verified.

```bash
# throwaway server: alt port, temp DB (both env vars are honored)
PORT=8099 DB_FILE=$TMPDIR/test-profiles.db node server/index.js &
```

Then drive it from Node or a browser eval with a plain WebSocket:

```js
const ws = new WebSocket('ws://localhost:8099');
// join/create → act → assert on the server's replies; open a SECOND socket
// to be "the other player" for trade/PvP/presence assertions.
```

Rules of the recipe:
- **Never point a test server at the real `server/profiles.db`.** `DB_FILE`
  into the scratchpad, delete after. Name test chars `SomethingTester` so a
  stray one is recognizable if it ever leaks.
- Assert the *negative* cases too — that's the whole point of server
  authority: far-away buy dropped, 0-coin buy refused, over-rank deck save
  rejected. A handler that only passes happy-path is unverified.
- Kill the server with SIGINT (profiles flush on it), then confirm
  persistence by restarting against the same temp DB where relevant.

## 5. Live-verifying a WORKTREE build (alt-port rig)

**Use the dev rig first (2026-07-14)** — it replaces the whole
mint-char → stop-server → edit-sqlite → restart → hand-write-localStorage
dance with one command:

```bash
# in the worktree — starts WS server (:8082, scratch DB, DEV_SEED=1) +
# Vite (:5176), mints + seeds a character, prints token + login snippet:
node scripts/dev-rig.mjs --fresh --name Fit \
  --standing wardens=300,redsash=40 --coins 250 --xp 800 \
  --cards weir,sentinel --appearance back=ward_mantle
# then in the browser (dev builds install window.__test):
#   __test.loginAs('<token>', 'Fit')       — stores token+session, reloads
#   __test.state()                          — name/lvl/coins/factions/appearance/pos
#   __test.key('KeyO')                      — real KeyboardEvent WITH e.code
#                                             (browser-pane synthetic keys lack
#                                             e.code and every hotkey gates on it)
#   __test.click/hover/unhover('<selector>')— real bubbling pointer events
#   __test.renderWorld() / .wardrobeFrame() — manual frames under the rAF stall
```

- Re-running with the same `--name` logs in instead of failing (idempotent);
  `--seed-only` seeds against already-running rig servers; `--fresh` wipes
  the scratch DB (`server/profiles.dev-rig.db` — never the real dev DB).
- The rig fails fast if the ports are already served — zombie servers from a
  crashed session silently run OLD code; kill them, don't reuse them.
- **Security posture**: `devSeed` is triple-gated (the `DEV_SEED=1` env var
  only the rig sets — deploys set nothing; loopback-only; self-profile-only)
  and `window.__test` lives behind `if (import.meta.env.DEV)` so it is
  statically eliminated from production bundles. **The merge gate greps the
  built bundle**: `npm run build && grep -rc "__test\|devSeed" client/dist/assets/*.js`
  must return 0 hits for any change touching devHooks.js or the dev-gated
  import in main.js.

Manual fallback (pre-rig recipe, still valid for odd cases):

```bash
# in the worktree:
PORT=8084 DB_FILE=$TMPDIR/wt-profiles.db node server/index.js &
echo 'VITE_WS_URL=ws://localhost:8084' > client/.env.local
npx vite --port 5178   # or a temp launch.json entry for the preview pane
```

- `client/.env.local` is gitignored (since 2026-07-14 — it nearly rode into
  a commit once). Still run `git status` before merging; delete it and any
  temp launch.json entry when done.
- **Check what ports parallel sessions hold first** (`git worktree list`,
  `lsof -i :5176 -i :8082` etc.). A stray test char once landed in another
  session's temp DB because two rigs shared a port. Pick fresh ports.

## 6. Browser verification under the rAF stall

The preview tab often comes up with `document.hidden === true`
(CLAUDE.md gotcha): `requestAnimationFrame` is fully suspended, so the game
loop is dead — movement and animation are untestable. **Diagnose before
debugging anything else**: read a per-frame value twice ~1s apart, e.g.
`(await import('/src/world.js')).fires[0].userData.fire.scale.y` — if it
didn't change, it's the stall, not your code.

What still WORKS during the stall (all proven):
- JS eval, module imports, DOM reads/writes, CSS, and live WebSockets.
- **`computer screenshot` forces a one-off paint** — HUD windows and
  overlays opened via eval DO appear in screenshots.
- **Manual render for world shots**: call `renderer.render(scene, camera)`
  from an eval, then screenshot — this produced real eyeballed views of
  whole zones (position the camera by setting its transform first).
- Real bubbling clicks (`el.click()` or computer click) — required for UI
  verification; driving handlers directly has missed a real bug before.
- Token auto-login: mint a char over raw WS (§4), then in the app tab set
  `localStorage['emberwood.token']` and `localStorage['emberwood.session']`
  — the session value must be the **JSON blob** the client writes, not a
  bare flag — and reload.

What does NOT work: anything needing the loop (walking, patrols, critters,
camera follow, walk-in atmosphere). Don't rabbit-hole; verify the logic
headlessly, screenshot what you can, and write "NOT verified: the in-motion
feel (rAF stall) — worth 30s post-deploy" in STATUS.md. Every recent entry
does exactly this.

## 7. Cross-cutting gotchas

- **Stale-origin worktrees**: a worktree branched from `origin/main` (not
  local `main`) will silently miss unpushed merges — Michael pushes GitHub
  manually, so origin LAGS. Symptom: suite counts below baseline. Fix:
  `git rebase main` in the worktree, re-run all gates. Check
  `git merge-base --is-ancestor main HEAD` right after creating the branch.
- **Vite HMR vs evals**: `import('/src/x.js')` in a preview eval can get a
  DIFFERENT module instance than the app after HMR (`?t=` versioning).
  Restart Vite before evals that poke module state, or assert via DOM /
  localStorage instead.
- **The 10 Hz state broadcast overrides `setGameHour()`** within ~100ms
  when connected — test hour-gated content offline or against your own
  throwaway server where you control the clock.
- **A dead duel room drops all actions silently** (e.g. after a turn-timeout
  forfeit) while a reloaded client can still render a stale "Your turn."
  view — looks exactly like an input bug. Check room state first
  (MOBILE.md records the incident).
- **Merged-main re-verify**: after merging, re-run `npm run build` and the
  relevant suites ON MAIN — two green branches can merge into a red main.
