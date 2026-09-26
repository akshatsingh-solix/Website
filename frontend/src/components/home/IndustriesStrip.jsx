import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRIES, SOURCE, TESTIMONIALS } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { Picture, webpSrcSet } from "@/components/shared/Picture";
import { slowConnection } from "@/lib/net";

const SIZES = "(min-width: 1024px) 50vw, 100vw";

// Customer voices, placed with the industry they come from. Industries
// without a quote lead with their strongest result instead.
// no-i18n
const VOICE_FOR = { "financial-services": 0, manufacturing: 1, retail: 2 };

const initialsOf = (role) => role.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

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
        <SectionHeading chapter="05" eyebrow="Industries & customers" title="Regulated. Data-intensive. Trusted at petabyte scale." />
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
                        <span className="relative h-px w-8">
                          <span className="absolute inset-y-0 left-0 w-3 bg-line/20" />
                          {on && <motion.span layoutId="industry-rule" className="absolute inset-y-0 left-0 w-8 bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                        </span>
                        <span className={cn("font-display text-lg transition-transform duration-300 sm:text-xl", on && "translate-x-1")}>{ind.name}</span>
                      </span>
                      <ArrowUpRight className={cn("h-5 w-5 shrink-0 text-primary-ink transition-[opacity,transform] duration-300", on ? "opacity-100" : "-translate-x-2 opacity-0")} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <div className="relative lg:col-span-7">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.slug}
                initial={{ opacity: 0, clipPath: "inset(0% 0% 0% 100% round 24px)" }}
                animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 24px)" }}
                exit={{ opacity: 0, clipPath: "inset(0% 100% 0% 0% round 24px)" }}
                transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                className="spot relative flex h-full flex-col overflow-hidden rounded-3xl border border-line/10 bg-card shadow-soft"
                data-testid="industry-detail-panel"
              >
                <div className="dark relative h-44 shrink-0 overflow-hidden bg-background sm:h-52">
                  <motion.div className="absolute inset-0" initial={{ scale: 1.18 }} animate={{ scale: 1.02 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}>
                    <Picture src={current.image} loading="eager" sizes={SIZES} className="h-full w-full object-cover" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 flex items-end gap-4 sm:left-8">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lift">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </span>
                    <h3 className="text-balance font-display text-xl font-medium leading-tight tracking-tight text-foreground sm:text-2xl">{current.headline}</h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="grid gap-6 sm:grid-cols-2">
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
                  {/* The customer voice (or the headline result) for this industry. */}
                  {VOICE_FOR[current.slug] !== undefined ? (
                    <figure className="relative mt-6 overflow-hidden rounded-2xl border border-line/10 bg-muted/70 p-5" data-testid="testimonial-quote">
                      <Quote className="absolute right-4 top-4 h-10 w-10 text-primary/15" strokeWidth={1} />
                      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-teal" />
                      <blockquote className="relative text-balance font-display text-lg font-light leading-snug tracking-tight text-foreground">
                        “{TESTIMONIALS[VOICE_FOR[current.slug]].quote}”
                      </blockquote>
                      <figcaption className="mt-4 flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-teal/20 font-mono text-[11px] font-semibold">{initialsOf(SOURCE.TESTIMONIALS[VOICE_FOR[current.slug]].role)}</span>
                        <span className="text-sm">
                          <span className="block font-medium">{TESTIMONIALS[VOICE_FOR[current.slug]].role}</span>
                          <span className="block text-xs text-muted-foreground">{TESTIMONIALS[VOICE_FOR[current.slug]].org}</span>
                        </span>
                      </figcaption>
                    </figure>
                  ) : (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal/25 bg-teal/5 p-5">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" strokeWidth={1.75} />
                      <p className="font-display text-lg leading-snug tracking-tight text-foreground">{current.results[0]}</p>
                    </div>
                  )}
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
