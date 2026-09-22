import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { INDUSTRIES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";

export default function Industries() {
  return (
    <div data-testid="industries-page">
      <PageHero
        eyebrow="Industries"
        crumbs={[{ label: "Industries" }]}
        title="Where retention is measured in decades and data in petabytes."
        description="Solix serves the industries with the strictest regulators, the oldest systems and the highest stakes for getting AI right."
      />
      <Section>
        <div className="container">
          <Stagger className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind) => (
              <Item key={ind.slug} className="flex">
                <Link
                  to={`/industries/${ind.slug}`}
                  data-testid={`industry-card-${ind.slug}`}
                  className="group relative flex min-h-[280px] w-full flex-col bg-ink-950 p-7 transition-colors duration-300 hover:bg-card"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-card text-primary transition-colors group-hover:border-primary/50">
                    <ind.icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-6 font-display text-2xl font-medium tracking-tight">{ind.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground opacity-80 transition-opacity group-hover:opacity-100">{ind.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm text-slate-300 transition-colors group-hover:text-primary">
                    Explore <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>
      <CTABand title="Talk to someone who has done this in your industry." />
    </div>
  );
}
