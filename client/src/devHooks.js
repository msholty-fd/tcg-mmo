// Local-development test hooks — installs `window.__test` for agent/manual
// verification sessions (pairs with scripts/dev-rig.mjs on the server side).
//
// SECURITY: this module must ONLY ever be imported behind
// `if (import.meta.env.DEV)` (see main.js). Vite replaces that condition
// with a constant at build time, so the import — and this entire file — is
// absent from the production bundle. The build gate greps `client/dist` for
// `__test` to prove it (VERIFICATION.md "Dev rig"). Never import this
// unconditionally, and never put secrets or server trust in here: everything
// below only drives the local UI; all state changes still go through the
// server's normal validation (devSeed is separately env-gated server-side).

import { player } from './state.js';
import { scene, camera, renderer } from './scene.js';
import { wardrobeOpen, renderPreviewFrame } from './wardrobe.js';

const real = (type, sel) =>
  document.querySelector(sel)?.dispatchEvent(new MouseEvent(type, { bubbles: true }));

window.__test = {
  // Become a rig-minted character: store its token + session and reload.
  // (The rig prints a ready-to-paste call after seeding.)
  loginAs(token, name, starter = 'wardens') {
    localStorage.setItem('emberwood.token', token);
    localStorage.setItem('emberwood.session', JSON.stringify({ name, starter, x: 0, z: 9 }));
    localStorage.removeItem('emberwood.collection.v2');
    location.reload();
  },
  logout() {
    localStorage.removeItem('emberwood.token');
    localStorage.removeItem('emberwood.session');
    location.reload();
  },

  // Real KeyboardEvent with e.code — every hotkey gates on e.code, and the
  // browser pane's synthetic keypresses don't set it.
  key(code, key) {
    dispatchEvent(new KeyboardEvent('keydown', { code, key: key ?? code.replace(/^Key/, '').toLowerCase(), bubbles: true }));
  },

  // Real bubbling pointer events — handlers are delegated, and driving them
  // directly has hidden targeting bugs before (CLAUDE.md testing gotchas).
  click: sel => real('click', sel),
  hover: sel => real('mouseover', sel),
  unhover: sel => real('mouseout', sel),

  // One manual frame — the rAF-stall workaround: render, then screenshot.
  renderWorld: () => renderer.render(scene, camera),
  wardrobeFrame: renderPreviewFrame,

  // Everything a verification usually asserts on, in one call.
  state: () => ({
    name: player.name,
    lvl: player.lvl,
    coins: player.coins,
    factions: { ...player.factions },
    appearance: { ...player.appearance },
    pos: { x: +player.x.toFixed(1), z: +player.z.toFixed(1) },
    wardrobeOpen,
    hidden: document.hidden,
  }),
};

console.log('[dev] window.__test hooks installed (dev build only)');
