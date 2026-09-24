import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRIES } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { Picture, webpSrcSet } from "@/components/shared/Picture";
import { slowConnection } from "@/lib/net";

const SIZES = "(min-width: 1024px) 50vw, 100vw";

export const IndustriesStrip = () => {
  const tx = useTx();
  const [active, setActive] = useState(INDUSTRIES[0].slug);
  const current = INDUSTRIES.find((i) => i.slug === active);
  const Icon = current.icon;

  // Warm the cache for every industry render once the page is idle, so
  // hovering down the list swaps images instantly instead of popping in.
  // Skipped on slow or data-saver connections, where it would compete with
  // what the visitor is actually looking at.
  useEffect(() => {
    if (slowConnection()) return undefined;
    const warm = () => INDUSTRIES.forEach((ind) => {
      const img = new Image();
      const set = webpSrcSet(ind.image);
      if (set) { img.sizes = SIZES; img.srcset = set; }
      img.src = ind.image;
    });
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(warm) : setTimeout(warm, 1500);
    return () => ("cancelIdleCallback" in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  return (
    <Section className="bg-background" id="industries">
      <div className="container">
        <SectionHeading chapter="07" eyebrow="Industries" title="Regulated. Data-intensive. Trusted at petabyte scale." />
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-5">
            <ul className="divide-y divide-line/10 border-y border-line/10" data-testid="industries-list">
              {INDUSTRIES.map((ind, idx) => {
                const on = active === ind.slug;
                return (
                  <li key={ind.slug}>
                    <button
                      onMouseEnter={() => setActive(ind.slug)}
                      onFocus={() => setActive(ind.slug)}
                      onClick={() => setActive(ind.slug)}
                      aria-pressed={on}
                      data-testid={`industry-tab-${ind.slug}`}
                      className={cn(
                        "group flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors duration-200",
                        on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-4">
                        <span className="w-6 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                        <span className={cn("h-px transition-[width,background-color] duration-300", on ? "w-8 bg-primary" : "w-3 bg-line/20")} />
                        <span className="font-display text-lg sm:text-xl">{ind.name}</span>
                      </span>
                      <ArrowUpRight className={cn("h-5 w-5 shrink-0 text-primary-ink transition-[opacity,transform] duration-300", on ? "opacity-100" : "-translate-x-2 opacity-0")} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.slug}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-line/10 bg-card shadow-soft"
                data-testid="industry-detail-panel"
              >
                <div className="dark relative h-52 shrink-0 overflow-hidden bg-background sm:h-60">
                  <Picture src={current.image} loading="eager" sizes={SIZES} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 flex items-end gap-4 sm:left-8">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lift">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </span>
                    <h3 className="text-balance font-display text-xl font-medium leading-tight tracking-tight text-foreground sm:text-2xl">{current.headline}</h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="max-w-xl text-muted-foreground">{current.desc}</p>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="eyebrow mb-3">{tx("Challenges")}</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {current.challenges.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />{c}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="eyebrow mb-3 !text-teal">{tx("Results")}</p>
                      <ul className="space-y-2 text-sm text-foreground">
                        {current.results.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />{c}</li>)}
                      </ul>
                    </div>
                  </div>
                  <Link to={`/industries/${current.slug}`} className="mt-auto inline-flex items-center gap-1.5 self-start pt-6 text-sm font-medium text-primary-ink link-underline" data-testid="industry-detail-link">
                    {tx("Explore")} {current.name} <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
};
