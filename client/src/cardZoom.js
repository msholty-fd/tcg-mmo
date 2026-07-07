// Card inspector: hover any card or battlefield unit to see a large,
// readable version — cost, type, stats (with Chronicle bonuses), full
// keyword rules, card text, and flavor.

import { $ } from './utils.js';
import { getCard } from '../../shared/engine/cards.js';
import { LEVEL_NAMES } from '../../shared/chronicle.js';
import { artFor } from './pixelArt.js';

const KW_HELP = {
  ambush: 'Can attack the turn it is played.',
  guardian: 'Enemies must attack this unit first.',
  ward: 'Cannot be targeted by enemy spells.',
  frenzy: 'Attacks twice per turn.',
  lifesteal: 'Attacking restores that much Hearth.',
  piercing: 'Excess damage from kills carries to the enemy Hearth.',
};

const cap = s => s[0].toUpperCase() + s.slice(1);

function buildZoom(cardId, level) {
  const def = getCard(cardId);
  const b = level >= 3 ? 2 : level >= 2 ? 1 : 0;
  const keywords = [...(def.keywords || [])];
  if (level >= 3 && def.storiedKeyword && !keywords.includes(def.storiedKeyword)) keywords.push(def.storiedKeyword);

  const kwLines = keywords.map(k =>
    `<div class="cz-kw"><b>${cap(k)}</b> — ${KW_HELP[k] || ''}${level >= 3 && k === def.storiedKeyword ? ' <span class="cz-storied">(Storied)</span>' : ''}</div>`
  ).join('');

  const chron = level > 0
    ? `<div class="cz-chron">${LEVEL_NAMES[level]}${b ? ` · +${b}/+${b}` : ''}</div>`
    : '';

  const art = artFor(cardId);
  return `
    <div class="cz-head"><span class="cz-cost">${def.cost}</span><span class="cz-name">${def.name}</span></div>
    <div class="cz-type">${cap(def.type)} · ${cap(def.rarity)}${def.set ? ' · ' + cap(def.set) : ''}</div>
    ${art ? `<div class="cz-art"><img src="${art}" alt=""></div>` : ''}
    ${chron}
    ${kwLines}
    ${def.text ? `<div class="cz-rules">${def.text}</div>` : ''}
    ${def.flavor ? `<div class="cz-flavor">${def.flavor}</div>` : ''}
    ${def.atk != null ? `<div class="cz-stats"><span class="atk">${def.atk + b}</span> ⚔ &nbsp;·&nbsp; ❤ <span class="hp">${def.hp + b}</span></div>` : ''}`;
}

export function initCardZoom() {
  const panel = $('cardzoom');
  document.addEventListener('mouseover', e => {
    const el = e.target.closest?.('[data-card]');
    if (el) {
      panel.innerHTML = buildZoom(el.dataset.card, +el.dataset.level || 0);
      // anchor beside the hovered card: prefer its right edge, flip left if
      // that would run off-screen, and clamp vertically to the viewport
      const r = el.getBoundingClientRect();
      panel.style.display = 'block';
      const pw = panel.offsetWidth, ph = panel.offsetHeight, gap = 14;
      const left = r.right + gap + pw <= innerWidth ? r.right + gap : r.left - gap - pw;
      const top = Math.max(10, Math.min(r.top + r.height / 2 - ph / 2, innerHeight - ph - 10));
      panel.style.left = Math.max(10, left) + 'px';
      panel.style.right = 'auto';
      panel.style.top = top + 'px';
      panel.style.transform = 'none';
    } else if (!e.target.closest?.('#cardzoom')) {
      panel.style.display = 'none';
    }
  });
}
