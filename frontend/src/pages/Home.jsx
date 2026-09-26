import { Hero } from "@/components/home/Hero";
import { ProofFrame } from "@/components/home/ProofFrame";
import { PlatformFrame } from "@/components/home/PlatformFrame";
import { OfferingsFrame } from "@/components/home/OfferingsFrame";
import { AISection } from "@/components/home/AISection";
import { IndustriesStrip } from "@/components/home/IndustriesStrip";
import { InsightsPreview } from "@/components/home/InsightsPreview";
import { CTABand } from "@/components/shared/CTABand";
import { ChapterRail } from "@/components/home/ChapterRail";

/**
 * The homepage is a storyboard of a few dense frames rather than a long
 * stack of blocks. Each frame answers the question the previous one raises:
 *
 *   Hero  - pinned, three beats over the rendered governed core: data
 *           streams in, one governed core, activated (the Solix bolt).
 *           The light page then rises over it as a sheet.
 *   01 The case      - cost chart, scale counters, facts, sectors (one bento)
 *   02 The platform  - six eras of a record's life on the platform layer
 *                      stack, pinned (navy moment)
 *   03 What you get  - outcomes or products, one toggle
 *   04 Enterprise AI - the governed console, shown working (navy moment)
 *   05 Industries    - each industry with its results and customer voice
 *   06 Insights      - go deeper
 *   CTA + footer     - act (navy close)
 */
export default function Home() {
  return (
    <div data-testid="home-page">
      <Hero />
      <div className="relative z-10 -mt-[14vh] rounded-t-[2.5rem] bg-background shadow-[0_-40px_80px_-40px_rgba(0,0,0,0.55)] sm:rounded-t-[3.5rem]">
        <ChapterRail />
        <ProofFrame />
        <PlatformFrame />
        <OfferingsFrame />
        <AISection />
        <IndustriesStrip />
        <InsightsPreview />
        <CTABand />
      </div>
    </div>
  );
}
