# Emberwood Online

An open-world MMO card game: walk a 3D world, challenge NPCs and real players
to card duels, collect card *instances* that accrue history and power.

## Run locally

```
npm install
npm run server   # WS game server + static client + /health on :8081
npm run dev      # Vite dev client on :5175 (talks to the server on :8081)
```

Or the production shape in one step: `npm start` (builds the client, then the
server serves it on :8081).

## Deploy (Fly.io)

```
fly apps create tcg-mmo
fly volumes create emberwood_data --region sjc --size 1
fly deploy
```

Player data lives in a single JSON file on the mounted volume
(`DATA_FILE=/data/profiles.json`). Fly terminates TLS; the client connects to
`wss://` on its own origin automatically.

## Docs

- `CLAUDE.md` — architecture rules, key files, testing patterns
- `.claude/DESIGN.md` — vision, design pillars, decision log
- `.claude/DEPLOYMENT.md` — deployment checklist and ship plan
