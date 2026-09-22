import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRIES } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";

export const IndustriesStrip = () => {
  const [active, setActive] = useState(INDUSTRIES[0].slug);
  const current = INDUSTRIES.find((i) => i.slug === active);
  const Icon = current.icon;

  return (
    <Section bordered>
      <div className="container">
        <SectionHeading eyebrow="Industries" title="Regulated. Data-intensive. Trusted at petabyte scale." />
        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <ul className="divide-y divide-white/10 border-y border-white/10" data-testid="industries-list">
              {INDUSTRIES.map((ind) => (
                <li key={ind.slug}>
                  <button
                    onMouseEnter={() => setActive(ind.slug)}
                    onFocus={() => setActive(ind.slug)}
                    onClick={() => setActive(ind.slug)}
                    data-testid={`industry-tab-${ind.slug}`}
                    className={cn(
                      "group flex w-full items-center justify-between py-4 text-left transition-colors duration-200",
                      active === ind.slug ? "text-foreground" : "text-muted-foreground hover:text-slate-200"
                    )}
                  >
                    <span className="flex items-center gap-4">
                      <span className={cn("h-px transition-[width,background-color] duration-300", active === ind.slug ? "w-8 bg-primary" : "w-3 bg-white/20")} />
                      <span className="font-display text-xl sm:text-2xl">{ind.name}</span>
                    </span>
                    <ArrowUpRight className={cn("h-5 w-5 transition-[opacity,transform] duration-300", active === ind.slug ? "opacity-100" : "opacity-0 -translate-x-2")} />
                  </button>
                </li>
              ))}
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
                className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-card p-8 sm:p-10"
                data-testid="industry-detail-panel"
              >
                <img src={current.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/50" />
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
                <span className="relative grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-ink-950 text-primary">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <h3 className="relative mt-6 text-balance font-display text-2xl font-medium tracking-tight sm:text-3xl">{current.headline}</h3>
                <p className="relative mt-4 max-w-xl text-muted-foreground">{current.desc}</p>
                <div className="relative mt-8 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-3">Challenges</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {current.challenges.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />{c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="eyebrow mb-3 text-teal">Results</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {current.results.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal" />{c}</li>)}
                    </ul>
                  </div>
                </div>
                <Link to={`/industries/${current.slug}`} className="relative mt-8 inline-flex items-center gap-1.5 text-sm text-primary link-underline" data-testid="industry-detail-link">
                  Explore {current.name} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
};
