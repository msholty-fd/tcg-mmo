# Drafting — the world is the pack (brainstorm + plan)

Status: **BRAINSTORM, nothing decided.** When decisions land, migrate them to
DESIGN.md's decision log and keep this as the working doc for the epic.
Origin: Michael, 2026-07-16 — "you are constantly drafting to shape the world
around you," MTG-draft feel without needing 8 synchronous players.

## The core insight

MTG draft needs 8 seats because the *pack* is the shared depletable pool and
*passing* is the communication channel. Emberwood already has both, spatially:
**the world is the pack.** Cards are embers (LORE.md fact 3), embers live in
fires (fact 7), fires are scattered across one persistent shared world. If
fires hold draftable ember pools that players draw from and feed back into,
drafting needs no lobby — the pack passes itself: whoever visits the fire next
sees what the last drafter left behind. Asynchronous by construction.

What drafting is fun for, and how each maps here:
- **Constrained choice** — pick 1 of N from a fire's offering, not "buy anything"
- **Scarcity** — your pick deprives the next visitor
- **Signal reading** — inferring what others are doing from what's left behind
- **Every run different** — pools shift under everyone's collective play

## The mechanic catalog (least → most radical)

### 1. Hearth-drafting (acquisition layer)
Every tended fire holds a small pool of embers (3–5 visible offering). E at a
fire → see the offering → take one (coin cost and/or per-fire per-player daily
cooldown). Taken embers leave that fire's pool until replenished (see #2).
Could replace packs outright, or packs become "Marla pre-drafted a fire for
you, sight unseen" — sealed vs. draft, both diegetic.

### 2. Kindle feeds the pool (the influence loop) — the load-bearing idea
Kindle is already canonically "feeding a memory back to the fire" (LORE.md
fact 4). Make it literal: kindling a card in an online duel drifts that memory
into the nearest fire's draft pool. Consequences:
- What players **burn** shapes what others can **draft** nearby. Zone draft
  identity drifts with actual play.
- The per-turn resource decision becomes a world-shaping act — "constantly
  drafting to shape the world," even mid-duel.
- Closes the economy: duels are both the faucet's source and the sink's fuel.
- NPC duelists kindle too → pools replenish even at low population.
Open decision: do kindled cards add *anonymous fresh copies* to the pool, or
does only the Offering (see below) move real instances? (Leaning: normal
kindle seeds anonymous copies of the burned card id; Offering moves the real
instance. Keeps volume safe and makes the Offering special.)

