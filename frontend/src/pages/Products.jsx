import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { ProductCard } from "@/components/home/PlatformBento";
import { ArchitectureStack } from "@/components/products/ArchitectureStack";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";

export default function Products() {
  const tx = useTx();
  return (
    <div data-testid="products-page">
      <PageHero
        eyebrow="Products"
        crumbs={[{ label: "Products" }]}
        title="One platform. Every era of your data. Every way to put it to work."
        description="Solix products are not point tools bolted together. They are capabilities on a single governed foundation, so a record archived today is searchable by legal tomorrow and usable by an AI agent next quarter."
        image="/Website/images/prod-cdp.jpg"
      >
        <Button asChild size="lg" data-testid="products-hero-demo">
          <Link to="/contact">{tx("Request a demo")} <ArrowRight /></Link>
        </Button>
      </PageHero>

      <Section className="dark overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 grid-lines grid-fade" />
        <div className="container relative">
          <SectionHeading eyebrow="Architecture" title="Layered by design." description="Each layer inherits the governance of the one beneath it. Nothing leaves the trust perimeter." />
          <div className="mt-14"><ArchitectureStack /></div>
        </div>
      </Section>

      {["Platform", "Enterprise AI (EAI)", "Cloud Archive Products", "EAI Pharma", "Enterprise Foundation"].map((category, i) => (
        <Section key={category} bordered className={i % 2 === 0 ? "bg-muted" : undefined}>
          <div className="container">
            <SectionHeading eyebrow="Products" title={category} />
            {(() => {
              const items = PRODUCTS.filter((p) => p.category === category);
              // A single-product category gets one wide card with its render
              // rather than a lone tile beside two empty grid columns.
              return items.length === 1 ? (
                <Stagger className="mt-12">
                  <Item className="flex"><ProductCard product={items[0]} horizontal className="w-full" /></Item>
                </Stagger>
              ) : (
                <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <Item key={p.slug} className="flex"><ProductCard product={p} className="w-full" /></Item>
                  ))}
                </Stagger>
              );
            })()}
          </div>
        </Section>
      ))}

      <CTABand />
    </div>
  );
}
