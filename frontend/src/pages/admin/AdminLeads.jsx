import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bookmark, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Filter, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkPatchLeads, createView, deleteView, exportPeople, fetchLeadsMeta, fetchPeople, fetchViews, formatApiError } from "@/lib/adminApi";
import { CHANNEL_LABELS, LineBadge, ScoreBar, STAGE_LABELS, StageBadge, ago, productName, selectCls, useCan } from "@/components/admin/kit";
import { LeadDrawer } from "@/components/admin/LeadDrawer";

const PAGE_SIZE = 25;
const FILTER_KEYS = ["q", "line", "product", "stage", "owner", "channel", "country", "industry", "min_score", "date_field", "date_from", "date_to", "active_days"];
const SORTS = [
  { key: "score", label: "Highest score" },
  { key: "recent", label: "Most recent activity" },
  { key: "created", label: "Newest" },
  { key: "mql", label: "Newest MQL" },
  { key: "name", label: "Name" },
];

const presets = (threshold) => [
  { id: "all", name: "All leads", filters: {} },
  { id: "mql", name: "MQLs to work", filters: { stage: "mql" }, sort: "mql" },
  { id: "hot", name: "Hot this week", filters: { active_days: "7", min_score: String(threshold) }, sort: "recent" },
  { id: "unassigned", name: "Unassigned MQLs", filters: { stage: "mql", owner: "unassigned" } },
  { id: "pipeline", name: "SQL & pipeline", filters: { stage: "sql_plus" }, sort: "recent" },
];

