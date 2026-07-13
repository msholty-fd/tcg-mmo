// The Hall of Legends — the Chronicle made social (DESIGN.md "Narrative
// direction", LORE.md). E on Chronicler Sela at Highgate's shrine opens the
// realm's ledger: the most renowned card instances anywhere, with owner,
// provenance chain, origin, and battle record. Server-computed and
// proximity-validated (the shop pattern); this window only renders.
// Cards carry [data-card] so the hover inspector works on entries.

import { $ } from './utils.js';
import { getCard } from '../../shared/engine/cards.js';
import { LEVEL_NAMES } from '../../shared/chronicle.js';
import { artFor } from './pixelArt.js';
import { log } from './ui.js';

export let hallOpen = false;
let net = null;

export function openHall(n) {
  if (!net?.isConnected()) {
    log('The realm is quiet — ' + n.name + ' cannot read the Chronicle offline.', 'sys');
    return;
  }
  hallOpen = true;
  $('hall').style.display = 'flex';
  $('h-list').innerHTML = '<div class="h-empty">Sela runs a finger down the ledger…</div>';
  net.sendHall();
}

export function closeHall() {
  hallOpen = false;
  $('hall').style.display = 'none';
}

const stars = level => '★'.repeat(level) || '·';

export function onHallOfLegends(msg) {
  if (!hallOpen) return;
  const list = $('h-list');
  if (!msg.entries.length) {
    list.innerHTML = '<div class="h-empty">"The ledger is young. No ember has yet been witnessed enough to name. Go and be seen, duelist."</div>';
    return;
  }
  list.innerHTML = msg.entries.map((e, i) => {
    const def = getCard(e.cardId);
    if (!def) return '';
    const art = artFor(e.cardId);
    const chain = (e.owners || []).join(' → ') || e.owner;
    const r = e.record || { duels: 0, wins: 0, kills: 0 };
    return `<div class="h-row lv${e.level}" data-card="${e.cardId}">
      <div class="h-rank">${i + 1}</div>
      ${art ? `<img src="${art}" alt="">` : ''}
      <div class="h-main">
        <div class="h-name">${def.name} <span class="h-lv">${stars(e.level)} ${LEVEL_NAMES[e.level]} · ${e.renown} renown</span></div>
        <div class="h-sub">held by <b>${e.owner}</b> · ${r.wins}/${r.duels} duels won, ${r.kills} felled</div>
        <div class="h-sub h-prov">${e.origin} · ${chain}</div>
      </div>
    </div>`;
  }).join('');
}

export function initHall(netApi) {
  net = netApi;
  $('h-close').addEventListener('click', closeHall);
}
