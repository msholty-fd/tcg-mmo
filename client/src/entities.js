import * as THREE from 'three';

export function humanoid({ shirt = 0x6a8ac9, skin = 0xd9a878, hat = null, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mk = (geo, color) => new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
  const legs = mk(new THREE.BoxGeometry(.55, .7, .35), 0x4a4038); legs.position.y = .35; g.add(legs);
  const body = mk(new THREE.BoxGeometry(.7, .85, .45), shirt); body.position.y = 1.12; body.castShadow = true; g.add(body);
  const head = mk(new THREE.BoxGeometry(.5, .5, .5), skin); head.position.y = 1.85; head.castShadow = true; g.add(head);
  if (hat) { const h = mk(new THREE.ConeGeometry(.42, .55, 6), hat); h.position.y = 2.35; g.add(h); }
  const armR = mk(new THREE.BoxGeometry(.18, .7, .18), shirt); armR.position.set(.46, 1.15, 0); g.add(armR);
  const armL = armR.clone(); armL.position.x = -.46; g.add(armL);
  g.userData.armR = armR;
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
