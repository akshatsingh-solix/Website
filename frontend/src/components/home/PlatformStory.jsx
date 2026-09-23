import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Plug, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraField, Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/Section";
import { DataFlowDiagram } from "./DataFlowDiagram";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";

const STEPS = [
  { key: "sources", icon: Plug, title: "Connect every system", desc: "150+ connectors pull live, inactive and retired data from ERP, CRM, mainframes, files and SaaS, with full context intact." },
  { key: "core", icon: ShieldCheck, title: "Govern it once", desc: "Classification, masking, retention and legal hold are applied in the Common Data Platform and travel with every record." },
  { key: "outcomes", icon: Sparkles, title: "Activate it everywhere", desc: "The same governed data feeds AI agents, analytics, compliance search and long-term archives. No shadow copies." },
];

const STEP_MS = 4200;

/**
 * Chapter 03, a scoped navy "moment" in the light page: the platform
 * explained as three steps that narrate the live diagram. The steps cycle
 * on their own; hovering or focusing one takes over, so the story is both
 * ambient and explorable.
 */
export const PlatformStory = () => {
  const tx = useTx();
  const steps = useLocalized(STEPS);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((n) => (n + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section className="dark relative overflow-hidden bg-background py-16 text-foreground sm:py-20 lg:py-24" id="the-platform" data-testid="platform-story">
      <div className="absolute inset-0 grid-lines grid-fade" />
      <AuroraField />
      <div className="container relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading chapter="03" eyebrow="The platform" title="Connect every system. Govern once. Activate everywhere." />
          <ol className="mt-10 space-y-3" onMouseLeave={() => setPaused(false)}>
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onMouseEnter={() => { setActive(i); setPaused(true); }}
                    onFocus={() => { setActive(i); setPaused(true); }}
                    onBlur={() => setPaused(false)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    data-testid={`platform-step-${s.key}`}
                    className={cn(
                      "relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-[background-color,border-color] duration-300",
                      on ? "border-line/15 bg-card" : "border-transparent hover:bg-line/[0.03]"
                    )}
                  >
                    <div className="flex gap-4">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-300", on ? (i === 2 ? "bg-primary text-primary-foreground" : "bg-teal text-white") : "bg-line/5 text-muted-foreground")}>
                        <s.icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Step {{n}}", { n: `0${i + 1}` })}</p>
                        <h3 className="mt-1 font-display text-lg font-medium">{s.title}</h3>
                        <p className={cn("text-sm leading-relaxed text-muted-foreground transition-[max-height,opacity,margin] duration-500", on ? "mt-2 max-h-40 opacity-100" : "max-h-0 overflow-hidden opacity-0")}>{s.desc}</p>
                      </div>
                    </div>
                    {on && !paused && (
                      <motion.span
                        key={`bar-${active}`}
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal to-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <Link to="/platform" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground link-underline" data-testid="platform-story-link">
            {tx("Explore the Common Data Platform")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="relative rounded-3xl border border-line/10 bg-card/60 p-4 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.8)] backdrop-blur sm:p-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{tx("Common Data Platform")}</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" /> {tx("live")}
              </span>
            </div>
            <DataFlowDiagram highlight={STEPS[active].key} />
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/10 pt-4 text-center">
              {[["150+", tx("connectors")], ["1", tx("policy layer")], ["0", tx("shadow copies")]].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-xl font-semibold sm:text-2xl">{v}</p>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
