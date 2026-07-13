// The vendor pack shop (E on a vendor NPC when they have no quest business).
// Generalized over PACKS (one window, any vendor): openShop(pack) renders
// whichever pack the vendor sells. The server validates coins/proximity and
// mints the cards; this window renders the pack on offer and the reveal.
// Cards carry [data-card] so the hover inspector works on pulls like
// everywhere else.

import { $ } from './utils.js';
import { getCard } from '../../shared/engine/cards.js';
import { artFor } from './pixelArt.js';
import { player } from './state.js';
import { log } from './ui.js';

export let shopOpen = false;
let net = null;
let pack = null;   // the pack currently on offer (set by openShop)

function renderCoins() {
  $('s-coins').textContent = '🪙 ' + player.coins;
  $('s-buy').disabled = !pack || player.coins < pack.price;
}

export function openShop(p) {
  if (!net?.isConnected()) {
    log(`The realm is quiet — ${p.vendor.name} has nothing to sell offline.`, 'sys');
    return;
  }
  pack = p;
  shopOpen = true;
  $('shop').style.display = 'flex';
  $('s-reveal').innerHTML = '';
  $('s-vendor').textContent = pack.vendor.name;
  $('s-packname').textContent = pack.name;
  $('s-packdesc').textContent = pack.desc;
  $('s-buy').textContent = `Buy — 🪙 ${pack.price}`;
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
  $('s-buy').addEventListener('click', () => pack && net.sendBuyPack(pack.id));
  $('s-close').addEventListener('click', closeShop);
}
