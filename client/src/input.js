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

  if (e.code === 'KeyB' && !tradeOpen && !shopOpen && !fullmapOpen) { toggleDeckbuilder(); return; }
  if (e.code === 'KeyM' && !tradeOpen && !shopOpen && !deckbuilderOpen) { toggleFullmap(); return; }
  if (HUD_KEYS[e.code]) { toggleWindow(HUD_KEYS[e.code]); return; }
  if (deckbuilderOpen || tradeOpen || shopOpen || fullmapOpen) return;
  if (e.code === 'Space') e.preventDefault();
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });

addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
addEventListener('mouseup', () => { dragging = false; });
addEventListener('mousemove', e => {
  if (!dragging || duelActive || deckbuilderOpen || fullmapOpen) return;
  cam.yaw -= (e.clientX - lastX) * .005;
  cam.pitch = clamp(cam.pitch + (e.clientY - lastY) * .003, -.55, 1.45);   // look up at the sky, down from above
  lastX = e.clientX; lastY = e.clientY;
});
