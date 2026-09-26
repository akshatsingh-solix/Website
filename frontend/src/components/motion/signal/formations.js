/**
 * Particle formations for the SignalField. Each generator returns a
 * Float32Array of `count` xyz positions in a camera-facing unit space
 * (roughly -1.2..1.2 on y; the camera sits at z = 3.2).
 *
 * Every shape is a piece of the Solix story: data as scattered noise
 * (cloud), streaming out of hundreds of systems (flow), gathered in one
 * governed core (sphere), layered into the platform (stack, cube), spread
 * across the world (globe), and activated - the Solix bolt itself.
 */

// Deterministic PRNG so a formation looks the same on every visit.
const rng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const gauss = (r) => {
  const u = Math.max(1e-6, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Streams: x is a phase in -1..1 (the shader moves it and funnels it through the core). */
const flow = (n, r) => {
  const out = new Float32Array(n * 3);
  const STREAMS = 13;
  for (let i = 0; i < n; i++) {
    const k = i % STREAMS;
    out[i * 3] = r() * 2 - 1;
    out[i * 3 + 1] = ((k + 0.5) / STREAMS - 0.5) * 2.2 + gauss(r) * 0.012;
    out[i * 3 + 2] = ((k * 7) % STREAMS / STREAMS - 0.5) * 0.9 + gauss(r) * 0.01;
  }
  return out;
};

const cloud = (n, r) => {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const rad = Math.pow(r(), 0.55);
    const s = Math.sqrt(1 - u * u);
    out[i * 3] = s * Math.cos(th) * rad * 2.1;
    out[i * 3 + 1] = u * rad * 1.15;
    out[i * 3 + 2] = s * Math.sin(th) * rad * 1.3;
  }
  return out;
};

const sphere = (n, r, radius = 1.02) => {
  const out = new Float32Array(n * 3);
  const shell = Math.floor(n * 0.82);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (i < shell) {
      y = 1 - (i / (shell - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      x = Math.cos(th) * rr;
      z = Math.sin(th) * rr;
      const j = 1 + gauss(r) * 0.012;
      x *= radius * j; y *= radius * j; z *= radius * j;
    } else {
      // A dense inner core: the governed heart of the platform.
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const rad = Math.pow(r(), 1.8) * 0.45;
      const s = Math.sqrt(1 - u * u);
      x = s * Math.cos(th) * rad; y = u * rad; z = s * Math.sin(th) * rad;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
};

/** Latitude and longitude lines: a data globe. */
const globe = (n, r) => {
  const out = new Float32Array(n * 3);
  const R = 1.05;
  for (let i = 0; i < n; i++) {
    let x, y, z;
    const pick = r();
    if (pick < 0.42) {
      const lat = (Math.floor(r() * 9) - 4) * (Math.PI / 10);
      const lon = r() * Math.PI * 2;
      x = Math.cos(lat) * Math.cos(lon); y = Math.sin(lat); z = Math.cos(lat) * Math.sin(lon);
    } else if (pick < 0.84) {
      const lon = Math.floor(r() * 12) * (Math.PI / 6);
      const lat = (r() - 0.5) * Math.PI;
      x = Math.cos(lat) * Math.cos(lon); y = Math.sin(lat); z = Math.cos(lat) * Math.sin(lon);
    } else {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      x = s * Math.cos(th); y = u; z = s * Math.sin(th);
    }
    const j = 1 + gauss(r) * 0.01;
    out[i * 3] = x * R * j; out[i * 3 + 1] = y * R * j; out[i * 3 + 2] = z * R * j;
  }
  return out;
};

const BOLT = [[23.5, 3.5], [10.5, 22.5], [18.7, 22.5], [15.2, 37], [30, 17], [21.8, 17], [26, 3.5]];
const inPoly = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** The Solix mark: the bolt, filled, inside its ring. */
const bolt = (n, r) => {
  const out = new Float32Array(n * 3);
  const ringN = Math.floor(n * 0.24);
  const S = 1.15 / 20;
  for (let i = 0; i < n; i++) {
    let x, y;
    if (i < ringN) {
      const th = r() * Math.PI * 2;
      const rad = 1.18 + gauss(r) * 0.018;
      x = Math.cos(th) * rad; y = Math.sin(th) * rad;
    } else {
      let px, py;
      do {
        px = 10 + r() * 20.5;
        py = 3 + r() * 34.5;
      } while (!inPoly(px, py, BOLT));
      x = (px - 20) * S; y = -(py - 20) * S;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = gauss(r) * 0.05;
  }
  return out;
};

/** Four governed layers, each inheriting the one beneath: the platform architecture. */
const stack = (n, r) => {
  const out = new Float32Array(n * 3);
  const LAYERS = [-0.66, -0.22, 0.22, 0.66];
  for (let i = 0; i < n; i++) {
    const L = LAYERS[i % 4];
    const th = r() * Math.PI * 2;
    const edge = r() < 0.55;
    const rad = edge ? 1.05 + gauss(r) * 0.01 : Math.sqrt(r()) * 1.05;
    out[i * 3] = Math.cos(th) * rad;
    out[i * 3 + 1] = L + gauss(r) * (edge ? 0.006 : 0.012);
    out[i * 3 + 2] = Math.sin(th) * rad;
  }
  return out;
};

/** A cube of data: edges bright, faces sparse. */
const cube = (n, r) => {
  const out = new Float32Array(n * 3);
  const s = 0.82;
  for (let i = 0; i < n; i++) {
    let x = r() * 2 - 1;
    let y = r() * 2 - 1;
    let z = r() * 2 - 1;
    const axis = Math.floor(r() * 3);
    if (r() < 0.62) {
      // snap two coordinates to the edges
      const a = r() < 0.5 ? -1 : 1;
      const b = r() < 0.5 ? -1 : 1;
      if (axis === 0) { y = a; z = b; } else if (axis === 1) { x = a; z = b; } else { x = a; y = b; }
    } else {
      const a = r() < 0.5 ? -1 : 1;
      if (axis === 0) x = a; else if (axis === 1) y = a; else z = a;
    }
    out[i * 3] = x * s; out[i * 3 + 1] = y * s; out[i * 3 + 2] = z * s;
  }
  return out;
};

/** An ecosystem ring (torus). */
const ring = (n, r) => {
  const out = new Float32Array(n * 3);
  const R = 1.0;
  const tube = 0.3;
  for (let i = 0; i < n; i++) {
    const u = r() * Math.PI * 2;
    const v = r() * Math.PI * 2;
    const t = tube * Math.sqrt(r());
    out[i * 3] = (R + t * Math.cos(v)) * Math.cos(u);
    out[i * 3 + 1] = t * Math.sin(v);
    out[i * 3 + 2] = (R + t * Math.cos(v)) * Math.sin(u);
  }
  return out;
};

/** Twin strands, linked: the data lifecycle. */
const helix = (n, r) => {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = r() * 2 - 1;
    const ang = t * Math.PI * 3.2;
    const rungs = r() < 0.18;
    const strand = i % 2 ? Math.PI : 0;
    const k = rungs ? r() * 2 - 1 : 1;
    out[i * 3] = t * 1.9;
    out[i * 3 + 1] = Math.cos(ang + strand) * 0.55 * k + gauss(r) * 0.02;
    out[i * 3 + 2] = Math.sin(ang + strand) * 0.55 * k + gauss(r) * 0.02;
  }
  return out;
};

/** A plane of records, gently undulating. */
const grid = (n, r) => {
  const out = new Float32Array(n * 3);
  const cols = Math.ceil(Math.sqrt(n * 1.8));
  for (let i = 0; i < n; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const x = (cx / (cols - 1) - 0.5) * 3.2;
    const z = (cy / Math.ceil(n / cols) - 0.5) * 2.0;
    out[i * 3] = x + gauss(r) * 0.004;
    out[i * 3 + 1] = Math.sin(x * 2.1) * 0.16 + Math.cos(z * 3.0) * 0.12;
    out[i * 3 + 2] = z;
  }
  return out;
};

/** Any short word, sampled from type (e.g. "404"). */
const text = (n, r, word) => {
  const out = new Float32Array(n * 3);
  const W = 480;
  const H = 200;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 ${Math.floor(H * 0.86)}px Outfit, "IBM Plex Sans", sans-serif`;
  g.fillText(word, W / 2, H / 2 + 6);
  const data = g.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  if (!pts.length) return cloud(n, r);
  const S = 3.4 / W;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[Math.floor(r() * pts.length)];
    out[i * 3] = (x - W / 2 + r() * 2) * S;
    out[i * 3 + 1] = -(y - H / 2 + r() * 2) * S;
    out[i * 3 + 2] = gauss(r) * 0.06;
  }
  return out;
};

/**
 * Formation catalog. `spin` is radians per second around y, `tilt` a fixed
 * tilt toward the camera, `warm` how much of the field turns Solix Red
 * (0 = mostly Solix Blue), `flow` marks the procedural stream formation.
 */
export const FORMATIONS = {
  flow: { gen: flow, spin: 0, tilt: 0, warm: 0.12, flow: true },
  cloud: { gen: cloud, spin: 0.05, tilt: 0.1, warm: 0.1 },
  sphere: { gen: sphere, spin: 0.16, tilt: 0.28, warm: 0.3 },
  globe: { gen: globe, spin: 0.14, tilt: 0.35, warm: 0.18 },
  bolt: { gen: bolt, spin: 0, tilt: 0, warm: 1 },
  stack: { gen: stack, spin: 0.2, tilt: 0.42, warm: 0.35 },
  cube: { gen: cube, spin: 0.22, tilt: 0.5, warm: 0.3 },
  ring: { gen: ring, spin: 0.18, tilt: 0.95, warm: 0.3 },
  helix: { gen: helix, spin: 0.35, tilt: 0.0, warm: 0.4, axis: "x" },
  grid: { gen: grid, spin: 0.04, tilt: 0.55, warm: 0.2 },
};

const cache = new Map();

/** Positions for `name` ("bolt", or "text:404"), memoized per count. */
export const formationPositions = (name, count) => {
  const key = `${name}|${count}`;
  if (cache.has(key)) return cache.get(key);
  const r = rng(count * 7 + name.length * 131);
  let pos;
  if (name.startsWith("text:")) pos = text(count, r, name.slice(5));
  else pos = (FORMATIONS[name] || FORMATIONS.cloud).gen(count, r);
  cache.set(key, pos);
  return pos;
};

export const formationMeta = (name) => (name.startsWith("text:") ? { spin: 0, tilt: 0, warm: 0.7 } : FORMATIONS[name] || FORMATIONS.cloud);
