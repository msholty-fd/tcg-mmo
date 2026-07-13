# Emberwood — Narrative Canon

The realm's founding myth and the rules for writing in it. Read this before
writing ANY quest text, NPC dialogue, flavor lines, or card flavor. DESIGN.md
records *decisions about* the narrative; this file is the narrative itself.

Direction decided 2026-07-13 (Michael): the game needed an overarching story
and a player goal. The myth below was chosen because it retro-explains what's
already built — the fire names, the Kindle mechanic, the Chronicle, the
Sentinel, the cold firepit at Hunter's Rest — rather than bolting a plot onto
the side.

## The founding myth — the Going-Out

Canon facts. Everything else in the realm should be consistent with these:

1. **The Emberwood.** Long ago the heart of the world was a burning forest —
   the Emberwood — a fire that burned and was not consumed. Its fire
   *remembered*: everything that lived in its light, it kept.
2. **The Going-Out.** The Emberwood went out. No one living knows why or
   exactly when — "longer than there've been kings." What remained of the
   fire: embers, scattered and banked, each keeping one memory. **Why it
   went out is the realm's central mystery. Never explain it.** Each act of
   the main quest answers one smaller question and opens another.
3. **Cards are embers.** A card is an ember bound so its memory can be woken
   safely. Playing a card wakes the memory for a moment; a duel is two hands
   of memories contending. This is why cards are *instances*: an ember is one
   memory, singular, with its own history — there is no such thing as two
   identical cards, only two embers that remember similar things.
4. **Kindle** is the realm's oldest ritual: feeding a memory back to the fire.
   Burning a card from hand for permanent Ember is diegetically literal.
5. **Renown**: an ember burns brighter the more its deeds are *witnessed*.
   Seasoned → Veteran → Storied is an ember waking further; a Storied card is
   half-woken and gilds its own frame. Level travels with trades because the
   memory belongs to the ember, not the owner.
6. **The Chronicle** is the record the fire itself keeps — origin lines
   ("Won from Gruk the Boar King"), owner chains, battle records. Server
   authority, diegetically: the fire remembers, and the fire cannot be argued
   with.
7. **Tended fires.** Every hearth, torch, and campfire in the realm is a
   banked coal of the old wood, kept alive hand to hand since the Going-Out.
   A fire tended without break never dies. A fire that dies, *forgets* — and
   the land around a dead hearth begins to forget too. The Deep Darkwood's
   gloom is not shade; it is what forgetting looks like.
8. **The Emberwatch** was an order sworn to watch "until it kindles again, or
   goes out for good." The order is gone. The **Ashen Sentinel** — its last
   keeper, an ember wearing ash, no longer quite alive — keeps the watch
   alone at the ruined tower. Its eternal untended campfire is the order's
   founding ember; it needs no tending because it is not merely fire.
9. **The Emberpeaks** are where the wood burned hottest — where the heart
   fell. The fire there never fully banked: the basin's elementals are
   *unbound* embers, memories with no card to hold them. **Ignarok the
   Pyrelord** is the oldest of them; he was old when the Emberwatch raised
   its first stone.
10. **The hook: the fires are going cold.** The firepit at Hunter's Rest will
    not take flame — not from flint, not from a carried coal — the first such
    fire in living memory. This is what the Emberwatch was watching for: not
    the wood's return, but the Going-Out finishing what it began.

**The player's role**: not a chosen one. The realm needs *witnesses* — every
duel fought, every card carried and traded and made Storied, keeps a memory
burning. The player's arc is to become part of what the fire remembers.

## Voice & tone

- **Cozy-melancholy folk-tale.** The threat is slow and quiet — a superstition
  coming true, not an apocalypse timer. NPCs talk about it the way farmers
  talk about weather.
- **Understated.** Nobody says "the world is ending." Bram says "feed the
  fire, friend. I mean it."
- **One myth-telling only.** Aldric delivers the full story once (quest
  `ask_the_ash`). Everyone else references pieces sideways. Never dump the
  myth in flavor lines.
- Existing quest/flavor text style holds: wry, concrete, second person,
  no fantasy-jargon walls.

## Who knows what (NPC knowledge levels)

- **Aldric** — knows the old story as a story; the cold hearth makes him
  believe it. The main chain's village anchor.
- **Bram** — roads and rumor; personally knows the missing hunter (Weir, an
  old friend). Feels the stakes before anyone: he has fed one fire nightly
  for forty years.
- **The Ashen Sentinel** — knows the vow and what the watch was for; does not
  know why the Going-Out happened. Speaks sparsely. Becomes a quest-giver
  after being defeated (Vex/Gruk precedent).
- **Old Hessa** — knows more than she says (the mire "never forgets anything"
  and needs no fire — she is adjacent to the mystery, not inside it yet).
  Reserved as an Act II/III thread.
- **Ignarok the Pyrelord** — a thing of the first fire, and *afraid*. What he
  fears is the Act I cliffhanger; what it IS stays unwritten.
- **Marla, Harrow, the Wayfarer, everyone else** — superstition and small
  omens. Marla is actively dismissive (someone still has to sell the packs).

## Main quest — Act I: "The Long Ash"

Design: threads existing landmarks only (Hunter's Rest → Emberwatch →
Emberpeaks); no new places, no new duelists. Independent of the Aldric
Vex/Gruk chain (its own spine, minLvl-gated). Needs one new quest objective
shape: `visit` (see DESIGN.md entry for mechanics).

Draft quest text (polish in the implementation branch, but this is the story):

