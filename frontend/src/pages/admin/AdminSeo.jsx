import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { selectCls, useCan } from "@/components/admin/kit";
import { fetchAiVisibility, fetchContentList, fetchSeoTopics, formatApiError, runAiVisibility } from "@/lib/adminApi";
import { useSeo } from "@/lib/seo/useSeo";
import { sampleAiRun } from "@/lib/seo/sample";
import { TOPICS_SNAPSHOT } from "@/lib/seo/topicsSnapshot";
import { DrillProvider } from "@/components/admin/seo/Drill";
import { SampleBadge } from "@/components/admin/seo/ui";
import Overview from "@/components/admin/seo/Overview";

const views = {
  traffic: lazy(() => import("@/components/admin/seo/Traffic")),
  keywords: lazy(() => import("@/components/admin/seo/Keywords")),
  competitors: lazy(() => import("@/components/admin/seo/Competitors")),
  ai: lazy(() => import("@/components/admin/seo/AiSearch")),
  topics: lazy(() => import("@/components/admin/seo/Topics")),
  content: lazy(() => import("@/components/admin/seo/ContentPlan")),
  settings: lazy(() => import("@/components/admin/seo/SeoSettings")),
};

const TABS = {
  overview: "Summary", traffic: "Traffic & pages", keywords: "Keywords", competitors: "Competitors",
  ai: "AI search (AEO/GEO)", topics: "Hot topics", content: "Content plan", settings: "Settings",
};

// Each role lands on the view it needs and sees its tabs first.
const PERSONAS = {
  leadership: { label: "Leadership", tabs: ["overview", "competitors", "traffic", "ai", "topics", "keywords", "content", "settings"], hint: "Share of search, growth vs competitors and where to invest. Click any number for the detail behind it." },
  marketer: { label: "Marketer", tabs: ["traffic", "competitors", "overview", "topics", "keywords", "ai", "content", "settings"], hint: "Traffic by product line and asset, competitor moves by country, and the hot topics to build campaigns around." },
  content: { label: "Content writer", tabs: ["content", "topics", "keywords", "ai", "traffic", "overview", "competitors", "settings"], hint: "What to refresh, what to write next, a brief for any keyword, and an audit of published content." },
  seo: { label: "SEO / AEO / GEO", tabs: ["keywords", "ai", "competitors", "traffic", "content", "topics", "overview", "settings"], hint: "Positions and movers, answer-box and AI-answer share, keyword gaps, cannibalisation and category demand." },
};

const store = {
  get: (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

export default function AdminSeo() {
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const [persona, setPersona] = useState(() => store.get("solix_seo_persona", "leadership"));
  const [geo, setGeo] = useState(() => params.get("geo") || store.get("solix_seo_geo", "us"));
  const tab = TABS[params.get("tab")] ? params.get("tab") : PERSONAS[persona].tabs[0];
  const go = (t) => setParams((p) => { const n = new URLSearchParams(p); n.set("tab", t); return n; });
  const { status, config, setConfig, snap, sample, reason, loading, syncing, sync } = useSeo(geo);

  const [ai, setAi] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [topics, setTopics] = useState(null);
  const [topicsBusy, setTopicsBusy] = useState(false);
  const [titles, setTitles] = useState([]);

  useEffect(() => { store.set("solix_seo_geo", geo); }, [geo]);
  useEffect(() => {
    if (!status) return;
    if (status.ai_last_run) fetchAiVisibility().then(setAi).catch(() => setAi(null));
    if (!status.missing) fetchSeoTopics().then((d) => setTopics({ ...d, live: true })).catch(() => {});
  }, [status]);
  useEffect(() => { fetchContentList({ page_size: 100 }).then((d) => setTitles((d.items || []).map((i) => i.title))).catch(() => {}); }, []);

  const aiView = useMemo(() => ai || sampleAiRun(config), [ai, config]);
  const topicView = topics || TOPICS_SNAPSHOT;

  const pickPersona = (p) => {
    setPersona(p);
    store.set("solix_seo_persona", p);
    go(PERSONAS[p].tabs[0]);
  };
  const runAi = async () => {
    setAiRunning(true);
    try {
      const run = await runAiVisibility();
      setAi(await fetchAiVisibility().catch(() => run));
      toast.success("AI answer check finished.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setAiRunning(false);
    }
  };
  const refreshTopics = async () => {
    setTopicsBusy(true);
    try { setTopics({ ...(await fetchSeoTopics(true)), live: true }); } catch (e) { toast.error(formatApiError(e)); } finally { setTopicsBusy(false); }
  };

  const View = views[tab];
  const synced = status?.synced?.[geo];
  const brand = config.brand || "Solix";

  return (
    <div data-testid="admin-seo">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">SEO · AEO · GEO</p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Search & AI visibility</h1>
          <p className="mt-1 text-sm text-muted-foreground">{config.domain}{config.live_domain ? ` → ${config.live_domain}` : ""} · organic search, answer engines and AI assistants</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sample ? <SampleBadge reason={reason} /> : snap && <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-200" title={`Synced ${new Date(synced || snap.fetched_at).toLocaleString()}`}>Live · Semrush</span>}
          <select value={geo} onChange={(e) => setGeo(e.target.value)} className={selectCls} aria-label="Country" data-testid="seo-geo">
            {config.geos.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
          </select>
          {status?.semrush && can("manage") && <Button variant="outline" size="sm" onClick={sync} disabled={syncing} data-testid="seo-sync">{syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />} {syncing ? "Syncing…" : synced ? "Sync again" : "Sync from Semrush"}</Button>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">View as</span>
        {Object.entries(PERSONAS).map(([k, p]) => (
          <button key={k} type="button" onClick={() => pickPersona(k)} data-testid={`seo-persona-${k}`} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", persona === k ? "border-primary/60 bg-primary/10 text-foreground" : "border-line/15 text-muted-foreground hover:text-foreground")}>{p.label}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{PERSONAS[persona].hint}</p>
      {sample && <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-100/90">Showing illustrative sample data for {config.geos.find((g) => g.code === geo)?.label}. {reason} Every view works the same with live data.</p>}

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line/10" aria-label="SEO sections">
        {PERSONAS[persona].tabs.map((t) => (
          <button key={t} type="button" onClick={() => go(t)} data-testid={`seo-tab-${t}`} className={cn("-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors", tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{TABS[t]}</button>
        ))}
      </nav>

      <div className="mt-6">
        {loading || !snap ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <DrillProvider snap={snap} sample={sample}>
            <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
              {tab === "overview" && <Overview snap={snap} ai={aiView} go={go} />}
              {tab === "traffic" && <View snap={snap} brand={brand} />}
              {tab === "keywords" && <View snap={snap} brand={brand} />}
              {tab === "competitors" && <View snap={snap} go={go} />}
              {tab === "ai" && <View snap={snap} ai={aiView} aiSample={!ai} aiConnected={!!status?.ai} running={aiRunning} onRun={runAi} canRun={can("editContent") || can("manage")} />}
              {tab === "topics" && <View snap={snap} data={topicView} live={!!topics} refreshing={topicsBusy} onRefresh={refreshTopics} titles={titles} canDeep={can("editContent") || can("manage")} />}
              {tab === "content" && <View snap={snap} topics={topicView} />}
              {tab === "settings" && <View config={config} status={status} onSaved={setConfig} canEdit={can("manage")} />}
            </Suspense>
          </DrillProvider>
        )}
      </div>
    </div>
  );
}
