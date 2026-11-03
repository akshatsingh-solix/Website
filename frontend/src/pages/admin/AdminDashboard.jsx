import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Eye, Flame, Loader2, RefreshCw, Sparkles, Table2, Target, Trophy, UserPlus, UserX, Crosshair, Send, MessageCircleHeart, Zap, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAdminCache, fetchLeadsMeta, fetchOutboundKpis, fetchOverview, fetchRadarSummary, formatApiError } from "@/lib/adminApi";
import { BarList, CHANNEL_LABELS, LINE_SHORT, Panel, SERIES, STAGE_LABELS, StatTile, productName, selectCls, useLiveRefresh } from "@/components/admin/kit";
import { useAdmin } from "@/components/admin/AdminAuth";
import { useChartInk } from "@/components/admin/theme";
import { CountUp, EASE, LiveDot, Reveal, Segmented } from "@/components/admin/motion";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "365", label: "12 months" },
  { key: "custom", label: "Custom" },
];
const RANGE_WORDS = { 7: "the last 7 days", 30: "the last 30 days", 90: "the last 90 days", 365: "the last 12 months", custom: "this period" };

// Extra accents beside the three validated series, for tiles and channels.
const ACCENT = { visitors: "#38bdf8", won: "#f5b83d", alert: "#ee2424", violet: "#8b7cf6" };
const CHANNEL_COLORS = [SERIES.leads, SERIES.mqls, SERIES.sqls, ACCENT.won, ACCENT.violet, ACCENT.visitors, "#e05d8c", "#94a3b8"];

