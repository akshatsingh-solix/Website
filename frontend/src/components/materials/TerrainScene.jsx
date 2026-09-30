import { memo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

/*
 * The live half of <DataTerrain>, code-split with three.js, React Three
 * Fiber and @shadergradient/react (MIT). How it is driven follows from
 * reading the library:
 *
 * - pointerEvents "none": ShaderGradient attaches camera-controls to its
 *   canvas, whose wheel handler calls preventDefault - with pointer events
 *   on, scrolling over the terrain would zoom it instead of the page.
 * - grain "off": grain is a full-screen halftone pass with two extra render
 *   targets, the most expensive thing ShaderGradient draws.
 * - lightType "3d": "env" downloads all three HDR maps from a third-party
 *   host, whichever preset is chosen.
 * - type stays "waterPlane": the library does not key its shader cache by
 *   type, so switching type on a live canvas can keep the old shader.
 * - lazyLoad off: its lazy mode unmounts the canvas off-screen, recompiling
 *   on every return. DataTerrain mounts this once; FrameGate below pauses it.
 * - memo: ShaderGradient rebuilds its material whenever it re-renders.
 */

// R3F renders every frame while mounted ("always"). While the terrain does
// not hold the page's live-canvas slot, stop the loop and keep the frame.
function FrameGate({ running }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    setFrameloop(running ? "always" : "demand");
    if (!running) invalidate();
  }, [running, setFrameloop, invalidate]);
  return null;
}

// A moment of the flow with a good silhouette, for still frames.
const STILL_TIME = 4;

function TerrainScene({ signature, running, still }) {
  return (
    <ShaderGradientCanvas
      className="!absolute inset-0"
      style={{ position: "absolute", inset: 0 }}
      pixelDensity={1}
      fov={45}
      pointerEvents="none"
      lazyLoad={false}
      powerPreference="low-power"
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        shader="defaults"
        animate={still ? "off" : "on"}
        uTime={still ? STILL_TIME : 0}
        uAmplitude={0}
        uFrequency={5.5}
        positionX={0}
        positionY={0}
        positionZ={0}
        cameraZoom={1}
        brightness={1.3}
        reflection={0.12}
        lightType="3d"
        grain="off"
        enableTransition={running}
        {...signature}
      />
      <FrameGate running={running && !still} />
    </ShaderGradientCanvas>
  );
}

export default memo(TerrainScene);
