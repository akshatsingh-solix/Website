import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plug, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Tilt } from "@/components/shared/Reveal";
import { DataFlowDiagram } from "@/components/home/DataFlowDiagram";

const STEPS = [
  { key: "sources", icon: Plug, title: "Connect every system", desc: "150+ connectors pull live, inactive and retired data from ERP, CRM, mainframes, files and SaaS, with full context intact." },
  { key: "core", icon: ShieldCheck, title: "Govern it once", desc: "Classification, masking, retention and legal hold are applied in the Common Data Platform and travel with every record." },
  { key: "outcomes", icon: Sparkles, title: "Activate it everywhere", desc: "The same governed data feeds AI agents, analytics, compliance search and long-term archives. No shadow copies." },
];
const STEP_MS = 4200;

/**
 * How data moves through the platform, as a live diagram the three steps
 * narrate. The steps cycle on their own; hovering or focusing one holds it.
 */
export const FlowExplainer = () => {
  const tx = useTx();
  const steps = useLocalized(STEPS);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held) return undefined;
    const t = setInterval(() => setActive((n) => (n + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [held]);

  return (
    <Section className="dark overflow-hidden bg-background text-foreground" id="how-it-flows">
      <div className="absolute inset-0 grid-lines grid-fade opacity-70" />
      <div className="container relative grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow="How data moves" title="Connect every system. Govern once. Activate everywhere." />
          <ol className="mt-10 space-y-3" onMouseLeave={() => setHeld(false)}>
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <li key={STEPS[i].key}>
                  <button
                    type="button"
                    onMouseEnter={() => { setActive(i); setHeld(true); }}
                    onFocus={() => { setActive(i); setHeld(true); }}
                    onBlur={() => setHeld(false)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className={cn("spot relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-[background-color,border-color] duration-300", on ? "border-line/15 bg-card" : "border-transparent hover:bg-line/[0.03]")}
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
                    {on && !held && (
                      <motion.span key={`bar-${active}`} className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal to-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: STEP_MS / 1000, ease: "linear" }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <Reveal delay={0.1} className="lg:col-span-7">
          <Tilt max={4}>
            <div className="beam-border relative rounded-3xl border border-line/10 bg-card/60 p-4 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.8)] backdrop-blur sm:p-6" data-testid="flow-explainer">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{tx("Common Data Platform")}</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-teal"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" /> {tx("live")}</span>
              </div>
              <DataFlowDiagram highlight={STEPS[active].key} />
            </div>
          </Tilt>
        </Reveal>
      </div>
    </Section>
  );
};
