import * as THREE from 'three';
import { smoothstep } from './utils.js';
import { scene } from './scene.js';

export function groundH(x, z) {
  let h = Math.sin(x * .04) * Math.cos(z * .045) * 3.4
    + Math.sin(x * .012 + 1.7) * Math.cos(z * .016) * 6
    + Math.sin((x + z) * .08) * .7;
  return h * smoothstep(26, 48, Math.hypot(x, z));
}

{
  const geo = new THREE.PlaneGeometry(480, 480, 92, 92);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = [];
  const cG = new THREE.Color(0x567f45), cD = new THREE.Color(0x40663a),
        cP = new THREE.Color(0x9b8b64), cR = new THREE.Color(0x77806f),
        cDark = new THREE.Color(0x3a5232);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = groundH(x, z), d = Math.hypot(x, z);
    pos.setY(i, h);
    let c = cG.clone().lerp(cD, (Math.sin(x * .2) * Math.cos(z * .18) + 1) / 2 * .8);
    if (d > 85) c.lerp(cDark, smoothstep(85, 130, d) * .7);
    if (h > 6.5) c.lerp(cR, smoothstep(6.5, 10, h));
    if (d < 24 && Math.abs(Math.sin(x * .4) * Math.cos(z * .4)) < .14) c.lerp(cP, .5);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = true;
  scene.add(mesh);
}
