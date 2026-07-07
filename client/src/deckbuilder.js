// Deck builder (toggle with B). Collection grid groups instances by card;
// clicking adds the best unused copy that fits the Legend Budget. Right-click
// a card to open its Chronicle — every copy's history and provenance.

import { $ } from './utils.js';
import { allCards, getCard } from '../../shared/engine/cards.js';
import { levelOf, levelPoints, LEVEL_NAMES, LEGEND_BUDGET, RENOWN_THRESHOLDS } from '../../shared/chronicle.js';
import { getCards, getDeck, getInstance, setDeck } from './collection.js';
import { log } from './ui.js';
import { artFor } from './pixelArt.js';

export const DECK_SIZE = 30;
export const MAX_COPIES = 3;

export let deckbuilderOpen = false;

let working = [];   // selected instance iids

export function toggleDeckbuilder() {
  if (deckbuilderOpen) close();
  else open();
}

function open() {
  deckbuilderOpen = true;
  working = getDeck().filter(iid => getInstance(iid));
  $('deckbuilder').classList.add('open');
  render();
}

function close() {
  deckbuilderOpen = false;
  $('deckbuilder').classList.remove('open');
  $('chronicle').style.display = 'none';
}

const instLevel = inst => levelOf(inst.renown);
const budgetUsed = () => working.reduce((s, iid) => s + levelPoints(instLevel(getInstance(iid))), 0);

function render() {
  const total = working.length;
  const legend = budgetUsed();

  const count = $('db-count');
  count.textContent = total + ' / ' + DECK_SIZE;
  count.className = total === DECK_SIZE ? 'good' : 'bad';
  $('db-legend').textContent = `Legend ${legend}/${LEGEND_BUDGET}`;
  $('db-legend').className = legend > LEGEND_BUDGET ? 'bad' : '';
  $('db-save').disabled = total !== DECK_SIZE || legend > LEGEND_BUDGET;

  // group owned instances by cardId
  const groups = new Map();
  for (const inst of getCards()) {
    if (!groups.has(inst.cardId)) groups.set(inst.cardId, []);
    groups.get(inst.cardId).push(inst);
  }
  for (const g of groups.values()) g.sort((a, b) => b.renown - a.renown);

  const grid = $('db-collection');
  grid.innerHTML = '';
  const cards = allCards().slice().sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  for (const def of cards) {
    const owned = groups.get(def.id) || [];
    const inDeck = working.filter(iid => getInstance(iid).cardId === def.id).length;
    const best = owned[0];
    const slot = document.createElement('div');
    slot.className = 'db-slot';
    const el = cardEl(def, best ? instLevel(best) : 0);
    if (!owned.length) el.classList.add('none');
    const badge = document.createElement('div');
    badge.className = 'owned' + (inDeck ? ' indeck' : '');
    badge.textContent = inDeck ? `${inDeck} in deck · own ${owned.length}` : `own ${owned.length}`;
    slot.appendChild(el); slot.appendChild(badge);
    el.onclick = () => addCopy(def.id, groups);
    el.oncontextmenu = ev => { ev.preventDefault(); if (owned.length) showChronicle(def, owned); };
    grid.appendChild(slot);
  }

  // deck list, grouped
  const list = $('db-deck-list');
  list.innerHTML = '';
  const deckGroups = new Map();
  for (const iid of working) {
    const inst = getInstance(iid);
    if (!deckGroups.has(inst.cardId)) deckGroups.set(inst.cardId, []);
    deckGroups.get(inst.cardId).push(inst);
  }
  const rows = [...deckGroups.entries()]
    .map(([id, insts]) => ({ def: getCard(id), insts }))
    .sort((a, b) => a.def.cost - b.def.cost || a.def.name.localeCompare(b.def.name));
  for (const { def, insts } of rows) {
    const stars = insts.map(i => '·✦★☆'[instLevel(i)] || '·').join('');
    const row = document.createElement('div');
    row.className = 'db-row';
    row.dataset.card = def.id;
    row.dataset.level = Math.max(...insts.map(instLevel));   // show the best copy
    row.innerHTML = `<span class="cost">${def.cost}</span><span class="n">${def.name}</span><span class="lv">${stars}</span><span class="ct">×${insts.length}</span>`;
    row.title = 'Click to remove one copy (lowest renown first)';
    row.onclick = () => {
      const lowest = insts.reduce((a, b) => a.renown <= b.renown ? a : b);
      working.splice(working.indexOf(lowest.iid), 1);
      render();
    };
    list.appendChild(row);
  }
}

