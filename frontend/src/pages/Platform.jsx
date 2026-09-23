import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { PLATFORM_SECTIONS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";

export default function Platform() {
  return (
    <div data-testid="platform-page">
      <PageHero
        eyebrow="Platform"
        crumbs={[{ label: "Platform" }]}
        title="One governed platform, deployed however your enterprise runs."
        description="SOLIXCloud, your cloud, on-premises or hybrid. Every deployment model runs the same Common Data Platform, the same policy engine and the same audit trail."
      >
        <Button asChild size="lg" data-testid="platform-hero-demo">
          <Link to="/products/enterprise-edition">Explore Enterprise Edition <ArrowRight /></Link>
        </Button>
      </PageHero>

      {PLATFORM_SECTIONS.map((s, i) => (
        <Section key={s.id} id={s.id} bordered className={i % 2 === 1 ? "bg-ink-900/40" : undefined}>
          <div className="container grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className={i % 2 === 1 ? "lg:col-span-7 lg:col-start-6 lg:order-2" : "lg:col-span-7"}>
              <SectionHeading eyebrow="Platform" title={s.title} description={s.desc} />
              <Stagger className="mt-8 grid gap-3 sm:grid-cols-2">
                {s.points.map((p) => (
                  <Item key={p} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-ink-950 text-teal"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-sm text-muted-foreground">{p}</span>
                  </Item>
                ))}
              </Stagger>
            </div>
            <Reveal className={i % 2 === 1 ? "lg:col-span-5 lg:col-start-1 lg:row-start-1" : "lg:col-span-5"}>
              <div className="relative rounded-3xl border border-white/10 bg-card p-8">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-ink-950 text-primary"><s.icon className="h-7 w-7" strokeWidth={1.25} /></span>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{s.highlight.eyebrow}</p>
                <p className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground">{s.highlight.value}</p>
                <p className="mt-3 text-sm text-muted-foreground">{s.highlight.caption}</p>
              </div>
            </Reveal>
          </div>
        </Section>
      ))}

      <CTABand eyebrow="Start your 30-day free trial" title="See Enterprise Edition on your own data." primary={{ label: "Try Solix", to: "/contact?type=demo" }} />
    </div>
  );
}
