// Hot topics: what the press, practitioners and communities are discussing
// in the category, how fast each topic is moving, whether you already cover
// it, and the angle to take.
import { ExternalLink, Flame, Loader2, RefreshCw } from "lucide-react";
import { Panel } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { useDrill } from "@/components/admin/seo/Drill";
import { Delta } from "@/components/admin/seo/ui";
import { fmtN } from "@/lib/seo/model";

const STOP = new Set(["the", "and", "for", "with", "data", "enterprise", "of", "&", "in", "to", "a", "needs"]);
const VOICE = { news: "Press", analysts: "Analysts", practitioners: "Practitioners", community: "Community", vendor: "Vendors", competitor: "Competitors" };

export function coverage(topic, snap, titles = []) {
  const words = topic.toLowerCase().replace(/[^a-z0-9/ ]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  const need = Math.min(2, words.length);
  // Whole words only, so "ai" never matches inside "email".
  const hit = (s) => {
    const have = new Set(s.toLowerCase().split(/[^a-z0-9/]+/));
    return words.filter((w) => have.has(w)).length >= need;
  };
  const kws = snap.keywords.filter((k) => hit(k.keyword));
  return { keywords: kws, best: kws.slice().sort((a, b) => a.position - b.position)[0], pieces: titles.filter(hit).length };
}

function angleFor(t, cov) {
  if (t.angle) return t.angle;
  const pace = t.momentum >= 1.5 ? `is accelerating (${t.mentions_7d} mentions this week, ${t.momentum}× the recent weekly average)` : `is steady (${t.mentions_30d} mentions in 30 days)`;
  const terms = t.rising_terms?.length ? ` Rising angles: ${t.rising_terms.slice(0, 3).join(", ")}.` : "";
  const cover = cov.best ? ` You rank #${cov.best.position} for "${cov.best.keyword}": refresh that page with the new angle and link it from a timely blog post.` : " You have no ranking page on it: publish an explainer that answers the question directly and cite your own data.";
  return `${t.topic} ${pace}.${terms}${cover}`;
}

export default function Topics({ snap, data, live, refreshing, onRefresh, titles }) {
  const drill = useDrill();
  const topics = (data?.topics || []).map((t) => ({ ...t, cov: coverage(t.topic, snap, titles) }));
  return (
    <div className="space-y-6" data-testid="seo-topics">
      <Panel
        title="Hot topics in the industry"
        sub={live ? `Live from Google News, Hacker News and Reddit · updated ${new Date(data.fetched_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}` : `Research snapshot from ${new Date(data.fetched_at).toLocaleDateString(undefined, { dateStyle: "long" })}. The live radar takes over when the backend's SEO module is deployed.`}
        action={live && <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>{refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh</Button>}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {topics.map((t, i) => {
            const cov = t.cov;
            return (
              <article key={t.topic} className="flex flex-col rounded-xl border border-line/10 bg-line/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">#{i + 1}{t.momentum >= 1.5 && <span className="ml-2 inline-flex items-center gap-1 text-orange-300"><Flame className="h-3 w-3" /> heating up</span>}</p>
                    <h3 className="mt-1 font-display text-base font-medium">{t.topic}</h3>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p><span className="font-mono text-sm text-foreground">{t.mentions_7d}</span> this week</p>
                    <p>{t.mentions_30d} in 30 days</p>
                    {t.momentum != null && <p className="mt-0.5">momentum <Delta value={(t.momentum - 1) * 100} /></p>}
                  </div>
                </div>
                <p className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {Object.entries(t.voices || {}).map(([k, n]) => <span key={k} className="rounded-full border border-line/15 px-2 py-0.5 text-muted-foreground">{VOICE[k] || k}: {n}</span>)}
                  {t.engagement > 20 && <span className="rounded-full border border-line/15 px-2 py-0.5 text-muted-foreground">engagement {fmtN(t.engagement)}</span>}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {t.top.slice(0, 3).map((it) => (
                    <li key={it.url}><a href={it.url} target="_blank" rel="noreferrer" className="line-clamp-2 hover:underline">{it.title} <ExternalLink className="inline h-3 w-3 opacity-60" /></a><span className="text-xs text-muted-foreground">{it.source}</span></li>
                  ))}
                </ul>
                <div className="mt-3 rounded-lg border border-teal/25 bg-teal/5 p-3 text-xs leading-relaxed">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-teal">Recommendation</p>
                  {angleFor(t, cov)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{cov.keywords.length ? `You rank for ${cov.keywords.length} related keyword${cov.keywords.length > 1 ? "s" : ""}` : "No ranking coverage yet"}{titles.length ? ` · ${cov.pieces} CMS piece${cov.pieces === 1 ? "" : "s"}` : ""}</span>
                  <button type="button" onClick={() => drill({ type: "topic", data: t })} className="text-teal hover:underline">All {t.top.length} sources →</button>
                </div>
              </article>
            );
          })}
        </div>
        {!topics.length && <p className="py-6 text-center text-sm text-muted-foreground">No topics configured. Add some in Settings.</p>}
      </Panel>
    </div>
  );
}
