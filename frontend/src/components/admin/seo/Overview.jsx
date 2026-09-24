// Leadership summary: the few numbers that say whether search is working,
// how we compare, and what to do next. Every tile opens its detail.
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/admin/kit";
import { useDrill } from "@/components/admin/seo/Drill";
import { BarList, C, ChartTip, GRID, Insights, Kpi, Table, axis, monthTick, shortUrl } from "@/components/admin/seo/ui";
import { answerShare, change, fmtMoney, fmtN, gapOpportunities, industryDemand, LINE_NAME, market, movers, pagesWithSignals, sections, shareHistory, strikingDistance, visibility } from "@/lib/seo/model";

export function useSummary(snap, ai) {
  const h = snap.history || [];
  const first = h[0], last = h[h.length - 1];
  const mk = market(snap);
  const me = mk.find((m) => m.self);
  const mv = movers(snap.keywords);
  const sd = strikingDistance(snap.keywords);
  const gaps = gapOpportunities(snap);
  const demand = industryDemand(snap);
  const surging = mk.filter((m) => !m.self && m.growth != null).sort((a, b) => b.growth - a.growth)[0];
  const aiMe = ai?.share_of_voice?.find((s) => s.domain === ai.brand_domain);
  return {
    first, last, mk, me, mv, sd, gaps, demand, surging, aiMe,
    trafficChange: change(last?.traffic, first?.traffic),
    kwChange: change(last?.keywords, first?.keywords),
    vis: visibility(snap.keywords),
    answers: answerShare(snap.keywords),
    lines: sections(snap, "line"),
    pages: pagesWithSignals(snap).sort((a, b) => b.traffic - a.traffic),
  };
}

