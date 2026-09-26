import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { useTx } from "@/i18n/tx";
import { cn } from "@/lib/utils";

export const FACTS = [
  { value: "38%", label: "Average annual growth in enterprise data volume" },
  { value: "60-80%", label: "Of production data that is inactive but retained" },
  { value: "~3%", label: "Annual infrastructure cost growth with archive-first" },
];

// Indexed to 2019 = 100: volume grows 38%/yr, status-quo cost 24%/yr, cost with Solix ~3%/yr.
const YEARS = Array.from({ length: 8 }, (_, i) => 2019 + i);
const SERIES = {
  volume: YEARS.map((_, i) => 100 * Math.pow(1.38, i)),
  status: YEARS.map((_, i) => 100 * Math.pow(1.24, i)),
  solix: YEARS.map((_, i) => 100 * Math.pow(1.03, i)),
};
const W = 640;
const H = 340;
const PAD = { l: 44, r: 16, t: 20, b: 34 };
const MAX = 1000;
const xAt = (i) => PAD.l + (i / (YEARS.length - 1)) * (W - PAD.l - PAD.r);
const yAt = (v) => H - PAD.b - (v / MAX) * (H - PAD.t - PAD.b);

// Catmull-Rom through the points, as cubic Beziers: smooth but honest to the data.
const smoothPts = (pts) => {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
};
const pointsOf = (vals) => vals.map((v, i) => [xAt(i), yAt(v)]);
const smooth = (vals) => smoothPts(pointsOf(vals));
const area = (vals) => `${smooth(vals)} L${xAt(vals.length - 1)},${H - PAD.b} L${xAt(0)},${H - PAD.b} Z`;
const PATHS = { volume: smooth(SERIES.volume), status: smooth(SERIES.status), solix: smooth(SERIES.solix) };
// The band between the status-quo and Solix cost curves.
const GAP = (() => {
  const back = pointsOf(SERIES.solix).reverse();
  return `${PATHS.status} L${back[0][0]},${back[0][1]} ${smoothPts(back).replace(/^M[^C]*/, "")} Z`;
})();

/**
 * The cost of doing nothing, drawn by the scroll. The three
 * curves trace out as the chart moves up the screen and a scrubber walks the
 * years with them; hovering (or dragging a finger) takes over the scrubber
 * so any year can be read off. The gap between the dashed and red curves is
 * shaded - that is the money archive-first keeps.
 */
export const GrowthChartCard = ({ className, children }) => {
  const tx = useTx();
  const chartRef = useRef(null);
  const svgRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: chartRef, offset: ["start 85%", "center 40%"] });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const scrubX = useTransform(drawn, [0, 1], [xAt(0), xAt(YEARS.length - 1)]);
  const gapOpacity = useTransform(drawn, [0.5, 1], [0, 1]);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(null);
  useMotionValueEvent(drawn, "change", (v) => setScrollIdx(Math.max(0, Math.min(YEARS.length - 1, Math.round(v * (YEARS.length - 1))))));
  const idx = hoverIdx ?? scrollIdx;

  const onPointer = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((x - PAD.l) / (W - PAD.l - PAD.r)) * (YEARS.length - 1));
    setHoverIdx(Math.max(0, Math.min(YEARS.length - 1, i)));
  };

  const readout = [
    { key: "volume", label: tx("Data volume"), color: "bg-teal", value: SERIES.volume[idx] },
    { key: "status", label: tx("Cost, status quo"), color: "bg-ink-600", value: SERIES.status[idx] },
    { key: "solix", label: tx("Cost with Solix"), color: "bg-primary", value: SERIES.solix[idx] },
  ];
  const saved = Math.round((1 - SERIES.solix[idx] / SERIES.status[idx]) * 100);

  return (
          <div ref={chartRef} className={cn("surface-elevated spot rounded-3xl p-5 sm:p-8", className)} data-testid="growth-chart">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Indexed to 2019 = 100")}</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={YEARS[idx]} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.25 }} className="font-display text-4xl font-medium tracking-tight text-foreground">
                      {YEARS[idx]}
                    </motion.span>
                  </AnimatePresence>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary-ink" data-testid="growth-saved">
                    {tx("{{n}}% less spend", { n: saved })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {readout.map((r) => (
                  <div key={r.key}>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className={cn("h-2 w-2 rounded-full", r.color)} /> {r.label}</span>
                    <p className="mt-1 font-mono text-base tabular-nums text-foreground">{Math.round(r.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full touch-pan-y select-none"
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              onPointerLeave={() => setHoverIdx(null)}
              role="img"
              aria-label={tx("Data volume grows 38% a year; status-quo cost follows it while cost with Solix stays nearly flat.")}
            >
              <defs>
                <linearGradient id="gc-vol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0088CF" stopOpacity="0.2" /><stop offset="100%" stopColor="#0088CF" stopOpacity="0" /></linearGradient>
                <linearGradient id="gc-gap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EE2424" stopOpacity="0.16" /><stop offset="100%" stopColor="#EE2424" stopOpacity="0.02" /></linearGradient>
                <clipPath id="gc-reveal"><motion.rect x="0" y="0" height={H} style={{ width: scrubX }} /></clipPath>
              </defs>
              {[0, 250, 500, 750, 1000].map((v) => (
                <g key={v}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={yAt(v)} y2={yAt(v)} stroke="rgb(var(--line) / 0.07)" />
                  <text x={PAD.l - 10} y={yAt(v) + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }}>{v}</text>
                </g>
              ))}
              {YEARS.map((y, i) => (
                <text key={y} x={xAt(i)} y={H - 10} textAnchor="middle" className={cn("transition-[fill] duration-300", i === idx ? "fill-foreground" : "fill-muted-foreground")} style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }}>{y}</text>
              ))}
              <g clipPath="url(#gc-reveal)">
                <path d={area(SERIES.volume)} fill="url(#gc-vol)" />
                {/* The money archive-first keeps: between status quo and Solix. */}
                <motion.path d={GAP} fill="url(#gc-gap)" style={{ opacity: gapOpacity }} />
              </g>
              <motion.path d={PATHS.volume} fill="none" stroke="#0088CF" strokeWidth="2.25" strokeLinecap="round" style={{ pathLength: drawn }} />
              <motion.path d={PATHS.status} fill="none" stroke="#3D6288" strokeWidth="1.75" strokeDasharray="5 6" style={{ pathLength: drawn }} />
              <motion.path d={PATHS.solix} fill="none" stroke="#EE2424" strokeWidth="2.75" strokeLinecap="round" style={{ pathLength: drawn }} />

              {/* Scrubber */}
              <g style={{ transform: `translateX(${xAt(idx)}px)`, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
                <line x1="0" x2="0" y1={PAD.t} y2={H - PAD.b} stroke="rgb(var(--line) / 0.25)" strokeDasharray="3 4" />
                {[["volume", "#0088CF"], ["status", "#3D6288"], ["solix", "#EE2424"]].map(([k, c]) => (
                  <g key={k} style={{ transform: `translateY(${yAt(SERIES[k][idx])}px)`, transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
                    <circle r="9" fill={c} opacity="0.15" />
                    <circle r="4" fill="#fff" stroke={c} strokeWidth="2" />
                  </g>
                ))}
              </g>
            </svg>
            <p className="mt-4 text-xs text-muted-foreground">{tx("Illustrative model based on typical Solix customer programs. Your assessment will produce your own curve.")}</p>
            {children}
          </div>
  );
};
