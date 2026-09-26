import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A living backdrop for the navy stages: slow, domain-warped aurora in the
 * brand's navy, Solix Blue and a trace of Solix Red, brightening softly
 * where the pointer rests. Rendered at a fraction of screen resolution (it is
 * all soft gradients, so upscaling costs nothing visible), capped at ~30fps,
 * and only while on screen. Reduced motion gets one still frame; no WebGL
 * leaves the CSS background showing.
 */
// no-i18n: shader source.
const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
// no-i18n: shader source.
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uWarm;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.03;
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.8 + 3.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p * 1.8 + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.6 + 2.6 * r);
  vec3 navy = vec3(0.035, 0.066, 0.12);
  vec3 blue = vec3(0.0, 0.42, 0.68);
  vec3 red = vec3(0.75, 0.12, 0.14);
  vec3 col = navy;
  col = mix(col, blue * 0.55, smoothstep(0.45, 0.95, f) * 0.85);
  col = mix(col, red * 0.5, smoothstep(0.62, 1.0, r.y) * 0.35 * uWarm);
  col += blue * 0.12 * pow(f, 3.0);
  // Pointer light.
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  col += blue * 0.16 * exp(-length(p - m) * 3.2);
  // Vignette.
  col *= 1.0 - 0.45 * length((uv - 0.5) * vec2(1.1, 1.3));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const Nebula = ({ className, scale = 0.35, warm = 1 }) => {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) { setFailed(true); return undefined; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { setFailed(true); return undefined; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    gl.uniform1f(gl.getUniformLocation(prog, "uWarm"), warm);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = [0.7, 0.5];
    const target = [0.7, 0.5];
    let time = 40 + Math.random() * 30;
    let raf = 0;
    let lastDraw = 0;
    let visible = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(r.width * scale));
      canvas.height = Math.max(2, Math.round(r.height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      frame(0);
    };
    function frame(dt) {
      time += dt;
      mouse[0] += (target[0] - mouse[0]) * Math.min(1, dt * 2);
      mouse[1] += (target[1] - mouse[1]) * Math.min(1, dt * 2);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // ~30fps is plenty for drifting light.
    const loop = (now) => {
      if (!visible) return;
      if (now - lastDraw >= 32) {
        frame(lastDraw ? Math.min(0.1, (now - lastDraw) / 1000) : 0);
        lastDraw = now;
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!visible && !reduce) { visible = true; lastDraw = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { visible = false; cancelAnimationFrame(raf); };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      target[0] = (e.clientX - r.left) / r.width;
      target[1] = 1 - (e.clientY - r.top) / r.height;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [scale, warm]);

  if (failed) return null;
  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block h-full w-full", className)} />;
};

export default Nebula;
