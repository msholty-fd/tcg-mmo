// The Wardrobe — faction regalia panel (O). Purely cosmetic dress-up gated by
// faction standing (shared/cosmetics.js): each faction's pieces open as they
// come to know you (effective rank, champion vouches included — same math as
// the deck builder's locks). Inventory semantics: only pieces you've EARNED
// are shown, with a one-line tease of when the faction will offer more.
//
// The panel is a fitting room: a live mannequin (its own small THREE
// renderer, rotating) wears your current set; hovering a piece previews it
// on the mannequin, clicking equips (or doffs) it. Equips are optimistic
// locally and sent to the server, which re-validates and persists
// (setAppearance); other players see the change through the presence
// snapshot. Icons are palette-swapped garment sprites (pixelArt.js) built
// from the item's mesh color, so icon and 3D look can't drift apart.

import * as THREE from 'three';
import { $ } from './utils.js';
import { log } from './ui.js';
import { player } from './state.js';
import { scene } from './scene.js';
import { humanoid, makeLabel } from './entities.js';
import { STARTERS } from './constants.js';
import { getCards } from './collection.js';
import { spriteArt } from './pixelArt.js';
import { WARDROBE, itemById, validAppearance } from '../../shared/cosmetics.js';
import { FACTIONS, RANK_NAMES, effectiveRanks } from '../../shared/factions.js';

export let wardrobeOpen = false;

let net = null;   // {sendAppearance} — wired by initWardrobe (net.js)

const SLOT_LABELS = { head: 'Head', body: 'Body', legs: 'Legs', back: 'Back' };
const SLOT_SPRITE = { head: 'garb_head', body: 'garb_body', legs: 'garb_legs', back: 'garb_back' };

const myRanks = () => effectiveRanks({ factions: player.factions, cards: getCards() });

// ---- look resolution --------------------------------------------------------
// appearance {slot: itemId} over the starter outfit's base colors → the
// option bag humanoid() takes. Used for the local player AND remotes.
export function lookOpts(outfitKey, appearance) {
  const s = STARTERS[outfitKey] || STARTERS.boarherd;
  const it = slot => itemById(appearance?.[slot]);
  const head = it('head'), body = it('body'), legs = it('legs'), back = it('back');
  return {
    shirt: body ? body.color : s.shirt,
    hat: head ? head.color : s.hat,
    legs: legs ? legs.color : undefined,
    cape: back ? back.color : null,
    capeGlow: back ? back.glow : null,
  };
}

// Rebuild the local player's mesh in place (equip, or server-synced look on
// welcome). Position/rotation carry over; the update loop owns them per-frame.
export function refreshPlayerMesh() {
  if (!player.mesh) return;
  const old = player.mesh;
  const mesh = humanoid(lookOpts(player.outfitKey, player.appearance));
  const lb = makeLabel(player.name, '#ffffff', 24); lb.position.y = 2.9; mesh.add(lb);
  mesh.position.copy(old.position);
  mesh.rotation.y = old.rotation.y;
  scene.remove(old);
  scene.add(mesh);
  player.mesh = mesh;
}

// ---- garment icons ----------------------------------------------------------
// Palette derived from the item's mesh color: c cloth, C shade, h highlight
// (glow items highlight in their smolder tint instead).
const css = n => '#' + n.toString(16).padStart(6, '0');
function tint(n, f) {
  const ch = s => Math.min(255, Math.round(((n >> s) & 255) * f));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
const itemIcon = item => spriteArt(SLOT_SPRITE[item.slot], {
  c: css(item.color),
  C: tint(item.color, .58),
  h: item.glow ? tint(item.glow, 2.2) : tint(item.color, 1.55),
});

// ---- mannequin --------------------------------------------------------------
// A second tiny renderer, not a viewport of the main one: the panel is DOM
// and the world canvas sits behind everything. The mannequin spins on its
// own rAF while the panel is open.
let pv = null;           // {renderer, scene, camera, mesh}
let pvRaf = 0;
let previewApp = null;   // appearance being shown (hover try-on or the real set)

function ensurePreview() {
  if (pv) return;
  const canvas = $('w-canvas');
  const w = canvas.clientWidth || 190, h = canvas.clientHeight || 250;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  const pscene = new THREE.Scene();
  pscene.add(new THREE.HemisphereLight(0xcfe8ff, 0x3a4a2e, .9));
  const key = new THREE.DirectionalLight(0xfff2d0, 1.1);
  key.position.set(2, 3, 4);
  pscene.add(key);
  const camera = new THREE.PerspectiveCamera(34, w / h, .1, 20);
  camera.position.set(0, 1.6, 5.4);
  camera.lookAt(0, 1.25, 0);
  pv = { renderer, scene: pscene, camera, mesh: null };
}

function disposeMesh(mesh) {
  mesh.traverse(o => {
    o.geometry?.dispose?.();
    if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.(); }
  });
}

