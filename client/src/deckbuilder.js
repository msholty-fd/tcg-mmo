// Deck builder (toggle with B). Collection grid groups instances by card;
// clicking adds the best unused copy that fits the Legend Budget. Right-click
// a card to open its Chronicle — every copy's history and provenance.

import { $ } from './utils.js';
import { allCards, getCard } from '../../shared/engine/cards.js';
import { levelOf, levelPoints, LEVEL_NAMES, LEGEND_BUDGET, RENOWN_THRESHOLDS } from '../../shared/chronicle.js';
import { getCards, getDeck, getInstance, setDeck } from './collection.js';
import { log } from './ui.js';
import { artFor } from './pixelArt.js';
import { FAMILIES } from '../../shared/sets/core/families.js';

export const DECK_SIZE = 30;
export const MAX_COPIES = 3;

export let deckbuilderOpen = false;

let working = [];   // selected instance iids

// ---- collection organization: family grouping (core set) + set tabs ----
// families.js is a curated cardId -> family mapping kept OUT of cards.js on
// purpose (see DESIGN.md) so the deck builder can show flavorful sections
// without touching a field on every card definition, and without colliding
// with concurrent sessions that edit cards.js constantly. Non-core sets
// (e.g. emberpeaks) have no family data yet and get their own ungrouped
// set-section instead, driven straight off each card's `.set` — new sets
// need zero deckbuilder.js changes to show up as a tab.
const FAMILY_BY_CARD = new Map();
for (const fam of FAMILIES) for (const id of fam.cardIds) FAMILY_BY_CARD.set(id, fam.id);
const UNCATEGORIZED = { id: 'uncategorized', name: 'Uncategorized' };
const SET_LABELS = { core: 'Core', emberpeaks: 'The Emberpeaks' };
const labelForSet = s => SET_LABELS[s] || (s.charAt(0).toUpperCase() + s.slice(1));

function familyOf(cardId) {
  const famId = FAMILY_BY_CARD.get(cardId);
  return FAMILIES.find(f => f.id === famId) || UNCATEGORIZED;
}

let activeSet = 'all';      // 'all' | 'core' | any other card.set value (e.g. 'emberpeaks')
let activeFamily = 'all';   // 'all' | a FAMILIES id | 'uncategorized'

// Group all registered cards into display sections honoring the current
// set/family filters. Core cards are grouped by family (FAMILIES order,
// Uncategorized last); every other set gets one ungrouped section, shown
// only when the family filter is 'all' (family filtering doesn't apply to
// sets with no family data — picking a non-core set tab resets it, see
// renderFilters()).
function buildSections() {
  const all = allCards();
  const setIds = [...new Set(all.map(c => c.set))];
  const sections = [];

  if ((activeSet === 'all' || activeSet === 'core') && setIds.includes('core')) {
    const byFam = new Map();
    for (const def of all.filter(c => c.set === 'core')) {
      const fam = familyOf(def.id);
      if (!byFam.has(fam.id)) byFam.set(fam.id, { id: fam.id, name: fam.name, cards: [] });
      byFam.get(fam.id).cards.push(def);
    }
    for (const f of [...FAMILIES, UNCATEGORIZED]) {
      if (!byFam.has(f.id)) continue;
      if (activeFamily !== 'all' && activeFamily !== f.id) continue;
      sections.push(byFam.get(f.id));
    }
  }

  if (activeFamily === 'all') {
    for (const s of setIds) {
      if (s === 'core') continue;
      if (activeSet !== 'all' && activeSet !== s) continue;
      sections.push({ id: 'set:' + s, name: labelForSet(s), cards: all.filter(c => c.set === s) });
    }
  }

  return sections;
}

function renderFilters() {
  const all = allCards();
  const setIds = [...new Set(all.map(c => c.set))];

  const tabs = $('db-tabs');
  tabs.innerHTML = '';
  const tabDefs = [{ id: 'all', label: 'All Sets' }, ...setIds.map(s => ({ id: s, label: labelForSet(s) }))];
  for (const t of tabDefs) {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    if (activeSet === t.id) btn.classList.add('active');
    btn.onclick = () => {
      activeSet = t.id;
      if (t.id !== 'all' && t.id !== 'core') activeFamily = 'all';   // non-core sets have no families
      renderFilters();
      renderGrid();
    };
    tabs.appendChild(btn);
  }

  const chips = $('db-chips');
  chips.innerHTML = '';
  if (activeSet === 'all' || activeSet === 'core') {
    const coreCards = all.filter(c => c.set === 'core');
    const hasUncategorized = coreCards.some(c => !FAMILY_BY_CARD.has(c.id));
    const famDefs = [{ id: 'all', name: 'All' }, ...FAMILIES, ...(hasUncategorized ? [UNCATEGORIZED] : [])];
    for (const f of famDefs) {
      const btn = document.createElement('button');
      btn.textContent = f.name;
      if (activeFamily === f.id) btn.classList.add('active');
      btn.onclick = () => { activeFamily = f.id; renderFilters(); renderGrid(); };
      chips.appendChild(btn);
    }
    chips.style.display = '';
  } else {
    chips.style.display = 'none';
  }
}

export function toggleDeckbuilder() {
  if (deckbuilderOpen) close();
  else open();
}

function open() {
  deckbuilderOpen = true;
  working = getDeck().filter(iid => getInstance(iid));
  $('deckbuilder').classList.add('open');
  renderFilters();
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

  renderGrid();

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

// Rebuilds just the collection grid (card slots grouped into family/set
// sections) — split out from render() so clicking a filter tab/chip doesn't
// need to touch the deck count/legend/deck-list.
function renderGrid() {
  // group owned instances by cardId
  const groups = new Map();
  for (const inst of getCards()) {
    if (!groups.has(inst.cardId)) groups.set(inst.cardId, []);
    groups.get(inst.cardId).push(inst);
  }
  for (const g of groups.values()) g.sort((a, b) => b.renown - a.renown);

  const grid = $('db-grid');
  grid.innerHTML = '';

  for (const section of buildSections()) {
    const header = document.createElement('div');
    header.className = 'db-fam-header';
    header.textContent = section.name;
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = `(${section.cards.length})`;
    header.appendChild(n);
    grid.appendChild(header);

    const cards = section.cards.slice().sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
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
