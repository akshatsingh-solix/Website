import { SOLUTIONS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { SolutionCard } from "@/components/home/SolutionsGrid";
import { ApproachTimeline } from "@/components/shared/ApproachTimeline";
import { CTABand } from "@/components/shared/CTABand";

export default function Solutions() {
  return (
    <div data-testid="solutions-page">
      <PageHero
        eyebrow="Solutions"
        crumbs={[{ label: "Solutions" }]}
        title="Outcome-led programs, not licenses on a shelf."
        description="Every engagement starts with a number: dollars reclaimed, systems retired, requests automated, use cases shipped. Then we bring the platform to hit it."
        image="/images/data-eras-ribbon.jpg"
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
        <div className="container">
          <SectionHeading eyebrow="Our approach" title="Assess. Prove. Scale." description="A repeatable method refined over hundreds of enterprise programs, with a defined output at every step." />
          <div className="mt-14"><ApproachTimeline /></div>
        </div>
      </Section>

      <CTABand title="Which number matters most to you this year?" />
    </div>
  );
}
