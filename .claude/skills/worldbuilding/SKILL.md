---
name: worldbuilding
description: Run one Emberwood worldbuilding iteration — survey the realm, pick ONE addition (landmark, duelist, quest, NPC deepening, road, or zone phase), build it in a worktree, verify, merge, and record it. Use this whenever Michael asks to expand the world, keep the world growing, add a zone/landmark/NPC/place, or continue the worldbuilding loop — even if he doesn't say "iteration". Also the unit of work for the autonomous /loop worldbuilding task.
---

# Worldbuilding iteration

One invocation = one complete iteration: survey → pick ONE addition →
build in a worktree → verify → merge to main → record → stop. This is
iteration N+1 of a numbered series (check `git log --grep=worldbuilding`
for the last number). Fourteen-plus iterations of precedent exist; the
method below is distilled from them. When in doubt, the precedent entries
in DESIGN.md are the authority — read them, don't guess.

**Hard boundaries (same as everything in this repo):**
- Never `fly deploy`, `fly ssh`, or `git push`. Agents merge; Michael
  deploys. End the iteration with a STATUS.md "deploy pending" entry.
- Never merge with a failing build.
- The world stays ONE seamless scene — no instanced/portal zones, ever.
- The server stays authoritative for all progression.

## Step 0 — Required reading (before any creative decision)

1. `.claude/LORE.md` — mandatory before writing ANY quest text, NPC
   dialogue, or card flavor. Especially "Voice & tone", "Who knows what",
   and "Rules for future worldbuilding iterations" (relationship-to-fire,
   knowledge levels, the seed-first/pay-off-later door pattern).
2. The **last 3–4 iteration entries** in `.claude/DESIGN.md` (search
   "worldbuilding loop iteration"). These carry the live state: what just
   landed, what was rejected and why, and the seeded ledger.
3. `.claude/STATUS.md` — the standing-task section and recent entries;
   note which files parallel sessions currently own (a module a parallel
   session owns is off-limits this iteration — the Bee Meads deliberately
   skipped an hour-gating hook because a parallel session owned main.js).
   Note STATUS.md is **gitignored by design** — you edit it but never
   commit it; don't fight the gitignore refusal.
4. `.claude/MODEL_GUIDE.md` — find your tier. The landmark lane (G5) is
   the proven cheap-model lane; zone card sets and engine work are not.
   Stay in your tier; picking a smaller shape is always acceptable.
5. `git worktree list` — check fresh, don't trust prior "no one active"
   notes. Distinguish **live** from **abandoned** worktrees: locked, or
   claimed by a STATUS.md entry, or recently modified = live session,
   hands off its files. Unlocked + uncommitted + idle for hours + no
   STATUS entry = abandoned — build fresh yourself (don't adopt its
   diff), flag it in STATUS.md for Michael's cleanup, and never delete it
   yourself.

## Step 1 — Survey

**Ledger first.** The seeded ledger is distributed through DESIGN.md
iteration entries as "Seeded for later:" lines and named-but-unopened
doors. Collect the open entries and ask which is *ripest*: an entry is
ripe when its written condition fired or its deferral reasons expired
(e.g. "a meads duelist once the meads has content" ripened when the road
reached them). A ripe ledger entry beats a novel idea — the realm staging
things in advance and paying them off is the loop's signature move.

Ripeness timing, stated numerically so it isn't re-litigated each time:
**next-iteration payoff is allowed when the seed named the follow-up
explicitly** (honey run: seeded at 10, shipped at 11; quarry duelist:
seeded at 14, shipped at 15). Seeds with only an implied or conditional
follow-up wait for their condition (pond duelist: seeded 6, ripened 8;
meads duelist: seeded 7, ripened 10). Don't pay off the same place two
iterations running unless the seed says to.

