import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, [data-cursor-hover]";

/**
 * Deliberately avoids React state (and therefore re-renders) in the mousemove
 * hot path - an earlier version called setState on every pixel of movement,
 * which is what caused the visible stutter. Position is written straight to
 * the DOM on every mousemove event with no interpolation, so the dot tracks
 * the real pointer 1:1 (an earlier lerp-smoothed version made the dot trail
 * behind the actual pointer, which read as "out of sync" on a trackpad).
 * Hover state is toggled via classList through delegated mouseover/mouseout
 * (which only fire on actual element-boundary crossings, not per pixel), not
 * React state either.
 */
// Computed synchronously (not via an effect + setState) so `enabled` is
// already correct on the very first render - the cursor <div> (and its ref)
// must exist before the effect below runs, or it captures a permanently
// null ref and the cursor never moves at all.
const supportsFinePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const CustomCursor = () => {
  const [enabled] = useState(supportsFinePointer);
  const dotRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = dotRef.current;

    const onMove = (e) => {
      if (el) {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        if (el.style.opacity !== "1") el.style.opacity = "1";
      }
    };
    const onOver = (e) => {
      if (e.target?.closest?.(INTERACTIVE_SELECTOR)) el?.classList.add("cursor-hover");
    };
    const onOut = (e) => {
      if (e.target?.closest?.(INTERACTIVE_SELECTOR)) el?.classList.remove("cursor-hover");
    };
    const onWindowLeave = () => { if (el) el.style.opacity = "0"; };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.documentElement.addEventListener("mouseleave", onWindowLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.removeEventListener("mouseleave", onWindowLeave);
    };
    // `enabled` is set once via lazy state init and never changes post-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;

  return (
    <div ref={dotRef} className="custom-cursor-dot" aria-hidden="true">
      <span className="custom-cursor-ring" />
    </div>
  );
};
