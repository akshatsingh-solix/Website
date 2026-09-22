import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bot, Check, ChevronLeft, ChevronRight, Download, Loader2, Search, Trash2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteLead, downloadLeadsCsv, fetchLeads, fetchSettings, fetchStats, fetchTeam, formatApiError, updateLead } from "@/lib/adminApi";

const TYPES = [
  { key: "all", label: "All" }, { key: "demo", label: "Demo" }, { key: "contact", label: "Contact" }, { key: "partner", label: "Partner" },
  { key: "career", label: "Career" }, { key: "download", label: "Download" }, { key: "newsletter", label: "Newsletter" },
];
const STATUSES = [
  { key: "all", label: "Any status" }, { key: "new", label: "New" }, { key: "contacted", label: "Contacted" }, { key: "qualified", label: "Qualified" },
];
const STATUS_TONE = { new: "bg-white/5 text-slate-300 border-white/15", contacted: "bg-amber-500/10 text-amber-300 border-amber-500/30", qualified: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
const TYPE_TONE = { demo: "bg-primary/15 text-primary border-primary/30", contact: "bg-teal/10 text-teal border-teal/30", partner: "bg-violet-500/10 text-violet-300 border-violet-500/30", career: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", download: "bg-sky-500/10 text-sky-300 border-sky-500/30", newsletter: "bg-white/5 text-slate-300 border-white/15" };
const PAGE_SIZE = 25;
const TEST_INBOX = "delivered@resend.dev";

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const TypeBadge = ({ type }) => <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]", TYPE_TONE[type] ?? TYPE_TONE.newsletter)}>{type}</span>;
const StatusBadge = ({ status = "new" }) => <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]", STATUS_TONE[status] ?? STATUS_TONE.new)} data-testid={`status-badge-${status}`}>{status}</span>;

const LeadWorkflow = ({ lead, team, onSaved }) => {
  const [status, setStatus] = useState(lead.status || "new");
  const [notes, setNotes] = useState(lead.notes || "");
  const [owner, setOwner] = useState(lead.owner || "");
  const [saving, setSaving] = useState(false);
  const dirty = status !== (lead.status || "new") || notes !== (lead.notes || "") || owner !== (lead.owner || "");

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateLead(lead.id, { status, notes, owner });
      toast.success("Lead updated");
      onSaved(updated);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const selectCls = "h-10 w-full rounded-lg border border-white/15 bg-ink-900 px-3 text-sm text-slate-200 outline-none focus:border-primary/60";

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-card p-4" data-testid="lead-workflow">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Status</p>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {STATUSES.slice(1).map((s) => (
              <button key={s.key} role="radio" aria-checked={status === s.key} onClick={() => setStatus(s.key)} data-testid={`lead-status-${s.key}`} className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", status === s.key ? "border-primary bg-primary text-white" : "border-white/15 text-slate-300 hover:border-white/40")}>{s.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-3">Owner</p>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={selectCls} data-testid="lead-owner-select" aria-label="Assign owner">
            <option value="">Unassigned</option>
            {team.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
          </select>
          {team.length === 0 && <p className="mt-1.5 text-[11px] text-muted-foreground">Add salespeople in <Link to="/admin/settings" className="text-primary hover:underline">Alerts & settings</Link>.</p>}
        </div>
      </div>
      <p className="eyebrow mb-2 mt-5">Private notes</p>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Call summary, next step, owner…" className="rounded-lg border-white/15 bg-ink-900 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0" data-testid="lead-notes-input" />
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{lead.updated_at ? `Last updated ${fmt(lead.updated_at)}` : "Not yet worked"}</span>
        <Button size="sm" onClick={save} disabled={!dirty || saving} data-testid="lead-save-button">{saving ? <Loader2 className="animate-spin" /> : <Check />} Save</Button>
      </div>
    </div>
  );
};

const Stat = ({ label, value, tone = "text-foreground", testId }) => (
  <div className="rounded-2xl border border-white/10 bg-card p-5">
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className={cn("mt-2 font-display text-4xl font-medium tracking-tighter", tone)} data-testid={testId}>{value ?? "—"}</p>
  </div>
);