function setPreviewLook(appearance) {
  ensurePreview();
  previewApp = appearance;
  const yaw = pv.mesh ? pv.mesh.rotation.y : .6;
  if (pv.mesh) { pv.scene.remove(pv.mesh); disposeMesh(pv.mesh); }
  pv.mesh = humanoid(lookOpts(player.outfitKey, appearance));
  pv.mesh.rotation.y = yaw;
  pv.scene.add(pv.mesh);
  renderPreviewFrame();
}

// One frame — exported so the document.hidden-stall workaround (and tests)
// can force a paint without the rAF loop.
export function renderPreviewFrame() {
  if (pv?.mesh) pv.renderer.render(pv.scene, pv.camera);
}

// test hook: inspect the live preview scene (used by headless verification)
export const previewState = () => pv && {
  sceneKids: pv.scene.children.length,
  meshKids: pv.mesh ? pv.mesh.children.length : null,
  meshYaw: pv.mesh ? +pv.mesh.rotation.y.toFixed(3) : null,
  app: previewApp,
};

function previewLoop() {
  if (!wardrobeOpen || !pv) return;
  if (pv.mesh) pv.mesh.rotation.y += .012;
  renderPreviewFrame();
  pvRaf = requestAnimationFrame(previewLoop);
}

// ---- panel ------------------------------------------------------------------

export function toggleWardrobe() {
  wardrobeOpen = !wardrobeOpen;
  $('wardrobe').classList.toggle('open', wardrobeOpen);
  if (wardrobeOpen) {
    render();
    setPreviewLook(player.appearance || {});
    cancelAnimationFrame(pvRaf);
    pvRaf = requestAnimationFrame(previewLoop);
  } else {
    cancelAnimationFrame(pvRaf);
  }
}

export function closeWardrobe() {
  if (wardrobeOpen) toggleWardrobe();
}

function equip(item) {
  const app = { ...(player.appearance || {}) };
  if (app[item.slot] === item.id) delete app[item.slot];   // tap again to doff
  else app[item.slot] = item.id;
  // same validation the server runs — a rank we don't hold never leaves here
  if (!validAppearance({ factions: player.factions, cards: getCards() }, app)) {
    log(`${item.name} needs ${RANK_NAMES[item.rank]} standing with ${FACTIONS.find(f => f.id === item.faction).name}.`, 'bad');
    return;
  }
  player.appearance = app;
  refreshPlayerMesh();
  setPreviewLook(app);
  net?.sendAppearance(app);
  render();
}

// The tease line: the next rank at which this faction offers something new.
function nextOffer(factionId, rank) {
  const next = WARDROBE.filter(i => i.faction === factionId && i.rank > rank)
    .reduce((m, i) => Math.min(m, i.rank), Infinity);
  return next === Infinity ? '' : `more when you are ${RANK_NAMES[next]}`;
}

function render() {
  const ranks = myRanks();
  const app = player.appearance || {};
  const rows = FACTIONS.map(f => {
    const rank = ranks[f.id] || 0;
    const owned = WARDROBE.filter(i => i.faction === f.id && i.rank <= rank);
    if (!owned.length) return '';   // inventory semantics: unearned = unseen
    const chips = owned.map(item => {
      const worn = app[item.slot] === item.id;
      return `<button class="w-item${worn ? ' worn' : ''}" data-item="${item.id}">
        <img src="${itemIcon(item)}" alt="">
        <span class="w-name">${item.name}</span>
        <span class="w-slot">${worn ? 'Worn · ' : ''}${SLOT_LABELS[item.slot]}</span>
      </button>`;
    }).join('');
    const tease = nextOffer(f.id, rank);
    return `<div class="w-row">
      <div class="w-fac">${f.name} <b>${RANK_NAMES[rank]}</b>${tease ? `<span class="w-tease">${tease}</span>` : ''}</div>
      <div class="w-items">${chips}</div>
    </div>`;
  }).join('');
  $('w-list').innerHTML = rows ||
    '<div class="w-empty">No faction knows you yet. Play their cards, be witnessed — they dress the people they trust.</div>';
}

export function initWardrobe(netApi) {
  net = netApi;
  $('w-close').addEventListener('click', closeWardrobe);
  $('w-bare').addEventListener('click', () => {
    player.appearance = {};
    refreshPlayerMesh();
    setPreviewLook({});
    net?.sendAppearance({});
    render();
  });
  const list = $('w-list');
  list.addEventListener('click', e => {
    const btn = e.target.closest('.w-item');
    if (btn) equip(itemById(btn.dataset.item));
  });
  // hover = try it on the mannequin (hovering a worn piece previews the
  // doff); leaving reverts to the equipped set. Touch has no hover — tap
  // equips and the mannequin updates through equip() itself.
  list.addEventListener('mouseover', e => {
    const btn = e.target.closest('.w-item');
    if (!btn) return;
    const item = itemById(btn.dataset.item);
    const tryOn = { ...(player.appearance || {}) };
    if (tryOn[item.slot] === item.id) delete tryOn[item.slot];
    else tryOn[item.slot] = item.id;
    setPreviewLook(tryOn);
  });
  list.addEventListener('mouseout', e => {
    if (e.target.closest('.w-item') && previewApp !== player.appearance) {
      setPreviewLook(player.appearance || {});
    }
  });
}
