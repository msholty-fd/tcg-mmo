# Emberwood Online — Deployment Checklist

Status: **LIVE at https://tcg-mmo.fly.dev** (deployed 2026-07-07, Fly.io app
`tcg-mmo`, single machine in SJC, volume `emberwood_data` for profiles).
Verified: /health 200, client over HTTPS, wss:// join from outside.

## Ship plan (decided 2026-07-06)

One Node process is the whole stack: the game server also serves the built
client (`client/dist`) and a `/health` endpoint over HTTP on the same port the
WS runs on. Deploying = `npm run build`, run `server/index.js` behind any
TLS-terminating proxy (Fly.io / Railway / Caddy); the client connects to
`wss://` on its own origin, so no URL config is needed in production.

Env vars:
- `PORT` — listen port (default 8081)
- `ALLOWED_ORIGIN` — extra allowed WS origin, only needed if the client is
  hosted on a different domain (CDN) than the server
- `TRUST_PROXY` — set to 1 behind a reverse proxy so rate limiting keys on
  `X-Forwarded-For` instead of the proxy's IP

Dev is unchanged: Vite on :5175, server on :8081 (`import.meta.env.DEV`
selects the dev WS URL in `client/src/net.js`).

### Fly launch post-mortem (2026-07-07)

First UI-driven deploy (release v1) failed for two reasons:
1. **Trial plan** — machines stop after 5 min without a credit card on file
   (the app boots fine; the log shows a clean SIGINT flush). Card required.
2. **Port mismatch** — Fly's Launch wizard regenerates fly.toml and resets
   `internal_port` to 8080 (its Node default; it pushed its version to the
   `flyio-new-files` branch), so health checks probed 8080 while the app
   listened on 8081. Rather than fight the wizard forever, production now
   uses 8080: fly.toml sets `PORT=8080` + `internal_port=8080`. Local dev
   still defaults to 8081 (code default, unchanged).
3. **Second deploy leapfrog** — after the PORT=8080 fix, the wizard flipped
   `internal_port` to 8081, apparently reading `EXPOSE 8081` from the
   Dockerfile (app on 8080, checks on 8081 — inverted mismatch). Lesson:
   every port signal the wizard can read (fly.toml, Dockerfile EXPOSE) must
   agree. EXPOSE is now 8080 too.
4. **Fly's PR merge trap** — the dashboard's "merge new files" banner merged
   the `flyio-new-files` branch into main (PR #1), reverting internal_port
   to 8081 again. Don't click it; main is the source of truth. Resolved in
   63a0770, which deployed successfully — the realm went live 2026-07-07.
   (A throwaway `LiveCheck` profile from the verification exists in prod
   profiles.json — harmless; delete when admin tooling exists.)

### Repo & Fly.io (added 2026-07-07)

- GitHub: https://github.com/msholty-fd/tcg-mmo (**public** — `.gitignore`
  excludes `server/profiles.json` (player data + password hashes) and
  `.claude/STATUS.md` (contains the test account password; local-only)).
- `Dockerfile` builds the client and runs the server; `fly.toml` maps a
  volume to `/data` and sets `DATA_FILE=/data/profiles.json` (the server
  reads `DATA_FILE` env, defaulting to `server/profiles.json` for dev).
- First deploy:
  ```
  fly apps create tcg-mmo
  fly volumes create emberwood_data --region sjc --size 1   # match primary_region
  fly deploy
  ```
