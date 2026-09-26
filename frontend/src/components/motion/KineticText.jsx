import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1];

const container = (stagger, delay) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const word = {
  hidden: { y: "108%", rotate: 3, opacity: 0 },
  show: { y: "0%", rotate: 0, opacity: 1, transition: { duration: 0.85, ease: EASE } },
};

/**
 * Kinetic headline: every word rises out of its own mask, staggered, the
 * way the brand's data "surfaces". The text stays real text in the DOM
 * (selectable, indexable, read normally by screen readers).
 *
 *   <SplitWords text={tx(title)} />                 // plays when scrolled into view
 *   <SplitWords text={...} play={ready} />          // plays when `play` turns true
 *   <SplitWords text={...} accentFrom={4} />        // words from index 4 on get the brand gradient
 */
export const SplitWords = ({ text, className, wordClassName, delay = 0, stagger = 0.055, play, accentFrom, once = true }) => {
  const reduce = useReducedMotion();
  const value = String(text ?? "");
  const words = value.split(/\s+/).filter(Boolean);
  const accentStart = accentFrom ?? Infinity;
  if (reduce || !value) {
    if (!Number.isFinite(accentStart)) return <span className={className}>{value}</span>;
    return (
      <span className={className}>
        {words.slice(0, accentStart).join(" ")} <span className="text-gradient-accent">{words.slice(accentStart).join(" ")}</span>
      </span>
    );
  }

  const controlled = play !== undefined;

  return (
    <motion.span
      className={cn("inline", className)}
      variants={container(stagger, delay)}
      initial="hidden"
      {...(controlled ? { animate: play ? "show" : "hidden" } : { whileInView: "show", viewport: { once, margin: "-8% 0px" } })}
    >
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <motion.span variants={word} className={cn("inline-block origin-bottom-left will-change-transform", i >= accentStart && "text-gradient-accent pr-[0.04em]", wordClassName)}>
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </motion.span>
  );
};
