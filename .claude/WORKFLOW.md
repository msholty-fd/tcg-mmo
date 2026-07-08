# Emberwood Online — Agent Workflow (worktrees → merge → deploy)

This is the standard working style for agents in this repo. The short version:
**do feature work in a git worktree on a branch, verify it, merge to main,
deploy to Fly.io, verify the live realm.** Main is the source of truth and
main is what production runs — treat merging as deploying.

## 1. Start work in a worktree

Never do feature work directly on `main` in the primary checkout
(`~/dev/emberwood-online`). Create a sibling worktree per task:

```bash
git worktree add ../emberwood-<short-name> -b feat/<short-name>
cd ../emberwood-<short-name>
npm install        # node_modules is gitignored; every new worktree needs this
```

Conventions:
- One worktree = one branch = one agent/task. A branch can only be checked
  out in one worktree, which is the isolation guarantee — don't share.
- Branch names: `feat/…`, `fix/…`, `balance/…`.
- The primary checkout stays on `main` and is the only place that runs the
  live dev servers and performs merges/deploys.

Worktree limitations (by design — plan around them):
- **No dev servers**: ports 8081 (WS server) and 5175 (Vite) are taken by the
  primary checkout. Verify with headless tools instead (see §2). If you truly
  need a live server, use `PORT=<other> node server/index.js` and
  `VITE_WS_URL` — don't fight over the default ports.
- **No player data**: `server/profiles.json` is gitignored, so a worktree
  server starts empty. Copy the file from the primary checkout if a test
  needs existing accounts.
- **No STATUS.md**: `.claude/STATUS.md` is gitignored (local-only). Read it
  from the primary checkout if you need session context.

## 2. Verify before merging (required gates)

All of these must pass in the worktree before a merge:

1. `npm run build` — the client must build clean (a broken build would take
   the realm down on deploy, since the server serves `client/dist`).
2. `node server/index.js` starts without error on a spare port
   (`PORT=8090 DATA_FILE=/tmp/wt-profiles.json node server/index.js`, check
   `/health` returns 200, then kill it) — required if you touched `server/`
   or `shared/`.
3. **Headless balance sim** if you touched `shared/engine/` or
   `shared/sets/`: run createDuel + `ai.takeTurn` loops (~20 games), check
   winner spread and that no game hangs.
4. Commit everything on the branch; `git status` clean.

If a gate fails, fix it in the worktree. Do not merge red.

## 3. Merge to main

From the **primary checkout** (`~/dev/emberwood-online`):

```bash
git status                      # must be clean; stash/commit anything stray
git merge --no-ff feat/<name>
```

- If the merge conflicts, rebase the feature branch onto main inside its
  worktree, re-run the §2 gates, then merge again. Never resolve conflicts
  by guessing on main.
- If several agents finish around the same time, merge **serially**: merge
  one, run the §2 build gate on main, deploy, then merge the next. Parallel
  work, serial integration.

## 4. Deploy to Fly.io (automatic after every merge)

Every merge to main deploys. From the primary checkout:

```bash
# 1. Backup player data first if the change touches server/ or the profile
#    schema (skip for pure client/balance changes):
fly ssh sftp get /data/profiles.json ./profiles.backup.$(date +%Y%m%d-%H%M).json

# 2. Final gate on the merged result:
npm run build

# 3. Deploy (app: tcg-mmo, region sjc):
fly deploy

# 4. Verify the live realm:
curl -fsS https://tcg-mmo.fly.dev/health     # must return 200
#    then load https://tcg-mmo.fly.dev and confirm a wss:// join succeeds
#    (or at minimum watch `fly logs` for a clean boot, no restart loop).

# 5. Push main to GitHub (public repo msholty-fd/tcg-mmo):
git push origin main

# 6. Clean up:
git worktree remove ../emberwood-<short-name>
git branch -d feat/<name>
```

Deploy rules (hard-won — see DEPLOYMENT.md post-mortem):
- **Never** let tooling rewrite `fly.toml` or the Dockerfile port settings.
  Production is port **8080** everywhere (fly.toml `PORT`/`internal_port`,
  Dockerfile `EXPOSE`); local dev stays 8081. All port signals must agree.
- **Never** click Fly dashboard "merge new files" banners or merge
  `flyio-new-files` — main is the source of truth.
- If `fly deploy` fails or `/health` doesn't come back: `fly logs` to
  diagnose. A bad release means the realm is down for everyone — fixing
  forward or reverting the merge commit (`git revert -m 1 <merge>` +
  redeploy) takes priority over all other work.
- Deploys restart the machine: connected players get disconnected and
  reconnect (60s duel grace covers active duels). Profiles flush on SIGINT.
  Prefer batching several merged features into one deploy window over many
  back-to-back deploys.

## 5. After deploying

- Update `.claude/STATUS.md` (primary checkout) with what shipped and any
  follow-ups, and DEPLOYMENT.md / DESIGN.md if the change affects them.
- Record the verification you actually ran (sim results, health check) —
  don't claim checks you skipped.
