import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useExplorerTracking } from "@/components/explorers/kit";
import { useLocalized } from "@/i18n/localize";
import { useTx } from "@/i18n/tx";
import { FamilyVisual } from "./FamilyVisual";

const DWELL = 6500; // ms per stop while the tour plays itself

/**
 * Four-stop visual tour of a product family over its OpenArt render. It
 * plays itself while on screen until the visitor takes over (click a stop,
 * a step, the arrows or the keyboard), then hands off to the explorer below.
 */
export const FamilyTour = ({ family: source, product, exploreTarget = "try" }) => {
  const tx = useTx();
  const family = useLocalized(source);
  const stops = family.stops;
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(stops[0].id);
  const [visited, setVisited] = useState(() => new Set([stops[0].id]));
  const [auto, setAuto] = useState(true);
  const engaged = useExplorerTracking("visual-tour", useMemo(() => [product.slug], [product.slug]));
  const idx = Math.max(0, stops.findIndex((s) => s.id === active));
  const playing = auto && inView && !reduce;

  const go = (id, byUser) => {
    setActive(id);
    setVisited((v) => (v.has(id) ? v : new Set(v).add(id)));
    if (byUser) {
      setAuto(false);
      engaged(`stop:${id}`);
    }
  };
  const step = (d, byUser = true) => go(stops[(idx + d + stops.length) % stops.length].id, byUser);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => step(1, false), DWELL);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); }
  };
  const toExplorer = () => {
    engaged("tour-to-explorer");
    document.getElementById(exploreTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const done = visited.size === stops.length;
  const current = stops[idx];

  return (
    <div ref={ref} className="grid gap-5 lg:grid-cols-12" data-testid="family-tour">
      <div className="relative lg:col-span-7 xl:col-span-8">
        <FamilyVisual family={source} variant="interactive" active={active} visited={visited} zoom onSelect={(id) => go(id, true)} className="shadow-[0_2px_6px_rgba(13,25,45,0.08),0_50px_100px_-45px_rgba(13,25,45,0.6)]">
          {/* Caption for the active stop, on the render itself (small screens read it in the list). */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-none absolute bottom-3 left-3 right-14 hidden max-w-md rounded-2xl border border-white/10 bg-ink-950/75 p-4 text-white backdrop-blur-md md:block"
              aria-hidden
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">{tx("Stop {{n}} of {{total}}", { n: idx + 1, total: stops.length })}</p>
              <p className="mt-1 font-display text-lg font-medium leading-snug">{current.title}</p>
            </motion.div>
          </AnimatePresence>
        </FamilyVisual>
      </div>

      <div className="flex flex-col rounded-3xl border border-line/10 bg-card p-5 sm:p-6 lg:col-span-5 xl:col-span-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-ink">{tx("Visual tour")}</p>
        <h3 className="mt-1 font-display text-xl font-medium tracking-tight">{family.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{family.tagline}</p>

        <ol className="mt-5 space-y-1.5" onKeyDown={onKeyDown} aria-label={tx("Tour stops")}>
          {stops.map((s, i) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id, true)}
                  aria-current={on ? "step" : undefined}
                  className={cn("relative w-full overflow-hidden rounded-xl border px-3.5 py-2.5 text-left transition-colors", on ? "border-line/15 bg-muted" : "border-transparent hover:bg-muted/60")}
                  data-testid={`tour-step-${s.id}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] tabular-nums", on ? "bg-foreground text-background" : visited.has(s.id) ? "bg-line/10 text-foreground" : "border border-line/15 text-muted-foreground")}>{i + 1}</span>
                    <span className={cn("text-sm font-medium", !on && "text-muted-foreground")}>{s.title}</span>
                  </span>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="block overflow-hidden pl-9 text-sm leading-relaxed text-muted-foreground">
                        <span className="block pt-1.5">{s.desc}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {on && playing && (
                    <motion.span key={`${s.id}-bar`} aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: DWELL / 1000, ease: "linear" }} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary/70" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-xs text-muted-foreground" aria-live="polite">{tx("{{done}} of {{total}} explored", { done: visited.size, total: stops.length })}</span>
          <span className="flex gap-2">
            <Button type="button" size="icon" variant="outline" onClick={() => step(-1)} aria-label={tx("Previous stop")}><ArrowLeft /></Button>
            <Button type="button" size="icon" variant="outline" onClick={() => step(1)} aria-label={tx("Next stop")} data-testid="tour-next"><ArrowRight /></Button>
          </span>
        </div>
        <Button type="button" onClick={toExplorer} variant={done ? "default" : "outline"} className="mt-3 h-auto min-h-10 w-full whitespace-normal py-2.5 text-center" data-testid="tour-to-explorer">
          {tx("Next, hands-on: {{explorer}}", { explorer: family.explorer })} <ArrowDown />
        </Button>
      </div>
    </div>
  );
};
