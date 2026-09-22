import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";

const DATA = Array.from({ length: 8 }, (_, i) => {
  const year = 2019 + i;
  const volume = Math.round(100 * Math.pow(1.38, i));
  return { year, volume, costTraditional: Math.round(100 * Math.pow(1.24, i)), costSolix: Math.round(100 * Math.pow(1.03, i)) };
});

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/95 px-4 py-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 font-mono text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: p.stroke }} /> {p.name}: <span className="font-mono text-foreground">{p.value}</span></p>
      ))}
    </div>
  );
};

const FACTS = [
  { value: "38%", label: "Average annual growth in enterprise data volume" },
  { value: "60-80%", label: "Of production data that is inactive but retained" },
  { value: "~3%", label: "Annual infrastructure cost growth with archive-first" },
];

export const GrowthChart = () => (
  <Section bordered>
    <div className="container grid items-center gap-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <SectionHeading eyebrow="The economics" title="Data compounds. Your budget shouldn't." description="Every year the estate grows and the inactive share grows faster. Archive-first programs on the Common Data Platform decouple infrastructure cost from data growth." />
        <Reveal delay={0.1} className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {FACTS.map((f) => (
            <div key={f.label} className="flex items-baseline gap-4 border-l-2 border-primary/60 pl-4">
              <span className="font-display text-2xl font-medium tracking-tight text-foreground">{f.value}</span>
              <span className="text-xs text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
      <Reveal delay={0.15} className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8 lg:col-span-7" data-testid="growth-chart">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Indexed to 2019 = 100</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full bg-teal" /> Data volume</span>
            <span className="inline-flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full bg-slate-400" /> Cost, status quo</span>
            <span className="inline-flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full bg-primary" /> Cost with Solix</span>
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00D4FF" stopOpacity="0.35" /><stop offset="100%" stopColor="#00D4FF" stopOpacity="0" /></linearGradient>
                <linearGradient id="gSolix" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ED2423" stopOpacity="0.35" /><stop offset="100%" stopColor="#ED2423" stopOpacity="0" /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox />} />
              <Area type="monotone" dataKey="volume" name="Data volume" stroke="#00D4FF" strokeWidth={2} fill="url(#gVol)" />
              <Area type="monotone" dataKey="costTraditional" name="Cost, status quo" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" fill="transparent" />
              <Area type="monotone" dataKey="costSolix" name="Cost with Solix" stroke="#ED2423" strokeWidth={2.5} fill="url(#gSolix)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Illustrative model based on typical Solix customer programs. Your assessment will produce your own curve.</p>
      </Reveal>
    </div>
  </Section>
);
