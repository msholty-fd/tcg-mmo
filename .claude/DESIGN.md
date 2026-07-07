# Emberwood Online — Design Notes

Running record of the vision and the decisions made along the way, with the
reasoning. Add to this as decisions land; don't rewrite history.

## The vision (Michael, 2026-07-06)

Physical TCG cards felt *alive*: a worn Blue-Eyes had a history — trades,
games, owners — even though its power never changed. Emberwood should
recapture that digitally, and go further: because we can remember everything,
each card copy accrues a real, verifiable story.

Pillar: **the world and the card game are the same universe.** Zones map to
card themes; beating a zone's duelists is how its cards enter circulation.
Shipping a new world zone and shipping a new card set are the same act.

## The Chronicle (card identity system)

- Every copy is a minted **instance**: iid, origin ("Won from Gruk the Boar
  King"), owners[] provenance chain, battle record (duels/wins/kills/hearth
  damage), renown.
- Renown from duels (server-computed): participation (win 5 / loss 2) +
  2/kill + hearthDmg/3, capped 20 per duel.
- Levels: Fresh → Seasoned (20, cosmetic patina) → **Veteran** (60, +1/+1) →
  **Storied** (150, +2/+2 + card-specific `storiedKeyword`). Frames patina and
  gild with ★ by level.

### The balance resolution (important)

Michael explicitly did NOT want cosmetic-only ("I don't want the card to
evolve and still be weak") but had no answer for balance. The resolution:
**growth is real but decks carry a Legend Budget** (8 points; Veteran=1,
Storied=2, enforced server-side). You can't field 30 legends — you build
*around* your storied cards, which is exactly the deck-with-a-soul feeling.
Don't quietly remove the budget or make growth cosmetic; both directions were
considered and rejected.

## Combat design

- Resource: **Kindle** — burn any card from hand (once/turn) for +1 permanent
  Ember. Cards are both resource and fuel; choosing what to burn is the game.
  (Solves mana screw; creates real decisions.)
- Keywords: ambush, guardian, ward, frenzy, lifesteal, piercing. Keywords are
  the extensibility surface — prefer new keywords/effect primitives over
  special-cased rules.
- Card types: creature, spell, relic (attach = buff+grantKeyword effects).
  Enchantment type reserved but unimplemented.
- Rules text and flavor are separate fields (`text` vs `flavor`); the hover
  inspector shows keyword glossary + rules + italic flavor.

## History of major pivots

1. Started as a WoW-style RPG (classes/abilities/mob grinding) — single HTML
   file refactored into modules.
2. Pivoted to MMO card game: classes → starter decks (Boarherd/Wardens/
   Red-Sash), mobs → ambient wildlife, kill quests → duel quests, boss mob
   Gruk → boss *duelist* Gruk.
3. Networking: real WS server, presence, PvP challenges, then full server
   authority (cards → progression → quests) added incrementally.
4. Chronicle + Legend Budget + rules-depth pass (relics, lifesteal/piercing,
   duel log, help panel) in one push.

## Decisions & rationale (append here)

- **Auth**: name+password recovers a character from any device; server issues a
  device token for auto-login. Logout is non-destructive.
- **Autobattle**: the shared AI plays your side (server flag `auto`). Improving
  `shared/engine/ai.js` upgrades NPCs, autobattle, and balance sims together.
- **Offline mode**: local NPC duels work without the server but earn no
  renown/XP/quest progress — stated honestly in the UI, by design.
- **NPC duels run server-side when online** so rewards/renown are authoritative;
  the local engine path is kept only as the offline fallback.

- **Pixel art over emoji** (explicit user call: emoji is "boring"): 16×16
  hand-authored grids in pixelArt.js, palette-swapped per family. Portraits
  for creatures, sigils for spells, icons for relics. Keep the style.
- **Rules + flavor are separate card fields** — inspector shows keyword
  glossary, rules, then italic flavor like a printed card.
- **UI philosophy**: HUD panels are player-owned (drag/close/hotkey/persist);
  hover-zoom answers "what does this card do" everywhere; Esc = universal back.
- **Night design**: night is a real phase (20-min days), never pitch black,
  torch-lit settlements as warm islands; moonlight is a fixed light so shadows
  don't crawl. Potential future hook: night-only content.

- **Trading (2026-07-07)** — the vision item, designed for trust and story:
  - *Proximity ritual*: you trade by walking up to someone (same range as a
    challenge) and pressing **T** — invite → accept, like duels. Trading is a
    thing you do *in the world*, not a global marketplace; scarcity of
    encounter is part of the fantasy (physical-TCG feel).
  - *Double-confirm with anti-scam reset*: both sides build offers (cards +
    coins); ANY change to either offer clears BOTH confirmations. Classic MMO
    pattern; prevents last-second swaps.
  - *Active-deck cards can't be traded* — keeps every deck permanently valid
    (30 cards) and makes "I'd have to un-deck it first" a natural friction on
    parting with a card you actually use.
  - *Provenance is the product*: on transfer the recipient is appended to the
    instance's owners[] chain; renown/level travel with the card. A Storied
    card that passed through four hands is the whole point of the game.
  - *Server-authoritative and atomic*: offers validated on every change AND
    re-validated at execution; both sides' cards/coins move in one step or
    not at all. Max 8 cards per side per trade. Blocked while dueling (and
    vice versa). Online-only — offline mode has no trading.

## Open questions

- Autobattle renown: full rate (idle-farming as a feature) or discounted?
- Renown pacing: thresholds 20/60/150 are untested against real play.
- Starter balance: boarherd ~75% vs redsash (AI-vs-AI); needs a card pass.
