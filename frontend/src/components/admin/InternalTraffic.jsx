// Internal traffic in MarkHub: the header switch that every metric follows, the "Internal" badge, the per-record
// "internal / not internal" button, and the Settings card with the rules (solix-backend internal_traffic.py).
import { useEffect, useState } from "react";
import { Building2, Check, Laptop, Loader2, Network, Plus, RefreshCw, ScanSearch, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { fetchInternal, formatApiError, markThisBrowser, rescanInternal, saveInternal } from "@/lib/adminApi";
import { INTERNAL_VIEWS, isMarkedInternal, setMarkedInternal, useInternalView } from "@/lib/internalTraffic";
import { Badge, inputCls, useCan } from "@/components/admin/kit";

const TONE = "border-violet-400/40 bg-violet-400/10 text-violet-200";

/** Header switch: hide (default), include or only internal traffic, for every number in MarkHub. */
export function InternalViewSwitch({ className }) {
  const [mode, setMode] = useInternalView();
  return (
    <div role="radiogroup" aria-label="Internal traffic in metrics" data-testid="internal-view-switch"
      className={cn("inline-flex h-9 items-center gap-0.5 rounded-full border border-line/10 p-0.5 text-[11px]", mode !== "exclude" && "border-violet-400/40", className)}>
      <span className="hidden pl-2 pr-1 text-muted-foreground 2xl:inline" title="Solix staff and test traffic">Internal</span>
      <Building2 className={cn("ml-1.5 mr-0.5 h-3.5 w-3.5 2xl:hidden", mode !== "exclude" ? "text-violet-300" : "text-muted-foreground")} aria-hidden="true" />
      {INTERNAL_VIEWS.map((m) => (
        <button key={m.value} type="button" role="radio" aria-checked={mode === m.value} title={m.help} onClick={() => setMode(m.value)}
          data-testid={`internal-view-${m.value}`}
          className={cn("rounded-full px-2.5 py-1 transition-colors", mode === m.value
            ? (m.value === "exclude" ? "bg-line/10 text-foreground" : "bg-violet-400/20 text-violet-100")
            : "text-muted-foreground hover:text-foreground")}>
          {m.short}
        </button>
      ))}
    </div>
  );
}

/** A thin banner on pages whose numbers the switch is changing, so a filter is never silent. */
export function InternalViewNote({ hidden, noun = "records", className }) {
  const [mode, setMode] = useInternalView();
  if (mode === "exclude" && !hidden) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs", mode === "exclude" ? "border-line/10 text-muted-foreground" : "border-violet-400/30 bg-violet-400/5 text-violet-100", className)}
      data-testid="internal-view-note">
      <Building2 className="h-3.5 w-3.5" />
      {mode === "exclude" && <span>{hidden} internal {noun} (Solix staff and tests) hidden from these numbers.</span>}
      {mode === "include" && <span>Showing internal traffic too: Solix staff and test activity is counted here.</span>}
      {mode === "only" && <span>Showing only internal traffic: what the Solix team itself did.</span>}
      <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setMode(mode === "exclude" ? "only" : "exclude")}>
        {mode === "exclude" ? "Show them" : "Back to prospects only"}
      </button>
    </div>
  );
}

export const InternalBadge = ({ reason, className }) => (
  <Badge className={cn(TONE, className)} title={reason ? `${reason.label}${reason.detail ? `: ${reason.detail}` : ""}` : "Solix staff or test traffic"} testId="internal-badge">
    Internal
  </Badge>
);

/** "Mark internal" / "Not internal" for one lead, form or conversation. `onSet(internal)` does the API call. */
export function InternalToggle({ internal, onSet, size = "sm", className }) {
  const [busy, setBusy] = useState(false);
  const flip = async (e) => {
    e?.stopPropagation?.();
    setBusy(true);
    try {
      await onSet(!internal);
      toast.success(internal ? "Marked not internal: counted in metrics again" : "Marked internal: left out of metrics");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button type="button" variant="outline" size={size} onClick={flip} disabled={busy} className={cn("gap-1.5", className)} data-testid="internal-toggle"
      title={internal ? "This is a real prospect, not one of our own people" : "One of our own people or a test: leave it out of every metric"}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : internal ? <UserX className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
      {internal ? "Not internal" : "Mark internal"}
    </Button>
  );
}

const linesOf = (text) => text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);

const Toggle = ({ label, help, checked, onChange, disabled, testId }) => (
  <label className="flex items-start justify-between gap-4 py-2">
    <span>
      <span className="block text-sm text-foreground">{label}</span>
      <span className="block text-xs text-muted-foreground">{help}</span>
    </span>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} data-testid={testId} />
  </label>
);

