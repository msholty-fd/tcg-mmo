// Fog-of-war exploration tracking for the full map overlay (fullmap.js).
// A grid over the world; cells the player has walked near are marked
// explored permanently. This is pure UI/cosmetic state — localStorage only,
// no server involvement (decided: doesn't need to survive device switches).

const CELL = 8;                            // world units per grid cell
const HALF = 320;                          // grid covers [-HALF, HALF] on both axes
export const DIM = Math.ceil((HALF * 2) / CELL);   // 80 cells per axis
const CELLS = DIM * DIM;                   // 6400 cells
const BYTES = Math.ceil(CELLS / 8);        // 800 bytes
const REVEAL_R = 38;                       // world units revealed around the player each step
const STORE_KEY = 'emberwood.fog';
const SAVE_MS = 5000;                      // matches net.js's emberwood.session save cadence

export { CELL, HALF };

let bits = new Uint8Array(BYTES);
let dirty = false;
// last cell the player revealed from — lets markExplored skip the radius
// fill entirely when the player hasn't left their current cell since the
// last call, instead of doing the math every frame at 60fps for nothing.
let lastCX = null, lastCZ = null;

function cellOf(x, z) {
  const cx = Math.min(DIM - 1, Math.max(0, Math.floor((x + HALF) / CELL)));
  const cz = Math.min(DIM - 1, Math.max(0, Math.floor((z + HALF) / CELL)));
  return { cx, cz };
}

function setCell(cx, cz) {
  const i = cz * DIM + cx;
  const byte = i >> 3, bit = 1 << (i & 7);
  if (!(bits[byte] & bit)) { bits[byte] |= bit; dirty = true; }
}

export function isExplored(x, z) {
  const { cx, cz } = cellOf(x, z);
  const i = cz * DIM + cx;
  return !!(bits[i >> 3] & (1 << (i & 7)));
}

export function markExplored(x, z, radius = REVEAL_R) {
  const { cx, cz } = cellOf(x, z);
  if (cx === lastCX && cz === lastCZ) return;   // same cell as last time — nothing new to reveal
  lastCX = cx; lastCZ = cz;
  const rc = Math.ceil(radius / CELL);
  for (let dz = -rc; dz <= rc; dz++) {
    const ncz = cz + dz;
    if (ncz < 0 || ncz >= DIM) continue;
    for (let dx = -rc; dx <= rc; dx++) {
      const ncx = cx + dx;
      if (ncx < 0 || ncx >= DIM) continue;
      if (dx * dx + dz * dz > rc * rc) continue;   // keep the reveal circular, not square
      setCell(ncx, ncz);
    }
  }
}

function toBase64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

function fromBase64(str) {
  const s = atob(str);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

export function saveFog() {
  if (!dirty) return;
  try { localStorage.setItem(STORE_KEY, toBase64(bits)); dirty = false; } catch { /* storage full/blocked — not fatal */ }
}

function loadFog() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const loaded = fromBase64(raw);
    if (loaded.length === BYTES) bits = loaded;
    // wrong length (stale format from a future/past build) — ignore, start unexplored
  } catch { /* missing/corrupt/bad base64 — start fully unexplored, never crash */ }
}
loadFog();

setInterval(saveFog, SAVE_MS);
addEventListener('beforeunload', saveFog);
