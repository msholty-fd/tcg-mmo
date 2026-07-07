import * as THREE from 'three';
import { $, lerp, smoothstep, rand, ri } from './utils.js';
import { scene, renderer, camera, sun, hemi, starMat, sunDisc, moonDisc } from './scene.js';
import { groundH } from './terrain.js';
import { humanoid, makeLabel } from './entities.js';
import { STARTERS, ZONES } from './constants.js';
import { player, critters } from './state.js';
import { fires, torches, marla, aldric } from './world.js';
import { log, updateHUD } from './ui.js';
import { keys, cam, started, setStarted } from './input.js';
import { nearestInteract, handleInteract, tickDialogue } from './interact.js';
import { renderTracker, updateMark } from './quests.js';
import { initCollection } from './collection.js';
import { startNet, initNet, netTick, nearestRemote, challengePlayer } from './net.js';
import { initDuels, duelActive } from './duel/duelManager.js';
import { initDeckbuilder, deckbuilderOpen } from './deckbuilder.js';

import { initCardZoom } from './cardZoom.js';
import { initHudWindows, isOpen as hudOpen } from './hudWindows.js';
initDuels();
initDeckbuilder();
initNet();
initCardZoom();
initHudWindows();

// ---------- intro: starter deck select ----------
let pickedStarter = 'boarherd';
document.querySelectorAll('.ccard').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('.ccard').forEach(x => x.classList.remove('sel'));
    c.classList.add('sel'); pickedStarter = c.dataset.starter;
  });
});
document.querySelector('.ccard').classList.add('sel');

const SESSION_KEY = 'emberwood.session';

function enterWorld(name, starter, pos = null, password = '') {
  const s = STARTERS[starter];
  player.outfit = s;
  player.name = name;
  if (pos) { player.x = pos.x; player.z = pos.z; }
  initCollection(starter, player.name);
  player.mesh = humanoid({ shirt: s.shirt, hat: s.hat });
  const lb = makeLabel(player.name, '#ffffff', 24); lb.position.y = 2.9; player.mesh.add(lb);
  scene.add(player.mesh);
  $('p-portrait').firstChild.textContent = ''; $('p-portrait').prepend(s.icon);
  $('p-name').textContent = player.name;
  $('charselect').style.display = 'none';
  setStarted(true);
  log('Welcome to Emberwood Online, ' + player.name + '!', 'sys');
  startNet(player.name, starter, password);
  updateMark(marla); updateMark(aldric);
  renderTracker();
  // remember the character (and, every few seconds, where they're standing)
  const saveSession = () => localStorage.setItem(SESSION_KEY, JSON.stringify({ name, starter, x: player.x, z: player.z }));
  saveSession();
  setInterval(saveSession, 5000);
}

$('enterworld').addEventListener('click', () => {
  // recovering an existing character will fetch their real collection from
  // the server; a stale local mirror from another character must not leak in
  localStorage.removeItem('emberwood.collection.v2');
  enterWorld(
    $('charname').value.trim() || ('Fable' + ri(10, 99)),
    pickedStarter,
    null,
    $('charpass').value
  );
});

// Log out (via Esc menu): forget this device's session. The character lives
// on the server — recover them anywhere with name + password.
import { initEscMenu } from './escMenu.js';
initEscMenu({
  onLogout() {
    if (!confirm('Log out ' + player.name + '?\nYou can recover this character with their name and password.')) return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('emberwood.collection.v2');
    localStorage.removeItem('emberwood.token');
    location.reload();
  },
});

// returning player: skip the intro entirely and drop back in where they stood
try {
  const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (saved?.name) enterWorld(saved.name, saved.starter, { x: saved.x || 0, z: saved.z || 9 });
} catch {}

// ---------- zones ----------
let curZone = '', zoneT = 0;
function zoneAt(x, z) {
  if (Math.hypot(x - 107, z + 60) < 26) return "Gruk's Hollow";
  if (Math.hypot(x + 90, z - 64) < 24) return 'Red-Sash Camp';
  const d = Math.hypot(x, z);
  for (const zn of ZONES) if (d < zn.r) return zn.name;
}

let ePressed = false;

// ---------- game loop ----------
let gameHour = 10, uiT = 0;
export function setGameHour(h) { gameHour = h; }   // debug/testing hook
const clock = new THREE.Clock();

