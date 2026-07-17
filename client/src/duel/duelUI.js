// Duel overlay renderer. Renders the whole board from duel state (or a
// server view) on each change. Chronicle levels show as card frames; the
// event log narrates the game; ? opens the rules panel.

import { $ } from '../utils.js';
import { getCard } from '../../../shared/engine/cards.js';
import { canPlay, canKindle, canOffer, canAttack, canActivate, OFFER_MAX } from '../../../shared/engine/engine.js';
import { artFor } from '../pixelArt.js';

const KW_HELP = {
  ambush: 'Ambush — can attack the turn it is played',
  guardian: 'Guardian — enemies must attack this unit first',
  ward: 'Ward — cannot be targeted by enemy spells',
  frenzy: 'Frenzy — attacks twice per turn',
  lifesteal: 'Lifesteal — attacking restores that much Hearth',
  piercing: 'Piercing — excess damage from kills hits the Hearth',
};
const KW_ICON = { guardian: '🛡', ward: '✨', frenzy: '⚡', ambush: '🗡', lifesteal: '🩸', piercing: '🎯' };

let handlers = null;
let duelRef = null;
let mySide = 0;
let selectedUnit = null;
let pendingPlay = null;
let pendingAbility = null;   // { unitUid, needsTarget } while choosing an ability target
let menuHandIndex = null;

export function openDuel(duel, side, foeName, h) {
  duelRef = duel; mySide = side; handlers = h;
  selectedUnit = null; pendingPlay = null; pendingAbility = null;
  setAutoUI(false);
  $('d-foe-name').textContent = foeName;
  $('d-result').style.display = 'none';
  $('d-help').style.display = 'none';
  $('duel').classList.add('open');
  render();
}

export function closeDuel() {
  $('duel').classList.remove('open');
  hideMenu();
  duelRef = null;
}

export function updateDuel(view) {
  duelRef = view;
  selectedUnit = null;
  pendingPlay = null;
  pendingAbility = null;
  hideMenu();
  if (view.winner === null) setMsg(view.active === mySide ? 'Your turn.' : 'Waiting for opponent…');
  render();
}

export function setMsg(t) { $('d-msg').textContent = t; }

export function showResult(won, rewardCards) {
  $('d-result-title').textContent = won ? 'Victory' : 'Defeat';
  const r = $('d-result-rewards');
  r.innerHTML = '';
  for (const id of rewardCards) r.appendChild(cardEl(id, 0));
  if (!rewardCards.length && !won) r.innerHTML = '<span style="color:var(--ink-dim)">No cards won. Practice makes perfect.</span>';
  $('d-result').style.display = 'flex';
}

