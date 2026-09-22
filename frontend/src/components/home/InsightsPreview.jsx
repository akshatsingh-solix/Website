import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESOURCES, RESOURCE_TYPES } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";

export const typeLabel = (key) => RESOURCE_TYPES.find((t) => t.key === key)?.label.replace(/s$/, "") ?? key;

export const ResourceCard = ({ r, onOpen, className }) => {
  const Icon = r.icon;
  return (
    <button
      onClick={() => onOpen?.(r)}
      data-testid={`resource-card-${r.id}`}
      className={cn("group flex h-full w-full flex-col rounded-2xl border border-white/10 bg-card p-6 text-left card-hover", className)}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {typeLabel(r.type)}
        </span>
        {r.gated && <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <h3 className="mt-5 font-display text-xl font-medium leading-snug tracking-tight text-foreground">{r.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
      <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {r.readTime} · {r.date}</span>
        <span className="inline-flex items-center gap-1 text-slate-300 transition-colors group-hover:text-primary">
          {r.gated ? "Get access" : "Read"} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
};

export const InsightsPreview = ({ onOpen }) => (
  <Section bordered>
    <div className="container">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow="Insights" title="Field notes from two decades of enterprise data." />
        <Link to="/resources" className="link-underline shrink-0 text-sm text-slate-300 hover:text-foreground" data-testid="insights-view-all">
          Browse all resources →
        </Link>
      </div>
      <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {RESOURCES.slice(0, 4).map((r) => (
          <Item key={r.id} className="flex">
            <ResourceCard r={r} onOpen={onOpen} />
          </Item>
        ))}
      </Stagger>
    </div>
  </Section>
);