function addCopy(cardId, groups) {
  const owned = groups.get(cardId) || [];
  const inDeck = working.filter(iid => getInstance(iid).cardId === cardId).length;
  if (!owned.length || inDeck >= Math.min(owned.length, MAX_COPIES) || working.length >= DECK_SIZE) return;
  const unused = owned.filter(i => !working.includes(i.iid));
  if (!unused.length) return;
  // prefer the highest-renown copy that fits the Legend Budget
  const room = LEGEND_BUDGET - budgetUsed();
  const pick = unused.find(i => levelPoints(instLevel(i)) <= room) || unused[unused.length - 1];
  working.push(pick.iid);
  render();
}

function cardEl(def, level = 0) {
  const el = document.createElement('div');
  el.className = 'dcard' + (def.type !== 'creature' ? ' spell' : '') + (level ? ' lv' + level : '');
  el.dataset.card = def.id; el.dataset.level = level;
  const b = level >= 3 ? 2 : level >= 2 ? 1 : 0;
  const art = artFor(def.id);
  el.innerHTML = `<div class="cost">${def.cost}</div>
    ${art ? `<div class="art"><img src="${art}" alt=""></div>` : ''}
    <div class="cname">${def.name}</div>
    <div class="ctext">${def.text || def.flavor || ''}</div>
    <div class="stats"><span class="atk">${def.atk != null ? def.atk + b : ''}</span><span class="hp">${def.hp != null ? def.hp + b : ''}</span></div>`;
  return el;
}

// ---- the Chronicle panel: a card's copies and their histories ----
function showChronicle(def, insts) {
  $('ch-title').textContent = def.name;
  const list = $('ch-list');
  list.innerHTML = '';
  for (const inst of insts) {
    const lvl = instLevel(inst);
    const next = RENOWN_THRESHOLDS[lvl];
    const r = inst.record;
    const owners = inst.owners?.length ? inst.owners.join(' → ') : 'unknown hands';
    const div = document.createElement('div');
    div.className = 'ch-card lv' + lvl;
    div.innerHTML = `
      <div class="ch-head"><b>${LEVEL_NAMES[lvl]}</b><span>${inst.renown} renown${next ? ' · ' + (next - inst.renown) + ' to next' : ' · MAX'}</span></div>
      <div class="ch-line">${inst.origin} · ${new Date(inst.minted).toLocaleDateString()}</div>
      <div class="ch-line">Held by: ${owners}</div>
      <div class="ch-line">${r.duels} duels · ${r.wins} wins · ${r.kills} slain · ${r.hearthDmg} hearth burned</div>
      ${lvl >= 2 ? `<div class="ch-line bonus">+${lvl >= 3 ? 2 : 1}/+${lvl >= 3 ? 2 : 1}${lvl >= 3 && def.storiedKeyword ? ' · ' + def.storiedKeyword : ''}</div>` : ''}`;
    list.appendChild(div);
  }
  $('chronicle').style.display = 'block';
}

export function initDeckbuilder() {
  $('db-close').addEventListener('click', close);
  $('ch-close').addEventListener('click', () => $('chronicle').style.display = 'none');
  $('db-save').addEventListener('click', () => {
    setDeck(working);
    import('./net.js').then(m => m.sendDeckUpdate());
    log('Deck saved (' + working.length + ' cards).', 'sys');
    close();
  });
}
