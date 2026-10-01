import { useEffect, useState } from "react";
import { graphicsTier, joinLiveCanvas } from "@/lib/liveCanvas";

/**
 * Lifecycle of a live WebGL moment (liquid metal, data terrain, platform
 * explorer), for the element that holds it:
 *
 *   near     - mount it: it is within `margin` of the viewport. Once true it
 *              stays true, so shaders compile once and never again on the
 *              way back (three.js pitfall: never mount/unmount a scene).
 *   running  - animate it: it holds the page's one live-canvas slot
 *              (lib/liveCanvas.js) and the visitor gets full motion.
 *   tier     - "live" | "still" (reduced motion: one frame) | "static"
 *              (no WebGL2, Save-Data, slow or low-memory: show the poster).
 */
export function useLiveCanvas(ref, { margin = "60% 0px" } = {}) {
  const [tier] = useState(graphicsTier);
  const [near, setNear] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || tier === "static") return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, tier, margin]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !near || tier === "static") return undefined;
    return joinLiveCanvas(el, {
      onGrant: () => setGranted(true),
      onRevoke: () => setGranted(false),
    });
  }, [ref, near, tier]);

  return { tier, near: near && tier !== "static", running: granted && tier === "live", granted };
}
