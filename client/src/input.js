import { $, clamp } from './utils.js';
import { duelActive } from './duel/duelManager.js';
import { deckbuilderOpen, toggleDeckbuilder } from './deckbuilder.js';
import { tradeOpen, cancelTrade } from './trade.js';
import { shopOpen, closeShop } from './shop.js';
import { fullmapOpen, toggleFullmap } from './fullmap.js';
import { sendChat } from './net.js';
import { toggleWindow } from './hudWindows.js';
import { toggleEscMenu, escMenuOpen } from './escMenu.js';

const HUD_KEYS = { KeyQ: 'tracker', KeyH: 'hints', KeyP: 'prompt' };

export const keys = {};
export const cam = { yaw: 0.5, pitch: 0.42 };

// Auto-walk (WoW-style): R toggles continuous forward movement. main.js treats
// it as a held W; pressing S (backward) cancels it, as in WoW.
export let autoWalk = false;

// ---- touch support (see .claude/MOBILE.md) --------------------------------
// Feature-detected, never UA-sniffed; ?touch=1/?touch=0 overrides for testing
// in a desktop preview. Touch buttons write into the same `keys` map the
// keyboard uses so all downstream gating/edge-detection is shared; the
// virtual joystick is the one analog exception (touchMove vector, consumed
// by main.js next to WASD).
const touchParam = new URLSearchParams(location.search).get('touch');
export const isTouch = touchParam !== null
  ? touchParam !== '0'
  : matchMedia('(pointer: coarse)').matches;
export const touchMove = { x: 0, z: 0 };

let dragging = false, lastX = 0, lastY = 0;

export let started = false;
export function setStarted(v) { started = v; }

addEventListener('keydown', e => {
  if (!started || duelActive) return;

  // chat input handling
  const chat = $('chatinput');
  if (document.activeElement === chat) {
    if (e.code === 'Enter') { sendChat(chat.value); chat.value = ''; chat.style.display = 'none'; chat.blur(); }
    if (e.code === 'Escape') { chat.value = ''; chat.style.display = 'none'; chat.blur(); }
    return;   // typing — don't move the character
  }
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Escape') {
    if (shopOpen) closeShop();
    else if (tradeOpen) cancelTrade();
    else if (deckbuilderOpen) toggleDeckbuilder();
    else if (fullmapOpen) toggleFullmap();
    else toggleEscMenu();
    return;
  }
  if (escMenuOpen) return;   // menu captures all other input
  if (e.code === 'Enter') { chat.style.display = 'block'; chat.focus(); e.preventDefault(); return; }

  if (e.code === 'KeyR') { autoWalk = !autoWalk; return; }
  if (e.code === 'KeyB' && !tradeOpen && !shopOpen && !fullmapOpen) { toggleDeckbuilder(); return; }
  if (e.code === 'KeyM' && !tradeOpen && !shopOpen && !deckbuilderOpen) { toggleFullmap(); return; }
  if (HUD_KEYS[e.code]) { toggleWindow(HUD_KEYS[e.code]); return; }
  if (deckbuilderOpen || tradeOpen || shopOpen || fullmapOpen) return;
  if (e.code === 'Space') e.preventDefault();
  if (e.code === 'KeyS') autoWalk = false;   // pressing back cancels auto-walk (WoW behavior)
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });

// ---- camera: pointer events so mouse AND a second thumb both work ----------
// One pointer at a time owns the camera (camPtr). Touch pointers that start
// on interactive UI (buttons, panels, cards, the joystick) never grab it;
// mouse keeps the original grab-anywhere behavior so desktop feel is
// unchanged.
let camPtr = null;
const interactive = t => !!t.closest?.('button, input, .panel, [data-card], #joy, #touchui, #chat, #d-log');

