import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Eye, FileSpreadsheet, Loader2, Play, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportRadarWorkbook, fetchRadarAccount, fetchRadarAccounts, fetchRadarMeta, fetchRadarReps, fetchRadarSummary, fetchResearchQueue, formatApiError, markRadarSeen, runRadar } from "@/lib/adminApi";
import { buildBrief, saveBrief } from "@/lib/radarBrief";
import { Panel, ago, fmtDate, selectCls, useCan, useLiveRefresh } from "@/components/admin/kit";
import { AccountStatus, BASIS_LABELS, DiveBadge, FreshTag, NextStep, RepRule, SIGNAL_LABELS, STATUS_LABELS, STRENGTHS, STRENGTH_COLOR, Sparkline, StrengthBadge } from "@/components/admin/radarKit";
import { RadarScope } from "@/components/admin/RadarScope";
import { AccountDrawer } from "@/components/admin/AccountDrawer";
import { RadarSetup } from "@/components/admin/RadarSetup";

const PAGE = 40;
const FILTERS = ["q", "competitor", "strength", "country", "state", "territory", "owner", "status", "line", "ready_only"];
const TABS = [
  ["all", "All accounts"], ["new", "New for you"], ["todo", "To do"], ["territory", "By territory"], ["reps", "Reps"], ["ready", "Ready"], ["dives", "Deep dives"], ["review", "Review"],
  ["jobs", "Competitor jobs"], ["problems", "Problem signals"], ["dns", "DNS"], ["news", "Filings & news"], ["tenders", "Tenders"], ["website", "Website intent"],
  ["surge", "Surging"], ["excluded", "Excluded"], ["setup", "Setup"],
];
const TAB_HINT = {
  all: "Strongest first. Open an account to see every signal, the deep dive, contacts and history.",
  new: "Accounts you haven't opened yet, plus ones with new signals since you last looked. Opening an account or downloading its brief marks it seen.",
  todo: "Accounts with a next step waiting: book the meeting, assign an owner, review a deep dive, act on a surge, add people, start outreach, or request or refresh a deep dive.",
  ready: "Approved deep dives scoring 6 or more, with no exclusion. These are the ones to work today.",
  dives: "Accounts with a Master Prospector deep dive, highest score first.",
  jobs: "Postings that name a competitor product. Hiring someone to run the tool means it's installed, and often painful.",
  problems: "Postings about archiving, retention or retirement work with no competitor named.",
  surge: "Three or more new signals in the last seven days.",
  excluded: "Existing customers, accounts in a live deal, or excluded by hand. They stay visible but never get automated outreach.",
  website: "Accounts whose people are also on the website (matched by email domain).",
};

