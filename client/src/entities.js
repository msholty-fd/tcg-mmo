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

// Fidelity pass 2 (2026-07-15, "Dark Cloud / PS2" direction): outfit the
// humanoid — collar, belt, leather gloves & boots — and give the torso cloth a
// woven texture. This is the FIRST real texture in the game: a procedurally
// drawn basketweave (near-white grayscale) used as a .map that multiplies the
// per-figure shirt colour, so one shared texture dresses the whole cast. Same
// canvas→CanvasTexture trick as pixelArt.js card faces, and the same technique
// the later surface-texture pass will reuse for wood/thatch/stone/ground.
let _clothTex = null;
function clothTexture() {
  if (_clothTex) return _clothTex;
  const s = 32, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  x.fillStyle = '#ececec'; x.fillRect(0, 0, s, s);          // near-white: the map keeps the shirt colour
  const cell = 8;
  for (let iy = 0; iy < s; iy += cell) for (let ix = 0; ix < s; ix += cell) {
    const horiz = ((ix / cell + iy / cell) & 1) === 0;       // alternate thread direction → basketweave
    for (let t = 1; t < cell; t += 2) {
      x.fillStyle = t % 4 === 1 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.16)';
      if (horiz) x.fillRect(ix, iy + t, cell, 1); else x.fillRect(ix + t, iy, 1, cell);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3);
  _clothTex = tex; return tex;
}

// Adventurer kit — a fixed leather-and-cloth palette layered over whatever
// shirt/legs colours a character has, so every villager reads as "outfitted"
// (Dark Cloud's Toan) rather than a bare mannequin.
const KIT = { glove: 0x6a4a30, boot: 0x4a3524, belt: 0x2e2015, scarf: 0xe6dcc4 };

