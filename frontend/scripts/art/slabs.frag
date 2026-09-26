#version 300 es
// "Layered by design" - four translucent glass slabs (Foundation, Optimize,
// Comply, Activate) stacked with neon edges; data beams rise between them.
precision highp float;
uniform vec2 R;
uniform float T;
out vec4 o;

const vec3 NAVY = vec3(0.018, 0.036, 0.072);
const vec3 BLUE = vec3(0.0, 0.533, 0.812);
const vec3 ICE = vec3(0.62, 0.84, 1.0);
const vec3 RED = vec3(0.933, 0.141, 0.141);
const vec3 STEEL = vec3(0.24, 0.38, 0.53);

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float n) { return fract(sin(n) * 43758.5453123); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, s, 0, 1, 0, -s, 0, c); }

float sdRoundBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdBoxFrame(vec3 p, vec3 b, float e) {
  p = abs(p) - b;
  vec3 q = abs(p + e) - e;
  return min(min(length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
                 length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
             length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}

const float LY[4] = float[4](-0.95, -0.32, 0.31, 0.94);

vec3 layerCol(int i) { return i == 3 ? RED : (i == 0 ? BLUE : (i == 1 ? STEEL * 1.4 : mix(STEEL, BLUE, 0.5) * 1.3)); }

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * R) / R.y;
  vec3 ro = vec3(5.6, 3.9, 5.6);
  vec3 ta = vec3(0.0, -0.05, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 2.05 * ww);

  vec3 col = NAVY * (1.0 - 0.3 * length(uv));
  col += BLUE * 0.06 * exp(-length(uv) * 1.8);

  // Floor grid with the stack's light pooled beneath.
  float floorY = -1.35;
  if (rd.y < 0.0) {
    float tf = (floorY - ro.y) / rd.y;
    vec3 fp = ro + rd * tf;
    vec2 g = abs(fract(fp.xz * 1.5) - 0.5);
    float lw = fwidth(fp.x * 1.5) * 1.2 + 0.004;
    float line = max(smoothstep(lw, 0.0, g.x), smoothstep(lw, 0.0, g.y));
    float pool = exp(-length(fp.xz) * 0.8);
    float fade = smoothstep(16.0, 5.0, tf);
    col += BLUE * line * fade * (0.08 + 0.6 * pool);
    col += BLUE * pool * pool * 0.12 * fade;
  }

  vec3 acc = vec3(0.0);
  float trans = 1.0;
  float t = 0.0;
  for (int i = 0; i < 220; i++) {
    vec3 p = ro + rd * t;
    vec3 pr = rotY(0.0) * p;
    float dmin = 1e9;
    for (int k = 0; k < 4; k++) {
      vec3 lp = pr - vec3(0.0, LY[k], 0.0);
      vec3 b = vec3(1.45, 0.075, 1.45);
      float ds = sdRoundBox(lp, b, 0.05);
      float df = sdBoxFrame(lp, b, 0.004);
      vec3 lc = layerCol(k);
      // Neon edges.
      acc += trans * lc * (0.00022 / (0.00006 + df * df * 9.0)) * 0.05;
      // Glass body: faint tint while inside, plus an etched grid on the top face.
      if (ds < 0.0) {
        vec2 gg = abs(fract(lp.xz * 5.0) - 0.5);
        float etch = max(smoothstep(0.04, 0.0, gg.x), smoothstep(0.04, 0.0, gg.y));
        vec2 cid = floor(lp.xz * 5.0);
        float cells = step(0.94, hash2(cid + float(k) * 11.0)) * smoothstep(0.5, 0.2, max(abs(fract(lp.x * 5.0) - 0.5), abs(fract(lp.z * 5.0) - 0.5)));
        float fill = k == 3 ? 0.012 : 0.02;
        acc += trans * lc * (fill + etch * 0.06 + cells * 0.12) * 0.35;
        trans *= 0.965;
      }
      dmin = min(dmin, abs(ds));
    }
    // Data beams rising through the stack.
    for (int j = 0; j < 7; j++) {
      float fj = float(j);
      vec2 bp = (vec2(hash1(fj * 3.3), hash1(fj * 7.9)) - 0.5) * 2.2;
      float db = length(pr.xz - bp);
      float y = pr.y;
      if (y > -1.1 && y < 1.25) {
        float pk = pow(max(sin(y * 9.0 - fj * 1.7), 0.0), 16.0);
        vec3 bc = mix(BLUE, RED, smoothstep(-0.9, 1.0, y));
        acc += trans * bc * (0.00012 / (0.00002 + db * db * 5.0)) * (0.09 + pk * 0.6);
      }
    }
    t += clamp(dmin * 0.5, 0.01, 0.06);
    if (t > 14.0) break;
  }
  col = col * trans + acc;

  col = aces(col * 1.25);
  float vig = smoothstep(1.3, 0.3, length(uv * vec2(0.8, 1.0)));
  col *= mix(0.5, 1.0, vig);
  col += (hash2(frag * 0.71 + 3.0) - 0.5) * 0.016;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
