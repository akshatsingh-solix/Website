// Shared admin building blocks: labels, badges, score bars, tiles, role checks.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/components/admin/AdminAuth";
import { CountUp, EASE, Reveal, Sparkline } from "@/components/admin/motion";

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
export const CHANNEL_LABELS = { paid: "Paid", organic_search: "Organic search", social: "Social", email: "Email", referral: "Referral", chat: "Concierge chat", outbound: "Outbound (Radar)", direct: "Direct" };

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
  const reduce = useReducedMotion();
  const pct = Math.min(100, (score / Math.max(threshold * 1.6, 1)) * 100);
  const mark = Math.min(100, (threshold / Math.max(threshold * 1.6, 1)) * 100);
  const hot = score >= threshold;
  return (
    <div className="flex min-w-[110px] items-center gap-2" title={`Score ${Math.round(score)} (MQL at ${threshold})`}>
      <span className="w-8 text-right font-mono text-xs tabular-nums text-foreground">{Math.round(score)}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line/10">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: hot ? `linear-gradient(90deg, ${SERIES.leads}, ${SERIES.mqls})` : SERIES.leads, boxShadow: hot ? `0 0 10px ${SERIES.mqls}` : "none" }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: EASE }}
        />
        <span className="absolute inset-y-[-2px] w-px bg-foreground/60" style={{ left: `${mark}%` }} />
      </span>
    </div>
  );
};

/**
 * KPI tile: glass card with a counting value, an optional sparkline and a
 * soft accent glow that brightens on hover. `accent` is any CSS colour.
 */
export const StatTile = ({ label, value, sub, testId, spark, accent = SERIES.leads, icon: Icon, delta }) => (
  <div className="spot admin-glass admin-lift relative h-full overflow-hidden rounded-2xl p-5" data-testid={testId}>
    <span className="admin-tile-glow" style={{ background: accent }} aria-hidden="true" />
    <div className="relative flex items-start justify-between gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      {Icon && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line/10 bg-line/5" style={{ color: accent }}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      )}
    </div>
    <div className="relative mt-2 flex items-baseline gap-2">
      <CountUp value={value} className="font-display text-3xl font-medium tracking-tight text-foreground" />
      {delta != null && delta !== 0 && (
        <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[10px]", delta > 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300")}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
      )}
    </div>
    {sub && <p className="relative mt-1 text-xs text-muted-foreground">{sub}</p>}
    {spark && <Sparkline data={spark} color={accent} height={30} className="relative mt-3" />}
  </div>
);

export const Panel = ({ title, sub, action, children, className, testId }) => (
  <Reveal as="section" className={cn("admin-glass min-w-0 rounded-2xl p-5 sm:p-6", className)} data-testid={testId}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-base font-medium text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </Reveal>
);

/** Horizontal single-series bar list with values; readable as a table too. Bars grow in. */
export const BarList = ({ rows, valueKey, labelKey, color = SERIES.leads, format = (v) => v, testId, linkFor }) => {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...rows.map((r) => r[valueKey] || 0));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data in this period yet.</p>;
  return (
    <ul className="space-y-3" data-testid={testId}>
      {rows.map((r, i) => {
        const label = r[labelKey];
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{format(r[valueKey] || 0, r)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/[0.07]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 12px -2px ${color}` }}
                initial={reduce ? false : { width: 0 }}
                whileInView={{ width: `${((r[valueKey] || 0) / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.05 * i }}
              />
            </div>
          </>
        );
        const to = linkFor?.(r);
        return <li key={label}>{to ? <Link to={to} className="block rounded-md transition-opacity hover:opacity-80">{inner}</Link> : inner}</li>;
      })}
    </ul>
  );
};

const PERMS = {
  editLeads: ["admin", "sales"],
  editContent: ["admin", "editor"],
  manage: ["admin"],
  comply: ["admin", "compliance"],
  suppress: ["admin", "compliance", "sales"],
};
export const useCan = () => {
  const { user } = useAdmin();
  return (action) => !!user && (PERMS[action] || []).includes(user.role);
};

export const ROLE_LABELS = { admin: "Admin", sales: "Sales", editor: "Content editor", viewer: "Leadership (read-only)", compliance: "Compliance" };

// Re-runs `refresh` every `ms` while this admin tab is visible, and as soon as
// it becomes visible again, so new leads (e.g. from Sol chats) appear without
// reloading. `refresh` should update data silently (no loading state).
export const LIVE_REFRESH_MS = 15000;
export const useLiveRefresh = (refresh, ms = LIVE_REFRESH_MS) => {
  const ref = useRef(refresh);
  ref.current = refresh;
  useEffect(() => {
    const run = () => document.visibilityState === "visible" && Promise.resolve(ref.current()).catch(() => {});
    const id = setInterval(run, ms);
    document.addEventListener("visibilitychange", run);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", run);
    };
  }, [ms]);
};
