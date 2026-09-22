import { Hero } from "@/components/home/Hero";
import { LogoMarquee } from "@/components/home/LogoMarquee";
import { StatsBand } from "@/components/home/StatsBand";
import { DataEras } from "@/components/home/DataEras";
import { PlatformBento } from "@/components/home/PlatformBento";
import { GrowthChart } from "@/components/home/GrowthChart";
import { SolutionsGrid } from "@/components/home/SolutionsGrid";
import { AISection } from "@/components/home/AISection";
import { IndustriesStrip } from "@/components/home/IndustriesStrip";
import { Testimonials } from "@/components/home/Testimonials";
import { InsightsPreview } from "@/components/home/InsightsPreview";
import { CTABand } from "@/components/shared/CTABand";

export default function Home() {
  return (
    <div data-testid="home-page">
      <Hero />
      <LogoMarquee />
      <StatsBand />
      <DataEras />
      <PlatformBento />
      <GrowthChart />
      <SolutionsGrid />
      <AISection />
      <IndustriesStrip />
      <Testimonials />
      <InsightsPreview />
      <CTABand />
    </div>
  );
}
