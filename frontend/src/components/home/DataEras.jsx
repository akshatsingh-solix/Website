import { Link } from "react-router-dom";
import { Activity, Archive, ArrowRight, Database, PowerOff, Sparkles, Vault } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";

const ERAS = [
  { icon: Database, era: "Active", title: "Live systems", desc: "ERP, CRM, SaaS and files in daily use.", to: "/products/common-data-platform", tone: "text-teal" },
  { icon: Activity, era: "Inactive", title: "Closed history", desc: "Closed years, completed orders, dormant records.", to: "/products/enterprise-archiving", tone: "text-teal" },
  { icon: Archive, era: "Archived", title: "Tiered & searchable", desc: "Moved out of production, one click away.", to: "/products/enterprise-archiving", tone: "text-foreground" },
  { icon: PowerOff, era: "Retired", title: "Application switched off", desc: "Licenses cancelled, data and context preserved.", to: "/products/application-retirement", tone: "text-foreground" },
  { icon: Vault, era: "Preserved", title: "Governed for decades", desc: "Retention, legal hold, defensible deletion.", to: "/solutions#data-preservation", tone: "text-primary-ink" },
  { icon: Sparkles, era: "Activated", title: "Fuel for AI", desc: "Every era becomes governed input for agents and analytics.", to: "/products/enterprise-ai", tone: "text-primary-ink" },
];

export const DataEras = () => (
  <Section className="overflow-hidden bg-muted" id="the-lifecycle">
    <div className="container">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <SectionHeading chapter="02" eyebrow="The lifecycle" title="One lifecycle. One platform. No dead ends." description="Most vendors serve one moment in a record's life. Solix follows the record from the day it is created to the day an AI agent asks about it, and every policy travels with it." />
          <Reveal delay={0.1} className="mt-8 grid grid-cols-3 divide-x divide-line/10 rounded-2xl border border-line/10 bg-background shadow-soft">
            {[["6", "data eras"], ["1", "policy layer"], ["0", "dead ends"]].map(([v, l]) => (
              <div key={l} className="px-4 py-4 sm:px-5">
                <p className="font-display text-3xl font-semibold tracking-tight text-foreground">{v}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{l}</p>
              </div>
            ))}
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-7">
          <figure className="dark relative overflow-hidden rounded-3xl border border-line/10 bg-background shadow-[0_40px_90px_-45px_rgba(13,25,45,0.55)]">
            <img src="/Website/images/data-eras-ribbon.jpg" alt="Data moving from tape archives through servers into an AI core" className="aspect-[16/9] w-full object-cover" loading="lazy" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-background/90 to-transparent px-5 pb-4 pt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/85 sm:px-6">
              <span>Tape</span><span className="h-px flex-1 bg-gradient-to-r from-teal/70 to-transparent" />
              <span>Servers</span><span className="h-px flex-1 bg-gradient-to-r from-teal/70 to-primary/70" />
              <span>Cloud</span><span className="h-px flex-1 bg-gradient-to-r from-primary/70 to-primary" />
              <span className="text-primary-ink">AI</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>

      <div className="relative mt-14 lg:mt-16" data-testid="data-eras-flow">
        <div className="absolute left-7 right-7 top-7 hidden h-px bg-gradient-to-r from-teal via-line/20 to-primary lg:block" />
        {/* A pulse of data travelling the lifecycle, left to right. */}
        <div className="pointer-events-none absolute left-7 right-7 top-[27px] hidden h-[3px] overflow-hidden lg:block" aria-hidden="true">
          <span className="block h-full w-full animate-[era-pulse_5s_linear_infinite] bg-[linear-gradient(90deg,transparent_calc(100%-80px),#0088CF_calc(100%-20px),#EE2424)]" />
        </div>
        <Stagger className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5" stagger={0.07}>
          {ERAS.map((e, i) => (
            <Item key={e.era} className="flex">
              <Link to={e.to} className="group flex w-full flex-col rounded-2xl p-1 lg:p-0" data-testid={`era-${e.era.toLowerCase()}`}>
                <span className={`relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-line/10 bg-background shadow-soft ${e.tone} transition-[border-color,transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-lift`}>
                  <e.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">0{i + 1} · {e.era}</p>
                <h3 className="mt-1.5 font-display text-lg font-medium leading-snug text-foreground">{e.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary-ink">Learn more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </div>
  </Section>
);
