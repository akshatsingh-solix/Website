import { useCallback, useEffect, useState } from "react";
import { Check, Download, ExternalLink, FlaskConical, Loader2, MailCheck, Plus, Search, Send, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addRadarSignal, createContact, deleteRadarSignal, enrollContacts, fetchGate, fetchRadarAccount, fetchSequences, findContactEmail, formatApiError,
  patchRadarAccount, promoteToLead, requestResearch, reviewResearch, verifyContact,
} from "@/lib/adminApi";
import { buildBrief, saveBrief } from "@/lib/radarBrief";
import { StageBadge, fmtDate, fmtDateTime, inputCls, selectCls, useCan } from "@/components/admin/kit";
import { AccountStatus, BASIS_LABELS, DiveBadge, Highlight, RepRule, SIGNAL_LABELS, STATUS_LABELS, StrengthBadge, useHighlighter } from "@/components/admin/radarKit";
import { cn } from "@/lib/utils";

const Row = ({ label, children }) => (children || children === 0 ? (
  <div className="grid grid-cols-3 gap-3 border-b border-line/5 py-2 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="col-span-2 break-words text-foreground">{children}</dd>
  </div>
) : null);

const EMAIL_TONE = { valid: "text-emerald-300", mx_only: "text-amber-300", catch_all: "text-amber-300", risky: "text-amber-300", invalid: "text-red-300", unknown: "text-muted-foreground", unchecked: "text-muted-foreground", missing: "text-muted-foreground" };

