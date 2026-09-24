import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Check, Download, ExternalLink, FileSpreadsheet, Loader2, Plus, Save, Search, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  exportRegistrations, fetchEvents, fetchEventSettings, fetchRegistrations, formatApiError, patchRegistration, saveEventSettings,
} from "@/lib/adminApi";
import { Badge, Panel, StatTile, ago, inputCls, selectCls, useCan } from "@/components/admin/kit";
import { EMPOWER_URL } from "@/lib/empower";

const STATUS_LABELS = {
  confirmed: "Confirmed", paid: "Paid", payment_reported: "Payment reported", pending_payment: "Awaiting payment",
  invoice_requested: "Invoice requested", waitlisted: "Waitlisted", cancelled: "Cancelled",
};
const STATUS_TONE = {
  confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  payment_reported: "border-sky-500/30 bg-sky-500/10 text-sky-700", pending_payment: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  invoice_requested: "border-sky-500/30 bg-sky-500/10 text-sky-700", waitlisted: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  cancelled: "border-line/15 bg-line/5 text-muted-foreground",
};
const PROVIDERS = [
  { key: "free", label: "Free (complimentary)", help: "Confirmed instantly." },
  { key: "eventbrite", label: "Eventbrite checkout", help: "Payment in the Eventbrite widget; order id is reported back." },
  { key: "stripe_link", label: "Stripe Payment Link", help: "Redirects to your Stripe link with the registration code." },
  { key: "invoice", label: "Invoice / PO", help: "Seat held; your team invoices and marks it paid." },
];
const money = (cents, currency = "USD") => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format((cents || 0) / 100);
const FILTERS = ["q", "status", "ticket", "interest", "checked_in"];

