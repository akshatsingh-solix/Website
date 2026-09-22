import { STATS } from "@/data/site";
import { CountUp } from "@/components/shared/CountUp";
import { Stagger, Item } from "@/components/shared/Reveal";

export const StatsBand = () => (
  <section className="relative border-y border-white/10" data-testid="stats-band">
    <div className="container">
      <Stagger className="grid grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Item key={s.label} className={`px-2 py-10 sm:px-6 lg:py-14 ${i > 0 ? "lg:border-l lg:border-white/10" : ""} ${i % 2 === 1 ? "border-l border-white/10 lg:border-l" : ""} ${i > 1 ? "border-t border-white/10 lg:border-t-0" : ""}`}>
            <p className="font-display text-5xl font-medium tracking-tighter sm:text-6xl">
              <CountUp value={s.value} suffix={s.suffix} className={i % 2 ? "text-teal" : "text-primary"} />
            </p>
            <p className="mt-3 max-w-[16ch] font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
          </Item>
        ))}
      </Stagger>
    </div>
  </section>
);
