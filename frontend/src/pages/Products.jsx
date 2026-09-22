import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { ProductCard } from "@/components/home/PlatformBento";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";

const LAYERS = [
  { label: "Activate", items: ["Enterprise AI", "Enterprise Edition builder workspace"], tone: "text-primary" },
  { label: "Comply", items: ["eDiscovery", "Consumer Data Privacy", "Retention & legal hold"], tone: "text-slate-200" },
  { label: "Optimize & Modernize", items: ["Enterprise Archiving", "Application Retirement", "Enterprise Data Lake"], tone: "text-slate-200" },
  { label: "Foundation", items: ["Common Data Platform · 150+ connectors · Preservation Zone · Catalog"], tone: "text-teal" },
];

export default function Products() {
  return (
    <div data-testid="products-page">
      <PageHero
        eyebrow="Products"
        crumbs={[{ label: "Products" }]}
        title="One platform. Every era of your data. Eight ways to put it to work."
        description="Solix products are not point tools bolted together. They are capabilities on a single governed foundation, so a record archived today is searchable by legal tomorrow and usable by an AI agent next quarter."
        image="/images/platform-cube.jpg"
      >
        <Button asChild size="lg" data-testid="products-hero-demo">
          <Link to="/contact">Request a demo <ArrowRight /></Link>
        </Button>
      </PageHero>

      <Section>
        <div className="container">
          <SectionHeading eyebrow="Architecture" title="Layered by design." description="Each layer inherits the governance of the one beneath it. Nothing leaves the trust perimeter." />
          <Stagger className="mt-14 space-y-3">
            {LAYERS.map((l, i) => (
              <Item key={l.label} className={`grid gap-4 rounded-2xl border border-white/10 bg-card px-6 py-5 sm:grid-cols-12 sm:items-center ${i === LAYERS.length - 1 ? "glow-teal" : ""}`}>
                <p className={`font-mono text-[11px] uppercase tracking-[0.2em] sm:col-span-3 ${l.tone}`}>{l.label}</p>
                <div className="flex flex-wrap gap-2 sm:col-span-9">
                  {l.items.map((it) => <span key={it} className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">{it}</span>)}
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40">
        <div className="container">
          <SectionHeading eyebrow="All products" title="Explore the portfolio." />
          <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <Item key={p.slug} className="flex"><ProductCard product={p} className="w-full" /></Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <CTABand />
    </div>
  );
}