export default function AdminLeads() {
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [views, setViews] = useState([]);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [openId, setOpenId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(params.get("q") || "");
  const [exporting, setExporting] = useState(null);

  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""]).filter(([, v]) => v)), [params]);
  const sort = params.get("sort") || "score";
  const page = Number(params.get("page") || 1);
  const threshold = meta?.settings?.mql_threshold ?? 45;

  const setFilter = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === "all" ? next.delete(k) : next.set(k, v)));
      if (!("page" in patch)) next.delete("page");
      return next;
    });
  }, [setParams]);

  useEffect(() => {
    fetchLeadsMeta().then(setMeta).catch((e) => toast.error(formatApiError(e)));
    fetchViews().then(setViews).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => (search.trim() !== (params.get("q") || "") ? setFilter({ q: search.trim() }) : null), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchPeople({ ...filters, sort, page, page_size: PAGE_SIZE }));
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page]);

  useEffect(() => {
    load();
    setSelected(new Set());
  }, [load]);

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const lineProducts = meta?.lines?.find((l) => l.key === filters.line)?.products || meta?.lines?.flatMap((l) => l.products) || [];
  const ownerName = (email) => meta?.owners?.find((m) => m.email === email)?.name || email;
  const activeCount = Object.keys(filters).filter((k) => k !== "q").length;

  const applyView = (v) => {
    const next = new URLSearchParams();
    Object.entries(v.filters || {}).forEach(([k, val]) => val && next.set(k, val));
    if (v.sort && v.sort !== "score") next.set("sort", v.sort);
    setSearch(v.filters?.q || "");
    setParams(next);
  };
  const isActiveView = (v) => {
    const f = v.filters || {};
    return Object.keys(filters).length === Object.keys(f).length && Object.entries(f).every(([k, val]) => filters[k] === val) && (v.sort || "score") === sort;
  };

  const saveView = async () => {
    const name = window.prompt("Name this view (shared with your team):");
    if (!name?.trim()) return;
    try {
      const v = await createView({ name: name.trim(), filters, sort });
      setViews((vs) => [...vs, v].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("View saved");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const removeView = async (v) => {
    if (!window.confirm(`Delete the view "${v.name}"?`)) return;
    try {
      await deleteView(v.id);
      setViews((vs) => vs.filter((x) => x.id !== v.id));
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const bulk = async (patch, label) => {
    try {
      const r = await bulkPatchLeads({ ids: [...selected], ...patch });
      toast.success(`${label} for ${r.updated} lead${r.updated === 1 ? "" : "s"}`);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const doExport = async (format) => {
    setExporting(format);
    try {
      await exportPeople({ ...filters, sort }, format);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setExporting(null);
    }
  };

  const toggleAll = (on) => setSelected(on ? new Set(data.items.map((i) => i.id)) : new Set());
  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  // Plain render helper (not a component) so selects keep focus across renders.
  const sel = (k, label, children) => (
    <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
      {label}
      <select value={filters[k] || ""} onChange={(e) => setFilter({ [k]: e.target.value })} className={selectCls} data-testid={`filter-${k}`}>{children}</select>
    </label>
  );

  return (
    <div data-testid="admin-leads-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Leads</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Every lead, tagged to what they want.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Scores combine what people did on the site with who they are. Leads become MQLs when they ask for a demo, trial or contact, or when their score passes {threshold}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => doExport("csv")} disabled={!!exporting} data-testid="export-csv">{exporting === "csv" ? <Loader2 className="animate-spin" /> : <Download />} CSV</Button>
          <Button variant="outline" size="sm" onClick={() => doExport("xlsx")} disabled={!!exporting} data-testid="export-xlsx">{exporting === "xlsx" ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Excel</Button>
        </div>
      </div>

      {/* Views */}
      <div className="mt-6 flex flex-wrap items-center gap-2" data-testid="lead-views">
        {presets(threshold).map((v) => (
          <button key={v.id} onClick={() => applyView(v)} className={cn("rounded-full border px-3.5 py-1.5 text-xs transition-colors", isActiveView(v) ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:text-foreground")} data-testid={`view-${v.id}`}>{v.name}</button>
        ))}
        {views.map((v) => (
          <span key={v.id} className={cn("group inline-flex items-center rounded-full border text-xs transition-colors", isActiveView(v) ? "border-teal bg-teal/15 text-foreground" : "border-line/15 text-muted-foreground hover:text-foreground")}>
            <button onClick={() => applyView(v)} className="inline-flex items-center gap-1.5 py-1.5 pl-3.5 pr-2"><Bookmark className="h-3 w-3" /> {v.name}</button>
            <button onClick={() => removeView(v)} aria-label={`Delete view ${v.name}`} className="pr-2.5 opacity-50 hover:opacity-100"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <Button variant="ghost" size="sm" onClick={saveView} className="text-xs" data-testid="save-view"><Bookmark /> Save current view</Button>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl border border-line/10 bg-card/60 p-3" data-testid="lead-filters">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, company, notes…" className="h-10 border-line/15 bg-background pl-9 text-sm" data-testid="lead-search" />
          </div>
          <select value={filters.line || ""} onChange={(e) => setFilter({ line: e.target.value, product: "" })} className={selectCls} aria-label="Product line" data-testid="filter-line-quick">
            <option value="">All product lines</option>
            {meta?.lines?.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
            <option value="none">No product signal yet</option>
          </select>
          <select value={filters.stage || ""} onChange={(e) => setFilter({ stage: e.target.value })} className={selectCls} aria-label="Stage" data-testid="filter-stage-quick">
            <option value="">Any stage</option>
            <option value="mql_plus">MQL or later</option>
            <option value="sql_plus">SQL or later</option>
            {meta?.stages?.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <select value={sort} onChange={(e) => setFilter({ sort: e.target.value === "score" ? "" : e.target.value })} className={selectCls} aria-label="Sort" data-testid="lead-sort">
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <Button variant={showFilters ? "secondary" : "ghost"} size="sm" onClick={() => setShowFilters((v) => !v)} data-testid="more-filters"><Filter /> More filters{activeCount ? ` (${activeCount})` : ""}</Button>
          {(activeCount > 0 || filters.q) && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setParams(new URLSearchParams()); }}>Clear</Button>}
        </div>
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/10 pt-3 md:grid-cols-4 xl:grid-cols-6">
            {sel("product", "Product", <>
              <option value="">Any product</option>
              {lineProducts.map((p) => <option key={p} value={p}>{productName(p)}</option>)}
            </>)}
            {sel("owner", "Owner", <>
              <option value="">Anyone</option>
              <option value="unassigned">Unassigned</option>
              {meta?.owners?.map((o) => <option key={o.email} value={o.email}>{o.name}</option>)}
            </>)}
            {sel("channel", "Source", <>
              <option value="">Any source</option>
              {meta?.channels?.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c] || c}</option>)}
            </>)}
            {sel("country", "Country", <>
              <option value="">Any country</option>
              {meta?.countries?.map((c) => <option key={c} value={c}>{c}</option>)}
            </>)}
            {sel("industry", "Industry", <>
              <option value="">Any industry</option>
              {meta?.industries?.map((c) => <option key={c} value={c}>{productName(c)}</option>)}
            </>)}
            {sel("active_days", "Active in", <>
              <option value="">Any time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </>)}
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Min score
              <Input type="number" min="0" value={filters.min_score || ""} onChange={(e) => setFilter({ min_score: e.target.value })} className="h-10 border-line/15 bg-background text-sm" data-testid="filter-min_score" />
            </label>
            {sel("date_field", "Date means", <>
              <option value="">Created</option>
              <option value="mql_at">Became MQL</option>
              <option value="last_activity_at">Last active</option>
            </>)}
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              From
              <Input type="date" value={filters.date_from || ""} onChange={(e) => setFilter({ date_from: e.target.value })} className="h-10 border-line/15 bg-background text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              To
              <Input type="date" value={filters.date_to || ""} onChange={(e) => setFilter({ date_to: e.target.value })} className="h-10 border-line/15 bg-background text-sm" />
            </label>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && can("editLeads") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 px-4 py-2.5 text-sm" data-testid="bulk-bar">
          <span className="font-medium">{selected.size} selected</span>
          <select defaultValue="" onChange={(e) => { if (e.target.value) bulk({ owner: e.target.value === "__none" ? "" : e.target.value }, "Owner updated"); e.target.value = ""; }} className={cn(selectCls, "h-9")} aria-label="Assign owner" data-testid="bulk-owner">
            <option value="" disabled>Assign owner…</option>
            <option value="__none">Unassign</option>
            {meta?.owners?.map((o) => <option key={o.email} value={o.email}>{o.name}</option>)}
          </select>
          <select defaultValue="" onChange={(e) => { if (e.target.value) bulk({ stage: e.target.value, reason: "Bulk update" }, "Stage updated"); e.target.value = ""; }} className={cn(selectCls, "h-9")} aria-label="Set stage" data-testid="bulk-stage">
            <option value="" disabled>Set stage…</option>
            {meta?.stages?.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line/10 bg-card">
        <table className="w-full min-w-[980px] text-sm" data-testid="leads-table">
          <thead className="border-b border-line/10 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3"><Checkbox checked={data.items.length > 0 && selected.size === data.items.length} onCheckedChange={(v) => toggleAll(!!v)} aria-label="Select all" /></th>
              <th className="px-2 py-3 font-normal">Lead</th>
              <th className="px-2 py-3 font-normal">Product line</th>
              <th className="px-2 py-3 font-normal">Top product</th>
              <th className="px-2 py-3 font-normal">Score</th>
              <th className="px-2 py-3 font-normal">Stage</th>
              <th className="px-2 py-3 font-normal">Owner</th>
              <th className="px-2 py-3 font-normal">Source</th>
              <th className="px-4 py-3 font-normal">Last active</th>
            </tr>
          </thead>
          <tbody className={cn(loading && "opacity-50")}>
            {data.items.map((l) => (
              <tr key={l.id} className="cursor-pointer border-b border-line/5 transition-colors hover:bg-line/5" onClick={() => setOpenId(l.id)} data-testid="lead-row">
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} aria-label={`Select ${l.email}`} /></td>
                <td className="max-w-[240px] px-2 py-3">
                  <p className="truncate font-medium text-foreground">{l.name || l.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{[l.company, l.job_title].filter(Boolean).join(" · ") || l.email}</p>
                </td>
                <td className="px-2 py-3"><LineBadge line={l.primary_line} /></td>
                <td className="max-w-[160px] truncate px-2 py-3 text-xs text-muted-foreground">{l.primary_product ? productName(l.primary_product) : "—"}</td>
                <td className="px-2 py-3"><ScoreBar score={l.score || 0} threshold={threshold} /></td>
                <td className="px-2 py-3"><StageBadge stage={l.stage} /></td>
                <td className="max-w-[140px] truncate px-2 py-3 text-xs text-muted-foreground">{l.owner ? ownerName(l.owner) : <span className="text-amber-300/80">Unassigned</span>}</td>
                <td className="px-2 py-3 text-xs text-muted-foreground">{CHANNEL_LABELS[l.channel] || l.channel || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{ago(l.last_activity_at || l.created_at)}</td>
              </tr>
            ))}
            {!loading && data.items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-16 text-center text-muted-foreground" data-testid="leads-empty">No leads match these filters yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span data-testid="leads-total">{data.total.toLocaleString()} lead{data.total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter({ page: String(page - 1) })} aria-label="Previous page"><ChevronLeft /></Button>
          <span className="font-mono text-xs">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setFilter({ page: String(page + 1) })} aria-label="Next page"><ChevronRight /></Button>
        </div>
      </div>

      <LeadDrawer id={openId} meta={meta} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}
