// The recharts plot for GrowthChart, split out so the charting library loads
// after first paint instead of weighing down the main bundle.
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTx } from "@/i18n/tx";

const DATA = Array.from({ length: 8 }, (_, i) => {
  const year = 2019 + i;
  const volume = Math.round(100 * Math.pow(1.38, i));
  return { year, volume, costTraditional: Math.round(100 * Math.pow(1.24, i)), costSolix: Math.round(100 * Math.pow(1.03, i)) };
});

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line/10 bg-popover/95 px-4 py-3 text-xs text-popover-foreground shadow-lift backdrop-blur">
      <p className="mb-2 font-mono text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: p.stroke }} /> {p.name}: <span className="font-mono text-foreground">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function GrowthPlot() {
  const tx = useTx();
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={DATA} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0088CF" stopOpacity="0.22" /><stop offset="100%" stopColor="#0088CF" stopOpacity="0" /></linearGradient>
            <linearGradient id="gSolix" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EE2424" stopOpacity="0.25" /><stop offset="100%" stopColor="#EE2424" stopOpacity="0" /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(13,25,45,0.07)" />
          <XAxis dataKey="year" tick={{ fill: "#3D6288", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#3D6288", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "rgba(13,25,45,0.2)", strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="volume" name={tx("Data volume")} stroke="#0088CF" strokeWidth={2} fill="url(#gVol)" />
          <Area type="monotone" dataKey="costTraditional" name={tx("Cost, status quo")} stroke="#3D6288" strokeWidth={1.5} strokeDasharray="5 5" fill="transparent" />
          <Area type="monotone" dataKey="costSolix" name={tx("Cost with Solix")} stroke="#EE2424" strokeWidth={2.5} fill="url(#gSolix)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
