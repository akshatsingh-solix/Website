import { useMemo } from "react";
import { STRENGTHS, STRENGTH_COLOR } from "@/components/admin/radarKit";

// Ported from the original Leads Radar: accounts sit on a ring by strength, sized by
// how many signals they carry; deep dives scoring 6+ glow; a sweep turns slowly.
const RING = { Strong: 72, Medium: 122, Weak: 160, Unrated: 183 };
const OFFSET = { Strong: 0, Medium: 22, Weak: 11, Unrated: 33 };

export function RadarScope({ points = [], selected, onSelect }) {
  const blips = useMemo(() => {
    const byRing = {};
    points.forEach((p) => (byRing[p.strength || "Unrated"] = byRing[p.strength || "Unrated"] || []).push(p));
    const out = [];
    STRENGTHS.forEach((s) => {
      const list = (byRing[s] || []).slice().sort((a, b) => (b.signals || 0) - (a.signals || 0));
      const n = list.length;
      list.forEach((p, i) => {
        const ang = ((-73 + (360 / n) * i + OFFSET[s]) % 360) * (Math.PI / 180);
        const lanes = n > 48 ? 3 : n > 18 ? 2 : 1;
        const lane = i % lanes;
        const jitter = lanes === 1 ? ((p.name.length * 7) % 10) - 5 : (lane - (lanes - 1) / 2) * 16;
        const r = RING[s] + jitter;
        const size = Math.max(n > 48 ? 3 : 4, Math.min(n > 18 ? 7 : 10, (n > 18 ? 3 : 4) + 1.4 * ((p.signals || 1) - 1)));
        const cx = 200 + r * Math.cos(ang);
        const cy = 200 + r * Math.sin(ang);
        const label = n <= 18 || (p.dive ?? -1) >= 6 || p.surge || p.id === selected;
        out.push({ ...p, s, cx, cy, size, label });
      });
    });
    return out;
  }, [points, selected]);

  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full max-w-[460px]" role="img" aria-label={`Radar of ${points.length} accounts by strength`} data-testid="radar-scope">
      <defs>
        <linearGradient id="radarSweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e5484d" stopOpacity="0" />
          <stop offset="1" stopColor="#e5484d" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="190" fill="currentColor" className="text-card" />
      {[RING.Strong, RING.Medium, RING.Weak, 190].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" className="text-line/20" strokeWidth="1" strokeDasharray={i === 3 ? "2 4" : undefined} />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="200" y1="200" x2={200 + 190 * Math.cos((a * Math.PI) / 180)} y2={200 + 190 * Math.sin((a * Math.PI) / 180)} stroke="currentColor" className="text-line/10" strokeWidth=".6" />
      ))}
      {[["Strong", RING.Strong], ["Medium", RING.Medium], ["Weak", RING.Weak]].map(([label, r]) => (
        <text key={label} x={200 - r + 5} y="196" fontSize="10" fill="currentColor" className="fill-muted-foreground">{label}</text>
      ))}
      <g className="origin-center motion-safe:animate-[spin_9s_linear_infinite]" style={{ transformOrigin: "200px 200px" }}>
        <path d="M200 200 L390 200 A190 190 0 0 0 295 35.4 Z" fill="url(#radarSweep)" />
        <line x1="200" y1="200" x2="390" y2="200" stroke="#e5484d" strokeWidth="1.2" strokeOpacity=".9" />
      </g>
      {blips.map((b) => {
        const isSel = b.id === selected;
        return (
          <g key={b.id} role="button" tabIndex={0} aria-label={`${b.name}, ${b.s}, ${b.signals} signal${b.signals === 1 ? "" : "s"}`} className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-white"
            onClick={() => onSelect?.(b.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect?.(b.id))}>
            <title>{`${b.name} · ${b.s} · ${b.signals} signal${b.signals === 1 ? "" : "s"}${b.dive != null ? ` · deep dive ${b.dive}/10` : ""}`}</title>
            {(b.dive ?? -1) >= 6 && <circle cx={b.cx} cy={b.cy} r={b.size + 5} fill="none" stroke="#34d399" strokeOpacity=".7" strokeWidth="1.5" />}
            {b.fresh === "new" && <circle cx={b.cx} cy={b.cy} r={b.size + 2.5} fill="none" stroke="#7dd3fc" strokeOpacity=".8" strokeWidth="1" />}
            <circle cx={b.cx} cy={b.cy} r={b.size} fill={STRENGTH_COLOR[b.s]} stroke={isSel ? "#fff" : "none"} strokeWidth="2" />
            {b.label && (
              <text x={b.cx > 300 ? b.cx - b.size - 4 : b.cx + b.size + 4} y={b.cy + 3.5} textAnchor={b.cx > 300 ? "end" : "start"} fontSize="9.5" fill="currentColor"
                className={isSel ? "fill-foreground font-semibold" : "fill-muted-foreground"} style={{ paintOrder: "stroke" }} stroke="hsl(var(--card))" strokeWidth="3">
                {b.name.length > 22 ? `${b.name.slice(0, 21)}…` : b.name}
              </text>
            )}
          </g>
        );
      })}
      <circle cx="200" cy="200" r="5" fill="#e5484d" />
    </svg>
  );
}
