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

**Factions & standing (the progression system, diegetically)**: witnessing
runs both ways. Play a faction's embers and that faction *witnesses you* —
standing is their memory of your deeds, and their deeper memories (higher-
rank cards) open only to someone they know: Stranger → Known → Trusted →
Sworn. A champion's card in your keeping vouches for you one rank beyond
your standing — the folk who follow that champion take their word for it.
Neutral cards (Village & Hearth, plain relics and tricks) belong to
everyone and no one; playing them is life, not allegiance. In dialogue,
NPCs may reference rank names naturally ("you're Known to the Wardens now")
but never say "points" or "unlock."

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
- **Chronicler Sela** (Highgate's shrine, the Hall of Legends) — a working
  record-keeper, not a mystic: she reads the Chronicle aloud and believes
  witnessing is a civic duty ("the fire doesn't care whose story it keeps,
  only that it's witnessed"). She knows the ledger, not the myth's ending —
  keep her practical, never prophetic.
- **Weir the Forgotten** (the Circle of Sighs, night only) — half-faded;
  remembers the hunt, not the hunter. Quiet dignity, never horror. See Act
  II canon below.
- **Tamsin the Charcoal-Burner** (the Darkwood road) — small omens tier: a
  practical tradeswoman who feeds hearths for a living and doesn't like
  what the wood's been whispering. (Duelists can't surface `n.flavor` —
  her knowledge shows in quest/DESIGN text only for now.)
- **Merle the Skywatcher** (the Dial Stone, due east) — small omens tier,
  and the realm's hint-giver for night content: they know WHO keeps night
  hours (the Sentinel, the wood's walker) but not what they are — "I keep
  count, not company." Their seeded omen (nights measure the same but feel
  longer) leans on the Going-Out without naming it; do not sharpen it.
- **Tolly the Lambward** (the Wether Downs, Wynn's young second) — small
  omens tier, mostly none: drills the herd with cards because the wolves
  from the wood keep coming west. (Duelists can't surface flavor lines —
  their knowledge lives here and in DESIGN text only.)
- **Shepherd Wynn** (the Wether Downs, due west) — small omens tier: keeps
  one small fire nightly ("a dark camp is a borrowed camp"), and their
  bellwether has taken to staring west at nothing. What she watches for is
  a seeded door — do not answer it without a Wether Downs content phase.
- **Fisher Pell** (Pell's Pond, the northwest water) — small omens tier:
  smokes the catch over a fire kept low and kept always ("smoke keeps what
  flame would eat"). Two seeded doors, both gentle: the fish over the
  pond's deep hole have gone shy, and nobody living remembers who dug the
  pond. Do not answer either without a Pell's Pond content phase — and
  keep Pell's omens about fish and smoke, never water-that-remembers
  (memory-without-fire is Hessa's reserved thread).
- **Beeman Odo** (the Bee Meads, the southwest flowers) — small omens tier:
  tells the bees the news, as his folk always have (witnessing made folk
  practice — never say so out loud), and smokes them gentle ("they forget
  what they were cross about" — a light echo of the forgetting theme, kept
  at one line). Two seeded doors: the hive that emptied at midsummer with
  the honey untouched, and the bees refusing the mire's edge. Do not answer
  either without a Bee Meads content phase — and the mire refusal stays a
  bee's unexplained opinion, never an explanation of Hollowmere
  (memory-without-fire is Hessa's reserved thread).
- **Pedlar Rusk** (the Darkwood road, Gruk side) — small omens tier: sells
  the Night-Gather by daylight and is gone by dusk, and won't say why beyond
  "the light's better." (Vendor interactions can't surface flavor lines —
  his knowledge shows in the pack desc and DESIGN text only for now.)
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

## Act II — "What the Wood Kept" (WRITTEN, Darkwood Phase 3)

The Circle of Sighs door from the Act I cliffhanger. New canon (continues
the numbered facts above):

11. **The watchfire ring.** The Emberwatch raised eight standing stones,
    one for each watchfire of the realm — the Circle of Sighs is that ring,
    and the wood was not dark when they raised it. The fallen eighth stone
    marks the FIRST watchfire to go out: the Deep Darkwood is not a new
    wound but the oldest one, forgotten so long the wood grew over its
    grave. **The stone did not crumble — it was pulled down.** By whom or
    what is Act III's question; do not answer it.
12. **Weir the Forgotten.** Bram's hunter friend followed the cold-fire
    trail to the Circle and stayed too long in a place that forgets. He is
    half-faded — still checks his snares, no longer remembers why — and
    walks the ring only at night, among the wisps. A duel is a witnessing:
    being fought, and his card (`weir`) being carried and played, is what
    holds him in the world. He speaks little and remembers less; write him
    with quiet dignity, never horror. Bram knows now — keep Bram's grief
    understated and practical ("I'll keep the first one going. You keep
    the second.").

Act II quests (shared/quests.js, prereq'd on Act I's finale):
`the_fallen_stone` (Sentinel — visit the Circle, count the stones) →
`what_the_wood_kept` (Sentinel — defeat Weir at night; the reveal) →
`a_coal_for_bram` (Bram — own the `weir` card: witnessing made mechanical).
Tamsin the Charcoal-Burner (day duelist, the wood's road) is Phase-3 zone
content beside the act, knowledge level "small omens": she feeds hearths
for a living and doesn't like what the wood's been whispering.

## Act III — a door, not a script (reserved)

- **Act III — Cinderhollow Mine** (the seeded underground hook): what the
  delvers dug too close to, and what pulled the eighth stone down —
  presumably one answer. Marrow the Delver is already standing at the door.
  "Buried on purpose" + "wanted a beacon put out" are the only canon facts
  so far. Do NOT write it until the mine's own content phase.

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