export function render() {
  if (!duelRef) return;
  const duel = duelRef;
  const me = duel.players[mySide], foe = duel.players[1 - mySide];
  const myTurn = duel.active === mySide && duel.winner === null;
  const targeting = !!(selectedUnit || pendingPlay || pendingAbility);

  const fh = $('d-foe-hand'); fh.innerHTML = '';
  for (let i = 0; i < foe.hand.length; i++) { const b = document.createElement('div'); b.className = 'dcard cardback'; fh.appendChild(b); }
  $('d-foe-hearth').textContent = foe.hearth;
  $('d-my-hearth').textContent = me.hearth;
  $('d-foe-ember').textContent = '🔥 ' + foe.ember + '/' + foe.emberMax;
  $('d-my-ember').textContent = '🔥 ' + me.ember + '/' + me.emberMax;

  // night badge — duel.night is fixed at duel start (server-synced hour;
  // local clock offline) and ships in every server view. Nocturnal rules
  // text carries the condition; this is the board-level "it's live" cue.
  $('d-night').style.display = duel.night ? '' : 'none';

  // face-down reactions: yours are inspectable (hover zoom), theirs are backs
  renderReactions($('d-foe-reacts'), foe.reactions || [], false);
  renderReactions($('d-my-reacts'), me.reactions || [], true);

  // enchantments: face-up and persistent, so both sides' are always shown
  renderEnchantments($('d-foe-ench'), foe.enchantments || []);
  renderEnchantments($('d-my-ench'), me.enchantments || []);

  const foeHearthEl = $('d-foe-hearth');
  foeHearthEl.classList.toggle('targetable', targeting && canTargetHearth());
  foeHearthEl.onclick = () => {
    if (selectedUnit) { handlers.onAttack(selectedUnit, { hearth: 1 - mySide }); selectedUnit = null; }
    else if (pendingPlay && pendingPlay.needsTarget === 'any') { handlers.onPlay(pendingPlay.handIndex, { hearth: 1 - mySide }); pendingPlay = null; }
    else if (pendingAbility && pendingAbility.needsTarget === 'any') { handlers.onActivate(pendingAbility.unitUid, { hearth: 1 - mySide }); pendingAbility = null; }
  };

  renderField($('d-foe-field'), foe.field, false, myTurn);
  renderField($('d-my-field'), me.field, true, myTurn);

  const mh = $('d-my-hand'); mh.innerHTML = '';
  me.hand.forEach((c, i) => {
    const el = cardEl(c.card, c.level || 0);
    if (!canPlay(duel, mySide, i)) el.classList.add('unplayable');
    el.onclick = (ev) => { ev.stopPropagation(); if (myTurn) showMenu(i, ev.clientX, ev.clientY); };
    mh.appendChild(el);
  });

  // event log — keep recent history and let the player scroll back through it;
  // only auto-follow to the newest line when they're already at the bottom.
  const lg = $('d-log');
  const prevTop = lg.scrollTop;
  const atBottom = lg.scrollHeight - prevTop - lg.clientHeight < 30;
  lg.innerHTML = (duel.chatter || []).slice(-60).map(l => `<div>${l}</div>`).join('');
  lg.scrollTop = atBottom ? lg.scrollHeight : prevTop;

  $('d-endturn').disabled = !myTurn;
}

function renderReactions(el, arr, mine) {
  el.innerHTML = '';
  for (const r of arr) {
    const d = document.createElement('div');
    d.className = 'dreact' + (mine ? ' mine' : '');
    d.textContent = '?';
    if (mine && r) {
      d.dataset.card = r.card;
      d.dataset.level = r.level || 0;
      d.title = getCard(r.card).name;
    }
    el.appendChild(d);
  }
}

function renderEnchantments(el, arr) {
  el.innerHTML = '';
  for (const e of arr) {
    const def = getCard(e.card);
    const d = document.createElement('div');
    d.className = 'dench';
    d.dataset.card = e.card;
    d.dataset.level = e.level || 0;
    d.title = def.name;
    const art = artFor(e.card);
    d.innerHTML = art ? `<img src="${art}" alt="">` : def.name[0];
    el.appendChild(d);
  }
}

function canTargetHearth() {
  if (selectedUnit) {
    const foe = duelRef.players[1 - mySide];
    return !foe.field.some(u => u.keywords.includes('guardian'));
  }
  return pendingPlay?.needsTarget === 'any' || pendingAbility?.needsTarget === 'any';
}

// selectors an ability/spell can aim at an ENEMY creature (Ward-immune)
const ENEMY_SEL = ['enemyUnit', 'anyUnit', 'any'];
// selectors an ability/spell can aim at one of YOUR creatures
const OWN_SEL = ['anyUnit', 'ownUnit'];

