import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Check, CheckCircle2, ExternalLink, Loader2, MailOpen, RefreshCw, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  applyIntelligence, confirmAccountFields, fetchAccuracy, fetchAccuracyAudit, fetchContactBrief, fetchIntelligence, formatApiError, revertTuning, runIntelligenceReview,
  saveIntelligenceSettings,
} from "@/lib/adminApi";
import { Panel, fmtDate } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

const pct = (x, d = 1) => (x == null ? "–" : `${(x * 100).toFixed(d)}%`);
const fmtValue = (field, v) => (v == null || v === "" ? "–" : typeof v === "number" ? (field === "revenue" ? `$${v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : `${Math.round(v / 1e6)}M`}` : v.toLocaleString()) : String(v));

export const QUALITY_TONE = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  likely: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  unverified: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  conflicting: "border-red-400/30 bg-red-400/10 text-red-200",
  missing: "border-line/15 text-muted-foreground",
};
const STATUS_WORD = { verified: "Verified", likely: "Likely", unverified: "Unverified", conflicting: "Sources disagree", missing: "Missing" };

export const QualityPill = ({ status, children, className }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", QUALITY_TONE[status] || QUALITY_TONE.missing, className)}>
    {children || STATUS_WORD[status] || status}
  </span>
);

/** Account drawer: how likely each core fact is right, from which sources, with one-click confirmation. */
export function QualityCard({ accountId, quality, canConfirm, onChanged }) {
  const [busy, setBusy] = useState(null);
  if (!quality) return null;
  const confirm = async (fields) => {
    setBusy(fields.join());
    try {
      await confirmAccountFields(accountId, fields);
      toast.success("Confirmed. Sources that reported it are scored, which tunes how much MarkHub trusts them.");
      onChanged?.();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };
  const open = Object.values(quality.fields).filter((f) => f.status !== "verified" && f.value != null).map((f) => f.field);
  return (
    <section className="rounded-2xl border border-line/10 bg-card p-4" data-testid="account-quality">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-teal" /> Data quality {quality.score}%</p>
          <p className="text-xs text-muted-foreground">{quality.verified} of {quality.core} core facts verified. Verified means a person confirmed it, or independent sources agree to {quality.target}% confidence.</p>
        </div>
        {canConfirm && open.length > 0 && (
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => confirm(open)} title="You've checked these against the company's own site or filings">
            {busy === open.join() ? <Loader2 className="animate-spin" /> : <Check />} All shown values are right
          </Button>
        )}
      </div>
      <ul className="mt-3 divide-y divide-line/5">
        {Object.values(quality.fields).map((f) => (
          <li key={f.field} className="grid grid-cols-[110px_1fr_auto] items-start gap-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground">{({ industry: "Industry", revenue: "Revenue", country: "HQ country", domain: "Website", employees: "Employees" })[f.field]}</span>
            <span className="min-w-0">
              <span className="block truncate">{fmtValue(f.field, f.value)}</span>
              <span className="block text-[11px] text-muted-foreground">{f.basis}{f.value != null && f.status !== "verified" ? ` · ${pct(f.p, 0)} likely right` : ""}</span>
            </span>
            <span className="flex items-center gap-1">
              <QualityPill status={f.status} />
              {canConfirm && f.value != null && f.status !== "verified" && (
                <button type="button" className="rounded-full p-1 text-muted-foreground hover:text-emerald-300" title="This value is right" aria-label={`Confirm ${f.field}`} disabled={!!busy}
                  onClick={() => confirm([f.field])}>{busy === f.field ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}</button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {canConfirm && <p className="mt-2 text-[11px] text-muted-foreground">Wrong value? Correct it under Account details: your value becomes the verified one and the sources that got it wrong are trusted less.</p>}
    </section>
  );
}

const KIND = { lead: ["Lead with", "border-emerald-400/30 text-emerald-200"], cross_sell: ["Cross-sell", "border-sky-400/30 text-sky-200"], up_sell: ["Up-sell", "border-violet-400/30 text-violet-200"] };

/** Account drawer: what to pitch first and what follows, each with the evidence behind it. */
export function PitchPlan({ fit, products, canEdit, onSaveOwned, busy }) {
  const [editing, setEditing] = useState(false);
  const [owned, setOwned] = useState(() => (fit?.owned || []).map((o) => o.product));
  useEffect(() => setOwned((fit?.owned || []).map((o) => o.product)), [fit]);
  if (!fit) return null;
  return (
    <section className="rounded-2xl border border-line/10 bg-card p-4" data-testid="account-pitch">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary-ink" /> Pitch plan</p>
        {canEdit && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing((v) => !v)}>{editing ? "Done" : fit.customer ? "Edit products they own" : "Already a customer?"}</Button>}
      </div>
      {fit.summary && <p className="mt-1 text-sm text-muted-foreground">{fit.summary}</p>}
      {fit.owned?.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Owns: {fit.owned.map((o) => o.label).join(", ")}</p>}
      {editing && (
        <div className="mt-3 rounded-xl border border-line/10 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Solix products they already have. They're never pitched again; what follows them becomes up-sell and cross-sell.</p>
          <div className="flex flex-wrap gap-1.5">
            {(products || []).map((p) => {
              const on = owned.includes(p.key);
              return (
                <button key={p.key} type="button" onClick={() => setOwned(on ? owned.filter((x) => x !== p.key) : [...owned, p.key])}
                  className={cn("rounded-full border px-2.5 py-1 text-[11px]", on ? "border-primary bg-primary/20 text-foreground" : "border-line/15 text-muted-foreground hover:text-foreground")}>{p.label}</button>
              );
            })}
          </div>
          <Button size="sm" className="mt-3" disabled={busy} onClick={() => onSaveOwned(owned).then(() => setEditing(false))}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Save</Button>
        </div>
      )}
      <ol className="mt-3 space-y-2">
        {fit.plays.map((p) => (
          <li key={p.product} className="rounded-xl border border-line/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]", KIND[p.kind]?.[1])}>{KIND[p.kind]?.[0] || p.kind}</span>
                <span className="font-medium">{p.label}</span>
                {p.follows && <span className="text-[11px] text-muted-foreground">after {p.follows}</span>}
              </p>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line/10"><span className="block h-full rounded-full bg-primary" style={{ width: `${p.fit}%` }} /></span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{p.fit}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.value}</p>
            {p.reasons.length > 0 && <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs">{p.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          </li>
        ))}
        {!fit.plays.length && <li className="text-sm text-muted-foreground">Not enough evidence yet. Signals, the industry or a deep dive will shape the plan.</li>}
      </ol>
    </section>
  );
}

const INTENT = { exploration: "Exploration: earn a look", buying: "Buying: ask for time", close: "Close the loop" };

/** Contact row: the persona plan and the four touches it produces, before enrolling. */
export function FirstTouchPreview({ contact, open, onOpenChange }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!open) return;
    setData(null);
    fetchContactBrief(contact.id).then(setData).catch((e) => { toast.error(formatApiError(e)); onOpenChange(false); });
  }, [open, contact?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = data?.brief;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto" data-testid="first-touch-preview">
        <DialogHeader>
          <DialogTitle>First touch for {contact?.name}</DialogTitle>
          <DialogDescription>{contact?.title} · built for their role, industry and the account's lead product. Nothing is sent from here.</DialogDescription>
        </DialogHeader>
        {!data ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-x-4 gap-y-2 rounded-xl border border-line/10 p-3 sm:grid-cols-2">
              {[["Role", `${b.persona_label} · ${b.seniority}`], ["Cares about", b.cares], ["Likely pain", b.pain], ["Industry", b.industry_label ? `${b.industry_label}${b.industry_reason ? `: ${b.industry_reason}` : ""}` : "Unknown"],
                ["Lead product", b.product_label || "–"], ["Trigger", b.hook || "None found: the opener uses the industry instead"]].map(([k, v]) => (
                <div key={k}><dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <QualityPill status={data.quality.ok ? "verified" : "unverified"}>Personal score {data.quality.score}</QualityPill>
              <span className="text-muted-foreground">Written by {data.provider === "rules" ? "the persona rules" : data.provider === "deep_dive" ? "the approved deep dive" : data.provider}</span>
              {data.quality.issues.length > 0 && <span className="text-amber-200">{data.quality.issues.join("; ")}</span>}
            </div>
            <ol className="space-y-3">
              {data.steps.map((s, i) => (
                <li key={i} className="rounded-xl border border-line/10 p-3">
                  <p className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>Day {s.day} · {INTENT[s.intent] || s.intent}</span><span>{s.objective}</span></p>
                  <p className="font-medium">{s.subject}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">Enrol them in "Persona-led: explore, then buy" to send this. Other sequences use the same opener.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const FirstTouchButton = ({ contact }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(true)}><MailOpen /> First touch</Button>
      {open && <FirstTouchPreview contact={contact} open={open} onOpenChange={setOpen} />}
    </>
  );
};

/** Radar > Data accuracy: the measured number, by field and source, and a random audit queue to grow the sample. */
export function AccuracyPanel({ onOpen }) {
  const [rep, setRep] = useState(null);
  const [audit, setAudit] = useState(null);
  const [done, setDone] = useState({});
  const load = () => fetchAccuracy().then(setRep).catch((e) => toast.error(formatApiError(e)));
  const loadAudit = () => { setDone({}); fetchAccuracyAudit(15).then((r) => setAudit(r.items)).catch((e) => toast.error(formatApiError(e))); };
  useEffect(() => { load(); loadAudit(); }, []);
  const answer = async (item, right) => {
    if (!right) {
      onOpen(item.company_id);
      toast("Correct it under Account details: that records the right value and scores the sources.");
      return;
    }
    setDone((d) => ({ ...d, [`${item.company_id}:${item.field}`]: "busy" }));
    try {
      await confirmAccountFields(item.company_id, [item.field], true);
      setDone((d) => ({ ...d, [`${item.company_id}:${item.field}`]: "ok" }));
      load();
    } catch (e) {
      setDone((d) => ({ ...d, [`${item.company_id}:${item.field}`]: undefined }));
      toast.error(formatApiError(e));
    }
  };
  if (!rep) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>;
  const o = rep.overall;
  return (
    <div className="space-y-6" data-testid="radar-accuracy">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line/10 bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Measured accuracy</p>
          <p className={cn("mt-2 font-display text-3xl tabular-nums", o.meets_target ? "text-emerald-300" : "text-foreground")}>{pct(o.rate)}</p>
          <p className="text-xs text-muted-foreground">{o.n ? `95% interval ${pct(o.low)} to ${pct(o.high)} · ${o.n} check${o.n === 1 ? "" : "s"}` : "No checks yet"}</p>
        </div>
        <div className="rounded-2xl border border-line/10 bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Target</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{pct(rep.target, 0)}</p>
          <p className="text-xs text-muted-foreground">{o.meets_target ? "Met with confidence" : rep.checks_needed ? `About ${rep.checks_needed} more checks to prove it` : o.n ? "Not met yet" : "Run the audit below to start measuring"}</p>
        </div>
        <div className="rounded-2xl border border-line/10 bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Accounts fully verified</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{rep.accounts.meets_target}<span className="ml-1 text-sm text-muted-foreground">of {rep.accounts.total}</span></p>
          <p className="text-xs text-muted-foreground">Average data quality {rep.accounts.avg_score ?? "–"}% · {rep.accounts.conflicting} with conflicts</p>
        </div>
        <div className="rounded-2xl border border-line/10 bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Email addresses</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{pct(rep.email.rate)}</p>
          <p className="text-xs text-muted-foreground">{rep.email.n ? `right in ${rep.email.n} checks (verifications, bounces, replies)` : "No checks yet"}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{rep.explain}</p>

      <Panel title="Audit: is this right?" sub="Random values MarkHub shows that no one has confirmed. Check each against the company's own website or filings. Random, so the measured number isn't biased."
        action={<Button size="sm" variant="ghost" onClick={loadAudit}><RefreshCw /> New sample</Button>}>
        {!audit ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : audit.length === 0 ? <p className="text-sm text-muted-foreground">Nothing left to audit: every shown value has been confirmed.</p> : (
          <ul className="divide-y divide-line/5" data-testid="accuracy-audit">
            {audit.map((a) => {
              const st = done[`${a.company_id}:${a.field}`];
              return (
                <li key={`${a.company_id}:${a.field}`} className={cn("grid items-center gap-2 py-2.5 text-sm sm:grid-cols-[1fr_1fr_auto]", st === "ok" && "opacity-50")}>
                  <span className="min-w-0">
                    <button type="button" className="block truncate text-left hover:text-teal" onClick={() => onOpen(a.company_id)}>{a.company}</button>
                    {a.domain && <a href={`https://${a.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">{a.domain} <ExternalLink className="h-3 w-3" /></a>}
                  </span>
                  <span className="min-w-0"><span className="text-xs text-muted-foreground">{a.label}: </span>{fmtValue(a.field, a.value)} <QualityPill status={a.status} className="ml-1" /></span>
                  <span className="flex gap-1">
                    {st === "ok" ? <span className="text-xs text-emerald-300">Recorded</span> : (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={st === "busy"} onClick={() => answer(a, true)}><Check /> Right</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => answer(a, false)}><X /> Wrong</Button>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Accuracy of what MarkHub shows, by field">
          {Object.keys(rep.by_field).length ? (
            <ul className="space-y-2 text-sm">
              {Object.entries(rep.by_field).map(([f, b]) => (
                <li key={f} className="flex items-center justify-between gap-2"><span className="capitalize">{f.replace("_", " ")}</span><span className="font-mono text-xs">{pct(b.rate)} <span className="text-muted-foreground">({b.n})</span></span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No checks yet.</p>}
        </Panel>
        <Panel title="Sources, by measured accuracy" sub="Trust is the measured rate, blended with a starting estimate until a source has about 20 checks.">
          {rep.sources.filter((s) => s.via !== "shown").length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="py-1 font-normal">Source</th><th className="font-normal">Field</th><th className="text-right font-normal">Right</th><th className="text-right font-normal">Checks</th><th className="text-right font-normal">Trust</th></tr></thead>
                <tbody>
                  {rep.sources.filter((s) => s.via !== "shown").map((s) => (
                    <tr key={`${s.kind}${s.field}${s.via}`} className="border-t border-line/5">
                      <td className="py-1.5">{s.label}</td><td className="text-xs capitalize text-muted-foreground">{s.field.replace("_", " ")}</td>
                      <td className={cn("text-right font-mono text-xs", s.rate < 0.9 && "text-amber-200")}>{pct(s.rate)}</td><td className="text-right font-mono text-xs">{s.n}</td><td className="text-right font-mono text-xs">{pct(s.trust)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground">Sources are scored as people confirm or correct values, and as emails are verified, bounce or get replies.</p>}
        </Panel>
      </div>
    </div>
  );
}

const INSIGHT_TONE = { win: "border-emerald-400/30 text-emerald-200", risk: "border-red-400/30 text-red-200", opportunity: "border-sky-400/30 text-sky-200", data: "border-amber-400/30 text-amber-200", tuning: "border-violet-400/30 text-violet-200" };
const INSIGHT_WORD = { win: "Working", risk: "Risk", opportunity: "Opportunity", data: "Data", tuning: "Tuning" };

/** The weekly self-review: wins, risks and opportunities with actions, plus what it tuned (with undo). */
export function IntelligenceBrief({ isAdmin, compact = false }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = () => fetchIntelligence().then(setData).catch(() => setData({ latest: null }));
  useEffect(() => { load(); }, []);
  const act = async (key, fn, msg) => {
    setBusy(key);
    try {
      await fn();
      if (msg) toast.success(msg);
      await load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };
  if (!data) return null;
  const latest = data.latest;
  const items = latest?.insights || [];
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><Brain className="h-4 w-4 text-primary-ink" /> MarkHub intelligence</span>}
      sub={latest ? `Weekly self-review · ${fmtDate(latest.at)} · learned from ${latest.learned?.outcomes ?? 0} outreach outcomes` : "Runs every Monday: learns from replies and data checks, tunes what's safe, and reports here."}
      action={isAdmin && <Button size="sm" variant="outline" disabled={busy === "run"} onClick={() => act("run", runIntelligenceReview, "Review finished")}>{busy === "run" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Review now</Button>}
      testId="intelligence-brief">
      {latest?.narrative?.text && <p className="mb-3 rounded-xl bg-line/[0.04] p-3 text-sm leading-relaxed" data-testid="intelligence-narrative">{latest.narrative.text}</p>}
      {!latest ? <p className="text-sm text-muted-foreground">No review yet.{isAdmin ? " Run one now to see what MarkHub finds." : ""}</p> : (
        <ul className="space-y-2">
          {(compact ? items.slice(0, 5) : items).map((i, n) => (
            <li key={n} className="rounded-xl border border-line/10 p-3">
              <p className="flex flex-wrap items-center gap-2 text-sm"><span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]", INSIGHT_TONE[i.kind])}>{INSIGHT_WORD[i.kind] || i.kind}</span>{i.title}</p>
              {(i.detail || i.action) && <p className="mt-1 text-xs text-muted-foreground">{i.detail} {i.action && (i.link ? <Link to={i.link} className="text-teal hover:underline">{i.action}</Link> : <span className="text-foreground">{i.action}</span>)}</p>}
            </li>
          ))}
        </ul>
      )}
      {isAdmin && !compact && latest && (
        <div className="mt-4 space-y-3 border-t border-line/10 pt-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#0088cf]" checked={!!data.settings?.autotune} disabled={busy === "auto"}
              onChange={(e) => act("auto", () => saveIntelligenceSettings({ autotune: e.target.checked }), e.target.checked ? "Autotune on" : "Autotune off: changes will be suggested")} />
            Let MarkHub tune product-fit weights itself (at most ±0.2 a week, always between 0.5 and 1.5, every change can be undone)
          </label>
          {!data.settings?.autotune && latest.proposals?.length > 0 && !latest.applied && (
            <Button size="sm" disabled={busy === "apply"} onClick={() => act("apply", applyIntelligence, "Suggestions applied")}>Apply {latest.proposals.length} suggestion{latest.proposals.length > 1 ? "s" : ""}</Button>
          )}
          {data.tuning?.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">Tuning history ({data.tuning.length})</summary>
              <ul className="mt-2 divide-y divide-line/5">
                {data.tuning.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                    <span className={cn("min-w-0 flex-1", t.reverted && "line-through opacity-60")}>{t.reason} · {t.before} → {t.after}</span>
                    <span className="text-muted-foreground">{fmtDate(t.at)}</span>
                    {!t.reverted && <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy === t.id} onClick={() => act(t.id, () => revertTuning(t.id), "Change undone")}><RotateCcw /> Undo</Button>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Panel>
  );
}

const STAGE_ORDER = ["problem_aware", "exploring", "evaluating", "engaged", "buying"];
const STAGE_SHORT = { problem_aware: "Problem aware", exploring: "Exploring", evaluating: "Evaluating", engaged: "In conversation", buying: "Buying" };

export const StageChip = ({ journey, className }) => (journey ? (
  <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", journey.intent === "buying" ? "border-emerald-400/30 text-emerald-200" : "border-sky-400/30 text-sky-200", className)}>
    {journey.label}
  </span>
) : null);

/** Account drawer: where the account is on the way from "has the problem" to "buying", and the play that moves it on. */
export function JourneyCard({ account }) {
  const j = account?.journey;
  if (!j) return null;
  const at = STAGE_ORDER.indexOf(j.stage);
  return (
    <section className="rounded-2xl border border-line/10 bg-card p-4" data-testid="account-journey">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Buying stage: {j.label}</p>
        <span className="text-[11px] text-muted-foreground">{j.since ? `since ${fmtDate(j.since)}` : ""}{account.lookalike?.score ? ` · looks ${account.lookalike.score}% like your best accounts` : ""}</span>
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1" aria-label="Buying stages">
        {STAGE_ORDER.map((s, i) => (
          <li key={s} className="min-w-0">
            <span className={cn("block h-1.5 rounded-full", i <= at ? (i >= 2 ? "bg-emerald-400" : "bg-sky-400") : "bg-line/15")} />
            <span className={cn("mt-1 block truncate text-[10px]", i === at ? "text-foreground" : "text-muted-foreground")}>{STAGE_SHORT[s]}</span>
          </li>
        ))}
      </ol>
      {j.evidence?.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Evidence: {j.evidence.join(" · ")}</p>}
      <p className="mt-2 rounded-lg bg-line/[0.04] p-2 text-xs"><span className={j.intent === "buying" ? "text-emerald-200" : "text-sky-200"}>{j.intent === "buying" ? "Buying play" : "Exploration play"}:</span> {j.play}</p>
      {account.lookalike?.why?.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">Shares with your best accounts: {account.lookalike.why.join(", ")}</p>}
    </section>
  );
}

/** Account drawer: the roles the lead product needs, who we have and who's engaged. */
export function CommitteeCard({ committee }) {
  if (!committee?.roles?.length) return null;
  return (
    <section className="rounded-2xl border border-line/10 bg-card p-4" data-testid="account-committee">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Buying committee {committee.coverage}% covered</p>
        <span className="text-[11px] text-muted-foreground">{committee.engaged} engaged</span>
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {committee.roles.map((r) => (
          <li key={r.persona} className={cn("flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs", r.have ? "border-line/10" : "border-amber-400/30 bg-amber-400/5")}>
            <span className="truncate">{r.label.split(" (")[0]}</span>
            <span className={cn("shrink-0", r.engaged ? "text-emerald-300" : r.have ? "text-muted-foreground" : "text-amber-200")}>{r.engaged ? "engaged" : r.have ? `${r.have} contact${r.have > 1 ? "s" : ""}` : "missing"}</span>
          </li>
        ))}
      </ul>
      {committee.missing?.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">Next: find someone in {committee.missing[0].split(" (")[0]} (Contacts → Find people).</p>}
    </section>
  );
}
