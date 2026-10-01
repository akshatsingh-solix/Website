/**
 * Refraction map for <LiquidGlass lens>, ported from liquid-glass-js
 * (github.com/dashersw/liquid-glass-js, Armagan Amcalar, MIT - see
 * THIRD_PARTY_NOTICES.md).
 *
 * The original runs this in a WebGL shader on every frame, over an
 * html2canvas snapshot of the page: the distance to the shape's edge
 * (rounded rectangle, circle or pill), the outward normal, and a refraction
 * offset built from three exponential falloffs - edge, rim and an optional
 * centre "warp" - plus a corner boost and a fine ripple. That design costs a
 * WebGL context per element and goes stale the moment the page changes.
 *
 * Here the same field is computed once per element size and handed to the
 * browser as an SVG displacement map (see LiquidGlass.jsx), so the live
 * backdrop is refracted by the compositor: no snapshot, no WebGL, no loop.
 * Two deliberate changes: normals come from the gradient of the distance
 * field (the original used the direction from the centre for rectangles),
 * and the offset points inward, because a backdrop filter can only sample
 * what is under the element, not the page around it.
 */

// liquid-glass-js controls.js defaults.
export const GLASS_DEFAULTS = {
  edgeIntensity: 0.01,
  rimIntensity: 0.05,
  baseIntensity: 0.01,
  edgeDistance: 0.15,
  rimDistance: 0.8,
  baseDistance: 0.1,
  cornerBoost: 0.02,
  rippleEffect: 0.1,
  warp: false,
};

// The original's offsets are fractions of a page-sized texture; this turns
// them into pixels for a typical desktop page.
const PX_PER_UNIT = 900;
const MAX_MAP = 320; // longest side of the generated map, in pixels

// Signed distance to the shape's edge in CSS pixels: negative inside.
function signedDistance(shape, x, y, w, h, r) {
  if (shape === "circle") {
    return Math.hypot(x - w / 2, y - h / 2) - Math.min(w, h) / 2;
  }
  if (shape === "pill") {
    const rr = Math.min(w, h) / 2;
    if (w >= h) {
      const cx = Math.min(Math.max(x, rr), w - rr);
      return Math.hypot(x - cx, y - h / 2) - rr;
    }
    const cy = Math.min(Math.max(y, rr), h - rr);
    return Math.hypot(x - w / 2, y - cy) - rr;
  }
  // Rounded rectangle (liquid-glass-js roundedRectDistance).
  const rr = Math.min(r, w / 2, h / 2);
  const qx = Math.abs(x - w / 2) - (w / 2 - rr);
  const qy = Math.abs(y - h / 2) - (h / 2 - rr);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - rr;
}

const cache = new Map();

/**
 * Builds (and caches) the displacement map for an element.
 * Returns { url, width, height, scale } for an feDisplacementMap, where
 * red/green 128 is "no offset" and `scale` is the full offset range in px.
 */
export function glassMap({ width, height, radius = 24, shape = "rounded", params } = {}) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const p = { ...GLASS_DEFAULTS, ...params };
  const key = [shape, w, h, Math.round(radius), JSON.stringify(p)].join("|");
  if (cache.has(key)) return cache.get(key);

  const k = Math.min(1, MAX_MAP / Math.max(w, h));
  const mw = Math.max(1, Math.round(w * k));
  const mh = Math.max(1, Math.round(h * k));
  const minSide = Math.min(w, h);

  // Largest offset the falloffs can produce (at the edge itself).
  const peak = (p.edgeIntensity + p.rimIntensity + p.cornerBoost + p.rippleEffect * p.rimIntensity + (p.warp ? p.baseIntensity : 0)) * PX_PER_UNIT;
  const maxOffset = Math.min(peak, minSide * 0.35);
  const scale = Math.max(1, maxOffset * 2);

  const canvas = document.createElement("canvas");
  canvas.width = mw;
  canvas.height = mh;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(mw, mh);
  const eps = 0.75;

  for (let j = 0; j < mh; j++) {
    for (let i = 0; i < mw; i++) {
      const x = ((i + 0.5) / mw) * w;
      const y = ((j + 0.5) / mh) * h;
      const sd = signedDistance(shape, x, y, w, h, radius);
      let ox = 0;
      let oy = 0;
      if (sd < 0) {
        const d = -sd;
        // Outward normal from the gradient of the distance field.
        let nx = signedDistance(shape, x + eps, y, w, h, radius) - signedDistance(shape, x - eps, y, w, h, radius);
        let ny = signedDistance(shape, x, y + eps, w, h, radius) - signedDistance(shape, x, y - eps, w, h, radius);
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;

        // The three falloffs of the original shader.
        const edge = Math.exp(-d * p.edgeDistance);
        const rim = Math.exp(-d * p.rimDistance);
        const base = p.warp ? (1 - Math.exp(-d * p.baseDistance)) * p.baseIntensity : 0;
        let total = base + edge * p.edgeIntensity + rim * p.rimIntensity;

        // Corner boost: strongest where both edges are near.
        const u = x / w;
        const v = y / h;
        const corner = Math.max(Math.min(u, 1 - u), Math.min(v, 1 - v)) * minSide;
        total += Math.exp(-corner * 0.3) * p.cornerBoost;

        // Fine ripple along the rim, perpendicular to the normal.
        const ripple = Math.sin((d / minSide) * 25) * p.rippleEffect * rim;

        const off = Math.min(total * PX_PER_UNIT, maxOffset);
        const rip = ripple * PX_PER_UNIT;
        // Inward, so the sample stays under the element.
        ox = -nx * off + -ny * rip;
        oy = -ny * off + nx * rip;
      }
      const o = (j * mw + i) * 4;
      img.data[o] = Math.max(0, Math.min(255, Math.round(128 + (ox / scale) * 255)));
      img.data[o + 1] = Math.max(0, Math.min(255, Math.round(128 + (oy / scale) * 255)));
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const result = { url: canvas.toDataURL("image/png"), width: w, height: h, scale };
  cache.set(key, result);
  if (cache.size > 64) cache.delete(cache.keys().next().value);
  return result;
}
