import { SOLUTIONS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { SolutionCard } from "@/components/home/SolutionsGrid";
import { CTABand } from "@/components/shared/CTABand";

const APPROACH = [
  { n: "01", title: "Assess", desc: "Two-week data estate assessment: growth, cost, retention obligations and AI readiness, with a quantified business case." },
  { n: "02", title: "Prove", desc: "A scoped pilot on one system or dataset with agreed success metrics, typically live in under 60 days." },
  { n: "03", title: "Scale", desc: "Factory model with templates, automation and a run team, expanding across the portfolio on your cadence." },
];

export default function Solutions() {
  return (
    <div data-testid="solutions-page">
      <PageHero
        eyebrow="Solutions"
        crumbs={[{ label: "Solutions" }]}
        title="Outcome-led programs, not licenses on a shelf."
        description="Every engagement starts with a number: dollars reclaimed, systems retired, requests automated, use cases shipped. Then we bring the platform to hit it."
        image="/images/company-office.jpg"
      />

      <Section>
        <div className="container">
          <Stagger className="grid gap-4 lg:grid-cols-12">
            {SOLUTIONS.map((s) => (
              <Item key={s.id} className={`flex ${s.span}`}><SolutionCard s={s} detailed /></Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Our approach" title="Assess. Prove. Scale." description="A repeatable method refined over hundreds of enterprise programs." />
          </div>
          <Stagger className="grid gap-4 lg:col-span-8">
            {APPROACH.map((a) => (
              <Item key={a.n} className="grid gap-4 rounded-2xl border border-white/10 bg-card p-6 sm:grid-cols-12 sm:items-start">
                <span className="font-mono text-sm text-primary sm:col-span-2">{a.n}</span>
                <h3 className="font-display text-2xl font-medium sm:col-span-3">{a.title}</h3>
                <p className="text-sm text-muted-foreground sm:col-span-7">{a.desc}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <CTABand title="Which number matters most to you this year?" />
    </div>
  );
}
