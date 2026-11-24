import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Linkedin, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchCountryPolicies, fetchDeliverability, fetchLedger, fetchRetention, fetchReviewQueue, formatApiError, recordLedger, releaseLedger, resolveReply, saveOutboundSettings,
} from "@/lib/adminApi";
import { Badge, Panel, ago, fmtDateTime, inputCls, selectCls, useCan, useLiveRefresh } from "@/components/admin/kit";

const run = async (fn, ok) => {
  try {
    const r = await fn();
    if (ok) toast.success(typeof ok === "function" ? ok(r) : ok);
    return r;
  } catch (e) {
    toast.error(formatApiError(e));
    return null;
  }
};

const LABELS = [["interested", "Interested"], ["meeting", "Meeting"], ["objection", "Not now (90 days)"], ["referral", "Referral"], ["forward", "Forwarded"], ["ooo", "Out of office"],
  ["not_interested", "Not interested"], ["unsubscribe", "Unsubscribe"], ["neutral", "Neutral"]];

// --- Grounding and AI Act evidence on a draft ------------------------------------------------------

export function GroundingNote({ e }) {
  const g = e.grounding;
  if (!g) return null;
  return (
    <div className="mt-1.5 text-[11px]" data-testid="grounding-note">
      {g.ok ? (
        <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="h-3 w-3" /> Every claim checked against its sources ({(g.claims || []).length})</span>
      ) : (
        <div className="rounded-lg border border-red-400/30 bg-red-400/5 px-2.5 py-1.5 text-red-200">
          <p className="flex items-center gap-1 font-medium"><AlertTriangle className="h-3 w-3" /> Unsupported claim: edit before approving</p>
          {(g.problems || []).map((p) => <p key={p} className="mt-0.5 opacity-90">{p}</p>)}
        </div>
      )}
      <span className="ml-2 text-muted-foreground">
        {e.opener_model ? `drafted by ${e.opener_model}` : `opener: ${e.opener_provider || "rules"}`}{e.prompt_version ? ` · prompt ${e.prompt_version}` : ""}{e.approved_by ? ` · approved by ${e.approved_by}` : ""}
      </span>
    </div>
  );
}

// --- Review lane -------------------------------------------------------------------------------------

