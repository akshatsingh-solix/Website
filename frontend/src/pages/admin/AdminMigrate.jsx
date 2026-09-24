import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, Download, FileUp, Globe2, Loader2, Play, Rss, Search, Square, Link2, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  cancelMigration, downloadRedirects, fetchMigration, fetchMigrations, formatApiError, previewMigration, startMigration,
} from "@/lib/adminApi";
import { Badge, Panel, ago, fmtDate, fmtDateTime, inputCls, selectCls, useCan } from "@/components/admin/kit";
import { TYPE_LABELS } from "@/pages/admin/AdminContent";

const SOURCES = [
  { key: "wordpress", label: "WordPress site", icon: Globe2, help: "Reads posts, pages or any custom post type through the site's REST API (/wp-json), with featured images, authors and categories." },
  { key: "sitemap", label: "Sitemap", icon: MapIcon, help: "Any website: every page in sitemap.xml (or a sitemap index) is fetched and its main content extracted." },
  { key: "rss", label: "RSS / Atom feed", icon: Rss, help: "Blog or news feed. Items that only carry a teaser are read from the page." },
  { key: "urls", label: "Page addresses", icon: Link2, help: "Paste the pages you want, one per line." },
  { key: "file", label: "CSV / JSON file", icon: FileUp, help: "An export with columns such as title, type, date, summary, body (Markdown) or body_html, url, cover_image, tag, author, file_url, gated." },
];
const STATUS_TONE = {
  done: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200", running: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  queued: "border-sky-400/40 bg-sky-400/10 text-sky-200", failed: "border-red-400/40 bg-red-400/10 text-red-200",
  cancelled: "border-line/15 bg-line/5 text-muted-foreground", interrupted: "border-amber-400/40 bg-amber-400/10 text-amber-200",
};

/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, newlines inside quotes. */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== "")) rows.push(row);
  const [head, ...body] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const Opt = ({ label, hint, children }) => (
  <label className="flex items-start justify-between gap-4 py-2.5">
    <span>
      <span className="block text-sm text-foreground">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </span>
    {children}
  </label>
);

function JobCard({ job, onCancel }) {
  const c = job.counts || {};
  const running = job.status === "running" || job.status === "queued";
  const pct = c.found ? Math.round((c.processed / c.found) * 100) : running ? 5 : 100;
  return (
    <Panel
      title={<span className="flex items-center gap-2">Migration <Badge className={STATUS_TONE[job.status]}>{job.status}</Badge></span>}
      sub={`${SOURCES.find((s) => s.key === job.params?.source)?.label || job.params?.source} · ${job.params?.url || `${job.params?.urls_count || job.params?.records_count || 0} items`} · started ${ago(job.started_at || job.created_at)} by ${job.created_by}`}
      action={running && <Button size="sm" variant="outline" onClick={onCancel} data-testid="migration-cancel"><Square /> Cancel</Button>}
      testId="migration-job"
    >
      <div className="h-2 overflow-hidden rounded-full bg-line/10"><div className={cn("h-full rounded-full transition-[width] duration-500", job.status === "failed" ? "bg-red-400" : "bg-teal")} style={{ width: `${pct}%` }} /></div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
        {[["Found", c.found], ["Processed", c.processed], ["Created", c.created], ["Updated", c.updated], ["Skipped", c.skipped], ["Failed", c.failed]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line/10 p-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
            <dd className={cn("mt-1 font-display text-xl tabular-nums", k === "Failed" && v ? "text-red-300" : "text-foreground")}>{v ?? 0}</dd>
          </div>
        ))}
      </dl>
      {job.log?.length > 0 && (
        <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-line/10 bg-background/50 p-3 font-mono text-[11px]" data-testid="migration-log">
          {[...job.log].reverse().map((l, i) => (
            <li key={i} className={cn("flex gap-2", l.level === "error" ? "text-red-300" : "text-muted-foreground")}>
              <span className="shrink-0 opacity-60">{new Date(l.at).toLocaleTimeString()}</span>
              <span className="min-w-0 break-words">{l.msg}{l.url && <span className="opacity-60"> · {l.url}</span>}</span>
            </li>
          ))}
        </ul>
      )}
      {!running && (c.created > 0 || c.updated > 0) && (
        <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/admin/content?origin=import"><ArrowRight /> Review migrated content</Link></Button>
      )}
    </Panel>
  );
}

