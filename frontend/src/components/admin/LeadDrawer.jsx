import { useEffect, useState } from "react";
import { Bot, Check, FileText, Loader2, Mail, MousePointerClick, RefreshCw, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchLead, formatApiError, patchLead, rescoreLead } from "@/lib/adminApi";
import { CHANNEL_LABELS, LineBadge, SERIES, STAGE_HELP, STAGE_LABELS, StageBadge, fmtDateTime, productName, selectCls, useCan } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

const EVENT_LABELS = {
  page_view: "Viewed", engaged: "Read for a while", deep_scroll: "Read to the end", resource_view: "Opened resource",
  resource_download: "Downloaded", chat_topic: "Asked the concierge about", cta_click: "Clicked", pricing_intent: "Asked about pricing",
  search: "Searched resources", session_start: "Started a visit",
};
const FORM_LABELS = { demo: "Requested a demo", contact: "Contacted sales", trial: "Started the ECS trial", download: "Downloaded gated content", newsletter: "Subscribed to the newsletter", partner: "Applied to partner", career: "Applied for a job", event: "Registered for an event" };
const FIT_LABELS = { business_email: "Business email", seniority: "Seniority", company_size: "Company size", phone: "Phone provided" };

const Row = ({ label, children }) => (children ? (
  <div className="grid grid-cols-3 gap-3 border-b border-line/5 py-2 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="col-span-2 break-words text-foreground">{children}</dd>
  </div>
) : null);

const TimelineItem = ({ t }) => {
  const Icon = t.kind === "form" ? FileText : t.kind === "stage" ? Sparkles : t.kind === "email" ? Mail : t.type === "chat_topic" ? Bot : t.type === "cta_click" ? MousePointerClick : UserRound;
  let text;
  if (t.kind === "email") text = <>{t.type === "asset_sent" ? "Emailed their copy of" : "Couldn't email"} <span className="text-foreground">{t.detail}</span>{t.meta?.attached ? " (file attached)" : ""}{t.type !== "asset_sent" && t.meta?.reason ? ` · ${t.meta.reason}` : ""}</>;
  else if (t.kind === "form") text = <><strong className="font-medium text-foreground">{FORM_LABELS[t.type] || t.type}</strong>{t.detail ? ` · ${t.detail}` : ""}</>;
  else if (t.kind === "stage") text = <>Stage → <strong className="font-medium text-foreground">{STAGE_LABELS[t.type] || t.type}</strong>{t.detail ? ` · ${t.detail}` : ""}{t.by && t.by !== "system" ? ` (${t.by})` : ""}</>;
  else {
    const what = t.type === "page_view" || t.type === "engaged" || t.type === "deep_scroll" ? t.path : t.meta?.title || t.path;
    const topics = (t.topics || []).map(productName).join(", ");
    text = <>{EVENT_LABELS[t.type] || t.type} <span className="text-foreground">{t.type === "chat_topic" || t.type === "pricing_intent" ? topics : t.type === "search" ? `“${t.meta?.q || ""}”` : t.type === "cta_click" ? t.meta?.cta : what}</span>{t.points ? <span className="ml-1 font-mono text-[10px] text-teal">+{t.points}</span> : null}</>;
  }
  return (
    <li className="flex gap-3 py-2 text-xs text-muted-foreground">
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", t.kind === "form" ? "text-primary-ink" : t.kind === "stage" ? "text-amber-300" : "text-muted-foreground")} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="break-words">{text}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">{fmtDateTime(t.at)}</p>
      </div>
    </li>
  );
};

