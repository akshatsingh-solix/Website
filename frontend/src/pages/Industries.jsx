import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { INDUSTRIES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { useTx } from "@/i18n/tx";

export default function Industries() {
  const tx = useTx();
  return (
    <div data-testid="industries-page">
      <PageHero
        eyebrow="Industries"
        crumbs={[{ label: "Industries" }]}
        title="Where retention is measured in decades and data in petabytes."
        description="Solix serves the industries with the strictest regulators, the oldest systems and the highest stakes for getting AI right."
        image="/Website/images/ind-financial-services.jpg"
      />
      <Section>
        <div className="container">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((ind) => (
              <Item key={ind.slug} className="flex">
                <Link
                  to={`/industries/${ind.slug}`}
                  data-testid={`industry-card-${ind.slug}`}
                  className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-card shadow-soft card-hover"
                >
                  <div className="dark relative h-48 overflow-hidden bg-background">
                    <img src={ind.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
                    <span className="absolute bottom-4 left-5 grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lift">
                      <ind.icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-medium tracking-tight text-foreground">{ind.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.desc}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink">
                      {tx("Explore")} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
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
