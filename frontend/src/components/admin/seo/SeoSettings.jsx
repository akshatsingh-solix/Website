// SEO settings: which domain to measure, 10+ competitors per country, the
// category keywords and topics to watch, and the AI buyer questions for GEO.
import { useState } from "react";
import { CheckCircle2, Loader2, Save, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { discoverCompetitors, formatApiError, saveSeoConfig } from "@/lib/adminApi";

const lines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const Label = ({ children, hint }) => <p className="mb-1.5 text-xs text-muted-foreground">{children}{hint && <span className="ml-2 text-muted-foreground/70">{hint}</span>}</p>;

const Conn = ({ ok, label, detail }) => (
  <li className="flex items-start gap-3">
    {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
    <span><span className="text-sm text-foreground">{label}</span> <span className="text-xs text-muted-foreground">{ok ? "connected" : "not connected"}</span><span className="block text-xs text-muted-foreground">{detail}</span></span>
  </li>
);

export default function SeoSettings({ config, status, onSaved, canEdit }) {
  const [f, setF] = useState(() => ({
    domain: config.domain, live_domain: config.live_domain || "", brand: config.brand || "",
    competitors: Object.fromEntries(config.geos.map((g) => [g.code, (config.competitors[g.code] || []).join("\n")])),
    industry_keywords: config.industry_keywords.join("\n"), topics: config.topics.join("\n"), ai_prompts: config.ai_prompts.join("\n"),
  }));
  const [busy, setBusy] = useState(null);
  const backend = status && !status.missing;
  const editable = canEdit && backend;

  const save = async () => {
    setBusy("save");
    try {
      const saved = await saveSeoConfig({
        domain: f.domain, live_domain: f.live_domain, brand: f.brand,
        competitors: Object.fromEntries(Object.entries(f.competitors).map(([g, v]) => [g, lines(v)])),
        industry_keywords: lines(f.industry_keywords), topics: lines(f.topics), ai_prompts: lines(f.ai_prompts),
      });
      onSaved(saved);
      toast.success("SEO settings saved. Sync a country to pull data for the new set.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const discover = async (geo) => {
    setBusy(geo);
    try {
      const found = await discoverCompetitors(geo);
      const current = lines(f.competitors[geo]);
      const add = found.map((d) => d.domain).filter((d) => d !== f.domain && !current.includes(d));
      setF((x) => ({ ...x, competitors: { ...x.competitors, [geo]: [...current, ...add].slice(0, 20).join("\n") } }));
      toast.success(`Added ${Math.min(add.length, 20 - current.length)} competitors Semrush found for this country. Review, then save.`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="seo-settings">
      <Panel title="Data connections" sub="Keys live in the backend environment, never in the browser">
        <ul className="space-y-3">
          <Conn ok={backend} label="SEO module on the backend" detail={backend ? "The /api/admin/seo endpoints are live." : "Deploy the backend from this repo (backend/seo.py) to turn on live data, saved settings and the hot-topic radar."} />
          <Conn ok={status?.semrush} label="Semrush" detail="SEMRUSH_API_KEY: traffic, keywords, pages, competitors, keyword gap and industry demand. Each sync uses API units; data is cached until you sync again." />
          <Conn ok={status?.ai} label="AI answer tracking (GEO)" detail="ANTHROPIC_API_KEY: asks the buyer questions below to Claude with live web search and records which brands it names and cites." />
          <Conn ok={backend} label="Hot-topic radar" detail="Google News, Hacker News and Reddit. No key needed; refreshed every 6 hours." />
        </ul>
      </Panel>

      <Panel title="Domains" sub="The old site is measured today. Add the new domain when it goes live and CMS pages will report against it.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Domain measured in Semrush</Label><Input value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} className="border-line/15 bg-background" disabled={!editable} /></div>
          <div><Label hint="optional">New site domain (once live)</Label><Input value={f.live_domain} onChange={(e) => setF({ ...f, live_domain: e.target.value })} placeholder="www.solix.com" className="border-line/15 bg-background" disabled={!editable} /></div>
          <div><Label>Brand name (for brand vs non-brand, AI mentions)</Label><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} className="border-line/15 bg-background" disabled={!editable} /></div>
        </div>
      </Panel>

      <Panel title="Competitors by country" sub="One domain per line. At least 10 per country for a fair comparison; up to 20.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {config.geos.map((g) => {
            const n = lines(f.competitors[g.code] || "").length;
            return (
              <div key={g.code}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{g.label} <span className={n < 10 ? "text-amber-300" : "text-emerald-300"}>· {n}{n < 10 ? " (add more)" : ""}</span></p>
                  {status?.semrush && editable && <button type="button" onClick={() => discover(g.code)} disabled={!!busy} className="inline-flex items-center gap-1 text-xs text-teal hover:underline">{busy === g.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} Discover</button>}
                </div>
                <Textarea rows={8} value={f.competitors[g.code] || ""} onChange={(e) => setF({ ...f, competitors: { ...f.competitors, [g.code]: e.target.value } })} className="border-line/15 bg-background font-mono text-xs" disabled={!editable} />
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Category keywords" sub="Industry demand tracked whether or not you rank"><Textarea rows={12} value={f.industry_keywords} onChange={(e) => setF({ ...f, industry_keywords: e.target.value })} className="border-line/15 bg-background text-xs" disabled={!editable} /></Panel>
        <Panel title="Hot-topic radar" sub="Topics to watch across news and communities"><Textarea rows={12} value={f.topics} onChange={(e) => setF({ ...f, topics: e.target.value })} className="border-line/15 bg-background text-xs" disabled={!editable} /></Panel>
        <Panel title="AI buyer questions" sub="Asked to an AI assistant for the GEO share-of-voice check"><Textarea rows={12} value={f.ai_prompts} onChange={(e) => setF({ ...f, ai_prompts: e.target.value })} className="border-line/15 bg-background text-xs" disabled={!editable} /></Panel>
      </div>

      {editable ? (
        <div className="flex justify-end"><Button onClick={save} disabled={!!busy} data-testid="seo-settings-save">{busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button></div>
      ) : (
        <p className="text-right text-xs text-muted-foreground">{!canEdit ? "Only admins can change SEO settings." : "Settings can be saved once the backend SEO module is deployed."}</p>
      )}
    </div>
  );
}
