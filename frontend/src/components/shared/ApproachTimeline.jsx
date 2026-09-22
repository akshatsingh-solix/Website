import { ClipboardCheck, FlaskConical, Rocket } from "lucide-react";
import { Stagger, Item } from "@/components/shared/Reveal";

const STEPS = [
  { n: "01", icon: ClipboardCheck, title: "Assess", duration: "2 weeks", desc: "Data estate assessment: growth, cost, retention obligations and AI readiness, with a quantified business case.", outputs: ["Savings model", "Risk register", "Prioritized backlog"] },
  { n: "02", icon: FlaskConical, title: "Prove", duration: "≤ 60 days", desc: "A scoped pilot on one system or dataset with agreed success metrics, run on the production-grade platform.", outputs: ["Live pilot", "Validated metrics", "Runbook"] },
  { n: "03", icon: Rocket, title: "Scale", duration: "Quarterly waves", desc: "Factory model with templates, automation and a run team, expanding across the portfolio on your cadence.", outputs: ["8-12 apps / wave", "Savings dashboard", "Compliance evidence"] },
];

export const ApproachTimeline = () => (
  <div className="relative" data-testid="approach-timeline">
    <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-teal/60 via-slate-500/40 to-primary/70 sm:left-1/2 sm:hidden lg:left-0 lg:right-0 lg:top-7 lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r" />
    <Stagger className="grid gap-8 lg:grid-cols-3" stagger={0.12}>
      {STEPS.map((s, i) => (
        <Item key={s.n} className="relative pl-20 lg:pl-0">
          <span className="absolute left-0 top-0 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-ink-950 text-teal lg:relative lg:mb-6">
            <s.icon className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <div className="rounded-2xl border border-white/10 bg-card p-6 card-hover">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-primary">{s.n}</span>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.duration}</span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-medium">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {s.outputs.map((o) => <li key={o} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">{o}</li>)}
            </ul>
          </div>
          {i < STEPS.length - 1 && <span className="absolute -right-4 top-7 hidden h-2 w-2 rounded-full bg-white/40 lg:block" />}
        </Item>
      ))}
    </Stagger>
  </div>
);