function update(dt) {
  // day/night — 20 real minutes per in-game day
  gameHour = (gameHour + dt * 24 / 1200) % 24;
  const elev = Math.sin((gameHour - 6) / 12 * Math.PI);
  const dayF = smoothstep(-.12, .25, elev);
  const sa = (gameHour - 6) / 12 * Math.PI;
  // day: the sun arcs across the sky. night: a stationary high "moon" —
  // a horizon-grazing light at night casts huge sweeping shadows, so park it.
  const sunX = Math.cos(sa) * 130 + player.x, sunY = Math.max(Math.sin(sa), .05) * 150;
  sun.position.set(
    lerp(player.x - 50, sunX, dayF),
    lerp(140, sunY, dayF),
    lerp(-90, 70, dayF)
  );
  sun.target.position.set(player.x, 0, player.z);
  sun.color.set(0x9ab8e0).lerp(new THREE.Color(0xfff2d0), dayF);   // moonlight blue → warm sun
  sun.intensity = lerp(.14, 1.05, dayF);
  hemi.intensity = lerp(.26, .65, dayF);
  // visible discs, matching the light directions
  sunDisc.position.set(player.x + Math.cos(sa) * 400, Math.sin(sa) * 400, player.z + 90);
  sunDisc.material.opacity = smoothstep(-.06, .06, elev);
  moonDisc.position.set(player.x - 160, 330, player.z - 300);
  moonDisc.material.opacity = (1 - dayF) * .95;
  starMat.opacity = (1 - dayF) * .85;
  const sky = new THREE.Color(0x141c30).lerp(new THREE.Color(0x8ab0d0), dayF);
  scene.background.copy(sky); scene.fog.color.copy(sky).multiplyScalar(.95);
  for (const f of fires) f.userData.fire.scale.y = 1 + Math.sin(performance.now() * .02) * .15;
  // torches wake up at dusk and flicker through the night
  const night = 1 - dayF;
  for (const t of torches) {
    const flick = Math.sin(performance.now() * .006 + t.phase) * .18;
    t.light.intensity = night * (1.2 + flick);
    t.flame.scale.setScalar(.6 + night * (.55 + flick));
  }

  // player movement
  let mx = 0, mz = 0;
  if (keys.KeyW) mz -= 1; if (keys.KeyS) mz += 1;
  if (keys.KeyA) mx -= 1; if (keys.KeyD) mx += 1;
  const gy = groundH(player.x, player.z);
  if (keys.Space && player.mesh.position.y <= gy + .01 && player.vy === 0) player.vy = 7.5;
  if (mx || mz) {
    const a = Math.atan2(mx, mz) + cam.yaw;
    player.x += Math.sin(a) * player.speed * dt;
    player.z += Math.cos(a) * player.speed * dt;
    const r = Math.hypot(player.x, player.z);
    if (r > 210) { player.x *= 210 / r; player.z *= 210 / r; }
    player.yaw = a; player.mesh.rotation.y = a;
  }
  player.vy -= 22 * dt;
  let y = player.mesh.position.y + player.vy * dt;
  const g2 = groundH(player.x, player.z);
  if (y <= g2) { y = g2; player.vy = 0; }
  player.mesh.position.set(player.x, y, player.z);
  if ((mx || mz) && player.vy === 0) player.mesh.position.y += Math.abs(Math.sin(performance.now() * .013)) * .1;

  // camera — when the terrain clamp blocks the camera from dipping lower,
  // convert the blocked descent into upward gaze so you can still look at the sky
  const cd = 12;
  const desiredY = player.mesh.position.y + 2 + Math.sin(cam.pitch) * cd;
  camera.position.set(
    player.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cd,
    desiredY,
    player.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cd
  );
  camera.position.y = Math.max(camera.position.y, groundH(camera.position.x, camera.position.z) + 1.3);
  const lift = camera.position.y - desiredY;
  camera.lookAt(player.x, player.mesh.position.y + 2 + lift * 2.2, player.z);

  // ambient critters wander
  for (const c of critters) {
    c.wanderT -= dt;
    if (c.wanderT <= 0) { c.wanderT = rand(2, 6); c.tx = c.sx + rand(-7, 7); c.tz = c.sz + rand(-7, 7); }
    const d = Math.hypot(c.tx - c.x, c.tz - c.z);
    if (d > .6) {
      const a = Math.atan2(c.tx - c.x, c.tz - c.z);
      c.x += Math.sin(a) * 1.3 * dt; c.z += Math.cos(a) * 1.3 * dt; c.mesh.rotation.y = a;
    }
    c.mesh.position.set(c.x, groundH(c.x, c.z), c.z);
  }

  netTick(dt);

  // interact prompt + E key: NPCs first, then nearby real players
  const n = nearestInteract();
  const rp = n ? null : nearestRemote();
  const pr = $('prompt');
  if ((n || rp) && hudOpen('prompt')) {
    pr.style.display = 'block';
    $('prompt-text').innerHTML = n
      ? (n.duelist ? `<b>E</b> — challenge ${n.name}` : `<b>E</b> — speak with ${n.name}`)
      : `<b>E</b> — challenge ${rp.name} <span style="color:#8fd0f0">(player)</span>`;
  } else {
    pr.style.display = 'none';
  }
  if (keys.KeyE && !ePressed) {
    ePressed = true;
    if (n) handleInteract();
    else if (rp) challengePlayer(rp.id);
  }
  if (!keys.KeyE) ePressed = false;
  tickDialogue(dt);

  // zone banner
  const zn = zoneAt(player.x, player.z);
  if (zn !== curZone) {
    curZone = zn; $('zonebanner').textContent = zn; $('zone-mm').textContent = zn;
    $('zonebanner').style.opacity = 1; zoneT = 2.5;
  }
  if (zoneT > 0) { zoneT -= dt; if (zoneT <= 0) $('zonebanner').style.opacity = 0; }

  uiT -= dt;
  if (uiT <= 0) { uiT = .15; updateHUD(); }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  if (started && !document.hidden && !duelActive && !deckbuilderOpen) update(dt);
  renderer.render(scene, camera);
}
animate();