const ChartTip = ({ active, payload, label, fmtLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-glass rounded-xl px-3 py-2 text-xs">
      {label != null && <p className="mb-1 font-medium text-foreground">{fmtLabel ? fmtLabel(label) : label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill || p.fill, boxShadow: `0 0 8px ${p.color || p.payload?.fill}` }} /> {p.name}: <span className="font-mono text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const pct = (v) => (v == null ? "—" : `${v}%`);
const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const greeting = (h) => (h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
const firstName = (u) => {
  const n = (u?.name || "").trim().split(/\s+/)[0];
  if (n) return n;
  const local = (u?.email || "").split("@")[0].split(/[._-]/)[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "there";
};

export default function AdminDashboard() {
  const { user } = useAdmin();
  const chart = useChartInk();
  const axis = { stroke: chart.grid, tick: { fill: chart.ink, fontSize: 11 }, tickLine: false, axisLine: false };
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [line, setLine] = useState("all");
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendTable, setTrendTable] = useState(false);
  const [tick, setTick] = useState(0);
  const [syncedAt, setSyncedAt] = useState(null);

  useEffect(() => {
    fetchLeadsMeta().then(setMeta).catch(() => {});
  }, []);
  useEffect(() => {
    const onRefresh = () => setTick((t) => t + 1);
    window.addEventListener("solix:admin-refresh", onRefresh);
    return () => window.removeEventListener("solix:admin-refresh", onRefresh);
  }, []);

  const params = useMemo(() => {
    if (range === "custom" && (!from || !to)) return null;
    return range === "custom" ? { date_from: from, date_to: to, line } : { days: Number(range), line };
  }, [range, from, to, line]);
  useLiveRefresh(() => params && fetchOverview(params, { fresh: true }).then((d) => { setData(d); setSyncedAt(new Date()); }));

  useEffect(() => {
    if (!params) return;
    let alive = true;
    setLoading(true);
    fetchOverview(params)
      .then((d) => { if (alive) { setData(d); setSyncedAt(new Date()); } })
      .catch((e) => toast.error(formatApiError(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [params, tick]);

  const k = data?.kpis;
  const series = (key) => (data?.trend || []).map((d) => d[key] || 0);
  const lineRows = useMemo(() => (data?.by_line || []).map((r) => ({ ...r, name: LINE_SHORT[r.key] || r.label })), [data]);
  const channelRows = useMemo(() => (data?.by_channel || []).filter((r) => r.leads || r.mqls).map((r) => ({ ...r, name: CHANNEL_LABELS[r.key] || r.key })).sort((a, b) => b.leads - a.leads), [data]);
  const funnelRows = useMemo(() => (data?.funnel || []).map((r) => ({ ...r, name: r.stage === "visitors" ? "New visitors" : STAGE_LABELS[r.stage] })), [data]);
  const leadsLink = (extra) => `/admin/leads?${new URLSearchParams({ ...(line !== "all" ? { line } : {}), ...extra })}`;
  const hour = new Date().getHours();

  return (
    <div data-testid="admin-dashboard">
      {/* Greeting and a one-line read of the period, like a morning brief. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Leadership overview · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            {greeting(hour)}, <span className="bg-gradient-to-r from-[#38bdf8] via-[#3987e5] to-[#ee2424] bg-clip-text text-transparent">{firstName(user)}</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base" data-testid="dashboard-brief">
            {k ? (
              <>
                <span className="text-foreground">{k.leads} new leads</span> and <span className="text-foreground">{k.mqls} MQLs</span> in {RANGE_WORDS[range]}
                {k.unassigned_mqls ? <>, and <Link to="/admin/leads?stage=mql&owner=unassigned" className="text-primary-ink underline-offset-4 hover:underline">{k.unassigned_mqls} MQL{k.unassigned_mqls === 1 ? "" : "s"} waiting for an owner</Link>.</> : <>. Every MQL has an owner.</>}
              </>
            ) : (
              "Pipeline by product and service. Click any number to open the matching leads."
            )}
          </p>
        </Reveal>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <LiveDot /> {syncedAt ? `Synced ${syncedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : "Connecting…"}
        </div>
      </div>

      {/* Filters: one row above every chart */}
      <div className="admin-glass mt-8 flex flex-wrap items-center gap-2 rounded-2xl p-2.5" data-testid="dashboard-filters">
        <Segmented options={RANGES} value={range} onChange={setRange} layoutId="dash-range" label="Date range" testIdPrefix="range" />
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40 rounded-full border-line/15 bg-transparent text-xs" aria-label="From" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40 rounded-full border-line/15 bg-transparent text-xs" aria-label="To" />
          </div>
        )}
        <select value={line} onChange={(e) => setLine(e.target.value)} className={cn(selectCls, "h-9 rounded-full bg-transparent text-xs")} aria-label="Product line" data-testid="dashboard-line">
          <option value="all">All product lines</option>
          {(meta?.lines || []).map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
        <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={() => { clearAdminCache(); setTick((t) => t + 1); }} aria-label="Refresh">{loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}</Button>
      </div>

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <div className={cn("mt-6 space-y-6 transition-opacity duration-300", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              <StatTile key="v" label="New visitors" value={k.new_visitors.toLocaleString()} sub={`${k.active_visitors.toLocaleString()} active`} testId="kpi-visitors" icon={Eye} accent={ACCENT.visitors} spark={series("visitors")} />,
              <Link key="l" to={leadsLink({ date_from: data.window.from.slice(0, 10) })}><StatTile label="New leads" value={k.leads} sub={`${pct(k.visitor_to_lead)} of new visitors`} testId="kpi-leads" icon={UserPlus} accent={SERIES.leads} spark={series("leads")} /></Link>,
              <Link key="m" to={leadsLink({ stage: "mql_plus", date_field: "mql_at", date_from: data.window.from.slice(0, 10) })}><StatTile label="MQLs" value={k.mqls} sub={`${pct(k.lead_to_mql)} of leads`} testId="kpi-mqls" icon={Flame} accent={SERIES.mqls} spark={series("mqls")} /></Link>,
              <Link key="s" to={leadsLink({ stage: "sql_plus" })}><StatTile label="SQL or later" value={k.sqls} sub={`${pct(k.mql_to_sql)} of MQLs`} testId="kpi-sqls" icon={Target} accent={SERIES.sqls} /></Link>,
              <StatTile key="w" label="Won" value={k.won} sub="Closed in this period" testId="kpi-won" icon={Trophy} accent={ACCENT.won} />,
              <Link key="u" to="/admin/leads?stage=mql&owner=unassigned"><StatTile label="Unassigned MQLs" value={k.unassigned_mqls} sub={k.unassigned_mqls ? "Need an owner" : "All assigned"} testId="kpi-unassigned" icon={UserX} accent={k.unassigned_mqls ? ACCENT.alert : SERIES.sqls} /></Link>,
            ].map((tile, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.05 * i }}>{tile}</motion.div>
            ))}
          </div>

          <CompetitiveStrip />

          <Panel
            title="Leads and MQLs over time"
            sub="Daily count · hover for exact values"
            testId="panel-trend"
            action={
              <div className="flex items-center gap-4">
                <div className="hidden items-baseline gap-4 sm:flex">
                  <Legendish color={SERIES.leads} label="Leads" value={k.leads} />
                  <Legendish color={SERIES.mqls} label="MQLs" value={k.mqls} />
                </div>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setTrendTable((v) => !v)}><Table2 /> {trendTable ? "Chart" : "Table"}</Button>
              </div>
            }
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
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                    <defs>
                      {[["leads", SERIES.leads], ["mqls", SERIES.mqls]].map(([key, c]) => (
                        <linearGradient key={key} id={`dash-${key}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={0.38} />
                          <stop offset="100%" stopColor={c} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid vertical={false} stroke={chart.grid} strokeDasharray="3 6" />
                    <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip content={<ChartTip fmtLabel={shortDate} />} cursor={{ stroke: chart.cursor, strokeDasharray: "4 4" }} />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke={SERIES.leads} strokeWidth={2.2} fill="url(#dash-leads)" dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: chart.ring }} animationDuration={1200} animationEasing="ease-out" />
                    <Area type="monotone" dataKey="mqls" name="MQLs" stroke={SERIES.mqls} strokeWidth={2.2} fill="url(#dash-mqls)" dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: chart.ring }} animationDuration={1400} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="By product line" sub="Leads created, MQLs reached and SQL-or-later in the period" testId="panel-lines">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineRows} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }} barGap={2} barCategoryGap="28%">
                    <CartesianGrid horizontal={false} stroke={chart.grid} strokeDasharray="3 6" />
                    <XAxis type="number" allowDecimals={false} {...axis} />
                    <YAxis type="category" dataKey="name" width={130} {...axis} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgb(var(--line) / 0.04)" }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: chart.ink }} />
                    <Bar dataKey="leads" name="Leads" fill={SERIES.leads} radius={[0, 6, 6, 0]} maxBarSize={10} animationDuration={900} />
                    <Bar dataKey="mqls" name="MQLs" fill={SERIES.mqls} radius={[0, 6, 6, 0]} maxBarSize={10} animationDuration={1100} />
                    <Bar dataKey="sqls" name="SQL+" fill={SERIES.sqls} radius={[0, 6, 6, 0]} maxBarSize={10} animationDuration={1300} />
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
              <StageFunnel rows={funnelRows} leadsLink={leadsLink} />
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Lead sources" sub="First-touch channel" testId="panel-channels">
              <SourceDonut rows={channelRows} />
            </Panel>
            <Panel title="Product interest" sub="Decayed intent score across active visitors" testId="panel-interest">
              <BarList rows={(data.product_interest || []).slice(0, 8).map((p) => ({ ...p, name: productName(p.slug) }))} valueKey="score" labelKey="name" color={SERIES.sqls} format={(v) => Math.round(v)} linkFor={(r) => `/admin/leads?product=${r.slug}`} />
            </Panel>
            <Panel title="Owners" sub="Leads created this period, by owner" testId="panel-owners">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 font-normal">Owner</th><th className="font-normal">Leads</th><th className="font-normal">MQL+</th><th className="font-normal">SQL+</th></tr></thead>
                <tbody>
                  {(data.owners || []).slice(0, 8).map((o) => {
                    const name = meta?.owners?.find((m) => m.email === o.owner)?.name || o.owner;
                    return (
                      <tr key={o.owner} className="border-t border-line/5">
                        <td className="max-w-[160px] py-1.5">
                          <Link to={`/admin/leads?owner=${encodeURIComponent(o.owner)}`} className="flex items-center gap-2 hover:text-teal">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-line/10 font-display text-[9px] font-semibold uppercase">{o.owner === "unassigned" ? "?" : name.slice(0, 2)}</span>
                            <span className="truncate">{name}</span>
                          </Link>
                        </td>
                        <td className="font-mono text-xs">{o.leads}</td><td className="font-mono text-xs">{o.mqls}</td><td className="font-mono text-xs">{o.sqls}</td>
                      </tr>
                    );
                  })}
                  {!data.owners?.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No leads in this period yet.</td></tr>}
                </tbody>
              </table>
            </Panel>
          </div>

          {data.influence && <Influence inf={data.influence} />}

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

const Legendish = ({ color, label, value }) => (
  <span className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
    <span className="h-2 w-2 translate-y-[-1px] rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    {label} <CountUp value={value} className="font-display text-base font-medium text-foreground" />
  </span>
);

// Shimmering placeholders in the shape of the page, so the first load feels quick.
const DashboardSkeleton = () => (
  <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading the dashboard">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="admin-glass h-[132px] animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />)}
    </div>
    <div className="admin-glass h-80 animate-pulse rounded-2xl" />
  </div>
);

/**
 * Stage funnel: centred pills that taper with the count, each showing the
 * share of the previous step. Reads top to bottom, opens the matching leads.
 */
function StageFunnel({ rows, leadsLink }) {
  const reduce = useReducedMotion();
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data in this period yet.</p>;
  const leadsTop = rows[1]?.count || 0;
  const colors = [ACCENT.visitors, SERIES.leads, SERIES.mqls, ACCENT.violet, ACCENT.won, "#f97316", SERIES.sqls];
  return (
    <ul className="space-y-2" data-testid="funnel-list">
      {rows.map((r, i) => {
        const base = r.stage === "visitors" ? Math.max(r.count, 1) : Math.max(leadsTop, 1);
        const width = r.stage === "visitors" ? 100 : 34 + 58 * (r.count / base);
        const share = r.stage !== "visitors" && leadsTop ? Math.round((100 * r.count) / leadsTop) : null;
        const c = colors[i % colors.length];
        const body = (
          <motion.div
            className="relative mx-auto flex items-center justify-between gap-3 overflow-hidden rounded-full border border-line/10 px-4 py-2"
            style={{ background: `linear-gradient(90deg, ${c}22, ${c}0d)` }}
            initial={reduce ? false : { width: "20%", opacity: 0 }}
            whileInView={{ width: `${width}%`, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.07 * i }}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <CountUp value={r.count} className="font-display text-base font-medium" />
              {share != null && <span className="font-mono text-[10px] text-muted-foreground">{share}%</span>}
            </span>
          </motion.div>
        );
        const stageQuery = { lead: {}, mql: { stage: "mql_plus" }, sql: { stage: "sql_plus" } }[r.stage];
        return (
          <li key={r.stage}>
            {stageQuery ? <Link to={leadsLink(stageQuery)} className="block transition-opacity hover:opacity-85">{body}</Link> : body}
          </li>
        );
      })}
    </ul>
  );
}

/** Donut of first-touch channels with the total in the middle and a legend list. */
function SourceDonut({ rows }) {
  const [hover, setHover] = useState(null);
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data in this period yet.</p>;
  const total = rows.reduce((a, r) => a + r.leads, 0);
  const focus = hover != null ? rows[hover] : null;
  return (
    <div>
      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="leads" nameKey="name" innerRadius="70%" outerRadius="100%" paddingAngle={2.5} cornerRadius={6} stroke="none"
              onMouseEnter={(_, i) => setHover(i)} onMouseLeave={() => setHover(null)} animationDuration={1100} startAngle={90} endAngle={-270}>
              {rows.map((r, i) => <Cell key={r.key} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} opacity={hover == null || hover === i ? 1 : 0.35} style={{ transition: "opacity .25s", outline: "none" }} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <CountUp value={focus ? focus.leads : total} className="block font-display text-3xl font-medium" />
            <span className="block max-w-[96px] truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{focus ? focus.name : "leads"}</span>
          </div>
        </div>
      </div>
      <ul className="mt-5 space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <Link to={`/admin/leads?channel=${r.key}`} className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors", hover === i ? "bg-line/[0.06]" : "hover:bg-line/[0.04]")}>
              <span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} /><span className="truncate">{r.name}</span></span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.leads} · {r.mqls} MQL</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Radar + outbound at a glance; each tile opens the page behind it.
function CompetitiveStrip() {
  const [radar, setRadar] = useState(null);
  const [out, setOut] = useState(null);
  useEffect(() => {
    fetchRadarSummary({}).then(setRadar).catch(() => {});
    fetchOutboundKpis(7).then(setOut).catch(() => {});
  }, []);
  if (!radar) return null;
  return (
    <Reveal>
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><span className="h-px w-6 bg-gradient-to-r from-transparent to-primary" /> Competitive engine · Radar and outbound</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="competitive-strip">
      <Link to="/admin/radar?strength=Strong"><StatTile label="Strong Radar accounts" value={radar.by_strength?.Strong ?? 0} sub={`${radar.accounts} with a competitive signal`} icon={Crosshair} accent={ACCENT.alert} /></Link>
      <Link to="/admin/radar?tab=ready"><StatTile label="Ready for outreach" value={radar.ready} sub={`of ${radar.deep_dives} deep dives`} icon={Rocket} accent={SERIES.sqls} /></Link>
      <Link to="/admin/radar?tab=surge"><StatTile label="Surging accounts" value={radar.surging} sub="3+ signals in 7 days" icon={Zap} accent={ACCENT.won} /></Link>
      <Link to="/admin/radar?tab=new"><StatTile label="New for you" value={radar.fresh.new + radar.fresh.updated} sub={`${radar.new_today} signals today`} icon={Sparkles} accent={ACCENT.violet} /></Link>
      <Link to="/admin/outbound"><StatTile label="Outbound sends (7d)" value={out?.sends ?? "—"} sub={out?.bounce_rate != null ? `${out.bounce_rate}% bounce` : "No sends yet"} icon={Send} accent={SERIES.leads} /></Link>
      <Link to="/admin/outbound?tab=replies"><StatTile label="Positive replies (7d)" value={out?.positive ?? "—"} sub={out?.pending_approval ? `${out.pending_approval} waiting for approval` : "Approvals clear"} icon={MessageCircleHeart} accent={SERIES.mqls} /></Link>
      </div>
    </Reveal>
  );
}

const ACCOUNT_STEPS = { signal: "With a signal", contacted: "Contacted", replied: "Replied", meeting_booked: "Meeting booked", opportunity: "Opportunity", won: "Won" };

// How much of the funnel the Radar and outbound produced, each number opening the leads or accounts behind it.
function Influence({ inf }) {
  const rows = [
    ["From Radar accounts", "Leads whose company is on the Radar", inf.radar_accounts, "/admin/leads?linked=radar"],
    ["Sourced by outbound", "First touch was an outbound email", inf.outbound_sourced, "/admin/leads?channel=outbound"],
    ["Touched by outbound", "Any outbound contact, inbound first or not", inf.outbound_touched, "/admin/leads?linked=outbound"],
  ];
  const top = inf.account_funnel?.[0]?.count || 0;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Pipeline from the Radar and outbound" sub={`Leads created this period · ${inf.sends} outbound emails sent · ${inf.positive_replies} positive replies`} testId="panel-influence">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 font-normal">Source</th><th className="font-normal">Leads</th><th className="font-normal">SQL+</th><th className="font-normal">Won</th></tr></thead>
          <tbody>
            {rows.map(([label, help, r, to]) => (
              <tr key={label} className="border-t border-line/5">
                <td className="py-1.5"><Link to={to} className="hover:text-teal">{label}</Link><p className="text-[11px] text-muted-foreground">{help}</p></td>
                <td className="font-mono text-xs">{r.leads}</td><td className="font-mono text-xs">{r.sqls}</td><td className="font-mono text-xs">{r.won}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Radar accounts: signal to won" sub="Accounts with a competitive signal, by how far they have got (all time)" testId="panel-account-funnel">
        <BarList rows={(inf.account_funnel || []).map((r) => ({ ...r, name: ACCOUNT_STEPS[r.status] || r.status }))} valueKey="count" labelKey="name" color={SERIES.sqls}
          format={(v, r) => (r.status === "signal" || !top ? v.toLocaleString() : `${v} · ${Math.round((100 * v) / top)}%`)}
          linkFor={(r) => (r.status === "signal" ? "/admin/radar" : `/admin/radar?status=${r.status}`)} />
      </Panel>
    </div>
  );
}
