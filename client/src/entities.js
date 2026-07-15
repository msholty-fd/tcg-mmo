import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Fidelity pass 1 (2026-07-15, "softer/rounder" direction): the humanoid is
// the single most-seen asset — player, every NPC, every remote — so its shape
// sets the tone for the whole realm. Nudged from hard boxes toward rounded,
// smooth-shaded forms (capsule limbs, a barrel torso, a spherical head) while
// keeping the same flat-colour low-poly style, the same {opts} API, and the
// same overall proportions/height (labels, hp bars, and camera framing all
// assume a ~2.1-unit-tall figure). Draw calls stay ~1 per body part.

// r128 has no CapsuleGeometry, so a rounded limb is a cylinder body + two
// hemisphere caps merged into ONE indexed geometry (one draw call). Many
// humanoids share identical limb dims, so cache each (r,len,seg) build and let
// every mesh reference the same geometry — geometry is shared, materials are
// per-figure (colours differ). Cheap, and keeps limb ends soft, not tube-cut.
const _capsuleCache = new Map();
function capsuleGeo(r, len, seg = 8) {
  const key = r + ':' + len + ':' + seg;
  let g = _capsuleCache.get(key);
  if (g) return g;
  const body = new THREE.CylinderGeometry(r, r, len, seg, 1, true);
  const top = new THREE.SphereGeometry(r, seg, Math.ceil(seg / 2), 0, Math.PI * 2, 0, Math.PI / 2);
  top.translate(0, len / 2, 0);
  const bot = new THREE.SphereGeometry(r, seg, Math.ceil(seg / 2), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  bot.translate(0, -len / 2, 0);
  g = BufferGeometryUtils.mergeBufferGeometries([body, top, bot]);
  _capsuleCache.set(key, g);
  return g;
}

// cape/glow: faction regalia (shared/cosmetics.js) — cape is a thin slab on
// the back; glow is an emissive tint (campfire trick) so Emberpeaks cloth
// smolders after dark like everything else the mountain owns.
export function humanoid({ shirt = 0x6a8ac9, skin = 0xd9a878, hat = null, legs: legColor = 0x4a4038, cape = null, capeGlow = null, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mk = (geo, color, em) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, emissive: em || 0x000000 }));

  // legs — two rounded capsules with soft feet, replacing the single block
  const legGeo = capsuleGeo(.15, .42, 8);
  const legR = mk(legGeo, legColor); legR.position.set(.17, .38, 0); legR.castShadow = true; g.add(legR);
  const legL = mk(legGeo, legColor); legL.position.set(-.17, .38, 0); legL.castShadow = true; g.add(legL);

  // torso — a soft tapered barrel (broader shoulders, slimmer waist), flattened
  // front-to-back, capped by a rounded shoulder dome so it doesn't read as a tube
  const torso = mk(new THREE.CylinderGeometry(.3, .24, .8, 10, 1), shirt);
  torso.position.y = 1.12; torso.scale.z = .68; torso.castShadow = true; g.add(torso);
  const shoulders = mk(new THREE.SphereGeometry(.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shirt);
  shoulders.position.y = 1.52; shoulders.scale.set(1, .5, .68); g.add(shoulders);

  // neck + rounded, slightly egg-shaped head
  const neck = mk(new THREE.CylinderGeometry(.1, .12, .16, 7), skin); neck.position.y = 1.62; g.add(neck);
  const head = mk(new THREE.SphereGeometry(.28, 12, 10), skin);
  head.position.y = 1.88; head.scale.set(.92, 1.02, .96); head.castShadow = true; g.add(head);

  if (hat) { const h = mk(new THREE.ConeGeometry(.4, .5, 8), hat); h.position.y = 2.42; g.add(h); }
  if (cape != null) {
    const c = mk(new THREE.BoxGeometry(.72, .95, .07), cape, capeGlow);
    c.position.set(0, 1.08, -.3); c.castShadow = true; g.add(c);
  }

  // arms — rounded capsules, angled a touch outward for a natural rest pose
  const armGeo = capsuleGeo(.09, .5, 8);
  const armR = mk(armGeo, shirt); armR.position.set(.44, 1.16, 0); armR.rotation.z = .12; g.add(armR);
  const armL = mk(armGeo, shirt); armL.position.set(-.44, 1.16, 0); armL.rotation.z = -.12; g.add(armL);
  // handles kept for a future motion pass (Stage 1): arm swing / leg stride
  g.userData.armR = armR; g.userData.armL = armL; g.userData.legR = legR; g.userData.legL = legL;

  g.scale.setScalar(scale);
  return g;
}

export function boarMesh(color, scale) {
  const g = new THREE.Group();
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c }));
  const b = mk(new THREE.BoxGeometry(.9, .7, 1.4), color); b.position.y = .6; b.castShadow = true; g.add(b);
  const h = mk(new THREE.BoxGeometry(.55, .5, .55), color); h.position.set(0, .75, .85); g.add(h);
  const sn = mk(new THREE.BoxGeometry(.25, .2, .25), 0xd8a8a0); sn.position.set(0, .65, 1.2); g.add(sn);
  for (const dx of [-.16, .16]) {
    const t = mk(new THREE.ConeGeometry(.06, .3, 4), 0xf0e8d0);
    t.rotation.x = Math.PI / 2; t.position.set(dx, .6, 1.25); g.add(t);
  }
  g.scale.setScalar(scale);
  return g;
}