addEventListener('pointerdown', e => {
  if (camPtr !== null) return;
  if (e.target.closest?.('#touchui')) return;   // touch controls never yield the pointer, even to a mouse
  if (e.pointerType !== 'mouse' && interactive(e.target)) return;
  camPtr = e.pointerId;
  dragging = true; lastX = e.clientX; lastY = e.clientY;
});
addEventListener('pointerup', e => { if (e.pointerId === camPtr) { camPtr = null; dragging = false; } });
addEventListener('pointercancel', e => { if (e.pointerId === camPtr) { camPtr = null; dragging = false; } });
addEventListener('pointermove', e => {
  if (!dragging || e.pointerId !== camPtr || duelActive || deckbuilderOpen || fullmapOpen) return;
  cam.yaw -= (e.clientX - lastX) * .005;
  cam.pitch = clamp(cam.pitch + (e.clientY - lastY) * .003, -.55, 1.45);   // look up at the sky, down from above
  lastX = e.clientX; lastY = e.clientY;
});

// ---- virtual joystick + touch buttons ---------------------------------------
// Buttons hold keys down for exactly as long as the finger does, mirroring a
// physical key, so main.js edge-detection (ePressed etc.) works untouched.
function bindHold(btn, code) {
  btn.addEventListener('pointerdown', e => { e.preventDefault(); keys[code] = true; });
  const off = () => { keys[code] = false; };
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave', off);
}

export function initTouchControls() {
  if (isTouch) document.body.classList.add('touch');
  if (!isTouch) return;

  const joy = $('joy'), nub = $('joy-nub');
  const R = 44;               // max nub travel in px
  let joyPtr = null, cx = 0, cy = 0;

  joy.addEventListener('pointerdown', e => {
    e.preventDefault();
    joyPtr = e.pointerId;
    const r = joy.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    try { joy.setPointerCapture(joyPtr); } catch { /* synthetic pointers can't be captured */ }
  });
  joy.addEventListener('pointermove', e => {
    if (e.pointerId !== joyPtr) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const m = Math.hypot(dx, dy);
    if (m > R) { dx *= R / m; dy *= R / m; }
    nub.style.transform = `translate(${dx}px, ${dy}px)`;
    // deadzone, then unit direction — speed stays constant like WASD
    if (m < 12) { touchMove.x = 0; touchMove.z = 0; return; }
    touchMove.x = dx / Math.max(m, R);
    touchMove.z = dy / Math.max(m, R);
    if (touchMove.z > .3) autoWalk = false;   // pulling back cancels auto-walk
  });
  const joyEnd = e => {
    if (e.pointerId !== joyPtr) return;
    joyPtr = null;
    touchMove.x = 0; touchMove.z = 0;
    nub.style.transform = '';
  };
  joy.addEventListener('pointerup', joyEnd);
  joy.addEventListener('pointercancel', joyEnd);

  bindHold($('tb-jump'), 'Space');
  bindHold($('tb-act'), 'KeyE');
  bindHold($('tb-trade'), 'KeyT');

  $('tb-walk').addEventListener('click', () => {
    autoWalk = !autoWalk;
    $('tb-walk').classList.toggle('on', autoWalk);
  });
  $('tb-menu').addEventListener('click', () => toggleEscMenu());
  $('tb-quests').addEventListener('click', () => toggleWindow('tracker'));
  $('tb-deck').addEventListener('click', () => {
    if (!tradeOpen && !shopOpen && !fullmapOpen) toggleDeckbuilder();
  });
  $('tb-chat').addEventListener('click', () => {
    const chat = $('chatinput');
    if (chat.style.display === 'block') { chat.style.display = 'none'; chat.blur(); }
    else { chat.style.display = 'block'; chat.focus(); }
  });
}

// main.js calls this each frame: the world touch controls yield to any
// full-screen surface, and the auto-walk chip mirrors keyboard R too.
export function tickTouchUI() {
  if (!isTouch) return;
  const hide = duelActive || deckbuilderOpen || fullmapOpen || escMenuOpen;
  $('touchui').style.display = hide ? 'none' : '';
  $('tb-walk').classList.toggle('on', autoWalk);
}
