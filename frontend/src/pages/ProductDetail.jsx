import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { PRODUCTS, SOLUTIONS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { ProductCard } from "@/components/home/PlatformBento";
import { OutcomeChart } from "@/components/shared/OutcomeChart";
import { Button } from "@/components/ui/button";

export default function ProductDetail() {
  const { slug } = useParams();
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return <Navigate to="/404" replace />;

  const related = PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3);
  const solutions = SOLUTIONS.filter((s) => s.products.includes(slug));
  const Icon = product.icon;

  return (
    <div data-testid={`product-detail-${slug}`}>
      <PageHero
        eyebrow={product.category}
        crumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
        title={product.tagline}
        description={product.description}
        image={product.image}
      >
        <div className="flex flex-col gap-3 lg:items-end">
          <Button asChild size="lg" data-testid="product-demo-button">
            <Link to={`/contact?interest=${product.slug}`}>Request a demo <ArrowRight /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" data-testid="product-whitepaper-button">
            <Link to="/resources?type=whitepaper">Download white paper</Link>
          </Button>
        </div>
      </PageHero>

      <Section>
        <div className="container grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Measured impact" title={`What changes with ${product.name}.`} description="Indexed comparison of typical customer programs before and after deployment. Your assessment produces your own numbers." />
            <Reveal delay={0.1} className="mt-8 grid grid-cols-3 gap-3">
              {product.outcomes.map((o) => (
                <div key={o.label} className="rounded-xl border border-white/10 bg-card p-4">
                  <p className={`font-display text-2xl font-medium tracking-tighter ${product.accent === "teal" ? "text-teal" : "text-primary"}`}>{o.value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{o.label}</p>
                </div>
              ))}
            </Reveal>
          </div>
          <Reveal delay={0.12} className="rounded-3xl border border-white/10 bg-card p-5 sm:p-8 lg:col-span-7">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Before = 100 · lower is better unless noted as coverage</p>
            <OutcomeChart data={product.chart} accent={product.accent === "teal" ? "#00D4FF" : "#ED2423"} />
          </Reveal>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40">
        <div className="container">
          <SectionHeading eyebrow="Capabilities" title={`What ${product.name} does for you.`} />
          <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {product.features.map((f) => (
              <Item key={f.title} className="rounded-2xl border border-white/10 bg-card p-6 card-hover">
                <span className={`grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-ink-950 ${product.accent === "teal" ? "text-teal" : "text-primary"}`}><Check className="h-4 w-4" /></span>
                <h3 className="mt-5 font-display text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered>
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="How it works" title="Three moves. One governed path." />
            <Reveal delay={0.1} className="mt-8 flex items-center gap-4">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-card ${product.accent === "teal" ? "text-teal" : "text-primary"}`}><Icon className="h-7 w-7" strokeWidth={1.25} /></span>
              <p className="text-sm text-muted-foreground">Runs on the Common Data Platform. Deploy in SOLIXCloud, your cloud, or on-premises.</p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 overflow-hidden rounded-2xl border border-white/10">
              <img src={product.image} alt="" className="aspect-[4/3] w-full object-cover" />
            </Reveal>
          </div>
          <Stagger className="grid gap-4 lg:col-span-8 sm:grid-cols-3">
            {product.steps.map((s, i) => (
              <Item key={s.title} className="relative rounded-2xl border border-white/10 bg-card p-6">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                {i < product.steps.length - 1 && <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/20 sm:block" />}
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
                <Link key={s.id} to={`/solutions#${s.id}`} className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-card px-5 py-3 text-sm transition-colors hover:border-primary/50" data-testid={`product-solution-${s.id}`}>
                  <s.icon className="h-4 w-4 text-teal" strokeWidth={1.5} /> {s.title}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section bordered className="bg-ink-900/40">
        <div className="container">
          <SectionHeading eyebrow="Related" title="Works better together." />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {related.map((p) => <Item key={p.slug} className="flex"><ProductCard product={p} className="w-full" /></Item>)}
          </Stagger>
        </div>
      </Section>

      <CTABand title={`See ${product.name} on your data.`} primary={{ label: "Request a demo", to: `/contact?interest=${product.slug}` }} />
    </div>
  );
}
