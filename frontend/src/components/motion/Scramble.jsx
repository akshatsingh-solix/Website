import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const GLYPHS = "01ABCDEF#/<>_:=+*·▚▞░▒";

/**
 * Data-decode text: characters cycle through machine glyphs and resolve
 * left to right, the way a record comes back from an archive. Frames are
 * written straight to the DOM (no React re-render per frame). Screen
 * readers get the real text from a hidden copy; the animated copy is
 * decorative. Plain text for reduced motion.
 */
export const ScrambleText = ({ text, as: Tag = "span", className, duration = 700, delay = 0, trigger = "view", ...rest }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const value = String(text ?? "");
  const start = trigger === "mount" || (trigger === "view" && inView);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduce || !start) {
      el.textContent = value;
      return undefined;
    }
    let raf;
    let t0;
    const chars = [...value];
    const frame = (now) => {
      if (t0 === undefined) t0 = now + delay;
      const p = Math.max(0, Math.min(1, (now - t0) / duration));
      const resolved = Math.floor(p * chars.length);
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (i < resolved || c === " " || c === "·") out += c;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) raf = requestAnimationFrame(frame);
      else el.textContent = value;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value, start, reduce, duration, delay]);

  return (
    <Tag className={cn("relative", className)} {...rest}>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden="true">{value}</span>
    </Tag>
  );
};
