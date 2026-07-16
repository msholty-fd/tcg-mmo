---
name: new-card
description: Design, build, verify, and merge ONE new card (or a small cycle of 2–3 related cards) for Emberwood Online — definition, family/faction, pixel art, circulation path, balance sims, full test bar. Use this whenever Michael asks to add a card, create a new card, design a spell/creature/reaction, give a duelist a signature card, or expand a set — even if he only describes the effect ("a card that heals when…"). Also usable mid-worldbuilding when an iteration needs a card.
---

# New card

One invocation = one card (or one small cycle of 2–3 that share a
mechanic) taken all the way: design → register → art → circulation →
verify → merge → record. A card that ships half-integrated is worse than
no card — artless faces, unobtainable ids, or an untested effect all
degrade the realm quietly. The checklist below exists because every row
on it has a failure mode.

**Hard boundaries (same as everything in this repo):**
- Never `fly deploy`, `fly ssh`, or `git push`. Agents merge; Michael
  deploys. End with a STATUS.md "deploy pending" entry.
- Never merge with a failing build or a test-suite count below main's
  baseline.
- The server stays authoritative — cards reach players only through
  server-side minting (duelist rewards, packs, quests, trades).

## Step 0 — Required reading

1. `.claude/LORE.md` — mandatory before writing any card name or flavor
   line. Voice: cozy-melancholy folk-tale, wry, concrete, understated.
   Never dump the founding myth into flavor text. House flavor style is
   one short dry sentence ("All tusk, no plan." / "Turnip enthusiast.").
2. `.claude/DESIGN.md` — "Card-game direction" (the fixed TCG spine, the
   no-priority-stack decision, reactions as THE counterplay surface) and
   the card-budget notes in recent worldbuilding iteration entries —
   signature cards and reward slots get claimed there; check before
   claiming one.
3. `.claude/MODEL_GUIDE.md` — find your tier. Data-only cards using
   existing effect primitives are the safe lane; a new effect primitive
   or engine keyword is frontier-tier engine work. Picking a smaller
   design is always acceptable.
4. `.claude/VERIFICATION.md` §1–§2 — read before claiming any check ran.

## Step 1 — Design

Answer these in order; each constrains the next:

- **Why this card?** What deck, matchup, or story wants it. A card with
  no home is filler — if Michael gave a concept, honor it; if not,
  survey: which family is thinnest, which mechanic (reactions,
  relics, abilities, additionalCost) is underused at which cost slot.
- **Family → faction.** Cards have no faction field; faction resolves
  card → family (`shared/sets/core/families.js` FAMILIES) →
  `FACTION_OF_FAMILY` (`shared/factions.js`). Assign exactly one family.
  No family / unmapped family = neutral: buildable by anyone, earns no
  standing, never rank-gated — a valid choice, but make it deliberately.
- **Rarity.** `common | uncommon | rare` only. Rarity IS the faction
  rank gate (Stranger/Known/Trusted) and the pack weight — it's a
  progression decision, not just a collectability one.
- **Type.** `creature | spell | relic | reaction | enchantment |
  equipment`. Reactions (`reaction: { on, effects }`, face-down,
  auto-fire) are the counterplay surface — prefer one when the design
  is "punish X".
- **Mechanics stay inside the existing palette** unless Michael has
  explicitly green-lit engine work:
  - Effect primitives (`shared/engine/effects.js`): damage, heal, draw,
    buff, grantKeyword, refresh, summon, emberGain, counter, exhume,
    graveBuff, resetKindle, discard, summonRandom.
  - Keywords (wired in `shared/engine/engine.js`): ambush, guardian,
    ward, frenzy, lifesteal, piercing. Plus `storiedKeyword` (gained at
    Chronicle Storied), `additionalCost: { discard: n }`, `ability`
    (activated, once/turn), `nocturnal` (night stat bonus).
  - Triggers: onPlay, onDeath, startOfTurn, endOfTurn, onAttack,
    onKindle, onAllySummon, onAllyDeath.
  A new primitive via `registerEffect()` is possible but is a different
  tier and needs sims of every card that will use it.
- **Cost/stats: anchor to a neighbor.** Find the closest existing card
  at the same cost and price the delta. When in doubt, cost it one high —
  a slightly weak card is a texture; a slightly strong one warps every
  deck.
- **Id**: snake_case, globally unique across all sets (`registerCards`
  throws on duplicates). Zone sets prefix (`ep_`, `dw_`); core doesn't.
  Signature cards use the bare duelist name.

