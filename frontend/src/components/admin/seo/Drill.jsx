// One drill-down drawer for the whole SEO dashboard. Any view calls
// drill({ type, ... }) to open the detail behind a number.
import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Loader2, PenLine } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fetchSeoKeyword, formatApiError } from "@/lib/adminApi";
import { ASSET_NAME, LINE_NAME, fmtMoney, fmtN, trendChange, upside } from "@/lib/seo/model";
import { C, ChartTip, Delta, FeatureChips, IntentChip, Move, PosBadge, Table, axis, monthTick, shortUrl, GRID } from "@/components/admin/seo/ui";

const Ctx = createContext(() => {});
export const useDrill = () => useContext(Ctx);

const Stat = ({ label, children }) => (
  <div className="rounded-xl border border-line/10 p-3">
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <div className="mt-1 text-lg font-medium tabular-nums text-foreground">{children}</div>
  </div>
);
const H = ({ children }) => <h3 className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{children}</h3>;

const TrendChart = ({ data, lines, height = 200 }) => (
  <div style={{ height }}>
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" {...axis} tickFormatter={(d) => (/^\d{4}-/.test(d) ? monthTick(d) : d)} />
        <YAxis {...axis} tickFormatter={fmtN} width={48} />
        <Tooltip content={<ChartTip fmtLabel={(d) => (/^\d{4}-/.test(d) ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : d)} />} />
        {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

function KeywordDetail({ k, snap, sample }) {
  const [live, setLive] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (sample) return;
    fetchSeoKeyword(k.keyword, snap.geo).then(setLive).catch((e) => setErr(formatApiError(e)));
  }, [k.keyword, snap.geo, sample]);
  const months = (k.trend || []).map((v, i) => ({ date: `M${i + 1}`, interest: Math.round(v * 100) }));
  const rivals = (snap.gap || []).find((g) => g.keyword === k.keyword)?.positions || {};
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Position"><span className="flex items-center gap-2"><PosBadge pos={k.position} /><Move from={k.prev_position} to={k.position} /></span></Stat>
        <Stat label="Monthly searches">{fmtN(k.volume)}</Stat>
        <Stat label="Est. visits / mo">{fmtN(k.traffic)}</Stat>
        <Stat label="Difficulty">{k.kd ?? "—"}<span className="text-xs text-muted-foreground">/100</span></Stat>
        <Stat label="CPC value">{k.cpc ? `$${k.cpc}` : "—"}</Stat>
        <Stat label="Intent"><IntentChip intent={k.intent} /></Stat>
        <Stat label="Top-3 upside">{k.position > 3 ? `+${fmtN(upside(k))}/mo` : "In top 3"}</Stat>
        <Stat label="Demand, 12 mo"><Delta value={trendChange(k.trend)} /></Stat>
      </div>
      {k.url && <p className="mt-4 text-sm">Ranking page: <a href={k.url} target="_blank" rel="noreferrer" className="text-teal hover:underline">{shortUrl(k.url)} <ExternalLink className="inline h-3 w-3" /></a></p>}
      <H>Results-page features</H>
      <FeatureChips serp={k.serp} owned={k.owned} />
      {!k.serp?.length && <p className="text-sm text-muted-foreground">No SERP features recorded.</p>}
      {months.length > 1 && (<><H>Search interest, last 12 months (index)</H><TrendChart data={months} lines={[{ key: "interest", name: "Interest", color: C.you }]} height={160} /></>)}
      {Object.keys(rivals).length > 0 && (
        <>
          <H>Competitor positions</H>
          <ul className="space-y-1 text-sm">{Object.entries(rivals).sort((a, b) => a[1] - b[1]).map(([d, p]) => <li key={d} className="flex items-center justify-between"><span className={d === snap.domain ? "text-sky-300" : ""}>{d === snap.domain ? "You" : d}</span><PosBadge pos={p} /></li>)}</ul>
        </>
      )}
      <H>Who ranks on page one</H>
      {sample ? <p className="text-sm text-muted-foreground">Live SERP and People-also-ask questions load here once Semrush is connected.</p> : err ? <p className="text-sm text-red-300">{err}</p> : !live ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
        <>
          <ol className="space-y-1 text-sm">{live.serp.map((s) => <li key={s.position} className="flex items-center gap-2"><PosBadge pos={s.position} /><a href={s.url} target="_blank" rel="noreferrer" className={s.domain.includes(snap.domain) ? "truncate text-sky-300" : "truncate hover:underline"}>{s.domain}</a></li>)}</ol>
          {live.questions.length > 0 && (<><H>Questions people ask (answer these on the page)</H><ul className="list-disc space-y-1 pl-5 text-sm">{live.questions.map((q) => <li key={q.question}>{q.question} <span className="text-xs text-muted-foreground">· {fmtN(q.volume)}/mo</span></li>)}</ul></>)}
        </>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/admin/content/new" className="inline-flex items-center gap-1.5 rounded-full border border-line/15 px-3 py-1.5 text-xs hover:border-primary/50"><PenLine className="h-3.5 w-3.5" /> Draft content for this keyword</Link>
      </div>
    </>
  );
}