/** Settings > Internal traffic: who counts as Solix, what is on record, and this browser. */
export function InternalTrafficCard() {
  const can = useCan();
  const manage = can("manage");
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [marked, setMarked] = useState(isMarkedInternal());

  const load = () => fetchInternal().then((d) => {
    setData(d);
    const s = d.settings;
    setForm({ ...s, domainsText: s.domains.join("\n"), emailsText: s.emails.join("\n"), ranges: s.ip_ranges.map((r) => ({ ...r })) });
  }).catch((e) => toast.error(formatApiError(e)));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const { domainsText, emailsText, ranges, ...rest } = form;
      await saveInternal({ ...rest, domains: linesOf(domainsText), emails: linesOf(emailsText), ip_ranges: ranges.filter((r) => r.cidr.trim()) });
      toast.success("Internal traffic rules saved. Re-scan history to apply them to past records.");
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };
  const rescan = async () => {
    setScanning(true);
    try {
      const c = await rescanInternal();
      toast.success(`Re-scanned: ${c.leads_flagged} lead(s), ${c.submissions_flagged} form(s), ${c.visitors_flagged} visitor(s) flagged; ${c.leads_cleared} cleared`);
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setScanning(false);
    }
  };
  const browser = async (on) => {
    try {
      await markThisBrowser({ internal: on, explicit: true });
      setMarkedInternal(on);
      setMarked(on);
      toast.success(on ? "This browser is internal: its visits to the site won't count" : "This browser counts as a normal visitor again");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (!data || !form) {
    return <section className="rounded-2xl border border-line/10 bg-card p-6" data-testid="internal-traffic-card"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></section>;
  }
  const s = data.summary;
  const reasons = data.reasons || {};
  const allReasons = {};
  for (const k of ["leads", "visitors", "submissions", "registrations"]) for (const [r, n] of Object.entries(s[k].by_reason || {})) allReasons[r] = (allReasons[r] || 0) + n;
  const shareLink = `${window.location.origin}${process.env.PUBLIC_URL || ""}/?solix_internal=1`;
  // www.solix.com is a separate site with its own browser storage: a browser marked here (or by signing in to
  // MarkHub) is not marked there. Its MarkHub tag reads the same ?solix_internal=1 link.
  const mainSiteLink = `${(process.env.REACT_APP_MAIN_SITE_URL || "https://www.solix.com").replace(/\/$/, "")}/?solix_internal=1`;
  const copy = (link) => navigator.clipboard?.writeText(link).then(() => toast.success("Link copied"));

  return (
    <section className="rounded-2xl border border-line/10 bg-card p-6" data-testid="internal-traffic-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-accent/50 text-violet-300"><Building2 className="h-5 w-5" strokeWidth={1.5} /></span>
          <div>
            <p className="font-display text-lg font-medium">Internal traffic</p>
            <p className="text-xs text-muted-foreground">Solix's own people, recognised everywhere and left out of every metric unless you switch them in (header: Internal).</p>
          </div>
        </div>
        {manage && <Button type="button" variant="outline" size="sm" onClick={rescan} disabled={scanning} data-testid="internal-rescan">
          {scanning ? <Loader2 className="animate-spin" /> : <ScanSearch />} Re-scan history
        </Button>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="internal-summary">
        {[["Leads", s.leads.total], ["Visitors", s.visitors.total], ["Form fills", s.submissions.total], ["Sol chats", s.chats.total], ["Registrations", s.registrations.total], ["Page events", s.events]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line/10 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{k}</p>
            <p className="font-display text-xl">{v}</p>
          </div>
        ))}
      </div>
      {Object.keys(allReasons).length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <span>Recognised by:</span>
          {Object.entries(allReasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => <Badge key={r} className={TONE}>{reasons[r] || r} · {n}</Badge>)}
        </p>
      )}
      {data.last_rescan && <p className="mt-2 text-[11px] text-muted-foreground">Last re-scan {new Date(data.last_rescan.at).toLocaleString()}.</p>}

      <form onSubmit={save} className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Company email domains
            <textarea value={form.domainsText} onChange={(e) => set("domainsText")(e.target.value)} disabled={!manage} rows={3}
              className={cn(inputCls, "mt-1.5 h-auto w-full border py-2 font-mono normal-case tracking-normal")} placeholder={"solix.com\nsolixtechnologies.com"} data-testid="internal-domains" />
            <span className="mt-1 block normal-case tracking-normal">Anyone using an address at these domains (or a subdomain) is internal: forms, chats, sign-ups, event passes. Also matches office networks the IP lookup names.</span>
          </label>
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Other internal addresses
            <textarea value={form.emailsText} onChange={(e) => set("emailsText")(e.target.value)} disabled={!manage} rows={3}
              className={cn(inputCls, "mt-1.5 h-auto w-full border py-2 font-mono normal-case tracking-normal")} placeholder="contractor@agency.com" data-testid="internal-emails" />
            <span className="mt-1 block normal-case tracking-normal">Agencies, contractors, colleagues' personal addresses used for testing. One per line.</span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Office and VPN networks</p>
            <ul className="mt-1.5 space-y-2" data-testid="internal-ranges">
              {form.ranges.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <Input value={r.cidr} disabled={!manage} placeholder="203.0.113.0/24" className={cn(inputCls, "w-44 font-mono")}
                    onChange={(e) => set("ranges")(form.ranges.map((x, j) => (j === i ? { ...x, cidr: e.target.value } : x)))} />
                  <Input value={r.label} disabled={!manage} placeholder="Santa Clara office" className={cn(inputCls, "flex-1")}
                    onChange={(e) => set("ranges")(form.ranges.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  {manage && <Button type="button" variant="ghost" size="icon" aria-label="Remove range" onClick={() => set("ranges")(form.ranges.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
            </ul>
            {manage && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => set("ranges")([...form.ranges, { cidr: "", label: "" }])}><Plus /> Add range</Button>
                {data.you?.ip && !data.you.match && (
                  <Button type="button" variant="outline" size="sm" data-testid="internal-add-my-network"
                    onClick={() => set("ranges")([...form.ranges, { cidr: data.you.ip, label: "Added from MarkHub" }])}>
                    <Network /> Add the network I'm on
                  </Button>
                )}
              </div>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              Every visit, form and chat from these addresses is internal. Addresses are matched as they arrive and never stored.
              {data.you?.ip && <> You are on <span className="font-mono text-foreground">{data.you.ip}</span>{data.you.match ? <>: internal ({data.you.match.detail}).</> : ", not in a listed range."}</>}
            </p>
          </div>

          <div className="divide-y divide-line/5 rounded-xl border border-line/10 px-3">
            <Toggle label="Recognise internal traffic" help="Off: nothing new is flagged (existing flags stay)." checked={form.enabled} onChange={set("enabled")} disabled={!manage} testId="internal-enabled" />
            <Toggle label="MarkHub users and team members are internal" help="Their addresses count wherever they appear on the site." checked={form.include_staff} onChange={set("include_staff")} disabled={!manage} />
            <Toggle label="Mark browsers that sign in to MarkHub" help="A colleague's own laptop stops counting as a visitor once they sign in here." checked={form.flag_markhub_browsers} onChange={set("flag_markhub_browsers")} disabled={!manage} />
            <Toggle label="No sales alerts for internal forms and chats" help="Test submissions don't email the sales inbox." checked={form.suppress_alerts} onChange={set("suppress_alerts")} disabled={!manage} />
            <Toggle label="Keep internal leads out of Radar and outbound" help="They aren't linked to accounts or handed to sequences." checked={form.keep_out_of_pipeline} onChange={set("keep_out_of_pipeline")} disabled={!manage} />
          </div>
        </div>

        {manage && (
          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Button type="submit" disabled={saving} data-testid="internal-save">{saving ? <Loader2 className="animate-spin" /> : <Check />} Save rules</Button>
            <span className="text-xs text-muted-foreground">New activity follows the rules at once; <b>Re-scan history</b> applies them to what's already recorded.</span>
          </div>
        )}
      </form>

      <div className="mt-6 grid gap-3 rounded-xl border border-line/10 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-start gap-3">
          <Laptop className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-foreground">This browser is {marked ? "internal" : "counted as a visitor"}</p>
            <p className="text-xs text-muted-foreground">
              Colleagues who never sign in to MarkHub can open <button type="button" className="font-mono underline underline-offset-2" onClick={() => copy(shareLink)}>{shareLink.replace(/^https?:\/\//, "")}</button> once on each device.
              {" "}www.solix.com is a separate site: everyone, signed in or not, opens <button type="button" className="font-mono underline underline-offset-2" onClick={() => copy(mainSiteLink)} data-testid="internal-main-site-link">{mainSiteLink.replace(/^https?:\/\//, "")}</button> once in each browser they use (<span className="font-mono">?solix_internal=0</span> undoes it).
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => browser(!marked)} data-testid="internal-this-browser">
          {marked ? <UserX /> : <RefreshCw />} {marked ? "Count this browser again" : "Mark this browser internal"}
        </Button>
      </div>
    </section>
  );
}
