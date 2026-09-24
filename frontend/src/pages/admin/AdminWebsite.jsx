import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Mail, Megaphone, RefreshCw, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { fetchDeliveries, fetchDelivery, fetchSite, formatApiError, resendDelivery, saveDelivery, saveSite, testDelivery } from "@/lib/adminApi";
import { Badge, Panel, ago, fmtDateTime, inputCls, useCan } from "@/components/admin/kit";
import { useAdmin } from "@/components/admin/AdminAuth";

const DEFAULT_ANNOUNCEMENT = { enabled: true, badge: "New", text: "Solix ECS: talk to your enterprise data.", link_label: "Start your 30-day free trial", link_url: "/signup" };
const DELIVERY_TONE = { sent: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200", failed: "border-red-400/40 bg-red-400/10 text-red-200", skipped: "border-amber-400/40 bg-amber-400/10 text-amber-200" };
const PROVIDERS = { smtp: "SMTP", resend: "Resend", emergent: "Emergent (links only)" };

const Field = ({ label, hint, children, className }) => (
  <label className={cn("block", className)}>
    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
    <div className="mt-1.5">{children}</div>
    {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
  </label>
);

function SiteCard() {
  const can = useCan();
  const editable = can("editContent");
  const [site, setSite] = useState(null);
  const [a, setA] = useState(DEFAULT_ANNOUNCEMENT);
  const [custom, setCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSite().then((s) => {
      setSite(s);
      setCustom(!!s.announcement);
      setA(s.announcement || DEFAULT_ANNOUNCEMENT);
    }).catch((e) => toast.error(formatApiError(e)));
  }, []);

  const save = async (patch = {}) => {
    setSaving(true);
    try {
      const next = await saveSite({ announcement: custom ? a : null, empower_promo: site.empower_promo, ...patch });
      setSite(next);
      toast.success("Website updated. Visitors see it within a few minutes.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!site) return <Panel title="Announcement bar"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Panel>;
  return (
    <Panel title="Announcement bar" sub="The strip above the main navigation on every page (tablet and desktop)." testId="site-announcement">
      <div className="rounded-xl border border-line/10 bg-muted/40 px-4 py-2.5 text-xs" aria-label="Preview">
        {custom && !a.enabled ? <span className="text-muted-foreground">Hidden</span> : (
          <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white"><Sparkles className="h-3 w-3" /> {a.badge || "New"}</span>
            <span className="truncate">{a.text}</span>
            {a.link_label && <span className="shrink-0 font-semibold text-teal">{a.link_label} →</span>}
          </span>
        )}
      </div>
      <label className="mt-4 flex items-center justify-between gap-4 text-sm">
        <span>Use my own announcement<span className="block text-xs text-muted-foreground">Off: the site shows its built-in, translated trial promo.</span></span>
        <Switch checked={custom} onCheckedChange={setCustom} disabled={!editable} data-testid="announcement-custom" />
      </label>
      {custom && (
        <div className="mt-4 grid gap-3 sm:grid-cols-6">
          <label className="flex items-center gap-2 text-sm sm:col-span-6"><Switch checked={a.enabled} onCheckedChange={(v) => setA({ ...a, enabled: v })} disabled={!editable} /> Show the announcement</label>
          <Field label="Badge" className="sm:col-span-2"><Input value={a.badge} maxLength={20} onChange={(e) => setA({ ...a, badge: e.target.value })} className={inputCls} disabled={!editable} /></Field>
          <Field label="Message" className="sm:col-span-4"><Input value={a.text} maxLength={160} onChange={(e) => setA({ ...a, text: e.target.value })} className={inputCls} disabled={!editable} data-testid="announcement-text" /></Field>
          <Field label="Link label" className="sm:col-span-2"><Input value={a.link_label} maxLength={60} onChange={(e) => setA({ ...a, link_label: e.target.value })} className={inputCls} disabled={!editable} /></Field>
          <Field label="Link" hint="A site path like /products or an https:// address" className="sm:col-span-4"><Input value={a.link_url} maxLength={500} onChange={(e) => setA({ ...a, link_url: e.target.value })} className={inputCls} disabled={!editable} /></Field>
          <p className="text-[11px] text-muted-foreground sm:col-span-6">Custom text shows in English in every language unless it matches copy the site already translates.</p>
        </div>
      )}
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-line/10 pt-4 text-sm">
        <span>SOLIXEmpower promo card<span className="block text-xs text-muted-foreground">The event card in the corner of every page until the event ends.</span></span>
        <Switch checked={site.empower_promo} onCheckedChange={(v) => { setSite({ ...site, empower_promo: v }); save({ empower_promo: v }); }} disabled={!editable || saving} data-testid="empower-promo-toggle" />
      </div>
      {editable && <Button className="mt-4" onClick={() => save()} disabled={saving} data-testid="site-save">{saving ? <Loader2 className="animate-spin" /> : <Check />} Save announcement</Button>}
    </Panel>
  );
}

function DeliveryCard({ onSent }) {
  const can = useCan();
  const { user } = useAdmin();
  const [d, setD] = useState(null);
  const [form, setForm] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    fetchDelivery().then((x) => { setD(x); setForm(x); }).catch((e) => toast.error(formatApiError(e)));
    setTestTo(user?.email || "");
  }, [user?.email]);

  const save = async () => {
    setBusy("save");
    try {
      const x = await saveDelivery({ enabled: form.enabled, subject: form.subject, message: form.message, attach: form.attach, attach_max_mb: Number(form.attach_max_mb), link_days: Number(form.link_days) });
      setD(x);
      setForm(x);
      toast.success("Email settings saved");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };
  const test = async () => {
    setBusy("test");
    try {
      const r = await testDelivery({ email: testTo });
      (r.status === "sent" ? toast.success : toast.error)(r.status === "sent" ? `Test email sent to ${testTo}${r.attached ? " with the file attached" : ""}` : `Not sent: ${r.detail}`);
      onSent();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  if (!form) return <Panel title="Gated asset emails"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Panel>;
  const admin = can("manage");
  return (
    <Panel title="Gated asset emails" sub="When a visitor fills in a download form, they get an email with their copy: a signed download link, plus the file attached when it's small enough." testId="delivery-settings">
      <div className={cn("mb-4 rounded-xl border p-3 text-xs", d.provider ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200")}>
        {d.provider
          ? <>Sending with <strong>{PROVIDERS[d.provider] || d.provider}</strong>{d.attachments_supported ? ", attachments on" : ", links only"}. Links point at {d.api_url || "this API"} and {d.site_url}.</>
          : <>No email service is connected yet, so emails are logged but not sent. Set SMTP (any provider) or a Resend key on the backend; see its README.</>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} disabled={!admin} data-testid="delivery-enabled" /> Email visitors their gated asset automatically</label>
        <Field label="Subject" hint="{title} is replaced with the asset's title" className="sm:col-span-2"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} disabled={!admin} data-testid="delivery-subject" /></Field>
        <Field label="Message" hint="{title} and {days} (link validity) are replaced" className="sm:col-span-2"><Textarea value={form.message} rows={3} onChange={(e) => setForm({ ...form, message: e.target.value })} className="border-line/15 bg-background text-sm" disabled={!admin} /></Field>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.attach} onCheckedChange={(v) => setForm({ ...form, attach: v })} disabled={!admin} /> Attach the file</label>
        <Field label="Attach files up to (MB)"><Input type="number" min={0.5} max={10} step={0.5} value={form.attach_max_mb} onChange={(e) => setForm({ ...form, attach_max_mb: e.target.value })} className={inputCls} disabled={!admin} /></Field>
        <Field label="Download links valid for (days)"><Input type="number" min={1} max={90} value={form.link_days} onChange={(e) => setForm({ ...form, link_days: e.target.value })} className={inputCls} disabled={!admin} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-2">
        {admin && <Button onClick={save} disabled={!!busy} data-testid="delivery-save">{busy === "save" ? <Loader2 className="animate-spin" /> : <Check />} Save</Button>}
        {can("editContent") && (
          <span className="flex flex-1 gap-2">
            <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} className={cn(inputCls, "min-w-[180px] flex-1")} aria-label="Send a test to" />
            <Button variant="outline" onClick={test} disabled={!!busy || !testTo} data-testid="delivery-test">{busy === "test" ? <Loader2 className="animate-spin" /> : <Send />} Send test</Button>
          </span>
        )}
      </div>
    </Panel>
  );
}

function DeliveryLog({ tick }) {
  const can = useCan();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(null);
  const load = () => fetchDeliveries({ status: status || undefined, limit: 100 }).then(setRows).catch((e) => toast.error(formatApiError(e)));
  useEffect(() => { load(); }, [status, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const resend = async (row) => {
    setBusy(row.id);
    try {
      const r = await resendDelivery(row.id);
      (r.status === "sent" ? toast.success : toast.error)(r.status === "sent" ? `Sent again to ${row.email}` : `Not sent: ${r.detail}`);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="Delivery log"
      sub="Every gated-asset email, newest first. Sent emails also appear on the lead's timeline."
      action={(
        <span className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 rounded-lg border border-line/15 bg-background px-2 text-xs" aria-label="Status">
            <option value="">All</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="skipped">Skipped</option>
          </select>
          <Button size="sm" variant="ghost" onClick={load} aria-label="Refresh"><RefreshCw /></Button>
        </span>
      )}
      testId="delivery-log"
    >
      <ul className="divide-y divide-line/5">
        {rows.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No deliveries yet. They appear here when someone fills in a download form.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" data-testid="delivery-row">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <Badge className={DELIVERY_TONE[r.status]}>{r.status}</Badge>
                <span className="truncate text-foreground">{r.title}</span>
                {r.attached && <Badge className="border-line/15 text-muted-foreground">attached</Badge>}
                {r.resend_of && <Badge className="border-line/15 text-muted-foreground">resend</Badge>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.email}{r.detail ? ` · ${r.detail}` : ""}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span title={fmtDateTime(r.created_at)}>{ago(r.created_at)}</span>
              {can("editLeads") || can("editContent") ? (
                <Button size="sm" variant="outline" className="h-8" onClick={() => resend(r)} disabled={busy === r.id}>{busy === r.id ? <Loader2 className="animate-spin" /> : <Mail />} Resend</Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function AdminWebsite() {
  const [tick, setTick] = useState(0);
  return (
    <div data-testid="admin-website-page">
      <p className="eyebrow mb-2">Website</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">What every visitor sees and receives.</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Site-wide messages, the event promo and the emails visitors get when they download gated content. Pages and articles are managed in <Link to="/admin/content" className="text-teal hover:underline">Content</Link>; bringing in your old website's content is under <Link to="/admin/migrate" className="text-teal hover:underline">Migrate</Link>.</p>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SiteCard />
          <Panel title={<span className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-teal" /> Where things live</span>}>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>Blogs, white papers, datasheets, case studies, webinars → <span className="font-mono">/resources/…</span></li>
              <li>Press releases → the Newsroom, <span className="font-mono">/newsroom/…</span></li>
              <li>Event registrations and passes → Events</li>
              <li>Lead alerts to your sales inbox → Settings</li>
            </ul>
          </Panel>
        </div>
        <div className="space-y-6">
          <DeliveryCard onSent={() => setTick((t) => t + 1)} />
          <DeliveryLog tick={tick} />
        </div>
      </div>
    </div>
  );
}