function Bars({ data, labels = {}, total }) {
  const rows = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No registrations yet.</p>;
  const max = Math.max(total || 0, ...rows.map(([, v]) => v), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map(([k, v]) => (
        <li key={k}>
          <div className="flex justify-between text-xs"><span className="text-foreground">{labels[k] || k}</span><span className="tabular-nums text-muted-foreground">{v}</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/10"><div className="h-full rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Registrations({ slug, event }) {
  const can = useCan();
  const canWork = can("editLeads") || can("editContent");
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(FILTERS.map((k) => [k, params.get(k) || ""]).filter(([, v]) => v)), [params]);
  const page = Number(params.get("page") || 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") || "");
  const [exporting, setExporting] = useState(null);

  const setFilter = (patch) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === "all" ? next.delete(k) : next.set(k, v)));
    if (!("page" in patch)) next.delete("page");
    return next;
  });

  const load = useCallback(() => {
    setLoading(true);
    fetchRegistrations(slug, { ...filters, page, page_size: 50 })
      .then(setData).catch((e) => toast.error(formatApiError(e))).finally(() => setLoading(false));
  }, [slug, filters, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => search !== (params.get("q") || "") && setFilter({ q: search }), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (reg, body) => {
    try {
      const next = await patchRegistration(slug, reg.id, body);
      setData((d) => ({ ...d, items: d.items.map((r) => (r.id === reg.id ? next : r)) }));
      if ("status" in body) load();
    } catch (e) { toast.error(formatApiError(e)); }
  };
  const doExport = async (format) => {
    setExporting(format);
    try { await exportRegistrations(slug, filters, format); } catch (e) { toast.error(formatApiError(e)); } finally { setExporting(null); }
  };

  const s = data?.stats;
  const tickets = event?.tickets || [];
  const days = Object.fromEntries((event?.days || []).map((d) => [d.id, d.label]));
  const interests = data?.interests || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Registered" value={s?.registered} sub={event?.capacity ? `of ${event.capacity} seats` : "no cap set"} testId="events-stat-registered" />
        <StatTile label="Checked in" value={s?.checked_in} sub={s?.registered ? `${Math.round((s.checked_in / s.registered) * 100)}% of registered` : null} />
        <StatTile label="Seats left" value={s?.seats_left ?? "∞"} />
        <StatTile label="Awaiting payment" value={s ? (s.by_status.pending_payment || 0) + (s.by_status.invoice_requested || 0) : null} sub={s?.by_status.payment_reported ? `${s.by_status.payment_reported} reported paid` : null} />
        <StatTile label="Waitlist" value={s?.by_status.waitlisted} />
        <StatTile label="Revenue" value={s ? money(s.revenue) : null} sub="confirmed + paid" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="What attendees want" sub="Interests chosen at registration (scored into their lead)"><Bars data={s?.by_interest} labels={interests} total={s?.registered} /></Panel>
        <Panel title="Days & receptions" sub={s ? `${s.hackathon} interested in the hackathon` : null}>
          <Bars data={s?.by_day} labels={days} total={s?.registered} />
          {s && Object.keys(s.dinners || {}).length > 0 && <div className="mt-5 border-t border-line/10 pt-4"><p className="mb-2 text-xs font-medium text-muted-foreground">Evening receptions</p><Bars data={s.dinners} labels={Object.fromEntries((event?.days || []).map((d) => [d.id, d.dinner || d.label]))} total={s.registered} /></div>}
        </Panel>
        <Panel title="Where registrations come from" sub="utm_source of each registration">
          <Bars data={Object.fromEntries((s?.sources || []).map((x) => [x.source, x.count]))} total={s?.registered} />
        </Panel>
      </div>

      <Panel
        title="Registrations"
        sub={data ? `${data.total} matching` : null}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => doExport("csv")} disabled={!!exporting} data-testid="events-export-csv">{exporting === "csv" ? <Loader2 className="animate-spin" /> : <Download />} CSV</Button>
            <Button variant="outline" size="sm" onClick={() => doExport("xlsx")} disabled={!!exporting}>{exporting === "xlsx" ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Excel</Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, company or code" className={cn(inputCls, "pl-9")} data-testid="events-search" />
          </div>
          <select className={selectCls} value={filters.status || "all"} onChange={(e) => setFilter({ status: e.target.value })} aria-label="Status">
            <option value="all">All statuses</option><option value="active">Active (not waitlist/cancelled)</option>
            {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {tickets.length > 1 && (
            <select className={selectCls} value={filters.ticket || "all"} onChange={(e) => setFilter({ ticket: e.target.value })} aria-label="Pass">
              <option value="all">All passes</option>{tickets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <select className={selectCls} value={filters.interest || "all"} onChange={(e) => setFilter({ interest: e.target.value })} aria-label="Interest">
            <option value="all">All interests</option>{Object.entries(interests).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select className={selectCls} value={filters.checked_in || "all"} onChange={(e) => setFilter({ checked_in: e.target.value })} aria-label="Check-in">
            <option value="all">Checked in or not</option><option value="true">Checked in</option><option value="false">Not checked in</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm" data-testid="events-table">
            <thead>
              <tr className="border-b border-line/10 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Attendee</th><th className="py-2 pr-3 font-medium">Code</th><th className="py-2 pr-3 font-medium">Pass</th>
                <th className="py-2 pr-3 font-medium">Interests</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 pr-3 font-medium">Check-in</th><th className="py-2 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {data?.items.map((r) => (
                <tr key={r.id} className="border-b border-line/5 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-foreground">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-muted-foreground">{r.job_title} · {r.company}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">{r.code}{r.payment_reference && <p className="mt-1 text-[10px] text-muted-foreground">ref {r.payment_reference}</p>}</td>
                  <td className="py-3 pr-3 text-xs">{r.ticket_name}<p className="text-muted-foreground">{r.amount ? money(r.amount, r.currency) : "Free"}{r.promo_code ? ` · ${r.promo_code}` : ""}</p></td>
                  <td className="py-3 pr-3"><div className="flex max-w-[220px] flex-wrap gap-1">{(r.interests || []).map((i) => <Badge key={i} className="border-line/15 bg-line/5 text-[10px] text-muted-foreground">{interests[i] || i}</Badge>)}{r.hackathon && <Badge className="border-primary/30 bg-primary/10 text-[10px] text-primary-ink">Hackathon</Badge>}</div></td>
                  <td className="py-3 pr-3">
                    {canWork ? (
                      <select className={cn(selectCls, "h-8 text-xs")} value={r.status} onChange={(e) => update(r, { status: e.target.value })} aria-label={`Status for ${r.email}`}>
                        {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    ) : <Badge className={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status] || r.status}</Badge>}
                  </td>
                  <td className="py-3 pr-3">
                    <Button size="sm" variant={r.checked_in ? "default" : "outline"} disabled={!canWork} onClick={() => update(r, { checked_in: !r.checked_in })} data-testid={`checkin-${r.code}`}>
                      {r.checked_in ? <><Check /> In</> : <><UserCheck /> Check in</>}
                    </Button>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">{ago(r.created_at)}</td>
                </tr>
              ))}
              {data && data.items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No registrations match.</td></tr>}
            </tbody>
          </table>
        </div>
        {data && data.total > data.page_size && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter({ page: String(page - 1) })}>Previous</Button>
            <span className="text-muted-foreground">Page {page} of {Math.ceil(data.total / data.page_size)}</span>
            <Button variant="outline" size="sm" disabled={page * data.page_size >= data.total} onClick={() => setFilter({ page: String(page + 1) })}>Next</Button>
          </div>
        )}
      </Panel>
    </div>
  );
}

const newTicket = () => ({ id: "", name: "", description: "", price: 0, currency: "USD", provider: "free", capacity: null, eventbrite_event_id: null, payment_link: null, sales_end_at: null, active: true });
const newPromo = () => ({ code: "", percent_off: 10, active: true, max_uses: null, tickets: [], uses: 0 });

function Settings({ slug, event, onSaved }) {
  const can = useCan();
  const editable = can("editContent");
  const [form, setForm] = useState(event);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(event), [event]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setTicket = (i, patch) => set({ tickets: form.tickets.map((t, n) => (n === i ? { ...t, ...patch } : t)) });
  const setPromo = (i, patch) => set({ promo_codes: form.promo_codes.map((p, n) => (n === i ? { ...p, ...patch } : p)) });
  const num = (v) => (v === "" || v == null ? null : Number(v));

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name, theme: form.theme || "", registration_open: !!form.registration_open, capacity: form.capacity || null,
        contact_email: form.contact_email || null, eventbrite_event_id: form.eventbrite_event_id || null, refund_policy: form.refund_policy || null,
        tickets: form.tickets.map((t) => ({ ...t, id: t.id || t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), price: Math.round(Number(t.price) || 0), capacity: t.capacity || null, eventbrite_event_id: t.eventbrite_event_id || null, payment_link: t.payment_link || null, sales_end_at: t.sales_end_at || null })),
        promo_codes: form.promo_codes || [],
      };
      const saved = await saveEventSettings(slug, body);
      toast.success("Saved. The Empower site picks this up within a minute.");
      onSaved(saved);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;
  return (
    <div className="space-y-6">
      <Panel title="Registration" sub="Controls what the Empower site shows and accepts.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line/10 p-4 text-sm md:col-span-2">
            <span><span className="font-medium">Registration open</span><span className="block text-xs text-muted-foreground">When off, the site shows "Registration closed" and accepts no new sign-ups.</span></span>
            <Switch checked={!!form.registration_open} onCheckedChange={(v) => set({ registration_open: v })} disabled={!editable} data-testid="events-open" />
          </label>
          <label className="text-sm"><span className="mb-1 block font-medium">Event name</span><Input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} disabled={!editable} /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Total capacity</span><Input type="number" min={1} className={inputCls} value={form.capacity ?? ""} onChange={(e) => set({ capacity: num(e.target.value) })} placeholder="No limit" disabled={!editable} /><span className="mt-1 block text-xs text-muted-foreground">When full, new registrations join the waitlist.</span></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Contact email</span><Input className={inputCls} value={form.contact_email || ""} onChange={(e) => set({ contact_email: e.target.value })} disabled={!editable} /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Eventbrite event ID</span><Input className={inputCls} value={form.eventbrite_event_id || ""} onChange={(e) => set({ eventbrite_event_id: e.target.value.replace(/\D/g, "") })} disabled={!editable} /><span className="mt-1 block text-xs text-muted-foreground">Used by passes paid through Eventbrite.</span></label>
          <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium">Refund policy</span><Input className={inputCls} value={form.refund_policy || ""} onChange={(e) => set({ refund_policy: e.target.value })} placeholder="e.g. Refunds up to 7 days before the event." disabled={!editable} /><span className="mt-1 block text-xs text-muted-foreground">Shown next to the price and at checkout on the Empower site.</span></label>
        </div>
      </Panel>

      <Panel title="Passes & payment" sub="Prices in the pass currency. Each pass picks how it's paid; no payment keys are stored here."
        action={editable && <Button size="sm" variant="outline" onClick={() => set({ tickets: [...form.tickets, newTicket()] })}><Plus /> Add pass</Button>}>
        <div className="space-y-4">
          {form.tickets.map((t, i) => (
            <div key={i} className="rounded-xl border border-line/10 p-4" data-testid={`ticket-editor-${i}`}>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-xs md:col-span-2"><span className="mb-1 block font-medium">Name</span><Input className={inputCls} value={t.name} onChange={(e) => setTicket(i, { name: e.target.value })} disabled={!editable} /></label>
                <label className="text-xs"><span className="mb-1 block font-medium">ID</span><Input className={cn(inputCls, "font-mono")} value={t.id} onChange={(e) => setTicket(i, { id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="auto from name" disabled={!editable || !!event.tickets.find((x) => x.id === t.id && t.id)} /></label>
                <label className="flex items-end justify-between gap-2 text-xs"><span className="font-medium">Active</span><Switch checked={t.active} onCheckedChange={(v) => setTicket(i, { active: v })} disabled={!editable} /></label>
                <label className="text-xs md:col-span-4"><span className="mb-1 block font-medium">Description</span><Input className={inputCls} value={t.description || ""} onChange={(e) => setTicket(i, { description: e.target.value })} disabled={!editable} /></label>
                <label className="text-xs"><span className="mb-1 block font-medium">Payment</span>
                  <select className={cn(selectCls, "w-full")} value={t.provider} onChange={(e) => setTicket(i, { provider: e.target.value, ...(e.target.value === "free" ? { price: 0 } : {}) })} disabled={!editable} data-testid={`ticket-provider-${i}`}>
                    {PROVIDERS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <span className="mt-1 block text-muted-foreground">{PROVIDERS.find((p) => p.key === t.provider)?.help}</span>
                </label>
                <label className="text-xs"><span className="mb-1 block font-medium">Price ({t.currency})</span><Input type="number" min={0} step="0.01" className={inputCls} value={t.price ? t.price / 100 : 0} onChange={(e) => setTicket(i, { price: Math.round(Number(e.target.value || 0) * 100) })} disabled={!editable || t.provider === "free"} data-testid={`ticket-price-${i}`} /></label>
                <label className="text-xs"><span className="mb-1 block font-medium">Currency</span><Input className={cn(inputCls, "uppercase")} maxLength={3} value={t.currency} onChange={(e) => setTicket(i, { currency: e.target.value.toUpperCase() })} disabled={!editable} /></label>
                <label className="text-xs md:col-span-2"><span className="mb-1 block font-medium">Sales end</span><Input className={cn(inputCls, "font-mono")} value={t.sales_end_at || ""} onChange={(e) => setTicket(i, { sales_end_at: e.target.value.trim() })} placeholder="2026-10-28T23:59:00-07:00" disabled={!editable} /><span className="mt-1 block text-muted-foreground">Registration for this pass closes after this time. Leave empty for no end.</span></label>
                <label className="text-xs"><span className="mb-1 block font-medium">Seats for this pass</span><Input type="number" min={1} className={inputCls} value={t.capacity ?? ""} onChange={(e) => setTicket(i, { capacity: num(e.target.value) })} placeholder="No limit" disabled={!editable} /></label>
                {t.provider === "stripe_link" && <label className="text-xs md:col-span-4"><span className="mb-1 block font-medium">Stripe Payment Link</span><Input className={inputCls} value={t.payment_link || ""} onChange={(e) => setTicket(i, { payment_link: e.target.value })} placeholder="https://buy.stripe.com/..." disabled={!editable} data-testid={`ticket-link-${i}`} /><span className="mt-1 block text-muted-foreground">In Stripe, set the link's confirmation page to redirect to {new URL(`${EMPOWER_URL}register/confirmed`, window.location.origin).href}</span></label>}
                {t.provider === "eventbrite" && <label className="text-xs md:col-span-2"><span className="mb-1 block font-medium">Eventbrite event ID (optional)</span><Input className={inputCls} value={t.eventbrite_event_id || ""} onChange={(e) => setTicket(i, { eventbrite_event_id: e.target.value.replace(/\D/g, "") })} placeholder={form.eventbrite_event_id || "uses the event's ID"} disabled={!editable} /></label>}
              </div>
              {editable && form.tickets.length > 1 && <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground" onClick={() => set({ tickets: form.tickets.filter((_, n) => n !== i) })}><Trash2 /> Remove pass</Button>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Promo codes" sub="Percentage discounts on paid passes. Leave passes empty to apply to all."
        action={editable && <Button size="sm" variant="outline" onClick={() => set({ promo_codes: [...(form.promo_codes || []), newPromo()] })} data-testid="promo-add"><Plus /> Add code</Button>}>
        {(form.promo_codes || []).length === 0 && <p className="text-sm text-muted-foreground">No promo codes.</p>}
        <div className="space-y-2">
          {(form.promo_codes || []).map((p, i) => (
            <div key={i} className="grid items-end gap-3 rounded-xl border border-line/10 p-3 sm:grid-cols-[1.2fr_0.7fr_0.8fr_1.2fr_auto_auto]">
              <label className="text-xs"><span className="mb-1 block font-medium">Code</span><Input className={cn(inputCls, "font-mono uppercase")} value={p.code} onChange={(e) => setPromo(i, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} disabled={!editable} /></label>
              <label className="text-xs"><span className="mb-1 block font-medium">% off</span><Input type="number" min={1} max={100} className={inputCls} value={p.percent_off} onChange={(e) => setPromo(i, { percent_off: Number(e.target.value) })} disabled={!editable} /></label>
              <label className="text-xs"><span className="mb-1 block font-medium">Max uses</span><Input type="number" min={1} className={inputCls} value={p.max_uses ?? ""} onChange={(e) => setPromo(i, { max_uses: num(e.target.value) })} placeholder="∞" disabled={!editable} /></label>
              <label className="text-xs"><span className="mb-1 block font-medium">Passes</span>
                <select multiple className={cn(selectCls, "h-10 w-full")} value={p.tickets || []} onChange={(e) => setPromo(i, { tickets: [...e.target.selectedOptions].map((o) => o.value) })} disabled={!editable}>
                  {form.tickets.filter((t) => t.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 pb-2 text-xs"><Switch checked={p.active} onCheckedChange={(v) => setPromo(i, { active: v })} disabled={!editable} /> {p.uses || 0} used</label>
              {editable && <Button variant="ghost" size="icon" aria-label="Remove code" onClick={() => set({ promo_codes: form.promo_codes.filter((_, n) => n !== i) })}><Trash2 /></Button>}
            </div>
          ))}
        </div>
      </Panel>

      {editable ? (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={save} disabled={saving} className="shadow-lg" data-testid="events-save">{saving ? <Loader2 className="animate-spin" /> : <Save />} Save event settings</Button>
        </div>
      ) : <p className="text-sm text-muted-foreground">Only admins and content editors can change event settings.</p>}
    </div>
  );
}

export default function AdminEvents() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [event, setEvent] = useState(null);
  const slug = params.get("event") || events[0]?.slug;
  const tab = params.get("tab") || "registrations";

  useEffect(() => { fetchEvents().then(setEvents).catch((e) => toast.error(formatApiError(e))); }, []);
  useEffect(() => {
    if (!slug) return;
    fetchEventSettings(slug).then(setEvent).catch((e) => toast.error(formatApiError(e)));
  }, [slug]);
  const setTab = (t) => setParams((p) => { const n = new URLSearchParams(); if (p.get("event")) n.set("event", p.get("event")); if (t !== "registrations") n.set("tab", t); return n; });

  return (
    <div className="space-y-6" data-testid="admin-events">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Events</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-medium tracking-tight"><CalendarDays className="h-7 w-7 text-primary" />{event?.name || "Events"}</h1>
          {event && <p className="mt-1 text-sm text-muted-foreground">{new Date(event.starts_at).toLocaleDateString(undefined, { dateStyle: "medium" })} · {event.venue} · registration {event.registration_open ? <span className="text-emerald-600">open</span> : <span className="text-primary-ink">closed</span>}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {events.length > 1 && (
            <select className={selectCls} value={slug || ""} onChange={(e) => setParams({ event: e.target.value })} aria-label="Event">
              {events.map((e) => <option key={e.slug} value={e.slug}>{e.name} ({e.registered})</option>)}
            </select>
          )}
          <Button asChild variant="outline" size="sm"><a href={EMPOWER_URL} target="_blank" rel="noreferrer"><ExternalLink /> Open Empower site</a></Button>
        </div>
      </div>
      <div className="flex gap-1 border-b border-line/10">
        {[["registrations", "Registrations"], ["settings", "Passes & settings"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors", tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")} data-testid={`events-tab-${k}`}>{l}</button>
        ))}
      </div>
      {!slug || !event ? (
        <div className="grid min-h-[30vh] place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : tab === "settings" ? (
        <Settings slug={slug} event={event} onSaved={setEvent} />
      ) : (
        <Registrations slug={slug} event={event} />
      )}
    </div>
  );
}
