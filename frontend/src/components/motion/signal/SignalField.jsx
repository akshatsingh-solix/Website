import { useEffect, useRef, useState } from "react";
import { isMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The live data field behind every hero: a WebGL particle system that
 * gathers into brand formations (see formations.js).
 *
 *   <SignalField formations={["cloud", "globe"]} progress={1} />
 *   <SignalField formations={["flow", "cloud", "sphere", "bolt"]} progress={scrollMotionValue} />
 *
 * `progress` (a number or a framer MotionValue) picks the position along
 * the formation list; the field eases toward it, so a number change reads
 * as a swarm re-forming and a scroll-linked MotionValue morphs with the
 * scroll. The engine is code-split and only draws while on screen and the
 * tab is visible. Reduced motion gets one still frame of the final shape;
 * no WebGL gets a soft CSS glow instead.
 */
export const SignalField = ({ formations, progress = 0, className, density = 1, place, placeFor, interactive = true, onReady }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const key = formations.join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    let io;
    let unsub;
    const onVisibility = () => {
      const e = engineRef.current;
      if (!e) return;
      if (document.hidden) e.stop();
      else if (canvas.dataset.visible === "1") e.start();
    };

    // Start a beat after mount, so shader compilation never lands in the
    // same frames as a route transition or the page's first paint.
    const ready = new Promise((resolve) => setTimeout(resolve, 180));
    Promise.all([import("./engine"), ready]).then(([{ createSignalEngine, particleBudget }]) => {
      if (cancelled) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let engine = null;
      try {
        engine = createSignalEngine(canvas, {
          formations,
          count: particleBudget(density),
          place,
          placeFor,
          interactive,
          staticFrame: reduce,
        });
      } catch {
        engine = null;
      }
      if (!engine) {
        setFallback(true);
        return;
      }
      engineRef.current = engine;

      const initial = isMotionValue(progress) ? progress.get() : progress;
      if (reduce) engine.setProgress(isMotionValue(progress) ? formations.length - 1 : initial, { immediate: true });
      else {
        // Arrive as scattered noise, then gather into the first target shape.
        engine.setProgress(0, { immediate: true });
        requestAnimationFrame(() => engine.setProgress(initial));
      }
      if (isMotionValue(progress) && !reduce) unsub = progress.on("change", (v) => engine.setProgress(v));

      io = new IntersectionObserver(([entry]) => {
        canvas.dataset.visible = entry.isIntersecting ? "1" : "0";
        if (entry.isIntersecting && !document.hidden) engine.start();
        else engine.stop();
      }, { rootMargin: "80px" });
      io.observe(canvas);
      document.addEventListener("visibilitychange", onVisibility);
      onReady?.(engine);
    });

    return () => {
      cancelled = true;
      unsub?.();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
    // Formations and placement are fixed for the life of the field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, density]);

  // Plain-number progress updates (e.g. a step change).
  useEffect(() => {
    if (!isMotionValue(progress)) engineRef.current?.setProgress(progress);
  }, [progress]);

  if (fallback) {
    return (
      <div aria-hidden="true" className={cn("pointer-events-none", className)}>
        <div className="absolute left-[55%] top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.35),rgba(238,36,36,0.12)_60%,transparent)]" />
      </div>
    );
  }
  return <canvas ref={canvasRef} aria-hidden="true" className={cn("pointer-events-none block h-full w-full", className)} data-testid="signal-field" />;
};

export default SignalField;
