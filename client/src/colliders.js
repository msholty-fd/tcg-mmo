// 2D collision registry. World builders (world.js) register a primitive for
// each solid obstacle; resolveCollision() pushes a moving entity out of any
// penetration. Push-out (rather than move-blocking) makes wall sliding work
// without extra code. All shapes live on the XZ plane — jump height can't
// clear anything solid, so height is ignored.

export const colliders = [];

export function addCircle(x, z, r) {
  colliders.push({ x, z, r, reach: r });
}

// Rect rotated by `rot` around Y (matches THREE group rotation.y).
export function addRect(x, z, w, d, rot) {
  const hw = w / 2, hd = d / 2;
  colliders.push({ x, z, hw, hd, sin: Math.sin(rot), cos: Math.cos(rot), reach: Math.hypot(hw, hd) });
}

// Returns the corrected {x, z} for an entity of radius `pr` at (px, pz).
// Two passes so a corner push out of one collider can't leave you inside a
// neighbor.
export function resolveCollision(px, pz, pr) {
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) {
      const dx = px - c.x, dz = pz - c.z;
      const min = c.reach + pr;
      if (dx * dx + dz * dz > min * min) continue;
      if (c.r !== undefined) {
        const d = Math.hypot(dx, dz);
        if (d >= min) continue;
        if (d < 1e-6) { px = c.x + min; }
        else { px = c.x + dx / d * min; pz = c.z + dz / d * min; }
      } else {
        // into rect-local space (inverse of THREE rotation.y)
        const lx = c.cos * dx - c.sin * dz;
        const lz = c.sin * dx + c.cos * dz;
        const cx = Math.max(-c.hw, Math.min(c.hw, lx));
        const cz = Math.max(-c.hd, Math.min(c.hd, lz));
        let nx, nz;
        if (cx === lx && cz === lz) {
          // center is inside the box — exit through the nearest face
          const fx = c.hw - Math.abs(lx), fz = c.hd - Math.abs(lz);
          if (fx < fz) { nx = (Math.sign(lx) || 1) * (c.hw + pr); nz = lz; }
          else { nx = lx; nz = (Math.sign(lz) || 1) * (c.hd + pr); }
        } else {
          const ox = lx - cx, oz = lz - cz, d = Math.hypot(ox, oz);
          if (d >= pr) continue;
          nx = cx + ox / d * pr; nz = cz + oz / d * pr;
        }
        px = c.x + c.cos * nx + c.sin * nz;
        pz = c.z - c.sin * nx + c.cos * nz;
      }
    }
  }
  return { x: px, z: pz };
}
