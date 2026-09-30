/**
 * The compositing budget, enforced (PRD, iteration 7): one live WebGL
 * canvas per screen.
 *
 * Every live canvas on the site - the SignalField, the liquid-metal bolt,
 * the industry data terrains and the platform explorer - joins here. Only
 * the one covering the most of the viewport is granted frames; the others
 * hold their last frame until they win the screen back. So a page can carry
 * several live moments while the GPU only ever draws one of them, and a
 * hidden tab draws none.
 *
 *   const leave = joinLiveCanvas(el, { onGrant: start, onRevoke: stop });
 */

const members = new Map(); // element -> { area, onGrant, onRevoke }
let holder = null;
let io = null;
let scheduled = false;

// A challenger must cover this much more of the screen than the current
// holder to take over, so two half-visible canvases don't trade frames
// back and forth on every scroll tick.
const HYSTERESIS = 0.06;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

const viewportArea = () => Math.max(1, window.innerWidth * window.innerHeight);

function arbitrate() {
  scheduled = false;
  let best = null;
  let bestArea = 0;
  members.forEach((m, el) => {
    if (m.area > bestArea) {
      best = el;
      bestArea = m.area;
    }
  });
  if (document.hidden) best = null;
  const current = holder && members.get(holder);
  if (best && current && current.area > 0 && best !== holder && bestArea < current.area + HYSTERESIS) best = holder;
  if (best === holder) return;
  const previous = holder;
  holder = best;
  if (previous && members.has(previous)) {
    previous.dataset.liveCanvas = "held";
    members.get(previous).onRevoke?.();
  }
  if (best) {
    best.dataset.liveCanvas = "running";
    members.get(best).onGrant?.();
  }
}

const schedule = () => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(arbitrate);
};

function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const m = members.get(entry.target);
        if (!m) continue;
        const r = entry.intersectionRect;
        m.area = entry.isIntersecting ? (r.width * r.height) / viewportArea() : 0;
      }
      schedule();
    },
    { threshold: THRESHOLDS },
  );
  document.addEventListener("visibilitychange", schedule);
  return io;
}

export function joinLiveCanvas(el, { onGrant, onRevoke } = {}) {
  if (!el) return () => {};
  if (typeof IntersectionObserver === "undefined") {
    onGrant?.();
    return () => onRevoke?.();
  }
  members.set(el, { area: 0, onGrant, onRevoke });
  // Visible state for tests and debugging: "running" | "held".
  el.dataset.liveCanvas = "held";
  observer().observe(el);
  return () => {
    io?.unobserve(el);
    const held = holder === el;
    members.delete(el);
    delete el.dataset.liveCanvas;
    if (held) {
      holder = null;
      onRevoke?.();
      schedule();
    }
  };
}

/** The element currently granted frames (for tests and debugging). */
export const liveCanvasHolder = () => holder;

let webgl2;
const hasWebGL2 = () => {
  if (webgl2 !== undefined) return webgl2;
  try {
    webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    webgl2 = false;
  }
  return webgl2;
};

/**
 * How much live graphics this visitor should get:
 *   "live"   - full animation
 *   "still"  - reduced motion: render one frame and hold it
 *   "static" - no WebGL2, Save-Data, a 2G connection or a low-memory
 *              device: skip the 3D libraries entirely and show the poster
 */
export function graphicsTier() {
  if (typeof window === "undefined") return "static";
  const connection = navigator.connection || {};
  if (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")) return "static";
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return "static";
  if (!hasWebGL2()) return "static";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  return "live";
}