export default function Overview({ snap, ai, go }) {
  const drill = useDrill();
  const s = useSummary(snap, ai);
  const hist = snap.history || [];
  const share = shareHistory(snap);
  const quickWin = s.sd.slice(0, 10).reduce((t, k) => t + k.upside, 0);

  const openTraffic = () => drill({ type: "metric", data: { title: "Organic visits", sub: "Estimated monthly visits from organic search", data: hist, lines: [{ key: "traffic", name: "Organic visits", color: C.you }], note: "Semrush estimates visits from rankings × search volume × click-through. Use the trend and the comparison, not the absolute number, for decisions." } });
  const openKw = () => drill({ type: "metric", data: { title: "Ranking keywords", sub: "Keywords with a top-100 position", data: hist, lines: [{ key: "keywords", name: "Keywords", color: C.you }] } });
  const openValue = () => drill({ type: "metric", data: { title: "Traffic value", sub: "What this organic traffic would cost as paid search clicks", data: hist, lines: [{ key: "traffic_cost", name: "Value (USD)", color: C.you }], fmt: fmtMoney } });
  const openShare = () => drill({ type: "metric", data: { title: "Share of organic traffic", sub: "You vs the category leader vs the average competitor, in this country", data: share.map((r) => ({ ...r, you: +r.you.toFixed(1), leader: +r.leader.toFixed(1), avg: +r.avg.toFixed(1) })), lines: [{ key: "you", name: "You", color: C.you }, { key: "leader", name: "Leader", color: C.rival }, { key: "avg", name: "Avg competitor", color: C.other }], fmt: (v) => `${v}%` } });

  return (
    <div className="space-y-6" data-testid="seo-overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Organic visits / mo" value={fmtN(s.last?.traffic)} delta={s.trafficChange} deltaLabel="vs 12 months ago" spark={hist.map((x) => x.traffic)} onClick={openTraffic} testId="kpi-traffic" />
        <Kpi label="Ranking keywords" value={fmtN(s.last?.keywords)} delta={s.kwChange} deltaLabel="vs 12 months ago" spark={hist.map((x) => x.keywords)} onClick={openKw} testId="kpi-keywords" />
        <Kpi label="Share of search" value={`${s.me.share.toFixed(1)}%`} sub={`#${s.me.position} of ${s.mk.length} in this market`} onClick={openShare} testId="kpi-share" />
        <Kpi label="Traffic value / mo" value={fmtMoney(s.last?.traffic_cost ?? snap.overview.traffic_cost)} sub="Equivalent paid-search spend" onClick={openValue} testId="kpi-value" />
        <Kpi label="Visibility index" value={`${s.vis.toFixed(1)}`} sub="0–100: clicks you win vs ranking #1 everywhere" onClick={() => go("keywords")} />
        <Kpi label="Answer boxes held (AEO)" value={`${Math.round(s.answers.pct)}%`} sub={`${s.answers.owned} of ${s.answers.available} snippets, PAA and AI Overviews`} onClick={() => go("ai")} />
        <Kpi label="AI answer share (GEO)" value={s.aiMe ? `${s.aiMe.share}%` : "—"} sub={s.aiMe ? `Named in ${s.aiMe.prompts_mentioned} of ${ai.results.length} buyer questions` : "Run an AI answer check"} onClick={() => go("ai")} />
        <Kpi label="Authority score" value={snap.overview.authority ?? "—"} sub={`${fmtN(snap.overview.ref_domains)} referring domains`} onClick={() => go("competitors")} />
      </div>

      <Panel title="What changed and what to do" sub="Generated from this country's data">
        <Insights items={[
          s.trafficChange != null && { tone: s.trafficChange >= 0 ? "good" : "bad", kicker: "Organic traffic", text: `Organic visits are ${s.trafficChange >= 0 ? "up" : "down"} ${Math.abs(s.trafficChange).toFixed(0)}% over 12 months. ${s.mk[0].self ? "You lead this market on organic traffic." : `${s.mk[0].name} leads this market with ${s.mk[0].share.toFixed(0)}% share; you have ${s.me.share.toFixed(0)}%.`}`, action: { label: "See traffic", onClick: () => go("traffic") } },
          s.sd.length > 0 && { tone: "neutral", kicker: "Quick wins", text: `${s.sd.length} keywords rank 4–20. Moving the top 10 into the top 3 is worth about ${fmtN(quickWin)} extra visits a month.`, action: { label: "Open quick wins", onClick: () => go("content") } },
          s.surging && s.surging.growth > 10 && { tone: "bad", kicker: "Competitor surge", text: `${s.surging.name} grew organic traffic ${s.surging.growth.toFixed(0)}% in 12 months. Check which keywords they took.`, action: { label: "Compare", onClick: () => drill({ type: "competitor", data: s.surging }) } },
          s.mv.down[0] && { tone: "bad", kicker: "Biggest drop", text: `"${s.mv.down[0].keyword}" fell from #${s.mv.down[0].prev_position} to #${s.mv.down[0].position} (${fmtN(s.mv.down[0].volume)} searches/mo).`, action: { label: "Investigate", onClick: () => drill({ type: "keyword", data: s.mv.down[0] }) } },
          s.demand.overall != null && { tone: s.demand.overall >= 0 ? "good" : "bad", kicker: "Industry demand", text: `Search demand across your category is ${s.demand.overall >= 0 ? "up" : "down"} ${Math.abs(s.demand.overall).toFixed(0)}%. Fastest-rising: "${s.demand.rows[0]?.keyword}".`, action: { label: "See industry trends", onClick: () => go("keywords") } },
          s.gaps[0] && { tone: "neutral", kicker: "Content gap", text: `Competitors rank for "${s.gaps[0].keyword}" (${fmtN(s.gaps[0].volume)}/mo) and you don't. ${s.gaps.length} gaps found in total.`, action: { label: "See gaps", onClick: () => go("competitors") } },
        ].slice(0, 6)} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Share of organic traffic" sub="You vs the category leader vs the average competitor" className="xl:col-span-3" action={<button type="button" onClick={openShare} className="text-xs text-teal hover:underline">Table view</button>}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={share} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" {...axis} tickFormatter={monthTick} />
                <YAxis {...axis} tickFormatter={(v) => `${v.toFixed(0)}%`} width={44} />
                <Tooltip content={<ChartTip fmtLabel={(d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })} fmtValue={(v) => `${v.toFixed(1)}%`} />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "hsl(210 22% 70%)" }} iconType="plainline" />
                <Line type="monotone" dataKey="you" name="You" stroke={C.you} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="leader" name="Leader" stroke={C.rival} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="avg" name="Avg competitor" stroke={C.other} strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Traffic by product line" sub="Estimated organic visits / month" className="xl:col-span-2">
          <BarList rows={s.lines} label={(r) => r.name} value={(r) => r.traffic} onPick={(r) => drill({ type: "section", data: r })} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Top-performing pages & assets" sub="By organic visits" action={<button type="button" onClick={() => go("traffic")} className="text-xs text-teal hover:underline">All pages</button>}>
          <Table rows={s.pages.slice(0, 8)} onRow={(p) => drill({ type: "page", data: p })} initialSort={{ key: "traffic", dir: -1 }} columns={[
            { key: "url", label: "Page", sort: (r) => r.url, render: (r) => <span className="block max-w-[240px] truncate">{shortUrl(r.url)}</span> },
            { key: "line", label: "Line", render: (r) => <span className="text-xs text-muted-foreground">{LINE_NAME[r.line]}</span> },
            { key: "traffic", label: "Visits", render: (r) => fmtN(r.traffic), align: "right" },
          ]} />
        </Panel>
        <Panel title="Competitive standing" sub="Organic visits / month in this country" action={<button type="button" onClick={() => go("competitors")} className="text-xs text-teal hover:underline">Full comparison</button>}>
          <BarList rows={s.mk.slice(0, 8)} label={(r) => (r.self ? `${r.domain} (you)` : r.name || r.domain)} value={(r) => r.traffic} colorFor={(r) => (r.self ? C.you : C.other)} onPick={(r) => !r.self && drill({ type: "competitor", data: r })} />
        </Panel>
      </div>

      {snap.warnings?.length > 0 && (
        <Panel title="Data notes" sub="Reports that came back incomplete in the last sync">
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">{snap.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Panel>
      )}
    </div>
  );
}
