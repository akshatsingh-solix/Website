import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS, INDUSTRIES } from "@/data/site";
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
        image="/Website/images/data-eras-ribbon.jpg"
      />

      {["AI Solutions", "Preservation & Archive"].map((group, i) => (
        <Section key={group} bordered={i > 0} className={i % 2 === 1 ? "bg-ink-900/40" : undefined}>
          <div className="container">
            <SectionHeading eyebrow="Solutions" title={group} />
            <Stagger className="mt-14 grid gap-4 lg:grid-cols-12">
              {SOLUTIONS.filter((s) => s.group === group).map((s) => (
                <Item key={s.id} className={`flex ${s.span}`}><SolutionCard s={s} detailed /></Item>
              ))}
            </Stagger>
          </div>
        </Section>
      ))}

      <Section bordered>
        <div className="container">
          <SectionHeading eyebrow="Solutions" title="By Industry" description="Regulated, data-intensive industries trust Solix at petabyte scale." />
          <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind) => (
              <Item key={ind.slug}>
                <Link to={`/industries/${ind.slug}`} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-card p-6 card-hover" data-testid={`solutions-industry-${ind.slug}`}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-ink-950 text-teal"><ind.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                  <h3 className="mt-5 font-display text-lg font-medium">{ind.name}</h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm text-slate-300 transition-colors group-hover:text-primary">
                    Explore <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Item>
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
