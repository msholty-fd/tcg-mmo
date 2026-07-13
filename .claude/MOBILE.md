# Mobile / iPhone Support — findings & plan (2026-07-13)

Michael wants to play on his iPhone. This doc records the audit of what
already works on touch, what doesn't, and the phased plan. Phase 1 is being
implemented in `feat/mobile-controls`.

## Audit: what already works on touch (more than expected)

- **The entire duel UI is click-driven.** Hand cards open a tap menu
  (Play/Kindle), targeting is tap-to-select → tap-target, End Turn/Auto/
  Concede/? are buttons, the board tap cancels targeting. `showMenu()`
  positions from `clientX/clientY`, which taps provide. No hover-required
  *action* exists in duels.
- **Every panel is button-driven**: shop, trade, challenge/trade-invite
  banners, quest accept/turn-in (via E → tap prompt → dialogue), Esc menu,
  full map (opens by tapping the minimap!), death screen, duel result.
- **Intro screen** is a plain form + button.
- `<meta name="viewport" width=device-width initial-scale=1>` already set.
- Renderer resize handler exists (scene.js) — rotation/resize adapts.

## Audit: what's broken or missing on touch

1. **Movement is keyboard-only** (`keys.KeyW/A/S/D`, `Space` jump, `R`
   auto-walk in input.js/main.js). No touch path at all.
2. **Camera is mouse-only** (window-level `mousedown/mousemove/mouseup`).
   Also conflicts with future joystick touches — needs per-pointer tracking.
3. **Interact/trade have no trigger**: the prompt says "E — challenge…" but
   there's nothing to tap. `keys.KeyE`/`keys.KeyT` edge-detection in main.js
   is the only path.
4. **Panel hotkeys have no buttons**: B (deck), M (map — minimap tap DOES
   work), Q/H/P (HUD windows), Enter (chat), Esc (menu).
5. **Card inspector is `mouseover`-driven** (cardZoom.js) — touch users get
   no card rules text anywhere. Long-press is the natural mapping.
6. **Deck-builder Chronicle is right-click** (`contextmenu`) — iOS long-press
   triggers a callout/selection instead. (Also: iOS fires a fake
   `contextmenu` on long-press in some cases — must not collide with zoom.)
7. **Duel layout overflows a phone.** `.dcard` is 88×142px — a 7-card hand is
   ~660px vs 390px viewport. `#d-log` is a right sidebar hanging at
   `right:-9vw` (offscreen/overlapping on narrow). `#d-board` margin wastes
   20% width. Hearth rows are ~wide but shrinkable.
8. **HUD overlaps itself at 390px**: `#tracker` (right, 230px) + `#pframe`
   (left, 230px) + minimap (150px) can't all fit a row; chat is 440px fixed.
9. **iOS browser behaviors fight games**: double-tap zoom, pinch zoom,
   overscroll rubber-banding, text-selection callouts on long-press, the
   notch/home-bar (safe areas), keyboard pushing the viewport when chat
   focuses, 300ms-click legacy (dead on modern Safari, but tap-highlight
   flashes aren't).
10. **`hudWindows.js` drag is mouse-event based** — windows can't be dragged
    on touch (minor; fixed positions are fine on a phone).

## Approach decisions

- **Feature-detect, don't UA-sniff**: `matchMedia('(pointer: coarse)')` adds
  a `touch` class to `<body>` + shows touch controls. Desktop is untouched.
  `?touch=1` / `?touch=0` URL override for testing in a desktop preview.
- **Touch controls write into the existing `keys` map** (jump button →
  `keys.Space`, action button → `keys.KeyE`) so main.js edge-detection,
  gating, and all downstream logic are reused verbatim — no parallel input
  path to keep in sync. Movement is the exception: a virtual joystick is
  analog, so it exports a `touchMove {x, z}` vector added to the WASD vector.
- **Camera = any pointer on the right ~60% of the screen** (pointer events,
  per-pointerId, so joystick thumb + camera thumb work simultaneously).
- **Portrait-first duel layout** via media query: smaller cards, hand row
  scrolls horizontally, log hidden behind a toggle, board margins collapse.
- **Long-press = inspect** (replaces hover zoom AND right-click Chronicle
  stays desktop-only for now — v1 gap, noted below).

## Phase 1 (this branch): playable on iPhone

- iOS meta/CSS hardening: `user-scalable=no, viewport-fit=cover`,
  `touch-action: none` on the game surface, tap-highlight transparent,
  overscroll containment, safe-area padding on HUD edges.
- Virtual joystick (left thumb), camera drag (right), Jump + context Action
  button (appears with the prompt, labeled from it), buttons for chat/map/
  deck/menu, auto-walk toggle.
- Duel + HUD + deck-builder responsive CSS for ≤~740px.
- Long-press card inspector on touch.
- Chat input opens keyboard; Esc-equivalent = menu button.

## Phase 2 (later, wants real-device feedback first)

- Chronicle access on touch (long-press second stage? info button on zoom?).
- HUD window drag via pointer events (or accept fixed layout on phones).
- Deck-builder polish (it *works* stacked but is cramped; probably wants a
  dedicated phone flow: tap card → sheet with Add/Remove/Chronicle).
- PWA affordances (`apple-mobile-web-app-capable`, icon, splash) so it can
  live on the home screen without Safari chrome.
- Performance pass if a real device shows heat/battery issues (cap
  `devicePixelRatio` at 2, shadow map size).
- Landscape duel layout (portrait is v1).

## Known Phase-1 gaps (deliberate)

- Chronicle (right-click) unavailable on touch.
- HUD windows not draggable on touch (fixed positions).
- Trade works but is dense on a phone (functional, unpolished).
- No haptics/audio.

## Verification notes

**Phase 1 verified in the desktop preview at 375×812 + `?touch=1`
(2026-07-13):** touch UI appears (feature detect + override); joystick
produces the right unit vector and zeroes on release (synthetic pointer
events); jump/action/trade buttons hold their key exactly like a physical
key; camera rotates on world drags and correctly ignores drags starting on
the joystick or touch buttons; mobile HUD and duel layouts screenshot-clean
(hand overflows into horizontal scroll, Log button replaces the sidebar);
tap → Play/Kindle menu works with NO inspector flash (the iOS synthetic
mouseover was caught in preview and suppressed on touch); a full live duel
action round-tripped the server (kindle → 1/1 ember); long-press shows the
inspector, swallows the trailing click, and dismisses on tap-away. Build +
all test suites green.

Two debugging gotchas hit and worth knowing: (a) the stale-HMR-module
gotcha (CLAUDE.md) struck twice — restart Vite before evals; (b) an
abandoned NPC duel forfeits by turn-timeout server-side, after which every
duel action is silently dropped (`winner !== null` guard) while a reloaded
client can still show a stale "Your turn." view — looks exactly like an
input bug but isn't.

What ONLY a real iPhone shows: Safari toolbar behavior, safe areas on the
notch, keyboard-push, real multi-touch (two thumbs at once — synthetic
tests covered single-pointer paths only), long-press vs iOS callout
conflicts, and feel (joystick size/sensitivity, button reach). **Michael
should playtest on his phone after deploy and report; expect a tuning
follow-up.**
