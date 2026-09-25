#!/usr/bin/env node
/**
 * Draws the site's vector illustrations into public/images/art/*.svg.
 *
 *   node scripts/build-art.js
 *
 * Every scene is built from the same few primitives (isometric glass boxes,
 * glowing nodes, a fading grid floor) in the Solix palette, so they sit
 * beside the rendered photography without looking borrowed. The output is
 * committed; re-run this after changing a scene. A seeded RNG keeps the
 * particle fields identical from run to run, so diffs stay readable.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "images", "art");

const C = {
  navy: "#0D192D",
  deep: "#060D1A",
  blue: "#0088CF",
  cyan: "#5CC8F5",
  ice: "#DDF1FC",
  red: "#EE2424",
  ember: "#FF6A5C",
};

// ---------------------------------------------------------------- helpers

const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const f = (n) => Math.round(n * 10) / 10;
const pts = (list) => list.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

/** Isometric projector centred on (ox, oy) with scale s. */
const isoAt = (ox, oy, s) => (x, y, z = 0) => [ox + (x - y) * 0.866 * s, oy + (x + y) * 0.5 * s - z * s];

const defs = (id) => `
  <defs>
    <radialGradient id="${id}-bg" cx="50%" cy="42%" r="75%">
      <stop offset="0" stop-color="#12284A"/>
      <stop offset="0.55" stop-color="${C.navy}"/>
      <stop offset="1" stop-color="${C.deep}"/>
    </radialGradient>
    <radialGradient id="${id}-fade" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset="0.7" stop-color="#fff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="${id}-floor"><rect width="100%" height="100%" fill="url(#${id}-fade)"/></mask>
    <linearGradient id="${id}-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.cyan}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${C.blue}" stop-opacity="0.06"/>
    </linearGradient>
    <linearGradient id="${id}-glassR" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.red}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${C.red}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="${id}-beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.cyan}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id}-beamR" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.red}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${C.red}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>`;

