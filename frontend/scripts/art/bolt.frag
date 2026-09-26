#version 300 es
// "Activated" - the Solix bolt as a glass monolith with a red heart, standing
// inside its ring of light on a reflective data floor.
precision highp float;
uniform vec2 R;
uniform float T;
out vec4 o;

const vec3 NAVY = vec3(0.018, 0.036, 0.072);
const vec3 BLUE = vec3(0.0, 0.533, 0.812);
const vec3 ICE = vec3(0.62, 0.84, 1.0);
const vec3 RED = vec3(0.933, 0.141, 0.141);
const vec3 EMBER = vec3(1.0, 0.45, 0.25);

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

const int N = 7;
vec2 V(int i) {
  vec2 v[7] = vec2[7](vec2(23.5, 3.5), vec2(10.5, 22.5), vec2(18.7, 22.5), vec2(15.2, 37.0), vec2(30.0, 17.0), vec2(21.8, 17.0), vec2(26.0, 3.5));
  return vec2(v[i].x - 20.0, 20.0 - v[i].y) / 20.0 * 1.25;
}
float sdPolygon(vec2 p) {
  float d = dot(p - V(0), p - V(0));
  float s = 1.0;
  for (int i = 0, j = N - 1; i < N; j = i, i++) {
    vec2 e = V(j) - V(i);
    vec2 w = p - V(i);
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= V(i).y, p.y < V(j).y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float sdBolt(vec3 p) {
  float h = 0.16;
  vec2 w = vec2(sdPolygon(p.xy), abs(p.z) - h);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.02;
}
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, s, 0, 1, 0, -s, 0, c); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

float map(vec3 p) { return sdBolt(rotY(-0.42) * (p - vec3(0.0, 0.15, 0.0))); }
vec3 nrm(vec3 p) { vec2 e = vec2(0.001, 0.0); return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * R) / R.y;
  float aspect = R.x / R.y;
  vec2 center = vec2(0.2 * aspect, 0.0);
  vec2 q = uv - center;
  vec3 ro = vec3(0.0, 0.25, 6.1);
  vec3 ta = vec3(0.0, 0.1, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(q.x * uu + q.y * vv + 1.7 * ww);

  vec3 col = NAVY * (1.0 - 0.3 * length(uv));
  // The ring of the mark, standing behind the bolt, with light rays.
  float rr = length(q - vec2(0.0, 0.03));
  float ringR = 0.43;
  float ring = exp(-abs(rr - ringR) * 260.0) * 0.9 + exp(-abs(rr - ringR) * 30.0) * 0.18;
  float ang = atan(q.y, q.x);
  vec3 ringC = mix(RED, BLUE, 0.5 + 0.5 * sin(ang * 1.0 + 0.8));
  col += ringC * ring;
  col += mix(RED, BLUE, 0.4) * exp(-rr * 3.5) * 0.18;
  float rays = pow(max(sin(ang * 26.0), 0.0), 30.0) * exp(-max(rr - ringR, 0.0) * 5.0) * step(ringR, rr);
  col += ICE * rays * 0.05;

  // Floor.
  float floorY = -1.35;
  if (rd.y < 0.0) {
    float tf = (floorY - ro.y) / rd.y;
    vec3 fp = ro + rd * tf;
    vec2 g = abs(fract(fp.xz * 1.3) - 0.5);
    float lw = fwidth(fp.x * 1.3) * 1.2 + 0.004;
    float line = max(smoothstep(lw, 0.0, g.x), smoothstep(lw, 0.0, g.y));
    float pool = exp(-length(fp.xz) * 1.1);
    float fade = smoothstep(16.0, 4.0, tf);
    col += BLUE * line * fade * (0.06 + 0.5 * pool);
    col += RED * pool * pool * 0.35 * fade;
  }

  // Bolt: raymarch with edge glow accumulation.
  float t = 0.0;
  float glow = 0.0;
  bool hit = false;
  for (int i = 0; i < 160; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    glow += 0.0009 / (0.0003 + d * d * 30.0);
    if (d < 0.0008) { hit = true; break; }
    t += d * 0.8;
    if (t > 12.0) break;
  }
  col += RED * glow * 0.012;
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = nrm(p);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    vec3 L = normalize(vec3(-0.5, 0.9, 0.6));
    float spec = pow(max(dot(reflect(rd, n), L), 0.0), 48.0);
    // Interior: march a little way in and gather emission (hotter toward the middle).
    vec3 acc = vec3(0.0);
    for (int k = 1; k < 36; k++) {
      vec3 pi = p + rd * float(k) * 0.02;
      float di = map(pi);
      if (di > 0.0) break;
      float depth = -di;
      acc += mix(RED * 0.7, EMBER, smoothstep(0.04, 0.16, depth)) * (0.02 + depth * depth * 9.0);
    }
    vec3 surf = RED * 0.08 + acc * 0.32 + mix(RED * 0.8, ICE, fres) * fres * 1.3 + spec * vec3(1.0) * 0.8;
    // Etched circuit lines on the faces.
    vec3 lp = rotY(-0.42) * (p - vec3(0.0, 0.15, 0.0));
    float etch = smoothstep(0.02, 0.0, abs(fract(lp.y * 7.0 + lp.x * 2.0) - 0.5) - 0.46);
    surf += mix(ICE, RED, 0.3) * etch * 0.12 * (0.3 + fres);
    col = col * 0.2 + surf;
  }
  // Heart bloom and anamorphic streak.
  col += EMBER * exp(-length(q - vec2(0.0, 0.03)) * 9.0) * 0.18;
  col += mix(BLUE, ICE, 0.3) * exp(-abs(q.y - 0.03) * 120.0) * exp(-abs(q.x) * 1.6) * 0.22;

  // Motes.
  vec2 gp = uv * 20.0;
  vec2 id = floor(gp);
  float h = hash2(id);
  if (h > 0.8) {
    vec2 off = vec2(hash2(id + 3.1), hash2(id + 7.7)) - 0.5;
    float d = length(fract(gp) - 0.5 - off * 0.6);
    col += (hash2(id + 9.0) > 0.7 ? RED : BLUE) * smoothstep(0.08, 0.02, d) * 0.12 * exp(-length(q) * 1.2);
  }

  col = aces(col * 1.2);
  float vig = smoothstep(1.35, 0.35, length(uv * vec2(0.75, 1.0)));
  col *= mix(0.5, 1.0, vig);
  col += (hash2(frag * 0.77 + 5.0) - 0.5) * 0.016;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
