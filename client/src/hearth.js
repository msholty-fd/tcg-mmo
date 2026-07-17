// The hearth-draft window (Phase 1 of the drafting epic, .claude/DRAFTING.md):
// E at a registry fire (shared/fires.js) when no NPC or player business is
// nearer opens the fire's offering — the embers the realm's play has left
// there. Click an ember to draft it: the server validates proximity, the
// per-fire cooldown, and pool membership, then mints (draftPick in
// server/handlers/hearth.js). What you take is gone for the next visitor —
// the world is the pack. Cards carry [data-card] so the hover inspector
// works on the offering like everywhere else.

import { $ } from './utils.js';
import { FIRES, HEARTH_RANGE } from '../../shared/fires.js';
import { getCard } from '../../shared/engine/cards.js';
import { artFor } from './pixelArt.js';
import { player } from './state.js';
import { log } from './ui.js';

export let hearthOpen = false;
let net = null;
let fire = null;   // the fire currently open in the window
let view = null;   // last hearthView for that fire

export function nearestFire() {
  let best = null, bd = HEARTH_RANGE;
  for (const f of FIRES) {
    const d = Math.hypot(f.x - player.x, f.z - player.z);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

export function openHearth(f) {
  if (!net?.isConnected()) {
    log('The fire keeps its memories to itself while the realm sleeps — reconnect to draft.', 'sys');
    return;
  }
  fire = f;
  view = null;
  hearthOpen = true;
  $('hearth').style.display = 'flex';
  $('h-name').textContent = f.name;
  $('h-cards').innerHTML = '<div class="h-empty">Reading the fire…</div>';
  $('h-cd').textContent = '';
  net.sendHearthView(f.id);
}

export function closeHearth() {
  hearthOpen = false;
  fire = null;
  $('hearth').style.display = 'none';
}

const canPick = () => view && Date.now() >= view.nextPickAt;

function render() {
  const wrap = $('h-cards');
  wrap.innerHTML = '';
  if (!view.cards.length) {
    wrap.innerHTML = '<div class="h-empty">Only ash and quiet — the fire holds nothing right now.</div>';
  }
  for (const id of view.cards) {
    const def = getCard(id);
    if (!def) continue;
    const el = document.createElement('div');
    el.className = 's-card r-' + def.rarity + (canPick() ? ' pickable' : '');
    el.dataset.card = id;
    const art = artFor(id);
    el.innerHTML = (art ? `<img src="${art}" alt="">` : '') +
      `<div class="n">${def.name}</div><div class="r">${def.rarity}</div>`;
    el.addEventListener('click', () => {
      if (canPick()) net.sendDraftPick(fire.id, id);
    });
    wrap.appendChild(el);
  }
  const wait = view.nextPickAt - Date.now();
  $('h-cd').textContent = wait > 0
    ? `The fire has given you its due — another ember in ${Math.ceil(wait / 60_000)}m.`
    : view.cards.length ? 'Take one ember. It leaves this fire with you.' : '';
}

export function onHearthView(msg) {
  if (!hearthOpen || !fire || msg.fire !== fire.id) return;
  view = msg;
  render();
}

export function onDraftResult(msg) {
  if (msg.error) { log(msg.error, 'sys'); return; }
  log(`You draft ${getCard(msg.cardId)?.name || msg.cardId} from the fire — it burns for you now.`, 'sys');
}

export function initHearth(netApi) {
  net = netApi;
  $('h-close').addEventListener('click', closeHearth);
}
