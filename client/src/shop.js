// Marla's supply-pack shop (E on her when she has no quest business). The
// server validates coins/proximity and mints the cards; this window renders
// the pack on offer and the reveal. Cards carry [data-card] so the hover
// inspector works on pulls like everywhere else.

import { $ } from './utils.js';
import { getCard } from '../../shared/engine/cards.js';
import { PACKS } from '../../shared/sets/core/packs.js';
import { artFor } from './pixelArt.js';
import { player } from './state.js';
import { log } from './ui.js';

export let shopOpen = false;
let net = null;
const PACK = PACKS.boarlands;

function renderCoins() {
  $('s-coins').textContent = '🪙 ' + player.coins;
  $('s-buy').disabled = player.coins < PACK.price;
}

export function openShop() {
  if (!net?.isConnected()) {
    log('The realm is quiet — Marla has nothing to sell offline.', 'sys');
    return;
  }
  shopOpen = true;
  $('shop').style.display = 'flex';
  $('s-reveal').innerHTML = '';
  renderCoins();
}

export function closeShop() {
  shopOpen = false;
  $('shop').style.display = 'none';
}

// profileUpdate (coins + cards) arrives before this, so balances are fresh
export function onPackResult(msg) {
  if (msg.error) { log(msg.error, 'sys'); renderCoins(); return; }
  const reveal = $('s-reveal');
  reveal.innerHTML = '';
  for (const c of msg.cards) {
    const def = getCard(c.cardId);
    const el = document.createElement('div');
    el.className = 's-card r-' + def.rarity;
    el.dataset.card = c.cardId;
    const art = artFor(c.cardId);
    el.innerHTML = (art ? `<img src="${art}" alt="">` : '') +
      `<div class="n">${def.name}</div><div class="r">${def.rarity}</div>`;
    reveal.appendChild(el);
  }
  log('Pack opened: ' + msg.cards.map(c => getCard(c.cardId).name).join(', '), 'sys');
  renderCoins();
}

export function initShop(netApi) {
  net = netApi;
  $('s-buy').addEventListener('click', () => net.sendBuyPack(PACK.id));
  $('s-close').addEventListener('click', closeShop);
  $('s-packname').textContent = PACK.name;
  $('s-buy').textContent = `Buy — 🪙 ${PACK.price}`;
}
