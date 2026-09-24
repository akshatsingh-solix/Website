// The content writer's workspace: what to refresh, what to write next, a
// brief for any keyword, and an SEO/AEO/GEO audit of published CMS content.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCopy, FilePlus2, Loader2, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchContentItem, fetchContentList, formatApiError } from "@/lib/adminApi";
import { auditContent } from "@/lib/seo/audit";
import { LINE_NAME, classify, fmtN, gapOpportunities, pagesWithSignals, pathOf, strikingDistance } from "@/lib/seo/model";
import { useDrill } from "@/components/admin/seo/Drill";
import { Delta, PosBadge, Table, shortUrl } from "@/components/admin/seo/ui";
import { coverage } from "@/components/admin/seo/Topics";

const ACRONYMS = { sap: "SAP", ai: "AI", eu: "EU", gdpr: "GDPR", ecc: "ECC", erp: "ERP", "s/4hana": "S/4HANA", rag: "RAG", pii: "PII", dsar: "DSAR", dpdp: "DPDP", ilm: "ILM", ebs: "EBS", ecm: "ECM" };
const cap = (s) => { const t = s.split(" ").map((w) => ACRONYMS[w.toLowerCase()] || w).join(" "); return t.charAt(0).toUpperCase() + t.slice(1); };

export function buildBrief(keyword, snap, questions = []) {
  const kw = keyword.trim();
  const words = kw.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const related = snap.keywords.filter((k) => k.keyword !== kw && words.some((w) => k.keyword.includes(w))).sort((a, b) => b.volume - a.volume).slice(0, 8);
  const current = snap.keywords.find((k) => k.keyword === kw);
  // Product line: from the page that already ranks, else the most common line among related keywords' pages.
  const votes = {};
  for (const k of current ? [current] : related) {
    const l = classify(k.url, k.keyword).line;
    if (l !== "brand") votes[l] = (votes[l] || 0) + 1;
  }
  const line = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || classify("", kw).line;
  const links = pagesWithSignals(snap).filter((p) => (line === "brand" ? p.asset === "product" : p.line === line) && p.url !== current?.url).sort((a, b) => b.traffic - a.traffic).slice(0, 4);
  const rivals = Object.entries((snap.gap || []).find((g) => g.keyword === kw)?.positions || {}).filter(([d]) => d !== snap.domain);
  const qs = questions.length ? questions : [`What is ${kw}?`, `How does ${kw} work?`, `Why does ${kw} matter in ${new Date().getFullYear()}?`, `How to choose a ${kw} solution`, `${cap(kw)} vs alternatives`];
  const title = [`${cap(kw)}: A Practical Guide for Enterprise Teams`, `${cap(kw)}: A Practical Guide`, cap(kw)].find((t) => t.length <= 60) || cap(kw).slice(0, 60);
  return {
    keyword: kw, line, title, current, rivals, related, links,
    description: `Learn what ${kw} is, how it works and how enterprises use it to cut cost and risk. Includes a checklist and FAQs.`.slice(0, 155),
    outline: [`Direct answer (40–60 words): define ${kw} in plain language`, ...qs.map((q) => `## ${q}`), "## Key facts and numbers (cite sources)", `## How ${LINE_NAME[line] === "Brand & general" ? "Solix" : `Solix ${LINE_NAME[line]}`} helps`, "## FAQ (3–5 short Q&As)"],
    words: current && current.position <= 10 ? 1400 : 1800,
  };
}

const briefText = (b) => [
  `Brief: ${b.keyword}`, `SEO title: ${b.title}`, `Meta description: ${b.description}`, `Target length: ${b.words}+ words`, "",
  "Outline:", ...b.outline.map((o) => `- ${o}`), "",
  `Related keywords to cover: ${b.related.map((r) => r.keyword).join(", ") || "—"}`,
  `Link to: ${b.links.map((l) => shortUrl(l.url)).join(", ") || "—"}`,
  "AEO/GEO: open with the answer, phrase subheadings as questions, add a list or table, name the author and role, cite 2+ facts with sources, name Solix and the product.",
].join("\n");

