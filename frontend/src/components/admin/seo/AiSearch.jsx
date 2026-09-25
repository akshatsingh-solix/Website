// AEO + GEO. AEO: do you own the answer boxes (featured snippets, People also
// ask, AI Overviews) on the results pages you already rank on? GEO: when a
// buyer asks an AI assistant, is your brand named and cited?
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Loader2, Minus, Sparkles } from "lucide-react";
import { Panel } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { useDrill } from "@/components/admin/seo/Drill";
import { BarList, C, ChartTip, FeatureChips, GRID, Kpi, PosBadge, SampleBadge, Table, axis } from "@/components/admin/seo/ui";
import { ANSWER_FEATURES, SERP_FEATURES, answerShare, fmtN, serpFeatures } from "@/lib/seo/model";

export default function AiSearch({ snap, ai, aiSample, aiConnected, running, onRun, canRun }) {
  const drill = useDrill();
  const [prompt, setPrompt] = useState(null);
  const share = answerShare(snap.keywords);
  const feats = useMemo(() => serpFeatures(snap.keywords).filter((f) => SERP_FEATURES[f.code]), [snap]);
  const targets = snap.keywords
    .filter((k) => k.position <= 10 && (k.serp || []).some((c) => ANSWER_FEATURES.includes(c) && !(k.owned || []).includes(c)))
    .map((k) => ({ ...k, missing: k.serp.filter((c) => ANSWER_FEATURES.includes(c) && !(k.owned || []).includes(c)) }))
    .sort((a, b) => b.volume - a.volume);
  const aio = feats.find((f) => f.code === 52);
  const sov = ai?.share_of_voice || [];
  const me = sov.find((s) => s.domain === ai?.brand_domain);
  const leader = sov[0];
  const ok = (ai?.results || []).filter((r) => !r.error);
  const cites = sov.reduce((s, x) => s + x.citations, 0) || 1;
  const noWeb = ai && !aiSample && ai.web === false;
  const models = new Set((ai?.results || []).map((r) => r.model).filter(Boolean));

  return (
    <div className="space-y-6" data-testid="seo-ai">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Answer boxes held" value={`${Math.round(share.pct)}%`} sub={`${share.owned} of ${share.available} answer placements on your keywords`} />
        <Kpi label="AI Overviews" value={aio ? `${aio.owned} / ${aio.available}` : "—"} sub="Cited in / shown on your keywords" />
        <Kpi label="AI answer share of voice" value={me ? `${me.share}%` : "—"} sub={me ? `Named in ${me.prompts_mentioned} of ${ok.length} buyer questions` : "Not yet measured"} />
        <Kpi label="AI citations share" value={me && !noWeb ? `${Math.round((100 * me.citations) / cites)}%` : "—"} sub={noWeb ? "Needs a model with web search" : "Of sources the AI linked to"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="AEO: answer features on your results pages" sub="Available = shown for keywords you rank on; held = you are the source" className="xl:col-span-2">
          <Table compact rows={feats} initialSort={{ key: "available", dir: -1 }} columns={[
            { key: "label", label: "Feature", sort: (r) => r.label, render: (r) => <span className="flex items-center gap-1.5">{ANSWER_FEATURES.includes(r.code) && <Sparkles className="h-3 w-3 text-teal" aria-label="answer feature" />}{r.label}</span> },
            { key: "available", label: "Shown", align: "right" },
            { key: "owned", label: "Held", align: "right" },
            { key: "rate", label: "Rate", sort: (r) => r.owned / (r.available || 1), render: (r) => `${Math.round((100 * r.owned) / (r.available || 1))}%`, align: "right" },
          ]} />
        </Panel>
        <Panel title="Answer boxes to win next" sub="You rank top 10 but someone else holds the answer. Restructure these pages first." className="xl:col-span-3">
          <Table rows={targets} limit={10} onRow={(k) => drill({ type: "keyword", data: k })} initialSort={{ key: "volume", dir: -1 }} columns={[
            { key: "keyword", label: "Keyword", sort: (r) => r.keyword },
            { key: "position", label: "Pos", render: (r) => <PosBadge pos={r.position} />, align: "right" },
            { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
            { key: "missing", label: "Not yet yours", nosort: true, render: (r) => <FeatureChips serp={r.missing} owned={[]} /> },
          ]} />
          <p className="mt-4 text-xs text-muted-foreground">What wins them: a 40–60 word direct answer under a question-style heading, a list or table for steps, and an FAQ block. The CMS editor scores each page for this.</p>
        </Panel>
      </div>

      <Panel
        title="GEO: how AI assistants answer your buyers' questions"
        sub={ai?.ran_at && !aiSample ? `Last checked ${new Date(ai.ran_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · ${ai.model}${ai.web === false ? " · answers from the model's own knowledge (no web search)" : " · with live web search"}` : "Each buyer question is asked to an AI model; we record which brands it names (and cites, when web search is on)"}
        action={
          <div className="flex items-center gap-2">
            {aiSample && <SampleBadge reason="AI answer checks haven't run yet" />}
            {canRun && <Button size="sm" variant="outline" onClick={onRun} disabled={running || !aiConnected} title={aiConnected ? "" : "Add OPENROUTER_API_KEY to the backend to enable"}>{running ? <Loader2 className="animate-spin" /> : <Sparkles />} {running ? "Asking…" : "Run check now"}</Button>}
          </div>
        }
      >
        {!aiConnected && <p className="mb-4 rounded-lg border border-line/10 bg-line/[0.03] px-3 py-2 text-xs text-muted-foreground">AI answer tracking needs <span className="font-mono">OPENROUTER_API_KEY</span> (free models available) or <span className="font-mono">ANTHROPIC_API_KEY</span> on the backend. Until then the numbers below are sample data. Edit the buyer questions in Settings.</p>}
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Share of AI answers naming each brand</p>
            <BarList rows={sov.slice(0, 12)} label={(r) => (r.domain === ai.brand_domain ? `${r.brand} (you)` : r.brand)} value={(r) => r.share} format={(v, r) => `${v}% · avg #${r.avg_rank ?? "—"}`} colorFor={(r) => (r.domain === ai.brand_domain ? C.you : C.faint)} empty="No brands named yet." />
            {me && leader && leader.domain !== me.domain && leader.share > me.share && <p className="mt-4 text-sm">{leader.brand} is named in {leader.share}% of answers vs your {me.share}%. Close the gap with comparison pages, cited statistics and third-party mentions (analyst reports, review sites) that AI engines draw on.</p>}
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Your AI answer share over time</p>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={ai?.history || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="ran_at" {...axis} tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis {...axis} tickFormatter={(v) => `${v}%`} width={52} domain={[0, 100]} />
                  <Tooltip content={<ChartTip fmtLabel={(d) => new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" })} fmtValue={(v) => `${v}%`} />} />
                  <Line type="monotone" dataKey="share" name="Your share" stroke={C.you} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Question by question</p>
        <ul className="divide-y divide-line/5">
          {(ai?.results || []).map((r) => {
            const mine = r.mentions?.find((m) => m.domain === ai.brand_domain);
            return (
              <li key={`${r.model}|${r.prompt}`} className="py-3">
                <button type="button" className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setPrompt(prompt === `${r.model}|${r.prompt}` ? null : `${r.model}|${r.prompt}`)}>
                  <span className="text-sm text-foreground">{r.prompt}{models.size > 1 && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{r.model}</span>}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs">{r.error ? <span className="text-red-300">{r.error}</span> : mine ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> named #{mine.rank}</> : <><Minus className="h-3.5 w-3.5 text-muted-foreground" /> not named</>}</span>
                </button>
                <p className="mt-1 text-xs text-muted-foreground">{(r.mentions || []).map((m) => m.brand).join(" · ") || "No tracked brand named"}</p>
                {prompt === `${r.model}|${r.prompt}` && (
                  <div className="mt-3 space-y-3 rounded-lg border border-line/10 bg-line/[0.03] p-3 text-xs">
                    {r.answer ? <p className="whitespace-pre-line text-sm text-foreground/90">{r.answer}</p> : <p className="text-muted-foreground">The full AI answer appears here after a live check.</p>}
                    {Object.keys(r.cited_domains || {}).length > 0 && <p className="text-muted-foreground">Sources cited: {Object.entries(r.cited_domains).sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d} (${n})`).join(", ")}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
