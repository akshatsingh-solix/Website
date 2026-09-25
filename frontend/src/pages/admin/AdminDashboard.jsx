import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, RefreshCw, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAdminCache, fetchLeadsMeta, fetchOverview, formatApiError } from "@/lib/adminApi";
import { CHANNEL_LABELS, LINE_SHORT, Panel, SERIES, STAGE_LABELS, StatTile, productName, selectCls, useLiveRefresh } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "365", label: "12 months" },
  { key: "custom", label: "Custom" },
];

const INK = "hsl(210 22% 70%)";
const GRID = "rgba(255,255,255,0.07)";
const axis = { stroke: GRID, tick: { fill: INK, fontSize: 11 }, tickLine: false, axisLine: false };

const ChartTip = ({ active, payload, label, fmtLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line/15 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1 font-medium text-foreground">{fmtLabel ? fmtLabel(label) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} /> {p.name}: <span className="font-mono text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const pct = (v) => (v == null ? "—" : `${v}%`);
const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Horizontal single-series bar list with values; readable as a table too. */
const BarList = ({ rows, valueKey, labelKey, color = SERIES.leads, format = (v) => v, testId, linkFor }) => {
  const max = Math.max(1, ...rows.map((r) => r[valueKey] || 0));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data in this period yet.</p>;
  return (
    <ul className="space-y-2.5" data-testid={testId}>
      {rows.map((r) => {
        const label = r[labelKey];
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{format(r[valueKey] || 0, r)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/10">
              <div className="h-full rounded-full" style={{ width: `${((r[valueKey] || 0) / max) * 100}%`, background: color }} />
            </div>
          </>
        );
        const to = linkFor?.(r);
        return <li key={label}>{to ? <Link to={to} className="block rounded-md transition-opacity hover:opacity-80">{inner}</Link> : inner}</li>;
      })}
    </ul>
  );
};

export default function AdminDashboard() {
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [line, setLine] = useState("all");
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendTable, setTrendTable] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchLeadsMeta().then(setMeta).catch(() => {});
  }, []);

  const params = useMemo(() => {
    if (range === "custom" && (!from || !to)) return null;
    return range === "custom" ? { date_from: from, date_to: to, line } : { days: Number(range), line };
  }, [range, from, to, line]);
  useLiveRefresh(() => params && fetchOverview(params, { fresh: true }).then(setData));

  useEffect(() => {
    if (!params) return;
    let alive = true;
    setLoading(true);
    fetchOverview(params)
      .then((d) => alive && setData(d))
      .catch((e) => toast.error(formatApiError(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [params, tick]);

  const k = data?.kpis;
  const lineRows = useMemo(() => (data?.by_line || []).map((r) => ({ ...r, name: LINE_SHORT[r.key] || r.label })), [data]);
  const channelRows = useMemo(() => (data?.by_channel || []).filter((r) => r.leads || r.mqls).map((r) => ({ ...r, name: CHANNEL_LABELS[r.key] || r.key })).sort((a, b) => b.leads - a.leads), [data]);
  const funnelRows = useMemo(() => (data?.funnel || []).map((r) => ({ ...r, name: r.stage === "visitors" ? "New visitors" : STAGE_LABELS[r.stage] })), [data]);
  const leadsLink = (extra) => `/admin/leads?${new URLSearchParams({ ...(line !== "all" ? { line } : {}), ...extra })}`;

  return (
    <div data-testid="admin-dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Leadership overview</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Pipeline by product and service.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Visitors, leads and MQLs tagged to the product line they showed the most intent for. Click any number to open the matching leads.</p>
        </div>
      </div>

      {/* Filters: one row above every chart */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line/10 bg-card/60 p-3" data-testid="dashboard-filters">
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.key} role="radio" aria-checked={range === r.key} onClick={() => setRange(r.key)} data-testid={`range-${r.key}`} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", range === r.key ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:text-foreground")}>{r.label}</button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40 border-line/15 bg-background text-xs" aria-label="From" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40 border-line/15 bg-background text-xs" aria-label="To" />
          </div>
        )}
        <select value={line} onChange={(e) => setLine(e.target.value)} className={cn(selectCls, "h-9 text-xs")} aria-label="Product line" data-testid="dashboard-line">
          <option value="all">All product lines</option>
          {(meta?.lines || []).map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { clearAdminCache(); setTick((t) => t + 1); }} aria-label="Refresh">{loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}</Button>
      </div>

      {!data ? (
        <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>
      ) : (
        <div className={cn("mt-6 space-y-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label="New visitors" value={k.new_visitors.toLocaleString()} sub={`${k.active_visitors.toLocaleString()} active`} testId="kpi-visitors" />
            <Link to={leadsLink({ date_from: data.window.from.slice(0, 10) })}><StatTile label="New leads" value={k.leads} sub={`${pct(k.visitor_to_lead)} of new visitors`} testId="kpi-leads" /></Link>
            <Link to={leadsLink({ stage: "mql_plus", date_field: "mql_at", date_from: data.window.from.slice(0, 10) })}><StatTile label="MQLs" value={k.mqls} sub={`${pct(k.lead_to_mql)} of leads`} testId="kpi-mqls" /></Link>
            <Link to={leadsLink({ stage: "sql_plus" })}><StatTile label="SQL or later" value={k.sqls} sub={`${pct(k.mql_to_sql)} of MQLs`} testId="kpi-sqls" /></Link>
            <StatTile label="Won" value={k.won} testId="kpi-won" />
            <Link to="/admin/leads?stage=mql&owner=unassigned"><StatTile label="Unassigned MQLs" value={k.unassigned_mqls} sub={k.unassigned_mqls ? "Need an owner" : "All assigned"} testId="kpi-unassigned" /></Link>
          </div>

          <Panel
            title="Leads and MQLs over time"
            sub="Daily count · hover for exact values"
            testId="panel-trend"
            action={<Button variant="ghost" size="sm" onClick={() => setTrendTable((v) => !v)}><Table2 /> {trendTable ? "Chart" : "Table"}</Button>}
          >
            {trendTable ? (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Date</th><th>New visitors</th><th>Leads</th><th>MQLs</th></tr></thead>
                  <tbody className="font-mono text-xs">
                    {data.trend.map((d) => <tr key={d.date} className="border-t border-line/5"><td className="py-1">{d.date}</td><td>{d.visitors}</td><td>{d.leads}</td><td>{d.mqls}</td></tr>)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip content={<ChartTip fmtLabel={shortDate} />} cursor={{ stroke: "rgba(255,255,255,0.25)" }} />
                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: INK }} />
                    <Line type="monotone" dataKey="leads" name="Leads" stroke={SERIES.leads} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#1d3044" }} />
                    <Line type="monotone" dataKey="mqls" name="MQLs" stroke={SERIES.mqls} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#1d3044" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="By product line" sub="Leads created, MQLs reached and SQL-or-later in the period" testId="panel-lines">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineRows} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }} barGap={2} barCategoryGap="28%">
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" allowDecimals={false} {...axis} />
                    <YAxis type="category" dataKey="name" width={130} {...axis} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: INK }} />
                    <Bar dataKey="leads" name="Leads" fill={SERIES.leads} radius={[0, 4, 4, 0]} maxBarSize={10} />
                    <Bar dataKey="mqls" name="MQLs" fill={SERIES.mqls} radius={[0, 4, 4, 0]} maxBarSize={10} />
                    <Bar dataKey="sqls" name="SQL+" fill={SERIES.sqls} radius={[0, 4, 4, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="mt-4 w-full text-sm" data-testid="lines-table">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 font-normal">Product line</th><th className="font-normal">Leads</th><th className="font-normal">MQLs</th><th className="font-normal">SQL+</th></tr></thead>
                <tbody>
                  {lineRows.map((r) => (
                    <tr key={r.key} className="border-t border-line/5">
                      <td className="py-1.5"><Link to={r.key === "none" ? "/admin/leads?line=none" : `/admin/leads?line=${r.key}`} className="hover:text-teal">{r.label}</Link></td>
                      <td className="font-mono text-xs">{r.leads}</td><td className="font-mono text-xs">{r.mqls}</td><td className="font-mono text-xs">{r.sqls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Funnel" sub="How far this period's leads have progressed" testId="panel-funnel">
              <BarList rows={funnelRows} valueKey="count" labelKey="name" format={(v, r) => (r.stage === "visitors" || !funnelRows[1]?.count ? v.toLocaleString() : `${v} · ${Math.round((100 * v) / funnelRows[1].count)}%`)} testId="funnel-list" />
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Lead sources" sub="First-touch channel" testId="panel-channels">
              <BarList rows={channelRows} valueKey="leads" labelKey="name" format={(v, r) => `${v} leads · ${r.mqls} MQL`} linkFor={(r) => `/admin/leads?channel=${r.key}`} />
            </Panel>
            <Panel title="Product interest" sub="Decayed intent score across active visitors" testId="panel-interest">
              <BarList rows={(data.product_interest || []).slice(0, 8).map((p) => ({ ...p, name: productName(p.slug) }))} valueKey="score" labelKey="name" color={SERIES.sqls} format={(v) => Math.round(v)} linkFor={(r) => `/admin/leads?product=${r.slug}`} />
            </Panel>
            <Panel title="Owners" sub="Leads created this period, by owner" testId="panel-owners">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 font-normal">Owner</th><th className="font-normal">Leads</th><th className="font-normal">MQL+</th><th className="font-normal">SQL+</th></tr></thead>
                <tbody>
                  {(data.owners || []).slice(0, 8).map((o) => (
                    <tr key={o.owner} className="border-t border-line/5">
                      <td className="max-w-[160px] truncate py-1.5"><Link to={`/admin/leads?owner=${encodeURIComponent(o.owner)}`} className="hover:text-teal">{meta?.owners?.find((m) => m.email === o.owner)?.name || o.owner}</Link></td>
                      <td className="font-mono text-xs">{o.leads}</td><td className="font-mono text-xs">{o.mqls}</td><td className="font-mono text-xs">{o.sqls}</td>
                    </tr>
                  ))}
                  {!data.owners?.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No leads in this period yet.</td></tr>}
                </tbody>
              </table>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Top content" sub="Resource views and downloads" className="xl:col-span-2" testId="panel-content">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 font-normal">Resource</th><th className="font-normal">Views</th><th className="font-normal">Downloads</th></tr></thead>
                <tbody>
                  {(data.top_content || []).map((c) => (
                    <tr key={c.path} className="border-t border-line/5">
                      <td className="max-w-[360px] truncate py-1.5"><a href={`${process.env.PUBLIC_URL}${c.path}`} target="_blank" rel="noreferrer" className="hover:text-teal">{c.title || c.path}</a></td>
                      <td className="font-mono text-xs">{c.views}</td><td className="font-mono text-xs">{c.downloads}</td>
                    </tr>
                  ))}
                  {!data.top_content?.length && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No resource activity tracked in this period yet.</td></tr>}
                </tbody>
              </table>
              <Link to="/admin/content" className="mt-4 inline-flex items-center gap-1 text-xs text-teal hover:underline">Manage content <ArrowRight className="h-3 w-3" /></Link>
            </Panel>
            <Panel title="Where leads are" sub="Country (from forms) and industry (from pages browsed)" testId="panel-geo">
              {!data.by_country?.length && !data.by_industry?.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No country or industry data in this period yet.</p>
              ) : (
                <>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Country</p>
                  <BarList rows={(data.by_country || []).slice(0, 5).map((c) => ({ ...c, name: c.key }))} valueKey="count" labelKey="name" linkFor={(r) => `/admin/leads?country=${encodeURIComponent(r.key)}`} />
                  <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Industry</p>
                  <BarList rows={(data.by_industry || []).slice(0, 5).map((c) => ({ ...c, name: productName(c.key) }))} valueKey="count" labelKey="name" color={SERIES.sqls} linkFor={(r) => `/admin/leads?industry=${r.key}`} />
                </>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
