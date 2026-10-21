import { useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, CircleCheck, Link2, Loader2, PenLine, Play, RefreshCw, Send, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addSuppression, connectInstantly, createLia, fetchErasures, fetchIntegrations, fetchLia, fetchOpsHealth, fetchSuppression, formatApiError, removeSuppression,
  requestErasure, retryOutbox, revokeLia, runLearning, runOpsTick, saveIntegrations, saveOutboundSettings, signLia, testIntegrations,
} from "@/lib/adminApi";
import { Panel, ago, fmtDateTime, inputCls, selectCls, useCan, useLiveRefresh } from "@/components/admin/kit";

const toast2 = async (fn, ok) => {
  try {
    const r = await fn();
    if (ok) toast.success(typeof ok === "function" ? ok(r) : ok);
    return r;
  } catch (e) {
    toast.error(formatApiError(e));
    return null;
  }
};

// --- Compliance -------------------------------------------------------------------------------------

export function CompliancePanel({ settings, onSaved }) {
  const can = useCan();
  const [s, setS] = useState(settings);
  const [lia, setLia] = useState([]);
  const [newLia, setNewLia] = useState({ region: "eu", campaign_type: "", purpose: "", necessity: "", balancing: "", safeguards: "" });
  const [sup, setSup] = useState({ items: [], total: 0 });
  const [supQ, setSupQ] = useState("");
  const [supAdd, setSupAdd] = useState("");
  const [erase, setErase] = useState("");
  const [erasures, setErasures] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => setS(settings), [settings]);
  const loadLia = useCallback(() => fetchLia().then(setLia).catch(() => {}), []);
  const loadSup = useCallback(() => (can("suppress") ? fetchSuppression({ q: supQ, page_size: 100 }).then(setSup).catch(() => {}) : null), [supQ]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadLia(); if (can("comply")) fetchErasures().then(setErasures).catch(() => {}); }, [loadLia]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(loadSup, 300); return () => clearTimeout(t); }, [loadSup]);

  const saveSettings = async (patch) => {
    setBusy("settings");
    const r = await toast2(() => saveOutboundSettings(patch || {
      sending_enabled: s.sending_enabled, paused: s.paused, approval_required: s.approval_required, provider: s.provider, instantly_campaign_id: s.instantly_campaign_id || null,
      blocked_countries: s.blocked_countries, postal_address: s.postal_address, sender_name: s.sender_name, daily_cap: Number(s.daily_cap), send_hours_utc: s.send_hours_utc.map(Number),
      min_account_score: Number(s.min_account_score), require_verified_email: s.require_verified_email, ai_disclosure: s.ai_disclosure, bounce_pause_pct: Number(s.bounce_pause_pct),
    }), "Outbound settings saved");
    if (r) onSaved?.({ ...settings, ...r });
    setBusy(null);
  };

  if (!s) return <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-primary-ink" />;
  const signedRegions = new Set(lia.filter((l) => l.signed_at && !l.revoked).map((l) => l.region));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Sending" sub="Turn sending on only after the LIA is signed and the domains are warmed. Dry run records everything without emailing anyone." className="lg:col-span-2">
        {!can("manage") ? <p className="text-sm text-muted-foreground">Sending is {s.sending_enabled ? "on" : "off"}{s.paused ? " (paused)" : ""}, via {s.provider}. Only admins can change it.</p> : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={s.sending_enabled ? "outline" : "default"} disabled={busy === "settings"} onClick={() => saveSettings({ sending_enabled: !s.sending_enabled })}>{s.sending_enabled ? "Turn sending off" : "Turn sending on"}</Button>
              {s.sending_enabled && <Button variant="outline" disabled={busy === "settings"} onClick={() => saveSettings({ paused: !s.paused })}>{s.paused ? "Resume sending" : "Pause sending"}</Button>}
              {s.paused && s.pause_reason && <span className="text-sm text-red-300">{s.pause_reason}</span>}
              <span className="text-xs text-muted-foreground">Signed LIAs: {[...signedRegions].join(", ") || "none"} · transport: {s.transport?.smtp_or_resend ? "SMTP/Resend ready" : "no SMTP/Resend"}, {s.transport?.instantly ? "Instantly key set" : "no Instantly key"}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs text-muted-foreground">Provider<select className={cn(selectCls, "mt-1 w-full")} value={s.provider} onChange={(e) => setS({ ...s, provider: e.target.value })}><option value="dry_run">Dry run (no email)</option><option value="smtp">SMTP / Resend</option><option value="instantly">Instantly</option></select></label>
              {s.provider === "instantly" && <label className="text-xs text-muted-foreground">Default Instantly campaign<Input className={cn(inputCls, "mt-1")} value={s.instantly_campaign_id || ""} onChange={(e) => setS({ ...s, instantly_campaign_id: e.target.value })} /></label>}
              <label className="text-xs text-muted-foreground">Daily cap<Input type="number" className={cn(inputCls, "mt-1")} value={s.daily_cap} onChange={(e) => setS({ ...s, daily_cap: e.target.value })} /></label>
              <label className="text-xs text-muted-foreground">Send window (UTC hours)<div className="mt-1 flex gap-2"><Input type="number" className={inputCls} value={s.send_hours_utc[0]} onChange={(e) => setS({ ...s, send_hours_utc: [e.target.value, s.send_hours_utc[1]] })} /><Input type="number" className={inputCls} value={s.send_hours_utc[1]} onChange={(e) => setS({ ...s, send_hours_utc: [s.send_hours_utc[0], e.target.value] })} /></div></label>
              <label className="text-xs text-muted-foreground">Account score floor<Input type="number" className={cn(inputCls, "mt-1")} value={s.min_account_score} onChange={(e) => setS({ ...s, min_account_score: e.target.value })} /></label>
              <label className="text-xs text-muted-foreground">Pause above bounce %<Input type="number" step="0.5" className={cn(inputCls, "mt-1")} value={s.bounce_pause_pct} onChange={(e) => setS({ ...s, bounce_pause_pct: e.target.value })} /></label>
              <label className="text-xs text-muted-foreground sm:col-span-2">Blocked countries (outbound)<Input className={cn(inputCls, "mt-1")} value={s.blocked_countries.join(", ")} onChange={(e) => setS({ ...s, blocked_countries: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></label>
              <label className="text-xs text-muted-foreground sm:col-span-2">Postal address (required in every email)<Input className={cn(inputCls, "mt-1")} value={s.postal_address} onChange={(e) => setS({ ...s, postal_address: e.target.value })} placeholder="Solix Technologies, …" /></label>
              <label className="text-xs text-muted-foreground">Sender name<Input className={cn(inputCls, "mt-1")} value={s.sender_name} onChange={(e) => setS({ ...s, sender_name: e.target.value })} /></label>
              <label className="text-xs text-muted-foreground sm:col-span-3">AI disclosure line (optional; EU AI Act Art. 50 applies to chat and voice)<Input className={cn(inputCls, "mt-1")} value={s.ai_disclosure} onChange={(e) => setS({ ...s, ai_disclosure: e.target.value })} placeholder="This email was drafted with AI assistance and reviewed by our team." /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.approval_required} onChange={(e) => setS({ ...s, approval_required: e.target.checked })} /> Approve every enrollment</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.require_verified_email} onChange={(e) => setS({ ...s, require_verified_email: e.target.checked })} /> Verified emails only</label>
            </div>
            <div className="mt-4 flex justify-end"><Button size="sm" disabled={busy === "settings"} onClick={() => saveSettings()}>{busy === "settings" ? <Loader2 className="animate-spin" /> : <Check />} Save settings</Button></div>
          </>
        )}
      </Panel>

      <Panel title="Legitimate Interest Assessments" sub="GDPR Art. 6(1)(f). Outbound to a region stays blocked until its LIA is signed by compliance.">
        <ul className="divide-y divide-line/5">
          {lia.map((l) => (
            <li key={l.id} className="py-2.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p><b>{l.region.toUpperCase()}</b> · {l.campaign_type}</p>
                {l.revoked ? <span className="text-xs text-red-300">Revoked</span> : l.signed_at ? <span className="flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Signed by {l.signed_by} {ago(l.signed_at)}{can("comply") && <button className="text-muted-foreground underline" onClick={async () => { await toast2(() => revokeLia(l.id), "Revoked"); loadLia(); }}>Revoke</button>}</span>
                  : can("comply") ? <Button size="sm" onClick={async () => { await toast2(() => signLia(l.id), "LIA signed"); loadLia(); }}><PenLine /> Sign</Button> : <span className="text-xs text-amber-300">Waiting for signature</span>}
              </div>
              <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Assessment</summary><p className="mt-1"><b>Purpose:</b> {l.purpose}</p><p><b>Necessity:</b> {l.necessity}</p><p><b>Balancing:</b> {l.balancing}</p>{l.safeguards && <p><b>Safeguards:</b> {l.safeguards}</p>}</details>
            </li>
          ))}
          {!lia.length && <li className="py-2 text-sm text-muted-foreground">No LIAs yet.</li>}
        </ul>
        {can("comply") && (
          <details className="mt-3 rounded-xl border border-line/10 p-3 text-sm">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.12em] text-muted-foreground">Write an LIA</summary>
            <div className="mt-2 grid gap-2">
              <div className="grid grid-cols-3 gap-2"><select className={selectCls} value={newLia.region} onChange={(e) => setNewLia({ ...newLia, region: e.target.value })}>{["eu", "uk", "us", "global"].map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}</select><Input className={cn(inputCls, "col-span-2")} placeholder="Campaign type (e.g. Application retirement outbound)" value={newLia.campaign_type} onChange={(e) => setNewLia({ ...newLia, campaign_type: e.target.value })} /></div>
              {[["purpose", "1. The legitimate interest (why we contact these people)"], ["necessity", "2. Necessity (why this processing is needed and proportionate)"], ["balancing", "3. Balancing test against the recipients' rights and expectations"], ["safeguards", "Safeguards (opt-out, minimisation, retention)"]].map(([k, p]) => <Textarea key={k} rows={2} className="border-line/15 bg-background text-xs" placeholder={p} value={newLia[k]} onChange={(e) => setNewLia({ ...newLia, [k]: e.target.value })} />)}
              <div className="flex justify-end"><Button size="sm" onClick={async () => { const r = await toast2(() => createLia(newLia), "LIA saved; sign it to unlock the region"); if (r) { setNewLia({ region: "eu", campaign_type: "", purpose: "", necessity: "", balancing: "", safeguards: "" }); loadLia(); } }}>Save LIA</Button></div>
            </div>
          </details>
        )}
      </Panel>

      {can("suppress") && (
        <Panel title="Suppression list" sub={`${sup.total} people never get outreach: unsubscribes, bounces, not-interested replies, DNCs and erasures (hash only).`}>
          <div className="flex gap-2"><Input className={inputCls} placeholder="Search an email" value={supQ} onChange={(e) => setSupQ(e.target.value)} /></div>
          <ul className="mt-2 max-h-72 divide-y divide-line/5 overflow-y-auto">
            {sup.items.map((x) => (
              <li key={x.email_hash} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <span className="truncate">{x.email || <span className="text-muted-foreground">erased (hash only)</span>}</span>
                <span className="flex items-center gap-2 text-muted-foreground">{x.reason.replace("_", " ")} · {ago(x.added_at)}
                  {can("comply") && !["gdpr_erasure", "unsubscribed", "complaint"].includes(x.reason) && <button aria-label="Remove" onClick={async () => { await toast2(() => removeSuppression(x.email_hash), "Removed"); loadSup(); }}><Trash2 className="h-3.5 w-3.5" /></button>}</span>
              </li>
            ))}
          </ul>
          <Textarea rows={2} className="mt-3 border-line/15 bg-background text-xs" placeholder="Add emails (comma or line separated) as Do Not Contact" value={supAdd} onChange={(e) => setSupAdd(e.target.value)} />
          <div className="mt-2 flex justify-end"><Button size="sm" variant="outline" disabled={!supAdd.trim()} onClick={async () => { const r = await toast2(() => addSuppression({ emails: [supAdd], reason: "dnc" }), (r) => `${r.added} added`); if (r) { setSupAdd(""); loadSup(); } }}>Add to list</Button></div>
        </Panel>
      )}

      {can("comply") && (
        <Panel title="Right to erasure" sub="GDPR Art. 17: deletes the person from contacts, leads, forms, browsing, chats, trial accounts, registrations and outreach history, and queues deletion in Instantly and Digiprise. Keeps a hash so they're never contacted again." className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Input className={cn(inputCls, "max-w-sm")} placeholder="Email to erase" value={erase} onChange={(e) => setErase(e.target.value)} />
            <Button variant="destructive" size="sm" disabled={!erase.includes("@") || busy === "erase"} onClick={async () => {
              if (!window.confirm(`Erase ${erase} everywhere? This can't be undone.`)) return;
              setBusy("erase");
              const r = await toast2(() => requestErasure(erase), (r) => `Erased: ${Object.entries(r.counts).filter(([, n]) => n).map(([k, n]) => `${n} ${k.replace("_", " ")}`).join(", ") || "nothing found, suppressed anyway"}`);
              if (r) { setErase(""); fetchErasures().then(setErasures).catch(() => {}); loadSup(); }
              setBusy(null);
            }}>{busy === "erase" ? <Loader2 className="animate-spin" /> : <Trash2 />} Erase</Button>
          </div>
          {erasures.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Recent: {erasures.slice(0, 8).map((e) => `${fmtDateTime(e.completed_at)} by ${e.requested_by}`).join(" · ")}</p>}
        </Panel>
      )}
    </div>
  );
}

