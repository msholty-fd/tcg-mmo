import * as THREE from 'three';
import { $, rand, clamp } from './utils.js';
import { camera } from './scene.js';
import { player, npcs, bots } from './state.js';
import { xpNeed } from '../../shared/progression.js';

export function toScreen(x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: (v.x + 1) / 2 * innerWidth, y: (-v.y + 1) / 2 * innerHeight, behind: v.z > 1 };
}

export function log(text, cls = 'cmb') {
  const e = document.createElement('div'); e.className = 'l ' + cls; e.textContent = text;
  $('chat').appendChild(e);
  while ($('chat').children.length > 9) $('chat').firstChild.remove();
}

export function fct(x, y, z, text, cls = '') {
  const s = toScreen(x, y, z); if (s.behind) return;
  const e = document.createElement('div'); e.className = 'fct ' + cls; e.textContent = text;
  e.style.left = (s.x + rand(-14, 14)) + 'px'; e.style.top = s.y + 'px';
  document.body.appendChild(e); setTimeout(() => e.remove(), 1000);
}

export function say(name, text, reward) {
  $('d-name').textContent = name;
  $('d-text').textContent = text;
  $('d-reward').textContent = reward || '';
  $('dialogue').style.display = 'block';
}

const mmc = $('minimap').getContext('2d');
export function drawMinimap() {
  const R = 75, SCALE = .9;
  mmc.clearRect(0, 0, 150, 150);
  mmc.save(); mmc.beginPath(); mmc.arc(75, 75, 73, 0, Math.PI * 2); mmc.clip();
  mmc.fillStyle = '#20301c'; mmc.fillRect(0, 0, 150, 150);
  const px = player.x, pz = player.z;
  const dot = (x, z, c, s = 3) => {
    const dx = (x - px) * SCALE, dz = (z - pz) * SCALE;
    if (dx * dx + dz * dz > R * R) return;
    mmc.fillStyle = c; mmc.fillRect(75 + dx - s / 2, 75 + dz - s / 2, s, s);
  };
  mmc.fillStyle = '#3a4a30'; mmc.beginPath(); mmc.arc(75 - px * SCALE, 75 - pz * SCALE, 24 * SCALE, 0, Math.PI * 2); mmc.fill();
  for (const n of npcs) dot(n.x, n.z, n.duelist ? '#e0b050' : '#f0d060', n.duelist ? 5 : 4);
  for (const b of bots) dot(b.x, b.z, '#6ab0e0', 3);
  mmc.save(); mmc.translate(75, 75); mmc.rotate(-player.yaw + Math.PI);
  mmc.fillStyle = '#fff'; mmc.beginPath(); mmc.moveTo(0, -6); mmc.lineTo(4, 4); mmc.lineTo(-4, 4); mmc.closePath(); mmc.fill();
  mmc.restore(); mmc.restore();
}

export function updateHUD() {
  $('p-lvl').textContent = player.lvl;
  $('p-coins').textContent = '🪙 ' + player.coins;
  $('xpfill').style.width = clamp(player.xp / xpNeed(player.lvl), 0, 1) * 100 + '%';
  drawMinimap();
}
