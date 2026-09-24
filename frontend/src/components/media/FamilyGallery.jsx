import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAMILIES } from "@/data/families";
import { PRODUCTS } from "@/data/site";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/intent";
import { useLocalized } from "@/i18n/localize";
import { useTx } from "@/i18n/tx";
import { FamilyVisual } from "./FamilyVisual";

const STOP_MS = 3200; // showreel: each stop, then the next family

/**
 * Products page showcase: the five product families as tabs over their
 * OpenArt visuals. It plays as a showreel while on screen (stop by stop,
 * family by family) until the visitor picks a family or a stop.
 */
export const FamilyGallery = () => {
  const tx = useTx();
  const families = useLocalized(FAMILIES);
  const ref = useRef(null);
  const tabs = useRef([]);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [fi, setFi] = useState(0);
  const [stop, setStop] = useState(0);
  const [auto, setAuto] = useState(true);
  const family = families[fi];
  const products = PRODUCTS.filter((p) => family.products.includes(p.slug));
  const playing = auto && inView && !reduce;

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => {
      if (stop < family.stops.length - 1) setStop(stop + 1);
      else { setFi((fi + 1) % families.length); setStop(0); }
    }, STOP_MS);
    return () => clearTimeout(t);
  }, [playing, stop, fi, family.stops.length, families.length]);

  const pickFamily = (i, focus) => {
    setAuto(false);
    setFi(i);
    setStop(0);
    if (focus) tabs.current[i]?.focus();
    track("engaged", { topics: FAMILIES[i].products.slice(0, 3), meta: { explorer: "family-gallery", action: `family:${FAMILIES[i].id}` } });
  };
  const onTabKey = (e) => {
    const n = families.length;
    if (e.key === "ArrowRight") { e.preventDefault(); pickFamily((fi + 1) % n, true); }
    if (e.key === "ArrowLeft") { e.preventDefault(); pickFamily((fi - 1 + n) % n, true); }
    if (e.key === "Home") { e.preventDefault(); pickFamily(0, true); }
    if (e.key === "End") { e.preventDefault(); pickFamily(n - 1, true); }
  };
  const current = family.stops[stop];

  return (
    <div ref={ref} data-testid="family-gallery">
      <div role="tablist" aria-label={tx("Product families")} onKeyDown={onTabKey} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {families.map((f, i) => (
          <button
            key={f.id}
            ref={(el) => { tabs.current[i] = el; }}
            type="button"
            role="tab"
            id={`family-tab-${f.id}`}
            aria-selected={i === fi}
            aria-controls="family-panel"
            tabIndex={i === fi ? 0 : -1}
            onClick={() => pickFamily(i)}
            className={cn("relative shrink-0 overflow-hidden rounded-full border px-4 py-2 text-sm transition-colors", i === fi ? "border-foreground bg-foreground text-background" : "border-line/15 bg-card text-muted-foreground hover:text-foreground")}
            data-testid={`family-tab-${f.id}`}
          >
            {f.name} <span className="ml-1 font-mono text-[11px] opacity-60">{f.products.length}</span>
            {i === fi && playing && (
              <motion.span key={`${f.id}-${stop}`} aria-hidden initial={{ scaleX: (stop) / f.stops.length }} animate={{ scaleX: (stop + 1) / f.stops.length }} transition={{ duration: STOP_MS / 1000, ease: "linear" }} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div id="family-panel" role="tabpanel" aria-labelledby={`family-tab-${family.id}`} className="mt-6 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FamilyVisual
            family={FAMILIES[fi]}
            variant="interactive"
            active={current.id}
            onSelect={(id) => { setAuto(false); setStop(family.stops.findIndex((s) => s.id === id)); }}
            className="shadow-[0_2px_6px_rgba(13,25,45,0.08),0_50px_100px_-45px_rgba(13,25,45,0.6)]"
          />
        </div>
        <div className="flex flex-col rounded-3xl border border-line/10 bg-card p-5 sm:p-7 lg:col-span-5">
          <AnimatePresence mode="wait">
            <motion.div key={family.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <h3 className="font-display text-2xl font-medium tracking-tight">{family.name}</h3>
              <p className="mt-2 text-muted-foreground">{family.tagline}</p>

              <div className="mt-5 min-h-[112px] rounded-2xl border border-line/10 bg-muted p-4" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Stop {{n}} of {{total}}", { n: stop + 1, total: family.stops.length })}</p>
                <p className="mt-1 font-medium">{current.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{current.desc}</p>
              </div>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{tx("{{count}} products", { count: products.length })}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {products.map((p) => (
                  <Link key={p.slug} to={`/products/${p.slug}`} className="rounded-full border border-line/10 px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:text-foreground" data-testid={`family-product-${p.slug}`}>{p.name}</Link>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <Button asChild className="h-auto min-h-10 w-full whitespace-normal py-2.5 text-center sm:w-auto" data-testid="family-try">
                  <Link to={`/products/${family.products[0]}#explore`}>{tx("Try it: {{explorer}}", { explorer: family.explorer })} <ArrowRight /></Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
