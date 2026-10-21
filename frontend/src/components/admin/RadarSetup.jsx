import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Play, Route, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchRadarConfig, fetchTerritories, formatApiError, importRadar, previewRouting, runRadar, saveRadarConfig, saveTerritories } from "@/lib/adminApi";
import { Panel, inputCls } from "@/components/admin/kit";

// Plain-text editors: one row per line, so a whole territory plan can be pasted from a sheet.
const toLines = (rows, fn) => rows.map(fn).join("\n");
const parseLines = (text, fn) => text.split("\n").map((l) => l.trim()).filter(Boolean).map(fn).filter(Boolean);
const split2 = (line, sep) => { const i = line.indexOf(sep); return i < 0 ? null : [line.slice(0, i).trim(), line.slice(i + sep.length).trim()]; };

export function RadarSetup({ onChanged }) {
  const [cfg, setCfg] = useState(null);
  const [terr, setTerr] = useState(null);
  const [text, setText] = useState({});
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState({ company: "", country: "United States", location: "" });
  const [route, setRoute] = useState(null);
  const file = useRef(null);

  useEffect(() => {
    Promise.all([fetchRadarConfig(), fetchTerritories()]).then(([c, t]) => {
      setCfg(c);
      setTerr(t);
      setText({
        targets: toLines(c.targets || [], (t) => [t.company, t.domain, t.ats, t.board || t.workday_url].map((x) => x || "").join(", ")),
        dns: (c.dns_domains || []).join("\n"),
        named: toLines(t.named_accounts || [], (n) => `${n.match} -> ${n.rep}`),
        states: toLines(Object.entries(t.us_states || {}), ([s, r]) => `${s} -> ${r}`),
        owners: toLines(Object.entries(t.territory_owners || {}), ([k, r]) => `${k} -> ${r}`),
        countries: toLines(Object.entries(t.countries || {}), ([k, r]) => `${k} -> ${r}`),
        emails: toLines(Object.entries(t.rep_emails || {}), ([k, e]) => `${k} = ${e}`),
      });
    }).catch((e) => toast.error(formatApiError(e)));
  }, []);

  const doImport = async (f) => {
    if (!f) return;
    setBusy("import");
    try {
      const r = await importRadar(f);
      toast.success(`Imported: ${r.touched} accounts, ${r.signals_new} new signals, ${r.research} deep dives, ${r.contacts} contacts.`);
      onChanged?.();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
      if (file.current) file.current.value = "";
    }
  };

  const saveSources = async () => {
    setBusy("sources");
    try {
      const targets = parseLines(text.targets || "", (l) => {
        const [company, domain, ats, board] = l.split(",").map((x) => x.trim());
        return company ? { company, domain: domain || null, ats: (ats || "").toLowerCase() || null, ...(ats?.toLowerCase() === "workday" ? { workday_url: board } : { board: board || null }) } : null;
      });
      const c = await saveRadarConfig({ ...cfg, targets, dns_domains: parseLines(text.dns || "", (l) => l) });
      setCfg(c);
      toast.success(`Sources saved: ${c.targets.length} job boards, ${c.dns_domains.length} domains`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const saveTerr = async () => {
    setBusy("terr");
    try {
      const map = (t) => Object.fromEntries(parseLines(t || "", (l) => split2(l, "->")));
      const t = await saveTerritories({
        ...terr,
        named_accounts: parseLines(text.named || "", (l) => { const p = split2(l, "->"); return p ? { match: p[0], rep: p[1] } : null; }),
        us_states: Object.fromEntries(Object.entries(map(text.states)).map(([k, v]) => [k.toUpperCase(), v])),
        territory_owners: map(text.owners),
        countries: map(text.countries),
        rep_emails: Object.fromEntries(parseLines(text.emails || "", (l) => split2(l, "="))),
      });
      setTerr(t);
      toast.success("Territories saved. Every account is being re-routed now (manual owners are kept).");
      onChanged?.();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const run = async (steps) => {
    setBusy("run");
    try {
      await runRadar(steps);
      toast.success(`Started: ${steps.join(", ")}`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  if (!cfg || !terr) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>;
  const area = (k, rows = 8, placeholder) => <Textarea rows={rows} value={text[k] || ""} onChange={(e) => setText({ ...text, [k]: e.target.value })} placeholder={placeholder} className="border-line/15 bg-background font-mono text-xs" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="radar-setup">
      <Panel title="Import from the Leads Radar" sub="Upload radar.html (the page itself) or its JSON. Owner, Status and Notes are kept; running it again never duplicates.">
        <input ref={file} type="file" accept=".html,.htm,.json" className="hidden" onChange={(e) => doImport(e.target.files?.[0])} />
        <Button onClick={() => file.current?.click()} disabled={busy === "import"}>{busy === "import" ? <Loader2 className="animate-spin" /> : <Upload />} Choose file</Button>
      </Panel>

      <Panel title="Run" sub="The daily run also happens automatically at 05:00 UTC (GitHub Actions).">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy === "run"} onClick={() => run(["collect", "score", "research"])}><Play /> Collect, score, research</Button>
          <Button variant="outline" size="sm" disabled={busy === "run"} onClick={() => run(["score"])}>Rescore only</Button>
          <Button variant="outline" size="sm" disabled={busy === "run"} onClick={() => run(["research"])}>Deep dives only</Button>
          <Button variant="outline" size="sm" disabled={busy === "run"} onClick={() => run(["digest"])}>Send digests</Button>
        </div>
      </Panel>

      <Panel title="Sources" sub="Free sources first. Crustdata is optional and capped per run." className="lg:col-span-2">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Job boards, one per line: <code>Company, domain, ats, board</code>. ats is greenhouse, lever, ashby or workday (board = the career site URL for workday).</p>
            {area("targets", 9, "Acme Mutual, acmemutual.com, greenhouse, acmemutual\nGlobex Bank, globex.com, workday, https://globex.wd5.myworkdayjobs.com/Careers")}
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Domains to fingerprint (DNS + certificates), one per line. Account domains are scanned automatically.</p>
            {area("dns", 9, "acmemutual.com")}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(cfg.collectors).map(([k, on]) => (
            <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={(e) => setCfg({ ...cfg, collectors: { ...cfg.collectors, [k]: e.target.checked } })} /> {({ ats: "Job boards", crustdata: "Crustdata (paid)", dns: "DNS + certificates", news: "News", filings: "SEC filings", tenders: "EU tenders" })[k] || k}</label>
          ))}
          <label className="text-xs text-muted-foreground">Crustdata credit cap per run<Input type="number" className={inputCls} value={cfg.credit_cap} onChange={(e) => setCfg({ ...cfg, credit_cap: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Deep dives per run<Input type="number" className={inputCls} value={cfg.research_per_run} onChange={(e) => setCfg({ ...cfg, research_per_run: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Re-research after (days)<Input type="number" className={inputCls} value={cfg.refresh_days} onChange={(e) => setCfg({ ...cfg, refresh_days: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Min. employees (Crustdata)<Input type="number" className={inputCls} value={cfg.min_employees} onChange={(e) => setCfg({ ...cfg, min_employees: Number(e.target.value) })} /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!cfg.reps_see_own_only} onChange={(e) => setCfg({ ...cfg, reps_see_own_only: e.target.checked })} /> Sales users see only their own accounts</label>
        </div>
        <div className="mt-4 flex justify-end"><Button size="sm" onClick={saveSources} disabled={busy === "sources"}>{busy === "sources" ? <Loader2 className="animate-spin" /> : <Check />} Save sources</Button></div>
      </Panel>

      <Panel title="Territories" sub="Named account first, then US state (California splits by ZIP), then country, then the region owner." className="lg:col-span-2">
        <div className="grid gap-4 lg:grid-cols-3">
          <div><p className="mb-1 text-xs text-muted-foreground">Named accounts: <code>name contains -&gt; Rep</code></p>{area("named", 12)}</div>
          <div><p className="mb-1 text-xs text-muted-foreground">US states: <code>TX -&gt; Rep</code></p>{area("states", 12)}</div>
          <div className="space-y-3">
            <div><p className="mb-1 text-xs text-muted-foreground">Region owners: <code>Europe &amp; UK -&gt; Rep</code></p>{area("owners", 5)}</div>
            <div><p className="mb-1 text-xs text-muted-foreground">Country overrides: <code>Germany -&gt; Rep</code></p>{area("countries", 3, "France -> Ravi Summan")}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><p className="mb-1 text-xs text-muted-foreground">Rep emails: <code>Rep Name = email</code>. Reps whose name matches someone in Settings → Team are linked automatically.</p>{area("emails", 4, "Matt Long = matt.long@solix.com")}</div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>California split</p>
            <div className="grid grid-cols-3 gap-2">
              <Input className={inputCls} type="number" value={terr.ca_split?.zip || 93600} onChange={(e) => setTerr({ ...terr, ca_split: { ...terr.ca_split, zip: Number(e.target.value) } })} aria-label="California split ZIP" />
              <Input className={inputCls} value={terr.ca_split?.north || ""} onChange={(e) => setTerr({ ...terr, ca_split: { ...terr.ca_split, north: e.target.value } })} aria-label="North rep" placeholder="North rep" />
              <Input className={inputCls} value={terr.ca_split?.south || ""} onChange={(e) => setTerr({ ...terr, ca_split: { ...terr.ca_split, south: e.target.value } })} aria-label="South rep" placeholder="South rep" />
            </div>
            <p>ZIPs at or above the split go north.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line/10 pt-4">
          <div className="flex flex-wrap items-end gap-2">
            <Input className={inputCls} placeholder="Company" value={preview.company} onChange={(e) => setPreview({ ...preview, company: e.target.value })} />
            <Input className={inputCls} placeholder="Country" value={preview.country} onChange={(e) => setPreview({ ...preview, country: e.target.value })} />
            <Input className={inputCls} placeholder="City, ST or ZIP" value={preview.location} onChange={(e) => setPreview({ ...preview, location: e.target.value })} />
            <Button size="sm" variant="outline" onClick={() => previewRouting(preview).then(setRoute).catch((e) => toast.error(formatApiError(e)))}><Route /> Who gets it?</Button>
            {route && <span className="text-sm">{route.rep || "nobody"} <span className="text-muted-foreground">({route.territory}, {route.basis}{route.owner ? `, ${route.owner}` : ", no email linked"})</span></span>}
          </div>
          <Button size="sm" onClick={saveTerr} disabled={busy === "terr"}>{busy === "terr" ? <Loader2 className="animate-spin" /> : <Check />} Save territories</Button>
        </div>
      </Panel>
    </div>
  );
}
