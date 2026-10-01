import { lazy, Suspense, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLiveCanvas } from "@/hooks/use-live-canvas";

// Paper's liquid-metal shader (@paper-design/shaders-react, Apache-2.0): the
// same technique as Paper's liquid-logo - the silhouette is turned into a
// bevel by solving a Poisson equation over it, and chrome stripes with a red
// and blue dispersion flow across that bevel - packaged by its authors under
// a permissive licence, with colour tint and far cheaper image processing.
const LiquidMetal = lazy(() => import("@paper-design/shaders-react").then((m) => ({ default: m.LiquidMetal })));

export const BOLT_MASK = `${process.env.PUBLIC_URL || ""}/brand/solix-bolt-mask.svg`;

// A fixed moment of the flow, for visitors who asked for less motion.
const STILL_FRAME = 5200;

/**
 * The bolt's silhouette in the same geometry as the shader draws it (fit
 * contain at 94%), faint Solix Red: holds the place while the shader
 * compiles, and is covered exactly once the metal is drawn.
 */
export const BoltPlaceholder = () => (
  <svg viewBox="9.5 2.5 21.5 35.5" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full scale-[0.94]" aria-hidden="true">
    <defs>
      <linearGradient id="bolt-hold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#EE2424" stopOpacity="0.45" />
        <stop offset="1" stopColor="#B91C1C" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <path d="M23.5 3.5 10.5 22.5h8.2L15.2 37 30 17h-8.2L26 3.5Z" fill="url(#bolt-hold)" />
  </svg>
);

/**
 * The Solix bolt (or any silhouette) in liquid metal.
 *
 *   <LiquidMetalMark className="h-64 w-64" />                 // Solix Red chrome
 *   <LiquidMetalMark tint="#ffffff" fallback={<img … />} />   // pure chrome
 *
 * It mounts when it comes within reach of the viewport, animates only while
 * it holds the page's live-canvas slot, holds one still frame for reduced
 * motion, and shows `fallback` where WebGL2 is not worth it.
 */
export function LiquidMetalMark({ src = BOLT_MASK, tint = "#EE2424", speed = 0.7, className, fallback = null, placeholder = src === BOLT_MASK ? <BoltPlaceholder /> : null, ...shaderProps }) {
  const ref = useRef(null);
  const { tier, near, running } = useLiveCanvas(ref);
  return (
    <div ref={ref} aria-hidden="true" className={cn("relative", className)} data-testid="liquid-metal">
      {tier !== "static" && placeholder}
      {near ? (
        <Suspense fallback={fallback}>
          <LiquidMetal
            image={src}
            colorBack="#00000000"
            colorTint={tint}
            shape="none"
            repetition={2.2}
            softness={0.12}
            shiftRed={0.35}
            shiftBlue={0.35}
            distortion={0.08}
            contour={0.45}
            angle={70}
            fit="contain"
            scale={0.94}
            speed={running ? speed : 0}
            frame={tier === "still" ? STILL_FRAME : 0}
            minPixelRatio={1}
            maxPixelCount={1400 * 1400}
            style={{ position: "absolute", inset: 0 }}
            {...shaderProps}
          />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}

export default LiquidMetalMark;
