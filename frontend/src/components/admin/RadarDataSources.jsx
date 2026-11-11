import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, FlaskConical, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchRadarProviders, formatApiError, saveRadarProviders, testRadarProvider } from "@/lib/adminApi";
import { Panel, fmtDate, inputCls, selectCls } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

// Every Radar function walks a chain of (mostly free) providers: one that is rate limited or out of
// credits rests and the next answers. This shows each chain, what is set up and what is left this month.
// Keys are set on the server (Render → Environment); sign-up links are in docs/radar-free-sources.md.
const dot = (p) => (!p.enabled ? "bg-line/30" : p.ready ? "bg-emerald-400" : p.configured ? "bg-amber-400" : "bg-line/30");

function Bar({ used, cap }) {
  const pct = Math.min(100, Math.round((100 * used) / Math.max(cap, 1)));
  return <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line/15"><span className={cn("block h-full rounded-full", pct >= 90 ? "bg-red-400" : pct >= 60 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${pct}%` }} /></span>;
}

function Usage({ p }) {
  if (p.grant_total != null) {
    const soon = p.expires_in_days != null && p.expires_in_days <= 14;
    return (
      <span className="flex items-center gap-2 text-[11px] text-muted-foreground" title="One-time credits">
        <Bar used={p.grant_used || 0} cap={p.grant_total} />
        <span className="tabular-nums">{p.grant_used || 0}/{p.grant_total} one-time</span>
        {p.expires && <span className={cn(soon && "text-amber-200", p.expires_in_days < 0 && "text-red-300")}>{p.expires_in_days < 0 ? `expired ${fmtDate(p.expires)}` : `expires ${fmtDate(p.expires)} (${p.expires_in_days} d)`}</span>}
      </span>
    );
  }
  const cap = p.monthly_cap ?? p.daily_cap;
  const used = p.monthly_cap != null ? p.used_month : p.used_today;
  if (cap == null) return <span className="text-[11px] text-muted-foreground">{p.used_month ? `${p.used_month} used this month` : p.keyless ? "free" : "no fixed allowance"}</span>;
  return (
    <span className="flex items-center gap-2 text-[11px] text-muted-foreground" title={`${used} of ${cap} ${p.monthly_cap != null ? "this month" : "today"}`}>
      <Bar used={used} cap={cap} />
      <span className="tabular-nums">{used}/{cap}{p.monthly_cap != null ? "/mo" : "/day"}</span>
    </span>
  );
}

// How much a provider may use: a monthly or daily allowance, or one-time credits that can expire
// (a sign-up grant, or a trial such as "300 credits for 6 months"). Entering one-time credits starts a fresh count.
function AllowanceEditor({ p, limits, onSave, onClose, busy }) {
  const cur = limits[p.pool] || {};
  const [kind, setKind] = useState(cur.total != null || (p.grant_total != null && cur.monthly == null && cur.daily == null) ? "total" : cur.daily != null || (p.monthly_cap == null && p.daily_cap != null) ? "daily" : "monthly");
  const [amount, setAmount] = useState(String(cur.total ?? cur.daily ?? cur.monthly ?? (kind === "total" ? p.grant_total : kind === "daily" ? p.daily_cap : p.monthly_cap) ?? ""));
  const [expires, setExpires] = useState(cur.expires || p.expires || "");
  const submit = (reset) => {
    const next = { ...limits };
    if (reset) {
      delete next[p.pool];
    } else {
      const n = Number(amount);
      if (amount.trim() === "" || !Number.isFinite(n) || n < 0) return toast.error("Enter a whole number.");
      next[p.pool] = kind === "total" ? { total: Math.round(n), ...(expires ? { expires } : {}) } : { [kind]: Math.round(n) };
    }
    onSave({ limits: next }).then(onClose).catch(() => {});
  };
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line/10 bg-background/40 p-2 text-xs">
      <label className="text-muted-foreground">Kind
        <select className={cn(selectCls, "mt-1 h-8 text-xs")} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="monthly">Every month</option><option value="daily">Every day</option><option value="total">One-time credits</option>
        </select>
      </label>
      <label className="text-muted-foreground">{kind === "total" ? "Credits (what is left)" : "Allowance"}<Input className={cn(inputCls, "mt-1 h-8 w-28 text-xs")} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      {kind === "total" && <label className="text-muted-foreground">Expires on (optional)<Input className={cn(inputCls, "mt-1 h-8 text-xs")} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></label>}
      <Button size="sm" className="h-8" disabled={busy} onClick={() => submit(false)}>Save</Button>
      <Button size="sm" variant="ghost" className="h-8" disabled={busy} onClick={() => submit(true)}>Use default</Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={onClose}>Cancel</Button>
      {kind === "total" && <p className="basis-full text-[11px] text-muted-foreground">Saving starts a fresh count from today. Scheduled work spreads the credits over the days to the expiry date (60 days if none); the provider is skipped once they are used or expired.</p>}
    </div>
  );
}

