import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { INDUSTRIES, PRODUCTS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { ProductCard } from "@/components/home/PlatformBento";
import { Button } from "@/components/ui/button";

export default function IndustryDetail() {
  const { slug } = useParams();
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  if (!ind) return <Navigate to="/404" replace />;
  const products = PRODUCTS.filter((p) => ["enterprise-archiving", "application-retirement", "consumer-data-privacy"].includes(p.slug));

  return (
    <div data-testid={`industry-detail-${slug}`}>
      <PageHero
        eyebrow={ind.name}
        crumbs={[{ label: "Industries", to: "/industries" }, { label: ind.name }]}
        title={ind.headline}
        description={ind.desc}
        image="/images/hero-architecture.jpg"
      >
        <Button asChild size="lg" data-testid="industry-demo-button">
          <Link to="/contact">Talk to an industry expert <ArrowRight /></Link>
        </Button>
      </PageHero>

      <Section>
        <div className="container grid gap-6 lg:grid-cols-2">
          <Reveal className="rounded-2xl border border-white/10 bg-card p-8">
            <p className="eyebrow mb-6 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Challenges</p>
            <ul className="space-y-5">
              {ind.challenges.map((c) => (
                <li key={c} className="flex gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  <p className="text-slate-200">{c}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="rounded-2xl border border-teal/20 bg-card p-8 glow-teal">
            <p className="eyebrow mb-6 flex items-center gap-2 text-teal"><CheckCircle2 className="h-4 w-4" /> Results with Solix</p>
            <ul className="space-y-5">
              {ind.results.map((c) => (
                <li key={c} className="flex gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                  <p className="text-slate-200">{c}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40">
        <div className="container">
          <SectionHeading eyebrow="Recommended products" title={`What ${ind.name.toLowerCase()} leaders start with.`} />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {products.map((p) => <Item key={p.slug} className="flex"><ProductCard product={p} className="w-full" /></Item>)}
          </Stagger>
        </div>
      </Section>

      <CTABand title={`Let's talk about ${ind.name.toLowerCase()} data.`} />
    </div>
  );
}
