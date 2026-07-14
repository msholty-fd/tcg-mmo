// Deck builder (toggle with B). Collection grid groups instances by card;
// clicking adds the best unused copy that fits the Legend Budget. Right-click
// a card to open its Chronicle — every copy's history and provenance.

import { $ } from './utils.js';
import { allCards, getCard } from '../../shared/engine/cards.js';
import { levelOf, levelPoints, LEVEL_NAMES, LEGEND_BUDGET, RENOWN_THRESHOLDS } from '../../shared/chronicle.js';
import { getCards, getDeck, getLeaders, getInstance, setDeck } from './collection.js';
import { log } from './ui.js';
import { artFor } from './pixelArt.js';
import { FAMILIES } from '../../shared/sets/core/families.js';
import { LEADERS, isLeaderCard } from '../../shared/sets/core/leaders.js';
import { evaluateDeck, leaderRules } from '../../shared/deckConstraints.js';
import { bannerName } from '../../shared/sets/core/banners.js';
import { factionOf, rankOf, factionName, effectiveRanks, standingRank, FACTIONS, RANK_NAMES, RANK_THRESHOLDS, MAX_RANK } from '../../shared/factions.js';
import { player } from './state.js';

export const DECK_SIZE = 30;
export const MAX_COPIES = 3;

export let deckbuilderOpen = false;

let working = [];         // selected instance iids
let workingLeaders = [];  // designated Leader iids (a subset of working)

// --- Leader constraints + faction-rank gating ------------------------------
const leaderCardIds = () => workingLeaders.map(iid => getInstance(iid)?.cardId).filter(Boolean);
// effective faction ranks from the server-mirrored standing + owned champions
// (shared/factions.js — same math the server's validDeck runs)
const myRanks = () => effectiveRanks({ factions: player.factions, cards: getCards() });
// null if buildable, else the faction the card is still locked behind
const lockOf = (cardId, ranks) => {
  const f = factionOf(cardId);
  return f && rankOf(cardId) > (ranks[f] ?? 0) ? f : null;
};
// deck as card defs for the shared constraint engine
const deckDefs = () => working.map(iid => getCard(getInstance(iid).cardId));
const evalDeck = () => evaluateDeck(deckDefs(), leaderCardIds(), myRanks());

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
const SET_LABELS = { core: 'Core', emberpeaks: 'The Emberpeaks', darkwood: 'The Darkwood' };
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

// Faction standing strip — the progression readout: rank name, points, and
// progress to the next threshold per faction; gilded when a champion vouches
// (+1 effective rank; hover title explains). Data mirrors the server
// (player.factions + owned champions), same math validDeck runs.
function renderFactions() {
  const row = $('db-factions');
  row.innerHTML = '';
  const ranks = myRanks();
  for (const f of FACTIONS) {
    const pts = player.factions?.[f.id] || 0;
    const base = standingRank(pts);
    const eff = ranks[f.id];
    const vouched = eff > base;
    const next = base < MAX_RANK ? ` · ${pts}/${RANK_THRESHOLDS[base + 1]}` : ` · ${pts}`;
    const chip = document.createElement('span');
    chip.className = 'fac' + (vouched ? ' vouched' : '');
    chip.title = vouched
      ? `${f.name}: ${RANK_NAMES[base]} by standing, ${RANK_NAMES[eff]} effective — a champion vouches for you`
      : `${f.name}: play their cards in duels to earn standing`;
    chip.innerHTML = `${f.name} <b>${RANK_NAMES[eff]}${vouched ? ' ▲' : ''}</b><span class="pts">${next}</span>`;
    row.appendChild(chip);
  }
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
  workingLeaders = getLeaders().filter(iid => getInstance(iid) && working.includes(iid));
  $('deckbuilder').classList.add('open');
  renderFactions();
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
  const rules = evalDeck();

  const count = $('db-count');
  count.textContent = total + ' / ' + DECK_SIZE;
  count.className = total === DECK_SIZE ? 'good' : 'bad';
  $('db-legend').textContent = `Legend ${legend}/${LEGEND_BUDGET}`;
  $('db-legend').className = legend > LEGEND_BUDGET ? 'bad' : '';
  $('db-save').disabled = total !== DECK_SIZE || legend > LEGEND_BUDGET || !rules.valid;

  renderLeaders(rules);
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
      // a removed Leader loses its designation (it must be in the deck)
      workingLeaders = workingLeaders.filter(iid => iid !== lowest.iid);
      render();
    };
    list.appendChild(row);
  }
}

// owned instances grouped by cardId, best (highest-renown) copy first
function buildOwnedGroups() {
  const groups = new Map();
  for (const inst of getCards()) {
    if (!groups.has(inst.cardId)) groups.set(inst.cardId, []);
    groups.get(inst.cardId).push(inst);
  }
  for (const g of groups.values()) g.sort((a, b) => b.renown - a.renown);
  return groups;
}

