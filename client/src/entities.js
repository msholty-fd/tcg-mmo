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
