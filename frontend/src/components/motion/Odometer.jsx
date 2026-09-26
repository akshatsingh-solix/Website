import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Mechanical counter: each digit is a reel that spins down to its value when
 * it scrolls into view, the reels settling right to left. Non-digits
 * (separators, suffixes) sit still. Real value for assistive tech.
 */
export const Odometer = ({ value, suffix = "", prefix = "", className, duration = 1.6 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const text = `${prefix}${value}${suffix}`;
  const chars = [...String(value)];

  return (
    <span ref={ref} className={cn("inline-flex items-baseline tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        <span className="whitespace-pre">{prefix}</span>
        {chars.map((c, i) => {
          const d = Number(c);
          if (Number.isNaN(d) || c === " ") return <span key={i}>{c}</span>;
          const settle = chars.length - i;
          return (
            <span key={i} className="relative inline-block h-[1em] overflow-hidden leading-none" style={{ width: "0.62em" }}>
              <span
                className="absolute inset-x-0 top-0 flex flex-col"
                style={{
                  // Two full turns before settling, so every reel visibly spins.
                  transform: `translateY(${inView || reduce ? -(d + 20) * 10 / 3 : 0}%)`,
                  transition: reduce ? "none" : `transform ${duration + settle * 0.12}s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s`,
                }}
              >
                {[...DIGITS, ...DIGITS, ...DIGITS].map((n, k) => (
                  <span key={k} className="block h-[1em] text-center leading-none">{n}</span>
                ))}
              </span>
            </span>
          );
        })}
        <span className="whitespace-pre">{suffix}</span>
      </span>
    </span>
  );
};
