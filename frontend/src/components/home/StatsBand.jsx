import { CalendarClock, HardDrive, PlugZap, TrendingDown } from "lucide-react";
import { STATS } from "@/data/site";
import { CountUp } from "@/components/shared/CountUp";
import { Stagger, Item } from "@/components/shared/Reveal";

// One icon per STATS entry, in order: connectors, cost, years, petabytes.
const ICONS = [PlugZap, TrendingDown, CalendarClock, HardDrive];

export const StatsBand = () => (
  <section className="relative bg-muted py-14 sm:py-16" data-testid="stats-band">
    <div className="container">
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          const blue = i % 2 === 1;
          return (
            <Item key={s.label} className="flex">
              <div className="surface-elevated card-hover flex w-full flex-col p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${blue ? "bg-teal/10 text-teal" : "bg-primary/10 text-primary-ink"}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                </div>
                <p className="mt-6 font-display text-4xl font-medium tracking-tighter text-foreground sm:text-5xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">{s.label}</p>
                <span className={`mt-5 block h-0.5 w-10 rounded-full ${blue ? "bg-teal" : "bg-primary"}`} />
              </div>
            </Item>
          );
        })}
      </Stagger>
    </div>
  </section>
);