### 1. `cold_hearth` — "The Fire That Won't"
giver: **bram** (his first quest), minLvl 3, prereq: null,
**visit** Hunter's Rest (112,-88, r≈10), xp 250, coins 20
- *offer*: "You know I don't spook easy. But a fellow I shared this fire with
  for twenty years — Weir, a hunter, deep-wood sort — set a camp out past
  Gruk's road and never came back for his gear. Travelers say his firepit's
  gone cold. Say it won't take flame — not from flint, not from a carried
  coal. A fire that won't light isn't weather, friend. Go and look. I'd
  rather know."
- *obj*: `Find Weir's camp in the Deep Darkwood`
- *thanks*: "Cold, then. Truly cold. Forty years I've sat this road and fed
  this fire every night of it, and I never once asked what it'd mean if one
  went out. Aldric needs to hear this — not from me. From you, who saw it."

### 2. `ask_the_ash` — "Ask the Ash"
giver: **aldric**, minLvl 4, prereq: `cold_hearth`,
duels { target: 'sentinel', need: 1 }, xp 400, coins 35
- *offer* (the one full myth-telling): "A fire that won't take flame. Then
  it's starting — or ending, depending which version your grandmother told.
  The old story goes like this: the world's heart was a burning wood that
  never burned down, and everything it shone on, it remembered. When it went
  out, the memories didn't die — they banked. Every card you've ever played
  is one of them, still dreaming. And every hearth in this realm is a coal of
  that first fire, kept alive hand to hand since before there were kings. A
  hearth that dies, forgets — and the land around it forgets with it. You've
  walked the deep wood; that gloom isn't shade. There's one thing old enough
  to say whether the story's true, and it only walks after dark. The tower,
  northeast. Go at night. If it judges you worth answering, it answers with
  cards."
- *obj*: `Defeat the Ashen Sentinel`
- *thanks*: "It spoke to you. Then the story's true enough to be worried
  about. Go back to it — whatever the watch was for, it's yours to hear now."

### 3. `what_the_watch_keeps` — "What the Watch Keeps"
giver: **sentinel** (new giver), minLvl 4, prereq: `ask_the_ash`,
collect { cardId: 'ash_sprite', need: 2 }, xp 300, coins 25
(ash_sprite is in the Sentinel's own deck/rewards — winnable on the spot)
- *offer*: "The watch was never for the wood's return. We watched for the
  Going-Out to finish what it began. A cold hearth in the deep wood is how
  it starts. Bring me two embers that still dream — the small ones, the
  sprites of ash. Not to keep. To listen. I have not held a dreaming ember
  in four hundred years."
- *obj*: `Ash Sprites owned`
- *thanks*: "…They still dream of the wood. Green, and burning, and glad.
  Then it is not finished — not yet. One older than my order would know how
  long we have: the fire that never banked, in the peaks where the heart
  fell. It does not answer questions. It answers duels."

### 4. `where_the_heart_fell` — "Where the Heart Fell"
giver: **sentinel**, minLvl 6, prereq: `what_the_watch_keeps`,
duels { target: 'pyrelord', need: 1 }, xp 750, coins 75
(deliberately overlaps `ep_pyrelord`'s target — Vex/vex_rematch precedent)
- *offer*: "North, past the pass, the first fire still burns unbound. The one
  who wears it calls himself a lord — Ignarok. He was old when my order
  raised its first stone. Beat him, and while his pride is smarting, ask him
  what a fire that cannot be relit means. Then come and tell me. I will be
  here. I am always here."
- *obj*: `Defeat Ignarok, the Pyrelord`
- *thanks* (Act I cliffhanger): "So the Pyrelord is afraid. A thing of the
  first fire — afraid. He is right about one thing: what is coming is not
  cold. Cold is only what it leaves behind. Seven stones stand in the deep
  wood where an eighth has already fallen, and under the mountain the
  delvers dug too close to something buried on purpose. When you are ready
  to know more, one of those doors will open. I will keep the watch until
  then. I have gotten rather good at it."

## Act II & III — doors, not scripts (reserved)

Both doors are named in the Act I cliffhanger and both already exist in the
world as seeded hooks. Do NOT write their answers until their zone phases
happen:

- **Act II — the Circle of Sighs** (Deep Darkwood Phase 3): seven standing
  stones, one fallen. Suggested meaning (decide properly in Act II): one
  stone per watchfire/beacon of the old order; the fallen one is the first
  that went cold. Night-matters card set is the natural mechanical pairing.
- **Act III — Cinderhollow Mine** (the seeded underground hook): what the
  delvers dug too close to. Marrow the Delver is already standing at the
  door. "Buried on purpose" is the only canon fact so far.

## Flavor-line pass (ships with Act I)

Draft additions to `n.flavor` rotations — small omens, never the full myth:

- **Bram** (post-quest tone): "Feed the fire, friend. I mean it. Every night,
  without fail."
- **The Wayfarer**: "Roads remember feet the way fires remember faces —
  that's what my mother said. I keep walking so something remembers me."
- **Harrow**: "Frost in the planting rows this morning. In midsummer. My
  grandfather would've thrown salt over both shoulders and blamed the
  hearth."
- **Hessa**: "The mire never forgets anything, dear. That's why nothing down
  here needs a fire. Ask me no more unless you've brought better cards."
- **Marla**: "Cold firepits and doom-talk — meanwhile somebody still has to
  sell the packs. The realm can end after inventory."

## Rules for future worldbuilding iterations

- Every new zone/landmark decides its **relationship to the fire**: tended
  (settlements), cold/forgetting (Darkwood), unbound (Emberpeaks), or
  fireless-by-nature (Hollowmere — the mire remembers without burning).
- New duelist/NPC dialogue gets a knowledge level from the list above (most
  new NPCs are "superstition and small omens").
- Card flavor text MAY reference embers/memory/witnessing freely — that's the
  cheap ambient reinforcement layer.
- The Going-Out's cause is never explained. Cliffhangers name doors that
  already exist in the world (the Mine pattern: seed first, pay off later).
