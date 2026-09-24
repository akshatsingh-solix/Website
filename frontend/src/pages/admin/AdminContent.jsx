import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, ExternalLink, Eye, EyeOff, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { archiveContent, fetchContentList, formatApiError, publishContent, unpublishContent } from "@/lib/adminApi";
import { Badge, ago, fmtDateTime, selectCls, useCan } from "@/components/admin/kit";

export const TYPE_LABELS = {
  blog: "Blog", whitepaper: "White paper", datasheet: "Datasheet", casestudy: "Case study", ebook: "eBook", webinar: "Webinar",
  podcast: "Podcast", leadership: "Leadership lesson", event: "Event", brief: "Solution brief", collateral: "Marketing material",
};
const STATUS_TONE = {
  draft: "border-line/15 bg-line/5 text-muted-foreground",
  scheduled: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  published: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  archived: "border-line/15 bg-line/5 text-muted-foreground",
};
const TABS = [
  { key: "all", label: "All" }, { key: "published", label: "Published" }, { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" }, { key: "archived", label: "Archived" },
];

export const StatusBadge = ({ status }) => <Badge className={STATUS_TONE[status] || STATUS_TONE.draft} testId={`content-status-${status}`}>{status}</Badge>;

export default function AdminContent() {
  const can = useCan();
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchContentList({ status, type, q: q.trim() || undefined, page_size: 100 }));
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [status, type, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const act = async (item, fn, msg) => {
    setBusy(item.id);
    try {
      await fn();
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid="admin-content-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Content</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Publish straight to the website.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Blogs, white papers, datasheets, case studies, webinars and marketing material. Published items appear in Resources within about a minute, and each item's product tags feed lead scoring.</p>
        </div>
        {can("editContent") && <Button onClick={() => navigate("/admin/content/new")} data-testid="content-new"><Plus /> New content</Button>}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line/10 bg-card/60 p-3">
        <div className="flex flex-wrap gap-1" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={status === t.key} onClick={() => setStatus(t.key)} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", status === t.key ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:text-foreground")} data-testid={`content-tab-${t.key}`}>{t.label}</button>
          ))}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={cn(selectCls, "h-9 text-xs")} aria-label="Type">
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="relative ml-auto min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles…" className="h-9 border-line/15 bg-background pl-9 text-sm" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line/10 bg-card">
        <table className="w-full min-w-[860px] text-sm" data-testid="content-table">
          <thead className="border-b border-line/10 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-normal">Title</th>
              <th className="px-2 py-3 font-normal">Type</th>
              <th className="px-2 py-3 font-normal">Status</th>
              <th className="px-2 py-3 font-normal">Views (30d)</th>
              <th className="px-2 py-3 font-normal">Downloads (30d)</th>
              <th className="px-2 py-3 font-normal">Updated</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className={cn(loading && "opacity-50")}>
            {data.items.map((c) => (
              <tr key={c.id} className="border-b border-line/5 hover:bg-line/5" data-testid="content-row">
                <td className="max-w-[360px] px-4 py-3">
                  <Link to={`/admin/content/${c.id}`} className="block truncate font-medium text-foreground hover:text-teal">{c.title}</Link>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">/resources/{c.slug}{c.gated ? " · gated" : ""}</p>
                </td>
                <td className="px-2 py-3 text-xs text-muted-foreground">{TYPE_LABELS[c.type] || c.type}</td>
                <td className="px-2 py-3">
                  <StatusBadge status={c.status} />
                  {c.status === "scheduled" && <p className="mt-1 text-[11px] text-muted-foreground">{fmtDateTime(c.publish_at)}</p>}
                </td>
                <td className="px-2 py-3 font-mono text-xs">{c.views_30d}</td>
                <td className="px-2 py-3 font-mono text-xs">{c.downloads_30d}</td>
                <td className="px-2 py-3 text-xs text-muted-foreground" title={fmtDateTime(c.updated_at)}>{ago(c.updated_at)}<br /><span className="text-[10px]">{c.updated_by}</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {c.live && (
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2" title="View on site"><a href={`${process.env.PUBLIC_URL}/resources/${c.slug}`} target="_blank" rel="noreferrer"><ExternalLink /></a></Button>
                    )}
                    {can("editContent") && c.status !== "archived" && (c.status === "draft" ? (
                      <Button variant="ghost" size="sm" className="h-8 px-2" title="Publish now" disabled={busy === c.id} onClick={() => act(c, () => publishContent(c.id), "Published")} data-testid="content-publish">{busy === c.id ? <Loader2 className="animate-spin" /> : <Eye />}</Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 px-2" title="Unpublish" disabled={busy === c.id} onClick={() => act(c, () => unpublishContent(c.id), "Moved to drafts")}><EyeOff /></Button>
                    ))}
                    {can("editContent") && c.status !== "archived" && (
                      <Button variant="ghost" size="sm" className="h-8 px-2" title="Archive" disabled={busy === c.id} onClick={() => window.confirm(`Archive "${c.title}"? It will be removed from the website.`) && act(c, () => archiveContent(c.id), "Archived")}><Archive /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && data.items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">Nothing here yet.{can("editContent") && <> <Link to="/admin/content/new" className="text-teal hover:underline">Create your first item</Link>.</>}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{data.total} item{data.total === 1 ? "" : "s"} · Built-in resources that ship with the site aren't listed here; publishing an item with the same URL slug replaces one.</p>
    </div>
  );
}
