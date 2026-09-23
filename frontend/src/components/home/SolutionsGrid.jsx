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
    <div id={detailed ? s.id : undefined} className={cn("group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-card p-6 shadow-soft card-hover sm:p-7", detailed && "scroll-mt-28")} data-testid={`solution-card-${s.id}`}>
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.14),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal transition-colors duration-300 group-hover:bg-teal group-hover:text-white">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <span className="relative rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-ink">{s.metric}</span>
      </div>
      <h3 className="relative mt-6 font-display text-2xl font-medium tracking-tight text-foreground">{s.title}</h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
      <div className="relative mt-6 flex flex-wrap gap-2">
        {related.map((p) => (
          <Link key={p.slug} to={`/products/${p.slug}`} className="rounded-full border border-line/10 bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal">
            {p.name}
          </Link>
        ))}
      </div>
      {!detailed && (
        <Link to={`/solutions#${s.id}`} className="relative mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink">
          Explore solution <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
};

export const SolutionsGrid = () => (
  <Section className="bg-muted" id="the-outcomes">
    <div className="container">
      <SectionHeading
        chapter="05"
        eyebrow="The outcomes"
        title="Start with the outcome. We'll bring the platform."
        description="Six programs, each with a measurable target and a proven path. Mix and match: they share one foundation."
      />
      <Stagger className="mt-12 grid gap-4 lg:grid-cols-12">
        {SOLUTIONS.slice(0, 6).map((s) => (
          <Item key={s.id} className={cn("flex", s.span)}>
            <SolutionCard s={s} />
          </Item>
        ))}
      </Stagger>
    </div>
  </Section>
);
