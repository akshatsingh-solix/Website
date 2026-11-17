// Sol control panel (Admin > Conversations): who answers and how, what Sol knows,
// what it should learn next, and how it is performing on accuracy, latency,
// concurrency and consistency. API keys never reach this screen.
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpenCheck, Check, Globe, Loader2, Lock, Play, RefreshCw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge, Panel, StatTile, ago, inputCls, selectCls } from "@/components/admin/kit";
import { useAdmin } from "@/components/admin/AdminAuth";
import {
  addSolLearned, clearSolCache, deleteSolLearned, dismissSolGap, fetchSolConfig, fetchSolGaps, fetchSolInsights, fetchSolLearned,
  formatApiError, learnSolGap, patchSolLearned, reindexSol, researchSol, saveSolConfig, testSolProvider,
} from "@/lib/adminApi";

const fmtMs = (ms) => (ms == null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);
const Row = ({ label, help, children }) => (
  <div className="flex flex-col gap-2 border-t border-line/10 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

// ---------------------------------------------------------------- Control
export const SolControlTab = () => {
  const { user } = useAdmin();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [tests, setTests] = useState({});

  const apply = (d) => {
    setData(d);
    setCfg(d.config);
    setRows(d.providers.map((p) => ({ ...p, modelsText: (p.models || []).join(", ") })));
  };
  const load = useCallback(() => fetchSolConfig({ fresh: true }).then(apply).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  if (!cfg) return <Loader2 className="mx-auto my-10 h-5 w-5 animate-spin text-muted-foreground" />;

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i, d) => setRows((rs) => {
    const next = [...rs];
    const j = i + d;
    if (j < 0 || j >= next.length) return rs;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const save = async () => {
    setSaving(true);
    try {
      const routing = rows.map((r) => ({
        provider: r.provider, enabled: r.enabled, private: r.private,
        models: r.modelsText.split(",").map((m) => m.trim()).filter(Boolean),
        max_concurrency: r.max_concurrency ? Number(r.max_concurrency) : null,
      }));
      apply(await saveSolConfig({ ...cfg, routing }));
      toast.success("Sol settings saved. They apply to the next message.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (r) => {
    setTesting(r.provider);
    try {
      const model = r.modelsText.split(",").map((m) => m.trim()).filter(Boolean)[0] || r.default_models[0];
      const out = await testSolProvider({ provider: r.provider, model });
      setTests((t) => ({ ...t, [r.provider]: out }));
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setTesting(null);
    }
  };

  const health = (name) => (data.health || []).filter((h) => h.provider === name);

  return (
    <div className="space-y-6">
      <Panel title="Who answers, in what order" sub="Sol tries each switched-on provider top to bottom and moves to the next on a rate limit, outage, slow start or when it is full. Keys stay on the server."
        action={isAdmin && <Button size="sm" onClick={save} disabled={saving} data-testid="sol-save">{saving ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>}>
        <p className="mb-3 rounded-lg bg-muted/60 px-3 py-2 text-xs" data-testid="sol-chain">
          Answer chain now: <span className="font-mono">{data.answer_chain.length ? data.answer_chain.join(" → ") : "nothing switched on: Sol uses its built-in script"}</span>
        </p>
        <ol className="space-y-2">
          {rows.map((r, i) => {
            const h = health(r.provider);
            const t = tests[r.provider];
            return (
              <li key={r.provider} className={cn("rounded-xl border px-4 py-3", r.enabled ? "border-line/15" : "border-line/10 opacity-70")} data-testid="sol-provider-row">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-6 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className="min-w-[7rem] font-medium">{r.provider}</span>
                  {r.private ? <Badge className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400"><Lock className="mr-1 inline h-3 w-3" />private</Badge>
                    : <Badge className="border-amber-500/30 text-amber-700 dark:text-amber-400">may train on prompts</Badge>}
                  {!r.placed && <Badge>new: switched off until saved</Badge>}
                  <span className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" aria-label="Move up" disabled={!isAdmin || i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="sm" aria-label="Move down" disabled={!isAdmin || i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                    <Switch checked={r.enabled} disabled={!isAdmin} onCheckedChange={(v) => setRow(i, { enabled: v })} aria-label={`Use ${r.provider}`} />
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <Input value={r.modelsText} disabled={!isAdmin} onChange={(e) => setRow(i, { modelsText: e.target.value })}
                    placeholder={r.default_models.join(", ")} className={cn(inputCls, "font-mono text-xs")} aria-label="Models, in order" />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Private <Switch checked={r.private} disabled={!isAdmin} onCheckedChange={(v) => setRow(i, { private: v })} />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    At once
                    <Input type="number" min={1} max={500} value={r.max_concurrency || ""} disabled={!isAdmin} placeholder="∞"
                      onChange={(e) => setRow(i, { max_concurrency: e.target.value })} className={cn(inputCls, "h-8 w-16 text-xs")} />
                  </label>
                  {isAdmin && <Button variant="outline" size="sm" onClick={() => runTest(r)} disabled={testing === r.provider}>
                    {testing === r.provider ? <Loader2 className="animate-spin" /> : <Play />} Test</Button>}
                </div>
                {h.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {h.map((x) => `${x.model}: ${x.ok} ok, ${x.failed} failed, first token ${fmtMs(x.ttft_ms)}${x.resting_seconds ? `, resting ${x.resting_seconds}s` : ""}${x.last_error ? ` (last error: ${x.last_error.slice(0, 80)})` : ""}`).join(" · ")}
                  </p>
                )}
                {t && (
                  <div className={cn("mt-2 rounded-lg px-3 py-2 text-xs", t.ok ? "bg-emerald-500/5" : "bg-red-500/5")}>
                    {t.ok ? <><strong>{t.model}</strong> · first token {fmtMs(t.first_token_ms)} · total {fmtMs(t.total_ms)}<p className="mt-1 whitespace-pre-wrap">{t.reply}</p></>
                      : <>Failed after {fmtMs(t.total_ms)}: {t.error}</>}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {data.not_configured.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            To add a provider, set its variable on the backend service: {data.not_configured.map((n) => <span key={n.provider} className="mr-2 inline-block font-mono">{n.provider}: {n.env}</span>)}
          </p>
        )}
      </Panel>

      <Panel title="How Sol behaves" sub="Applies to the next message. Lower temperature gives steadier, more consistent answers.">
        <Row label="AI answers on" help="Off: Sol answers with its built-in script and still captures leads."><Switch checked={cfg.enabled} disabled={!isAdmin} onCheckedChange={(v) => set("enabled", v)} /></Row>
        <Row label="Privacy mode" help="Private only: chats go only to providers marked private (your local model, your own endpoint, OpenAI API).">
          <select className={selectCls} value={cfg.privacy_mode} disabled={!isAdmin} onChange={(e) => set("privacy_mode", e.target.value)}>
            <option value="any">Any switched-on provider</option><option value="private_only">Private providers only</option>
          </select>
        </Row>
        <Row label={`Temperature: ${cfg.temperature}`} help="0.2–0.4 for consistency, 0.6+ for more varied wording.">
          <input type="range" min={0} max={1.2} step={0.05} value={cfg.temperature} disabled={!isAdmin} onChange={(e) => set("temperature", Number(e.target.value))} className="w-48" />
        </Row>
        <Row label="Longest answer (tokens)" help="Caps cost and latency per reply."><Input type="number" min={150} max={2000} value={cfg.max_output_tokens} disabled={!isAdmin} onChange={(e) => set("max_output_tokens", Number(e.target.value))} className={cn(inputCls, "w-28")} /></Row>
        <Row label="Move on after (seconds)" help="A provider that hasn't started answering by then is skipped for the next one."><Input type="number" min={3} max={60} value={cfg.first_token_timeout} disabled={!isAdmin} onChange={(e) => set("first_token_timeout", Number(e.target.value))} className={cn(inputCls, "w-28")} /></Row>
        <Row label="Answer cache" help="Opening questions already answered are served instantly, free and identically.">
          <span className="flex items-center gap-3">
            <Input type="number" min={1} max={720} value={cfg.cache_hours} disabled={!isAdmin || !cfg.answer_cache} onChange={(e) => set("cache_hours", Number(e.target.value))} className={cn(inputCls, "w-20")} aria-label="Hours" />
            <span className="text-xs text-muted-foreground">hours</span>
            <Switch checked={cfg.answer_cache} disabled={!isAdmin} onCheckedChange={(v) => set("answer_cache", v)} />
            {isAdmin && <Button variant="ghost" size="sm" onClick={() => clearSolCache().then((r) => toast.success(`Cleared ${r.cleared} cached answers.`)).catch((e) => toast.error(formatApiError(e)))}>Clear</Button>}
          </span>
        </Row>
        <Row label="Learn from conversations" help="Questions the site can't answer well go to Knowledge → Gaps for you to approve."><Switch checked={cfg.learning} disabled={!isAdmin} onCheckedChange={(v) => set("learning", v)} /></Row>
        <Row label="Block coding and free-AI use" help="Code requests, jailbreaks, key or model probes and essay-style requests get a polite refusal without calling any model."><Switch checked={cfg.block_code} disabled={!isAdmin} onCheckedChange={(v) => set("block_code", v)} /></Row>
        <Row label="Messages per visitor per day" help="Protects your quotas from scripted abuse."><Input type="number" min={10} max={5000} value={cfg.daily_ip_limit} disabled={!isAdmin} onChange={(e) => set("daily_ip_limit", Number(e.target.value))} className={cn(inputCls, "w-28")} /></Row>
        <div className="border-t border-line/10 pt-3">
          <p className="text-sm font-medium">Playbook</p>
          <p className="mb-2 text-xs text-muted-foreground">Standing instructions Sol follows, e.g. "This quarter, lead with the SAP ECC retirement assessment offer."</p>
          <Textarea value={cfg.playbook} maxLength={2000} rows={4} disabled={!isAdmin} onChange={(e) => set("playbook", e.target.value)} />
        </div>
        {isAdmin && <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button></div>}
      </Panel>
    </div>
  );
};

// ---------------------------------------------------------------- Knowledge
const LearnForm = ({ initial, onSave, onCancel, saving }) => {
  const [f, setF] = useState(initial);
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <Input value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} placeholder="Question" className={inputCls} />
      <Textarea value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} rows={5} placeholder="The approved answer Sol should give" />
      <Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="Page to link (optional), e.g. /products/application-retirement" className={cn(inputCls, "font-mono text-xs")} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={saving || f.answer.trim().length < 10 || f.question.trim().length < 3} onClick={() => onSave(f)}>
          {saving ? <Loader2 className="animate-spin" /> : <Check />} Teach Sol</Button>
      </div>
    </div>
  );
};

export const SolKnowledgeTab = () => {
  const { user } = useAdmin();
  const canTeach = ["admin", "editor"].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [gaps, setGaps] = useState(null);
  const [learned, setLearned] = useState(null);
  const [open, setOpen] = useState(null); // gap id, "new", or `research`
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [researchQ, setResearchQ] = useState("");
  const [research, setResearch] = useState(null);

  const load = useCallback(() => Promise.all([
    fetchSolConfig({ fresh: true }).then((d) => setStats(d.knowledge)),
    fetchSolGaps().then(setGaps),
    fetchSolLearned().then(setLearned),
  ]).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const teach = async (f, gapId) => {
    setBusy(true);
    try {
      if (gapId) await learnSolGap(gapId, f); else await addSolLearned(f);
      toast.success("Sol knows this from the next message on.");
      setOpen(null); setDraft(null); setResearch(null);
      await load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const doResearch = async (question, gapId) => {
    setBusy(true);
    setResearch({ question, gapId, loading: true });
    try {
      const r = await researchSol({ question, gap_id: gapId || null });
      setResearch({ ...r, gapId });
      if (r.error) toast.warning(r.error);
    } catch (e) {
      toast.error(formatApiError(e));
      setResearch(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="sol-knowledge-stats">
          <StatTile label="Pages and items Sol knows" value={stats.documents} sub={`${stats.chunks} searchable passages`} />
          <StatTile label="Published CMS items" value={stats.cms_items} sub="incl. imported content and lead magnets" />
          <StatTile label="Site pages (built-in)" value={stats.site_chunks} sub="passages from the website build" />
          <StatTile label="Learned answers" value={stats.learned} sub={stats.built_at ? `rebuilt ${ago(stats.built_at)}` : ""} />
        </div>
      )}
      {canTeach && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => reindexSol().then((s) => { setStats(s); toast.success(`Reloaded: ${s.documents} items, ${s.chunks} passages.`); }).catch((e) => toast.error(formatApiError(e)))}><RefreshCw /> Reload knowledge now</Button>
          <Button variant="outline" size="sm" onClick={() => { setOpen("new"); setDraft({ question: "", answer: "", url: "" }); }}><BookOpenCheck /> Teach an answer</Button>
        </div>
      )}
      {open === "new" && draft && <LearnForm initial={draft} saving={busy} onCancel={() => setOpen(null)} onSave={(f) => teach(f)} />}

      {canTeach && (
        <Panel title="Research the web (admin only)" sub="Visitors never trigger web search. Look something up here, review the draft and its sources, then teach Sol only what you approve.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={researchQ} onChange={(e) => setResearchQ(e.target.value)} placeholder="e.g. What changed in the EU AI Act for general-purpose models?" className={inputCls} />
            <Button disabled={busy || researchQ.trim().length < 3} onClick={() => doResearch(researchQ.trim())}>{busy && research?.loading ? <Loader2 className="animate-spin" /> : <Globe />} Research</Button>
          </div>
          {research && !research.loading && !research.gapId && <ResearchResult r={research} busy={busy} onTeach={(f) => teach(f, null)} onClose={() => setResearch(null)} />}
        </Panel>
      )}

      <Panel title="Knowledge gaps" sub="Questions visitors asked that the site's content didn't answer well, most asked first. Approve an answer and Sol uses it from then on.">
        {!gaps ? <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-muted-foreground" /> : !gaps.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No open gaps. Sol had good material for every question so far.</p>
        ) : (
          <ul className="divide-y divide-line/10" data-testid="sol-gaps">
            {gaps.map((g) => (
              <li key={g.id} className="py-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{g.question}</p>
                    <p className="text-xs text-muted-foreground">asked {g.count}× · last {ago(g.last_at)} · match score {g.top_score}</p>
                  </div>
                  {canTeach && (
                    <span className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setOpen(g.id); setDraft({ question: g.question, answer: g.sample_answer || "", url: "" }); }}><Check /> Approve / edit</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => doResearch(g.question, g.id)}><Globe /> Research</Button>
                      <Button size="sm" variant="ghost" aria-label="Dismiss" onClick={() => dismissSolGap(g.id).then(load).catch((e) => toast.error(formatApiError(e)))}><X /></Button>
                    </span>
                  )}
                </div>
                {open === g.id && draft && <LearnForm initial={draft} saving={busy} onCancel={() => setOpen(null)} onSave={(f) => teach(f, g.id)} />}
                {research?.gapId === g.id && (research.loading ? <Loader2 className="mt-2 h-4 w-4 animate-spin" /> :
                  <ResearchResult r={research} busy={busy} onTeach={(f) => teach(f, g.id)} onClose={() => setResearch(null)} />)}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Learned answers" sub="Approved answers Sol uses alongside the website. Switch one off to stop using it.">
        {!learned ? <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-muted-foreground" /> : !learned.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing learned yet.</p>
        ) : (
          <ul className="divide-y divide-line/10">
            {learned.map((l) => (
              <li key={l.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{l.question}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{l.answer}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{l.url && <span className="mr-2 font-mono">{l.url}</span>}by {l.created_by} · {ago(l.created_at)}</p>
                </div>
                {canTeach && (
                  <span className="flex items-center gap-2">
                    <Switch checked={l.active !== false} onCheckedChange={(v) => patchSolLearned(l.id, { active: v }).then(load).catch((e) => toast.error(formatApiError(e)))} aria-label="Use this answer" />
                    <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => window.confirm("Delete this learned answer?") && deleteSolLearned(l.id).then(load).catch((e) => toast.error(formatApiError(e)))}><Trash2 /></Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

const ResearchResult = ({ r, busy, onTeach, onClose }) => (
  <div className="mt-3 rounded-xl border border-line/15 p-3 text-sm">
    <p className="mb-2 text-xs text-muted-foreground">Draft from {r.sources.length} web source{r.sources.length === 1 ? "" : "s"} and the site. Check it before teaching Sol; nothing is learned until you approve.</p>
    <ul className="mb-3 space-y-1 text-xs">
      {r.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-ink underline">{s.title || s.url}</a></li>)}
    </ul>
    <LearnForm initial={{ question: r.question, answer: r.draft || "", url: r.suggested_url || "" }} saving={busy} onCancel={onClose} onSave={onTeach} />
  </div>
);

// ---------------------------------------------------------------- Quality
export const SolQualityTab = () => {
  const [days, setDays] = useState(7);
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); fetchSolInsights(days).then(setD).catch((e) => toast.error(formatApiError(e))); }, [days]);
  if (!d) return <Loader2 className="mx-auto my-10 h-5 w-5 animate-spin text-muted-foreground" />;
  const blocked = Object.entries(d.by_source).filter(([k]) => k.startsWith("guard:")).reduce((n, [, v]) => n + v, 0);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <select className={selectCls} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[1, 7, 30, 90].map((n) => <option key={n} value={n}>Last {n} day{n > 1 ? "s" : ""}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Answers" value={d.answers} sub={`${d.by_source.cache || 0} from cache (free)`} />
        <StatTile label="Latency p50 / p95" value={fmtMs(d.latency_ms.p50)} sub={`p95 ${fmtMs(d.latency_ms.p95)}, full answer`} />
        <StatTile label="Grounded in Solix content" value={d.grounded_share == null ? "—" : `${Math.round(d.grounded_share * 100)}%`} sub={`${d.open_gaps} open gaps to review`} />
        <StatTile label="Abuse blocked" value={blocked} sub="coding, jailbreaks, key probes" />
      </div>
      <Panel title="Who answered" sub="Provider and model per answer; guard rows are blocked messages that never reached a model.">
        <ul className="space-y-1 text-sm">
          {Object.entries(d.by_source).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4"><span className="font-mono text-xs">{k}</span><span>{v}</span></li>
          ))}
        </ul>
      </Panel>
      <p className="text-xs text-muted-foreground">
        For a full accuracy, latency, concurrency and consistency run, use <span className="font-mono">python3 evals/sol_eval.py --url &lt;backend&gt;</span> in the backend repository.
      </p>
    </div>
  );
};