// --- Health --------------------------------------------------------------------------------------------

const SLACK = [["replies", "#solix-outbound-replies"], ["pipeline", "#solix-pipeline"], ["conflicts", "#solix-routing-conflicts"], ["watchdog", "#solix-watchdog"]];

export function HealthPanel() {
  const can = useCan();
  const [h, setH] = useState(null);
  const [int, setInt] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = useCallback((silent) => fetchOpsHealth().then(setH).catch((e) => !silent && toast.error(formatApiError(e))), []);
  useEffect(() => { load(); if (can("manage")) fetchIntegrations().then(setInt).catch(() => {}); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps
  useLiveRefresh(() => load(true), 30000);
  const doit = async (key, fn, ok) => { setBusy(key); await toast2(fn, ok); setBusy(null); load(true); };

  if (!h) return <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-primary-ink" />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Watchdog" sub="Checks every 30 minutes; a failing check alerts Slack #watchdog and the alert inbox once per half day." action={can("manage") && <Button size="sm" variant="outline" disabled={busy === "tick"} onClick={() => doit("tick", runOpsTick, "Checks run")}>{busy === "tick" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Run checks</Button>}>
        <ul className="divide-y divide-line/5">
          {h.checks.map((c) => (
            <li key={c.code} className="flex items-start gap-3 py-2.5 text-sm">
              {c.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <CircleAlert className={cn("mt-0.5 h-4 w-4 shrink-0", c.severity === "fail" ? "text-red-300" : "text-amber-300")} />}
              <div><p className="font-medium">{c.label}</p><p className="text-xs text-muted-foreground">{c.detail}</p></div>
            </li>
          ))}
        </ul>
        {h.alerts.length > 0 && <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Recent alerts ({h.alerts.length})</summary><ul className="mt-1 space-y-1">{h.alerts.map((a) => <li key={a.id}>{fmtDateTime(a.created_at)} · {a.message}</li>)}</ul></details>}
      </Panel>

      <Panel title="Job runs" sub="Each scheduled job's heartbeat.">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left uppercase tracking-[0.12em] text-muted-foreground"><th className="py-1 font-normal">Job</th><th className="font-normal">Started</th><th className="font-normal">Status</th><th className="font-normal">Counts</th></tr></thead>
            <tbody>{h.runs.filter((r) => r.job !== "outbound_tick" || Object.keys(r.counts || {}).length).slice(0, 30).map((r) => (
              <tr key={r.id} className="border-t border-line/5 align-top"><td className="py-1.5 pr-2">{r.job.replace("_", " ")}</td><td className="pr-2 text-muted-foreground">{ago(r.started_at)}</td><td className={cn("pr-2", r.status === "ok" ? "text-emerald-300" : r.status === "failed" ? "text-red-300" : "text-amber-300")}>{r.status}</td><td className="break-all text-muted-foreground">{Object.entries(r.counts || {}).filter(([, v]) => v !== 0 && v !== "").slice(0, 6).map(([k, v]) => `${k}: ${v}`).join(", ")}{r.error ? ` · ${r.error}` : ""}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Deliveries: {h.outbox.pending} waiting, {h.outbox.failed} failed.</p>
      </Panel>

      {can("manage") && int && (
        <Panel title="Integrations" sub="Slack incoming webhooks and the Digiprise one-way push. Server keys are set as environment variables on the host." className="lg:col-span-2">
          <div className="grid gap-3 lg:grid-cols-2">
            {SLACK.map(([k, label]) => (
              <label key={k} className="text-xs text-muted-foreground">{label}<Input className={cn(inputCls, "mt-1")} placeholder="https://hooks.slack.com/services/…" value={int.slack?.[k] || ""} onChange={(e) => setInt({ ...int, slack: { ...int.slack, [k]: e.target.value } })} /></label>
            ))}
            <label className="text-xs text-muted-foreground lg:col-span-2">Digiprise endpoint (receives lead, reply, suppression and erasure events; DIGIPRISE_TOKEN is sent as a Bearer token)
              <div className="mt-1 flex items-center gap-3"><Input className={inputCls} placeholder="https://digiprise.solix.com/api/echolocate/events" value={int.digiprise_url || ""} onChange={(e) => setInt({ ...int, digiprise_url: e.target.value })} /><label className="flex shrink-0 items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={!!int.digiprise_enabled} onChange={(e) => setInt({ ...int, digiprise_enabled: e.target.checked })} /> On</label></div>
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Server keys: {Object.entries(int.env || {}).map(([k, v]) => `${k.replace(/_/g, " ")} ${v ? "set" : "missing"}`).join(" · ")}</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" disabled={busy === "learn"} onClick={() => doit("learn", runLearning, (r) => (r.changed ? `Re-learned ${r.changed} weights from ${r.outcomes} outcomes` : `Only ${r.outcomes} outcomes; weights unchanged until 20`))}><Play /> Re-learn weights</Button>
            <Button size="sm" variant="outline" disabled={busy === "instantly"} onClick={() => doit("instantly", connectInstantly, "Instantly webhook connected")}><Link2 /> Connect Instantly webhook</Button>
            <Button size="sm" variant="outline" disabled={busy === "test"} onClick={() => doit("test", testIntegrations, (r) => `Test sent: ${r.sent || 0} delivered, ${r.skipped || 0} not configured, ${r.retry || 0} retrying`)}><Send /> Send test messages</Button>
            <Button size="sm" disabled={busy === "int"} onClick={() => doit("int", () => saveIntegrations({ slack: int.slack, digiprise_url: int.digiprise_url || null, digiprise_enabled: !!int.digiprise_enabled }), "Integrations saved")}><Check /> Save</Button>
          </div>
        </Panel>
      )}
      {can("manage") && h.outbox.failed > 0 && <FailedDeliveries onRetry={(id) => doit(`r${id}`, () => retryOutbox(id), "Retried")} />}
    </div>
  );
}

function FailedDeliveries({ onRetry }) {
  const [items, setItems] = useState([]);
  useEffect(() => { import("@/lib/adminApi").then(({ adminApi }) => adminApi.get("/admin/ops/outbox", { params: { status: "failed" }, fresh: true }).then((r) => setItems(r.data))).catch(() => {}); }, []);
  return (
    <Panel title="Failed deliveries" className="lg:col-span-2">
      <ul className="divide-y divide-line/5 text-xs">{items.map((i) => <li key={i.id} className="flex items-center justify-between gap-2 py-1.5"><span>{i.target} · {i.event} · {i.error}</span><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onRetry(i.id)}>Retry</Button></li>)}</ul>
    </Panel>
  );
}
