import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Eyebrow reveal: the label rises into place from behind a mask and fades
 * in, once, when it enters the view (or on mount). Pure CSS transition, so
 * no per-frame work. The name is kept for its many call sites; the old
 * glyph-decode effect read as a template, not a brand.
 */
export const ScrambleText = ({ text, as: Tag = "span", className, duration = 700, delay = 0, trigger = "view", ...rest }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const value = String(text ?? "");
  const shown = reduce || trigger === "mount" || (trigger === "view" && inView);
  const ms = Math.min(duration, 800);

  return (
    <Tag ref={ref} className={cn("relative", className)} {...rest}>
      <span className="inline-block overflow-hidden align-bottom">
        <span
          className="inline-block"
          style={{
            transform: shown ? "translateY(0)" : "translateY(105%)",
            opacity: shown ? 1 : 0,
            transition: reduce ? "none" : `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, opacity ${ms}ms ease ${delay}ms`,
          }}
        >
          {value}
        </span>
      </span>
    </Tag>
  );
};