const Detail = ({ label, value }) => value ? (
  <div className="grid grid-cols-3 gap-3 border-b border-white/5 py-2.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="col-span-2 break-words text-slate-200">{value}</dd>
  </div>
) : null;

export default function AdminLeads() {
  const [stats, setStats] = useState(null);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const [team, setTeam] = useState([]);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [alertEmail, setAlertEmail] = useState(null);

  useEffect(() => {
    fetchSettings().then((s) => setAlertEmail(s.alert_email)).catch(() => {});
    fetchTeam().then((t) => setTeam(t.members)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => setPage(1), [type, status, owner, debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([fetchStats(), fetchLeads({ type, status, owner, q: debounced || undefined, page, page_size: PAGE_SIZE })]);
      setStats(s);
      setData(d);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [type, status, owner, debounced, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const filtered = type !== "all" || status !== "all" || owner !== "all" || debounced;
  const ownerName = (email) => team.find((m) => m.email === email)?.name || email;

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadLeadsCsv({ type, status, owner, q: debounced || undefined });
      toast.success("CSV exported");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this submission permanently?")) return;
    try {
      await deleteLead(id);
      toast.success("Submission deleted");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const onSaved = (updated) => {
    setSelected(updated);
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === updated.id ? updated : i)) }));
    fetchStats().then(setStats).catch(() => {});
  };

  return (
    <div data-testid="admin-leads-page">
      {alertEmail === TEST_INBOX && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between" data-testid="alert-inbox-banner">
          <span className="flex items-center gap-3"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" /> Lead alerts are still going to the test inbox <code className="font-mono text-xs">{TEST_INBOX}</code>. Set your real sales email so the team gets notified.</span>
          <Button asChild size="sm" variant="secondary" data-testid="alert-inbox-banner-link"><Link to="/admin/settings">Set sales inbox</Link></Button>
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Leads</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Every submission, in one place.</h1>
        </div>
        <Button onClick={onExport} disabled={exporting || data.total === 0} data-testid="admin-export-csv">
          {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export CSV{filtered ? " (filtered)" : ""}
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Total leads" value={stats?.total} testId="admin-stat-total" />
        <Stat label="Last 7 days" value={stats?.last_7_days} tone="text-teal" testId="admin-stat-week" />
        <Stat label="Demo requests" value={stats?.by_type?.demo ?? 0} tone="text-primary" testId="admin-stat-demo" />
        <Stat label="Awaiting contact" value={stats?.by_status?.new ?? 0} tone="text-amber-300" testId="admin-stat-new" />
        <Stat label="Qualified" value={stats?.by_status?.qualified ?? 0} tone="text-emerald-300" testId="admin-stat-qualified" />
        <Stat label="Booked by Sol (chat)" value={stats?.chat_leads} testId="admin-stat-chat" />
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="tablist" data-testid="admin-type-filters">
          {TYPES.map((t) => (
            <button key={t.key} role="tab" aria-selected={type === t.key} onClick={() => setType(t.key)} data-testid={`admin-filter-${t.key}`} className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", type === t.key ? "border-primary bg-primary text-white" : "border-white/15 text-slate-300 hover:border-white/40 hover:text-foreground")}>
              {t.label}{stats?.by_type && t.key !== "all" && <span className="ml-1.5 font-mono text-[10px] opacity-70">{stats.by_type[t.key] ?? 0}</span>}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" data-testid="admin-status-filter" className="h-9 rounded-full border border-white/15 bg-ink-900 px-3 text-sm text-slate-300 outline-none focus:border-primary/60">
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner" data-testid="admin-owner-filter" className="h-9 rounded-full border border-white/15 bg-ink-900 px-3 text-sm text-slate-300 outline-none focus:border-primary/60">
            <option value="all">Any owner</option>
            <option value="unassigned">Unassigned{stats?.by_owner ? ` (${stats.by_owner.unassigned ?? 0})` : ""}</option>
            {team.map((m) => <option key={m.email} value={m.email}>{m.name}{stats?.by_owner ? ` (${stats.by_owner[m.email] ?? 0})` : ""}</option>)}
          </select>
        </div>
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company, message" className="h-10 rounded-full border-white/15 bg-ink-900 pl-11 focus-visible:ring-primary" data-testid="admin-search-input" aria-label="Search leads" />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-card">
        <Table data-testid="admin-leads-table">
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em]">Received</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em]">Type</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em]">Status</TableHead>
              <TableHead className="hidden font-mono text-[10px] uppercase tracking-[0.16em] xl:table-cell">Owner</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em]">Contact</TableHead>
              <TableHead className="hidden font-mono text-[10px] uppercase tracking-[0.16em] md:table-cell">Company</TableHead>
              <TableHead className="hidden font-mono text-[10px] uppercase tracking-[0.16em] lg:table-cell">Interest / role / resource</TableHead>
              <TableHead className="hidden font-mono text-[10px] uppercase tracking-[0.16em] md:table-cell">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : data.items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-16 text-center text-muted-foreground" data-testid="admin-leads-empty">No submissions match.</TableCell></TableRow>
            ) : (
              data.items.map((s) => (
                <TableRow key={s.id} onClick={() => setSelected(s)} data-testid={`admin-lead-row-${s.id}`} className="cursor-pointer border-white/5 transition-colors hover:bg-white/[0.04]">
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{fmt(s.created_at)}</TableCell>
                  <TableCell><TypeBadge type={s.type} /></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="hidden text-sm xl:table-cell" data-testid="lead-owner-cell">{s.owner ? <span className="inline-flex items-center gap-1.5 text-slate-200"><UserCircle2 className="h-3.5 w-3.5 text-teal" /> {ownerName(s.owner)}</span> : <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell>
                    <p className="font-medium">{s.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{s.company || "—"}</TableCell>
                  <TableCell className="hidden max-w-[260px] truncate text-sm text-slate-300 lg:table-cell">{s.interest || s.role || s.resource || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {s.source === "chat" ? <span className="inline-flex items-center gap-1.5 text-xs text-teal"><Bot className="h-3.5 w-3.5" /> Sol chat</span> : <span className="text-xs text-muted-foreground">{s.source_page || "web"}</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-muted-foreground">
          <span data-testid="admin-leads-count">{data.total} result{data.total === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} data-testid="admin-prev-page"><ChevronLeft /> Prev</Button>
            <span className="font-mono">{page} / {pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} data-testid="admin-next-page">Next <ChevronRight /></Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-ink-950 sm:max-w-xl" data-testid="admin-lead-dialog">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3"><TypeBadge type={selected.type} /><StatusBadge status={selected.status} />{selected.source === "chat" && <span className="inline-flex items-center gap-1 text-xs text-teal"><Bot className="h-3.5 w-3.5" /> Booked by Sol</span>}</div>
                <DialogTitle className="font-display text-2xl font-medium tracking-tight">{selected.name || selected.email}</DialogTitle>
                <DialogDescription className="font-mono text-xs">{fmt(selected.created_at)} · {selected.id}</DialogDescription>
              </DialogHeader>
              <dl className="mt-2">
                <Detail label="Email" value={<a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a>} />
                <Detail label="Company" value={selected.company} />
                <Detail label="Job title" value={selected.job_title} />
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Interest" value={selected.interest} />
                <Detail label="Role applied" value={selected.role} />
                <Detail label="Resource" value={selected.resource} />
                <Detail label="Message" value={selected.message} />
                <Detail label="Owner" value={selected.owner ? ownerName(selected.owner) : null} />
                <Detail label="Source" value={selected.source === "chat" ? "AI concierge chat" : selected.source_page || "web"} />
              </dl>
              <LeadWorkflow key={selected.id + (selected.updated_at || "")} lead={selected} team={team} onSaved={onSaved} />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => onDelete(selected.id)} data-testid="admin-delete-lead" className="border-red-500/30 text-red-300 hover:border-red-500/60 hover:bg-red-500/10"><Trash2 /> Delete</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