// ---- Leaders panel: banner toggles + live rule/gate readout --------------
function renderLeaders(rules) {
  const chosen = leaderCardIds();
  const ownedLeaders = [...new Set(getCards().map(c => c.cardId).filter(isLeaderCard))]
    .sort((a, b) => getCard(a).name.localeCompare(getCard(b).name));

  const wrap = $('db-leaders');
  wrap.innerHTML = '';
  if (!ownedLeaders.length) {
    wrap.innerHTML = '<span class="db-hint">No Leaders yet — win a duelist’s signature card to fly their banner.</span>';
  }
  for (const cid of ownedLeaders) {
    const def = getCard(cid);
    const on = chosen.includes(cid);
    const chip = document.createElement('button');
    chip.className = 'db-leader' + (on ? ' on' : '');
    chip.dataset.card = cid;
    chip.innerHTML = `<span class="ln">${def.name}</span><span class="lb">${bannerName(LEADERS[cid].banner)}</span>`;
    chip.title = leaderRules(cid).join(' · ');
    chip.onclick = () => toggleLeader(cid);
    wrap.appendChild(chip);
  }

  const box = $('db-rules');
  box.innerHTML = '';
  for (const cid of chosen) {
    const head = document.createElement('div');
    head.className = 'db-rule-lead';
    head.textContent = `${getCard(cid).name} — ${bannerName(LEADERS[cid].banner)}`;
    box.appendChild(head);
    for (const r of leaderRules(cid)) {
      const met = !rules.failures.some(f => f.leader === cid && f.text.endsWith(r));
      const line = document.createElement('div');
      line.className = 'db-rule ' + (met ? 'ok' : 'bad');
      line.textContent = (met ? '✓ ' : '✗ ') + r;
      box.appendChild(line);
    }
  }
  for (const f of rules.failures.filter(x => x.banner)) {   // gate failures
    const line = document.createElement('div');
    line.className = 'db-rule bad';
    line.textContent = '✗ ' + f.text;
    box.appendChild(line);
  }
}

function toggleLeader(cid) {
  if (leaderCardIds().includes(cid)) {
    workingLeaders = workingLeaders.filter(iid => getInstance(iid).cardId !== cid);
  } else {
    let iid = working.find(x => getInstance(x).cardId === cid);
    if (!iid) {                       // pull the Leader into the deck (it unlocks its own banner)
      addCopy(cid, buildOwnedGroups(), true);
      iid = working.find(x => getInstance(x).cardId === cid);
    }
    if (iid) workingLeaders.push(iid);
    else { log('Deck is full — remove a card before adding this Leader.', 'bad'); return; }
  }
  render();
}

// Rebuilds just the collection grid (card slots grouped into family/set
// sections) — split out from render() so clicking a filter tab/chip doesn't
// need to touch the deck count/legend/deck-list.
function renderGrid() {
  const groups = buildOwnedGroups();
  const ranks = myRanks();

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
      const lockFaction = lockOf(def.id, ranks);   // faction-rank gate (factions.js)
      const locked = !!lockFaction;
      const slot = document.createElement('div');
      slot.className = 'db-slot';
      const el = cardEl(def, best ? instLevel(best) : 0);
      if (!owned.length) el.classList.add('none');
      if (locked) el.classList.add('locked');
      const badge = document.createElement('div');
      badge.className = 'owned' + (inDeck ? ' indeck' : '') + (locked ? ' locked' : '');
      badge.textContent = locked ? `🔒 ${factionName(lockFaction)}: ${RANK_NAMES[rankOf(def.id)]}`
        : inDeck ? `${inDeck} in deck · own ${owned.length}` : `own ${owned.length}`;
      slot.appendChild(el); slot.appendChild(badge);
      el.onclick = locked
        ? () => log(`${def.name} needs ${factionName(lockFaction)} rank ${RANK_NAMES[rankOf(def.id)]} — play their cards to earn standing.`, 'bad')
        : () => addCopy(def.id, groups);
      el.oncontextmenu = ev => { ev.preventDefault(); if (owned.length) showChronicle(def, owned); };
      grid.appendChild(slot);
    }
  }
}

function addCopy(cardId, groups, force = false) {
  // gate: a faction card can't be added past your earned rank (force skips
  // this — used when a Leader card itself is being pulled into the deck;
  // the server re-validates the whole deck on save either way)
  const lockFaction = force ? null : lockOf(cardId, myRanks());
  if (lockFaction) {
    log(`${getCard(cardId).name} needs ${factionName(lockFaction)} rank ${RANK_NAMES[rankOf(cardId)]}.`, 'bad');
    return;
  }
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
    setDeck(working, workingLeaders);
    import('./net.js').then(m => m.sendDeckUpdate());
    const banners = leaderCardIds().map(cid => bannerName(LEADERS[cid].banner));
    log(`Deck saved (${working.length} cards${banners.length ? ', flying ' + banners.join(' + ') : ''}).`, 'sys');
    close();
  });
}
