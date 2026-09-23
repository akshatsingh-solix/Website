import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { INDUSTRIES, PRODUCTS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { IndustryFlow } from "@/components/shared/IndustryFlow";
import { CTABand } from "@/components/shared/CTABand";
import { ProductCard } from "@/components/home/PlatformBento";
import { Button } from "@/components/ui/button";

export default function IndustryDetail() {
  const { slug } = useParams();
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  if (!ind) return <Navigate to="/404" replace />;
  const products = PRODUCTS.filter((p) => ["enterprise-archiving", "application-retirement", "consumer-data-privacy"].includes(p.slug));
  const others = INDUSTRIES.filter((i) => i.slug !== slug).slice(0, 4);

  return (
    <div data-testid={`industry-detail-${slug}`}>
      <PageHero
        eyebrow={ind.name}
        crumbs={[{ label: "Industries", to: "/industries" }, { label: ind.name }]}
        title={ind.headline}
        description={ind.desc}
        image={ind.image}
      >
        <Button asChild size="lg" data-testid="industry-demo-button">
          <Link to="/contact">Talk to an industry expert <ArrowRight /></Link>
        </Button>
      </PageHero>

      <Section>
        <div className="container">
          <SectionHeading eyebrow="From challenge to outcome" title={`How ${ind.name.toLowerCase()} leaders get there.`} />
          <div className="mt-12"><IndustryFlow industry={ind} /></div>
        </div>
      </Section>

      <Section bordered className="bg-muted">
        <div className="container">
          <SectionHeading eyebrow="Recommended products" title={`What ${ind.name.toLowerCase()} leaders start with.`} />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {products.map((p) => <Item key={p.slug} className="flex"><ProductCard product={p} className="w-full" /></Item>)}
          </Stagger>
        </div>
      </Section>

      <Section bordered>
        <div className="container">
          <SectionHeading eyebrow="Other industries" title="Same platform, different regulators." />
          <Stagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <Item key={o.slug} className="flex">
                <Link to={`/industries/${o.slug}`} className="dark group relative flex aspect-[4/3] w-full items-end overflow-hidden rounded-2xl border border-line/10 bg-background p-5 text-foreground shadow-soft" data-testid={`industry-related-${o.slug}`}>
                  <img src={o.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <span className="relative flex items-center gap-2 font-display text-lg font-medium"><o.icon className="h-4 w-4 text-primary-ink" strokeWidth={1.5} /> {o.name}</span>
                </Link>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <CTABand title={`Let's talk about ${ind.name.toLowerCase()} data.`} />
    </div>
  );
}