export function RadarDataSources() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [tests, setTests] = useState({});
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => fetchRadarProviders().then(setData).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const save = async (body, label) => {
    setBusy(label);
    try {
      setData(await saveRadarProviders(body));
    } catch (e) {
      toast.error(formatApiError(e));
      throw e;
    } finally {
      setBusy(null);
    }
  };
  const move = (cap, idx, dir) => {
    const names = cap.providers.filter((p) => p.enabled).map((p) => p.name);
    const j = idx + dir;
    if (j < 0 || j >= names.length) return;
    [names[idx], names[j]] = [names[j], names[idx]];
    save({ order: { ...(data.config.order || {}), [cap.key]: names } }, `move:${cap.key}`).catch(() => {});
  };
  const toggle = (p) => {
    const off = new Set(data.config.disabled || []);
    if (off.has(p.name)) off.delete(p.name); else off.add(p.name);
    save({ disabled: [...off] }, `off:${p.name}`).catch(() => {});
  };
  const test = async (p) => {
    setTests((t) => ({ ...t, [p.name]: { running: true } }));
    try {
      const r = await testRadarProvider(p.name);
      setTests((t) => ({ ...t, [p.name]: r }));
      load();
    } catch (e) {
      setTests((t) => ({ ...t, [p.name]: { ok: false, detail: formatApiError(e) } }));
    }
  };

  return (
    <Panel
      title="Data sources"
      sub="Each Radar function tries these in order. A source that is rate limited or out of credits rests and the next one answers; each is paced to its free allowance. Add keys on the server (Render → Environment); the list of free sign-ups is in docs/radar-free-sources.md."
      className="lg:col-span-2"
      testId="radar-data-sources"
      action={<Button size="sm" variant="ghost" onClick={load}><RefreshCw /> Refresh</Button>}
    >
      {!data ? <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary-ink" /></div> : (
        <div className="space-y-3">
          {!data.keyless_on && <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-200">Keyless sources are switched off on the server (RADAR_KEYLESS_SOURCES=off).</p>}
          {data.capabilities.map((cap) => {
            const enabled = cap.providers.filter((p) => p.enabled);
            return (
              <details key={cap.key} className="rounded-xl border border-line/10 bg-card p-3" open={cap.ready === 0}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                  <span><span className="font-medium">{cap.label}</span> <span className="text-xs text-muted-foreground">· {cap.why}</span></span>
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]", cap.ready >= 2 ? "border-emerald-400/40 text-emerald-200" : cap.ready === 1 ? "border-amber-400/40 text-amber-200" : "border-red-400/40 text-red-200")}>
                    {cap.ready} of {cap.providers.length} ready
                  </span>
                </summary>
                <ul className="mt-3 divide-y divide-line/5">
                  {cap.providers.map((p) => {
                    const idx = enabled.findIndex((x) => x.name === p.name);
                    const t = tests[p.name];
                    return (
                      <li key={p.name} className="grid gap-2 py-2 text-sm sm:grid-cols-[1fr_auto]">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", dot(p))} />
                            <span className={cn("font-medium", !p.enabled && "text-muted-foreground line-through")}>{p.label}</span>
                            {p.keyless && <span className="text-[10px] uppercase tracking-[0.12em] text-teal">keyless</span>}
                            <Usage p={p} />
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {p.free}
                            {!p.configured && p.env.length > 0 && <> · set <code>{p.env.join(" + ")}</code></>}
                            {p.configured && p.enabled && !p.ready && p.reason && <span className="text-amber-200"> · {p.reason}{p.resting_until ? ` until ${new Date(p.resting_until).toLocaleTimeString()}` : ""}</span>}
                            {p.error && p.error_at && <span className="text-muted-foreground"> · last error {new Date(p.error_at).toLocaleString()}: {p.error}</span>}
                            {p.note && <> · {p.note}</>}
                            {p.signup && <> · <a href={p.signup} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-teal hover:underline">sign up <ExternalLink className="h-3 w-3" /></a></>}
                          </p>
                          {t && !t.running && <p className={cn("mt-1 text-[11px]", t.ok ? "text-emerald-300" : "text-red-300")}>{t.detail}</p>}
                          {editing === p.name && <AllowanceEditor p={p} limits={data.config.limits || {}} busy={busy === "lim"} onClose={() => setEditing(null)} onSave={(body) => save(body, "lim")} />}
                        </div>
                        <div className="flex items-center gap-1 sm:justify-end">
                          {p.enabled && <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${p.label} up`} disabled={idx <= 0 || !!busy} onClick={() => move(cap, idx, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${p.label} down`} disabled={idx < 0 || idx >= enabled.length - 1 || !!busy} onClick={() => move(cap, idx, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                          </>}
                          {!p.keyless && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(editing === p.name ? null : p.name)} title="Monthly, daily or one-time credits, with an expiry date">Allowance</Button>}
                          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={!p.configured || t?.running} onClick={() => test(p)}>{t?.running ? <Loader2 className="animate-spin" /> : <FlaskConical />} Test</Button>
                          <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={p.enabled} disabled={busy === `off:${p.name}`} onChange={() => toggle(p)} /> On</label>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
