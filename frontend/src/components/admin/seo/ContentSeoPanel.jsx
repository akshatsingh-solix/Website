// SEO / AEO / GEO panel inside the CMS editor: live on-page scores with the
// fix for each failed check, plus how this page actually performs (site
// views, and Semrush rankings for its new URL and the old-site URL it
// replaced, so migrations don't lose rankings).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Loader2, Radar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { fetchSeoConfig, fetchSeoUrl, formatApiError } from "@/lib/adminApi";
import { auditContent, suggestKeyword } from "@/lib/seo/audit";
import { fmtN } from "@/lib/seo/model";
import { PosBadge } from "@/components/admin/seo/ui";

const tone = (s) => (s >= 75 ? "#34d399" : s >= 50 ? "#fab219" : "#f87171");
const kwKey = (id) => `solix_seo_kw_${id || "new"}`;

const Ring = ({ score, label, sub, active, onClick }) => (
  <button type="button" onClick={onClick} className={cn("flex flex-1 flex-col items-center rounded-xl border p-2 transition-colors", active ? "border-primary/50 bg-primary/5" : "border-line/10 hover:border-line/25")}>
    <svg viewBox="0 0 36 36" className="h-12 w-12" role="img" aria-label={`${label} score ${score} of 100`}>
      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle cx="18" cy="18" r="15.5" fill="none" stroke={tone(score)} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} transform="rotate(-90 18 18)" />
      <text x="18" y="21.5" textAnchor="middle" className="fill-foreground font-mono text-[10px]">{score}</text>
    </svg>
    <span className="mt-1 text-xs font-medium">{label}</span>
    <span className="text-[10px] text-muted-foreground">{sub}</span>
  </button>
);

function Rankings({ url, geo, label, onRows }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let live = true;
    fetchSeoUrl(url, geo).then((d) => { if (!live) return; setState({ rows: d.keywords }); onRows?.(d.keywords); }).catch((e) => live && setState({ error: e?.response?.status === 409 || e?.response?.status === 404 ? "Connect Semrush to see rankings for this URL." : formatApiError(e) }));
    return () => { live = false; };
  }, [url, geo]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground">{label} <a href={url} target="_blank" rel="noreferrer" className="break-all text-teal hover:underline">{url.replace(/^https?:\/\//, "")}</a></p>
      {state.loading ? <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted-foreground" /> : state.error ? <p className="mt-1 text-xs text-muted-foreground">{state.error}</p> : state.rows.length ? (
        <ul className="mt-2 divide-y divide-line/5 text-xs">
          {state.rows.slice(0, 8).map((k) => <li key={k.keyword} className="flex items-center justify-between gap-2 py-1.5"><span className="min-w-0 truncate">{k.keyword} <span className="text-muted-foreground">· {fmtN(k.volume)}/mo</span></span><PosBadge pos={k.position} /></li>)}
        </ul>
      ) : <p className="mt-1 text-xs text-muted-foreground">No top-100 rankings yet.</p>}
    </div>
  );
}

export default function ContentSeoPanel({ form, item, id, livePath }) {
  const [cfg, setCfg] = useState(null);
  const [open, setOpen] = useState("seo");
  const [expanded, setExpanded] = useState(true);
  const [keyword, setKeyword] = useState(() => { try { return localStorage.getItem(kwKey(id)) || ""; } catch { return ""; } });
  useEffect(() => { fetchSeoConfig().then(setCfg).catch(() => setCfg({ domain: "solix.com", brand: "Solix", live_domain: "" })); }, []);
  useEffect(() => { try { localStorage.setItem(kwKey(id), keyword); } catch { /* storage unavailable */ } }, [id, keyword]);

  const audit = useMemo(() => auditContent(form, { keyword, brand: cfg?.brand || "Solix", updatedAt: item?.updated_at }), [form, keyword, cfg, item]);
  const group = audit.groups.find((g) => g.id === open);
  const geo = (() => { try { return localStorage.getItem("solix_seo_geo") || "us"; } catch { return "us"; } })();
  const suggest = (rows) => setKeyword((k) => k || suggestKeyword(rows));
  const liveUrl = cfg?.live_domain && item?.live ? `https://${cfg.live_domain}${livePath}` : null;
  const oldUrl = item?.source_url && /^https?:\/\//.test(item.source_url) ? item.source_url : null;
  const failing = audit.groups.flatMap((g) => g.checks.filter((c) => !c.ok)).length;

  return (
    <div className="rounded-2xl border border-line/10 bg-card p-5" data-testid="content-seo-panel">
      <button type="button" onClick={() => setExpanded((e) => !e)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-2 text-sm font-medium"><Radar className="h-4 w-4 text-teal" /> SEO · AEO · GEO</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">{failing} to fix <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} /></span>
      </button>
      {expanded && (
        <>
          <label className="mt-4 block text-xs text-muted-foreground">Focus keyword
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. sap data archiving" className="mt-1.5 h-9 border-line/15 bg-background text-sm" data-testid="content-seo-keyword" />
          </label>
          <div className="mt-3 flex gap-2">{audit.groups.map((g) => <Ring key={g.id} score={g.score} label={g.label} sub={g.sub} active={open === g.id} onClick={() => setOpen(g.id)} />)}</div>
          <ul className="mt-3 space-y-2">
            {group.checks.slice().sort((a, b) => a.ok - b.ok).map((c) => (
              <li key={c.id} className="flex gap-2 text-xs">
                {c.ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />}
                <span><span className={c.ok ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>{!c.ok && <span className="block text-muted-foreground">{c.fix}</span>}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-line/10 pt-4">
            <p className="text-sm font-medium">Performance</p>
            {item && (item.views_30d != null || item.downloads_30d != null) && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-line/10 p-2"><p className="font-mono text-lg tabular-nums">{fmtN(item.views_30d ?? 0)}</p><p className="text-[10px] text-muted-foreground">site views, 30 days</p></div>
                <div className="rounded-lg border border-line/10 p-2"><p className="font-mono text-lg tabular-nums">{fmtN(item.downloads_30d ?? 0)}</p><p className="text-[10px] text-muted-foreground">downloads, 30 days</p></div>
              </div>
            )}
            {liveUrl && <Rankings url={liveUrl} geo={geo} label="Search rankings for" onRows={suggest} />}
            {oldUrl && <Rankings url={oldUrl} geo={geo} label="Rankings to protect (old-site URL, redirect it here)" onRows={suggest} />}
            {!liveUrl && !oldUrl && <p className="mt-2 text-xs text-muted-foreground">{item?.live ? "Add the new site's domain in SEO settings to pull rankings for this page." : "Rankings appear here once the page is live and its domain is set in SEO settings."}</p>}
            {!keyword && <p className="mt-3 text-xs text-muted-foreground">Tip: pick a focus keyword to score keyword placement. The <Link to="/admin/seo?tab=content" className="text-teal hover:underline">content plan</Link> suggests keywords worth targeting.</p>}
          </div>
        </>
      )}
    </div>
  );
}