## Step 2 — Build (in a worktree)

Use **EnterWorktree** on a `feat/card-<id>` branch (branch from local
main, not origin/main — this repo never pushes). If you're already
inside a feature worktree (e.g. mid-worldbuilding iteration), build in
place — don't nest.

The integration checklist. Rows 1–3 are every card; the rest as flagged:

| # | File | When |
|---|---|---|
| 1 | `shared/sets/core/cards.js` (or the zone set) — the definition in `registerCards([...])` | Always |
| 2 | `shared/sets/core/families.js` — add the id to its family's `cardIds` | Always (deliberate-neutral cards may skip) |
| 3 | `client/src/pixelArt.js` CARD_ART | Always. Missing entry → artless card face (graceful but ugly). Reuse a sprite family with a palette swap where possible; new 16×16 grids only when no family fits. Check the taken-accent-color comments before picking a palette. **No emoji — ever.** |
| 4 | Circulation (Step 3) | Always |
| 5 | `shared/sets/core/leaders.js` + banner rules | Only if the card is a Leader — and Leaders are a big deal (deck identity + rank+1 gate); don't make one casually |
| 6 | `shared/engine/effects.js` / `engine.js` | Only for green-lit new mechanics |
| 7 | `STARTER_DECKS` / `STARTER_POOL` in cards.js | **Don't touch** unless the task IS a starter rebalance — starter cards become ALWAYS_OPEN (rank 0) and every duelist deck is a `swap()` on a starter, so edits ripple everywhere |

Write `flavor` for every card — vanilla cards render it as their face
text (`def.text || def.flavor`), so a missing flavor line is a blank
card.

## Step 3 — Circulation

Decide how players GET the card, and say so in the DESIGN.md entry:

- **Packs — automatic.** `rollPack()` pulls every registered card of the
  pack's set at its rarity; a registered core card is in the Boarlands
  pack the moment it exists. This is the floor, not a plan.
- **Duelist reward pool** (`rewards` in `shared/sets/core/duelists.js`)
  — the story-carrying path. Precedent rule: route-trainer rewards stay
  common/uncommon, never Leaders or rares (chase cards are the faction
  gate's job).
- **Duelist deck swap** — the card only appears in NPC *play* if swapped
  into some duelist's `deck` (`swap(STARTER_DECKS.x, [outs], [ins])`).
  A card no NPC plays is invisible until someone opens it in a pack;
  give it at least one table to appear on when it fits a duelist's
  character. Comment the swap like the precedents do.
- **Quest collect** (`shared/quests.js` `collect: { cardId, need }`) —
  optional narrative hook.

## Step 4 — Verify

Baseline the four suites on main FIRST, then on the branch — a count
below baseline means you broke an invariant:

- `npm run build` + `node --check` on every changed shared/server file.
- `node scripts/test-packs.mjs` (baseline ~6653), `node
  scripts/test-leaders.mjs` (~198), `node scripts/test-factions.mjs`
  (~399) — touching `shared/sets/` means all of them.
- `node scripts/sim-starters.mjs` — must be **byte-identical** to main's
  output if you didn't touch starter cards; if you did, run before AND
  after and report the spread against the ~60/52/47 band.
- **Headless sims of the card in play** (VERIFICATION.md §2): build a
  plausible deck containing 2–3 copies, run 20+ seeded games vs each
  starter via `createDuel` + `ai.takeTurn` (cap 200 turns; `night: true`
  if nocturnal). Report win spreads and stuck-game count — `winner ===
  null` games are a red flag that the effect loops or stalls.
- If you changed a duelist deck: the full duelist bar from the
  /worldbuilding skill Step 4 (500-game sims, roster integrity, raw-WS
  challenge e2e).
- Eyeball the art: `artFor('<id>')` in a dev build, or at minimum
  confirm the CARD_ART entry references a real sprite name.

## Step 5 — Record and merge

1. **DESIGN.md** — short entry: the card(s), why (the Step 1 rationale),
   cost anchor, circulation path, sim numbers, anything rejected.
2. **LORE.md** — only if the card introduces canon (a named person,
   place, or event).
3. **STATUS.md** — "MERGED, NOT DEPLOYED": what landed, what was
   verified (and what wasn't, honestly), DEPLOY PENDING. STATUS.md is
   gitignored by design — edit, never commit.

Commit shape: `Card: <Name> — one-line essence` with the design
rationale in the body. Merge to main `--no-ff`, build the merged
result, clean up the worktree, **stop** — no push, no deploy.
