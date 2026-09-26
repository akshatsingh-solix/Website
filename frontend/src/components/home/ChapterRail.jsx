import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { scrollWindowTo } from "@/components/motion/SmoothScroll";
import { useOverDarkSurface } from "@/components/layout/navTone";

// i18n: labels translated at render.
const CHAPTERS = [
  { id: "the-challenge", label: "The case" },
  { id: "the-platform", label: "The platform" },
  { id: "the-outcomes", label: "What you get" },
  { id: "enterprise-ai", label: "Enterprise AI" },
  { id: "industries", label: "Industries & customers" },
  { id: "insights", label: "Insights" },
];

/**
 * Where am I in the story: a slim index down the left edge (wide screens)
 * that appears once the frames begin, lights the current chapter, jumps on
 * click, and turns light-on-navy over the dark frames.
 */
export const ChapterRail = () => {
  const tx = useTx();
  const [active, setActive] = useState(-1);
  const [hover, setHover] = useState(false);
  const dark = useOverDarkSurface(typeof window === "undefined" ? 400 : Math.round(window.innerHeight / 2));

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      let current = -1;
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) current = i;
      });
      setActive(current);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className={cn("fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 min-[1400px]:block", dark && "dark")}>
    <AnimatePresence>
      {active >= 0 && (
        <motion.nav
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-2.5 rounded-2xl py-2 pr-3 transition-colors duration-300 hover:bg-background/80 hover:backdrop-blur-md"
          aria-label={tx("Chapters")}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          data-testid="chapter-rail"
        >
          {CHAPTERS.map((c, i) => {
            const on = i === active;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { const el = document.getElementById(c.id); if (el) scrollWindowTo(el, { offset: -40 }); }}
                className="group flex items-center gap-3 text-left"
                aria-current={on || undefined}
                data-testid={`chapter-${c.id}`}
              >
                <span className={cn("h-px transition-[width,background-color] duration-500", on ? "w-8 bg-primary" : "w-3.5 bg-line/30 group-hover:w-6 group-hover:bg-line/60")} />
                <span className={cn("font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300", on ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground")}>
                  0{i + 1}
                  <span className={cn("ml-2 inline-block overflow-hidden whitespace-nowrap align-bottom transition-[max-width,opacity] duration-500", hover ? "max-w-[14rem] opacity-100" : "max-w-0 opacity-0")}>{tx(c.label)}</span>
                </span>
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
    </div>
  );
};