// cape/glow: faction regalia (shared/cosmetics.js) — cape is a thin slab on
// the back; glow is an emissive tint (campfire trick) so Emberpeaks cloth
// smolders after dark like everything else the mountain owns.
export function humanoid({ shirt = 0x6a8ac9, skin = 0xd9a878, hat = null, legs: legColor = 0x4a4038, cape = null, capeGlow = null, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mk = (geo, color, em) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, emissive: em || 0x000000 }));
  const mkCloth = (geo, color) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, map: clothTexture() }));

  // legs — two rounded capsules with soft feet, each hung from a HIP PIVOT at
  // the top so a walk cycle swings the whole leg from the hip (see animateFigure).
  // The mesh sits at pivot-local y = -.36, so its world centre is unchanged (.38).
  const legGeo = capsuleGeo(.15, .42, 8);
  const legPivR = new THREE.Object3D(); legPivR.position.set(.17, .74, 0); g.add(legPivR);
  const legR = mk(legGeo, legColor); legR.position.y = -.36; legR.castShadow = true; legPivR.add(legR);
  const legPivL = new THREE.Object3D(); legPivL.position.set(-.17, .74, 0); g.add(legPivL);
  const legL = mk(legGeo, legColor); legL.position.y = -.36; legL.castShadow = true; legPivL.add(legL);

  // torso — a soft tapered barrel (broader shoulders, slimmer waist), flattened
  // front-to-back, capped by a rounded shoulder dome so it doesn't read as a tube.
  // Cloth surfaces carry the woven texture; leather/skin stay flat.
  const torso = mkCloth(new THREE.CylinderGeometry(.3, .24, .8, 10, 1), shirt);
  torso.position.y = 1.12; torso.scale.z = .68; torso.castShadow = true; g.add(torso);
  const shoulders = mkCloth(new THREE.SphereGeometry(.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shirt);
  shoulders.position.y = 1.52; shoulders.scale.set(1, .5, .68); g.add(shoulders);

  // neck + rounded, slightly egg-shaped head
  const neck = mk(new THREE.CylinderGeometry(.1, .12, .16, 7), skin); neck.position.y = 1.62; g.add(neck);
  const head = mk(new THREE.SphereGeometry(.28, 12, 10), skin);
  head.position.y = 1.88; head.scale.set(.92, 1.02, .96); head.castShadow = true; g.add(head);

  if (hat) {
    // a brimmed, rounded hat — a flared brim + a squashed dome crown — instead
    // of the old single cone that read as a dunce cap (pass-2 review)
    const brim = mk(new THREE.CylinderGeometry(.42, .46, .06, 14), hat); brim.position.y = 2.05; g.add(brim);
    const crown = mk(new THREE.SphereGeometry(.25, 12, 8), hat); crown.scale.y = .82; crown.position.y = 2.17; g.add(crown);
  }
  if (cape != null) {
    const c = mk(new THREE.BoxGeometry(.72, .95, .07), cape, capeGlow);
    c.position.set(0, 1.08, -.3); c.castShadow = true; g.add(c);
  }

  // shoulder deltoids bridge torso → arm so the arms read as attached, not
  // floating (pass-2 review: "the arms don't connect with the body")
  const deltoidGeo = new THREE.SphereGeometry(.15, 8, 6);
  const deltR = mkCloth(deltoidGeo, shirt); deltR.position.set(.34, 1.45, 0); deltR.scale.z = .8; g.add(deltR);
  const deltL = mkCloth(deltoidGeo, shirt); deltL.position.set(-.34, 1.45, 0); deltL.scale.z = .8; g.add(deltL);

  // arms — rounded capsules hung from SHOULDER PIVOTS; the outward rest splay
  // lives on the pivot (rotation.z) so the walk swing (rotation.x) composes on top.
  const armGeo = capsuleGeo(.09, .5, 8);
  const armPivR = new THREE.Object3D(); armPivR.position.set(.4, 1.5, 0); armPivR.rotation.z = .14; g.add(armPivR);
  const armR = mkCloth(armGeo, shirt); armR.position.y = -.36; armPivR.add(armR);
  const armPivL = new THREE.Object3D(); armPivL.position.set(-.4, 1.5, 0); armPivL.rotation.z = -.14; g.add(armPivL);
  const armL = mkCloth(armGeo, shirt); armL.position.y = -.36; armPivL.add(armL);

  // ---- adventurer kit: collar, belt, gloves, boots (Dark Cloud outfitting) ----
  // A cream collar rolls at the neck (Toan's poncho collar); a dark belt sits on
  // the torso→legs seam and defines the waist. Both flattened front-to-back to
  // match the barrel. Torus lies flat (rotate onto the horizontal plane).
  const collar = mk(new THREE.TorusGeometry(.17, .06, 6, 16), KIT.scarf);
  collar.rotation.x = Math.PI / 2; collar.scale.z = .68; collar.position.y = 1.55; g.add(collar);
  const belt = mk(new THREE.TorusGeometry(.25, .05, 6, 16), KIT.belt);
  belt.rotation.x = Math.PI / 2; belt.scale.z = .68; belt.position.y = .82; g.add(belt);
  // Gloves & boots ride as children of their limb so they inherit its transform
  // (arm rest-angle, and a future motion pass's swing/stride) for free.
  const gloveGeo = capsuleGeo(.105, .1, 8);
  for (const arm of [armR, armL]) { const gl = mk(gloveGeo, KIT.glove); gl.position.y = -.22; arm.add(gl); }
  const bootGeo = capsuleGeo(.17, .18, 8);
  for (const leg of [legR, legL]) { const bt = mk(bootGeo, KIT.boot); bt.position.y = -.12; bt.castShadow = true; leg.add(bt); }

  // pivots are the animated handles (animateFigure rotates these each frame)
  g.userData.armR = armPivR; g.userData.armL = armPivL; g.userData.legR = legPivR; g.userData.legL = legPivL;

  g.scale.setScalar(scale);
  return g;
}

// Fidelity pass 3 (2026-07-15, Stage-1 "motion"): give the humanoid a walk
// cycle + idle sway — a moving world reads as far higher-fidelity than a static
// one with better meshes (DESIGN.md). Called each frame by the update loops
// (player: main.js, remotes: net.js, NPCs: main.js). Rotates the shoulder/hip
// PIVOTS about x for opposite-phase limb swing; no-op on non-humanoid meshes
// (critters lack the handles). Phase clock is per-figure (userData.animT) so
// the cast isn't robotically in sync. `speed` scales the stride amplitude.
export function animateFigure(mesh, dt, moving, speed = 1) {
  const u = mesh.userData;
  if (!u.armR) return;
  u.animT = (u.animT || 0) + dt;
  // Ease a 0..1 stride weight toward the movement state instead of switching
  // instantly — this is what keeps start/stop/turn from SNAPPING the limbs
  // (the old jerkiness), and also absorbs the remotes' 10 Hz moving flicker.
  const target = moving ? 1 : 0;
  u.stride = (u.stride ?? 0) + (target - (u.stride ?? 0)) * Math.min(1, dt * 6);
  const w = u.stride;
  const swing = Math.sin(u.animT * 8) * Math.min(.55, .34 * speed) * w;  // faded by weight
  const idle = Math.sin(u.animT * 1.7) * .05 * (1 - w);                  // breathing when still
  u.armR.rotation.x = swing + idle;  u.armL.rotation.x = -swing - idle;
  u.legR.rotation.x = -swing;        u.legL.rotation.x = swing;
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
