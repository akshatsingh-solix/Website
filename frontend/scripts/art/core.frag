#version 300 es
// "The Governed Core" - hero key visual. A glass data sphere with a plasma
// heart (Solix Red), orbital rings of governed data (Solix Blue), streams of
// records converging from the left, a reflective grid floor and bokeh.
precision highp float;
uniform vec2 R;
uniform float T;
out vec4 o;

const vec3 NAVY = vec3(0.018, 0.036, 0.072);
const vec3 BLUE = vec3(0.0, 0.533, 0.812);
const vec3 ICE = vec3(0.62, 0.84, 1.0);
const vec3 RED = vec3(0.933, 0.141, 0.141);
const vec3 EMBER = vec3(1.0, 0.45, 0.25);

float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 3.1; a *= 0.5; } return s; }

mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, -s, 0, s, c); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, s, 0, 1, 0, -s, 0, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, -s, 0, s, c, 0, 0, 0, 1); }

float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }

// Three orbital rings at different tilts.
float rings(vec3 p, out float which) {
  float d1 = sdTorus(rotZ(0.35) * rotX(1.25) * p, vec2(1.62, 0.006));
  float d2 = sdTorus(rotZ(-0.6) * rotX(1.05) * rotY(0.4) * p, vec2(1.95, 0.005));
  float d3 = sdTorus(rotX(1.45) * rotZ(0.12) * p, vec2(2.35, 0.004));
  float d = min(d1, min(d2, d3));
  which = d == d1 ? 0.0 : (d == d2 ? 1.0 : 2.0);
  return d;
}

// Tiny "data packets" riding each ring.
float packets(vec3 p) {
  float g = 0.0;
  vec3 q1 = rotZ(0.35) * rotX(1.25) * p;
  float a1 = atan(q1.z, q1.x);
  g += smoothstep(0.93, 1.0, sin(a1 * 7.0 + 1.3)) * exp(-abs(length(q1.xz) - 1.62) * 60.0) * exp(-abs(q1.y) * 60.0);
  vec3 q2 = rotZ(-0.6) * rotX(1.05) * rotY(0.4) * p;
  float a2 = atan(q2.z, q2.x);
  g += smoothstep(0.95, 1.0, sin(a2 * 11.0 - 0.7)) * exp(-abs(length(q2.xz) - 1.95) * 60.0) * exp(-abs(q2.y) * 60.0);
  return g;
}

