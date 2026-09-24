import { Suspense } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { PRODUCTS, SOLUTIONS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { ProductCard } from "@/components/home/PlatformBento";
import { OutcomeChart } from "@/components/shared/OutcomeChart";
import { Button } from "@/components/ui/button";
import { InlineLeadSection } from "@/components/forms/InlineLeadSection";
import { explorerFor } from "@/components/explorers";
import { ExplorerMediaContext } from "@/components/explorers/kit";
import { FamilyVisual } from "@/components/media/FamilyVisual";
import { FamilyTour } from "@/components/media/FamilyTour";
import { familyOf } from "@/data/families";
import { useTx } from "@/i18n/tx";

const StepLabel = ({ n, label, className, id }) => (
    <p id={id} className={`mb-4 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] ${className || ""}`}>
      {n && <span className="text-primary-ink">{n}</span>}
      {n && <span className="h-px w-8 bg-gradient-to-r from-primary/70 to-teal/60" />}
      <span className="text-muted-foreground">{label}</span>
    </p>
);

export default function ProductDetail() {
  const { slug } = useParams();
  const tx = useTx();
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return <Navigate to="/404" replace />;

  const related = PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3);
  const solutions = SOLUTIONS.filter((s) => s.products.includes(slug));
  const Icon = product.icon;
  const Explorer = explorerFor(slug);
  const family = familyOf(slug);

  return (
    <div data-testid={`product-detail-${slug}`}>
      <PageHero
        eyebrow={tx(product.category)}
        crumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
        title={product.tagline}
        description={product.description}
        image={product.image}
        media={family && <FamilyVisual key={family.id} family={family} />}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" data-testid="product-demo-button">
            <a href="#talk-to-us" onClick={(e) => { e.preventDefault(); document.getElementById("talk-to-us")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{tx("Request a demo")} <ArrowRight /></a>
          </Button>
          <Button asChild size="lg" variant="outline" data-testid="product-whitepaper-button">
            <Link to="/resources?type=whitepaper">{tx("Download white paper")}</Link>
          </Button>
        </div>
      </PageHero>

      {Explorer && (
        <Section className="bg-muted" id="explore">
          <div className="container">
            <SectionHeading eyebrow="Try it yourself" title={tx("Explore {{name}} hands-on.", { name: product.name })} description="No sign-up. Take the one-minute visual tour, then change the inputs and watch the result update." />
            {family && (
              <>
                <StepLabel n="01" label={tx("Take the visual tour")} className="mt-10" />
                <FamilyTour key={family.id} family={family} product={product} />
              </>
            )}
            <StepLabel n={family ? "02" : null} label={tx("Now try it hands-on")} className={family ? "mt-14 scroll-mt-28" : "mt-10"} id="try" />
            <ExplorerMediaContext.Provider value={family?.id || null}>
              <Suspense fallback={<div className="h-[420px] animate-pulse rounded-3xl border border-line/10 bg-card" />}>
                <Explorer key={slug} product={product} />
              </Suspense>
            </ExplorerMediaContext.Provider>
          </div>
        </Section>
      )}

      <Section>
        <div className="container grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Measured impact" title={tx("What changes with {{name}}.", { name: product.name })} description="Indexed comparison of typical customer programs before and after deployment. Your assessment produces your own numbers." />
            <Reveal delay={0.1} className="mt-8 grid grid-cols-3 gap-3">
              {product.outcomes.map((o) => (
                <div key={o.label} className="rounded-xl border border-line/10 bg-card p-4">
                  <p className={`font-display text-2xl font-medium tracking-tighter ${product.accent === "teal" ? "text-teal" : "text-primary-ink"}`}>{o.value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{o.label}</p>
                </div>
              ))}
            </Reveal>
          </div>
          <Reveal delay={0.12} className="rounded-3xl border border-line/10 bg-card p-5 sm:p-8 lg:col-span-7">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Before = 100 · lower is better unless noted as coverage")}</p>
            <OutcomeChart data={product.chart} accent={product.accent === "teal" ? "#0088CF" : "#EE2424"} />
          </Reveal>
        </div>
      </Section>

      <Section bordered className="bg-muted">
        <div className="container">
          <SectionHeading eyebrow="Capabilities" title={tx("What {{name}} does for you.", { name: product.name })} />
          <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {product.features.map((f) => (
              <Item key={f.title} className="rounded-2xl border border-line/10 bg-card p-6 card-hover">
                <span className={`grid h-9 w-9 place-items-center rounded-lg border border-line/10 bg-accent/50 ${product.accent === "teal" ? "text-teal" : "text-primary-ink"}`}><Check className="h-4 w-4" /></span>
                <h3 className="mt-5 font-display text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered>
        <div className="container grid items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="How it works" title="Three moves. One governed path." />
            <Reveal delay={0.1} className="mt-8 flex items-center gap-4">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl border border-line/10 bg-card ${product.accent === "teal" ? "text-teal" : "text-primary-ink"}`}><Icon className="h-7 w-7" strokeWidth={1.25} /></span>
              <p className="text-sm text-muted-foreground">{tx("Runs on the Common Data Platform. Deploy in SOLIXCloud, your cloud, or on-premises.")}</p>
            </Reveal>
          </div>
          <Stagger className="grid gap-4 lg:col-span-8 sm:grid-cols-3">
            {product.steps.map((s, i) => (
              <Item key={s.title} className="relative rounded-2xl border border-line/10 bg-card p-6">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                {i < product.steps.length - 1 && <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-line/20 sm:block" />}
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      {solutions.length > 0 && (
        <Section bordered>
          <div className="container">
            <SectionHeading eyebrow="Solutions" title="Programs built on this product." />
            <div className="mt-10 flex flex-wrap gap-3">
              {solutions.map((s) => (
                <Link key={s.id} to={`/solutions#${s.id}`} className="group inline-flex items-center gap-3 rounded-full border border-line/10 bg-card px-5 py-3 text-sm transition-colors hover:border-primary/50" data-testid={`product-solution-${s.id}`}>
                  <s.icon className="h-4 w-4 text-teal" strokeWidth={1.5} /> {s.title}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section bordered className="bg-muted">
        <div className="container">
          <SectionHeading eyebrow="Related" title="Works better together." />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {related.map((p) => <Item key={p.slug} className="flex"><ProductCard product={p} className="w-full" /></Item>)}
          </Stagger>
        </div>
      </Section>

      <InlineLeadSection
        key={product.slug}
        interest={product.slug}
        title={tx("See {{name}} on your data.", { name: product.name })}
        description={tx("Tell us about the systems and outcomes you care about, and a {{name}} specialist will set up a working session.", { name: product.name })}
      />
    </div>
  );
}
