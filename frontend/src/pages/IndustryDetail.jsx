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
import { useTranslation } from "react-i18next";
import { midSentence, useTx } from "@/i18n/tx";
import { IndustryPicture, hasIndustryPhoto } from "@/components/industries/IndustryPicture";
import { Sigil } from "@/components/materials/Sigil";
import { MetalIcon } from "@/components/materials/MetalIcon";
import { LiquidGlass } from "@/components/materials/LiquidGlass";
import { IndustrySignature } from "@/components/industries/IndustrySignature";
import { PlatformExplorer } from "@/components/platform/PlatformExplorer";
import { industryContext } from "@/data/industryContext";

export default function IndustryDetail() {
  const { slug } = useParams();
  const tx = useTx();
  const { i18n } = useTranslation();
  const ind = INDUSTRIES.find((i) => i.slug === slug);
  if (!ind) return <Navigate to="/404" replace />;
  // The products this industry's programs usually start with (industryContext), first three.
  const starters = industryContext(slug)?.products ?? ["enterprise-archiving", "application-retirement", "consumer-data-privacy"];
  const products = starters.map((s) => PRODUCTS.find((p) => p.slug === s)).filter(Boolean).slice(0, 3);
  const others = INDUSTRIES.filter((i) => i.slug !== slug).slice(0, 4);

  return (
    <div data-testid={`industry-detail-${slug}`}>
      <PageHero
        eyebrow={ind.name}
        crumbs={[{ label: "Industries", to: "/industries" }, { label: ind.name }]}
        title={ind.headline}
        description={ind.desc}
        image={hasIndustryPhoto(ind) ? ind.image : undefined}
        media={hasIndustryPhoto(ind) ? undefined : <Sigil icon={ind.icon} tone="blue" float className="aspect-[4/3] w-full rounded-3xl border border-line/15" />}
      >
        <Button asChild size="lg" data-testid="industry-demo-button">
          <Link to="/contact?type=demo">{tx("Talk to an industry expert")} <ArrowRight /></Link>
        </Button>
      </PageHero>

      <IndustrySignature industry={ind} />

      <Section>
        <div className="container">
          <SectionHeading eyebrow="From challenge to outcome" title={tx("How {{name}} leaders get there.", { name: midSentence(ind.name, i18n.language) })} />
          <div className="mt-12"><IndustryFlow industry={ind} /></div>
        </div>
      </Section>

      <PlatformExplorer
        industry={ind.slug}
        id="platform"
        eyebrow={tx("Platform")}
        title={tx("Where {{name}} programs run on the platform.", { name: midSentence(ind.name, i18n.language) })}
        description={tx("The lit layers are where programs in this industry usually start. Select any layer to see what runs on it.")}
      />

      <Section bordered className="bg-muted">
        <div className="container">
          <SectionHeading eyebrow="Recommended products" title={tx("What {{name}} leaders start with.", { name: midSentence(ind.name, i18n.language) })} />
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
                  <IndustryPicture industry={o} sizes="(min-width: 1024px) 33vw, 100vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <LiquidGlass lens className="relative flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-lg font-medium text-white"><MetalIcon icon={o.icon} tone="red" className="h-4 w-4" /> {o.name}</LiquidGlass>
                </Link>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <CTABand title={tx("Let's talk about {{name}} data.", { name: midSentence(ind.name, i18n.language) })} />
    </div>
  );
}
