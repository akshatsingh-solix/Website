import { Hero } from "@/components/home/Hero";
import { LogoMarquee } from "@/components/home/LogoMarquee";
import { StatsBand } from "@/components/home/StatsBand";
import { GrowthChart } from "@/components/home/GrowthChart";
import { DataEras } from "@/components/home/DataEras";
import { PlatformStory } from "@/components/home/PlatformStory";
import { PlatformBento } from "@/components/home/PlatformBento";
import { SolutionsGrid } from "@/components/home/SolutionsGrid";
import { AISection } from "@/components/home/AISection";
import { IndustriesStrip } from "@/components/home/IndustriesStrip";
import { Testimonials } from "@/components/home/Testimonials";
import { InsightsPreview } from "@/components/home/InsightsPreview";
import { CTABand } from "@/components/shared/CTABand";

/**
 * The homepage is a storyboard, not a stack of blocks. Each numbered
 * chapter answers the question the previous one raises:
 *
 *   Hero       - the promise: AI on all your enterprise data
 *   Proof      - who we serve and at what scale
 *   01 Challenge   - data compounds faster than budgets
 *   02 Lifecycle   - every record, every era, one path
 *   03 Platform    - how: connect, govern, activate   (navy moment)
 *   04 Products    - what you buy
 *   05 Outcomes    - what you get
 *   06 Enterprise AI - the payoff, governed           (navy moment)
 *   07 Industries  - it fits your world
 *   08 Proof       - customers say so
 *   09 Insights    - go deeper
 *   CTA + footer   - act                              (navy close)
 */
export default function Home() {
  return (
    <div data-testid="home-page">
      <Hero />
      <LogoMarquee />
      <StatsBand />
      <GrowthChart />
      <DataEras />
      <PlatformStory />
      <PlatformBento />
      <SolutionsGrid />
      <AISection />
      <IndustriesStrip />
      <Testimonials />
      <InsightsPreview />
      <CTABand />
    </div>
  );
}