function renderField(el, units, mine, myTurn) {
  el.innerHTML = '';
  for (const u of units) {
    const def = getCard(u.card);
    const d = document.createElement('div');
    d.className = 'dunit' + (u.level ? ' lv' + u.level : '');
    d.dataset.card = u.card; d.dataset.level = u.level || 0;
    const kw = u.keywords.map(k => `<span title="${KW_HELP[k] || k}">${KW_ICON[k] || ''}</span>`).join('');
    const art = artFor(u.card);
    // equipment riding this unit — a small badge per attached piece (hoverable)
    const equip = (u.equip || []).map(e => `<span title="${getCard(e.card).name}">⚔</span>`).join('');
    d.innerHTML = `${art ? `<div class="art"><img src="${art}" alt=""></div>` : ''}
      <div class="cname">${def.name}</div><span class="kw">${kw}</span>
      ${equip ? `<span class="equip">${equip}</span>` : ''}
      <div class="stats"><span class="atk">${u.atk}</span><span class="hp ${u.hp < u.maxhp ? 'hurt' : ''}">${u.hp}</span></div>`;
    if (mine) {
      const ownTargetable = pendingPlay && OWN_SEL.includes(pendingPlay.needsTarget);
      const abilityTargetable = pendingAbility && OWN_SEL.includes(pendingAbility.needsTarget);
      const idle = !pendingPlay && !pendingAbility && !selectedUnit;
      if (myTurn && canAttack(duelRef, mySide, u) && idle) d.classList.add('canact');
      if (selectedUnit === u) d.classList.add('selected');
      if (ownTargetable || abilityTargetable) d.classList.add('targetable');
      // activated-ability button — only while nothing else is mid-selection
      if (myTurn && idle && canActivate(duelRef, mySide, u)) {
        const btn = document.createElement('button');
        btn.className = 'abilbtn';
        btn.textContent = '⚡' + def.ability.cost;
        btn.title = def.ability.text || 'Activate ability';
        btn.onclick = (ev) => {
          ev.stopPropagation();
          if (def.ability.needsTarget) {
            pendingAbility = { unitUid: u.uid, needsTarget: def.ability.needsTarget };
            selectedUnit = null; pendingPlay = null;
            setMsg('Choose a target for ' + def.name + "'s ability (click empty space to cancel)");
            render();
          } else {
            handlers.onActivate(u.uid, null);
          }
        };
        d.appendChild(btn);
      }
      d.onclick = (ev) => {
        ev.stopPropagation();
        if (ownTargetable) { handlers.onPlay(pendingPlay.handIndex, { unit: u }); pendingPlay = null; return; }
        if (abilityTargetable) { handlers.onActivate(pendingAbility.unitUid, { unit: u }); pendingAbility = null; return; }
        if (!myTurn) return;
        selectedUnit = (selectedUnit === u || !canAttack(duelRef, mySide, u)) ? null : u;
        render();
      };
    } else {
      const spellTargetable = pendingPlay && ENEMY_SEL.includes(pendingPlay.needsTarget) && !u.keywords.includes('ward');
      const abilityTargetable = pendingAbility && ENEMY_SEL.includes(pendingAbility.needsTarget) && !u.keywords.includes('ward');
      const targetable = selectedUnit || spellTargetable || abilityTargetable;
      if (targetable) d.classList.add('targetable');
      d.onclick = (ev) => {
        ev.stopPropagation();
        if (selectedUnit) { handlers.onAttack(selectedUnit, { unit: u }); selectedUnit = null; }
        else if (spellTargetable) { handlers.onPlay(pendingPlay.handIndex, { unit: u }); pendingPlay = null; }
        else if (abilityTargetable) { handlers.onActivate(pendingAbility.unitUid, { unit: u }); pendingAbility = null; }
      };
    }
    el.appendChild(d);
  }
}

function cardEl(id, level = 0) {
  const def = getCard(id);
  const el = document.createElement('div');
  el.className = 'dcard' + (def.type !== 'creature' ? ' spell' : '') + (level ? ' lv' + level : '');
  el.dataset.card = id; el.dataset.level = level;
  const b = level >= 3 ? 2 : level >= 2 ? 1 : 0;
  const art = artFor(id);
  el.innerHTML = `<div class="cost">${def.cost}</div>
    ${art ? `<div class="art"><img src="${art}" alt=""></div>` : ''}
    <div class="cname">${def.name}</div>
    <div class="ctext">${def.text || def.flavor || ''}</div>
    <div class="stats"><span class="atk">${def.atk != null ? def.atk + b : ''}</span><span class="hp">${def.hp != null ? def.hp + b : ''}</span></div>`;
  return el;
}