### 3. Cold fires = drained pools (the myth made mechanical)
A fire fully drafted and never fed *dims*, then goes cold — and a cold fire
forgets: its zone temporarily loses something (its Field Effect, vendor
access, the duelist's better reward pool…). The Hunter's Rest cold firepit
stops being only a story beat; the Going-Out becomes a standing pressure
players collectively hold back by kindling. The mystery's CAUSE stays
unexplained (LORE.md rule) — this mechanizes the *symptom*.

### 4. Draft-shaped Field Effects
DESIGN.md already commits to per-zone Field Effects (2026-07-13 direction).
Instead of every zone's rule being permanently hand-authored, let a fire's
pool *composition* set or tint the local field: a fire fat with frenzy embers
→ duels in its radius get a frenzy-flavored standing rule. Your picks and
burns influence other people's *duels*, not just their shopping — and signal
reading gets a gameplay payoff ("someone's been forcing lifesteal here").

### 5. Hearth Draft — Winston draft as a 2-player duel format
Winston/Winchester draft is a solved 2-player format — exactly the existing
proximity-challenge scale. Two players at a fire draft piles from *that
fire's pool*, duel with the results, winner keeps a pick or two as real
instances, the rest returns to the fire (witnessed — see #6). Also the great
equalizer: fresh characters get interesting duels immediately, collection
strength doesn't matter inside the format.

### 6. Passing as signaling ("witnessed" weight)
Embers passed over accumulate witnessed weight: surface more prominently,
glow in the offering, maybe a Chronicle line ("Passed over by four hands at
Bram's fire"). A card nobody wants develops a *reputation* — extremely
on-theme for a game about witnessed memories, and sometimes the signal that
it's undervalued.

### 7. The Offering (two-tier kindle) — from the permanence discussion
See analysis below. Normal kindle unchanged; **Offer** = permanently feed the
real instance to the fire for a much bigger in-duel payoff, possibly scaled
by the card's renown ("the brighter the ember, the more the fire gives
back"). Limited (e.g. once per duel). The instance **migrates** into the
local fire's pool with a provenance line ("Offered to the flame at Bram's
fire by <name>") — draftable by others, hunt-down-and-trade-back stories.

### 8. Ember Trials (roguelike run mode — someday)
Draft an ephemeral deck at a fire, climb an NPC gauntlet, losses end the run
(never touch the collection), winnings mint. Carries full roguelike
permadeath stakes inside a format instead of poisoning the collection game.

### 9. Rolling deck window (spicy, deferred)
Some slice of the 30-card deck must be embers drafted in the last N days —
everyone perpetually drafts to stay legal, fires' pools shape the meta
continuously. Fights the deck-with-a-soul feeling; prototype the gentle
version first. Noted, not endorsed.

## Permanent kindle-loss — analyzed 2026-07-16

Michael's question: should kindling permanently remove the card from your
inventory? Roguelike sweat, tension about passing without kindling.

**Verdict: too extreme as the baseline, right instinct as an opt-in.**
- Volume: kindle is the ONLY ember growth (engine.js `kindle()` is the sole
  `emberMax++`; players start 0/0) — you kindle nearly every turn or can't
  cast. ~8–10 instances destroyed per duel × constant dueling = attrition,
  not tension.
- Degenerate choice: you'd always burn your worst card *for your life*
  instead of *for this duel* — usually the same common. Sweat only appears
  when the whole hand is valuable (rare); mostly it punishes new players.
- Collides with three standing decisions: the Chronicle pillar (years-long
  instance histories vs. mass shredding), autobattle-earns-full-rewards (AI
  destroying your collection while AFK), and deck validity (kindling a deck
  card invalidates the 30).
- Resolution: **the Offering** (#7) — permanence as a chosen, limited,
  high-payoff play; plus **migration, not destruction** — the instance
  survives in the fire's pool, history intact, so personal loss is real but
  realm memory (and the Chronicle pillar) survives. Roguelike-run stakes go
  in formats (#5/#8), not the collection.

## Offering design — every card, payoff derived from the card (2026-07-16)

Michael's question: does every card get an offer, or only rares? Concern:
flooding fires with trash. Direction landed in discussion (Michael liked the
Offering; details below are Claude's recommendation, not yet confirmed):

- **Every card is offerable; the payoff keys off the card.** No per-card
  authored offer text (would double the set's design surface) and no
  rarity cliff.
- **Payoff shape (Michael, 2026-07-16): Offer = a kindle (+1 emberMax,
  occupies the once-per-turn kindle slot) + a small extra bonus that is
  NOT more ember.** Ramp pacing stays identical to today; the sacrifice
  buys a sweetener, never a second ramp step.
- **The bonus scales with the offered card (DECIDED, Michael, 2026-07-16)**
  — needed to avoid the trash-offering degenerate: a flat bonus makes
  "offer your worst common every duel" optimal — no sweat, and exactly
  the trash flood Michael wants to avoid. The table — **the fire
  answers in the memory's own voice**: flavor from the card's faction,
  size from its rarity tier, renown kicker (Veteran/Storied embers count
  one tier higher — "the brighter the ember, the more the fire gives
  back"). Draft v1 (numbers are Phase 3 sim-fodder):
  - Boarherd → random ally +1/+1 per tier
  - Wardens → restore Hearth 2×tier
  - Red-Sash → deal tier damage to a random enemy
  - Neutral → draw a card (tier 2+: plus something minor)
  One ~4-row table, not per-card text; deepens faction identity for free.
- *Reserved alternative*: the **Remembered echo** (offered creature is
  summoned as a token copy of itself, fades at end of turn) — the earlier,
  more dramatic payoff design. Superseded by the small-bonus shape above;
  keep in the drawer as a possible Storied-only signature flourish.
- **Limits (Michael, 2026-07-16): once per turn, max 3 Offers per duel,
  sharing the kindle slot.**
- **Renown scaling for free**: a Veteran/Storied echo arrives with its earned
  +1/+1 / +2/+2 — the brightest embers give the most back.
- **Creatures-only in v1.** Spells/relics ("cast free as it departs") is too
  close to just playing the card; extend later only if Offering feels
  incomplete without it.
- Optional hard gate if wanted (not recommended): commons can't be Offered
  but can still *tend the fire* (fed, no in-duel payoff).

**Flooding is a sampling problem, not an offering problem.** Kindle-seeding
(Phase 2) fills pools with commons regardless — and that's draft-normal (an
MTG pack is 10/3/1). Guardrails live at the display/pool layer:
- Offering display (the 3–5 shown) sampled with rarity + witnessed + renown
  weighting; real Offered instances always surface and glow — a Storied
  instance in a fire is a visible event.
- Pool hygiene: cap copies per card id per fire (dupes merge into the
  flame), cap pool size (oldest-common-out overflow), optionally only a
  fraction of kindles seed.

## Deckbuilding: keep it, demote it

Don't ditch deckbuilding — the Chronicle/Storied/Legend-Budget soul lives
there. Invert the acquisition path instead:
- **Drafting is how cards enter your life** (fires absorb/replace packs as
  the faucet).
- **Deckbuilding is how cards stay in it** (curating the 30 that carry your
  history; Legend Budget as-is).
- **Hearth Draft is the third pillar** — the repeatable always-fresh mode
  whose winnings feed the collection.

## What has to be true (risks / guardrails)

- **Server owns the pools.** Fire pools are server world-state; fits the
  authority model. NEW: the server currently persists only profiles
  (profiles.db, one JSON row per profile) — fire pools need a world-state
  row/table with periodic saves.
- **Legibility is everything.** "Your picks influence others" is only fun if
  visible: offering UI, dimming fires, witnessed-glow. Without loud feedback
  the whole system reads as random stock rotation.
- **Anti-drain valves.** Per-player pick cooldowns per fire; NPC-duel kindles
  also feed pools; pity/regen floor so latecomers never find pure ash.
- **Mint semantics decision:** fresh anonymous instances from normal-kindle
  seeding vs. real instances circulating via Offerings (leaning: both, split
  exactly that way — see #2/#7).
- **Packs coexistence:** Phase 1 can ship alongside packs untouched; decide
  later whether packs get reframed (pre-drafted bundles) or sunset.
- **Autobattle must never Offer.** The AI may normal-kindle (harmless); the
  permanent sacrifice is a human-only action, enforced server-side.
- **Offering a deck card:** either blocked (like trading deck cards — the
  existing precedent) or auto-removes from deck + flags the deck invalid.
  Leaning: blocked, same rule as trading; keeps every deck permanently valid.

## Implementation plan (phased; each phase is a worktree branch, mergeable alone)

**Phase 0 — prerequisite: promote the zone map to shared/** (already the
stated prerequisite for Field Effects, DESIGN.md 2026-07-13). Move CAMPS (+
fire locations) from client/src/constants.js to shared/, server derives
"nearest fire" / duel location authoritatively. Pure refactor, no behavior
change. Unblocks #2, #4, #7 and Field Effects itself.

**Phase 1 — fire pools + hearth-drafting (#1).** Server-side pool state per
fire (new world-state persistence in db.js), seeded zone-themed (reuse the
rarity-weighted roll from packs.js as the seeding function). Client: E at a
fire with no other business → offering UI (3–5 cards, hover-zoom works via
[data-card]) → `draftPick` message; server validates proximity + cooldown +
pool membership, mints, removes from pool. Per-player per-fire daily
cooldown. Packs untouched.

**Phase 2 — kindle feeds the fire (#2).** Server-side only: on kindle in an
online duel, add an anonymous copy of the burned card id to the nearest
fire's pool (cap pool size; overflow drops oldest). NPC duels included.
Requires Phase 0. No client change beyond maybe a log line.

**Phase 3 — the Offering (#7).** Engine: new action `offer` (kindle variant
occupying the turn's kindle slot; max 3 per duel; +1 emberMax like kindle
PLUS a small faction-flavored bonus scaled by rarity tier with a renown
kicker — see "Offering design" above; numbers verified via sim). Server:
validates human-only + not a
deck card; moves the REAL instance (owners[] appended → the fire? new
"held by the fire" state) into the fire's pool; Chronicle origin line.
Client: distinct UI on the kindle affordance with a confirm (it's
permanent). The sweat feature.

**Phase 4 — fire health / cold fires (#3).** Pool level drives fire state:
fed → dim → cold. Visual (flame scale/light already per-fire in world.js) +
one mechanical consequence to start (cold fire = no drafting there until
fed; harsher effects like field/vendor loss come later). Feeding = kindles
nearby (Phase 2) or a direct "tend the fire" interaction (donate a card —
the same Offering plumbing, out-of-duel).

**Phase 5 — draft-shaped fields (#4).** Requires Field Effects to exist at
all (separate epic). Pool composition tints the zone's standing rule.

**Phase 6 — Hearth Draft format (#5).** Biggest lift: Winston draft flow in
duelRoom.js (new pre-duel phase), ephemeral decks, winner-keeps rules,
returns feed the pool with witnessed weight (#6 ships here naturally).

Sequencing note: Phases 0–2 deliver the fantasy end-to-end (walk up to a
fire, draft what others' play left there) without touching a single duel
rule. Phase 3 is the first engine change. Each phase gets the standard
verification bar (build, sims where cards/engine change, VERIFICATION.md).

## Open questions for Michael

- ~~Offering payoff & frequency~~ — DECIDED (Michael, 2026-07-16): Offer =
  kindle (+1 emberMax, shares the slot) + faction-flavored bonus scaled by
  rarity tier with renown kicker; once per turn, max 3 per duel. Only the
  numbers remain, via Phase 3 sims.
- Draft pick cost: free-with-cooldown, coins, or both (cooldown for free
  pick, coins to pick again)?
- Do packs survive long-term, get reframed as sealed, or sunset?
- Pool visibility: show the full pool or only the 3–5 offering (offering-only
  preserves signal-reading mystery)?
- Does the Offering exist out-of-duel too ("tend the fire") from the start,
  or duel-only first?
