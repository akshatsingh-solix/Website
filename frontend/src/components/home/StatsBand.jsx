import { motion } from "framer-motion";
import { CalendarClock, HardDrive, PlugZap, TrendingDown } from "lucide-react";
import { STATS } from "@/data/site";
import { Odometer } from "@/components/motion/Odometer";
import { cn } from "@/lib/utils";

// One icon per STATS entry, in order: connectors, cost, years, petabytes.
const ICONS = [PlugZap, TrendingDown, CalendarClock, HardDrive];

/**
 * Scale, stated plainly: four oversized mechanical counters on a hairline
 * grid. The reels spin down as the band arrives and each gauge bar fills.
 */
export const StatsBand = () => (
  <section className="relative bg-background pb-16 pt-6 sm:pb-24" data-testid="stats-band">
    <div className="container">
      <div className="grid grid-cols-2 border-y border-line/10 lg:grid-cols-4">
        {STATS.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          const blue = i % 2 === 1;
          return (
            <div
              key={s.label}
              className={cn(
                "spot group relative flex flex-col px-4 py-8 sm:px-8 sm:py-12",
                i % 2 === 1 && "border-l border-line/10",
                i >= 2 && "border-t border-line/10 lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                <Icon className={cn("h-5 w-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110", blue ? "text-teal" : "text-primary-ink")} strokeWidth={1.5} />
              </div>
              <p className="mt-8 font-display text-[clamp(2.8rem,1.6rem+4.2vw,5.6rem)] font-medium leading-none tracking-[-0.05em] text-foreground">
                <Odometer value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-4 max-w-[16rem] text-sm leading-snug text-muted-foreground">{s.label}</p>
              <span className="mt-6 block h-[3px] w-full overflow-hidden rounded-full bg-line/[0.06]">
                <motion.span
                  className={cn("block h-full origin-left rounded-full", blue ? "bg-teal" : "bg-primary")}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: [0.35, 0.8, 0.62, 0.9][i] }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