function showMenu(handIndex, x, y) {
  menuHandIndex = handIndex;
  const m = $('d-cardmenu');
  m.style.display = 'flex';
  m.style.left = Math.min(x, innerWidth - 120) + 'px';
  m.style.top = (y - 90) + 'px';
  $('d-menu-play').disabled = !canPlay(duelRef, mySide, handIndex);
  $('d-menu-kindle').disabled = !canKindle(duelRef, mySide);
  resetOfferArm();
}
function hideMenu() { $('d-cardmenu').style.display = 'none'; menuHandIndex = null; }

// The Offering is PERMANENT (the instance leaves your collection for the
// nearest fire — drafting Phase 3), so the menu item is two-click: first
// click arms it red, second click commits. Online-only: local/offline duels
// have no handlers.onOffer, so the button stays disabled there.
let offerArmed = false;
function resetOfferArm() {
  offerArmed = false;
  const b = $('d-menu-offer');
  const left = OFFER_MAX - (duelRef?.players?.[mySide]?.offersUsed || 0);
  b.textContent = `Offer ✦ (${left} left)`;
  b.classList.remove('armed');
  b.disabled = !handlers.onOffer || !canOffer(duelRef, mySide);
}

let autoOn = false;
function setAutoUI(on) {
  autoOn = on;
  const b = $('d-auto');
  b.textContent = on ? 'Auto: On' : 'Auto: Off';
  b.classList.toggle('on', on);
}

export function initDuelUI() {
  $('d-menu-play').addEventListener('click', ev => {
    ev.stopPropagation();   // don't let the board's cancel-targeting handler eat this
    const i = menuHandIndex; hideMenu();
    const me = duelRef.players[mySide];
    const def = getCard(me.hand[i].card);
    if (def.needsTarget) {
      pendingPlay = { handIndex: i, needsTarget: def.needsTarget };
      selectedUnit = null;
      setMsg('Choose a target for ' + def.name + ' (click empty space to cancel)');
      render();
    } else {
      handlers.onPlay(i, null);
    }
  });
  $('d-menu-kindle').addEventListener('click', ev => { ev.stopPropagation(); const i = menuHandIndex; hideMenu(); handlers.onKindle(i); });
  $('d-menu-offer').addEventListener('click', ev => {
    ev.stopPropagation();
    const b = $('d-menu-offer');
    if (!offerArmed) {
      offerArmed = true;
      b.textContent = 'Forever? Confirm ✦';
      b.classList.add('armed');
      return;
    }
    const i = menuHandIndex; hideMenu(); handlers.onOffer(i);
  });
  $('d-endturn').addEventListener('click', () => { selectedUnit = null; pendingPlay = null; pendingAbility = null; handlers.onEndTurn(); });
  $('d-concede').addEventListener('click', () => handlers.onConcede());
  $('d-auto').addEventListener('click', ev => {
    ev.stopPropagation();
    setAutoUI(!autoOn);
    selectedUnit = null; pendingPlay = null; pendingAbility = null;
    handlers.onAuto(autoOn);
  });
  $('d-result-close').addEventListener('click', () => handlers.onClose());
  $('d-helpbtn').addEventListener('click', ev => {
    ev.stopPropagation();
    const h = $('d-help');
    h.style.display = h.style.display === 'block' ? 'none' : 'block';
  });
  // phones: the event-log sidebar doesn't fit, so a Log button (shown only
  // by the small-screen media query) toggles it as a fullscreen overlay
  $('d-logbtn').addEventListener('click', ev => {
    ev.stopPropagation();
    $('d-log').classList.toggle('show');
  });
  $('duel').addEventListener('click', () => {
    hideMenu();
    if (selectedUnit || pendingPlay || pendingAbility) { selectedUnit = null; pendingPlay = null; pendingAbility = null; setMsg(''); render(); }
  });
}
