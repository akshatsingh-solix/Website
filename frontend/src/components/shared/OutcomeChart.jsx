import { useTx } from "@/i18n/tx";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line/10 bg-popover/95 px-4 py-3 text-xs text-popover-foreground shadow-lift backdrop-blur">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} /> {p.name}: <span className="font-mono text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export const OutcomeChart = ({ data, accent = "#EE2424" }) => {
  const tx = useTx();
  return (
  <div className="h-[300px] w-full" data-testid="outcome-chart">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={22} barGap={6}>
        <CartesianGrid horizontal={false} stroke="rgba(13,25,45,0.07)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#3D6288", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
        <YAxis type="category" dataKey="metric" width={190} tick={{ fill: "#0D192D", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(13,25,45,0.04)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#3D6288", paddingTop: 8 }} />
        <Bar dataKey="before" name={tx("Before Solix")} fill="rgba(61,98,136,0.28)" radius={[0, 4, 4, 0]} isAnimationActive />
        <Bar dataKey="after" name={tx("With Solix")} fill={accent} radius={[0, 4, 4, 0]} isAnimationActive />
      </BarChart>
    </ResponsiveContainer>
  </div>
  );
};
