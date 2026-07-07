// Esc menu: resume, toggle controls panel, log out.
// Opened/closed by the Escape key (wired in input.js).

import { $ } from './utils.js';
import { toggleWindow } from './hudWindows.js';

export let escMenuOpen = false;

export function toggleEscMenu() {
  escMenuOpen = !escMenuOpen;
  $('escmenu').classList.toggle('open', escMenuOpen);
}

export function initEscMenu({ onLogout }) {
  $('esc-resume').addEventListener('click', toggleEscMenu);
  $('esc-help').addEventListener('click', () => { toggleWindow('hints'); toggleEscMenu(); });
  $('esc-logout').addEventListener('click', onLogout);
}
