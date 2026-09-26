import { formationMeta, formationPositions } from "./formations";

/**
 * SignalField renderer: a few thousand additive points drawn by raw WebGL
 * (no 3D library). All motion runs in the vertex shader - streaming,
 * morphing between formations, spin, breathing, pointer repulsion and the
 * click shockwave - so the CPU only updates a handful of uniforms per frame.
 *
 *   const engine = createSignalEngine(canvas, { formations: ["cloud", "bolt"] });
 *   engine.setProgress(1)      // 0..formations.length-1, eased toward
 *   engine.destroy()
 *
 * Returns null when WebGL is unavailable, so callers can fall back to CSS.
 */

const VERT = `
precision highp float;
attribute vec3 aA;
attribute vec3 aB;
attribute vec4 aR;
uniform float uMix, uTime, uAspect, uPixel, uAlpha;
uniform vec4 uFormA; // spin, tilt, warm, flow
uniform vec4 uFormB;
uniform vec2 uAxis;  // spin axis per formation: 0 = y, 1 = x
uniform vec4 uPlace; // offset.xy (clip), scale, mobile dim
uniform vec2 uMouse;
uniform float uMouseOn;
uniform vec2 uCam;
uniform vec3 uPulse; // center.xy, age (s)
varying vec3 vColor;
varying float vAlpha;

const vec3 BLUE = vec3(0.0, 0.533, 0.812);
const vec3 ICE = vec3(0.78, 0.9, 1.0);
const vec3 RED = vec3(0.933, 0.141, 0.141);

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }

vec3 flowPos(vec3 p, vec4 r) {
  float hw = 2.4 * uAspect / max(uPlace.z, 0.3);
  float x = mod(p.x * hw + uTime * hw * (0.03 + 0.045 * r.z) + hw, 2.0 * hw) - hw;
  // Streams converge through the core at x = 0 and fan back out: many systems, one platform, many outcomes.
  float pinch = 0.08 + 0.92 * smoothstep(0.05, 1.7, abs(x));
  float y = p.y * pinch + sin(x * 1.4 + p.y * 7.0 + uTime * 0.6) * 0.06 * pinch;
  return vec3(x, y, p.z * pinch);
}

vec3 place(vec3 p, vec4 form, float axis, vec4 r) {
  if (form.w > 0.5) p = flowPos(p, r);
  float a = uTime * form.x;
  p = axis > 0.5 ? rotX(p, a) : rotY(p, a);
  return rotX(p, form.y);
}

void main() {
  vec3 A = place(aA, uFormA, uAxis.x, aR);
  vec3 B = place(aB, uFormB, uAxis.y, aR);
  // Each particle leaves on its own beat, so a morph reads as a swarm, not a crossfade.
  float m = smoothstep(0.0, 1.0, clamp(uMix * 1.5 - aR.w * 0.5, 0.0, 1.0));
  vec3 p = mix(A, B, m);
  float swirl = sin(3.14159 * m);
  p += swirl * 0.42 * vec3(sin(aR.w * 41.0 + uTime * 0.9), cos(aR.z * 37.0 + uTime * 0.7), sin(aR.y * 23.0 + uTime));
  // Idle breathing, except in the streams, which already move.
  float flowness = mix(uFormA.w, uFormB.w, m);
  p += 0.012 * (1.0 - flowness) * vec3(sin(uTime * 0.9 + aR.w * 50.0), cos(uTime * 0.7 + aR.z * 40.0), sin(uTime * 0.8 + aR.y * 30.0));

  // Camera: eases toward the pointer for parallax.
  p = rotY(p, uCam.x);
  p = rotX(p, uCam.y);

  float depth = 3.2 - p.z;
  vec2 proj = p.xy * (2.0 / depth) * uPlace.z;
  vec2 clip = vec2(proj.x / uAspect, proj.y) + uPlace.xy;

  // Pointer repulsion, measured in square screen units.
  vec2 dm = (clip - uMouse) * vec2(uAspect, 1.0);
  float dist = length(dm);
  float push = uMouseOn * (1.0 - smoothstep(0.0, 0.42, dist));
  clip += normalize(dm + 1e-4) / vec2(uAspect, 1.0) * push * 0.13;

  // Click shockwave: a ring that races outward and fades.
  vec2 dp = (clip - uPulse.xy) * vec2(uAspect, 1.0);
  float pd = length(dp);
  float q = (pd - uPulse.z * 1.35) * 7.0;
  float wave = exp(-q * q) * exp(-uPulse.z * 1.6);
  clip += normalize(dp + 1e-4) / vec2(uAspect, 1.0) * wave * 0.07;

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = uPixel * (0.7 + aR.x * 1.9) * (3.2 / depth) * (1.0 + wave * 1.5 + push * 0.6);

  float warm = mix(uFormA.z, uFormB.z, m);
  vec3 col = aR.y > 1.0 - (0.06 + warm * 0.62) ? RED : (aR.y < 0.58 ? BLUE : ICE);
  vColor = mix(col, ICE, wave * 0.8 + push * 0.35);
  float fog = 0.3 + 0.7 * smoothstep(-1.4, 1.2, p.z);
  vAlpha = uAlpha * fog * uPlace.w * (0.7 + 0.5 * aR.x);
}
`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = 1.0 - smoothstep(0.05, 0.5, d);
  a *= a * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}
