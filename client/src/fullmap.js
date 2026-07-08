// Full-screen "map of Emberwood" overlay (toggle with M, or click the corner
// minimap). Unlike drawMinimap() in ui.js — player-centered, fixed radius —
// this draws the whole explored world at a fixed scale, with permanent
// fog-of-war (fogOfWar.js) painted over anything the player hasn't walked
// near yet. Open/close plumbing follows the deckbuilder/shop pattern.

import { $ } from './utils.js';
import { player, bots } from './state.js';
import { ZONES, CAMPS } from './constants.js';
import { isExplored, saveFog, CELL, HALF } from './fogOfWar.js';
import { activeQuestMarkers } from './quests.js';

export let fullmapOpen = false;

let canvas, ctx;

export function toggleFullmap() {
  if (fullmapOpen) close(); else open();
}

function open() {
  fullmapOpen = true;
  $('fullmap').classList.add('open');
}

function close() {
  fullmapOpen = false;
  $('fullmap').classList.remove('open');
  saveFog();   // flush any unsaved reveals now, same spirit as other localStorage writes here
}

function worldToMap(x, z, scale) {
  return { mx: (x + HALF) * scale, mz: (z + HALF) * scale };
}

function label(ctx, mx, mz, text) {
  ctx.fillStyle = '#e8dcb8';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
  ctx.fillText(text, mx, mz);
  ctx.shadowBlur = 0;
}

// A quest marker: a diamond over its destination plus the quest title. Gold =
// go do the objective here; green = objective met, return to the giver here
// (mirrors the tracker's colors and the in-world !/? head markers).
function questMarker(ctx, mx, mz, title, done) {
  const col = done ? '#7ac96a' : '#f0d060';
  ctx.save();
  ctx.translate(mx, mz);
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(6, 0); ctx.lineTo(0, 7); ctx.lineTo(-6, 0); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#2a1a0a'; ctx.stroke();
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = col;
  ctx.fillText(title, 0, -11);
  ctx.restore();
}

export function drawFullMap() {
  if (!fullmapOpen || !canvas) return;
  const W = canvas.width, H = canvas.height;
  const scale = W / (HALF * 2);
  const w2m = (x, z) => worldToMap(x, z, scale);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#1c2b18';
  ctx.fillRect(0, 0, W, H);

  // zone rings, centered on the village at the world origin
  const origin = w2m(0, 0);
  for (const zn of ZONES) {
    if (zn.r > HALF) continue;   // Darkwood's ring radius is "everything else" — not a drawable circle
    ctx.beginPath();
    ctx.arc(origin.mx, origin.mz, zn.r * scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,162,74,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  label(ctx, origin.mx, origin.mz, 'Meadowbrook Village');
  const boarR = ZONES[1].r;
  label(ctx, origin.mx + boarR * .68 * scale, origin.mz + boarR * .68 * scale, 'The Boarlands');
  label(ctx, origin.mx, origin.mz - (boarR + 40) * scale, 'Darkwood');

  // named camps
  for (const c of CAMPS) {
    const { mx, mz } = w2m(c.x, c.z);
    ctx.beginPath();
    ctx.arc(mx, mz, c.r * scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(224,90,74,.55)';
    ctx.stroke();
    label(ctx, mx, mz - (c.r + 8) * scale, c.name === 'Red-Sash Camp' ? "Vex's Camp (Red-Sash)" : c.name);
  }

  // other online players
  for (const b of bots) {
    const { mx, mz } = w2m(b.x, b.z);
    ctx.fillStyle = '#6ab0e0';
    ctx.fillRect(mx - 2.5, mz - 2.5, 5, 5);
  }

  // player position + facing arrow (same rotation convention as drawMinimap)
  {
    const { mx, mz } = w2m(player.x, player.z);
    ctx.save();
    ctx.translate(mx, mz);
    ctx.rotate(-player.yaw + Math.PI);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // fog-of-war on top: paint every unexplored cell dark, solid tiles (no
  // soft-edge blending — correctness/perf over polish for this pass)
  const dim = Math.ceil((HALF * 2) / CELL);
  const cellPx = CELL * scale;
  ctx.fillStyle = 'rgba(0,0,0,.92)';
  for (let cz = 0; cz < dim; cz++) {
    const wz = -HALF + cz * CELL + CELL / 2;
    for (let cx = 0; cx < dim; cx++) {
      const wx = -HALF + cx * CELL + CELL / 2;
      if (!isExplored(wx, wz)) ctx.fillRect(cx * cellPx, cz * cellPx, cellPx + 1, cellPx + 1);
    }
  }

  // quest markers ON TOP of fog — the point is to show where to go, including
  // places you haven't reached yet. Drawn last so nothing occludes them.
  for (const m of activeQuestMarkers()) {
    const { mx, mz } = w2m(m.x, m.z);
    questMarker(ctx, mx, mz, m.title, m.done);
  }
}

export function initFullmap() {
  canvas = $('fullmap-canvas');
  ctx = canvas.getContext('2d');
  $('fm-close').addEventListener('click', close);
  // nice-to-have: clicking the corner minimap also opens the full map
  $('mmwrap').addEventListener('click', () => { if (!fullmapOpen) open(); });
}
