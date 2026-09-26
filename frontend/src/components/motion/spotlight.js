import { useEffect } from "react";

/**
 * One delegated pointer listener drives every `.spot` surface on the page:
 * it writes the pointer position into --mx / --my on the hovered surface,
 * and index.css paints a soft glow and a lit border there. Adding the class
 * is all a card needs; nothing re-renders. Mouse only.
 */
export const usePointerSpotlight = () => {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    let raf = 0;
    let last = null;
    const paint = () => {
      raf = 0;
      const e = last;
      const el = e?.target?.closest?.(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onMove = (e) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
};