`;

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    // eslint-disable-next-line no-console
    console.warn("SignalField shader:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
};

/** How many particles this device should draw. */
export const particleBudget = (scale = 1) => {
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  let n = w < 640 ? 2200 : w < 1024 ? 3600 : 6000;
  if (cores <= 4) n *= 0.6;
  return Math.round(n * scale);
};

export const createSignalEngine = (canvas, opts = {}) => {
  const {
    formations = ["cloud"],
    count = particleBudget(opts.density),
    place = { x: 0, y: 0, scale: 1 },
    placeFor = null, // optional per-formation placement: (name, index) => place
    interactive = true,
    staticFrame = false,
    trails = 0, // 0 = off; otherwise how much of the previous frame fades per frame (e.g. 0.2)
  } = opts;

  const useTrails = trails > 0 && !staticFrame;
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: useTrails, powerPreference: "high-performance" });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const U = {};
  ["uMix", "uTime", "uAspect", "uPixel", "uAlpha", "uFormA", "uFormB", "uAxis", "uPlace", "uMouse", "uMouseOn", "uCam", "uPulse"].forEach((k) => {
    U[k] = gl.getUniformLocation(prog, k);
  });

  // Per-particle random attributes: size, colour pick, speed, phase.
  const rnd = new Float32Array(count * 4);
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  const bufR = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufR);
  gl.bufferData(gl.ARRAY_BUFFER, rnd, gl.STATIC_DRAW);
  const locR = gl.getAttribLocation(prog, "aR");
  gl.enableVertexAttribArray(locR);
  gl.vertexAttribPointer(locR, 4, gl.FLOAT, false, 0, 0);

  const bufA = gl.createBuffer();
  const bufB = gl.createBuffer();
  const locA = gl.getAttribLocation(prog, "aA");
  const locB = gl.getAttribLocation(prog, "aB");
  gl.enableVertexAttribArray(locA);
  gl.enableVertexAttribArray(locB);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  // Light trails: instead of clearing, each frame multiplies what is already
  // on the canvas down a little (premultiplied, so colour and alpha fade
  // together), leaving a streak behind every moving particle.
  let fade = null;
  if (useTrails) {
    const fvs = compile(gl, gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
    const ffs = compile(gl, gl.FRAGMENT_SHADER, "precision mediump float; uniform float a; void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, a); }");
    if (fvs && ffs) {
      const fp = gl.createProgram();
      gl.attachShader(fp, fvs);
      gl.attachShader(fp, ffs);
      gl.linkProgram(fp);
      const fb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, fb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      fade = { prog: fp, buf: fb, loc: gl.getAttribLocation(fp, "p"), a: gl.getUniformLocation(fp, "a") };
    }
  }
  const fadeCanvas = (amount) => {
    gl.useProgram(fade.prog);
    // Attributes 0..3 belong to the particle program; point the quad at its own slot.
    gl.bindBuffer(gl.ARRAY_BUFFER, fade.buf);
    gl.enableVertexAttribArray(fade.loc);
    gl.vertexAttribPointer(fade.loc, 2, gl.FLOAT, false, 0, 0);
    gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(fade.a, amount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(prog);
    // Restore the particle attribute bindings the quad may have replaced.
    gl.bindBuffer(gl.ARRAY_BUFFER, bufR);
    gl.vertexAttribPointer(locR, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufA);
    gl.vertexAttribPointer(locA, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufB);
    gl.vertexAttribPointer(locB, 3, gl.FLOAT, false, 0, 0);
  };
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const names = formations.length ? formations : ["cloud"];
  const positions = names.map((n) => formationPositions(n, count));
  const metas = names.map((n) => formationMeta(n));
  const places = names.map((n, i) => ({ ...place, ...(placeFor ? placeFor(n, i) : null) }));

  let segment = -1;
  const bindSegment = (i) => {
    if (i === segment) return;
    segment = i;
    const a = Math.min(i, names.length - 1);
    const b = Math.min(i + 1, names.length - 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufA);
    gl.bufferData(gl.ARRAY_BUFFER, positions[a], gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(locA, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufB);
    gl.bufferData(gl.ARRAY_BUFFER, positions[b], gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(locB, 3, gl.FLOAT, false, 0, 0);
    const ma = metas[a];
    const mb = metas[b];
    gl.uniform4f(U.uFormA, ma.spin, ma.tilt, ma.warm, ma.flow ? 1 : 0);
    gl.uniform4f(U.uFormB, mb.spin, mb.tilt, mb.warm, mb.flow ? 1 : 0);
    gl.uniform2f(U.uAxis, ma.axis === "x" ? 1 : 0, mb.axis === "x" ? 1 : 0);
  };

  // State eased every frame toward its target.
  const state = {
    progress: 0, target: 0,
    mouse: [9, 9], mouseTarget: [9, 9], mouseOn: 0, mouseOnTarget: 0,
    cam: [0, 0], camTarget: [0, 0],
    alpha: 0, alphaTarget: 1,
    pulse: [0, 0, 99],
    dim: 1,
  };
  let width = 1;
  let height = 1;
  let dpr = 1;
  let time = Math.random() * 20;
  let last = 0;
  let raf = 0;
  let running = false;
  let destroyed = false;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 1.75);
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    state.dim = width < 768 ? 0.75 : 1;
    if (staticFrame) draw(0);
  };

  const lerp = (a, b, k) => a + (b - a) * k;

  function draw(dt) {
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent easing
    state.progress = staticFrame ? state.target : lerp(state.progress, state.target, Math.min(1, k * 0.9));
    state.mouse[0] = lerp(state.mouse[0], state.mouseTarget[0], Math.min(1, k * 2.2));
    state.mouse[1] = lerp(state.mouse[1], state.mouseTarget[1], Math.min(1, k * 2.2));
    state.mouseOn = lerp(state.mouseOn, state.mouseOnTarget, Math.min(1, k * 1.2));
    state.cam[0] = lerp(state.cam[0], state.camTarget[0], Math.min(1, k * 0.6));
    state.cam[1] = lerp(state.cam[1], state.camTarget[1], Math.min(1, k * 0.6));
    state.alpha = staticFrame ? 1 : lerp(state.alpha, state.alphaTarget, Math.min(1, k * 0.5));
    state.pulse[2] += dt;

    const maxSeg = Math.max(0, names.length - 1);
    const p = Math.max(0, Math.min(maxSeg, state.progress));
    const seg = Math.min(Math.floor(p), Math.max(0, maxSeg - 1));
    bindSegment(seg);
    const mix = maxSeg === 0 ? 0 : p - seg;
    const pa = places[Math.min(seg, maxSeg)];
    const pb = places[Math.min(seg + 1, maxSeg)];
    const e = mix * mix * (3 - 2 * mix);
    const mobile = width < 768;
    const px = mobile ? (pa.mx ?? 0) + ((pb.mx ?? 0) - (pa.mx ?? 0)) * e : pa.x + (pb.x - pa.x) * e;
    const py = mobile ? (pa.my ?? pa.y) + ((pb.my ?? pb.y) - (pa.my ?? pa.y)) * e : pa.y + (pb.y - pa.y) * e;
    const ps = pa.scale + (pb.scale - pa.scale) * e;

    if (fade && dt > 0) fadeCanvas(Math.min(0.6, trails * dt * 60));
    else gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uMix, mix);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uAspect, width / height);
    gl.uniform1f(U.uPixel, dpr * Math.max(1.6, Math.min(3.0, height / 330)));
    gl.uniform1f(U.uAlpha, state.alpha);
    gl.uniform4f(U.uPlace, px, py, ps * (mobile ? 0.9 : 1), state.dim);
    gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]);
    gl.uniform1f(U.uMouseOn, state.mouseOn);
    gl.uniform2f(U.uCam, state.cam[0], state.cam[1]);
    gl.uniform3f(U.uPulse, state.pulse[0], state.pulse[1], state.pulse[2]);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  const loop = (now) => {
    if (!running) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    time += dt;
    draw(dt);
    raf = requestAnimationFrame(loop);
  };

  const toClip = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1)];
  };

  const onMove = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    const [x, y] = toClip(e.clientX, e.clientY);
    const inside = x > -1.1 && x < 1.1 && y > -1.1 && y < 1.1;
    state.mouseTarget = [x, y];
    state.mouseOnTarget = inside ? 1 : 0;
    state.camTarget = inside ? [x * 0.22, -y * 0.14] : [0, 0];
  };
  const onLeave = () => { state.mouseOnTarget = 0; state.camTarget = [0, 0]; };
  const onDown = (e) => {
    const [x, y] = toClip(e.clientX, e.clientY);
    if (x < -1 || x > 1 || y < -1 || y > 1) return;
    state.pulse = [x, y, 0];
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  if (interactive && !staticFrame) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
  }

  const api = {
    count,
    setProgress(v, { immediate = false } = {}) {
      state.target = v;
      if (immediate) state.progress = v;
      if (staticFrame) draw(0);
    },
    getProgress: () => state.progress,
    setAlpha(v) { state.alphaTarget = v; },
    pulse(clientX, clientY) {
      const [x, y] = toClip(clientX, clientY);
      state.pulse = [x, y, 0];
    },
    start() {
      if (running || destroyed || staticFrame) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      destroyed = true;
      api.stop();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
  if (staticFrame) draw(0);
  return api;
};
