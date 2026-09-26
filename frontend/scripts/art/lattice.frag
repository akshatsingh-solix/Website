#version 300 es
// "Governed intelligence" - a constellation of data nodes linked into a
// neural lattice; a few activated pathways burn Solix Red through it.
precision highp float;
uniform vec2 R;
uniform float T;
out vec4 o;
const vec3 NAVY = vec3(0.018, 0.036, 0.072);
const vec3 BLUE = vec3(0.0, 0.533, 0.812);
const vec3 ICE = vec3(0.62, 0.84, 1.0);
const vec3 RED = vec3(0.933, 0.141, 0.141);
float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, s, 0, 1, 0, -s, 0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, -s, 0, s, c); }

const int NN = 160;
vec3 node(int i) {
  // Fibonacci sphere: index neighbours (i+/-1, 8, 13, 21, 34) are spatial neighbours.
  float f = float(i);
  float y = 1.0 - (f + 0.5) / float(NN) * 2.0;
  float r = sqrt(1.0 - y * y);
  float th = 2.39996323 * f;
  vec3 p = vec3(cos(th) * r, y, sin(th) * r) * (1.02 + (hash1(f * 3.3) - 0.5) * 0.06);
  return rotX(0.35) * rotY(0.7) * p;
}
vec2 proj(vec3 p, out float depth) {
  vec3 ro = vec3(0.0, 0.0, 5.0);
  depth = ro.z - p.z;
  return p.xy * (1.75 / depth) + vec2(0.42, 0.0);
}
float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * R) / R.y;
  vec3 col = NAVY * (1.0 - 0.3 * length(uv));
  col += BLUE * 0.06 * exp(-length(uv) * 1.5);
  vec2 P[NN];
  float D[NN];
  for (int i = 0; i < NN; i++) { float d; P[i] = proj(node(i), d); D[i] = d; }
  // Edges to spatial neighbours on the spiral.
  int OFF[4] = int[4](1, 13, 21, 34);
  for (int i = 0; i < NN; i++) {
    for (int k = 0; k < 4; k++) {
      int j = i + OFF[k];
      if (j >= NN) continue;
      vec2 a = P[i], b = P[j];
      float d = segDist(uv, a, b);
      if (d > 0.03) continue;
      float depth = 0.5 * (D[i] + D[j]);
      float near = smoothstep(5.9, 4.1, depth);
      float hot = step(0.95, hash1(float(i * 7 + k * 31)));
      vec3 c = hot > 0.5 ? RED : mix(BLUE, ICE, 0.15);
      float w = 0.0008 + 0.0014 * near;
      float I = exp(-d / w) * (0.03 + 0.8 * near * near) + exp(-d / (w * 6.0)) * 0.05 * near;
      if (hot > 0.5) {
        vec2 ab = b - a;
        float h = clamp(dot(uv - a, ab) / dot(ab, ab), 0.0, 1.0);
        I *= 1.2 + 3.0 * pow(max(sin(h * 12.0 - float(i)), 0.0), 10.0);
      }
      col += c * I * (hot > 0.5 ? 0.6 : 0.34);
    }
  }
  // An inner glow: the model at the centre of the governed data.
  col += mix(RED, BLUE, 0.5) * exp(-length(uv - vec2(0.42, 0.0)) * 3.2) * 0.14;
  // Nodes with depth of field.
  for (int i = 0; i < NN; i++) {
    float near = smoothstep(5.9, 4.1, D[i]);
    float blur = mix(0.012, 0.0045, near);
    float d = length(uv - P[i]);
    float hot = step(0.88, hash1(float(i) * 9.1));
    vec3 c = hot > 0.5 ? RED : ICE;
    col += c * smoothstep(blur * 1.6, 0.0, d) * (0.15 + 0.9 * near) + c * exp(-d * 70.0) * 0.1 * near;
  }
  // Soft motes.
  vec2 gp = uv * 16.0; vec2 id = floor(gp);
  if (hash2(id) > 0.85) { float d = length(fract(gp) - 0.5); col += BLUE * smoothstep(0.2, 0.05, d) * 0.05; }
  col = aces(col * 1.25);
  float vig = smoothstep(1.4, 0.3, length(uv * vec2(0.7, 1.0)));
  col *= mix(0.45, 1.0, vig);
  col += (hash2(frag * 0.7 + 9.0) - 0.5) * 0.016;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