export function LeadDrawer({ id, meta, onClose, onChanged }) {
  const can = useCan();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ stage: "lead", owner: "", notes: "", tags: "", reason: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setData(null);
    fetchLead(id)
      .then((d) => {
        setData(d);
        setForm({ stage: d.lead.stage || "lead", owner: d.lead.owner || "", notes: d.lead.notes || "", tags: (d.lead.tags || []).join(", "), reason: "" });
      })
      .catch((e) => toast.error(formatApiError(e)));
  }, [id]);

  const lead = data?.lead;
  const threshold = meta?.settings?.mql_threshold ?? 45;
  const dirty = lead && (form.stage !== (lead.stage || "lead") || form.owner !== (lead.owner || "") || form.notes !== (lead.notes || "") || form.tags !== (lead.tags || []).join(", "));

  const save = async () => {
    setSaving(true);
    try {
      await patchLead(lead.id, { stage: form.stage, owner: form.owner, notes: form.notes, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), reason: form.reason || undefined });
      toast.success("Lead updated");
      const d = await fetchLead(lead.id);
      setData(d);
      setForm((f) => ({ ...f, reason: "" }));
      onChanged?.();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const rescore = async () => {
    try {
      await rescoreLead(lead.id);
      setData(await fetchLead(lead.id));
      onChanged?.();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const maxLine = Math.max(1, ...(data?.breakdown.lines || []).map((l) => l.score));

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="dark w-full overflow-y-auto border-line/10 bg-background text-foreground sm:max-w-xl" data-testid="lead-drawer">
        {!lead ? (
          <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>
        ) : (
          <>
            <SheetHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2"><StageBadge stage={lead.stage} /><LineBadge line={lead.primary_line} /></div>
              <SheetTitle className="font-display text-2xl font-medium">{lead.name || lead.email}</SheetTitle>
              <SheetDescription>{[lead.job_title, lead.company].filter(Boolean).join(" · ") || "No company given"} · <a href={`mailto:${lead.email}`} className="text-teal hover:underline">{lead.email}</a></SheetDescription>
              {lead.stage_reason && <p className="text-xs text-muted-foreground">{lead.stage_reason}</p>}
            </SheetHeader>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-line/10 bg-card p-3"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Score</p><p className="mt-1 font-display text-2xl">{Math.round(lead.score || 0)}</p><p className="text-[10px] text-muted-foreground">MQL at {threshold}</p></div>
              <div className="rounded-xl border border-line/10 bg-card p-3"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Intent</p><p className="mt-1 font-display text-2xl">{Math.round(lead.behaviour_score || 0)}</p><p className="text-[10px] text-muted-foreground">top product line</p></div>
              <div className="rounded-xl border border-line/10 bg-card p-3"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Fit</p><p className="mt-1 font-display text-2xl">{lead.fit_score || 0}</p><p className="text-[10px] text-muted-foreground">of 40</p></div>
            </div>

            <section className="mt-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Interest by product line</p>
                {can("editLeads") && <Button variant="ghost" size="sm" onClick={rescore} className="h-7 text-xs"><RefreshCw /> Rescore</Button>}
              </div>
              <ul className="mt-2 space-y-2" data-testid="lead-lines">
                {data.breakdown.lines.length === 0 && <li className="text-sm text-muted-foreground">No product signals yet.</li>}
                {data.breakdown.lines.map((l) => (
                  <li key={l.key}>
                    <div className="flex justify-between text-xs"><span>{l.label}</span><span className="font-mono text-muted-foreground">{Math.round(l.score)}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-line/10"><div className="h-full rounded-full" style={{ width: `${(l.score / maxLine) * 100}%`, background: l.key === lead.primary_line ? SERIES.mqls : SERIES.leads }} /></div>
                  </li>
                ))}
              </ul>
              {data.breakdown.products.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">Products: {data.breakdown.products.slice(0, 6).map((p) => `${productName(p.slug)} (${Math.round(p.score)})`).join(" · ")}</p>
              )}
              {Object.keys(data.breakdown.fit).length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Fit: {Object.entries(data.breakdown.fit).map(([k, v]) => `${FIT_LABELS[k] || k} +${v}`).join(" · ")}</p>
              )}
            </section>

            {can("editLeads") ? (
              <section className="mt-6 rounded-2xl border border-line/10 bg-card p-4" data-testid="lead-workflow">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Stage
                    <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={cn(selectCls, "mt-1 w-full")} data-testid="lead-stage-select">
                      {(meta?.stages || Object.keys(STAGE_LABELS)).map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Owner
                    <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={cn(selectCls, "mt-1 w-full")} data-testid="lead-owner-select">
                      <option value="">Unassigned</option>
                      {meta?.owners?.map((o) => <option key={o.email} value={o.email}>{o.name}</option>)}
                      {form.owner && !meta?.owners?.some((o) => o.email === form.owner) && <option value={form.owner}>{form.owner}</option>}
                    </select>
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{STAGE_HELP[form.stage]}</p>
                {form.stage !== (lead.stage || "lead") && (
                  <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for the stage change (optional)" className="mt-2 h-9 border-line/15 bg-background text-sm" />
                )}
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Private notes: call summary, next step…" className="mt-3 border-line/15 bg-background text-sm" data-testid="lead-notes" />
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags, comma separated" className="mt-2 h-9 border-line/15 bg-background text-sm" />
                <div className="mt-3 flex justify-end"><Button size="sm" onClick={save} disabled={!dirty || saving} data-testid="lead-save">{saving ? <Loader2 className="animate-spin" /> : <Check />} Save</Button></div>
              </section>
            ) : (
              lead.notes && <p className="mt-6 whitespace-pre-wrap rounded-xl border border-line/10 bg-card p-4 text-sm text-muted-foreground">{lead.notes}</p>
            )}

            <section className="mt-6">
              <p className="eyebrow mb-2">Profile & source</p>
              <dl>
                <Row label="Phone">{lead.phone}</Row>
                <Row label="Country">{lead.country}</Row>
                <Row label="Company size">{lead.company_size}</Row>
                <Row label="Industry">{lead.industry && productName(lead.industry)}</Row>
                <Row label="Source">{CHANNEL_LABELS[lead.channel] || lead.channel}</Row>
                <Row label="Campaign">{[lead.first_touch?.utm_source, lead.first_touch?.utm_medium, lead.first_touch?.utm_campaign].filter(Boolean).join(" / ")}</Row>
                <Row label="Landing page">{lead.first_touch?.landing}</Row>
                <Row label="Referrer">{lead.first_touch?.referrer}</Row>
                <Row label="Visits">{lead.sessions ? `${lead.sessions} visits · ${lead.pages_viewed} pages` : null}</Row>
                <Row label="Created">{fmtDateTime(lead.created_at)}</Row>
                <Row label="Became MQL">{lead.mql_at && fmtDateTime(lead.mql_at)}</Row>
                <Row label="Tags">{(lead.tags || []).join(", ")}</Row>
              </dl>
            </section>

            <section className="mt-6 pb-6">
              <p className="eyebrow mb-1">Activity</p>
              <ul className="divide-y divide-line/5" data-testid="lead-timeline">
                {data.timeline.map((t, i) => <TimelineItem key={`${t.at}-${i}`} t={t} />)}
              </ul>
              {!lead.visitor_ids?.length && <p className="mt-2 text-[11px] text-muted-foreground">Browsing history appears for visitors who accepted analytics cookies before filling a form.</p>}
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