vec2 sphereHit(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - r * r;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * R) / R.y;
  float aspect = R.x / R.y;
  // The core sits right of centre, leaving calm space for copy on the left.
  vec2 center = vec2(0.30 * aspect, 0.03);

  vec3 ro = vec3(0.0, 0.32, 6.4);
  vec3 ta = vec3(0.0, 0.05, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  vec3 vv = cross(uu, ww);
  vec2 q = uv - center;
  vec3 rd = normalize(q.x * uu + q.y * vv + 1.55 * ww);

  // Background: deep navy with a soft blue bloom around the core.
  float rq = length(q);
  vec3 col = NAVY * (1.0 - 0.35 * length(uv * vec2(0.6, 1.0)));
  col += BLUE * 0.07 * exp(-rq * 1.8);
  col += RED * 0.035 * exp(-rq * 3.5);

  // --- Floor: a perspective data grid with a pool of core light --------------
  float floorY = -1.55;
  if (rd.y < 0.0) {
    float tf = (floorY - ro.y) / rd.y;
    vec3 fp = ro + rd * tf;
    vec2 g = abs(fract(fp.xz * 1.2) - 0.5);
    float lw = fwidth(fp.x * 1.2) * 1.2 + 0.004;
    float line = max(smoothstep(lw, 0.0, g.x), smoothstep(lw, 0.0, g.y));
    float fade = exp(-tf * 0.18) * smoothstep(14.0, 4.0, tf);
    float pool = exp(-length(fp.xz) * 0.9);
    col += BLUE * line * fade * (0.18 + 0.9 * pool);
    col += RED * pool * pool * 0.22 * fade;
    // Soft reflection of the core.
    col += mix(RED, EMBER, 0.4) * exp(-length(fp.xz - vec2(0.0, 0.0)) * 2.2) * 0.25 * fade;
  }

  // --- Rings: volumetric neon glow by marching the ray -------------------------
  float glowRing = 0.0;
  vec3 ringCol = vec3(0.0);
  float t = 0.0;
  for (int i = 0; i < 140; i++) {
    vec3 p = ro + rd * t;
    float w;
    float d = rings(p, w);
    float g = 0.00045 / (0.00012 + d * d * 12.0);
    float pk = packets(p);
    // Rings dim where they pass behind the sphere, and with depth.
    float behind = (length(p) < 1.5 && p.z < 0.0) ? 0.25 : 1.0;
    float depth = smoothstep(-3.0, 2.5, p.z) * 0.7 + 0.3;
    vec3 c = w == 0.0 ? BLUE : (w == 1.0 ? ICE * 0.7 : BLUE * 0.75);
    ringCol += (c * g * 0.028 + mix(ICE, RED, 0.3) * pk * 0.5) * behind * depth;
    t += clamp(d * 0.6, 0.012, 0.12);
    if (t > 12.0) break;
  }

  // --- Glass sphere with a plasma heart ---------------------------------------
  float Rs = 0.86;
  vec2 hs = sphereHit(ro, rd, Rs);
  vec3 sphereCol = vec3(0.0);
  float occl = 1.0;
  if (hs.x > 0.0) {
    vec3 pe = ro + rd * hs.x;
    vec3 n = normalize(pe);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.2);
    // Latitude / longitude lattice etched into the glass.
    float th = acos(clamp(n.y, -1.0, 1.0));
    float ph = atan(n.z, n.x);
    float lat = abs(fract(th / 3.14159 * 12.0) - 0.5);
    float lon = abs(fract(ph / 6.28318 * 24.0) - 0.5);
    float lattice = max(smoothstep(0.03, 0.0, lat), smoothstep(0.03, 0.0, lon)) * (0.25 + fres);
    // Hex-ish data cells lighting up here and there.
    float cell = step(0.93, hash2(floor(vec2(th * 12.0 / 3.14159, ph * 24.0 / 6.28318) + 40.0)));
    sphereCol += ICE * lattice * 0.22 + BLUE * cell * 0.12 * (0.4 + fres);
    sphereCol += BLUE * 0.035;
    // Rim with a hint of dispersion: blue outside, a red fringe inside.
    sphereCol += mix(BLUE, ICE, fres) * fres * 0.85 + RED * pow(fres, 1.6) * (1.0 - fres) * 0.35;
    // Specular highlight from a key light up-left.
    vec3 L = normalize(vec3(-0.6, 0.8, 0.5));
    sphereCol += pow(max(dot(reflect(rd, n), L), 0.0), 60.0) * vec3(1.0) * 0.9;
    // Plasma: march inside, accumulating emission - a white-hot heart with
    // red filaments reaching toward the glass, the rest dark and clear.
    float steps = 64.0;
    float dt = (hs.y - hs.x) / steps;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 64; i++) {
      vec3 p = ro + rd * (hs.x + dt * (float(i) + 0.5));
      float r = length(p) / Rs;
      float n1 = fbm(p * 3.2 + vec3(0.0, T * 0.2, 0.0));
      float ridge = 1.0 - abs(fbm(rotY(r * 2.5) * p * 3.6 + 7.0) * 2.0 - 1.0);
      float fil = pow(ridge, 16.0) * exp(-r * 3.2) * smoothstep(0.95, 0.2, r);
      float heart = exp(-r * 9.0) * (0.55 + 0.9 * n1);
      float dens = heart * 3.4 + fil * 0.7 + 0.012;
      vec3 c = mix(RED, EMBER, clamp(exp(-r * 4.0) * 1.2, 0.0, 1.0));
      c = mix(c, vec3(1.0, 0.94, 0.9), exp(-r * 13.0));
      acc += c * dens * dt * 6.0;
    }
    sphereCol += acc;
    occl = 0.45;
  }
  // Halo: closest approach of the ray to the core.
  float dmin = length(cross(rd, -ro));
  float halo = exp(-max(dmin - 1.0, 0.0) * 3.2);
  col += mix(BLUE, RED, 0.3) * halo * 0.16;
  col += RED * exp(-dmin * 2.8) * 0.2;
  // Anamorphic streak through the core.
  col += mix(BLUE, ICE, 0.3) * exp(-abs(q.y) * 90.0) * exp(-abs(q.x) * 1.4) * 0.35;
  col += RED * exp(-abs(q.y) * 220.0) * exp(-abs(q.x) * 4.0) * 0.25;

  col = col * occl + sphereCol + ringCol;
  // Bloom of the heart through the glass.
  float qc = length(q);
  col += EMBER * exp(-qc * 16.0) * 0.45 + vec3(1.0, 0.95, 0.9) * exp(-qc * 70.0) * 0.9;

  // --- Streams converging from the left (screen space) ------------------------
  // They end where they meet the glass, each with a small entry flare.
  vec2 cs = center;
  float sr = Rs * 1.55 / length(ro) * 1.02;   // sphere radius on screen
  vec3 streamCol = vec3(0.0);
  for (int k = 0; k < 22; k++) {
    float fk = float(k);
    float y0 = (hash1(fk * 7.1) - 0.5) * 2.1;
    float xs = -0.5 * aspect - 0.1;
    float x = uv.x;
    float s = clamp((cs.x - x) / (cs.x - xs), 0.0, 1.0);
    float yc = cs.y + (y0 - cs.y) * pow(s, 1.5) + sin(x * 3.0 + fk) * 0.018 * s;
    float d = abs(uv.y - yc);
    float thick = hash1(fk * 3.7) > 0.7 ? 1.8 : 1.0;
    float w = (0.0009 + 0.0035 * s) * thick;
    float core = exp(-d / w);
    float glow = exp(-d / (w * 7.0)) * 0.22;
    float pk = pow(max(sin(x * 34.0 - fk * 2.7), 0.0), 22.0) * 1.8;
    float dc = length(vec2(x, yc) - cs);
    float end = smoothstep(sr * 0.98, sr * 1.25, dc);
    float fadeIn = smoothstep(1.0, 0.72, s);
    float I = (core * (0.45 + pk) + glow) * (0.3 + 0.7 * (1.0 - s)) * fadeIn * end;
    vec3 c = mix(mix(RED, ICE, 0.25), BLUE, smoothstep(0.0, 0.8, s));
    streamCol += c * I * 0.55;
    // Entry flare where the stream touches the glass.
    vec2 ep = cs + normalize(vec2(-1.0, (y0 - cs.y) * 0.18)) * sr;
    streamCol += mix(ICE, RED, 0.3) * exp(-length(uv - ep) * 140.0) * 0.5;
  }
  col += streamCol;

  // Outcomes: a few activated beams leave the core to the right.
  for (int k = 0; k < 6; k++) {
    float fk = float(k);
    float y1 = (fk / 5.0 - 0.5) * 0.9;
    float x = uv.x;
    float s = clamp((x - cs.x) / (0.5 * aspect - cs.x + 0.1), 0.0, 1.0);
    float yc = cs.y + y1 * pow(s, 1.3);
    float d = abs(uv.y - yc);
    float w = 0.0012 + 0.002 * s;
    float dc = length(vec2(x, yc) - cs);
    float I = (exp(-d / w) + exp(-d / (w * 8.0)) * 0.2) * smoothstep(sr, sr * 1.3, dc) * (x > cs.x ? 1.0 : 0.0) * (1.0 - s * 0.6);
    I *= 0.6 + pow(max(sin(x * 30.0 + fk * 1.9), 0.0), 20.0) * 1.4;
    col += mix(mix(RED, ICE, 0.35), RED, s) * I * 0.4;
  }

  // --- Bokeh: two depth layers of drifting data motes -------------------------
  for (int layer = 0; layer < 2; layer++) {
    float sc = layer == 0 ? 9.0 : 22.0;
    vec2 gp = uv * sc + float(layer) * 13.1;
    vec2 id = floor(gp);
    vec2 f = fract(gp) - 0.5;
    float h = hash2(id);
    if (h > (layer == 0 ? 0.82 : 0.7)) {
      vec2 off = vec2(hash2(id + 3.1), hash2(id + 7.7)) - 0.5;
      float r = layer == 0 ? 0.18 + 0.1 * hash2(id + 1.3) : 0.07;
      float d = length(f - off * 0.6);
      float disk = smoothstep(r, r * (layer == 0 ? 0.55 : 0.2), d);
      vec3 c = hash2(id + 9.0) > 0.78 ? RED : (hash2(id + 4.0) > 0.5 ? BLUE : ICE * 0.7);
      float near = exp(-length(uv - cs) * (layer == 0 ? 0.6 : 1.2));
      col += c * disk * (layer == 0 ? 0.05 : 0.11) * (0.4 + near);
    }
  }

  // --- Finish: tone map, vignette, grain ---------------------------------------
  col = aces(col * 1.2);
  float vig = smoothstep(1.35, 0.35, length(uv * vec2(0.75, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col += (hash2(frag * 0.73 + 17.0) - 0.5) * 0.018;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
