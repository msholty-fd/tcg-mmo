import * as THREE from 'three';
import { smoothstep } from './utils.js';
import { scene } from './scene.js';

export function groundH(x, z) {
  let h = Math.sin(x * .04) * Math.cos(z * .045) * 3.4
    + Math.sin(x * .012 + 1.7) * Math.cos(z * .016) * 6
    + Math.sin((x + z) * .08) * .7;
  h *= smoothstep(26, 48, Math.hypot(x, z));
  // ---- Emberpeaks (far north): a mountain ridge walling off a raised
  // volcanic basin. Gated on z so the ENTIRE existing world (everything at
  // z <= ~130, including the Cinderhollow Mine at z=115) is unchanged — the
  // ridge Gaussian and the basin factor are both ~0 there. See DESIGN.md
  // "Emberpeaks". The ridge is only a *visual* wall; the actual barrier is a
  // line of collidered boulders along the crest (world.js) with a pass gap.
  const north = smoothstep(135, 185, z);                 // 0 south of ridge → 1 in the basin
  const ridge = Math.exp(-((z - 160) ** 2) / 170) * 34;  // the ridge crest (~z 160)
  const basin = north * (16 + Math.sin(x * .05) * 5 + Math.sin(z * .05 + x * .018) * 4);
  return h + ridge + basin;
}

{
  // 640×640 (±320) — grown north from the original 480 so the Emberpeaks
  // basin has room past the ridge; matches the fog-of-war map's [-320,320]
  // extent (fogOfWar.js HALF=320). Segment count scaled to keep ~5.25 u/seg.
  const geo = new THREE.PlaneGeometry(640, 640, 122, 122);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = [];
  const cG = new THREE.Color(0x567f45), cD = new THREE.Color(0x40663a),
        cP = new THREE.Color(0x9b8b64), cR = new THREE.Color(0x77806f),
        cDark = new THREE.Color(0x3a5232);
  // Emberpeaks volcanic palette — dark basalt, ash grey, and an ember glow
  // in the low basin, blended in by how far north the vertex is.
  const vBasalt = new THREE.Color(0x2b2420), vAsh = new THREE.Color(0x514740),
        vEmber = new THREE.Color(0x7a3320), vRock = new THREE.Color(0x3a332e);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = groundH(x, z), d = Math.hypot(x, z);
    pos.setY(i, h);
    let c = cG.clone().lerp(cD, (Math.sin(x * .2) * Math.cos(z * .18) + 1) / 2 * .8);
    if (d > 85) c.lerp(cDark, smoothstep(85, 130, d) * .7);
    if (h > 6.5) c.lerp(cR, smoothstep(6.5, 10, h));
    if (d < 24 && Math.abs(Math.sin(x * .4) * Math.cos(z * .4)) < .14) c.lerp(cP, .5);
    // volcanic recolor beyond the ridge
    const north = smoothstep(140, 188, z);
    if (north > 0) {
      let v = vBasalt.clone().lerp(vAsh, (Math.sin(x * .15) * Math.cos(z * .13) + 1) / 2 * .7);
      if (h > 26) v.lerp(vRock, smoothstep(26, 40, h));         // bare rock on the high ridge
      else v.lerp(vEmber, smoothstep(14, 7, h) * .55);          // ember glow in the low basin
      c.lerp(v, north);
    }
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = true;
  scene.add(mesh);
}
