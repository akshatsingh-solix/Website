// Shared admin building blocks: labels, badges, score bars, tiles, role checks.
import { cn } from "@/lib/utils";
import { useAdmin } from "@/components/admin/AdminAuth";

export const STAGE_LABELS = {
  lead: "Lead", mql: "MQL", sal: "SAL", sql: "SQL", opportunity: "Opportunity", won: "Won", lost: "Lost", disqualified: "Disqualified",
};
export const STAGE_HELP = {
  lead: "Known contact, not yet qualified",
  mql: "Marketing qualified: hand-raise or score over threshold",
  sal: "Sales accepted: a rep has picked it up",
  sql: "Sales qualified: budget, need and timing confirmed",
  opportunity: "Active deal in the pipeline",
  won: "Closed won", lost: "Closed lost", disqualified: "Not a fit / spam",
};
const STAGE_TONE = {
  lead: "border-line/15 bg-line/5 text-muted-foreground",
  mql: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  sal: "border-indigo-400/40 bg-indigo-400/10 text-indigo-200",
  sql: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  opportunity: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  won: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  lost: "border-line/15 bg-line/5 text-muted-foreground line-through",
  disqualified: "border-line/15 bg-line/5 text-muted-foreground",
};

export const LINE_SHORT = { platform: "Platform", archiving: "Archiving", governance: "Governance & Privacy", ai: "Enterprise AI", ecs: "ECS", services: "Services" };
export const CHANNEL_LABELS = { paid: "Paid", organic_search: "Organic search", social: "Social", email: "Email", referral: "Referral", chat: "Concierge chat", direct: "Direct" };

// Validated categorical slots for the dark admin surface (see dataviz palette).
export const SERIES = { leads: "#3987e5", mqls: "#d95926", sqls: "#199e70" };

export const selectCls = "h-10 rounded-lg border border-line/15 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60";
export const inputCls = "h-10 rounded-lg border-line/15 bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0";

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
export const ago = (iso) => {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
};
export const productName = (slug) => (slug || "").split("-").map((w) => (w === "ai" ? "AI" : w === "sap" ? "SAP" : w === "ecs" ? "ECS" : w === "oebs" ? "OEBS" : w === "eai" ? "EAI" : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");

export const Badge = ({ className, children, title, testId }) => (
  <span title={title} data-testid={testId} className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]", className)}>{children}</span>
);

export const StageBadge = ({ stage = "lead" }) => (
  <Badge className={STAGE_TONE[stage] || STAGE_TONE.lead} title={STAGE_HELP[stage]} testId={`stage-${stage}`}>{STAGE_LABELS[stage] || stage}</Badge>
);

export const LineBadge = ({ line }) =>
  line ? <Badge className="border-teal/30 bg-teal/10 text-teal">{LINE_SHORT[line] || line}</Badge> : <span className="text-xs text-muted-foreground">No signal yet</span>;

/** Score as a number plus a bar against the MQL threshold. */
export const ScoreBar = ({ score = 0, threshold = 45 }) => {
  const pct = Math.min(100, (score / Math.max(threshold * 1.6, 1)) * 100);
  const mark = Math.min(100, (threshold / Math.max(threshold * 1.6, 1)) * 100);
  return (
    <div className="flex min-w-[110px] items-center gap-2" title={`Score ${Math.round(score)} (MQL at ${threshold})`}>
      <span className="w-8 text-right font-mono text-xs tabular-nums text-foreground">{Math.round(score)}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line/10">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: score >= threshold ? SERIES.mqls : SERIES.leads }} />
        <span className="absolute inset-y-[-2px] w-px bg-foreground/60" style={{ left: `${mark}%` }} />
      </span>
    </div>
  );
};

export const StatTile = ({ label, value, sub, testId }) => (
  <div className="rounded-2xl border border-line/10 bg-card p-5" data-testid={testId}>
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-2 font-display text-3xl font-medium tracking-tight tabular-nums text-foreground">{value ?? "—"}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);

export const Panel = ({ title, sub, action, children, className, testId }) => (
  <section className={cn("min-w-0 rounded-2xl border border-line/10 bg-card p-5 sm:p-6", className)} data-testid={testId}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-base font-medium text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const PERMS = {
  editLeads: ["admin", "sales"],
  editContent: ["admin", "editor"],
  manage: ["admin"],
};
export const useCan = () => {
  const { user } = useAdmin();
  return (action) => !!user && (PERMS[action] || []).includes(user.role);
};

export const ROLE_LABELS = { admin: "Admin", sales: "Sales", editor: "Content editor", viewer: "Leadership (read-only)" };
