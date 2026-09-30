import { lazy, memo, Suspense, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLiveCanvas } from "@/hooks/use-live-canvas";
import { DEFAULT_SIGNATURE } from "./terrainSignatures";

const TerrainScene = lazy(() => import("./TerrainScene"));

// The terrain's palette as soft CSS light: what shows while the scene
// compiles, and all there is for static-tier visitors.
const TerrainPoster = ({ signature }) => (
  <div
    className="absolute inset-0"
    style={{
      background: [
        `radial-gradient(70% 60% at 72% 58%, ${signature.color3}55, transparent 60%)`,
        `radial-gradient(90% 80% at 30% 40%, ${signature.color2}66, transparent 65%)`,
        `linear-gradient(180deg, ${signature.color1}, ${signature.color1})`,
      ].join(", "),
    }}
  />
);

/**
 * A living data landscape: a waterPlane from @shadergradient/react whose
 * palette and motion are an industry's signature (terrainSignatures.js).
 * Decorative, so hidden from assistive tech; content goes on top.
 *
 *   <DataTerrain signature={terrainSignature("telecom")} className="absolute inset-0" />
 *
 * Mounts once when near the viewport (never unmounted, so it compiles
 * once), animates only while it holds the page's live-canvas slot, renders
 * one still frame for reduced motion, and stays a poster on the static tier.
 */
export const DataTerrain = memo(function DataTerrain({ signature = DEFAULT_SIGNATURE, className }) {
  const ref = useRef(null);
  const { tier, near, running } = useLiveCanvas(ref, { margin: "40% 0px" });
  return (
    <div ref={ref} aria-hidden="true" className={cn("relative overflow-hidden", className)} data-testid="data-terrain">
      <TerrainPoster signature={signature} />
      {near && (
        <Suspense fallback={null}>
          <TerrainScene signature={signature} running={running} still={tier === "still"} />
        </Suspense>
      )}
    </div>
  );
});

export default DataTerrain;
