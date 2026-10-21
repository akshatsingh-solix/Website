import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Loader2, MailCheck, Pause, Play, Plus, Search, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createContact, createSequence, enrollContacts, fetchContacts, fetchEnrollments, fetchOutboundKpis, fetchReplies, fetchSequences, formatApiError, importContacts,
  logReply, patchContact, patchEnrollment, updateSequence, verifyContact,
} from "@/lib/adminApi";
import { Panel, StatTile, ago, fmtDateTime, inputCls, selectCls, useCan, useLiveRefresh } from "@/components/admin/kit";

const REPLY_LABELS = { interested: "Interested", meeting: "Meeting", objection: "Objection", referral: "Referral", forward: "Forwarded", ooo: "Out of office", not_interested: "Not interested", unsubscribe: "Unsubscribe", neutral: "Neutral" };
const REPLY_TONE = { interested: "text-emerald-300", meeting: "text-emerald-300", objection: "text-amber-300", referral: "text-sky-300", forward: "text-sky-300", ooo: "text-muted-foreground", not_interested: "text-red-300", unsubscribe: "text-red-300", neutral: "text-muted-foreground" };
const ENR_STATUS = { pending_approval: "Waiting for approval", scheduled: "Scheduled", active: "Sending", paused: "Paused", replied: "Replied", completed: "Finished", stopped: "Stopped", bounced: "Bounced" };
const EMAIL_TONE = { valid: "text-emerald-300", mx_only: "text-amber-300", catch_all: "text-amber-300", risky: "text-amber-300", invalid: "text-red-300" };

const errDetail = (e) => {
  const d = e?.response?.data?.detail;
  return d?.reasons ? `${d.message} ${d.reasons.join("; ")}` : formatApiError(e);
};

// --- Overview ------------------------------------------------------------------------------

