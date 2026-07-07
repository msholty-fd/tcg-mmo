import * as THREE from 'three';
import { rand } from './utils.js';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 700);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'game';
document.body.insertBefore(renderer.domElement, document.body.firstChild);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.fog = new THREE.Fog(0x8ab0d0, 70, 300);
scene.background = new THREE.Color(0x8ab0d0);

export const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3a4a2e, .65);
scene.add(hemi);

export const sun = new THREE.DirectionalLight(0xfff2d0, 1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
sun.shadow.camera.far = 420;
scene.add(sun); scene.add(sun.target);

const starGeo = new THREE.BufferGeometry();
{
  const p = [];
  for (let i = 0; i < 600; i++) {
    const t = rand(0, Math.PI * 2), u = rand(.15, 1);
    p.push(500 * Math.cos(t) * u, 500 * Math.sqrt(1 - u * u) * rand(.3, 1), 500 * Math.sin(t) * u);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
}
export const starMat = new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.5, transparent: true, opacity: 0, sizeAttenuation: false });
scene.add(new THREE.Points(starGeo, starMat));

// visible sun & moon: soft glow sprites, immune to fog, positioned each frame
function glowSprite(inner, mid, size) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(.35, mid);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, fog: false, depthWrite: false,
  }));
  sp.scale.set(size, size, 1);
  scene.add(sp);
  return sp;
}
export const sunDisc = glowSprite('#fff8e0', 'rgba(255,205,90,.85)', 64);
export const moonDisc = glowSprite('#f0f4ff', 'rgba(165,185,230,.8)', 40);
