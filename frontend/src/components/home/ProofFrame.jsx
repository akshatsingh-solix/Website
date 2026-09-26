import { motion } from "framer-motion";
import { Briefcase, CalendarClock, Cloud, Factory, FlaskConical, HardDrive, HeartPulse, Landmark, PlugZap, RadioTower, ShoppingBag, TrendingDown, Umbrella, Zap } from "lucide-react";
import { LOGOS, STATS } from "@/data/site";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { Odometer } from "@/components/motion/Odometer";
import { VelocityMarquee } from "@/components/motion/VelocityMarquee";
import { GrowthChartCard, FACTS } from "./GrowthChart";

// One icon per STATS entry, in order: connectors, cost, years, petabytes.
const STAT_ICONS = [PlugZap, TrendingDown, CalendarClock, HardDrive];
// LOGOS are illustrative example-industry names, not real customers; each
// gets a generic category icon, never a brand mark.
const SECTOR_ICONS = [Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase];

/**
 * Chapter 01 in a single frame: the problem and the proof side by side.
 * The scroll-drawn cost chart holds the left of a bento grid; the scale
 * counters and the three facts that explain the chart sit beside it; the
 * sectors Solix serves drift along the bottom edge of the same frame.
 */
export const ProofFrame = () => {
  const tx = useTx();
  const facts = useLocalized(FACTS);
  return (
    <Section className="bg-background pb-12 sm:pb-16 lg:pb-20" id="the-challenge">
      <div className="container">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <SectionHeading className="lg:col-span-7" chapter="01" eyebrow="The case" title="Data compounds. Your budget shouldn't." />
          <Reveal delay={0.1} className="lg:col-span-5">
            <p className="text-base leading-relaxed text-muted-foreground lg:text-[1.05rem]">
              {tx("Every year the estate grows and the inactive share grows faster. Archive-first programs on the Common Data Platform decouple infrastructure cost from data growth.")}
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-12" data-testid="proof-frame">
          {/* The chart, with the three facts that explain it along its foot. */}
          <Reveal delay={0.1} className="lg:col-span-7">
            <GrowthChartCard className="h-full">
              <div className="mt-6 grid divide-y divide-line/10 rounded-2xl border border-line/10 bg-muted/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {facts.map((f, i) => (
                  <div key={f.label} className="p-3.5 sm:p-4">
                    <span className="flex items-center gap-2">
                      <span className={cn("block h-1 w-5 rounded-full", i === 2 ? "bg-primary" : "bg-teal")} />
                      <span className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{f.value}</span>
                    </span>
                    <span className="mt-1.5 block text-xs leading-snug text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </GrowthChartCard>
          </Reveal>

          {/* Scale counters. */}
          <Stagger className="grid grid-cols-2 gap-4 lg:col-span-5 lg:grid-rows-2" data-testid="stats-band">
            {STATS.map((s, i) => {
              const Icon = STAT_ICONS[i % STAT_ICONS.length];
              const blue = i % 2 === 1;
              return (
                <Item key={s.label} className="flex">
                  <div className="spot surface-elevated group relative flex w-full flex-col overflow-hidden p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                      <Icon className={cn("h-5 w-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110", blue ? "text-teal" : "text-primary-ink")} strokeWidth={1.5} />
                    </div>
                    <p className="mt-auto pt-6 font-display text-[clamp(2.4rem,1.6rem+2.4vw,4rem)] font-medium leading-none tracking-[-0.05em] text-foreground">
                      <Odometer value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="mt-3 text-sm leading-snug text-muted-foreground">{s.label}</p>
                    <span className="mt-5 block h-[3px] w-full overflow-hidden rounded-full bg-line/[0.07]">
                      <motion.span
                        className={cn("block h-full origin-left rounded-full", blue ? "bg-teal" : "bg-primary")}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: [0.35, 0.8, 0.62, 0.9][i] }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.8, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                  </div>
                </Item>
              );
            })}
          </Stagger>

          {/* Sectors, drifting along the bottom edge of the frame. */}
          <Reveal delay={0.25} className="lg:col-span-12">
            <div className="relative overflow-hidden rounded-3xl border border-line/10 bg-muted/40 py-5" data-testid="logo-marquee">
              <p className="mb-3 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {tx("Representative industries Solix serves")} <span className="opacity-70">· {tx("illustrative examples")}</span>
              </p>
              <VelocityMarquee className="mask-fade-x" baseVelocity={-1.4}>
                {LOGOS.map((l, i) => {
                  const Icon = SECTOR_ICONS[i % SECTOR_ICONS.length];
                  return (
                    <span key={`${l}-${i}`} className="group mx-6 inline-flex shrink-0 items-center gap-3 font-display text-2xl font-medium tracking-[-0.02em] text-foreground/30 transition-colors duration-500 hover:text-foreground sm:text-3xl">
                      <Icon className="h-5 w-5 shrink-0 text-teal/60 transition-colors duration-500 group-hover:text-primary sm:h-6 sm:w-6" strokeWidth={1.5} />
                      {l}
                      <span className="ml-6 text-base text-primary/40" aria-hidden="true">✦</span>
                    </span>
                  );
                })}
              </VelocityMarquee>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
};
