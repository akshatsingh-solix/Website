// Competitive view for one country: market share of organic search, who is
// growing, head-to-head comparison and the keywords rivals win that you don't.
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import { Panel } from "@/components/admin/kit";
import { cn } from "@/lib/utils";
import { useDrill } from "@/components/admin/seo/Drill";
import { C, ChartTip, Delta, GRID, Kpi, PosBadge, Table, axis } from "@/components/admin/seo/ui";
import { GEO_LABELS, fmtMoney, fmtN, gapOpportunities, market } from "@/lib/seo/model";

const METRICS = [
  ["traffic", "Organic visits"], ["keywords", "Keywords"], ["authority", "Authority"], ["traffic_cost", "Traffic value"], ["ref_domains", "Referring domains"], ["growth", "12-mo growth %"],
];

export default function Competitors({ snap, go }) {
  const drill = useDrill();
  const [metric, setMetric] = useState("traffic");
  const [focus, setFocus] = useState(null);
  const mk = useMemo(() => market(snap), [snap]);
  const me = mk.find((m) => m.self);
  const gaps = useMemo(() => gapOpportunities(snap), [snap]);
  const known = new Set([snap.domain, ...(snap.competitors || []).map((c) => c.domain)]);
  const discovered = (snap.discovered_competitors || []).filter((d) => !known.has(d.domain)).slice(0, 10);
  const growing = mk.filter((m) => !m.self && (m.growth ?? 0) > me.growth).length;
  const chart = mk.map((m) => ({ ...m, label: m.self ? "You" : m.name || m.domain, value: m[metric] ?? 0 })).sort((a, b) => b.value - a.value);
  const fmt = metric === "traffic_cost" ? fmtMoney : metric === "growth" ? (v) => `${v?.toFixed(0)}%` : fmtN;

  return (
    <div className="space-y-6" data-testid="seo-competitors">
      {(snap.competitors || []).length < 10 && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-100"><AlertTriangle className="h-4 w-4" /> Only {(snap.competitors || []).length} competitors are set for {GEO_LABELS[snap.geo]}. Add at least 10 in <button type="button" className="underline" onClick={() => go("settings")}>Settings</button> for a fair comparison.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Your share of search" value={`${me.share.toFixed(1)}%`} sub={`#${me.position} of ${mk.length} tracked domains`} />
        <Kpi label="Market leader" value={mk[0].self ? "You" : mk[0].name} sub={`${mk[0].share.toFixed(1)}% share · ${fmtN(mk[0].traffic)} visits/mo`} onClick={mk[0].self ? undefined : () => drill({ type: "competitor", data: mk[0] })} />
        <Kpi label="Growing faster than you" value={growing} sub={`of ${mk.length - 1} competitors, over 12 months`} />
        <Kpi label="Keyword gaps" value={fmtN(gaps.length)} sub="Keywords rivals rank for and you don't" />
      </div>

      <Panel title={`Head to head · ${GEO_LABELS[snap.geo]}`} sub="You in blue; click a bar to compare in detail" action={
        <div className="flex flex-wrap gap-1">{METRICS.map(([k, l]) => <button key={k} type="button" onClick={() => setMetric(k)} className={cn("rounded-full px-3 py-1 text-xs", metric === k ? "bg-line/15 text-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>)}</div>
      }>
        <div style={{ height: Math.max(260, chart.length * 26) }}>
          <ResponsiveContainer>
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap={4}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={fmt} />
              <YAxis type="category" dataKey="label" {...axis} width={120} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTip fmtValue={(v) => fmt(v)} />} />
              <Bar dataKey="value" name={METRICS.find((m) => m[0] === metric)[1]} radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(d) => { if (!d.self) { setFocus(d.domain); drill({ type: "competitor", data: d }); } }}>
                {chart.map((d) => <Cell key={d.domain} fill={d.self ? C.you : d.domain === focus ? C.rival : C.faint} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Competitive landscape" sub="All tracked competitors in this country. Click a row for trend and top keywords.">
        <Table rows={mk} onRow={(r) => !r.self && drill({ type: "competitor", data: r })} initialSort={{ key: "traffic", dir: -1 }} testId="seo-competitor-table" columns={[
          { key: "domain", label: "Domain", sort: (r) => r.domain, render: (r) => <span className={r.self ? "font-medium text-sky-300" : ""}>{r.self ? `${r.domain} (you)` : <>{r.name} <span className="text-xs text-muted-foreground">{r.domain}</span></>}</span> },
          { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
          { key: "share", label: "Share", render: (r) => `${r.share.toFixed(1)}%`, align: "right" },
          { key: "growth", label: "12-mo", render: (r) => <Delta value={r.growth} />, align: "right" },
          { key: "keywords", label: "Keywords", render: (r) => fmtN(r.keywords), align: "right" },
          { key: "kwGrowth", label: "KW 12-mo", render: (r) => <Delta value={r.kwGrowth} />, align: "right" },
          { key: "authority", label: "Authority", align: "right" },
          { key: "common_keywords", label: "Shared KWs", render: (r) => fmtN(r.common_keywords), align: "right" },
          { key: "paid_keywords", label: "Paid KWs", render: (r) => fmtN(r.paid_keywords), align: "right" },
        ]} />
      </Panel>

      <Panel title="Keyword gap" sub="Rivals rank for these; you don't rank or sit below #20. Scored by volume, ease and how well rivals rank.">
        <Table rows={gaps} limit={15} initialSort={{ key: "score", dir: -1 }} onRow={(g) => drill({ type: "keyword", data: { ...g, position: g.mine, prev_position: null, traffic: 0, serp: [], owned: [], trend: [] } })} columns={[
          { key: "keyword", label: "Keyword", sort: (r) => r.keyword },
          { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
          { key: "kd", label: "KD", align: "right" },
          { key: "best", label: "Best rival", render: (r) => <PosBadge pos={r.best} />, align: "right" },
          { key: "rivals", label: "Rivals ranking", align: "right" },
          { key: "mine", label: "You", sort: (r) => r.mine ?? 999, render: (r) => <PosBadge pos={r.mine} />, align: "right" },
          { key: "score", label: "Priority", render: (r) => fmtN(r.score), align: "right" },
        ]} />
      </Panel>

      {discovered.length > 0 && (
        <Panel title="Competitors Semrush sees that you're not tracking" sub="Domains with the most keyword overlap in this country" action={<button type="button" onClick={() => go("settings")} className="text-xs text-teal hover:underline">Edit competitor set</button>}>
          <Table rows={discovered} initialSort={{ key: "common_keywords", dir: -1 }} columns={[
            { key: "domain", label: "Domain" },
            { key: "common_keywords", label: "Shared KWs", render: (r) => fmtN(r.common_keywords), align: "right" },
            { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
            { key: "relevance", label: "Relevance", render: (r) => (r.relevance != null ? r.relevance.toFixed(2) : "—"), align: "right" },
          ]} />
        </Panel>
      )}
    </div>
  );
}