export function ReviewPanel() {
  const can = useCan();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = useCallback(() => fetchReviewQueue().then(setData).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const resolve = async (r, label) => {
    setBusy(r.id);
    if (await run(() => resolveReply(r.id, label), `Marked ${label.replace("_", " ")}: actions applied`)) load();
    setBusy(null);
  };

  return (
    <Panel title="Replies that need a person" testId="review-panel"
      sub="Replies whose intent is mixed (interested but not now), low-confidence, or an auto-reply naming a colleague. Every sequence for that person is paused until you decide. Opt-outs are never held: they're honoured at once.">
      {!data ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary-ink" /> : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting. Clear replies are classified and acted on automatically.</p>
      ) : (
        <ul className="divide-y divide-line/10">
          {data.items.map((r) => (
            <li key={r.id} className="py-4" data-testid="review-item">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{r.email}</p>
                <span className="text-xs text-muted-foreground">{ago(r.received_at)} · via {r.source} · reads as {(r.intents || [r.suggested]).join(" + ")}{r.confidence != null ? ` · confidence ${Math.round(r.confidence * 100)}%` : ""}</span>
              </div>
              <blockquote className="mt-2 whitespace-pre-wrap rounded-lg border border-line/10 bg-line/5 px-3 py-2 text-sm text-foreground/90">{r.text || "(no text)"}</blockquote>
              {can("editLeads") && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LABELS.map(([k, l]) => (
                    <Button key={k} size="sm" variant={k === r.suggested ? "default" : "outline"} disabled={busy === r.id} onClick={() => resolve(r, k)}>{l}</Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// --- Deliverability and channels -----------------------------------------------------------------------

const STATE_TONE = { ok: "text-emerald-300", warn: "text-amber-300", pause: "text-red-300" };

export function DeliverabilityPanel() {
  const can = useCan();
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => fetchDeliverability().then(setD).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);
  const save = async (patch, ok) => {
    setBusy(true);
    if (await run(() => saveOutboundSettings(patch), ok)) load();
    setBusy(false);
  };
  if (!d) return <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-primary-ink" />;
  const rows = Object.entries(d.domains || {}).sort(([a], [b]) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)));
  const t = d.thresholds || {};
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Sending health by domain" className="lg:col-span-2" testId="deliverability-panel"
        sub={`Rolling 7 days, judged only once a domain has ${t.health_min_sends} sends. Hard bounce ${t.bounce_warn_pct}% holds new enrollments; ${t.bounce_pause_pct}% pauses sending. Complaints ${t.complaint_warn_pct}% warn, ${t.complaint_pause_pct}% pause.`}
        action={<Button size="sm" variant="outline" onClick={load}><RefreshCw /> Refresh</Button>}>
        {(d.enroll_hold || d.paused) && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {d.paused ? <p><b>Sending is paused.</b> Fix list quality or domain health, then resume in Compliance.</p> : <p><b>New enrollments are on hold:</b> {d.enroll_hold_reason}</p>}
            {d.enroll_hold && can("manage") && <Button size="sm" className="mt-2" disabled={busy} onClick={() => save({ enroll_hold: false }, "Enrollments released")}>Release the hold</Button>}
          </div>
        )}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No sends in the last 7 days.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-normal">Sending domain</th><th className="font-normal">Sends</th><th className="font-normal">Hard bounce</th><th className="font-normal">Complaints</th><th className="font-normal">State</th></tr></thead>
              <tbody className="divide-y divide-line/10">
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-2 font-medium">{k === "all" ? "All domains" : k}</td>
                    <td>{v.sends}</td>
                    <td>{v.bounce_pct ?? "—"}%</td>
                    <td>{v.complaint_pct ?? "—"}%</td>
                    <td className={cn("text-xs", STATE_TONE[v.state])}>{v.enough_data ? v.state : `too few sends (${v.sends}/${t.health_min_sends})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(d.uncertain_sends || []).length > 0 && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
            <p className="font-medium">{d.uncertain_sends.length} send(s) stopped mid-call</p>
            <p className="text-xs opacity-80">The provider may or may not have accepted them, so they're never resent automatically. Check the provider's log, then stop or re-approve the enrollment.</p>
          </div>
        )}
      </Panel>
      <Panel title="LinkedIn channel (Dripify)" testId="linkedin-panel"
        sub="Approved people are fed into a Dripify campaign you built and switched on in Dripify's UI. Paced per seat; any sign of a restriction pauses the channel.">
        <p className="flex items-center gap-2 text-sm">
          <Linkedin className="h-4 w-4 text-primary-ink" /> {d.linkedin_paused ? <span className="text-red-300">Paused: {d.linkedin_pause_reason}</span> : <span className="text-emerald-300">Running</span>}
        </p>
        {d.linkedin_paused && can("manage") && <Button size="sm" className="mt-3" disabled={busy} onClick={() => save({ linkedin_paused: false }, "LinkedIn channel resumed")}>Resume after checking the seat</Button>}
        <p className="mt-3 text-xs text-muted-foreground">To use it: set DRIPIFY_API_KEY and DRIPIFY_WEBHOOK_SECRET on the server, create a sequence with channel “LinkedIn” and the Dripify campaign id, and point the campaign's reply webhook at <code>/api/outbound/webhooks/dripify</code>.</p>
      </Panel>
      <LedgerPanel />
    </div>
  );
}

// --- Shared outreach ledger --------------------------------------------------------------------------------

export function LedgerPanel() {
  const can = useCan();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ email: "", linkedin_url: "", channel: "email", note: "" });
  const load = useCallback(() => fetchLedger({ page_size: 30 }).then(setData).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    const r = await run(() => recordLedger({ ...form, email: form.email || null, linkedin_url: form.linkedin_url || null, note: form.note || null }), "Recorded in the ledger");
    if (r?.warning) toast.warning(`Heads up: ${r.warning}`);
    if (r) { setForm({ email: "", linkedin_url: "", channel: "email", note: "" }); load(); }
  };
  return (
    <Panel title="Shared outreach ledger" testId="ledger-panel"
      sub="One row per person, across every team and channel. The first channel to reach someone owns them for the cooldown, so nobody gets an email and a LinkedIn message for the same push. Log touches you make outside MarkHub here.">
      {can("editLeads") && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Input className={inputCls} placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input className={inputCls} placeholder="LinkedIn profile URL" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
          <select className={selectCls} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            <option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="phone">Phone</option><option value="event">Event</option>
          </select>
          <Button disabled={!form.email && !form.linkedin_url} onClick={add}><Check /> Record touch</Button>
        </div>
      )}
      {!data ? <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-primary-ink" /> : data.items.length === 0 ? <p className="text-sm text-muted-foreground">No touches recorded yet.</p> : (
        <ul className="divide-y divide-line/10 text-sm">
          {data.items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0 truncate"><Badge className="mr-2">{r.first_channel}</Badge>{r.id.startsWith("li:") ? r.id.slice(3) : "email (hashed)"}</span>
              <span className="text-xs text-muted-foreground">{(r.channels || []).join(", ")} · last {ago(r.last_at)}{r.released_at ? " · released" : ""}</span>
              {can("editLeads") && !r.released_at && <Button size="sm" variant="ghost" onClick={async () => { if (await run(() => releaseLedger(r.id), "Released: other channels may contact them")) load(); }}>Release</Button>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// --- Country policy and retention (Compliance tab) ----------------------------------------------------

const POLICY_LABELS = {
  ALLOW_OPT_OUT: "Allowed, with opt-out", ALLOW_IF_ROLE_RELEVANT: "Only if role-relevant", GENERIC_ADDRESS_ONLY: "Generic addresses only", BLOCK_UNLESS_CONSENT: "Consent required",
};

export function CountryPolicyPanel() {
  const can = useCan();
  const [d, setD] = useState(null);
  const [edits, setEdits] = useState({});
  const [newCountry, setNewCountry] = useState("");
  const load = useCallback(() => fetchCountryPolicies().then((r) => { setD(r); setEdits({}); }).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);
  if (!d) return <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary-ink" />;
  const table = { ...d.table, ...edits };
  const save = async () => {
    const overrides = Object.fromEntries(Object.entries(table).filter(([, r]) => r.source === "admin" || r._edited).map(([c, r]) => [c, { policy: r.policy, basis: r.basis, verified: r.verified }]));
    if (await run(() => saveOutboundSettings({ country_policies: overrides }), "Country rules saved")) load();
  };
  const set = (c, patch) => setEdits({ ...edits, [c]: { ...table[c], ...patch, _edited: true } });
  return (
    <Panel title="Country rules for cold outreach" className="lg:col-span-2" testId="country-policy-panel"
      sub={`Allow-list: a country not in this table takes the strictest rule (EU/EEA: consent required). Unknown country: ${POLICY_LABELS[d.unknown_country_policy]}. UK sends also need a company, LLP or public body. ${d.note}`}
      action={can("manage") && Object.keys(edits).length > 0 ? <Button size="sm" onClick={save}>Save changes</Button> : null}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-normal">Country</th><th className="font-normal">Rule</th><th className="font-normal">Basis</th><th className="font-normal">Confirmed by counsel</th></tr></thead>
          <tbody className="divide-y divide-line/10">
            {Object.entries(table).sort(([a], [b]) => a.localeCompare(b)).map(([c, r]) => (
              <tr key={c}>
                <td className="py-2 font-medium">{c}</td>
                <td>{can("manage") ? (
                  <select className={cn(selectCls, "h-8 text-xs")} value={r.policy} onChange={(e) => set(c, { policy: e.target.value })}>
                    {d.policies.map((p) => <option key={p} value={p}>{POLICY_LABELS[p]}</option>)}
                  </select>) : POLICY_LABELS[r.policy]}</td>
                <td className="max-w-md py-2 pr-3 text-xs text-muted-foreground">{r.basis}{r.by ? ` (set by ${r.by})` : ""}</td>
                <td>{can("manage") ? <input type="checkbox" checked={!!r.verified} onChange={(e) => set(c, { verified: e.target.checked })} aria-label={`${c} confirmed`} /> : (r.verified ? "Yes" : "No")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {can("manage") && (
        <div className="mt-3 flex gap-2">
          <Input className={cn(inputCls, "max-w-xs")} placeholder="Add a country" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
          <Button size="sm" variant="outline" disabled={!newCountry.trim()} onClick={() => { set(newCountry.trim(), { policy: "BLOCK_UNLESS_CONSENT", basis: "Added by an admin", verified: false }); setNewCountry(""); }}>Add</Button>
        </div>
      )}
    </Panel>
  );
}

export function RetentionPanel({ settings, onSaved }) {
  const can = useCan();
  const [d, setD] = useState(null);
  const load = useCallback(() => fetchRetention().then(setD).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const toggle = async () => {
    const r = await run(() => saveOutboundSettings({ retention_enforce: !d.enforced }), d.enforced ? "Retention back to report-only" : "Retention purge switched on");
    if (r) { onSaved?.(r); load(); }
  };
  return (
    <Panel title="Retention and the Art. 14 notice clock" testId="retention-panel"
      sub={`A person sourced from elsewhere must get our notice (it rides on the first email) within ${settings?.notice_deadline_days || 30} days, or be purged. Non-responders are purged ${settings?.retention_days || 365} days after collection. Purging doesn't suppress them.`}>
      {!d ? <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-primary-ink" /> : (
        <>
          <p className="text-sm">{d.enforced ? <span className="text-emerald-300">Enforced daily.</span> : <span className="text-amber-300">Report-only: nothing is deleted yet.</span>}{" "}
            Due now: <b>{d.would_purge_now.notice_deadline}</b> past the notice deadline, <b>{d.would_purge_now.retention}</b> past retention.</p>
          {d.last_run?.last_run && <p className="mt-1 text-xs text-muted-foreground">Last run {fmtDateTime(d.last_run.last_run)}</p>}
          {can("comply") && <Button size="sm" className="mt-3" variant={d.enforced ? "outline" : "default"} onClick={toggle}>{d.enforced ? "Back to report-only" : "Switch the purge on"}</Button>}
        </>
      )}
    </Panel>
  );
}