- Fly terminates TLS (client auto-uses wss:// same-origin), forwards
  X-Forwarded-For (`TRUST_PROXY=1` set in fly.toml), health-checks `/health`,
  and sends SIGINT on stop/migrate (server flushes profiles). Auto-stop is
  disabled — a sleeping game server would disconnect everyone.
- Backups: `fly volumes snapshots list <vol>` (automatic dailies) — plus copy
  `/data/profiles.json` off-box before risky changes (`fly ssh sftp get`).

## Security (blockers — do these before the server touches the internet)

- [x] **TLS / `wss://` (code side)** — the built client now connects to
      `wss://` on its own origin automatically (`client/src/net.js`, or
      `VITE_WS_URL` to override). The remaining half is operational: run the
      server behind a TLS-terminating proxy / platform at deploy time.
- [x] **Password hashing upgrade** — new passwords use scrypt (32-byte hash,
      16-byte random salt, `timingSafeEqual` compare). Legacy sha256 profiles
      verify against the old scheme and are rehashed to scrypt on their next
      successful login (Michael's profile migrated + verified 2026-07-06).
- [x] **Rate limiting** — per-IP wrong-password limit (8 per 10 min), per-
      connection message token bucket (25/s sustained, 50 burst → terminate),
      chat throttle (5 lines per 5 s).
- [x] **Input hardening pass** — positions clamped to the world disc (r=220;
      playable r=210), message size capped at 16 KiB at the socket layer.

## Stability & integrity (found in code review, 2026-07-06)

Gaps not covered by the original checklist; all live in `server/index.js` /
`server/duelRoom.js` and are small, contained fixes.

- [x] **Crash safety** — WS message handler wrapped in try/catch;
      `uncaughtException`/SIGINT/SIGTERM flush profiles synchronously before
      exit. One bad payload or timer throw no longer kills the realm or drops
      the debounce window.
- [x] **Atomic profile writes + safe load** — saves go to `profiles.json.tmp`
      then rename; the server refuses to start (exit 1) if the file exists but
      doesn't parse, instead of silently starting empty and overwriting
      everyone on the next save.
- [x] **WS heartbeat** — 30s ping sweep terminates sockets that miss a round;
      a new login now supersedes a lingering session (old connection gets a
      joinError and is terminated) instead of being locked out by its ghost.
- [x] **Challenge validation** — challenges are tracked server-side (20s TTL,
      swept with the heartbeat) and require ≤10 world-units proximity; `accept`
      only starts a duel if a live challenge exists. Forced-duel griefing
      verified rejected.
- [x] **PvP turn timer** — 90s idle turns auto-end (both players notified);
      3 consecutive timeouts forfeit. Also frees rooms abandoned mid-NPC-duel.
      (Timeout path verified by review, not end-to-end — it reuses the same
      forfeit/finish machinery as disconnects.)
- [x] **Payload cap** — `maxPayload: 16 KiB` on the WebSocketServer.
- [x] **Basic logging** — joins/leaves/kicks/message-handler errors now logged.
- [ ] **Protocol version** — no version field in `welcome`; client/server skew
      after a deploy fails confusingly. (Low priority.)
- [x] **HTTP health endpoint** — `/health` on the shared HTTP server the WSS
      is attached to; it also serves the static client.

## Infrastructure

- [ ] **Pick a host** — a single small Node process + one JSON file. Anything
      works: Fly.io / Railway / a $5 VPS. WebSocket support is the only hard
      requirement (rules out most serverless).
- [x] **Client hosting** — the game server now serves `client/dist` itself
      (plus `/health`); `npm start` = build + serve the full stack on one port.
      A CDN is still an option (set `ALLOWED_ORIGIN` + `VITE_WS_URL`).
- [x] **Server URL config** — same-origin `ws(s)://${location.host}` in
      production, `ws://hostname:8081` under Vite dev, `VITE_WS_URL` overrides.
- [ ] **Process supervision** — the server currently runs as a loose background
      process. Use systemd / the platform's supervisor so it restarts on crash.
- [x] **CORS/origin check** — browser WS connects are rejected (1008) unless
      the Origin host matches the server's host, is localhost, or equals
      `ALLOWED_ORIGIN`. Originless (non-browser) clients are allowed.

## Data

- [ ] **Persistence upgrade** — profiles live in `server/profiles.json`
      (debounced full-file rewrite). Fine for dozens of players; move to SQLite
      before it matters. Schema is simple: profiles keyed by token.
- [ ] **Backups** — whatever holds profiles is the players' collections and
      Chronicle histories. Snapshot it (even a cron `cp` to start).
- [ ] **Server-side session expiry** — tokens never expire. Decide on a policy
      (probably fine to leave for now).

## Game-readiness (non-blocking, but soon after)

- [ ] **Balance pass** — boarherd starter wins ~75% vs redsash in AI-vs-AI;
      rerun the headless simulation (see `shared/engine/ai.js` + createDuel)
      after any card changes.
- [ ] **Autobattle renown policy** — auto-wins currently earn full renown/XP;
      decide whether idle farming is a feature or needs a discount.
- [ ] **Reconnect polish** — duel grace period is 60s; world position resets to
      spawn on reconnect (only duels resume). Consider persisting position
      server-side.
- [ ] **NPC duel room leak check** — a player who walks away mid-NPC-duel holds
      the room until forfeit; verify timers clean up under load.

## Nice-to-have before inviting people

- [ ] Trading between players (the Chronicle `owners` ledger is ready for it)
- [ ] A second card set / zone to give the world more to chase
- [ ] Admin tooling: at minimum a way to inspect/delete a profile

## How it runs today (reference)

```
npm run server   # WS game server on :8081, profiles in server/profiles.json
npm run dev      # Vite client on :5175 (dev)
npm run build    # static client bundle in client/dist
```
