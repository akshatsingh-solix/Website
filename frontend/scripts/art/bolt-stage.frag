#version 300 es
// The stage of "Activated" (bolt.frag) with the bolt left out: the ring of
// the mark, its rays and the reflective data floor. The CTA band renders the
// bolt itself live, in liquid metal (components/materials/LiquidMetalMark),
// in the middle of this ring; key-bolt stays as its still fallback.
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

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

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