const background = (id, w, h, glows = []) => [
  `<rect width="${w}" height="${h}" fill="url(#${id}-bg)"/>`,
  ...glows.map(([x, y, r, color, o = 0.35]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${color}" opacity="${o}" filter="url(#${id}-haze)"/>`),
].join("");

/** A diamond grid floor that fades out towards the edges. */
const isoFloor = (id, iso, n, step, color = C.blue) => {
  const lines = [];
  for (let i = -n; i <= n; i++) {
    const a = iso(i * step, -n * step), b = iso(i * step, n * step);
    const c = iso(-n * step, i * step), d = iso(n * step, i * step);
    lines.push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}M${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}`);
  }
  return `<g mask="url(#${id}-floor)"><path d="${lines.join("")}" stroke="${color}" stroke-width="1" opacity="0.45" fill="none"/></g>`;
};

const particles = (w, h, n, seed, color = C.cyan) => {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = 0.6 + r() * 1.8;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${r() > 0.93 ? C.red : color}" opacity="${f(0.2 + r() * 0.6)}"/>`;
  }
  return out;
};

/** Glass box with visible top and two front faces. */
const box = (id, iso, x, y, z, w, d, h, { red = false, glow = false, edge } = {}) => {
  const P = (a, b, c) => iso(a, b, c);
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const fill = red ? `url(#${id}-glassR)` : `url(#${id}-glass)`;
  const stroke = edge || (red ? C.ember : C.cyan);
  return `<g${glow ? ` filter="url(#${id}-glow)"` : ""}>
    <polygon points="${pts(left)}" fill="${fill}" stroke="${stroke}" stroke-opacity="0.55" stroke-width="1.2"/>
    <polygon points="${pts(right)}" fill="${fill}" opacity="0.7" stroke="${stroke}" stroke-opacity="0.55" stroke-width="1.2"/>
    <polygon points="${pts(top)}" fill="${red ? C.red : C.cyan}" fill-opacity="${red ? 0.35 : 0.16}" stroke="${stroke}" stroke-width="1.4"/>
  </g>`;
};

/** Flat pane lying at height z (a card, a page, a screen seen from above). */
const pane = (id, iso, x, y, z, w, d, { red = false, lines = 0, seed = 1 } = {}) => {
  const q = [iso(x, y, z), iso(x + w, y, z), iso(x + w, y + d, z), iso(x, y + d, z)];
  let text = "";
  const r = rng(seed);
  for (let i = 0; i < lines; i++) {
    const yy = y + d * (0.2 + (i * 0.6) / Math.max(1, lines - 1));
    const len = w * (0.45 + r() * 0.4);
    const a = iso(x + w * 0.12, yy, z), b = iso(x + w * 0.12 + len * 0.76, yy, z);
    text += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${i === 0 ? (red ? C.ember : C.ice) : C.cyan}" stroke-opacity="${i === 0 ? 0.9 : 0.55}" stroke-width="${i === 0 ? 3 : 2}" stroke-linecap="round"/>`;
  }
  return `<g><polygon points="${pts(q)}" fill="${red ? C.red : C.cyan}" fill-opacity="${red ? 0.22 : 0.1}" stroke="${red ? C.ember : C.cyan}" stroke-width="1.4" stroke-opacity="0.85"/>${text}</g>`;
};

const node = (id, x, y, r, color = C.cyan) =>
  `<g filter="url(#${id}-glow)"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.2)}" fill="${color}" opacity="0.18"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}"/></g>`;

const link = (a, b, color = C.cyan, o = 0.5, wdt = 1.4, dash) =>
  `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${color}" stroke-opacity="${o}" stroke-width="${wdt}"${dash ? ` stroke-dasharray="${dash}"` : ""} fill="none"/>`;

const beam = (id, iso, x, y, z0, z1, red = false, width = 14) => {
  const a = iso(x, y, z1), b = iso(x, y, z0);
  return `<rect x="${f(a[0] - width / 2)}" y="${f(a[1])}" width="${width}" height="${f(b[1] - a[1])}" fill="url(#${id}-${red ? "beamR" : "beam"})" opacity="0.6"/>`;
};

const ring = (id, cx, cy, rx, ry, color = C.cyan, o = 0.5, dash) =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${color}" stroke-opacity="${o}" stroke-width="1.4"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

const svg = (id, w, h, title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">${defs(id)}${body}</svg>\n`;

// ----------------------------------------------------------------- scenes
// Each scene takes (id, w, h) and returns the inner markup.

const scenes = {
  /** DNA helix rising from a lab grid, molecules orbiting: pharma & biotech. */
  pharma(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.7, 1);
    let helix = "", rungs = "";
    const N = 34, cx = w * 0.52, top = h * 0.1, bottom = h * 0.78;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), y = bottom - t * (bottom - top), ph = t * Math.PI * 4.2;
      const xA = cx + Math.sin(ph) * w * 0.12, xB = cx + Math.sin(ph + Math.PI) * w * 0.12;
      const dA = (Math.cos(ph) + 1) / 2, dB = 1 - dA;
      if (i % 2 === 0) rungs += link([xA, y], [xB, y], i % 8 === 0 ? C.red : C.cyan, 0.35, 1.6);
      helix += node(id, xA, y, 2.5 + dA * 4, i % 11 === 5 ? C.red : C.cyan).replace("<g ", `<g opacity="${f(0.45 + dA * 0.55)}" `);
      helix += node(id, xB, y, 2.5 + dB * 4, C.blue).replace("<g ", `<g opacity="${f(0.45 + dB * 0.55)}" `);
    }
    const hex = (hx, hy, r, color) => {
      const p = [...Array(6)].map((_, k) => [hx + r * Math.cos((Math.PI / 3) * k + Math.PI / 6), hy + r * Math.sin((Math.PI / 3) * k + Math.PI / 6)]);
      return `<polygon points="${pts(p)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-opacity="0.8"/>` + p.map(([a, b]) => `<circle cx="${f(a)}" cy="${f(b)}" r="3" fill="${color}"/>`).join("");
    };
    const mol = (mx, my, s, red) => `<g filter="url(#${id}-glow)">${hex(mx, my, 26 * s, red ? C.ember : C.cyan)}${hex(mx + 45 * s, my + 26 * s, 26 * s, C.cyan)}${link([mx + 45 * s, my - 26 * s + 26 * s], [mx + 45 * s, my - 30 * s], C.cyan, 0.8, 1.6)}</g>`;
    return [
      background(id, w, h, [[w * 0.52, h * 0.45, 260, C.blue, 0.4], [w * 0.52, h * 0.3, 90, C.red, 0.25]]),
      particles(w, h, 90, 11),
      isoFloor(id, iso, 9, 40),
      box(id, iso, -330, 60, 0, 90, 70, 26), box(id, iso, 180, -330, 0, 80, 90, 18), box(id, iso, 250, -60, 0, 60, 60, 44, { red: true }),
      pane(id, iso, -170, 230, 40, 110, 80, { lines: 4, seed: 3 }),
      ring(id, cx, bottom + 4, w * 0.2, w * 0.055, C.cyan, 0.5), ring(id, cx, bottom + 4, w * 0.27, w * 0.075, C.blue, 0.35, "4 8"),
      rungs, helix,
      mol(w * 0.16, h * 0.28, 1, true), mol(w * 0.76, h * 0.2, 0.8, false), mol(w * 0.8, h * 0.56, 0.6, false),
    ].join("");
  },

  /** Floating stack of documents with one highlighted: the resource library. */
  library(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.7, Math.min(1.45, h / 620));
    let docs = "";
    const cards = [[-180, -60, 40, false, 1], [-40, -150, 90, false, 2], [-110, 20, 150, true, 3], [40, -40, 210, false, 4], [-30, -80, 270, false, 5]];
    cards.forEach(([x, y, z, red, s]) => {
      docs += beam(id, iso, x + 70, y + 50, 0, z, red, 3);
      docs += pane(id, iso, x, y, z, 150, 110, { red, lines: 5, seed: s });
    });
    const lens = iso(120, 90, 200);
    return [
      background(id, w, h, [[w * 0.5, h * 0.4, 280, C.blue, 0.4], [w * 0.45, h * 0.45, 100, C.red, 0.18]]),
      particles(w, h, 80, 21),
      isoFloor(id, iso, 9, 40),
      box(id, iso, -230, 100, 0, 60, 60, 30), box(id, iso, 130, -200, 0, 60, 60, 50), box(id, iso, 170, 80, 0, 50, 50, 20, { red: true }),
      docs,
      `<g filter="url(#${id}-glow)"><circle cx="${f(lens[0])}" cy="${f(lens[1])}" r="46" fill="${C.cyan}" fill-opacity="0.08" stroke="${C.ice}" stroke-width="3"/><path d="M${f(lens[0] + 33)} ${f(lens[1] + 33)}l42 42" stroke="${C.ice}" stroke-width="7" stroke-linecap="round"/></g>`,
    ].join("");
  },

  /** A delivery blueprint: modules on a platform joined by a milestone path. */
  services(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.55, 1);
    const path = [[-200, 120], [-200, -40], [-40, -40], [-40, -200], [140, -200]];
    const segs = path.slice(1).map((p, i) => link(iso(path[i][0], path[i][1], 24), iso(p[0], p[1], 24), C.cyan, 0.9, 3)).join("");
    const stops = [path[0], path[2], path[4]].map((p, i) => { const q = iso(p[0], p[1], 24); return node(id, q[0], q[1], 7, i === 2 ? C.red : C.cyan); }).join("");
    const gear = (gx, gy, r, teeth, color) => {
      let d = "";
      for (let k = 0; k < teeth * 2; k++) {
        const a = (Math.PI * k) / teeth, rr = k % 2 ? r : r * 1.18;
        d += `${k ? "L" : "M"}${f(gx + rr * Math.cos(a))} ${f(gy + rr * Math.sin(a) * 0.5)}`;
      }
      return `<g filter="url(#${id}-glow)"><path d="${d}Z" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.6"/><ellipse cx="${f(gx)}" cy="${f(gy)}" rx="${f(r * 0.4)}" ry="${f(r * 0.2)}" fill="none" stroke="${color}" stroke-width="1.6"/></g>`;
    };
    return [
      background(id, w, h, [[w * 0.5, h * 0.45, 300, C.blue, 0.38], [w * 0.62, h * 0.3, 90, C.red, 0.2]]),
      particles(w, h, 80, 31),
      isoFloor(id, iso, 10, 40),
      box(id, iso, -260, -260, 0, 480, 440, 24, { edge: C.blue }),
      box(id, iso, -240, 60, 24, 90, 90, 70), box(id, iso, -90, -110, 24, 100, 100, 120), box(id, iso, 90, -250, 24, 90, 90, 190, { red: true, glow: true }),
      box(id, iso, 80, 20, 24, 110, 110, 40),
      segs, stops,
      gear(w * 0.8, h * 0.2, 44, 10, C.cyan), gear(w * 0.88, h * 0.29, 26, 8, C.ember),
      ring(id, w * 0.5, h * 0.55, w * 0.42, w * 0.13, C.cyan, 0.25, "3 9"),
    ].join("");
  },

  /** Rising isometric bar chart with a trend line: a customer outcome. */
  growth(id, w, h) {
    const iso = isoAt(w * 0.48, h * 0.66, 1);
    const hs = [40, 70, 95, 140, 190, 250];
    let bars = "", tops = [];
    hs.forEach((bh, i) => {
      const x = -200 + i * 70, y = 60 - i * 40;
      bars += box(id, iso, x, y, 0, 46, 46, bh, { red: i === hs.length - 1, glow: i === hs.length - 1 });
      tops.push(iso(x + 23, y + 23, bh + 30));
    });
    const line = tops.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("");
    return [
      background(id, w, h, [[w * 0.55, h * 0.4, 280, C.blue, 0.38], [tops[5][0], tops[5][1], 90, C.red, 0.3]]),
      particles(w, h, 70, 41),
      isoFloor(id, iso, 9, 40),
      bars,
      `<path d="${line}" fill="none" stroke="${C.ice}" stroke-width="2.4" stroke-dasharray="6 6" opacity="0.85"/>`,
      tops.map((p, i) => node(id, p[0], p[1], 4.5, i === 5 ? C.red : C.cyan)).join(""),
    ].join("");
  },

  /** Two network clusters joined by a bright bridge: a partnership. */
  partner(id, w, h) {
    const r = rng(51);
    const cluster = (cx, cy, n, spread, color) => {
      const ns = [...Array(n)].map(() => [cx + (r() - 0.5) * spread, cy + (r() - 0.5) * spread * 0.8]);
      let s = "";
      ns.forEach((a, i) => ns.slice(i + 1).forEach((b) => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < spread * 0.42) s += link(a, b, color, 0.35, 1); }));
      ns.forEach((a) => (s += node(id, a[0], a[1], 2 + r() * 3.5, color)));
      return { s, core: [cx, cy] };
    };
    const A = cluster(w * 0.28, h * 0.5, 26, w * 0.3, C.cyan), B = cluster(w * 0.72, h * 0.5, 26, w * 0.3, C.cyan);
    return [
      background(id, w, h, [[w * 0.28, h * 0.5, 200, C.blue, 0.4], [w * 0.72, h * 0.5, 200, C.blue, 0.4], [w * 0.5, h * 0.5, 80, C.red, 0.35]]),
      particles(w, h, 70, 52),
      ring(id, w * 0.28, h * 0.5, w * 0.17, w * 0.17, C.cyan, 0.25), ring(id, w * 0.72, h * 0.5, w * 0.17, w * 0.17, C.cyan, 0.25),
      A.s, B.s,
      `<g filter="url(#${id}-glow)"><path d="M${f(w * 0.28)} ${f(h * 0.5)}C${f(w * 0.42)} ${f(h * 0.36)} ${f(w * 0.58)} ${f(h * 0.36)} ${f(w * 0.72)} ${f(h * 0.5)}" stroke="${C.red}" stroke-width="3" fill="none"/><path d="M${f(w * 0.28)} ${f(h * 0.5)}C${f(w * 0.42)} ${f(h * 0.64)} ${f(w * 0.58)} ${f(h * 0.64)} ${f(w * 0.72)} ${f(h * 0.5)}" stroke="${C.ice}" stroke-width="2" fill="none" opacity="0.8"/></g>`,
      node(id, w * 0.28, h * 0.5, 10, C.ice), node(id, w * 0.72, h * 0.5, 10, C.ice), node(id, w * 0.5, h * 0.395, 7, C.red),
    ].join("");
  },

  /** A keynote stage under light beams with an audience of dots. */
  stage(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.5, 1);
    const r = rng(61);
    let crowd = "";
    for (let i = 0; i < 160; i++) {
      const x = -260 + r() * 520, y = 60 + r() * 220;
      const p = iso(x, y, 0);
      crowd += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(1.8 + r() * 1.6)}" fill="${r() > 0.9 ? C.ember : C.cyan}" opacity="${f(0.35 + r() * 0.5)}"/>`;
    }
    const cone = (x, color, o) => `<polygon points="${f(x)},0 ${f(x - 26)},0 ${f(w * 0.5 - 150)},${f(h * 0.5)} ${f(w * 0.5 + 150)},${f(h * 0.5)}" fill="${color}" opacity="${o}"/>`;
    return [
      background(id, w, h, [[w * 0.5, h * 0.4, 280, C.blue, 0.42], [w * 0.5, h * 0.35, 110, C.red, 0.3]]),
      `<g opacity="0.55">${cone(w * 0.2, `url(#${id}-beam)`, 0.5)}${cone(w * 0.5 + 13, `url(#${id}-beamR)`, 0.45)}${cone(w * 0.8, `url(#${id}-beam)`, 0.5)}</g>`,
      particles(w, h, 60, 62),
      isoFloor(id, iso, 10, 40),
      box(id, iso, -170, -150, 0, 340, 150, 30, { edge: C.blue }),
      `<g filter="url(#${id}-glow)"><polygon points="${pts([iso(-150, -150, 60), iso(150, -150, 60), iso(150, -150, 230), iso(-150, -150, 230)])}" fill="${C.cyan}" fill-opacity="0.12" stroke="${C.cyan}" stroke-width="2"/></g>`,
      (() => { const c = iso(0, -150, 145); return `${ring(id, c[0], c[1], 70, 38, C.ice, 0.8)}${node(id, c[0], c[1], 12, C.red)}`; })(),
      crowd,
    ].join("");
  },

  /** A stack of glowing cubes around a bright core: a product launch. */
  launch(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.66, 1.6);
    let cubes = "";
    const layout = [[0, 0, 0], [60, 0, 0], [0, 60, 0], [60, 60, 0], [0, 0, 60], [60, 0, 60], [0, 60, 60], [60, 60, 60, true], [30, 30, 120]];
    layout.forEach(([x, y, z, red]) => (cubes += box(id, iso, x - 60, y - 60, z, 56, 56, 56, { red, glow: red })));
    const core = iso(0, 0, 150);
    return [
      background(id, w, h, [[w * 0.5, h * 0.42, 280, C.blue, 0.42], [core[0], core[1], 100, C.red, 0.3]]),
      particles(w, h, 90, 71),
      isoFloor(id, iso, 10, 40),
      ring(id, w * 0.5, h * 0.58, 260, 90, C.cyan, 0.4), ring(id, w * 0.5, h * 0.52, 330, 120, C.blue, 0.3, "4 10"),
      beam(id, iso, 0, 0, 150, 420, false, 30),
      cubes,
    ].join("");
  },

  /** Isometric office towers: the company and its engineering centres. */
  campus(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.68, 1);
    let towers = "";
    [[-200, -40, 70, 70, 150], [-100, -160, 80, 80, 260], [20, -60, 90, 90, 330, true], [150, -170, 70, 70, 200], [80, 90, 80, 60, 110], [-160, 100, 90, 60, 80]]
      .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
      .forEach(([x, y, bw, bd, bh, red]) => {
        towers += box(id, iso, x, y, 0, bw, bd, bh, { red, glow: red });
        for (let z = 24; z < bh - 10; z += 26) towers += link(iso(x + bw, y + 6, z), iso(x + bw, y + bd - 6, z), red ? C.ember : C.cyan, 0.4, 1);
      });
    return [
      background(id, w, h, [[w * 0.5, h * 0.4, 300, C.blue, 0.4], [w * 0.56, h * 0.3, 100, C.red, 0.25]]),
      particles(w, h * 0.6, 80, 81),
      isoFloor(id, iso, 10, 40),
      towers,
    ].join("");
  },

  /** A video frame with a play control: webinars. */
  screen(id, w, h) {
    const cx = w * 0.5, cy = h * 0.48, sw = w * 0.5, sh = sw * 0.56;
    return [
      background(id, w, h, [[cx, cy, 260, C.blue, 0.42], [cx, cy, 80, C.red, 0.3]]),
      particles(w, h, 70, 91),
      isoFloor(id, isoAt(cx, h * 0.9, 1), 10, 40),
      `<g filter="url(#${id}-glow)"><rect x="${f(cx - sw / 2)}" y="${f(cy - sh / 2)}" width="${f(sw)}" height="${f(sh)}" rx="14" fill="${C.cyan}" fill-opacity="0.08" stroke="${C.cyan}" stroke-width="2"/></g>`,
      `<rect x="${f(cx - sw / 2 + 20)}" y="${f(cy + sh / 2 - 26)}" width="${f(sw - 40)}" height="4" rx="2" fill="${C.cyan}" opacity="0.3"/><rect x="${f(cx - sw / 2 + 20)}" y="${f(cy + sh / 2 - 26)}" width="${f((sw - 40) * 0.38)}" height="4" rx="2" fill="${C.red}"/>`,
      `<g filter="url(#${id}-glow)"><circle cx="${f(cx)}" cy="${f(cy - 8)}" r="46" fill="${C.red}" fill-opacity="0.2" stroke="${C.ember}" stroke-width="2.5"/><polygon points="${f(cx - 14)},${f(cy - 32)} ${f(cx + 24)},${f(cy - 8)} ${f(cx - 14)},${f(cy + 16)}" fill="${C.ice}"/></g>`,
      ring(id, cx, cy, sw * 0.72, sh * 0.72, C.cyan, 0.2, "3 9"),
    ].join("");
  },

  /** Concentric sound waveform around a microphone node: podcasts. */
  wave(id, w, h) {
    const cx = w * 0.5, cy = h * 0.5;
    let bars = "";
    const n = 56;
    for (let i = 0; i < n; i++) {
      const x = w * 0.1 + (i * w * 0.8) / (n - 1);
      const amp = (Math.sin(i * 0.45) * 0.5 + 0.5) * (1 - Math.abs(i - n / 2) / (n / 2)) * h * 0.32 + 6;
      const red = Math.abs(i - n / 2) < 3;
      bars += `<rect x="${f(x - 3)}" y="${f(cy - amp)}" width="6" height="${f(amp * 2)}" rx="3" fill="${red ? C.red : C.cyan}" opacity="${red ? 0.95 : f(0.35 + amp / (h * 0.5))}"/>`;
    }
    return [
      background(id, w, h, [[cx, cy, 260, C.blue, 0.4], [cx, cy, 70, C.red, 0.3]]),
      particles(w, h, 60, 101),
      `<g filter="url(#${id}-glow)">${bars}</g>`,
      ring(id, cx, cy, 90, 90, C.ice, 0.35), ring(id, cx, cy, 150, 150, C.cyan, 0.2, "3 8"),
    ].join("");
  },

  /** An open book whose pages lift off as data: ebooks. */
  book(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.64, 1.4);
    let pages = "";
    for (let i = 0; i < 5; i++) pages += pane(id, iso, -150 + i * 4, -100 - i * 4, 20 + i * 5, 140, 200, { lines: i === 4 ? 6 : 0, seed: 7 });
    for (let i = 0; i < 5; i++) pages += pane(id, iso, 0 + i * 4, -100 - i * 4, 20 + i * 5, 140, 200, { lines: i === 4 ? 6 : 0, seed: 8, red: i === 4 });
    const r = rng(111);
    let bits = "";
    for (let i = 0; i < 26; i++) { const p = iso(-40 + r() * 160, -140 + r() * 160, 80 + r() * 220); bits += `<rect x="${f(p[0])}" y="${f(p[1])}" width="${f(4 + r() * 8)}" height="${f(4 + r() * 8)}" fill="${r() > 0.85 ? C.red : C.cyan}" opacity="${f(0.3 + r() * 0.6)}"/>`; }
    return [background(id, w, h, [[w * 0.5, h * 0.42, 260, C.blue, 0.42], [w * 0.55, h * 0.3, 80, C.red, 0.22]]), particles(w, h, 60, 112), isoFloor(id, iso, 10, 40), pages, bits].join("");
  },

  /** A mountain path with a flag at the summit: leadership lessons. */
  summit(id, w, h) {
    const base = h * 0.82;
    const ridge = [[0, base], [w * 0.18, h * 0.55], [w * 0.3, h * 0.64], [w * 0.5, h * 0.24], [w * 0.64, h * 0.46], [w * 0.78, h * 0.38], [w, base]];
    const d = ridge.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("");
    const trail = [[w * 0.12, base - 10], [w * 0.26, h * 0.62], [w * 0.36, h * 0.52], [w * 0.44, h * 0.34], [w * 0.5, h * 0.24]];
    return [
      background(id, w, h, [[w * 0.5, h * 0.3, 260, C.blue, 0.42], [w * 0.5, h * 0.22, 80, C.red, 0.3]]),
      particles(w, h * 0.6, 90, 121),
      `<path d="${d}Z" fill="${C.cyan}" fill-opacity="0.08" stroke="${C.cyan}" stroke-width="2" stroke-opacity="0.8"/>`,
      `<path d="M${f(w * 0.3)} ${f(h * 0.64)}L${f(w * 0.5)} ${f(base)}M${f(w * 0.5)} ${f(h * 0.24)}L${f(w * 0.5)} ${f(base)}M${f(w * 0.64)} ${f(h * 0.46)}L${f(w * 0.5)} ${f(base)}" stroke="${C.cyan}" stroke-opacity="0.25"/>`,
      `<path d="${trail.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("")}" fill="none" stroke="${C.ice}" stroke-width="2.4" stroke-dasharray="5 7"/>`,
      trail.slice(0, -1).map((p) => node(id, p[0], p[1], 4, C.cyan)).join(""),
      `<g filter="url(#${id}-glow)"><path d="M${f(w * 0.5)} ${f(h * 0.24)}V${f(h * 0.1)}" stroke="${C.ice}" stroke-width="3"/><path d="M${f(w * 0.5)} ${f(h * 0.1)}l${f(w * 0.07)} ${f(h * 0.035)}l-${f(w * 0.07)} ${f(h * 0.035)}Z" fill="${C.red}"/></g>`,
    ].join("");
  },

  /** A spreadsheet-style grid panel with a few highlighted cells: datasheets. */
  grid(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.52, 1.3);
    let cells = "";
    const r = rng(131);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) {
      const hl = r() > 0.8, red = !hl && r() > 0.94;
      const z = hl ? 18 + r() * 40 : red ? 30 : 0;
      cells += hl || red ? box(id, iso, -180 + i * 60, -150 + j * 60, 0, 52, 52, z, { red, glow: red }) : pane(id, iso, -180 + i * 60, -150 + j * 60, 0, 52, 52, {});
    }
    return [background(id, w, h, [[w * 0.5, h * 0.45, 280, C.blue, 0.42]]), particles(w, h, 70, 132), isoFloor(id, iso, 10, 40), cells].join("");
  },

  /** A checklist panel with ticks: solution briefs and playbooks. */
  checklist(id, w, h) {
    const iso = isoAt(w * 0.52, h * 0.64, 1.4);
    const q = (x, y, z) => iso(x, y, z);
    let rows = "";
    for (let i = 0; i < 4; i++) {
      const y = -130 + i * 55;
      const c = q(-110, y + 20, 120);
      rows += `<g filter="url(#${id}-glow)"><circle cx="${f(c[0])}" cy="${f(c[1])}" r="10" fill="${i === 3 ? C.red : C.cyan}" fill-opacity="0.25" stroke="${i === 3 ? C.ember : C.cyan}" stroke-width="2"/></g>`;
      rows += link(q(-80, y + 20, 120), q(40 + (i % 2) * 40, y + 20, 120), C.ice, 0.75, 3);
    }
    return [
      background(id, w, h, [[w * 0.5, h * 0.42, 280, C.blue, 0.42], [w * 0.4, h * 0.6, 80, C.red, 0.2]]),
      particles(w, h, 70, 142), isoFloor(id, iso, 10, 40),
      beam(id, iso, -20, -30, 0, 120, false, 6),
      pane(id, iso, -150, -170, 120, 260, 250, {}),
      rows,
    ].join("");
  },

  /** A document with a pen stroke: blog posts and articles. */
  article(id, w, h) {
    const iso = isoAt(w * 0.5, h * 0.62, 1.3);
    const pen = [iso(80, 40, 160), iso(200, -80, 260)];
    return [
      background(id, w, h, [[w * 0.5, h * 0.42, 280, C.blue, 0.4], [pen[0][0], pen[0][1], 70, C.red, 0.3]]),
      particles(w, h, 70, 152), isoFloor(id, iso, 10, 40),
      pane(id, iso, -170, -150, 60, 220, 260, { lines: 8, seed: 9 }),
      pane(id, iso, -140, -180, 120, 220, 260, { lines: 8, seed: 10 }),
      `<g filter="url(#${id}-glow)"><path d="M${f(pen[0][0])} ${f(pen[0][1])}L${f(pen[1][0])} ${f(pen[1][1])}" stroke="${C.ice}" stroke-width="10" stroke-linecap="round"/><circle cx="${f(pen[0][0])}" cy="${f(pen[0][1])}" r="6" fill="${C.red}"/></g>`,
    ].join("");
  },

  /** Signal rings radiating from a beacon: marketing material. */
  beacon(id, w, h) {
    const cx = w * 0.5, cy = h * 0.55;
    let rings = "";
    for (let i = 1; i <= 6; i++) rings += ring(id, cx, cy, i * 60, i * 26, i === 2 ? C.red : C.cyan, f(0.7 - i * 0.09));
    return [
      background(id, w, h, [[cx, cy, 260, C.blue, 0.42], [cx, cy - 40, 80, C.red, 0.3]]),
      particles(w, h, 80, 162), isoFloor(id, isoAt(cx, cy, 1), 10, 40), rings,
      beam(id, isoAt(cx, cy, 1), 0, 0, 0, 260, true, 10),
      node(id, cx, cy - 260, 9, C.red), node(id, cx, cy, 12, C.ice),
    ].join("");
  },
};

