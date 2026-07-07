export const rand = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rand(a, b + 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const $ = id => document.getElementById(id);