export default function AdminMigrate() {
  const can = useCan();
  const [source, setSource] = useState("wordpress");
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState("");
  const [records, setRecords] = useState(null);
  const [fileName, setFileName] = useState("");
  const [wpTypes, setWpTypes] = useState(["posts"]);
  const [opts, setOpts] = useState({ include: "", exclude: "", type_mode: "auto", fixed_type: "blog", status: "draft", mirror_media: true, attach_pdfs: true, gated: false, on_conflict: "skip", limit: 200 });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [active, setActive] = useState(null);
  const poll = useRef(null);
  const set = (patch) => setOpts((o) => ({ ...o, ...patch }));

  const body = () => ({
    source, url: url.trim() || null, urls: source === "urls" ? urls.split(/\s+/).filter(Boolean) : [], records: source === "file" ? records || [] : [],
    wp_types: wpTypes, ...opts, include: opts.include || null, exclude: opts.exclude || null, limit: Number(opts.limit) || 200,
  });

  const loadJobs = useCallback(() => fetchMigrations().then((list) => {
    setJobs(list);
    const running = list.find((j) => j.status === "running" || j.status === "queued");
    if (running) setActive((a) => (a?.id === running.id ? a : running));
  }).catch(() => {}), []);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Follow the active job until it finishes.
  useEffect(() => {
    clearInterval(poll.current);
    if (!active || !["running", "queued"].includes(active.status)) return undefined;
    poll.current = setInterval(async () => {
      try {
        const j = await fetchMigration(active.id);
        setActive(j);
        if (!["running", "queued"].includes(j.status)) {
          loadJobs();
          toast.success(`Migration ${j.status}: ${j.counts.created} created, ${j.counts.updated} updated, ${j.counts.skipped} skipped, ${j.counts.failed} failed`);
        }
      } catch { /* keep polling */ }
    }, 1500);
    return () => clearInterval(poll.current);
  }, [active?.id, active?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const rows = /\.json$/i.test(f.name) ? JSON.parse(text) : parseCSV(text);
      const list = Array.isArray(rows) ? rows : rows.items || rows.posts || [];
      if (!list.length) throw new Error("No rows found");
      setRecords(list.slice(0, 2000));
      setFileName(`${f.name} · ${list.length} rows · columns: ${Object.keys(list[0]).slice(0, 8).join(", ")}`);
    } catch (err) {
      setRecords(null);
      toast.error(`Could not read the file: ${err.message}`);
    }
  };

  const doPreview = async () => {
    setBusy("preview");
    setPreview(null);
    try {
      const p = await previewMigration(body());
      setPreview(p);
      if (source === "wordpress" && p.wp_types_available?.length) toast.message(`Content types on this site: ${p.wp_types_available.map((t) => t.name).join(", ")}`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const doStart = async () => {
    const what = opts.status === "published" ? "published on your site with their original dates" : "saved as drafts for review";
    if (!window.confirm(`Start the migration? Items will be ${what}. Existing items are ${opts.on_conflict === "update" ? "updated" : "left alone"}.`)) return;
    setBusy("start");
    try {
      const job = await startMigration(body());
      setActive(job);
      loadJobs();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const src = SOURCES.find((s) => s.key === source);
  const ready = source === "file" ? !!records : source === "urls" ? urls.trim().length > 0 : url.trim().length > 0;

  return (
    <div data-testid="admin-migrate-page">
      <p className="eyebrow mb-2">Migrate</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Bring your existing website's content here.</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Import blogs, press releases, white papers and other pages from your current website. Each item keeps its original publish date and address, so your history lands in the right place in the content stream. Preview first; nothing is saved until you start. Afterwards, download the redirect map so old links keep working.</p>

      {!can("editContent") && <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">Only admins and content editors can run migrations.</p>}

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <section className="space-y-6 xl:col-span-7">
          <Panel title="1. Where is the content?" testId="migrate-source">
            <div className="grid gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Source">
              {SOURCES.map((s) => (
                <button key={s.key} type="button" role="radio" aria-checked={source === s.key} onClick={() => { setSource(s.key); setPreview(null); }}
                  className={cn("flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-xs transition-colors", source === s.key ? "border-teal bg-teal/10 text-foreground" : "border-line/10 text-muted-foreground hover:text-foreground")} data-testid={`migrate-source-${s.key}`}>
                  <s.icon className="h-4 w-4" strokeWidth={1.5} /> {s.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{src.help}</p>
            <div className="mt-4 space-y-3">
              {(source === "wordpress" || source === "sitemap" || source === "rss") && (
                <Input value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} data-testid="migrate-url"
                  placeholder={source === "wordpress" ? "https://www.solix.com" : source === "sitemap" ? "https://www.solix.com/sitemap_index.xml" : "https://www.solix.com/feed/"} />
              )}
              {source === "wordpress" && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Content types to import</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(["posts", "pages", ...wpTypes, ...(preview?.wp_types_available || []).map((t) => t.rest_base)])].map((t) => {
                      const on = wpTypes.includes(t);
                      const name = preview?.wp_types_available?.find((x) => x.rest_base === t)?.name || t;
                      return <button key={t} type="button" aria-pressed={on} onClick={() => setWpTypes(on ? wpTypes.filter((x) => x !== t) : [...wpTypes, t])} className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-teal bg-teal/15 text-foreground" : "border-line/15 text-muted-foreground")}>{name}</button>;
                    })}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Preview once to discover custom types such as press releases or white papers.</p>
                </div>
              )}
              {source === "urls" && <Textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={6} className="border-line/15 bg-background font-mono text-xs" placeholder={"https://www.solix.com/blog/first-post/\nhttps://www.solix.com/press-release/second/"} data-testid="migrate-urls" />}
              {source === "file" && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line/20 p-4 text-sm text-muted-foreground hover:border-teal/50">
                  <FileUp className="h-5 w-5" /> {fileName || "Choose a .csv or .json file"}
                  <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} className="sr-only" data-testid="migrate-file" />
                </label>
              )}
              {source !== "file" && source !== "urls" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={opts.include} onChange={(e) => set({ include: e.target.value })} className={inputCls} placeholder="Only paths containing… e.g. /blog/, /press" />
                  <Input value={opts.exclude} onChange={(e) => set({ exclude: e.target.value })} className={inputCls} placeholder="Skip paths containing… e.g. /careers, /tag/" />
                </div>
              )}
            </div>
          </Panel>

          <Panel title="2. How should it land?">
            <div className="divide-y divide-line/5">
              <Opt label="Content type" hint="Auto-detect uses the address, categories and title (press release, white paper, datasheet, case study…).">
                <span className="flex gap-2">
                  <select value={opts.type_mode} onChange={(e) => set({ type_mode: e.target.value })} className={selectCls}><option value="auto">Auto-detect</option><option value="fixed">Always…</option></select>
                  {opts.type_mode === "fixed" && <select value={opts.fixed_type} onChange={(e) => set({ fixed_type: e.target.value })} className={selectCls}>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
                </span>
              </Opt>
              <Opt label="Publish straight away" hint="On: items go live with their original dates. Off: they arrive as drafts to review first.">
                <Switch checked={opts.status === "published"} onCheckedChange={(v) => set({ status: v ? "published" : "draft" })} data-testid="migrate-publish" />
              </Opt>
              <Opt label="Copy images and PDFs" hint="Stores them here (up to 10 MB each) so nothing depends on the old site staying up.">
                <Switch checked={opts.mirror_media} onCheckedChange={(v) => set({ mirror_media: v })} />
              </Opt>
              <Opt label="Attach the first linked PDF as the downloadable file">
                <Switch checked={opts.attach_pdfs} onCheckedChange={(v) => set({ attach_pdfs: v })} />
              </Opt>
              <Opt label="Gate attached files" hint="Visitors fill in the download form and get the file by email.">
                <Switch checked={opts.gated} onCheckedChange={(v) => set({ gated: v })} />
              </Opt>
              <Opt label="Already imported" hint="Matched by original address or URL slug.">
                <select value={opts.on_conflict} onChange={(e) => set({ on_conflict: e.target.value })} className={selectCls}><option value="skip">Leave as is</option><option value="update">Update from source</option></select>
              </Opt>
              <Opt label="At most">
                <Input type="number" min={1} max={2000} value={opts.limit} onChange={(e) => set({ limit: e.target.value })} className={cn(inputCls, "w-28")} />
              </Opt>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={doPreview} disabled={!ready || !!busy || !can("editContent")} data-testid="migrate-preview">{busy === "preview" ? <Loader2 className="animate-spin" /> : <Search />} Preview</Button>
              <Button onClick={doStart} disabled={!ready || !!busy || !can("editContent") || ["running", "queued"].includes(active?.status)} data-testid="migrate-start">{busy === "start" ? <Loader2 className="animate-spin" /> : <Play />} Start migration</Button>
            </div>
          </Panel>

          {preview && (
            <Panel title={`Preview · ${preview.found}${preview.capped ? "+" : ""} item${preview.found === 1 ? "" : "s"} found`} sub={Object.entries(preview.types).map(([k, v]) => `${v} ${TYPE_LABELS[k] || k}`).join(" · ") || "Nothing matched"} testId="migrate-preview-panel">
              {preview.log?.length > 0 && <p className="mb-3 flex items-start gap-2 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" /> {preview.log[0].msg}</p>}
              <ul className="divide-y divide-line/5">
                {preview.items.map((it, i) => (
                  <li key={i} className="py-3 text-sm">
                    {it.error ? (
                      <p className="text-red-300"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> {it.error} <span className="text-xs text-muted-foreground">{it.source_url}</span></p>
                    ) : (
                      <details>
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{it.title}</span>
                          <Badge className="border-teal/30 text-teal">{TYPE_LABELS[it.type] || it.type}</Badge>
                          {it.exists && <Badge className="border-amber-400/40 text-amber-200">already here</Badge>}
                          {it.has_file && <Badge className="border-line/15 text-muted-foreground">PDF</Badge>}
                          <span className="text-xs text-muted-foreground">{it.date ? fmtDate(it.date) : "no date"} · {it.words} words{it.author ? ` · ${it.author}` : ""}</span>
                        </summary>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[120px_1fr]">
                          {it.cover_image ? <img src={it.cover_image} alt="" className="aspect-video w-full rounded-lg object-cover" /> : <div className="hidden sm:block" />}
                          <div className="text-xs text-muted-foreground">
                            <p>{it.summary}</p>
                            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-background/60 p-2 font-mono text-[11px]">{it.body_start}</pre>
                            <p className="mt-1 font-mono">{it.source_url} → /{it.type === "news" ? "newsroom" : "resources"}/{it.slug}</p>
                          </div>
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </section>

        <aside className="space-y-6 xl:col-span-5">
          {active && <JobCard job={active} onCancel={async () => { try { setActive(await cancelMigration(active.id)); } catch (e) { toast.error(formatApiError(e)); } }} />}

          <Panel title="Redirect map" sub="Old address → new address for everything migrated. Add it to the old web server so bookmarks and search results keep working.">
            <div className="flex flex-wrap gap-2">
              {[["csv", "CSV"], ["nginx", "Nginx"], ["apache", "Apache .htaccess"]].map(([f, label]) => (
                <Button key={f} size="sm" variant="outline" onClick={() => downloadRedirects(f).catch((e) => toast.error(formatApiError(e)))}><Download /> {label}</Button>
              ))}
            </div>
          </Panel>

          <Panel title="Past migrations" testId="migration-history">
            {jobs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No migrations yet.</p>}
            <ul className="divide-y divide-line/5">
              {jobs.map((j) => (
                <li key={j.id}>
                  <button type="button" onClick={() => fetchMigration(j.id).then(setActive)} className="flex w-full flex-wrap items-center justify-between gap-2 py-2.5 text-left text-sm hover:text-teal">
                    <span className="min-w-0">
                      <span className="block truncate">{j.params?.url || SOURCES.find((s) => s.key === j.params?.source)?.label}</span>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(j.created_at)} · {j.counts?.created || 0} created · {j.counts?.failed || 0} failed</span>
                    </span>
                    <Badge className={STATUS_TONE[j.status]}>{j.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Good to know">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-teal" /> Running the same migration again skips what's already imported, so it's safe to resume after a cancel.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-teal" /> Migrated items show a "migrated" badge in Content, keep their original address, and can be edited like anything else.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-teal" /> Only public web addresses are fetched. Pages behind a login can be exported to CSV/JSON instead.</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