function PageDetail({ p, drill }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Est. visits / mo">{fmtN(p.traffic)}</Stat>
        <Stat label="Keywords">{fmtN(p.keywords)}</Stat>
        <Stat label="Traffic value">{fmtMoney(p.value)}</Stat>
        <Stat label="Top-3 upside">+{fmtN(p.upside)}/mo</Stat>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{LINE_NAME[p.line]} · {ASSET_NAME[p.asset]} · <a href={p.url} target="_blank" rel="noreferrer" className="text-teal hover:underline">open page <ExternalLink className="inline h-3 w-3" /></a></p>
      <H>Keywords this page ranks for</H>
      <Table rows={p.kws || []} limit={15} onRow={(k) => drill({ type: "keyword", data: k })} initialSort={{ key: "traffic", dir: -1 }} columns={[
        { key: "keyword", label: "Keyword", sort: (r) => r.keyword },
        { key: "position", label: "Pos", render: (r) => <PosBadge pos={r.position} />, align: "right" },
        { key: "move", label: "Move", sort: (r) => (r.prev_position || r.position) - r.position, render: (r) => <Move from={r.prev_position} to={r.position} />, align: "right" },
        { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
        { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
      ]} />
      <H>Answer features on this page's keywords</H>
      <p className="text-sm">{p.answers.owned} of {p.answers.available} answer placements held ({Math.round(p.answers.pct)}%).</p>
    </>
  );
}

function CompetitorDetail({ c, snap }) {
  const hist = (snap.history || []).map((h) => ({ date: h.date, you: h.traffic, them: c.history?.find((x) => x.date === h.date)?.traffic }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Organic visits / mo">{fmtN(c.traffic)}</Stat>
        <Stat label="Keywords">{fmtN(c.keywords)}</Stat>
        <Stat label="Authority">{c.authority ?? "—"}</Stat>
        <Stat label="Shared keywords">{fmtN(c.common_keywords)}</Stat>
        <Stat label="Traffic value">{fmtMoney(c.traffic_cost)}</Stat>
        <Stat label="Paid keywords">{fmtN(c.paid_keywords)}</Stat>
        <Stat label="Referring domains">{fmtN(c.ref_domains)}</Stat>
        <Stat label="12-mo growth"><Delta value={c.growth} /></Stat>
      </div>
      <H>Organic visits: you vs {c.name}</H>
      <TrendChart data={hist} lines={[{ key: "you", name: "You", color: C.you }, { key: "them", name: c.name, color: C.rival }]} />
      <p className="mt-1 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: C.you }} />You</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: C.rival }} />{c.name}</span></p>
      {c.top_keywords?.length > 0 && (
        <>
          <H>Their strongest keywords</H>
          <Table rows={c.top_keywords} limit={12} initialSort={{ key: "volume", dir: -1 }} columns={[
            { key: "keyword", label: "Keyword", sort: (r) => r.keyword },
            { key: "position", label: "Their pos", render: (r) => <PosBadge pos={r.position} />, align: "right" },
            { key: "mine", label: "Yours", sort: (r) => snap.keywords.find((k) => k.keyword === r.keyword)?.position ?? 999, render: (r) => <PosBadge pos={snap.keywords.find((k) => k.keyword === r.keyword)?.position} />, align: "right" },
            { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
          ]} />
        </>
      )}
    </>
  );
}

function SectionDetail({ s, drill }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Est. visits / mo">{fmtN(s.traffic)}</Stat>
        <Stat label="Pages">{s.pages}</Stat>
        <Stat label="Keywords">{fmtN(s.keywords)}</Stat>
        <Stat label="Top-3 rankings">{s.top3}</Stat>
      </div>
      <H>Pages</H>
      <Table rows={s.items} limit={20} initialSort={{ key: "traffic", dir: -1 }} onRow={(p) => drill({ type: "page", data: p })} columns={[
        { key: "url", label: "Page", sort: (r) => r.url, render: (r) => <span className="block max-w-[260px] truncate">{shortUrl(r.url)}</span> },
        { key: "asset", label: "Type", render: (r) => <span className="text-xs text-muted-foreground">{ASSET_NAME[r.asset]}</span> },
        { key: "keywords", label: "Keywords", render: (r) => fmtN(r.keywords), align: "right" },
        { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
      ]} />
    </>
  );
}

function MetricDetail({ m }) {
  return (
    <>
      <TrendChart data={m.data} lines={m.lines} height={240} />
      {m.lines.length > 1 && <p className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">{m.lines.map((l) => <span key={l.key} className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: l.color }} />{l.name}</span>)}</p>}
      <H>Table view</H>
      <Table rows={m.data} initialSort={{ key: "date", dir: -1 }} columns={[{ key: "date", label: "Month", render: (r) => (/^\d{4}-/.test(r.date) ? new Date(`${r.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : r.date) }, ...m.lines.map((l) => ({ key: l.key, label: l.name, render: (r) => (m.fmt || fmtN)(r[l.key]), align: "right" }))]} />
      {m.note && <p className="mt-4 text-xs text-muted-foreground">{m.note}</p>}
    </>
  );
}

function TopicDetail({ t }) {
  return (
    <>
      {t.angle && <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 text-sm"><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-teal">Recommended angle</p>{t.angle}</div>}
      {t.rising_terms?.length > 0 && (<><H>Rising terms</H><div className="flex flex-wrap gap-1.5">{t.rising_terms.map((r) => <span key={r} className="rounded-full border border-line/15 px-2 py-0.5 text-xs">{r}</span>)}</div></>)}
      <H>What's being said</H>
      <ul className="space-y-3">
        {t.top.map((i) => (
          <li key={i.url} className="text-sm">
            <a href={i.url} target="_blank" rel="noreferrer" className="text-foreground hover:underline">{i.title}</a>
            <p className="text-xs text-muted-foreground">{i.source} · {new Date(i.at).toLocaleDateString(undefined, { dateStyle: "medium" })}{i.engagement > 1 ? ` · ${fmtN(i.engagement)} engagement` : ""}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

const TITLES = {
  keyword: (d) => [d.keyword, "Keyword performance"],
  page: (d) => [shortUrl(d.url), "Page performance"],
  competitor: (d) => [d.name || d.domain, d.domain],
  section: (d) => [d.name, "Section performance"],
  metric: (d) => [d.title, d.sub],
  topic: (d) => [d.topic, `${d.mentions_30d} mentions in 30 days`],
};

export function DrillProvider({ snap, sample, children }) {
  const [item, setItem] = useState(null);
  const d = item?.data;
  const [title, sub] = item ? TITLES[item.type](d) : ["", ""];
  return (
    <Ctx.Provider value={setItem}>
      {children}
      <Sheet open={!!item} onOpenChange={(o) => !o && setItem(null)}>
        <SheetContent className="dark w-full overflow-y-auto border-line/10 bg-background text-foreground sm:max-w-2xl" data-testid="seo-drill">
          {item && (
            <>
              <SheetHeader className="pr-10 text-left">
                <SheetTitle className="font-display text-2xl font-medium">{title}</SheetTitle>
                <SheetDescription>{sub}{sample ? " · sample data" : ""}</SheetDescription>
              </SheetHeader>
              <div className="mt-5">
                {item.type === "keyword" && <KeywordDetail k={d} snap={snap} sample={sample} />}
                {item.type === "page" && <PageDetail p={d} drill={setItem} />}
                {item.type === "competitor" && <CompetitorDetail c={d} snap={snap} />}
                {item.type === "section" && <SectionDetail s={d} drill={setItem} />}
                {item.type === "metric" && <MetricDetail m={d} />}
                {item.type === "topic" && <TopicDetail t={d} />}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  );
}

