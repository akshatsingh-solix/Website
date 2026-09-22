import { Link } from "react-router-dom";
import { Activity, Archive, ArrowRight, Database, PowerOff, Sparkles, Vault } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { EraFlow } from "./EraFlow";

const ERAS = [
  { icon: Database, era: "Active", title: "Live systems", desc: "ERP, CRM, SaaS and files in daily use.", to: "/products/common-data-platform", tone: "text-teal" },
  { icon: Activity, era: "Inactive", title: "Closed history", desc: "Closed years, completed orders, dormant records.", to: "/products/enterprise-archiving", tone: "text-teal" },
  { icon: Archive, era: "Archived", title: "Tiered & searchable", desc: "Moved out of production, one click away.", to: "/products/enterprise-archiving", tone: "text-slate-200" },
  { icon: PowerOff, era: "Retired", title: "Application switched off", desc: "Licenses cancelled, data and context preserved.", to: "/products/application-retirement", tone: "text-slate-200" },
  { icon: Vault, era: "Preserved", title: "Governed for decades", desc: "Retention, legal hold, defensible deletion.", to: "/solutions#data-preservation", tone: "text-primary" },
  { icon: Sparkles, era: "Activated", title: "Fuel for AI", desc: "Every era becomes governed input for agents and analytics.", to: "/products/enterprise-ai", tone: "text-primary" },
];

export const DataEras = () => (
  <Section bordered className="overflow-hidden">
    <div className="container">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <SectionHeading className="lg:col-span-7" eyebrow="Every system, every era" title="One lifecycle. One platform. No dead ends." description="Most vendors serve one moment in a record's life. Solix follows the record from the day it is created to the day an AI agent asks about it, and every policy travels with it." />
        <Reveal blur delay={0.1} className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-950 p-4">
            <div className="grid-lines absolute inset-0 opacity-30" />
            <EraFlow className="relative h-auto w-full" />
          </div>
        </Reveal>
      </div>

      <div className="relative mt-16" data-testid="data-eras-flow">
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-teal/60 via-slate-500/40 to-primary/70 lg:block" />
        <div className="absolute left-0 right-0 top-7 hidden h-px overflow-hidden lg:block">
          <span className="block h-px w-24 -translate-x-24 bg-white/80 blur-[1px]" style={{ animation: "marquee-dot 6s linear infinite" }} />
        </div>
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6" stagger={0.07}>
          {ERAS.map((e, i) => (
            <Item key={e.era}>
              <Link to={e.to} className="group block" data-testid={`era-${e.era.toLowerCase()}`}>
                <span className={`relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-ink-950 ${e.tone} transition-[border-color,transform] duration-300 group-hover:-translate-y-1 group-hover:border-white/30`}>
                  <e.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">0{i + 1} · {e.era}</p>
                <h3 className="mt-1.5 font-display text-lg font-medium leading-snug">{e.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{e.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">Learn more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </div>
    <style>{`@keyframes marquee-dot { 0% { transform: translateX(-6rem); } 100% { transform: translateX(100vw); } }`}</style>
  </Section>
);
