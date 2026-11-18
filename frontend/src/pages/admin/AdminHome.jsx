import { lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Crosshair, FileText, Flame, Inbox, ListTodo, Loader2, MailX, Send, ShieldCheck, Target, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { fetchHome, formatApiError } from "@/lib/adminApi";
import { BarList, CHANNEL_LABELS, Panel, SERIES, STAGE_LABELS, StatTile, useLiveRefresh } from "@/components/admin/kit";
import { useAdmin } from "@/components/admin/AdminAuth";
import { Segmented } from "@/components/admin/motion";

const ExecutiveDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const VIEWS = [
  { key: "executive", label: "Executive" },
  { key: "manager", label: "Manager" },
  { key: "rep", label: "Rep" },
  { key: "marketing", label: "Marketing" },
  { key: "compliance", label: "Compliance" },
];
const HEADLINES = {
  manager: ["Team", "Your team's coverage, pace and gaps."],
  rep: ["My day", "Your accounts, your next steps, your replies."],
  marketing: ["Marketing", "What came in, from where, and what went out."],
  compliance: ["Compliance", "Who we must not contact, and whether sending is healthy."],
};
const rows = (obj, labels = {}) => Object.entries(obj || {}).map(([k, n]) => ({ label: labels[k] || k.replace(/[-_]/g, " "), n })).sort((a, b) => b.n - a.n);
const accountLink = (id) => `/admin/radar?account=${encodeURIComponent(id)}`;

/** The admin home: each person lands on the dashboard an admin assigned them (Settings > Access), or the one their
 *  role and seniority suggest. Admins can switch between all of them to see what each team sees. */
export default function AdminHome() {
  const { user } = useAdmin();
  const isAdmin = user?.role === "admin";
  const [view, setView] = useState(user?.dashboard || "executive");
  const [data, setData] = useState(null);

  const load = (silent) => {
    if (view === "executive") return Promise.resolve();
    if (!silent) setData(null);
    return fetchHome(isAdmin ? view : undefined).then(setData).catch((e) => !silent && toast.error(formatApiError(e)));
  };
  useEffect(() => { load(); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps
  useLiveRefresh(() => load(true), 60000);

  const switcher = isAdmin && (
    <div className="mb-6 flex flex-wrap items-center gap-3" data-testid="home-view-switch">
      <span className="text-xs text-muted-foreground">Viewing as</span>
      <Segmented options={VIEWS} value={view} onChange={setView} layoutId="home-view" label="Dashboard view" testIdPrefix="home-view" />
    </div>
  );

  if (view === "executive") {
    return (
      <>
        {switcher}
        <ExecutiveDashboard />
      </>
    );
  }
  const [eyebrow, headline] = HEADLINES[view] || ["Home", ""];
  const d = data?.data || {};
  return (
    <div data-testid={`home-${view}`}>
      {switcher}
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{headline}</h1>
      {!data ? (
        <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="mt-8">
          {view === "rep" && <RepView d={d} />}
          {view === "manager" && <ManagerView d={d} />}
          {view === "marketing" && <MarketingView d={d} />}
          {view === "compliance" && <ComplianceView d={d} />}
          {!Object.keys(d).length && <p className="text-sm text-muted-foreground">Nothing here yet: you don't have access to the areas this dashboard draws on.</p>}
        </div>
      )}
    </div>
  );
}

const Grid = ({ children }) => <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>;

const AccountList = ({ items, empty, testId }) =>
  items?.length ? (
    <ul className="divide-y divide-line/5" data-testid={testId}>
      {items.map((c) => (
        <li key={c.id}>
          <Link to={accountLink(c.id)} className="flex items-center justify-between gap-3 py-2.5 transition-opacity hover:opacity-80">
            <span className="min-w-0">
              <span className="block truncate text-sm">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{c.next_action?.label || [c.strength, c.segment].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {c.surge && <Flame className="h-3.5 w-3.5 text-[#ee2424]" aria-label="Surging" />}
              {c.score != null && <span className="font-mono text-xs text-muted-foreground">{Math.round(c.score)}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  );

function RepView({ d }) {
  const a = d.accounts;
  return (
    <div className="space-y-6">
      <Grid>
        {a && <StatTile label="My accounts" value={a.total} icon={Crosshair} testId="home-rep-accounts" />}
        {a && <StatTile label="Next steps waiting" value={a.todo.length} icon={ListTodo} accent={SERIES.mqls} />}
        {d.replies && <StatTile label="Replies, 14 days" value={d.replies.length} icon={Send} accent={SERIES.sqls} sub={`${d.active_sequences || 0} sequences running`} />}
        {d.leads && <StatTile label="My leads" value={d.leads.total} icon={Users} />}
      </Grid>
      <div className="grid gap-6 lg:grid-cols-2">
        {a && (
          <Panel title="Do next" sub="Your accounts with a next step, strongest first">
            <AccountList items={a.todo} empty="No next steps waiting. Open the Radar to pick up new accounts." testId="home-rep-todo" />
          </Panel>
        )}
        {a && (
          <Panel title="Surging now" sub="Your accounts with a burst of new signals">
            <AccountList items={a.surging} empty="None of your accounts is surging right now." />
            {a.check_size > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" /> {a.check_size} of your accounts have a company size to confirm before outreach.
              </p>
            )}
          </Panel>
        )}
        {d.leads && (
          <Panel title="My leads by stage">
            <BarList rows={rows(d.leads.by_stage, STAGE_LABELS)} valueKey="n" labelKey="label" />
          </Panel>
        )}
        {d.replies && (
          <Panel title="Latest replies" sub="On your accounts, last 14 days">
            {d.replies.length ? (
              <ul className="divide-y divide-line/5">
                {d.replies.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link to={accountLink(r.company_id)} className="truncate hover:underline">{r.company_name || r.email || "Reply"}</Link>
                    <span className="shrink-0 text-xs capitalize text-muted-foreground">{(r.label || "reply").replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No replies in the last two weeks.</p>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function ManagerView({ d }) {
  const cov = d.coverage;
  return (
    <div className="space-y-6">
      {cov && (
        <Grid>
          <StatTile label="Strong, unassigned" value={cov.unassigned_strong} icon={Target} accent={ACCENT_ALERT} testId="home-mgr-unassigned" />
          <StatTile label="Need routing" value={cov.needs_routing} icon={UserPlus} accent={SERIES.mqls} />
          <StatTile label="Ready, not contacted" value={cov.ready_not_contacted} icon={Send} accent={SERIES.sqls} />
          <StatTile label="Sizes to confirm" value={cov.sizes_to_check} icon={AlertTriangle} />
        </Grid>
      )}
      {d.reps && (
        <Panel title="Team scorecard" sub="Last 30 days" testId="home-mgr-reps">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  {["Rep", "Accounts", "Strong", "Surging", "Ready", "To do", "Sends", "Positive replies"].map((h) => <th key={h} className="pb-2 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/5">
                {d.reps.map((r) => (
                  <tr key={r.owner || r.rep}>
                    <td className="py-2">{r.owner ? <Link to={`/admin/radar?owner=${encodeURIComponent(r.owner)}`} className="hover:underline">{r.rep}</Link> : r.rep}</td>
                    {["accounts", "strong", "surging", "ready", "to_do", "sends", "positive_replies"].map((k) => <td key={k} className="py-2 font-mono text-xs">{r[k] ?? 0}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {d.segments && <Panel title="Accounts by segment"><BarList rows={rows(d.segments)} valueKey="n" labelKey="label" /></Panel>}
        {d.pipeline && <Panel title="Pipeline by stage"><BarList rows={rows(d.pipeline, STAGE_LABELS)} valueKey="n" labelKey="label" color={SERIES.sqls} /></Panel>}
      </div>
    </div>
  );
}

const ACCENT_ALERT = "#ee2424";

function MarketingView({ d }) {
  return (
    <div className="space-y-6">
      <Grid>
        {d.new_leads && <StatTile label="New leads, 30 days" value={d.new_leads.total} icon={Users} testId="home-mkt-leads" />}
        {d.new_leads && <StatTile label="Qualified of those" value={d.new_leads.mqls} icon={Target} accent={SERIES.mqls} />}
        {d.submissions && <StatTile label="Form submissions" value={Object.values(d.submissions).reduce((a, b) => a + b, 0)} icon={Inbox} accent={SERIES.sqls} />}
        {d.content && <StatTile label="Published, 30 days" value={d.content.published_30d} icon={FileText} sub={`${d.content.drafts} drafts`} />}
      </Grid>
      <div className="grid gap-6 lg:grid-cols-2">
        {d.new_leads && <Panel title="New leads by channel"><BarList rows={rows(d.new_leads.by_channel, CHANNEL_LABELS)} valueKey="n" labelKey="label" /></Panel>}
        {d.submissions && <Panel title="Submissions by form"><BarList rows={rows(d.submissions)} valueKey="n" labelKey="label" color={SERIES.sqls} /></Panel>}
      </div>
    </div>
  );
}

function ComplianceView({ d }) {
  const high = d.bounce_rate_7d != null && d.bounce_rate_7d > 3;
  return (
    <div className="space-y-6">
      <Grid>
        <StatTile label="Suppressed" value={d.suppressed ?? 0} icon={MailX} testId="home-comp-suppressed" />
        <StatTile label="Erasures, 30 days" value={d.erasures_30d ?? 0} icon={ShieldCheck} accent={SERIES.sqls} />
        <StatTile label="Sends, 7 days" value={d.sends_7d ?? 0} icon={Send} />
        <StatTile label="Bounce rate, 7 days" value={d.bounce_rate_7d == null ? "–" : `${d.bounce_rate_7d}%`} icon={AlertTriangle} accent={high ? ACCENT_ALERT : SERIES.sqls} sub={high ? "Above 3%: sending pauses" : "Healthy"} />
      </Grid>
      <Panel title="Legitimate interest assessments" sub="Outbound needs a signed LIA for each region it sends to">
        {d.lias?.length ? (
          <ul className="divide-y divide-line/5">
            {d.lias.map((l, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="uppercase">{l.region || "all"}</span>
                <span className={l.signed ? "text-emerald-300" : "text-amber-300"}>{l.signed ? `Signed ${String(l.signed_at || "").slice(0, 10)}` : "Not signed"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No LIA on file yet. <Link to="/admin/outbound" className="underline">Sign one in Outbound</Link> before sending.</p>
        )}
      </Panel>
    </div>
  );
}