function Brief({ snap, seed }) {
  const navigate = useNavigate();
  const [kw, setKw] = useState(seed || "");
  const b = useMemo(() => (kw.trim().length > 2 ? buildBrief(kw, snap) : null), [kw, snap]);
  const draft = () => navigate("/admin/content/new", { state: { prefill: { title: b.title, seo_title: b.title, seo_description: b.description, summary: "", body: b.outline.map((o) => `${o}\n\n`).join("") } } });
  return (
    <Panel title="Content brief builder" sub="Type any keyword. The brief uses your rankings, rivals and pages to plan a piece that can rank, win the answer box and get cited by AI.">
      <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="e.g. sap data archiving" className="h-11 max-w-md border-line/15 bg-background" data-testid="seo-brief-input" />
      {b && (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">SEO title · </span>{b.title}</p>
            <p><span className="text-muted-foreground">Meta description · </span>{b.description}</p>
            <p><span className="text-muted-foreground">Target · </span>{b.words}+ words · {LINE_NAME[b.line]}</p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">You today · </span>{b.current ? <><PosBadge pos={b.current.position} /> {shortUrl(b.current.url)}</> : "not ranking"}</p>
            {b.rivals.length > 0 && <p><span className="text-muted-foreground">Rivals ranking · </span>{b.rivals.map(([d, p]) => `${d} #${p}`).join(", ")}</p>}
            <div><p className="text-muted-foreground">Outline</p><ol className="mt-1 list-decimal space-y-1 pl-5">{b.outline.map((o) => <li key={o}>{o.replace(/^## /, "")}</li>)}</ol></div>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-muted-foreground">Related keywords to cover</p><p className="mt-1 flex flex-wrap gap-1.5">{b.related.map((r) => <span key={r.keyword} className="rounded-full border border-line/15 px-2 py-0.5 text-xs">{r.keyword} · {fmtN(r.volume)}</span>)}{!b.related.length && "—"}</p></div>
            <div><p className="text-muted-foreground">Internal links to add</p><ul className="mt-1 space-y-0.5 text-xs">{b.links.map((l) => <li key={l.url}>{shortUrl(l.url)}</li>)}{!b.links.length && <li>—</li>}</ul></div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" onClick={draft}><FilePlus2 /> Start draft in CMS</Button>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(briefText(b)).then(() => toast.success("Brief copied"))}><ClipboardCopy /> Copy brief</Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function CmsAudit({ snap }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const list = await fetchContentList({ status: "published", page_size: 60 });
      const out = [];
      const queue = [...list.items];
      const work = async () => {
        while (queue.length) {
          const it = queue.shift();
          try {
            const full = await fetchContentItem(it.id);
            const ranked = snap.keywords.filter((k) => pathOf(k.url).replace(/\/$/, "").endsWith(`/${full.slug}`) || (full.source_url && pathOf(full.source_url) === pathOf(k.url)));
            const keyword = ranked.sort((a, b) => b.volume - a.volume)[0]?.keyword || "";
            const a = auditContent(full, { keyword, updatedAt: full.updated_at });
            out.push({ id: full.id, title: full.title, type: full.type, keyword, views: it.views_30d, seo: a.groups[0].score, aeo: a.groups[1].score, geo: a.groups[2].score, total: Math.round((a.groups[0].score + a.groups[1].score + a.groups[2].score) / 3) });
          } catch { /* skip items that fail to load */ }
        }
      };
      await Promise.all([work(), work(), work()]);
      setRows(out);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };
  const score = (v) => <span className={v >= 75 ? "text-emerald-300" : v >= 50 ? "text-amber-200" : "text-red-300"}>{v}</span>;
  return (
    <Panel title="Audit published CMS content" sub="Scores every published item for SEO, AEO and GEO readiness. Open one to fix it in the editor." action={<Button size="sm" variant="outline" onClick={run} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ScanSearch />} {rows ? "Re-run audit" : "Run audit"}</Button>}>
      {!rows ? <p className="text-sm text-muted-foreground">{busy ? "Reading your published content…" : "Runs in your browser against the CMS; nothing is changed."}</p> : (
        <Table rows={rows} limit={20} initialSort={{ key: "total", dir: 1 }} onRow={(r) => navigate(`/admin/content/${r.id}`)} columns={[
          { key: "title", label: "Content", sort: (r) => r.title, render: (r) => <span className="block max-w-[280px] truncate">{r.title}</span> },
          { key: "keyword", label: "Ranking keyword", render: (r) => <span className="text-xs text-muted-foreground">{r.keyword || "—"}</span> },
          { key: "views", label: "Views 30d", render: (r) => fmtN(r.views), align: "right" },
          { key: "seo", label: "SEO", render: (r) => score(r.seo), align: "right" },
          { key: "aeo", label: "AEO", render: (r) => score(r.aeo), align: "right" },
          { key: "geo", label: "GEO", render: (r) => score(r.geo), align: "right" },
          { key: "total", label: "Overall", render: (r) => score(r.total), align: "right" },
        ]} />
      )}
    </Panel>
  );
}

export default function ContentPlan({ snap, topics }) {
  const drill = useDrill();
  const pages = useMemo(() => pagesWithSignals(snap), [snap]);
  const refresh = pages.filter((p) => p.netMovement < 0).map((p) => ({ ...p, lost: p.kws.filter((k) => k.prev_position && k.position > k.prev_position).reduce((s, k) => s + k.volume, 0) })).sort((a, b) => b.lost - a.lost);
  const wins = useMemo(() => {
    const by = {};
    for (const k of strikingDistance(snap.keywords)) (by[k.url] ||= { url: k.url, upside: 0, kws: [] }), by[k.url].upside += k.upside, by[k.url].kws.push(k);
    return Object.values(by).sort((a, b) => b.upside - a.upside);
  }, [snap]);
  const gaps = gapOpportunities(snap);
  const topicGaps = (topics?.topics || []).filter((t) => !coverage(t.topic, snap).keywords.length);
  const [seed, setSeed] = useState(gaps[0]?.keyword || "");

  return (
    <div className="space-y-6" data-testid="seo-content">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Refresh these pages first" sub="Pages losing rankings, ordered by the search volume at risk">
          <Table rows={refresh} limit={8} onRow={(p) => drill({ type: "page", data: p })} initialSort={{ key: "lost", dir: -1 }} empty="No page is losing ground. Nice." columns={[
            { key: "url", label: "Page", sort: (r) => r.url, render: (r) => <span className="block max-w-[240px] truncate">{shortUrl(r.url)}</span> },
            { key: "netMovement", label: "Net move", render: (r) => <Delta value={r.netMovement} suffix="" />, align: "right" },
            { key: "lost", label: "Volume at risk", render: (r) => fmtN(r.lost), align: "right" },
          ]} />
        </Panel>
        <Panel title="Quick wins by page" sub="Pages with keywords at #4–20: add a section, internal links and an FAQ to push them into the top 3">
          <Table rows={wins} limit={8} onRow={(w) => drill({ type: "page", data: pages.find((p) => p.url === w.url) || { ...w, kws: w.kws, answers: { owned: 0, available: 0, pct: 0 } } })} initialSort={{ key: "upside", dir: -1 }} columns={[
            { key: "url", label: "Page", sort: (r) => r.url, render: (r) => <span className="block max-w-[220px] truncate">{shortUrl(r.url)}</span> },
            { key: "kws", label: "Keywords", sort: (r) => r.kws.length, render: (r) => <span className="block max-w-[200px] truncate text-xs text-muted-foreground">{r.kws.map((k) => k.keyword).join(", ")}</span> },
            { key: "upside", label: "Upside", render: (r) => `+${fmtN(r.upside)}`, align: "right" },
          ]} />
        </Panel>
      </div>

      <Panel title="New content to create" sub="Keywords competitors win and you don't, plus hot topics you have no page for">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0">
          <Table rows={gaps} limit={10} onRow={(g) => setSeed(g.keyword)} initialSort={{ key: "score", dir: -1 }} columns={[
            { key: "keyword", label: "Keyword gap", sort: (r) => r.keyword },
            { key: "volume", label: "Volume", render: (r) => fmtN(r.volume), align: "right" },
            { key: "kd", label: "KD", align: "right" },
            { key: "best", label: "Best rival", render: (r) => <PosBadge pos={r.best} />, align: "right" },
          ]} />
          </div>
          <ul className="min-w-0 space-y-2">
            {topicGaps.map((t) => (
              <li key={t.topic} className="flex items-center justify-between gap-3 rounded-lg border border-line/10 px-3 py-2 text-sm">
                <span><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-300">Hot topic · </span>{t.topic}</span>
                <button type="button" className="shrink-0 text-xs text-teal hover:underline" onClick={() => setSeed(t.topic.toLowerCase())}>Build brief</button>
              </li>
            ))}
            {!topicGaps.length && <li className="text-sm text-muted-foreground">You already rank for every tracked hot topic.</li>}
          </ul>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Click a row to load it into the brief builder below.</p>
      </Panel>

      <Brief key={seed} snap={snap} seed={seed} />
      <CmsAudit snap={snap} />
    </div>
  );
}
