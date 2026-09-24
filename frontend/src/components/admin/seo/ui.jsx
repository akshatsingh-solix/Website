// Shared building blocks for the SEO dashboard. Colour follows the entity:
// you are always blue, a selected rival orange, everyone else neutral grey,
// so ten or more competitors never need ten hues.
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, FlaskConical, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtN, INTENTS, SERP_FEATURES, ANSWER_FEATURES } from "@/lib/seo/model";

export const C = { you: "#3987e5", rival: "#d95926", third: "#199e70", other: "hsl(210 10% 52%)", faint: "hsl(210 10% 34%)", good: "#0ca30c", bad: "#d03b3b", warn: "#fab219" };
export const INK = "hsl(210 22% 70%)";
export const GRID = "rgba(255,255,255,0.07)";
export const axis = { stroke: GRID, tick: { fill: INK, fontSize: 11 }, tickLine: false, axisLine: false };
export const monthTick = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short" });

export const ChartTip = ({ active, payload, label, fmtLabel, fmtValue = fmtN }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line/15 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1 font-medium text-foreground">{fmtLabel ? fmtLabel(label) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} /> {p.name}: <span className="font-mono text-foreground">{fmtValue(p.value, p)}</span>
        </p>
      ))}
    </div>
  );
};

/** Up/down change with an arrow and sign, so direction never relies on colour alone. */
export const Delta = ({ value, suffix = "%", invert = false, digits = 0, className }) => {
  if (value == null || !Number.isFinite(value)) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono text-xs tabular-nums", value === 0 ? "text-muted-foreground" : good ? "text-emerald-400" : "text-red-400", className)}>
      <Icon className="h-3 w-3" strokeWidth={2} />{Math.abs(value).toFixed(digits)}{suffix}
    </span>
  );
};

export const Spark = ({ values = [], color = C.you, width = 88, height = 26 }) => {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / (max - min || 1)) * (height - 4)}`).join(" ");
  return <svg width={width} height={height} className="shrink-0" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

/** Headline number with change and trend; clicking opens its drill-down. */
export const Kpi = ({ label, value, delta, deltaLabel, invert, spark, sub, onClick, testId }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} data-testid={testId} className={cn("group rounded-2xl border border-line/10 bg-card p-5 text-left", onClick && "transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60")}>
      <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}{onClick && <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-medium tracking-tight tabular-nums text-foreground">{value ?? "—"}</p>
        {spark && <Spark values={spark} />}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{delta !== undefined && <Delta value={delta} invert={invert} />}{deltaLabel}{sub && <span>{sub}</span>}</p>
    </Tag>
  );
};

/** Horizontal bars with values; each row can open a drill-down. */
export const BarList = ({ rows, value, label, color = C.you, colorFor, format = fmtN, onPick, empty = "Nothing here yet.", right }) => {
  const max = Math.max(1, ...rows.map((r) => value(r) || 0));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{label(r)}</span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground">{right?.(r)}{format(value(r) || 0, r)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/10">
              <div className="h-full rounded-full" style={{ width: `${((value(r) || 0) / max) * 100}%`, background: colorFor?.(r) || color }} />
            </div>
          </>
        );
        return <li key={i}>{onPick ? <button type="button" onClick={() => onPick(r)} className="block w-full rounded-md text-left transition-opacity hover:opacity-80">{inner}</button> : inner}</li>;
      })}
    </ul>
  );
};

export const PosBadge = ({ pos }) => (
  <span className={cn("inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md px-1.5 font-mono text-xs tabular-nums", pos <= 3 ? "bg-emerald-400/15 text-emerald-300" : pos <= 10 ? "bg-sky-400/15 text-sky-200" : pos <= 20 ? "bg-amber-400/15 text-amber-200" : "bg-line/10 text-muted-foreground")}>{pos ?? "—"}</span>
);

export const Move = ({ from, to }) => (from && to ? <Delta value={from - to} suffix="" /> : from ? null : <span className="rounded bg-sky-400/15 px-1.5 font-mono text-[10px] uppercase text-sky-200">new</span>);

export const FeatureChips = ({ serp = [], owned = [], onlyAnswer }) => (
  <span className="flex flex-wrap gap-1">
    {serp.filter((c) => SERP_FEATURES[c] && (!onlyAnswer || ANSWER_FEATURES.includes(c))).map((c) => (
      <span key={c} title={owned.includes(c) ? "You hold this feature" : "Shown on the results page; not yours yet"} className={cn("rounded border px-1.5 py-0.5 text-[10px]", owned.includes(c) ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-line/15 text-muted-foreground")}>
        {owned.includes(c) ? "✓ " : ""}{SERP_FEATURES[c]}
      </span>
    ))}
  </span>
);

export const IntentChip = ({ intent = [] }) => <span className="text-xs text-muted-foreground">{intent.map((i) => INTENTS[i]).filter(Boolean).join(", ") || "—"}</span>;

export const SampleBadge = ({ reason }) => (
  <span title={reason} className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-200"><FlaskConical className="h-3 w-3" /> Sample data</span>
);

/** Small sortable table. columns: [{ key, label, render?, sort?, align?, className? }] */
export function Table({ rows, columns, initialSort, onRow, empty = "No rows.", limit, testId, compact }) {
  const [sort, setSort] = useState(initialSort || { key: columns[0].key, dir: -1 });
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    const get = col?.sort || ((r) => r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === "string" ? x.localeCompare(y) : x - y) * sort.dir;
    });
  }, [rows, sort, columns]);
  const shown = limit && !all ? sorted.slice(0, limit) : sorted;
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div data-testid={testId}>
      <div className="-mx-5 overflow-x-auto sm:-mx-6">
        <table className={cn("w-full text-sm", !compact && "min-w-[640px]")}>
          <thead>
            <tr className="border-b border-line/10 text-left">
              {columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-3 py-2 font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-muted-foreground first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", c.align === "right" && "text-right")}>
                  {c.nosort ? c.label : (
                    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? -s.dir : -1 }))}>
                      {c.label}{sort.key === c.key ? (sort.dir < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/5">
            {shown.map((r, i) => (
              <tr key={i} onClick={onRow ? () => onRow(r) : undefined} className={cn(onRow && "cursor-pointer transition-colors hover:bg-line/5")}>
                {columns.map((c) => <td key={c.key} className={cn("px-3 py-2.5 align-middle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", c.align === "right" && "text-right font-mono text-xs tabular-nums", c.className)}>{c.render ? c.render(r) : r[c.key] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit && rows.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-3 text-xs text-teal hover:underline">{all ? "Show fewer" : `Show all ${rows.length}`}</button>
      )}
    </div>
  );
}

/** A short list of "what this means / do next" callouts. */
export const Insights = ({ items }) => (
  <ul className="grid gap-3 md:grid-cols-3">
    {items.filter(Boolean).map((it, i) => (
      <li key={i} className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: it.tone === "bad" ? "#f87171" : it.tone === "good" ? "#34d399" : INK }}>
          {it.tone === "bad" ? <ArrowDown className="h-3 w-3" /> : it.tone === "good" ? <ArrowUp className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}{it.kicker}
        </p>
        <p className="mt-1.5 text-sm text-foreground">{it.text}</p>
        {it.action && <button type="button" onClick={it.action.onClick} className="mt-2 text-xs text-teal hover:underline">{it.action.label} →</button>}
      </li>
    ))}
  </ul>
);

export const shortUrl = (url) => {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? u.hostname.replace(/^www\./, "") : u.pathname.replace(/\/$/, "");
  } catch { return url; }
};