export function AccountDrawer({ id, meta, onClose, onChanged }) {
  const can = useCan();
  const hl = useHighlighter(meta?.highlight);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ owner: "", status: "new", notes: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);
  const [sequences, setSequences] = useState([]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await fetchRadarAccount(id, { fresh: true });
      setData(d);
      setForm({ owner: d.account.owner || "", status: d.account.status || "new", notes: d.account.notes || "", reason: "" });
    } catch (e) {
      toast.error(formatApiError(e));
    }
  }, [id]);

  useEffect(() => { setData(null); load(); }, [load]);
  useEffect(() => { if (id && can("editLeads")) fetchSequences().then(setSequences).catch(() => {}); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const a = data?.account;
  const dirty = a && (form.owner !== (a.owner || "") || form.status !== a.status || form.notes !== (a.notes || ""));

  const act = async (key, fn, ok) => {
    setBusy(key);
    try {
      const r = await fn();
      if (ok) toast.success(typeof ok === "function" ? ok(r) : ok);
      await load();
      onChanged?.();
      return r;
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(d?.reasons ? `${d.message} ${d.reasons.join("; ")}` : formatApiError(e));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const save = () => act("save", () => patchRadarAccount(a.id, { owner: form.owner, status: form.status, notes: form.notes, reason: form.reason || undefined }), "Account updated");

  const download = async () => {
    setBusy("brief");
    try {
      saveBrief(await buildBrief([data], { terms: meta?.highlight }), `Lead brief - ${a.name}`);
    } catch (e) {
      toast.error(`Couldn't build the brief: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const signalsBy = (types) => (data?.signals || []).filter((s) => types.includes(s.type));
  const dive = data?.research?.find((r) => ["approved", "draft"].includes(r.status));
  const queued = data?.research?.find((r) => ["queued", "running"].includes(r.status));

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="dark w-full overflow-y-auto border-line/10 bg-background text-foreground sm:max-w-2xl" data-testid="account-drawer">
        {!a ? (
          <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>
        ) : (
          <>
            <SheetHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2"><StrengthBadge strength={a.strength} /><AccountStatus status={a.status} /><DiveBadge score={a.research_score} verdictClass={a.verdict_class} />{a.surge && <span className="text-[11px] text-red-300">Surging</span>}</div>
              <SheetTitle className="font-display text-2xl font-medium">{a.name}</SheetTitle>
              <SheetDescription>
                {a.territory} · {a.owner_name || "Unassigned"}{a.route_basis ? ` (${BASIS_LABELS[a.route_basis] || a.route_basis})` : ""}{a.domains?.length ? ` · ${a.domains.join(", ")}` : ""}
              </SheetDescription>
              {a.excluded_reason && <p className="flex items-center gap-1.5 text-xs text-red-300"><ShieldAlert className="h-3.5 w-3.5" /> No automated outreach: {a.excluded_reason}</p>}
            </SheetHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={download} disabled={busy === "brief"} data-testid="download-brief">{busy === "brief" ? <Loader2 className="animate-spin" /> : <Download />} Download the full brief</Button>
              {can("editLeads") && (
                <Button size="sm" variant="outline" onClick={() => act("research", () => requestResearch(a.id), "Deep dive requested; it drafts in a minute or two")} disabled={!!queued || busy === "research"}>
                  {busy === "research" || queued ? <Loader2 className="animate-spin" /> : <FlaskConical />} {queued ? "Deep dive running" : dive ? "Refresh deep dive" : "Request deep dive"}
                </Button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              {[["Score", Math.round(a.score || 0)], ["Signals", a.signal_count || 0], ["Last 30 days", a.signals_30d || 0], ["Latest", a.latest_signal_at ? fmtDate(a.latest_signal_at) : "—"]].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-line/10 bg-card p-2.5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{l}</p><p className="mt-1 font-display text-lg tabular-nums">{v}</p></div>
              ))}
            </div>

            <Tabs defaultValue={dive ? "dive" : "overview"} className="mt-5">
              <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {[["overview", "Overview"], ["signals", `Signals (${data.signals.length})`], ["dive", "Deep dive"], ["contacts", `Contacts (${data.contacts.length})`], ["website", `Website (${data.leads.length})`], ["history", "History"]].map(([v, l]) => (
                  <TabsTrigger key={v} value={v} className="rounded-full border border-line/15 px-3 py-1 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white">{l}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-5">
                {can("editLeads") ? (
                  <section className="rounded-2xl border border-line/10 bg-card p-4" data-testid="account-workflow">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Owner
                        <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={cn(selectCls, "mt-1 w-full")}>
                          <option value="">Unassigned</option>
                          {meta?.team?.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
                          {form.owner && !meta?.team?.some((m) => m.email === form.owner) && <option value={form.owner}>{form.owner}</option>}
                        </select>
                      </label>
                      <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Status
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={cn(selectCls, "mt-1 w-full")}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </label>
                    </div>
                    {form.status !== a.status && <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why (optional)" className="mt-2 h-9 border-line/15 bg-background text-sm" />}
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notes: who you spoke to, next step…" className="mt-3 border-line/15 bg-background text-sm" />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">Choosing an owner here overrides territory routing for this account.</p>
                      <Button size="sm" onClick={save} disabled={!dirty || busy === "save"}>{busy === "save" ? <Loader2 className="animate-spin" /> : <Check />} Save</Button>
                    </div>
                  </section>
                ) : a.notes ? <p className="whitespace-pre-wrap rounded-xl border border-line/10 bg-card p-4 text-sm text-muted-foreground">{a.notes}</p> : null}
                <dl>
                  <Row label="Competitors">{(a.competitors || []).join(", ")}</Row>
                  <Row label="Signal types">{(a.signal_types || []).map((t) => SIGNAL_LABELS[t] || t).join(", ")}</Row>
                  <Row label="Product fit">{a.primary_product && `${a.primary_product.replace(/-/g, " ")} (${a.primary_line})`}</Row>
                  <Row label="Countries">{(a.countries || []).join(", ")}</Row>
                  <Row label="States">{(a.states || []).join(", ")}</Row>
                  <Row label="Industry">{a.industry}</Row>
                  <Row label="Existing customer">{a.is_customer ? "Yes" : null}</Row>
                  <Row label="First seen">{a.first_seen_at && fmtDateTime(a.first_seen_at)}</Row>
                </dl>
                {can("editLeads") && <AccountDetails account={a} onSave={(body) => act("details", () => patchRadarAccount(a.id, body), "Details saved")} busy={busy === "details"} />}
                <RepRule />
              </TabsContent>

              <TabsContent value="signals" className="mt-4 space-y-5">
                {[["Competitor job postings", ["competitor_job"]], ["Problem signals (no competitor named)", ["problem_job"]], ["DNS and certificates", ["dns", "cert"]], ["Filings, tenders and news", ["filing", "tender", "news"]], ["LinkedIn", ["linkedin"]]].map(([title, types]) => {
                  const rows = signalsBy(types);
                  if (!rows.length) return null;
                  return (
                    <section key={title}>
                      <p className="eyebrow mb-2">{title} · {rows.length}</p>
                      <ul className="divide-y divide-line/5 rounded-xl border border-line/10 bg-card">
                        {rows.map((s) => (
                          <li key={s.id} className="p-3 text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground"><Highlight text={s.role_title || s.title || s.person || s.record_value} hl={hl} /></p>
                                {s.evidence_text && <p className="mt-1 text-xs text-muted-foreground"><span className="text-foreground/70">Why it matched: </span><Highlight text={s.evidence_text} hl={hl} /></p>}
                                <p className="mt-1 text-[11px] text-muted-foreground">{[s.competitor_product || s.problem_term, s.role_strength, s.location || s.country, s.posted_at && fmtDate(s.posted_at), `first seen ${fmtDate(s.first_seen_at)}`, s.source].filter(Boolean).join(" · ")}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {s.evidence_url && <a href={s.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal hover:underline">Open <ExternalLink className="h-3 w-3" /></a>}
                                {can("manage") && <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Remove signal" onClick={() => window.confirm("Remove this signal?") && act("del", () => deleteRadarSignal(s.id), "Signal removed")}><Trash2 className="h-3.5 w-3.5" /></Button>}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
                {!data.signals.length && <p className="text-sm text-muted-foreground">No signals yet.</p>}
                {can("editLeads") && <AddSignal meta={meta} onAdd={(body) => act("signal", () => addRadarSignal(a.id, body), "Signal added")} busy={busy === "signal"} />}
              </TabsContent>

              <TabsContent value="dive" className="mt-4">
                {dive ? <DeepDive r={dive} hl={hl} can={can} onReview={(body) => act("review", () => reviewResearch(dive.id, body), body.action === "approve" ? "Deep dive approved" : body.action === "reject" ? "Deep dive rejected" : "Saved")} busy={busy === "review"} />
                  : <p className="text-sm text-muted-foreground">{queued ? "A deep dive is being drafted. It appears here for review when it's done." : "No deep dive yet. Request one above; it gathers the account's signals and fresh news and drafts a cited brief for review."}</p>}
                {data.research.filter((r) => r.status === "rejected" || r.status === "stale" || r.status === "failed").length > 0 && (
                  <p className="mt-4 text-[11px] text-muted-foreground">Older versions: {data.research.filter((r) => ["rejected", "stale", "failed"].includes(r.status)).map((r) => `v${r.version} ${r.status}`).join(", ")}</p>
                )}
              </TabsContent>

              <TabsContent value="contacts" className="mt-4 space-y-4">
                <Contacts account={a} contacts={data.contacts} enrollments={data.enrollments} sequences={sequences} can={can} busy={busy} act={act} />
              </TabsContent>

              <TabsContent value="website" className="mt-4">
                {data.leads.length ? (
                  <ul className="divide-y divide-line/5 rounded-xl border border-line/10 bg-card">
                    {data.leads.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                        <div className="min-w-0"><p className="truncate font-medium">{l.name || l.email}</p><p className="truncate text-xs text-muted-foreground">{[l.job_title, l.email].filter(Boolean).join(" · ")}</p></div>
                        <div className="flex items-center gap-2"><span className="font-mono text-xs tabular-nums">{Math.round(l.score || 0)}</span><StageBadge stage={l.stage} /></div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No website leads from this account yet. Leads link here automatically when their business email matches one of the account's domains.</p>}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <ul className="divide-y divide-line/5">
                  {[...(a.history || [])].reverse().map((h, i) => (
                    <li key={i} className="py-2 text-xs"><p className="text-foreground">{h.detail || h.action}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{fmtDateTime(h.at)} · {h.by}</p></li>
                  ))}
                  {!a.history?.length && <li className="py-2 text-xs text-muted-foreground">No changes yet.</li>}
                </ul>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AccountDetails({ account, onSave, busy }) {
  const [v, setV] = useState({ domains: (account.domains || []).join(", "), country: account.hq?.country || "", state: account.hq?.state || "", zip: account.hq?.zip || "", revenue_band: account.revenue_band || "", is_customer: !!account.is_customer, manual_exclusion: account.manual_exclusion || "" });
  return (
    <details className="rounded-xl border border-line/10 bg-card p-3 text-sm">
      <summary className="cursor-pointer text-xs uppercase tracking-[0.12em] text-muted-foreground">Account details, HQ and exclusions</summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input className={inputCls} placeholder="Web domains, comma separated" value={v.domains} onChange={(e) => setV({ ...v, domains: e.target.value })} />
        <Input className={inputCls} placeholder="Revenue band (e.g. $1B+)" value={v.revenue_band} onChange={(e) => setV({ ...v, revenue_band: e.target.value })} />
        <Input className={inputCls} placeholder="HQ country" value={v.country} onChange={(e) => setV({ ...v, country: e.target.value })} />
        <div className="flex gap-2"><Input className={inputCls} placeholder="HQ state" value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })} /><Input className={inputCls} placeholder="ZIP" value={v.zip} onChange={(e) => setV({ ...v, zip: e.target.value })} /></div>
        <Input className={cn(inputCls, "sm:col-span-2")} placeholder="Exclude from outreach because… (leave empty to allow)" value={v.manual_exclusion} onChange={(e) => setV({ ...v, manual_exclusion: e.target.value })} />
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={v.is_customer} onChange={(e) => setV({ ...v, is_customer: e.target.checked })} /> Existing customer (blocks automated outreach)</label>
      </div>
      <div className="mt-3 flex justify-end"><Button size="sm" disabled={busy} onClick={() => onSave({ domains: v.domains.split(",").map((d) => d.trim()).filter(Boolean), hq: { country: v.country, state: v.state, zip: v.zip }, revenue_band: v.revenue_band || null, is_customer: v.is_customer, manual_exclusion: v.manual_exclusion })}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Save details</Button></div>
    </details>
  );
}

function AddSignal({ meta, onAdd, busy }) {
  const [v, setV] = useState({ type: "linkedin", title: "", person: "", person_title: "", evidence_url: "", competitor_key: "" });
  return (
    <details className="rounded-xl border border-line/10 bg-card p-3 text-sm">
      <summary className="cursor-pointer text-xs uppercase tracking-[0.12em] text-muted-foreground">Log a signal by hand (e.g. a LinkedIn engager)</summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select className={selectCls} value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })}>{["linkedin", "news", "filing", "tender", "competitor_job", "problem_job"].map((t) => <option key={t} value={t}>{SIGNAL_LABELS[t]}</option>)}</select>
        <select className={selectCls} value={v.competitor_key} onChange={(e) => setV({ ...v, competitor_key: e.target.value })}><option value="">No competitor</option>{meta?.competitors?.map((c) => <option key={c.key} value={c.key}>{c.product}</option>)}</select>
        <Input className={cn(inputCls, "sm:col-span-2")} placeholder="What happened (e.g. 'Liked an OpenText post about InfoArchive')" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        {v.type === "linkedin" && <><Input className={inputCls} placeholder="Person" value={v.person} onChange={(e) => setV({ ...v, person: e.target.value })} /><Input className={inputCls} placeholder="Their title" value={v.person_title} onChange={(e) => setV({ ...v, person_title: e.target.value })} /></>}
        <Input className={cn(inputCls, "sm:col-span-2")} placeholder="Evidence link (https://…)" value={v.evidence_url} onChange={(e) => setV({ ...v, evidence_url: e.target.value })} />
      </div>
      <div className="mt-3 flex justify-end"><Button size="sm" disabled={busy || !v.title.trim()} onClick={() => onAdd({ ...v, competitor_key: v.competitor_key || null, evidence_url: v.evidence_url || null, person: v.person || null, person_title: v.person_title || null })}><Plus /> Add signal</Button></div>
    </details>
  );
}

function DeepDive({ r, hl, can, onReview, busy }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState({ headline: r.headline || "", summary: r.summary || "", trigger: r.trigger || "", why_solix_wins: r.why_solix_wins || "", subject: r.first_touch?.subject || "", body: r.first_touch?.body || "", score: r.score ?? 0 });
  const blocks = (r.checks || []).filter((c) => c.level === "block");
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]", r.status === "approved" ? "border-emerald-400/40 text-emerald-200" : "border-amber-400/40 text-amber-200")}>{r.status === "approved" ? `Approved by ${r.reviewed_by}` : "Draft, waiting for review"}</span>
        <span className="text-xs text-muted-foreground">Score {r.score}/10 · {r.verdict} · {fmtDate(r.created_at)} · {r.provider === "rules" ? "rules-based (no AI model)" : r.model || r.provider}</span>
      </div>
      {(r.checks || []).length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs">
          {r.checks.map((c, i) => <li key={i} className={c.level === "block" ? "text-red-300" : "text-amber-200"}>{c.level === "block" ? "Must fix: " : "Check: "}{c.message}</li>)}
        </ul>
      )}
      {edit ? (
        <div className="space-y-2">
          <Input className={inputCls} value={v.headline} onChange={(e) => setV({ ...v, headline: e.target.value })} placeholder="Headline" />
          <Textarea rows={4} className="border-line/15 bg-background text-sm" value={v.summary} onChange={(e) => setV({ ...v, summary: e.target.value })} placeholder="What we found (cite sources as [1])" />
          <Textarea rows={3} className="border-line/15 bg-background text-sm" value={v.trigger} onChange={(e) => setV({ ...v, trigger: e.target.value })} placeholder="Trigger" />
          <Textarea rows={3} className="border-line/15 bg-background text-sm" value={v.why_solix_wins} onChange={(e) => setV({ ...v, why_solix_wins: e.target.value })} placeholder="Why Solix wins" />
          <Input className={inputCls} value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} placeholder="First touch subject" />
          <Textarea rows={7} className="border-line/15 bg-background font-mono text-xs" value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Score <input type="number" min={0} max={10} value={v.score} onChange={(e) => setV({ ...v, score: Number(e.target.value) })} className={cn(selectCls, "h-8 w-20")} /></label>
          <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => { onReview({ action: "save", headline: v.headline, summary: v.summary, trigger: v.trigger, why_solix_wins: v.why_solix_wins, score: v.score, first_touch: { subject: v.subject, body: v.body } }); setEdit(false); }}>Save edits</Button><Button size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button></div>
        </div>
      ) : (
        <>
          {r.headline && <p className="border-l-2 border-emerald-400/60 pl-3 font-medium text-foreground"><Highlight text={r.headline} hl={hl} /></p>}
          {r.summary && <section><p className="eyebrow mb-1">What we found</p><p className="text-muted-foreground"><Highlight text={r.summary} hl={hl} /></p></section>}
          {r.trigger && <section><p className="eyebrow mb-1">Trigger</p><p className="text-muted-foreground"><Highlight text={r.trigger} hl={hl} /></p></section>}
          {r.why_solix_wins && <section><p className="eyebrow mb-1">Why Solix wins</p><p className="text-muted-foreground">{r.why_solix_wins}</p></section>}
          {(r.evidence || []).length > 0 && (
            <section><p className="eyebrow mb-1">Evidence</p>
              <ol className="space-y-1 text-xs">{r.evidence.map((e) => <li key={e.n}><span className="font-mono text-muted-foreground">[{e.n}]</span> {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">{e.title || e.url}</a> : e.title} {e.date && <span className="text-muted-foreground">({e.date})</span>}</li>)}</ol>
            </section>
          )}
          {(r.contacts || []).length > 0 && <section><p className="eyebrow mb-1">People to reach</p><ul className="text-xs">{r.contacts.map((c) => <li key={c.name}>{c.name} · <span className="text-muted-foreground">{c.title}</span></li>)}</ul></section>}
          {(r.first_touch?.subject || r.first_touch?.body) && (
            <section><p className="eyebrow mb-1">Suggested opener</p>
              <div className="rounded-xl border border-line/10 bg-card p-3"><p className="text-xs font-medium">Subject: {r.first_touch.subject}</p><pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">{r.first_touch.body}</pre></div>
            </section>
          )}
          {r.gaps && <section><p className="eyebrow mb-1">Still to confirm</p><p className="text-xs text-muted-foreground">{r.gaps}</p></section>}
        </>
      )}
      {can("editLeads") && !edit && (
        <div className="flex flex-wrap gap-2 border-t border-line/10 pt-3">
          {r.status === "draft" && <Button size="sm" disabled={busy || blocks.length > 0} onClick={() => onReview({ action: "approve" })} title={blocks.length ? "Fix the 'must fix' items first" : ""}><Check /> Approve</Button>}
          <Button size="sm" variant="outline" onClick={() => setEdit(true)}>Edit</Button>
          {r.status === "draft" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { const reason = window.prompt("Why reject this deep dive?"); if (reason !== null) onReview({ action: "reject", reason }); }}>Reject</Button>}
        </div>
      )}
      <RepRule />
    </div>
  );
}

function Contacts({ account, contacts, enrollments, sequences, can, busy, act }) {
  const [add, setAdd] = useState({ name: "", email: "", title: "", linkedin_url: "" });
  const [seq, setSeq] = useState("");
  const [gates, setGates] = useState({});
  const [promote, setPromote] = useState(null);

  useEffect(() => { if (!seq && sequences.length) setSeq(sequences.find((s) => s.active)?.id || ""); }, [sequences, seq]);
  const checkGate = async (c) => {
    try {
      setGates((g) => ({ ...g, [c.id]: { loading: true } }));
      const g = await fetchGate(c.id);
      setGates((x) => ({ ...x, [c.id]: g }));
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const active = (cid) => enrollments.find((e) => e.contact_id === cid && ["pending_approval", "scheduled", "active", "paused"].includes(e.status));

  return (
    <>
      {contacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts yet. Add the people from the deep dive, or anyone you know at {account.name}.</p>}
      <ul className="divide-y divide-line/5 rounded-xl border border-line/10 bg-card">
        {contacts.map((c) => {
          const e = active(c.id);
          const g = gates[c.id];
          return (
            <li key={c.id} className="p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{c.name} {c.persona === "target" && <span className="ml-1 text-[10px] uppercase tracking-[0.12em] text-teal">target persona</span>}</p>
                  <p className="text-xs text-muted-foreground">{c.title || "No title"} · {c.email || "no email"} <span className={EMAIL_TONE[c.email_status]}>({(c.email_status || "").replace("_", " ")})</span>{c.suppressed && <span className="text-red-300"> · suppressed ({c.suppressed})</span>}</p>
                  {e && <p className="mt-1 text-xs text-teal">In "{e.sequence_name}" · {e.status.replace("_", " ")} · step {e.step_index}/{e.steps?.length ?? "?"}</p>}
                </div>
                {can("editLeads") && (
                  <div className="flex flex-wrap gap-1">
                    {c.email ? <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy === `v${c.id}`} onClick={() => act(`v${c.id}`, () => verifyContact(c.id), (r) => `Email ${String(r.email_status).replace("_", " ")}`)}><MailCheck /> Verify</Button>
                      : <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy === `f${c.id}`} onClick={() => act(`f${c.id}`, () => findContactEmail(c.id), (r) => (r.found ? `Found ${r.found}` : "No verified address found"))}><Search /> Find email</Button>}
                    {c.email && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPromote({ email: c.email, name: c.name, job_title: c.title })}><UserPlus /> To lead</Button>}
                    {!e && c.email && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => checkGate(c)}><ShieldAlert /> Check gate</Button>}
                  </div>
                )}
              </div>
              {g && !g.loading && (
                <div className={cn("mt-2 rounded-lg border p-2 text-xs", g.ok ? "border-emerald-400/30 text-emerald-200" : "border-red-400/30 text-red-200")}>
                  {g.ok ? "Clear to enroll." : <>Blocked: {g.reasons.join("; ")}</>}
                  {g.warnings?.length > 0 && <p className="mt-1 text-amber-200">Note: {g.warnings.join("; ")}</p>}
                  {g.ok && can("editLeads") && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select className={cn(selectCls, "h-8 text-xs")} value={seq} onChange={(ev) => setSeq(ev.target.value)}>{sequences.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                      <Button size="sm" className="h-8 text-xs" disabled={!seq || busy === `e${c.id}`} onClick={() => act(`e${c.id}`, () => enrollContacts({ contact_ids: [c.id], sequence_id: seq }), (r) => (r.created.length ? "Enrolled; waiting in Outbound → Approvals" : `Blocked: ${(r.blocked[0]?.reasons || []).join("; ")}`))}><Send /> Enroll</Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {can("editLeads") && (
        <div className="rounded-xl border border-line/10 bg-card p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">Add a contact</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input className={inputCls} placeholder="Full name" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
            <Input className={inputCls} placeholder="Title" value={add.title} onChange={(e) => setAdd({ ...add, title: e.target.value })} />
            <Input className={inputCls} placeholder="Business email (optional)" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} />
            <Input className={inputCls} placeholder="LinkedIn URL (optional)" value={add.linkedin_url} onChange={(e) => setAdd({ ...add, linkedin_url: e.target.value })} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Where you found them is recorded for GDPR Art. 14. Business addresses only.</p>
          <div className="mt-2 flex justify-end"><Button size="sm" disabled={!add.name.trim() || busy === "addc"} onClick={async () => { const r = await act("addc", () => createContact({ ...add, email: add.email || null, linkedin_url: add.linkedin_url || null, company_id: account.id, source: "manual" }), "Contact added"); if (r) setAdd({ name: "", email: "", title: "", linkedin_url: "" }); }}><Plus /> Add</Button></div>
        </div>
      )}
      {promote && (
        <div className="rounded-xl border border-teal/30 bg-teal/5 p-3 text-sm">
          <p>Create an MQL lead for <b>{promote.name}</b> ({promote.email}) in the lead funnel, owned by {account.owner_name || "nobody yet"}?</p>
          <div className="mt-2 flex gap-2"><Button size="sm" onClick={async () => { await act("promote", () => promoteToLead(account.id, promote), "Lead created as MQL"); setPromote(null); }}>Create lead</Button><Button size="sm" variant="ghost" onClick={() => setPromote(null)}>Cancel</Button></div>
        </div>
      )}
    </>
  );
}