// ---------------------------------------------------------------- outputs
// file -> [scene, width, height, accessible title]
const HERO = [1200, 900];
const CARD = [1200, 675];
const OUTPUTS = {
  "pharma-biotech.svg": ["pharma", ...HERO, "A glowing DNA helix rising from laboratory data"],
  "resources-library.svg": ["library", ...HERO, "A floating stack of documents under a search lens"],
  "services-blueprint.svg": ["services", ...HERO, "Delivery modules on a platform joined by a milestone path"],
  "news-customer.svg": ["growth", ...HERO, "A rising bar chart of customer outcomes"],
  "news-partner.svg": ["partner", ...HERO, "Two data networks joined by a partnership bridge"],
  "news-event.svg": ["stage", ...HERO, "A keynote stage under light beams"],
  "news-product.svg": ["launch", ...HERO, "A stack of glowing cubes around a bright core"],
  "news-company.svg": ["campus", ...HERO, "Isometric office towers"],
  "cover-whitepaper.svg": ["library", ...CARD, "Stack of research documents"],
  "cover-blog.svg": ["article", ...CARD, "A document and a pen"],
  "cover-webinar.svg": ["screen", ...CARD, "A video frame with a play control"],
  "cover-casestudy.svg": ["growth", ...CARD, "A rising bar chart"],
  "cover-podcast.svg": ["wave", ...CARD, "A sound waveform"],
  "cover-event.svg": ["stage", ...CARD, "A keynote stage"],
  "cover-datasheet.svg": ["grid", ...CARD, "A data grid with highlighted cells"],
  "cover-ebook.svg": ["book", ...CARD, "An open book releasing data"],
  "cover-leadership.svg": ["summit", ...CARD, "A path to a summit flag"],
  "cover-brief.svg": ["checklist", ...CARD, "A checklist panel"],
  "cover-collateral.svg": ["beacon", ...CARD, "Signal rings from a beacon"],
};

fs.mkdirSync(OUT, { recursive: true });
for (const [file, [scene, w, h, title]] of Object.entries(OUTPUTS)) {
  const id = file.replace(/\.svg$/, "");
  const markup = svg(id, w, h, title, scenes[scene](id, w, h));
  fs.writeFileSync(path.join(OUT, file), markup);
  console.log(`  ${file} (${Math.round(markup.length / 1024)} KB)`);
}