**If nothing is ripe**, run the two-axis survey the precedents use:
- **Map**: find the biggest unclaimed stretch. Zones live in
  `client/src/constants.js` CAMPS (center + radius); scan for the largest
  gap. Keep circle spacing precedent-consistent (~9-unit gap between zone
  edges, like Pell's Pond ↔ Red-Sash).
- **Archetype**: find what the realm doesn't have. The food/craft economy
  names its members (farm/flock/fish/trade/honey/stone…); a missing
  archetype that the map gap can host is the strongest pick.

**Record every candidate you reject and why** — rejections go in the
DESIGN.md entry verbatim and become future ledger material. Respect
reserved threads: memory-without-fire is Hessa's, Act staging areas stay
sparse, the Going-Out's cause is never explained.

## Step 2 — Pick the tier

One addition, sized deliberately. The proven tiers, with precedents:

| Tier | Precedent | Touches | Extra verification |
|---|---|---|---|
| **Landmark** (world module + flavour NPC, card-free) | Wether Downs, Pell's Pond, Bee Meads, Hobb's Quarry | `client/src/world/<name>.js`, constants.js CAMPS, wilds.js, world.js, LORE.md | build + node --check only |
| **Zone duelist** (route-trainer) | Tolly, Dace, Wick, Nell, Hew | duelists.js, zone module, LORE.md | full duelist bar — see Step 4 |
| **Quest** | The Honey Run | shared/quests.js (prefer generic shapes: zero client/server code) | headless quest-gate + raw-WS e2e |
| **Deepening** (existing duelist/NPC, no new place) | Old Hessa, A Footpad, Gruk | duelists.js, cards.js, LORE.md | sims before/after |
| **Road/waystones** | West Road, Bee Meads spur | roads module, world modules | build + visual check if possible |
| **Full zone (phased)** | Emberpeaks, Deep Darkwood | see MODEL_GUIDE.md "zone playbook" | per-phase; ONE phase per iteration |

**The downs rule** (verbatim from precedent): a flavour landmark earns a
route when it earns content — don't build roads to places with nothing to
do, and don't give a new landmark a duelist in the same iteration. Seed
it instead. Small iterations that pay off prior seeds beat big ones.

## Step 3 — Build (in a worktree)

Use **EnterWorktree** on a `feat/<name>` branch; run `npm install`
there. One worktree = one branch = one iteration. Two known traps:
- **Branch from local main, not origin/main** — EnterWorktree's default
  base is origin/main, which lags (this repo never pushes; see
  VERIFICATION.md §7). Verify your branch point includes the latest
  local merges.
- **Subagents with a pinned cwd can't use EnterWorktree.** The working
  fallback: `git worktree add .claude/worktrees/<name> -b feat/<name>
  main`, then work by absolute paths into the worktree.

**Places** (`client/src/world/<name>.js`):
- **Siting**: numeric `groundH` scan for the flattest disc of the needed
  radius — zero terrain edits, ever (the Pell's Pond technique; reused by
  every landmark since). Record center/radius/max-deviation in DESIGN.md.
- Register the zone in constants.js CAMPS (center, radius, label) and a
  wilds.js CLEARINGS entry so random pines stay out.
- Every solid prop registers in `client/src/colliders.js` (circles for
  round things, rotated rects for buildings) or it's walk-through. Huts
  follow the Wether-Downs pattern (rect collider + camera occluder).
- Campfires: use `campfire()` from lib.js AND make sure the module's
  fires are registered in `fires[]` (world.js) — unregistered flames
  don't animate (this was a real shipped bug, fixed in 0992af6).
- Decide the zone's **relationship to the fire** (LORE.md rule): tended /
  cold / unbound / fireless-by-nature. Let it shape the props.
- New geometry gets its own palette so it reads as itself, not "more
  forest" (Hollowmere's desaturated swamp; Pell's living-water slate).
- Module-local critters follow the single-region rule — don't touch
  entities.js for one zone's ambience.

**NPCs**: assign a knowledge level from LORE.md "Who knows what" (most
new NPCs are "superstition and small omens"). ~6 lines: tie the local
craft into the economy (the Harrow/Wynn/Pell read), one cross-NPC or
cross-zone texture line, and 1–2 gently **seeded doors** — named,
unexplained hooks for future iterations (the emptied hive; who dug the
pond). Never open a door in the same iteration you name it.

**Duelists**: pick an existing base deck, make a ~2-card swap that
expresses the character, add a reward extra. **Reward extras stay
common/uncommon and are never Leaders or rares** — route trainers hand
out the dire_wolf…roadblock band, not chase cards (every precedent
extra follows this; a Leader here breaks the faction-rank gate's
purpose). Check the card-budget notes in recent DESIGN.md entries before
claiming signature cards. Roster lives in `shared/sets/core/duelists.js`
(shared client/server).

**Quests**: prefer objective shapes that already generalize (visit,
collect, duels) so the change is data-only in `shared/quests.js`. A new
objective shape is Y4 in MODEL_GUIDE.md — different tier, different
iteration.

**Cards/art**: new cards need a `client/src/pixelArt.js` CARD_ART entry —
reuse a sprite family with a palette swap where possible. No emoji.

## Step 4 — Verify

Always: `npm run build` + `node --check` on changed server/shared files.
Then by tier (exact commands in `.claude/VERIFICATION.md` — read it
before claiming any check ran):
- Duelist/card changes — the full bar (the Nell/Hew STATUS.md entries
  are the worked examples): balance sims (500 games/side vs each
  starter; report spreads and stuck-game count; sim rejected variants
  too); `node scripts/sim-starters.mjs` to confirm the starter spread is
  untouched (byte-identical if you changed no starter cards); roster
  integrity (count, deck size 30, no missing card ids); raw-WS e2e of
  the challenge flow on a throwaway server, including refusal paths
  (bogus npc id, duel-while-in-room); dev-rig spawn check (NPC in-scene
  with badge, no console errors).
- Quests: headless quest-gate assertions + raw-WS e2e on a throwaway
  server (PORT/DB_FILE), covering the refusal paths (prereq, minLvl,
  early turn-in, radius) not just the happy path.
- Live checks: the dev rig (`node scripts/dev-rig.mjs`). If the rAF-stall
  gotcha blocks visual verification, fall back to headless checks and
  **say so honestly** in STATUS.md — never claim a check that didn't run.

## Step 5 — Record and merge

Three documents, then the merge:

1. **DESIGN.md** — append an iteration entry matching the precedent
   shape: what and why (map gap + archetype), tier and its precedent,
   siting numbers, the interesting build decisions, **rejected this
   survey** (each with the reason), and **seeded for later** (the ledger
   deposits). This entry IS the loop's memory — the next iteration is
   only as good as what you record here.
2. **LORE.md** — new NPC into "Who knows what"; any new canon.
3. **STATUS.md** — a "MERGED, NOT DEPLOYED" entry: what landed, what was
   verified (and what wasn't, honestly), schema notes, "DEPLOY PENDING".

Commit message shape: `Name: one-line essence (worldbuilding iteration
N)` with a body giving the survey rationale — the git log doubles as the
realm's chronicle, so write it like the precedents.

Merge to main with `--no-ff` (serially if other branches are ready),
build the merged result, clean up the worktree, and **stop** — no push,
no deploy.

## Step 6 — If running as a loop

When invoked under the autonomous /loop standing task (see STATUS.md
"Standing task: autonomous worldbuilding loop"), schedule the next
iteration and keep going without re-asking — unless you hit a decision
that's genuinely Michael's to make (new mechanics, schema changes,
anything DESIGN.md marks as needing a green light). Deploying is never
yours regardless of mode.
