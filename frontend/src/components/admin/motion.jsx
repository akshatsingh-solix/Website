// Motion primitives for the admin: counting numbers, sparklines, reveal on
// scroll, a sliding segmented control and the live pulse. All of them fall
// back to the final state when the visitor prefers reduced motion.
import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1];

// "1,284" / "42.5%" / 17 -> { n, decimals, prefix, suffix }; null when not a plain number.
const parse = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return { n: v, decimals: Number.isInteger(v) ? 0 : 1, prefix: "", suffix: "" };
  if (typeof v !== "string") return null;
  const m = v.match(/^([^\d-]*)(-?[\d,]+(?:\.(\d+))?)(\s*%?)$/);
  if (!m) return null;
  return { n: Number(m[2].replace(/,/g, "")), decimals: m[3]?.length || 0, prefix: m[1], suffix: m[4] };
};

/** Counts from the last shown value to the new one; non-numbers render as-is. */
export const CountUp = ({ value, duration = 1.1, className }) => {
  const p = parse(value);
  const reduce = useReducedMotion();
  const from = useRef(0);
  const [shown, setShown] = useState(p && !reduce ? 0 : p?.n);

  useEffect(() => {
    if (!p) return undefined;
    if (reduce) {
      setShown(p.n);
      from.current = p.n;
      return undefined;
    }
    const ctl = animate(from.current, p.n, { duration, ease: EASE, onUpdate: setShown });
    from.current = p.n;
    return () => ctl.stop();
  }, [p?.n, reduce, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = p
    ? `${p.prefix}${Number(shown || 0).toLocaleString(undefined, { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals })}${p.suffix}`
    : value ?? "—";
  return (
    <span className={cn("tabular-nums", className)} aria-label={p ? String(value) : undefined}>
      {text}
    </span>
  );
};

/** Tiny area sparkline that draws itself in. */
export const Sparkline = ({ data = [], color = "#3987e5", height = 36, className }) => {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  if (data.length < 2) return <div style={{ height }} className={className} />;
  const w = 120;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 3 - (v / max) * (height - 6)]);
  // Smooth with simple midpoint quadratic curves.
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q${x0},${y0} ${(x0 + x1) / 2},${(y0 + y1) / 2}`;
  }
  d += ` T${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
  const area = `${d} L${w},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("w-full overflow-visible", className)} style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={`sg${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#sg${id})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.35 }} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE }} />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} className="admin-spark-dot" />
    </svg>
  );
};

/** Fades and lifts children in once they scroll into view. */
export const Reveal = ({ as = "div", delay = 0, className, children, ...rest }) => {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/** Pill radio group whose active pill slides between options. */
export const Segmented = ({ options, value, onChange, layoutId, label, size = "sm", testIdPrefix }) => (
  <div role="radiogroup" aria-label={label} className="relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border [scrollbar-width:none] border-line/10 bg-line/[0.04] p-1">
    {options.map((o) => {
      const active = o.key === value;
      return (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.key)}
          data-testid={testIdPrefix ? `${testIdPrefix}-${o.key}` : undefined}
          className={cn(
            "relative shrink-0 whitespace-nowrap rounded-full font-medium transition-colors",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            active ? "text-white" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {active && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-gradient-to-b from-[#ff4d4d] to-[#d81e1e] shadow-[0_6px_20px_-6px_rgba(238,36,36,0.7)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      );
    })}
  </div>
);

/** Breathing dot for anything live. */
export const LiveDot = ({ className, color = "bg-emerald-400" }) => (
  <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden="true">
    <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />
    <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
  </span>
);
