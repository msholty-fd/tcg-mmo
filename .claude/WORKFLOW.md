# Emberwood Online — Agent Workflow (worktrees → merge → deploy)

This is the standard working style for agents in this repo. The short version:
**do feature work in a git worktree on a branch, verify it, merge to main,
note the pending deploy in STATUS.md — and stop.** Main is the source of
truth; **deploys and GitHub pushes are Michael's, done manually** (§4).

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
- **No player data**: `server/profiles.db` is gitignored, so a worktree
  server starts empty. Copy the file from the primary checkout if a test
  needs existing accounts.
- **No STATUS.md**: `.claude/STATUS.md` is gitignored (local-only). Read it
  from the primary checkout if you need session context.

## 2. Verify before merging (required gates)

> **Release posture (decided 2026-07-08): tight loop.** While the realm has
> no real player base, gates are deliberately light — build + syntax checks
> only — so features ship fast. Once real users arrive, revisit this section:
> release more intentionally (batched deploy windows, boot-test the server,
> run balance sims as blocking gates, consider a staging app).

Required, in the worktree:

1. `npm run build` — the client must build clean (a broken build would take
   the realm down on deploy, since the server serves `client/dist`).
2. `node --check` on any changed `server/` or `shared/` files — the Vite
   build never loads `server/`, so this is the only pre-deploy catch for a
   syntax error that would crash the realm on boot:
   ```bash
   git diff main --name-only -- 'server/*.js' 'shared/**/*.js' \
     | xargs -r -n1 node --check
   ```
3. Commit everything on the branch; `git status` clean.

Recommended but not blocking: a quick headless balance sim (createDuel +
`ai.takeTurn`, ~20 games) when you touched `shared/engine/` or
`shared/sets/`; note the result in your handoff either way.

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
  one, run the §2 build gate on main, then merge the next. Parallel work,
  serial integration.
- After merging, run `npm run build` once on the merged result, clean up
  the worktree, and update STATUS.md (§5). **An agent's job ends here.**

## 4. Deploy to Fly.io (MANUAL — Michael only, decided 2026-07-08)

**Agents do not deploy and do not push to GitHub.** Merging to main is the
end of agent work; Michael deploys manually when he chooses (deploys were
getting auto-triggered by every merge, and prod pushes deserve a human on
the button). Agents: note "deploy pending" in STATUS.md and stop — do not
run `fly deploy`, `fly ssh`, or `git push`, and do not ask to.

Michael's deploy checklist (from the primary checkout):

```bash
# 1. Backup player data first if the change touches server/ or the profile
#    schema (skip for pure client/balance changes):
fly ssh sftp get /data/profiles.db ./profiles.backup.$(date +%Y%m%d-%H%M).db

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
```

Worktree cleanup (agents may do this right after merging):

```bash
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

## 5. After merging

- Update `.claude/STATUS.md` (primary checkout) with what merged, that a
  deploy is pending, and any follow-ups; update DEPLOYMENT.md / DESIGN.md
  if the change affects them.
- Record the verification you actually ran (sim results, build gate) —
  don't claim checks you skipped.
- Flag anything the deploy needs to know (profile schema changes, required
  backups, migration behavior) in the STATUS.md entry.
