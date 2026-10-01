#version 300 es
// The stage every content sigil stands on (components/materials/Sigil.jsx):
// a halo ring behind the glyph, HUD rings around it, a lit pedestal and the
// reflective data floor of the bolt scenes. The glyph itself is a liquid-
// metal still (scripts/art/glyphs.js) laid over the middle of this frame,
// so the stage leaves the centre clear. TONE picks the key light: 0.0 Solix
// Red (archive, preservation, delivery), 1.0 Solix Blue (AI, governance).
precision highp float;
uniform vec2 R;
uniform float T;
out vec4 o;

#ifndef TONE
#define TONE 0.0
#endif

const vec3 NAVY = vec3(0.018, 0.036, 0.072);
const vec3 BLUE = vec3(0.0, 0.533, 0.812);
const vec3 ICE = vec3(0.62, 0.84, 1.0);
const vec3 RED = vec3(0.933, 0.141, 0.141);
const vec3 EMBER = vec3(1.0, 0.45, 0.25);

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * R) / R.y;
  vec3 KEY = mix(RED, BLUE, TONE);
  vec3 RIM = mix(BLUE, RED, TONE);
  vec3 HOT = mix(EMBER, ICE, TONE);

  vec3 col = NAVY * (1.0 - 0.35 * length(uv));
  col += mix(NAVY, KEY, 0.25) * exp(-length(uv - vec2(0.0, 0.1)) * 2.2) * 0.32;

  // Halo ring behind the glyph, the far side of it cooler.
  vec2 h = uv - vec2(0.0, 0.035);
  float rr = length(h);
  float ringR = 0.33;
  float ang = atan(h.y, h.x);
  float ring = exp(-abs(rr - ringR) * 300.0) * 0.85 + exp(-abs(rr - ringR) * 28.0) * 0.16;
  vec3 ringC = mix(KEY, RIM, 0.5 + 0.5 * sin(ang + 0.9));
  col += ringC * ring;
  col += KEY * exp(-rr * 4.0) * 0.09;
  // A darker core so the glyph's chrome reads against it.
  col *= mix(0.62, 1.0, smoothstep(0.08, 0.3, rr));
  float rays = pow(max(sin(ang * 24.0), 0.0), 28.0) * exp(-max(rr - ringR, 0.0) * 5.5) * step(ringR, rr);
  col += HOT * rays * 0.045;

  // HUD rings: two dashed circles and tick marks, the brand's framed-visual idiom.
  float d1 = abs(rr - 0.44);
  float dash = step(0.5, fract(ang * 9.549 * 6.0));
  col += mix(ICE, KEY, 0.4) * exp(-d1 * 900.0) * 0.22 * dash;
  float d2 = abs(rr - 0.52);
  float ticks = step(0.92, fract(ang * 9.549 * 2.0));
  col += ICE * exp(-d2 * 700.0) * 0.12 * (0.35 + ticks);
  float arc = smoothstep(0.012, 0.0, abs(rr - 0.52)) * step(0.6, sin(ang - 0.6));
  col += KEY * arc * 0.11;

  // Pedestal: a lit ellipse on the floor under the glyph.
  vec2 pq = (uv - vec2(0.0, -0.285)) / vec2(0.34, 0.06);
  float pr = length(pq);
  col += KEY * exp(-abs(pr - 1.0) * 26.0) * 0.55;
  col += HOT * exp(-pr * 1.6) * 0.22 * smoothstep(1.4, 0.0, pr);
  col += KEY * exp(-abs(pr - 1.55) * 40.0) * 0.12;

  // Floor grid in perspective, lit by the pedestal.
  vec3 ro = vec3(0.0, 0.25, 6.1);
  vec3 ww = normalize(vec3(0.0, 0.1, 0.0) - ro);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.7 * ww);
  if (rd.y < 0.0) {
    float tf = (-1.35 - ro.y) / rd.y;
    vec3 fp = ro + rd * tf;
    vec2 g = abs(fract(fp.xz * 1.3) - 0.5);
    float lw = fwidth(fp.x * 1.3) * 1.2 + 0.004;
    float line = max(smoothstep(lw, 0.0, g.x), smoothstep(lw, 0.0, g.y));
    float pool = exp(-length(fp.xz - vec2(0.0, -2.3)) * 0.9);
    float fade = smoothstep(16.0, 4.0, tf);
    col += mix(BLUE, KEY, 0.35) * line * fade * (0.05 + 0.45 * pool);
    col += KEY * pool * pool * 0.22 * fade;
  }

  // Anamorphic streak through the heart.
  col += mix(KEY, HOT, 0.4) * exp(-abs(uv.y - 0.035) * 140.0) * exp(-abs(uv.x) * 1.4) * 0.14;

  // Motes.
  vec2 gp = uv * 22.0;
  vec2 id = floor(gp);
  if (hash2(id) > 0.82) {
    vec2 off = vec2(hash2(id + 3.1), hash2(id + 7.7)) - 0.5;
    float d = length(fract(gp) - 0.5 - off * 0.6);
    col += (hash2(id + 9.0) > 0.72 ? RIM : KEY) * smoothstep(0.08, 0.02, d) * 0.12 * exp(-length(uv) * 1.1);
  }

  col = aces(col * 1.2);
  float vig = smoothstep(1.3, 0.3, length(uv * vec2(0.72, 1.0)));
  col *= mix(0.45, 1.0, vig);
  col += (hash2(frag * 0.77 + 5.0) - 0.5) * 0.016;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
