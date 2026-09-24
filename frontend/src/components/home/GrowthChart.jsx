import { Suspense, lazy } from "react";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";

const GrowthPlot = lazy(() => import("@/components/home/GrowthPlot"));

const FACTS = [
  { value: "38%", label: "Average annual growth in enterprise data volume" },
  { value: "60-80%", label: "Of production data that is inactive but retained" },
  { value: "~3%", label: "Annual infrastructure cost growth with archive-first" },
];

export const GrowthChart = () => {
  const tx = useTx();
  const facts = useLocalized(FACTS);
  return (
  <Section className="bg-background" id="the-challenge">
    <div className="container grid items-center gap-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <SectionHeading chapter="01" eyebrow="The challenge" title="Data compounds. Your budget shouldn't." description="Every year the estate grows and the inactive share grows faster. Archive-first programs on the Common Data Platform decouple infrastructure cost from data growth." />
        <Reveal delay={0.1} className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {facts.map((f, i) => (
            <div key={f.label} className={`rounded-xl border border-line/10 bg-muted/60 py-3 pl-4 pr-3 border-l-[3px] ${i === 2 ? "border-l-primary" : "border-l-teal"}`}>
              <span className="block font-display text-2xl font-semibold tracking-tight text-foreground">{f.value}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
      <Reveal delay={0.15} className="surface-elevated rounded-3xl p-5 sm:p-8 lg:col-span-7" data-testid="growth-chart">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Indexed to 2019 = 100")}</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-teal" /> {tx("Data volume")}</span>
            <span className="inline-flex items-center gap-2 text-muted-foreground"><span className="h-0.5 w-3 bg-ink-600" /> {tx("Cost, status quo")}</span>
            <span className="inline-flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> {tx("Cost with Solix")}</span>
          </div>
        </div>
        <Suspense fallback={<div className="h-[320px]" aria-hidden="true" />}>
          <GrowthPlot />
        </Suspense>
        <p className="mt-4 text-xs text-muted-foreground">{tx("Illustrative model based on typical Solix customer programs. Your assessment will produce your own curve.")}</p>
      </Reveal>
    </div>
  </Section>
  );
};
