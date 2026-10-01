import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS, INDUSTRIES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { SolutionCard } from "@/components/home/SolutionsGrid";
import { ApproachTimeline } from "@/components/shared/ApproachTimeline";
import { CTABand } from "@/components/shared/CTABand";
import { useTx } from "@/i18n/tx";
import { PlatformExplorer } from "@/components/platform/PlatformExplorer";
import { IndustryPicture } from "@/components/industries/IndustryPicture";
import { GlyphTile } from "@/components/materials/MetalIcon";

export default function Solutions() {
  const tx = useTx();
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
        <Section key={group} bordered={i > 0} className={i % 2 === 1 ? "bg-muted" : undefined}>
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

      {/* Every program on the four layers, in 3D: choose one to light the layers it runs on. */}
      <PlatformExplorer
        lenses="solutions"
        id="programs-on-the-platform"
        eyebrow="On the platform"
        title="Fifteen programs. The same four layers."
        description="Every program inherits the governance of the layers beneath it. Choose a program to light the layers it runs on and the products that deliver it."
      />

      <Section>
        <div className="container">
          <SectionHeading eyebrow="Solutions" title="By Industry" description="Regulated, data-intensive industries trust Solix at petabyte scale." />
          <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind) => (
              <Item key={ind.slug}>
                <Link to={`/industries/${ind.slug}`} className="spot relative group flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-card card-hover" data-testid={`solutions-industry-${ind.slug}`}>
                  <div className="dark relative h-32 shrink-0 overflow-hidden bg-background">
                    <IndustryPicture industry={ind} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                    <GlyphTile icon={ind.icon} tone="red" className="absolute bottom-3 left-4" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-medium">{ind.name}</h3>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm text-muted-foreground transition-colors group-hover:text-primary-ink">
                      {tx("Explore")} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-muted">
        <div className="container">
          <SectionHeading eyebrow="Our approach" title="Assess. Prove. Scale." description="A repeatable method refined over hundreds of enterprise programs, with a defined output at every step." />
          <div className="mt-14"><ApproachTimeline /></div>
        </div>
      </Section>

      <CTABand title="Which number matters most to you this year?" />
    </div>
  );
}
