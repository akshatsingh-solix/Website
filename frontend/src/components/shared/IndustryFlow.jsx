import { AlertTriangle, ArrowRight, CheckCircle2, Layers } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";

export const IndustryFlow = ({ industry }) => {
  const tx = useTx();
  return (
  <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch" data-testid="industry-flow">
    <Reveal className="rounded-2xl border border-line/10 bg-card p-7 shadow-soft">
      <p className="eyebrow mb-5 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {tx("Challenges")}</p>
      <ul className="space-y-4">
        {industry.challenges.map((c) => (
          <li key={c} className="flex gap-3 text-sm text-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />{c}</li>
        ))}
      </ul>
    </Reveal>
    <div className="hidden items-center lg:flex"><ArrowRight className="h-6 w-6 text-line/30" /></div>
    <Reveal delay={0.08} className="relative overflow-hidden rounded-2xl border border-teal/25 bg-card p-7 shadow-soft">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.16),transparent)]" />
      <p className="eyebrow mb-5 flex items-center gap-2 text-teal"><Layers className="h-4 w-4" /> {tx("Solix approach")}</p>
      <ol className="space-y-4 text-sm text-foreground">
        <li className="flex gap-3"><span className="font-mono text-xs text-teal">01</span> {tx("Assess the estate: systems, volumes, retention, cost.")}</li>
        <li className="flex gap-3"><span className="font-mono text-xs text-teal">02</span> {tx("Archive, retire or preserve on the Common Data Platform.")}</li>
        <li className="flex gap-3"><span className="font-mono text-xs text-teal">03</span> {tx("Publish governed data products for compliance, analytics and AI.")}</li>
      </ol>
    </Reveal>
    <div className="hidden items-center lg:flex"><ArrowRight className="h-6 w-6 text-line/30" /></div>
    <Reveal delay={0.16} className="rounded-2xl border border-primary/30 bg-card p-7 glow-ember">
      <p className="eyebrow mb-5 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {tx("Results")}</p>
      <ul className="space-y-4">
        {industry.results.map((c) => (
          <li key={c} className="flex gap-3 text-sm text-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}</li>
        ))}
      </ul>
    </Reveal>
  </div>
  );
};