export default function AdminRadar() {
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(PAGE);
  const [search, setSearch] = useState(params.get("q") || "");
  const [review, setReview] = useState([]);
  const [reps, setReps] = useState(null);
  const [busy, setBusy] = useState(null);

  const tab = params.get("tab") || "all";
  const openId = params.get("account");
  const filters = useMemo(() => Object.fromEntries(FILTERS.map((k) => [k, params.get(k) || ""]).filter(([, v]) => v)), [params]);
  const setParam = useCallback((patch) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v === "" || v == null ? next.delete(k) : next.set(k, v)));
    return next;
  }), [setParams]);

  useEffect(() => { fetchRadarMeta().then(setMeta).catch((e) => toast.error(formatApiError(e))); }, []);
  useEffect(() => {
    const t = setTimeout(() => (search.trim() !== (params.get("q") || "") ? setParam({ q: search.trim() }) : null), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const listTab = ["territory", "reps", "setup", "review"].includes(tab) ? "all" : tab;
      const [s, list] = await Promise.all([
        fetchRadarSummary(filters, { fresh: silent }),
        fetchRadarAccounts({ ...filters, tab: listTab, page_size: 500, sort: tab === "dives" ? "dives" : "strength" }, { fresh: silent }),
      ]);
      setSummary(s);
      setData(list);
      if (tab === "review") setReview(await fetchResearchQueue("draft"));
      if (tab === "reps") setReps(await fetchRadarReps(30));
    } catch (e) {
      if (!silent) toast.error(formatApiError(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters, tab]);
  useEffect(() => { load(); setLimit(PAGE); }, [load]);
  useLiveRefresh(() => load({ silent: true }), 30000);

  const openAccount = (id) => {
    setParam({ account: id });
    markRadarSeen({ ids: [id] }).catch(() => {});
  };
  const markAll = async () => {
    await markRadarSeen({ all: true });
    toast.success("Everything marked as seen");
    load({ silent: true });
  };
  const runNow = async () => {
    setBusy("run");
    try {
      await runRadar(["collect", "score", "research"]);
      toast.success("Radar run started. New signals appear here as they land (a few minutes).");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };
  const repBrief = async (owner, label) => {
    const ids = data.items.filter((a) => a.owner === owner).slice(0, 60).map((a) => a.id);
    if (!ids.length) return toast.error("No accounts for this rep with the current filters.");
    setBusy(`brief:${owner}`);
    try {
      const details = [];
      for (const id of ids) details.push(await fetchRadarAccount(id));
      const strong = details.filter((d) => d.account.strength === "Strong").length;
      const blob = await buildBrief(details, { terms: meta?.highlight, summaryTitle: `${label}'s leads`, subtitle: `${details.length} accounts, ${strong} strong, ${details.filter((d) => d.account.research_id).length} with a deep dive.`, footer: `${label}'s leads` });
      saveBrief(blob, `Leads brief - ${label} - ${new Date().toISOString().slice(0, 10)}`);
      await markRadarSeen({ ids });
    } catch (e) {
      toast.error(`Couldn't build the brief: ${formatApiError(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const items = data.items;
  const trendFor = (product) => summary?.trend?.series?.find((x) => x.product === product)?.counts;
  const rep = filters.owner;
  const repName = meta?.team?.find((m) => m.email === rep)?.name || rep;
  const ownerOptions = meta?.team || [];

  const sel = (k, label, options) => (
    <select value={filters[k] || ""} onChange={(e) => setParam({ [k]: e.target.value })} className={cn(selectCls, "h-9 text-xs")} aria-label={label}>
      <option value="">{label}</option>
      {options}
    </select>
  );

  return (
    <div data-testid="admin-radar-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Radar</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Every account with a live competitive signal.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Competitor job postings, problem signals, DNS fingerprints, filings, tenders and website intent, scored, routed to the right rep and researched.
            {summary?.last_run && <> Last run {ago(summary.last_run.started_at)} ({summary.last_run.status}).</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("manage") && <Button variant="outline" size="sm" onClick={runNow} disabled={busy === "run"}>{busy === "run" ? <Loader2 className="animate-spin" /> : <Play />} Run now</Button>}
          {can("manage") && (
            <Button variant="outline" size="sm" data-testid="radar-setup-button" onClick={() => { setParam({ tab: "setup" }); requestAnimationFrame(() => document.getElementById("radar-views")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>
              <SlidersHorizontal /> Setup
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => exportRadarWorkbook(rep).catch((e) => toast.error(formatApiError(e)))}><FileSpreadsheet /> Excel</Button>
          <Button variant="ghost" size="sm" onClick={() => load()}><RefreshCw /> Refresh</Button>
        </div>
      </div>

      {/* What's new for this viewer */}
      {summary && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/5 px-4 py-3 text-sm" data-testid="radar-fresh">
          <p>
            {summary.first_visit ? <><b>First time here.</b> Everything is marked new. Open an account or download its brief and it counts as seen.</>
              : summary.fresh.new + summary.fresh.updated === 0 ? <><b>You're caught up.</b> No new accounts since you last looked.</>
                : <><b>{summary.fresh.new} new</b>{summary.fresh.updated ? <> and <b>{summary.fresh.updated} updated</b></> : null} since you last looked.{summary.new_today ? ` ${summary.new_today} signals arrived today.` : ""}</>}
            {summary.last_visit && <span className="ml-2 text-xs text-muted-foreground">Last visit {ago(summary.last_visit)}</span>}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant={tab === "new" ? "default" : "outline"} onClick={() => setParam({ tab: tab === "new" ? "" : "new" })}>{tab === "new" ? "Showing only new" : "Show only new"}</Button>
            <Button size="sm" variant="ghost" onClick={markAll}><Eye /> Mark all as seen</Button>
          </div>
        </div>
      )}

      {/* Rep bar */}
      <div className={cn("mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3", rep ? "border-teal/40 bg-teal/5" : "border-line/10 bg-card/60")} data-testid="radar-repbar">
        <span className="text-sm font-medium">Pick your rep</span>
        <select value={rep || ""} onChange={(e) => setParam({ owner: e.target.value })} className={cn(selectCls, "h-9 text-sm")} aria-label="Rep">
          <option value="">All reps</option>
          <option value="unassigned">Unassigned</option>
          {ownerOptions.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{rep ? `Showing ${repName}'s accounts and territory${meta?.rep_patch?.[repName] ? ` (${meta.rep_patch[repName]})` : ""}.` : "to see only your accounts and territory"}</span>
        {rep && rep !== "unassigned" && (
          <Button size="sm" variant="outline" className="ml-auto" disabled={busy === `brief:${rep}`} onClick={() => repBrief(rep, repName)}>
            {busy === `brief:${rep}` ? <Loader2 className="animate-spin" /> : <Download />} Download all {items.length} of {String(repName).split(" ")[0]}'s leads in one brief
          </Button>
        )}
      </div>

      {/* Scope + tiles */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Panel title="Radar" sub="Rings by strength · size by signals · glow = deep dive 6+ · blue ring = new for you" className="lg:col-span-5">
          <div className="grid place-items-center">{summary ? <RadarScope points={summary.scope} selected={openId} onSelect={openAccount} /> : <Loader2 className="my-24 h-6 w-6 animate-spin text-primary-ink" />}</div>
        </Panel>
        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STRENGTHS.slice(0, 3).map((s) => (
              <button key={s} type="button" onClick={() => setParam({ strength: filters.strength === s ? "" : s })} className={cn("rounded-2xl border bg-card p-4 text-left transition-colors", filters.strength === s ? "border-primary" : "border-line/10 hover:border-line/30")}>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><i className="inline-block h-2 w-2 rounded-full" style={{ background: STRENGTH_COLOR[s] }} />{s} accounts</p>
                <p className="mt-2 font-display text-3xl tabular-nums">{summary?.by_strength?.[s] ?? "—"}</p>
              </button>
            ))}
            <button type="button" onClick={() => setParam({ tab: tab === "ready" ? "" : "ready" })} className={cn("rounded-2xl border bg-card p-4 text-left", tab === "ready" ? "border-emerald-400" : "border-line/10 hover:border-line/30")} title="Approved deep dives scoring 6 or higher">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ready for outreach</p>
              <p className="mt-2 font-display text-3xl tabular-nums text-emerald-300">{summary?.ready ?? "—"}<span className="ml-1 text-sm text-muted-foreground">of {summary?.deep_dives ?? 0}</span></p>
            </button>
            <button type="button" onClick={() => setParam({ tab: tab === "surge" ? "" : "surge" })} className={cn("rounded-2xl border bg-card p-4 text-left", tab === "surge" ? "border-red-400" : "border-line/10 hover:border-line/30")}>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Surging (3+ in 7 days)</p>
              <p className="mt-2 font-display text-3xl tabular-nums">{summary?.surging ?? "—"}</p>
            </button>
            <button type="button" onClick={() => setParam({ owner: rep === "unassigned" ? "" : "unassigned" })} className={cn("rounded-2xl border bg-card p-4 text-left", rep === "unassigned" ? "border-amber-400" : "border-line/10 hover:border-line/30")}>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Unassigned</p>
              <p className="mt-2 font-display text-3xl tabular-nums">{summary?.unassigned ?? "—"}</p>
            </button>
          </div>
          {summary && (
            <p className="text-sm text-muted-foreground"><b className="text-foreground">{summary.accounts} accounts</b> with a signal, <b className="text-foreground">{summary.signals} signals</b> in all. {summary.multi_signal ? <><b className="text-foreground">{summary.multi_signal}</b> with more than one kind of signal. </> : null}{summary.excluded ? `${summary.excluded} excluded from outreach.` : ""}</p>
          )}
          <Panel title="Signals by competitor">
            <div className="space-y-2">
              {(summary?.competitors || []).map((c) => {
                const max = Math.max(1, ...summary.competitors.map((x) => x.signals));
                const key = meta?.competitors?.find((m) => m.product === c.product)?.key;
                return (
                  <button key={c.product} type="button" onClick={() => key && setParam({ competitor: filters.competitor === key ? "" : key })} className={cn("grid w-full grid-cols-[minmax(110px,180px)_1fr_auto] items-center gap-3 text-left text-sm", filters.competitor === key && "text-teal")}>
                    <span className="truncate">{c.product}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-line/10"><span className="block h-full rounded-full bg-red-400/80" style={{ width: `${(c.signals / max) * 100}%` }} /></span>
                    <span className="flex items-center justify-end gap-2 font-mono text-xs tabular-nums">
                      {trendFor(c.product) && <Sparkline counts={trendFor(c.product)} className="hidden text-red-300/80 sm:block" />}{c.signals}
                    </span>
                  </button>
                );
              })}
              {summary && !summary.competitors.length && <p className="text-sm text-muted-foreground">Nothing to show for these filters.</p>}
              {summary?.trend?.series?.length > 0 && <p className="pt-1 text-[11px] text-muted-foreground">Lines show new signals per week over the last 12 weeks.</p>}
            </div>
          </Panel>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line/10 bg-card/60 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, job title, person, place, competitor, rep…" className="h-9 border-line/15 bg-background pl-9 text-sm" data-testid="radar-search" />
        </div>
        {sel("competitor", "All competitors", meta?.competitors?.map((c) => <option key={c.key} value={c.key}>{c.product}</option>))}
        {sel("strength", "All strengths", STRENGTHS.map((s) => <option key={s} value={s}>{s}</option>))}
        {sel("country", "All countries", meta?.countries?.map((c) => <option key={c} value={c}>{c}</option>))}
        {sel("state", "All states", meta?.states?.map((s) => <option key={s} value={s}>{s}</option>))}
        {sel("territory", "All territories", meta?.territories?.map((t) => <option key={t} value={t}>{t}</option>))}
        {sel("status", "All statuses", Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>))}
        {Object.keys(filters).length > 0 && <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setParams(new URLSearchParams(tab !== "all" ? { tab } : {})); }}>Clear filters</Button>}
      </div>

      {/* Tabs */}
      {/* Wraps on wider screens so no view (Setup is last) hides off the right edge; scrolls sideways on phones. */}
      <nav id="radar-views" className="mt-4 flex scroll-mt-20 gap-1 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Radar views">
        {TABS.filter(([k]) => k !== "setup" || can("manage")).map(([k, label]) => {
          const count = k === "all" || k === "territory" ? summary?.accounts : ["review", "reps"].includes(k) ? undefined : summary?.tabs?.[k];
          return (
            <button key={k} type="button" onClick={() => setParam({ tab: k === "all" ? "" : k })} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs", tab === k ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:text-foreground")}>
              {label}{count !== undefined && <span className={cn("font-mono tabular-nums", k === "new" && count > 0 && tab !== k ? "text-sky-300" : "opacity-70")}>{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-4">
        {tab === "setup" ? <RadarSetup meta={meta} onChanged={() => load({ silent: true })} />
          : tab === "territory" ? (
            <div className="space-y-5">
              {summary?.territories?.map((t) => (
                <Panel key={t.territory} title={t.territory} sub={`${t.accounts} accounts, ${t.strong} strong`}>
                  <ul className="divide-y divide-line/5">
                    {t.reps.map((r) => (
                      <li key={r.rep} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <button type="button" className="text-left hover:text-teal" onClick={() => r.owner && setParam({ owner: r.owner, tab: "" })}>{r.rep}</button>
                        <span className="flex items-center gap-3 text-xs text-muted-foreground">{r.accounts} accounts, {r.strong} strong
                          {r.owner && <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy === `brief:${r.owner}`} onClick={() => repBrief(r.owner, r.rep)}>{busy === `brief:${r.owner}` ? <Loader2 className="animate-spin" /> : <Download />} Brief</Button>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
          ) : tab === "reps" ? (
            <RepScorecard rows={reps} patch={meta?.rep_patch} onPick={(owner) => setParam({ owner, tab: "" })} />
          ) : tab === "review" ? (
            <Panel title="Deep dives waiting for review" sub="Drafts never mark an account ready. Open one, check the sources, then approve, edit or reject.">
              {review.length ? (
                <ul className="divide-y divide-line/5">
                  {review.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openAccount(r.company_id)}>
                        <span className="font-medium">{r.company}</span> <span className="text-muted-foreground">· score {r.score}/10 · {r.verdict} · {r.provider === "rules" ? "rules-based" : r.model}</span>
                        {(r.checks || []).some((c) => c.level === "block") && <span className="ml-2 text-xs text-red-300">needs fixes</span>}
                      </button>
                      <span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nothing waiting. New drafts appear after each run or when someone requests a deep dive.</p>}
            </Panel>
          ) : (
            <>
              {TAB_HINT[tab] && <p className="mb-3 text-xs text-muted-foreground">{TAB_HINT[tab]}</p>}
              {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>
                : items.length === 0 ? <p className="rounded-2xl border border-line/10 bg-card p-6 text-sm text-muted-foreground">{tab === "new" ? "You're caught up. Nothing new since you last looked." : "No accounts match these filters."}</p>
                  : (
                    <ul className="space-y-2" data-testid="radar-accounts">
                      {items.slice(0, limit).map((a) => (
                        <li key={a.id}>
                          <button type="button" onClick={() => openAccount(a.id)} className={cn("grid w-full gap-2 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-line/30 sm:grid-cols-[1fr_auto]", a.fresh !== "seen" ? "border-sky-400/25" : "border-line/10")}>
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2"><span className="font-medium text-foreground">{a.name}</span><StrengthBadge strength={a.strength} /><FreshTag fresh={a.fresh} /><DiveBadge score={a.research_score} verdictClass={a.verdict_class} />{a.surge && <span className="text-[11px] text-red-300">Surging</span>}<NextStep action={a.next_action} /></p>
                              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {(a.signal_types || []).map((t) => <span key={t}>{SIGNAL_LABELS[t] || t}</span>)}
                                {(a.competitors || []).length > 0 && <span className="text-red-300/90">{a.competitors.join(", ")}</span>}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:justify-end">
                              <span>Latest {a.latest_signal_at ? fmtDate(a.latest_signal_at) : "—"}</span>
                              <span className={cn(!a.owner && "text-amber-300")}>{a.owner_name || "Unassigned"}{a.route_basis === "needs_routing" ? " · needs routing" : a.owner_basis && a.owner_basis !== "manual" ? ` · ${BASIS_LABELS[a.owner_basis] || ""}` : ""}</span>
                              <span className="font-mono tabular-nums text-foreground">{Math.round(a.score || 0)}</span>
                              <AccountStatus status={a.status} />
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              {items.length > limit && <div className="mt-3 text-center"><Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, items.length - limit)} more of {items.length} accounts</Button></div>}
              <RepRule className="mt-6" />
            </>
          )}
      </div>

      <AccountDrawer id={openId} meta={meta} onClose={() => setParam({ account: "" })} onChanged={() => load({ silent: true })} />
    </div>
  );
}

// Per rep: their accounts, what's hot and waiting, how far accounts got, and outbound activity (last 30 days).
function RepScorecard({ rows, patch, onPick }) {
  if (!rows) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>;
  const cols = [["accounts", "Accounts"], ["strong", "Strong"], ["surging", "Surging"], ["new_7d", "New 7d"], ["to_do", "To do"], ["ready", "Ready"], ["contacted", "Contacted"],
    ["replied", "Replied"], ["meetings", "Meetings"], ["won", "Won"], ["website_leads", "Web leads"], ["sends", "Emails 30d"], ["positive_replies", "Positive 30d"]];
  return (
    <Panel title="Rep scorecard" sub="Accounts each rep owns from the Radar, what's waiting on them, and how far their accounts have got. Funnel columns count accounts that reached that status or beyond.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm" data-testid="rep-scorecard">
          <thead className="text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr><th className="py-2 pr-3 font-normal">Rep</th>{cols.map(([k, l]) => <th key={k} className="px-2 py-2 text-right font-normal">{l}</th>)}</tr>
          </thead>
          <tbody>
            {rows.reps.map((r) => (
              <tr key={r.owner || "unassigned"} className="border-t border-line/5">
                <td className="min-w-[200px] py-2 pr-3">
                  <button type="button" className="text-left hover:text-teal" onClick={() => onPick(r.owner || "unassigned")}>{r.rep}</button>
                  {(patch?.[r.rep] || r.patch) && <p className="text-[11px] text-muted-foreground">{patch?.[r.rep] || r.patch}</p>}
                </td>
                {cols.map(([k]) => <td key={k} className={cn("px-2 py-2 text-right font-mono text-xs tabular-nums", k === "to_do" && r[k] > 0 && "text-amber-200", r[k] === 0 && "text-muted-foreground/60")}>{r[k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
