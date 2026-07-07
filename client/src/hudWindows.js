// Movable, closable HUD windows. Each registered panel gets a ✕ button and
// drag-to-move; positions and open/closed state persist in localStorage.
// Closed windows reopen with their hotkey (wired in input.js via toggleWindow).

import { $ } from './utils.js';
import { log } from './ui.js';

const KEY = 'emberwood.hud';

let state = {};   // id -> {x, y, open}
try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}

const save = () => localStorage.setItem(KEY, JSON.stringify(state));

const windows = new Map();   // id -> {el, label, key}

export function isOpen(id) { return state[id]?.open !== false; }

export function toggleWindow(id) {
  const w = windows.get(id);
  if (!w) return;
  const open = !isOpen(id);
  (state[id] ||= {}).open = open;
  save();
  applyVisibility(id);
  if (open) log(w.label + ' shown.', 'sys');
}

function applyVisibility(id) {
  const w = windows.get(id);
  // #prompt's display is driven per-frame by main.js (via isOpen); others directly
  if (id !== 'prompt') w.el.style.display = isOpen(id) ? '' : 'none';
}

function applyPosition(id) {
  const w = windows.get(id), s = state[id];
  if (!s || s.x === undefined) return;
  const el = w.el;
  el.style.left = Math.max(0, Math.min(s.x, innerWidth - 60)) + 'px';
  el.style.top = Math.max(0, Math.min(s.y, innerHeight - 40)) + 'px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.transform = 'none';
}

function makeDraggable(id, el) {
  el.style.pointerEvents = 'auto';
  el.addEventListener('mousedown', e => {
    if (e.target.closest('.hud-close') || e.target.closest('button,input,a')) return;
    e.stopPropagation();   // don't let the camera-drag handler see this
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const offX = e.clientX - r.left, offY = e.clientY - r.top;
    const move = ev => {
      (state[id] ||= {}).x = ev.clientX - offX;
      state[id].y = ev.clientY - offY;
      applyPosition(id);
    };
    const up = () => {
      removeEventListener('mousemove', move);
      removeEventListener('mouseup', up);
      save();
    };
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
  });
}

export function registerWindow(id, { label, key }) {
  const el = $(id);
  const btn = document.createElement('span');
  btn.className = 'hud-close';
  btn.title = 'Close (' + key + ' to reopen)';
  btn.textContent = '✕';
  btn.addEventListener('click', e => { e.stopPropagation(); toggleWindow(id); });
  el.appendChild(btn);
  windows.set(id, { el, label, key });
  makeDraggable(id, el);
  applyPosition(id);
  applyVisibility(id);
}

export function initHudWindows() {
  registerWindow('tracker', { label: 'Quest tracker', key: 'Q' });
  registerWindow('hints', { label: 'Controls', key: 'H' });
  registerWindow('prompt', { label: 'Interact prompt', key: 'P' });
}