export function wolfMesh() {
  const g = new THREE.Group();
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c }));
  const b = mk(new THREE.BoxGeometry(.6, .55, 1.3), 0x555860); b.position.y = .55; b.castShadow = true; g.add(b);
  const h = mk(new THREE.BoxGeometry(.42, .42, .5), 0x484b52); h.position.set(0, .85, .8); g.add(h);
  const sn = mk(new THREE.BoxGeometry(.2, .18, .3), 0x36393e); sn.position.set(0, .78, 1.15); g.add(sn);
  const t = mk(new THREE.BoxGeometry(.15, .15, .6), 0x484b52); t.position.set(0, .7, -.85); g.add(t);
  return g;
}

// Ember elemental — the Emberpeaks' ambient wildlife: a charred rock body
// with a glowing molten core, ember-lit cracks, and a flame crown. Uses
// emissive materials (same trick as campfire flames) so it glows day and
// night in the volcanic basin. Wanders via spawnCritter like the beasts.
export function emberElementalMesh(scale = 1) {
  const g = new THREE.Group();
  const mk = (geo, c, em) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c, emissive: em || 0x000000 }));
  const body = mk(new THREE.BoxGeometry(.8, 1.1, .7), 0x2a2320); body.position.y = 1.0; body.castShadow = true; g.add(body);
  const core = mk(new THREE.SphereGeometry(.3, 8, 7), 0xff6a1a, 0xdd4400); core.position.y = 1.05; g.add(core);
  for (const [dx, dy] of [[-.2, .7], [.25, 1.3], [0, .5], [-.12, 1.45]]) {
    const crack = mk(new THREE.BoxGeometry(.1, .1, .74), 0xff7a20, 0xcc3300); crack.position.set(dx, dy, 0); g.add(crack);
  }
  const flame = mk(new THREE.ConeGeometry(.34, .9, 6), 0xff9a30, 0xdd5500); flame.position.y = 1.95; g.add(flame);
  for (const dx of [-.22, .22]) { const l = mk(new THREE.BoxGeometry(.22, .5, .24), 0x241d1a); l.position.set(dx, .25, 0); g.add(l); }
  // arms of molten rock
  for (const dx of [-.5, .5]) { const a = mk(new THREE.BoxGeometry(.18, .6, .18), 0x2a2320, 0x551500); a.position.set(dx, 1.05, 0); g.add(a); }
  g.scale.setScalar(scale);
  return g;
}

// Ambient grazing deer — taller and leaner than the boars, with a raised
// neck and small antlers so it reads as a deer at a glance. Same box-group
// idiom as boarMesh/wolfMesh; wanders via spawnCritter like the rest.
export function deerMesh(scale = 1) {
  const g = new THREE.Group();
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c }));
  const coat = 0x9a744a, coatDark = 0x7a5836;
  const b = mk(new THREE.BoxGeometry(.55, .6, 1.25), coat); b.position.y = 1.05; b.castShadow = true; g.add(b);
  // raised neck + head
  const neck = mk(new THREE.BoxGeometry(.3, .6, .3), coat); neck.position.set(0, 1.5, .6); neck.rotation.x = -.5; g.add(neck);
  const h = mk(new THREE.BoxGeometry(.3, .32, .5), coat); h.position.set(0, 1.85, .8); h.castShadow = true; g.add(h);
  // four legs
  for (const [dx, dz] of [[-.2, .45], [.2, .45], [-.2, -.45], [.2, -.45]]) {
    const leg = mk(new THREE.BoxGeometry(.12, .8, .12), coatDark); leg.position.set(dx, .4, dz); g.add(leg);
  }
  // little antlers — thin forked cones
  for (const dx of [-.11, .11]) {
    const main = mk(new THREE.ConeGeometry(.05, .45, 4), 0xcfc2a0); main.position.set(dx, 2.15, .78); g.add(main);
    const fork = mk(new THREE.ConeGeometry(.035, .22, 4), 0xcfc2a0);
    fork.position.set(dx + dx * .8, 2.2, .78); fork.rotation.z = dx > 0 ? -.6 : .6; g.add(fork);
  }
  const tail = mk(new THREE.BoxGeometry(.12, .18, .12), 0xe8e0d0); tail.position.set(0, 1.15, -.65); g.add(tail);
  g.scale.setScalar(scale);
  return g;
}

// Ambient rabbit — tiny, two upright ears. Small enough to read as village
// wildlife underfoot rather than something you'd duel.
export function rabbitMesh(scale = 1) {
  const g = new THREE.Group();
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c }));
  const fur = 0x9a8f80;
  const b = mk(new THREE.BoxGeometry(.28, .26, .4), fur); b.position.y = .2; b.castShadow = true; g.add(b);
  const h = mk(new THREE.BoxGeometry(.24, .22, .22), fur); h.position.set(0, .34, .24); g.add(h);
  for (const dx of [-.06, .06]) {
    const ear = mk(new THREE.BoxGeometry(.06, .28, .04), fur); ear.position.set(dx, .56, .22); g.add(ear);
  }
  const tail = mk(new THREE.BoxGeometry(.1, .1, .1), 0xf0ece2); tail.position.set(0, .22, -.22); g.add(tail);
  g.scale.setScalar(scale);
  return g;
}

export function makeLabel(text, color = '#e8dcb8', size = 26, w = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold ' + size + 'px Georgia'; ctx.textAlign = 'center';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
  ctx.fillStyle = color; ctx.fillText(text, w / 2, 40);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false
  }));
  sp.scale.set(w / 64, 1, 1);
  return sp;
}

export function hpBar() {
  const g = new THREE.Group();
  const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x1a1a1a, depthWrite: false }));
  bg.scale.set(1.5, .16, 1); g.add(bg);
  const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xc23a2e, depthWrite: false }));
  fg.center.set(0, .5); fg.position.x = -.75; fg.scale.set(1.5, .13, 1); g.add(fg);
  g.userData.fg = fg;
  return g;
}
