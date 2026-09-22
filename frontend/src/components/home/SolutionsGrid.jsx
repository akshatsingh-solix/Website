import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOLUTIONS, PRODUCTS } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";

export const SolutionCard = ({ s, detailed = false }) => {
  const Icon = s.icon;
  const related = PRODUCTS.filter((p) => s.products.includes(p.slug));
  return (
    <div id={detailed ? s.id : undefined} className={cn("group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card p-7 card-hover", detailed && "scroll-mt-28")} data-testid={`solution-card-${s.id}`}>
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/0 blur-3xl transition-colors duration-500 group-hover:bg-teal/10" />
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-ink-950 text-teal">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{s.metric}</span>
      </div>
      <h3 className="mt-6 font-display text-2xl font-medium tracking-tight">{s.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {related.map((p) => (
          <Link key={p.slug} to={`/products/${p.slug}`} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/40 hover:text-foreground">
            {p.name}
          </Link>
        ))}
      </div>
      {!detailed && (
        <Link to={`/solutions#${s.id}`} className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm text-slate-300 transition-colors group-hover:text-primary">
          Explore solution <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
};

export const SolutionsGrid = () => (
  <Section bordered className="bg-ink-900/40">
    <div className="container">
      <SectionHeading
        eyebrow="Solutions"
        title="Start with the outcome. We'll bring the platform."
        description="Six programs, each with a measurable target and a proven path. Mix and match: they share one foundation."
      />
      <Stagger className="mt-14 grid gap-4 lg:grid-cols-12">
        {SOLUTIONS.map((s) => (
          <Item key={s.id} className={cn("flex", s.span)}>
            <SolutionCard s={s} />
          </Item>
        ))}
      </Stagger>
    </div>
  </Section>
);
