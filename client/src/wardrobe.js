// The Wardrobe — faction regalia panel (O). Purely cosmetic dress-up gated by
// faction standing (shared/cosmetics.js): each faction's pieces open as they
// come to know you (effective rank, champion vouches included — same math as
// the deck builder's locks). Equips are optimistic locally and sent to the
// server, which re-validates and persists (setAppearance); other players see
// the change through the presence snapshot.

import { $ } from './utils.js';
import { log } from './ui.js';
import { player } from './state.js';
import { scene } from './scene.js';
import { humanoid, makeLabel } from './entities.js';
import { STARTERS } from './constants.js';
import { getCards } from './collection.js';
import { WARDROBE, itemById, validAppearance } from '../../shared/cosmetics.js';
import { FACTIONS, RANK_NAMES, effectiveRanks } from '../../shared/factions.js';

export let wardrobeOpen = false;

let net = null;   // {sendAppearance} — wired by initWardrobe (net.js)

const SLOT_LABELS = { head: 'Head', body: 'Body', legs: 'Legs', back: 'Back' };

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

// ---- panel ------------------------------------------------------------------

export function toggleWardrobe() {
  wardrobeOpen = !wardrobeOpen;
  $('wardrobe').classList.toggle('open', wardrobeOpen);
  if (wardrobeOpen) render();
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
  net?.sendAppearance(app);
  render();
}

function render() {
  const ranks = myRanks();
  const app = player.appearance || {};
  const rows = FACTIONS.map(f => {
    const rank = ranks[f.id] || 0;
    const chips = WARDROBE.filter(i => i.faction === f.id).map(item => {
      const worn = app[item.slot] === item.id;
      const open = rank >= item.rank;
      const sw = `<span class="w-swatch" style="background:#${item.color.toString(16).padStart(6, '0')}"></span>`;
      const meta = open
        ? SLOT_LABELS[item.slot]
        : `🔒 ${RANK_NAMES[item.rank]}`;
      return `<button class="w-item${worn ? ' worn' : ''}${open ? '' : ' locked'}" data-item="${item.id}">
        ${sw}<span class="w-name">${item.name}</span><span class="w-meta">${meta}</span></button>`;
    }).join('');
    return `<div class="w-row"><div class="w-fac">${f.name} <b>${RANK_NAMES[rank]}</b></div><div class="w-items">${chips}</div></div>`;
  }).join('');
  $('w-list').innerHTML = rows;
  for (const btn of $('w-list').querySelectorAll('.w-item')) {
    btn.addEventListener('click', () => {
      const item = itemById(btn.dataset.item);
      const rank = myRanks()[item.faction] || 0;
      if (rank < item.rank) {
        log(`${item.name} is worn by the ${RANK_NAMES[item.rank]} — play ${FACTIONS.find(f => f.id === item.faction).name} cards to be witnessed.`, 'bad');
        return;
      }
      equip(item);
    });
  }
}

export function initWardrobe(netApi) {
  net = netApi;
  $('w-close').addEventListener('click', closeWardrobe);
  $('w-bare').addEventListener('click', () => {
    player.appearance = {};
    refreshPlayerMesh();
    net?.sendAppearance({});
    render();
  });
}
