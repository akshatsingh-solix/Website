import { CountUp } from "@/components/shared/CountUp";
import { Stagger, Item } from "@/components/shared/Reveal";

const RINGS = [
  { value: 24, suffix: "", pct: 100, label: "Years of enterprise data stewardship", color: "#ED2423" },
  { value: 150, suffix: "+", pct: 88, label: "Application connectors on the platform", color: "#0088CF" },
  { value: 80, suffix: "%", pct: 80, label: "Typical infrastructure cost reduction", color: "#ED2423" },
  { value: 30, suffix: "+", pct: 62, label: "Privacy regulations covered by templates", color: "#0088CF" },
  { value: 4, suffix: "", pct: 45, label: "Continents with Solix teams", color: "#94A3B8" },
];

const Ring = ({ pct, color, children }) => {
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
      </svg>
      <span className="relative font-display text-2xl font-medium tracking-tight">{children}</span>
    </div>
  );
};

export const NumbersRings = () => (
  <div data-testid="numbers-rings">
  <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
    {RINGS.map((s) => (
      <Item key={s.label} className="flex flex-col items-center text-center">
        <Ring pct={s.pct} color={s.color}><CountUp value={s.value} suffix={s.suffix} /></Ring>
        <p className="mt-4 max-w-[18ch] text-xs leading-snug text-muted-foreground">{s.label}</p>
      </Item>
    ))}
  </Stagger>
  </div>
);