export function OverviewPanel() {
  const [k, setK] = useState(null);
  const [days, setDays] = useState(30);
  const load = useCallback((silent) => fetchOutboundKpis(days, { fresh: !!silent }).then(setK).catch((e) => !silent && toast.error(formatApiError(e))), [days]);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(() => load(true), 30000);
  if (!k) return <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-primary-ink" />;
  const pct = (v) => (v === null || v === undefined ? "—" : `${v}%`);
  const dod = [
    ["Autonomous daily runs", `${k.dod.autonomous_streak_days} of ${k.dod.target_streak} days`, k.dod.autonomous_streak_days >= k.dod.target_streak],
    ["Hard bounce under 3%", k.bounce_rate === null ? "No sends yet" : `${k.bounce_rate}%`, k.dod.bounce_ok === true],
    ["Qualified reply this week", k.qualified_replies_7d ? `${k.qualified_replies_7d} this week` : "None yet", k.dod.qualified_reply_this_week],
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">Window
        <select className={cn(selectCls, "h-8 text-xs")} value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90].map((d) => <option key={d} value={d}>{d} days</option>)}</select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Emails sent" value={k.sends} />
        <StatTile label="Bounce rate" value={pct(k.bounce_rate)} sub="Pauses itself over 3%" />
        <StatTile label="Reply rate" value={pct(k.reply_rate)} />
        <StatTile label="Positive replies" value={k.positive} sub={k.positive_rate !== null ? `${k.positive_rate}% of sends` : "Target 0.64%+"} />
        <StatTile label="Meetings" value={k.meetings} />
        <StatTile label="Waiting for approval" value={k.pending_approval} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Day-30 definition of done" sub="From the EchoLocate requirements">
          <ul className="divide-y divide-line/5">
            {dod.map(([label, value, ok]) => (
              <li key={label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex items-center gap-2">{ok ? <Check className="h-4 w-4 text-emerald-300" /> : <X className="h-4 w-4 text-muted-foreground" />}{label}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{value}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="By sequence and variant">
          {k.by_sequence.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><th className="py-1 pr-2 font-normal">Sequence</th><th className="font-normal">Var.</th><th className="text-right font-normal">Sends</th><th className="text-right font-normal">Replies</th><th className="text-right font-normal">Positive</th></tr></thead>
              <tbody>{k.by_sequence.map((r, i) => <tr key={i} className="border-t border-line/5"><td className="py-1.5 pr-2">{r.sequence}</td><td>{r.variant || "—"}</td><td className="text-right tabular-nums">{r.sends}</td><td className="text-right tabular-nums">{r.replies}</td><td className="text-right tabular-nums">{r.positive}</td></tr>)}</tbody>
            </table></div>
          ) : <p className="text-sm text-muted-foreground">No sends in this window.</p>}
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">{k.contacts} contacts · {k.suppressed} on the suppression list · enrollments: {Object.entries(k.enrollments || {}).map(([s, n]) => `${ENR_STATUS[s] || s} ${n}`).join(", ") || "none yet"}</p>
    </div>
  );
}

// --- Approvals -------------------------------------------------------------------------------

export function ApprovalsPanel() {
  const can = useCan();
  const [status, setStatus] = useState("pending_approval");
  const [data, setData] = useState({ items: [], total: 0 });
  const [open, setOpen] = useState(null);
  const [edit, setEdit] = useState({});
  const [busy, setBusy] = useState(null);
  const load = useCallback(() => fetchEnrollments({ status, page_size: 100 }, { fresh: true }).then(setData).catch((e) => toast.error(formatApiError(e))), [status]);
  useEffect(() => { load(); }, [load]);

  const act = async (e, body, msg) => {
    setBusy(e.id);
    try {
      await patchEnrollment(e.id, body);
      toast.success(msg);
      load();
    } catch (err) {
      toast.error(errDetail(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel title="Enrollments" sub="Every email is written from the account's signal. Check it reads right, then approve. Nothing sends while sending is off." action={
      <select className={cn(selectCls, "h-8 text-xs")} value={status} onChange={(e) => setStatus(e.target.value)}>
        {[["pending_approval", "Waiting for approval"], ["scheduled,active", "Scheduled and sending"], ["paused", "Paused"], ["replied", "Replied"], ["completed,stopped", "Finished or stopped"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>}>
      {data.items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here. Enroll contacts from a Radar account (Contacts tab) or from Outbound → Contacts.</p> : (
        <ul className="divide-y divide-line/5">
          {data.items.map((e) => {
            const isOpen = open === e.id;
            const steps = edit[e.id] || e.steps;
            return (
              <li key={e.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button type="button" onClick={() => setOpen(isOpen ? null : e.id)} className="min-w-0 flex-1 text-left">
                    <p className="font-medium">{e.contact_name} <span className="text-muted-foreground">· {e.company_name}</span></p>
                    <p className="text-xs text-muted-foreground">{e.sequence_name} · variant {e.variant} · {ENR_STATUS[e.status] || e.status}{e.status !== "pending_approval" ? ` · step ${e.step_index}/${e.steps.length}` : ""} · opener by {e.opener_provider}</p>
                    <p className="mt-1 text-xs italic text-foreground/80">“{e.opener}”</p>
                  </button>
                  <div className="flex flex-wrap items-center gap-1">
                    {can("editLeads") && e.status === "pending_approval" && <Button size="sm" disabled={busy === e.id} onClick={() => act(e, { action: "approve" }, "Approved: it sends at the next window")}><Check /> Approve</Button>}
                    {can("editLeads") && e.status === "pending_approval" && <Button size="sm" variant="ghost" disabled={busy === e.id} onClick={() => act(e, { action: "reject", reason: "Rejected at review" }, "Rejected")}><X /> Reject</Button>}
                    {can("editLeads") && ["scheduled", "active"].includes(e.status) && <Button size="sm" variant="ghost" onClick={() => act(e, { action: "pause" }, "Paused")}><Pause /> Pause</Button>}
                    {can("editLeads") && e.status === "paused" && <Button size="sm" variant="ghost" onClick={() => act(e, { action: "resume" }, "Resumed")}><Play /> Resume</Button>}
                    <Button size="sm" variant="ghost" aria-label="Show emails" onClick={() => setOpen(isOpen ? null : e.id)}><ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} /></Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 space-y-3">
                    {steps.map((s, i) => (
                      <div key={i} className="rounded-xl border border-line/10 bg-background p-3">
                        <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Email {i + 1} · day {s.day}</p>
                        {e.status === "pending_approval" && can("editLeads") ? (
                          <>
                            <Input className={inputCls} value={s.subject} onChange={(ev) => setEdit({ ...edit, [e.id]: steps.map((x, j) => (j === i ? { ...x, subject: ev.target.value } : x)) })} />
                            <Textarea rows={7} className="mt-2 border-line/15 bg-background text-xs" value={s.body} onChange={(ev) => setEdit({ ...edit, [e.id]: steps.map((x, j) => (j === i ? { ...x, body: ev.target.value } : x)) })} />
                          </>
                        ) : (
                          <><p className="text-sm font-medium">{s.subject}</p><pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted-foreground">{s.body}</pre></>
                        )}
                      </div>
                    ))}
                    {edit[e.id] && <Button size="sm" variant="outline" onClick={async () => { await act(e, { action: "edit", steps: edit[e.id] }, "Emails updated"); setEdit({ ...edit, [e.id]: undefined }); }}>Save edits</Button>}
                    <p className="text-[11px] text-muted-foreground">An unsubscribe link and the postal address are added to every email when it's sent.</p>
                    {(e.history || []).length > 0 && <p className="text-[11px] text-muted-foreground">{e.history.slice(-4).map((h) => `${h.action}${h.detail ? ` (${h.detail})` : ""} ${ago(h.at)}`).join(" · ")}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// --- Contacts ---------------------------------------------------------------------------------

export function ContactsPanel() {
  const can = useCan();
  const [q, setQ] = useState("");
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState(new Set());
  const [sequences, setSequences] = useState([]);
  const [seq, setSeq] = useState("");
  const [add, setAdd] = useState({ name: "", email: "", title: "", company: "", domain: "", country: "" });
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(null);
  const [blocked, setBlocked] = useState([]);

  const load = useCallback(() => fetchContacts({ q, page_size: 200 }, { fresh: true }).then(setData).catch((e) => toast.error(formatApiError(e))), [q]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => { fetchSequences().then((s) => { setSequences(s); setSeq(s.find((x) => x.active)?.id || ""); }).catch(() => {}); }, []);

  const run = async (key, fn, msg) => {
    setBusy(key);
    try {
      const r = await fn();
      if (msg) toast.success(typeof msg === "function" ? msg(r) : msg);
      load();
      return r;
    } catch (e) {
      toast.error(errDetail(e));
      return null;
    } finally {
      setBusy(null);
    }
  };
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-6">
      <Panel title="Contacts" sub="Business contacts on Radar accounts, with where they were found (GDPR Art. 14) and email verification." action={
        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-8 w-48 border-line/15 bg-background pl-8 text-xs" /></div>}>
        {can("editLeads") && selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-teal/30 bg-teal/5 p-2 text-sm">
            <span>{selected.size} selected</span>
            <select className={cn(selectCls, "h-8 text-xs")} value={seq} onChange={(e) => setSeq(e.target.value)}>{sequences.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <Button size="sm" disabled={!seq || busy === "enroll"} onClick={async () => { const r = await run("enroll", () => enrollContacts({ contact_ids: [...selected], sequence_id: seq }), (r) => `${r.created.length} enrolled, ${r.blocked.length} blocked by the gate`); if (r) { setBlocked(r.blocked); setSelected(new Set()); } }}><Send /> Enroll</Button>
          </div>
        )}
        {blocked.length > 0 && (
          <ul className="mb-3 space-y-1 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">
            {blocked.map((b) => <li key={b.contact_id}><b>{b.name}</b>: {b.reasons.join("; ")}</li>)}
            <li><button className="underline" onClick={() => setBlocked([])}>Dismiss</button></li>
          </ul>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><th className="w-6" /><th className="py-1 font-normal">Name</th><th className="font-normal">Company</th><th className="font-normal">Email</th><th className="font-normal">Source</th><th /></tr></thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-t border-line/5 align-top">
                  <td className="py-2">{can("editLeads") && c.email && !c.suppressed && <input type="checkbox" aria-label={`Select ${c.name}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} />}</td>
                  <td className="py-2 pr-2">
                    <p className="font-medium">{c.lead_id ? <Link to={`/admin/leads?lead=${c.lead_id}`} className="hover:underline" title="Also a website lead">{c.name}</Link> : c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.title || "—"}{c.persona === "target" && <span className="ml-1 text-teal">· target</span>}{c.lead_id && <span className="ml-1 text-teal">· lead</span>}</p>
                  </td>
                  <td className="py-2 pr-2 text-xs">{c.company_id ? <Link to={`/admin/radar?account=${c.company_id}`} className="hover:underline">{c.company || "Account"}</Link> : c.company || "—"}<p className="text-muted-foreground">{c.country}</p></td>
                  <td className="py-2 pr-2 text-xs">{c.email || "—"}<p className={EMAIL_TONE[c.email_status] || "text-muted-foreground"}>{(c.email_status || "").replace("_", " ")}{c.suppressed ? ` · suppressed (${c.suppressed})` : ""}</p></td>
                  <td className="py-2 pr-2 text-xs text-muted-foreground">{c.source}{c.source_url && <> · <a className="text-teal hover:underline" href={c.source_url} target="_blank" rel="noopener noreferrer">where</a></>}</td>
                  <td className="whitespace-nowrap py-2 text-right">{can("editLeads") && c.email && <>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy === c.id} onClick={() => run(c.id, () => verifyContact(c.id), (r) => `Email ${String(r.email_status).replace("_", " ")}`)}><MailCheck /> Verify</Button>
                    {!["valid", "invalid"].includes(c.email_status) && <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy === `m${c.id}`} onClick={() => run(`m${c.id}`, () => patchContact(c.id, { mark_verified: true }), "Marked verified")}><Check /> Mark verified</Button>}
                  </>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && <p className="py-4 text-sm text-muted-foreground">No contacts yet.</p>}
        </div>
      </Panel>
      {can("editLeads") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Add a contact" sub="The company is matched to its Radar account by name or email domain.">
            <div className="grid gap-2 sm:grid-cols-2">
              {[["name", "Full name"], ["title", "Title"], ["email", "Business email"], ["company", "Company"], ["domain", "Company domain"], ["country", "Country"]].map(([k, p]) => <Input key={k} className={inputCls} placeholder={p} value={add[k]} onChange={(e) => setAdd({ ...add, [k]: e.target.value })} />)}
            </div>
            <div className="mt-3 flex justify-end"><Button size="sm" disabled={!add.name.trim() || busy === "add"} onClick={async () => { const r = await run("add", () => createContact({ ...Object.fromEntries(Object.entries(add).map(([k, v]) => [k, v || null])), name: add.name }), "Contact added"); if (r) setAdd({ name: "", email: "", title: "", company: "", domain: "", country: "" }); }}><Plus /> Add</Button></div>
          </Panel>
          <Panel title="Import from CSV" sub="Columns: name (or first_name, last_name), email, title, company, domain, country, linkedin_url, source_url.">
            <Textarea rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"name,email,title,company,domain,country\nJordan Smith,jordan@acme.com,CIO,Acme,acme.com,United States"} className="border-line/15 bg-background font-mono text-xs" />
            <div className="mt-3 flex justify-end"><Button size="sm" disabled={csv.length < 5 || busy === "csv"} onClick={async () => { const r = await run("csv", () => importContacts(csv), (r) => `${r.created} added, ${r.skipped} skipped`); if (r) setCsv(""); }}><Upload /> Import</Button></div>
          </Panel>
        </div>
      )}
    </div>
  );
}

// --- Sequences ---------------------------------------------------------------------------------

const blankStep = (day) => ({ day, subject_a: "", body_a: "", subject_b: "", body_b: "" });

export function SequencesPanel() {
  const can = useCan();
  const [seqs, setSeqs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => fetchSequences().then(setSeqs).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const body = { name: editing.name, region: editing.region, steps: editing.steps, active: editing.active, provider: editing.provider || null, instantly_campaign_id: editing.instantly_campaign_id || null };
      await (editing.id ? updateSequence(editing.id, body) : createSequence(body));
      toast.success("Sequence saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    const set = (patch) => setEditing({ ...editing, ...patch });
    const setStep = (i, patch) => set({ steps: editing.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
    return (
      <Panel title={editing.id ? `Edit: ${editing.name}` : "New sequence"} sub="Placeholders: {first_name} {company} {title} {opener} {rep_name}. {opener} is written per contact from the account's signal. Never name a competitor.">
        <div className="grid gap-2 sm:grid-cols-4">
          <Input className={cn(inputCls, "sm:col-span-2")} placeholder="Name" value={editing.name} onChange={(e) => set({ name: e.target.value })} />
          <select className={selectCls} value={editing.region} onChange={(e) => set({ region: e.target.value })}>{["eu", "uk", "us", "global"].map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}</select>
          <select className={selectCls} value={editing.provider || ""} onChange={(e) => set({ provider: e.target.value || null })}><option value="">Provider: use the default</option><option value="dry_run">Dry run</option><option value="smtp">SMTP</option><option value="instantly">Instantly</option></select>
          {editing.provider === "instantly" && <Input className={cn(inputCls, "sm:col-span-2")} placeholder="Instantly campaign ID" value={editing.instantly_campaign_id || ""} onChange={(e) => set({ instantly_campaign_id: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(e) => set({ active: e.target.checked })} /> Active</label>
        </div>
        <div className="mt-4 space-y-4">
          {editing.steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-line/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">Email {i + 1}, day <Input type="number" className={cn(inputCls, "h-8 w-20")} value={s.day} onChange={(e) => setStep(i, { day: Number(e.target.value) })} />
                {editing.steps.length > 1 && <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => set({ steps: editing.steps.filter((_, j) => j !== i) })}>Remove</Button>}</div>
              <div className="grid gap-3 lg:grid-cols-2">
                {["a", "b"].map((v) => (
                  <div key={v}><p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Variant {v.toUpperCase()}{v === "b" ? " (optional)" : ""}</p>
                    <Input className={inputCls} placeholder="Subject" value={s[`subject_${v}`]} onChange={(e) => setStep(i, { [`subject_${v}`]: e.target.value })} />
                    <Textarea rows={7} className="mt-2 border-line/15 bg-background text-xs" placeholder="Body" value={s[`body_${v}`]} onChange={(e) => setStep(i, { [`body_${v}`]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <Button size="sm" variant="outline" onClick={() => set({ steps: [...editing.steps, blankStep((editing.steps.at(-1)?.day || 0) + 4)] })}><Plus /> Add email</Button>
          <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button size="sm" disabled={busy} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Save sequence</Button></div>
        </div>
      </Panel>
    );
  }
  return (
    <Panel title="Sequences" sub="EU sequences are 3 touches (the playbook's rule); the US one is 4. A/B variants alternate until each has 50 first sends, then the winner takes over." action={can("editLeads") && <Button size="sm" onClick={() => setEditing({ name: "", region: "eu", steps: [blankStep(0)], active: true })}><Plus /> New sequence</Button>}>
      <ul className="divide-y divide-line/5">
        {seqs.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div><p className="font-medium">{s.name} {!s.active && <span className="text-xs text-muted-foreground">(inactive)</span>}</p>
              <p className="text-xs text-muted-foreground">{s.region.toUpperCase()} · {s.steps.length} emails on days {s.steps.map((x) => x.day).join(", ")} · {s.enrolled} enrolled{s.provider ? ` · ${s.provider}` : ""}{s.ab_winner ? ` · variant ${s.ab_winner} won` : ""}</p></div>
            {can("editLeads") && <Button size="sm" variant="outline" onClick={() => setEditing(JSON.parse(JSON.stringify(s)))}>Edit</Button>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// --- Replies ------------------------------------------------------------------------------------

export function RepliesPanel() {
  const can = useCan();
  const [label, setLabel] = useState("");
  const [data, setData] = useState({ items: [] });
  const [form, setForm] = useState({ email: "", text: "", label: "" });
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => fetchReplies({ label, page_size: 100 }, { fresh: true }).then(setData).catch((e) => toast.error(formatApiError(e))), [label]);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load, 30000);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Panel title="Replies" sub="Instantly replies arrive by webhook and are classified automatically." className="lg:col-span-8" action={
        <select className={cn(selectCls, "h-8 text-xs")} value={label} onChange={(e) => setLabel(e.target.value)}><option value="">All labels</option>{Object.entries(REPLY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}>
        {data.items.length ? (
          <ul className="divide-y divide-line/5">
            {data.items.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <p>
                  <span className={cn("font-medium", REPLY_TONE[r.label])}>{REPLY_LABELS[r.label] || r.label}</span> ·{" "}
                  {r.contact?.lead_id ? <Link to={`/admin/leads?lead=${r.contact.lead_id}`} className="hover:underline">{r.contact?.name || r.email}</Link> : r.contact?.name || r.email}{" "}
                  <span className="text-muted-foreground">({r.company_id ? <Link to={`/admin/radar?account=${r.company_id}`} className="hover:underline">{r.contact?.company || "account"}</Link> : r.contact?.company || "—"})</span>
                </p>
                {r.text && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{r.text}</p>}
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{fmtDateTime(r.received_at)} · {r.source} · {r.classified_by}{r.reason ? ` · ${r.reason}` : ""}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No replies yet.</p>}
      </Panel>
      {can("editLeads") && (
        <Panel title="Log a reply" sub="For replies that came in by hand (e.g. with SMTP sending). Leave the label empty to classify automatically." className="lg:col-span-4">
          <Input className={inputCls} placeholder="Their email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Textarea rows={6} className="mt-2 border-line/15 bg-background text-sm" placeholder="Paste the reply" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          <select className={cn(selectCls, "mt-2 w-full")} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}><option value="">Classify automatically</option>{Object.entries(REPLY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <div className="mt-3 flex justify-end"><Button size="sm" disabled={busy || !form.email || !form.text} onClick={async () => {
            setBusy(true);
            try {
              const r = await logReply({ email: form.email, text: form.text, label: form.label || undefined });
              toast.success(`Logged as ${REPLY_LABELS[r.label] || r.label}`);
              setForm({ email: "", text: "", label: "" });
              load();
            } catch (e) {
              toast.error(formatApiError(e));
            } finally {
              setBusy(false);
            }
          }}><Check /> Log reply</Button></div>
        </Panel>
      )}
    </div>
  );
}
