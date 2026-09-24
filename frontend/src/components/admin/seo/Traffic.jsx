// Traffic: the overall trend, then where it lands - by product line, by
// asset type (product pages, knowledge base, white papers...) and page by page.
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, selectCls } from "@/components/admin/kit";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDrill } from "@/components/admin/seo/Drill";
import { BarList, C, ChartTip, Delta, GRID, Kpi, Table, axis, monthTick, shortUrl } from "@/components/admin/seo/ui";
import { ASSET_NAME, INTENTS, LINES, LINE_NAME, change, fmtMoney, fmtN, isBrand, pagesWithSignals, sections } from "@/lib/seo/model";

const Seg = ({ value, onChange, options }) => (
  <div className="inline-flex rounded-full border border-line/15 p-0.5 text-xs">
    {options.map(([k, l]) => <button key={k} type="button" onClick={() => onChange(k)} className={cn("rounded-full px-3 py-1 transition-colors", value === k ? "bg-line/15 text-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>)}
  </div>
);

export default function Traffic({ snap, brand }) {
  const drill = useDrill();
  const [by, setBy] = useState("line");
  const [line, setLine] = useState("all");
  const [asset, setAsset] = useState("all");
  const [q, setQ] = useState("");
  const hist = snap.history || [];
  const secs = useMemo(() => sections(snap, by), [snap, by]);
  const pages = useMemo(() => pagesWithSignals(snap), [snap]);
  const shown = pages.filter((p) => (line === "all" || p.line === line) && (asset === "all" || p.asset === asset) && (!q || p.url.toLowerCase().includes(q.toLowerCase())));
  const brandTraffic = snap.keywords.filter((k) => isBrand(k.keyword, brand)).reduce((s, k) => s + k.traffic, 0);
  const kwTraffic = snap.keywords.reduce((s, k) => s + k.traffic, 0) || 1;
  const intents = Object.entries(INTENTS).map(([code, name]) => ({ name, traffic: snap.keywords.filter((k) => (k.intent || []).includes(+code)).reduce((s, k) => s + k.traffic, 0) }));
  const mom = hist.length > 1 ? change(hist[hist.length - 1].traffic, hist[hist.length - 2].traffic) : null;
  const assets = [...new Set(pages.map((p) => p.asset))];

  return (
    <div className="space-y-6" data-testid="seo-traffic">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Organic visits / mo" value={fmtN(hist[hist.length - 1]?.traffic)} delta={mom} deltaLabel="vs last month" />
        <Kpi label="Non-brand share" value={`${Math.round(100 - (100 * brandTraffic) / kwTraffic)}%`} sub="Visits from people not already searching for you" />
        <Kpi label="Pages earning traffic" value={fmtN(pages.filter((p) => p.traffic > 0).length)} sub={`Top 10 pages bring ${Math.round(pages.slice().sort((a, b) => b.traffic - a.traffic).slice(0, 10).reduce((s, p) => s + p.traffic_pct, 0))}% of visits`} />
        <Kpi label="Paid search" value={fmtN(snap.overview.paid_traffic)} sub={`${fmtN(snap.overview.paid_keywords)} paid keywords`} />
      </div>

      <Panel title="Organic visits, last 12 months" sub="Estimated from rankings and search volume" action={<button type="button" className="text-xs text-teal hover:underline" onClick={() => drill({ type: "metric", data: { title: "Organic visits", sub: "Monthly", data: hist, lines: [{ key: "traffic", name: "Visits", color: C.you }] } })}>Table view</button>}>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={hist} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs><linearGradient id="seoTraffic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.you} stopOpacity={0.35} /><stop offset="100%" stopColor={C.you} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" {...axis} tickFormatter={monthTick} />
              <YAxis {...axis} tickFormatter={fmtN} width={48} />
              <Tooltip content={<ChartTip fmtLabel={(d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })} />} />
              <Area type="monotone" dataKey="traffic" name="Organic visits" stroke={C.you} strokeWidth={2} fill="url(#seoTraffic)" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Where the traffic lands" sub="Click a row for its pages" className="xl:col-span-3" action={<Seg value={by} onChange={setBy} options={[["line", "Product line"], ["asset", "Asset type"]]} />}>
          <Table rows={secs} onRow={(r) => drill({ type: "section", data: r })} initialSort={{ key: "traffic", dir: -1 }} columns={[
            { key: "name", label: by === "line" ? "Product line" : "Asset type", sort: (r) => r.name },
            { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
            { key: "pages", label: "Pages", align: "right" },
            { key: "keywords", label: "Keywords", render: (r) => fmtN(r.keywords), align: "right" },
            { key: "top3", label: "Top-3", align: "right" },
            { key: "value", label: "Value", render: (r) => fmtMoney(r.value), align: "right" },
            { key: "upside", label: "Upside", render: (r) => `+${fmtN(r.upside)}`, align: "right" },
          ]} />
        </Panel>
        <Panel title="Visits by search intent" sub="What searchers wanted" className="xl:col-span-2">
          <BarList rows={intents} label={(r) => r.name} value={(r) => r.traffic} />
          <p className="mt-4 text-xs text-muted-foreground">Commercial and transactional visits are closest to pipeline; informational visits build the audience that later converts.</p>
        </Panel>
      </div>

      <Panel title="Pages & assets" sub="Every page with organic traffic, with its SEO signals. Click a page for its keywords.">
        <div className="mb-4 flex flex-wrap gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by URL…" className="h-10 w-full max-w-xs border-line/15 bg-background text-sm" />
          <select value={line} onChange={(e) => setLine(e.target.value)} className={selectCls}><option value="all">All product lines</option>{LINES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <select value={asset} onChange={(e) => setAsset(e.target.value)} className={selectCls}><option value="all">All asset types</option>{assets.map((a) => <option key={a} value={a}>{ASSET_NAME[a]}</option>)}</select>
        </div>
        <Table rows={shown} limit={25} onRow={(p) => drill({ type: "page", data: p })} initialSort={{ key: "traffic", dir: -1 }} testId="seo-pages" columns={[
          { key: "url", label: "Page", sort: (r) => r.url, render: (r) => <span className="block max-w-[280px] truncate" title={r.url}>{shortUrl(r.url)}</span> },
          { key: "line", label: "Line / type", sort: (r) => r.line, render: (r) => <span className="text-xs text-muted-foreground">{LINE_NAME[r.line]} · {ASSET_NAME[r.asset]}</span> },
          { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
          { key: "keywords", label: "Keywords", render: (r) => fmtN(r.keywords), align: "right" },
          { key: "top", label: "Top keyword", sort: (r) => r.topKeyword?.keyword, render: (r) => <span className="block max-w-[180px] truncate text-xs">{r.topKeyword?.keyword || "—"}</span> },
          { key: "avgPos", label: "Avg pos", render: (r) => (r.avgPos ? r.avgPos.toFixed(1) : "—"), align: "right" },
          { key: "netMovement", label: "Net move", render: (r) => <Delta value={r.netMovement} suffix="" />, align: "right" },
          { key: "answers", label: "Answers held", sort: (r) => r.answers.pct, render: (r) => (r.answers.available ? `${r.answers.owned}/${r.answers.available}` : "—"), align: "right" },
          { key: "upside", label: "Upside", render: (r) => `+${fmtN(r.upside)}`, align: "right" },
        ]} />
      </Panel>
    </div>
  );
}
