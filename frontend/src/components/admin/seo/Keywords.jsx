// Keyword performance: where you rank, what moved, the quick wins, and how
// demand is shifting across the whole category (not just your keywords).
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, selectCls } from "@/components/admin/kit";
import { Input } from "@/components/ui/input";
import { useDrill } from "@/components/admin/seo/Drill";
import { C, ChartTip, Delta, FeatureChips, GRID, IntentChip, Kpi, Move, PosBadge, Spark, Table, axis, shortUrl } from "@/components/admin/seo/ui";
import { BUCKETS, INTENTS, LINES, cannibalised, classify, fmtN, industryDemand, isBrand, movers, positionBuckets, strikingDistance } from "@/lib/seo/model";

const kwCols = (extra = []) => [
  { key: "keyword", label: "Keyword", sort: (r) => r.keyword, render: (r) => <span className="block max-w-[260px] truncate">{r.keyword}</span> },
  { key: "position", label: "Pos", render: (r) => <PosBadge pos={r.position} />, align: "right" },
  { key: "move", label: "Move", sort: (r) => (r.prev_position ? r.prev_position - r.position : 0), render: (r) => <Move from={r.prev_position} to={r.position} />, align: "right" },
  { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
  { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
  ...extra,
];

const MoverList = ({ rows, empty, onPick }) => (
  rows.length ? (
    <ul className="divide-y divide-line/5">
      {rows.slice(0, 8).map((k) => (
        <li key={k.keyword + k.url}><button type="button" onClick={() => onPick(k)} className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:opacity-80">
          <span className="min-w-0 truncate">{k.keyword}<span className="block text-xs text-muted-foreground">{fmtN(k.volume)}/mo{k.prev_position ? ` · was #${k.prev_position}` : ""}</span></span>
          <span className="flex shrink-0 items-center gap-2"><Move from={k.prev_position} to={k.position} /><PosBadge pos={k.position} /></span>
        </button></li>
      ))}
    </ul>
  ) : <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
);

export default function Keywords({ snap, brand }) {
  const drill = useDrill();
  const open = (k) => drill({ type: "keyword", data: k });
  const [q, setQ] = useState("");
  const [bucket, setBucket] = useState("all");
  const [intent, setIntent] = useState("all");
  const [line, setLine] = useState("all");
  const [kind, setKind] = useState("all");
  const kws = snap.keywords;
  const buckets = positionBuckets(kws);
  const mv = useMemo(() => movers(kws), [kws]);
  const sd = useMemo(() => strikingDistance(kws), [kws]);
  const cannib = useMemo(() => cannibalised(kws), [kws]);
  const demand = useMemo(() => industryDemand(snap), [snap]);
  const lineOf = useMemo(() => Object.fromEntries(kws.map((k) => [k.keyword + k.url, classify(k.url, k.keyword).line])), [kws]);
  const b = BUCKETS.find((x) => x.key === bucket);
  const shown = kws.filter((k) =>
    (!q || k.keyword.includes(q.toLowerCase())) && (!b || b.test(k.position)) && (intent === "all" || (k.intent || []).includes(+intent)) &&
    (line === "all" || lineOf[k.keyword + k.url] === line) && (kind === "all" || (kind === "brand") === isBrand(k.keyword, brand)));
  const top = kws.slice().sort((a, b2) => b2.traffic - a.traffic);

  return (
    <div className="space-y-6" data-testid="seo-keywords">
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Tracked keywords" value={fmtN(kws.length)} sub={`of ${fmtN(snap.overview.keywords)} ranking`} />
        <Kpi label="Top 3" value={buckets[0].count} onClick={() => setBucket("1-3")} />
        <Kpi label="Top 10" value={buckets[0].count + buckets[1].count} onClick={() => setBucket("4-10")} />
        <Kpi label="Improved" value={mv.up.length} sub="positions gained" />
        <Kpi label="Declined" value={mv.down.length} sub="positions lost" />
        <Kpi label="New" value={mv.new.length} sub="started ranking" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Position distribution" sub="How many keywords sit in each band">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={buckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} allowDecimals={false} width={40} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTip />} />
                <Bar dataKey="count" name="Keywords" radius={[4, 4, 0, 0]} onClick={(d) => setBucket(d.key)} className="cursor-pointer">
                  {buckets.map((x) => <Cell key={x.key} fill={bucket === x.key ? C.rival : C.you} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Top-performing keywords" sub="By estimated visits">
          <MoverList rows={top} onPick={open} empty="No keywords yet." />
        </Panel>
        <Panel title="Biggest movers" sub="Since the previous Semrush update">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">Gained</p>
          <MoverList rows={mv.up.slice(0, 4)} onPick={open} empty="No gains this period." />
          <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">Lost</p>
          <MoverList rows={mv.down.slice(0, 4)} onPick={open} empty="No losses this period." />
        </Panel>
      </div>

      <Panel title="Quick wins: striking distance" sub="Ranking 4–20. Upside is the extra monthly visits from reaching the top 3.">
        <Table rows={sd} limit={10} onRow={open} initialSort={{ key: "upside", dir: -1 }} columns={kwCols([
          { key: "kd", label: "Difficulty", align: "right" },
          { key: "upside", label: "Upside", render: (r) => `+${fmtN(r.upside)}`, align: "right" },
          { key: "url", label: "Page", sort: (r) => r.url, render: (r) => <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{shortUrl(r.url)}</span> },
        ])} />
      </Panel>

      <Panel title="All keywords" sub="Filter, sort and click any keyword for its detail">
        <div className="mb-4 flex flex-wrap gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search keywords…" className="h-10 w-full max-w-xs border-line/15 bg-background text-sm" data-testid="seo-kw-search" />
          <select value={bucket} onChange={(e) => setBucket(e.target.value)} className={selectCls}><option value="all">Any position</option>{BUCKETS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
          <select value={intent} onChange={(e) => setIntent(e.target.value)} className={selectCls}><option value="all">Any intent</option>{Object.entries(INTENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={line} onChange={(e) => setLine(e.target.value)} className={selectCls}><option value="all">All product lines</option>{LINES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}><option value="all">Brand + non-brand</option><option value="brand">Brand</option><option value="nonbrand">Non-brand</option></select>
        </div>
        <Table rows={shown} limit={30} onRow={open} initialSort={{ key: "traffic", dir: -1 }} testId="seo-kw-table" columns={kwCols([
          { key: "kd", label: "KD", align: "right" },
          { key: "cpc", label: "CPC", render: (r) => (r.cpc ? `$${r.cpc}` : "—"), align: "right" },
          { key: "intent", label: "Intent", nosort: true, render: (r) => <IntentChip intent={r.intent} /> },
          { key: "serp", label: "Answer features", nosort: true, render: (r) => <FeatureChips serp={r.serp} owned={r.owned} onlyAnswer /> },
        ])} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Changes across the industry" sub="12-month search demand for category keywords (whether you rank or not)" className="xl:col-span-3">
          <Table rows={demand.rows} initialSort={{ key: "change", dir: -1 }} columns={[
            { key: "keyword", label: "Category keyword", sort: (r) => r.keyword },
            { key: "trend", label: "12 months", nosort: true, render: (r) => <Spark values={r.trend} color={(r.change ?? 0) >= 0 ? C.you : C.rival} /> },
            { key: "change", label: "Demand", render: (r) => <Delta value={r.change} />, align: "right" },
            { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
            { key: "mine", label: "Your pos", sort: (r) => kws.find((k) => k.keyword === r.keyword)?.position ?? 999, render: (r) => <PosBadge pos={kws.find((k) => k.keyword === r.keyword)?.position} />, align: "right" },
          ]} />
        </Panel>
        <Panel title="Cannibalisation" sub="Keywords where two of your pages compete" className="xl:col-span-2">
          {cannib.length ? (
            <ul className="space-y-3 text-sm">{cannib.slice(0, 8).map((c) => (
              <li key={c.keyword}><p className="font-medium">{c.keyword} <span className="text-xs text-muted-foreground">· {fmtN(c.volume)}/mo</span></p>
                {c.urls.map((u) => <p key={u.url} className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="truncate">{shortUrl(u.url)}</span><PosBadge pos={u.position} /></p>)}</li>
            ))}</ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No keyword is split across two pages. Good.</p>}
          <p className="mt-4 text-xs text-muted-foreground">Fix by merging the weaker page into the stronger one, or making each target a distinct intent.</p>
        </Panel>
      </div>
    </div>
  );
}

