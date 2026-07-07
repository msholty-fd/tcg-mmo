// Player trading (T near a player). The server owns the session; this window
// renders tradeState and sends offer changes. Rows carry [data-card]/[data-level]
// so the hover inspector works on trade rows like everywhere else.

import { $ } from './utils.js';
import { getCard } from '../../shared/engine/cards.js';
import { levelOf, LEVEL_NAMES } from '../../shared/chronicle.js';
import { getCards, getDeck, getInstance } from './collection.js';
import { player } from './state.js';
import { log } from './ui.js';

export let tradeOpen = false;

let net = null;              // {sendTradeOffer, sendTradeConfirm, sendTradeCancel, sendTradeAccept}
let myIids = [];             // instance iids in my offer
let confirmedMe = false;
let pendingInvite = null;    // {from, name}

const STARS = '·✦★☆';

function row(inst, { removable } = {}) {
  const def = getCard(inst.cardId);
  const lvl = levelOf(inst.renown);
  const el = document.createElement('div');
  el.className = 't-row lv' + lvl;
  el.dataset.card = inst.cardId;
  el.dataset.level = lvl;
  el.innerHTML = `<span class="cost">${def.cost}</span><span class="n">${def.name}</span>` +
    `<span class="lv">${lvl ? STARS[lvl] + ' ' + LEVEL_NAMES[lvl] : ''}</span>` +
    `<span class="rn">${inst.renown} renown</span>`;
  el.title = removable ? 'Click to remove from your offer' : '';
  return el;
}

function tradableCards() {
  const decked = new Set(getDeck());
  return getCards().filter(c => !decked.has(c.iid))
    .sort((a, b) => getCard(a.cardId).cost - getCard(b.cardId).cost || b.renown - a.renown);
}

function sendOffer() {
  const coins = Math.max(0, Math.floor(+$('t-coins').value || 0));
  net.sendTradeOffer(myIids, Math.min(coins, player.coins));
}

function renderMine() {
  const yours = $('t-yours');
  yours.innerHTML = '';
  for (const iid of myIids) {
    const inst = getInstance(iid);
    if (!inst) continue;
    const el = row(inst, { removable: true });
    el.onclick = () => { myIids = myIids.filter(i => i !== iid); sendOffer(); };
    yours.appendChild(el);
  }
  const pool = $('t-pool');
  pool.innerHTML = '';
  for (const inst of tradableCards()) {
    if (myIids.includes(inst.iid)) continue;
    const el = row(inst);
    el.title = 'Click to add to your offer';
    el.onclick = () => {
      if (myIids.length >= 8) { log('A trade can hold at most 8 cards per side.', 'sys'); return; }
      myIids.push(inst.iid);
      sendOffer();
    };
    pool.appendChild(el);
  }
}

// ---- messages from the server (wired by net.js) ----

export function onTradeInvite(msg) {
  pendingInvite = msg;
  $('ti-name').textContent = msg.name;
  $('tradeinvite').style.display = 'flex';
  setTimeout(() => { if (pendingInvite?.from === msg.from) dismissInvite(); }, 15000);
}

function dismissInvite() {
  pendingInvite = null;
  $('tradeinvite').style.display = 'none';
}

export function onTradeStart(msg) {
  dismissInvite();
  tradeOpen = true;
  myIids = [];
  confirmedMe = false;
  $('t-partner').textContent = msg.partner;
  $('t-theirs-title').textContent = msg.partner + ' offers';
  $('t-coins').value = 0;
  $('trade').style.display = 'flex';
  renderMine();
  renderStatus([false, false]);
  log('Trade opened with ' + msg.partner + '.', 'sys');
}

export function onTradeState(msg) {
  if (!tradeOpen) return;
  myIids = msg.yours.iids;
  if (document.activeElement !== $('t-coins')) $('t-coins').value = msg.yours.coins;
  const theirs = $('t-theirs');
  theirs.innerHTML = '';
  for (const inst of msg.theirs.cards) theirs.appendChild(row(inst));
  $('t-their-coins').textContent = '🪙 ' + msg.theirs.coins;
  renderMine();
  renderStatus(msg.confirmed);
}

function renderStatus([me, them]) {
  confirmedMe = me;
  const st = $('t-status');
  st.textContent = me && them ? 'Completing…'
    : me ? 'You confirmed — waiting for them.'
    : them ? 'They confirmed! Review and confirm to complete.'
    : 'Both sides must confirm. Changing anything resets confirmations.';
  st.className = them ? 'good' : '';
  $('t-confirm').classList.toggle('confirmed', me);
  $('t-confirm').disabled = me;
}

export function onTradeComplete() {
  log('Trade completed! Check your collection.', 'ding');
  close();
}

export function onTradeCancelled(msg) {
  if (tradeOpen || pendingInvite) log('Trade cancelled' + (msg.reason ? ' — ' + msg.reason : '.'), 'sys');
  dismissInvite();
  close();
}

function close() {
  tradeOpen = false;
  myIids = [];
  $('trade').style.display = 'none';
}

export function cancelTrade() {
  if (tradeOpen) net.sendTradeCancel();
  close();
}

export function initTrade(netApi) {
  net = netApi;
  $('ti-accept').addEventListener('click', () => {
    if (pendingInvite) { net.sendTradeAccept(pendingInvite.from); dismissInvite(); }
  });
  $('ti-decline').addEventListener('click', dismissInvite);
  $('t-cancel').addEventListener('click', cancelTrade);
  $('t-confirm').addEventListener('click', () => { if (!confirmedMe) net.sendTradeConfirm(); });
  $('t-coins').addEventListener('change', sendOffer);
}
