// Radar building blocks: strength and status badges, freshness tags, and the
// competitor (red) / problem-word (gold) highlighting the original Leads Radar used.
import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/admin/kit";

export const STRENGTHS = ["Strong", "Medium", "Weak", "Unrated"];
// Validated categorical slots on the dark admin surface (red / amber / slate / ghost).
export const STRENGTH_COLOR = { Strong: "#e5484d", Medium: "#e79d13", Weak: "#7a8894", Unrated: "#4b5563" };
const STRENGTH_TONE = {
  Strong: "border-red-400/40 bg-red-400/10 text-red-200",
  Medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  Weak: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  Unrated: "border-line/15 bg-line/5 text-muted-foreground",
};
export const STATUS_LABELS = {
  new: "New", researching: "Researching", ready: "Ready for outreach", contacted: "Contacted", replied: "Replied", meeting_booked: "Meeting booked",
  opportunity: "Opportunity", won: "Won", lost: "Lost", not_a_fit: "Not a fit", excluded: "Excluded",
};
const STATUS_TONE = {
  ready: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  researching: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  contacted: "border-indigo-400/40 bg-indigo-400/10 text-indigo-200",
  replied: "border-teal/40 bg-teal/10 text-teal",
  meeting_booked: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  opportunity: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  won: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
  excluded: "border-red-400/30 bg-red-400/5 text-red-300",
};
export const SIGNAL_LABELS = {
  competitor_job: "Competitor job", problem_job: "Problem signal", dns: "DNS record", cert: "Certificate", linkedin: "LinkedIn", news: "News",
  filing: "SEC filing", tender: "Public tender", website: "Website intent",
};
export const BASIS_LABELS = { named: "named account", state: "US state", country: "country", needs_routing: "needs routing", manual: "set by hand" };

export const StrengthBadge = ({ strength = "Unrated" }) => <Badge className={STRENGTH_TONE[strength] || STRENGTH_TONE.Unrated}>{strength}</Badge>;
export const AccountStatus = ({ status = "new" }) => <Badge className={STATUS_TONE[status] || "border-line/15 bg-line/5 text-muted-foreground"}>{STATUS_LABELS[status] || status}</Badge>;
export const FreshTag = ({ fresh }) =>
  fresh === "new" ? <Badge className="border-sky-400/50 bg-sky-400/15 text-sky-200">New</Badge> : fresh === "updated" ? <Badge className="border-violet-400/50 bg-violet-400/15 text-violet-200">Updated</Badge> : null;
export const DiveBadge = ({ score, verdictClass }) =>
  score === null || score === undefined ? null : (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]", verdictClass === "ready" ? "border-emerald-400/40 text-emerald-200" : verdictClass === "more" ? "border-amber-400/40 text-amber-200" : "border-line/15 text-muted-foreground")}
      title="Master Prospector deep dive score (6+ is ready for outreach)">
      <b className="font-mono tabular-nums">{score}</b>/10 deep dive
    </span>
  );

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Highlights competitor terms in red and problem words in gold. `terms` comes from /admin/radar/meta. */
export const useHighlighter = (terms) =>
  useMemo(() => {
    if (!terms) return null;
    const comps = new Set(terms.competitors.map((t) => t.toLowerCase()));
    const rx = new RegExp(`(?<![\\w])(${terms.competitors.map(esc).concat(terms.problems).join("|")})(?![\\w])`, "gi");
    return { rx, isComp: (m) => comps.has(m.toLowerCase()) };
  }, [terms]);

export const Highlight = ({ text, hl }) => {
  if (!text) return null;
  if (!hl) return text;
  const out = [];
  let last = 0;
  hl.rx.lastIndex = 0;
  let m;
  while ((m = hl.rx.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<mark key={m.index} className={cn("rounded px-0.5 font-medium", hl.isComp(m[0]) ? "bg-red-500/20 text-red-200" : "bg-amber-400/15 text-amber-200")}>{m[0]}</mark>);
    last = m.index + m[0].length;
    if (!m[0].length) hl.rx.lastIndex++;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
};

export const RepRule = ({ className }) => (
  <p className={cn("text-xs italic text-muted-foreground", className)}>Rep rule: never name the competitor in the first message. Talk about the problem the signal points to.</p>
);

// What the score is made of (radar_model.rollup score_parts).
export const SCORE_PART_LABELS = {
  competitor_job: "Competitor job postings", problem_job: "Problem signals", dns: "DNS records", cert: "Certificates", linkedin: "LinkedIn",
  news: "News", filing: "Filings", tender: "Tenders", website: "Website visits", deep_dive: "Deep dive", other: "Other signals",
};

// The one thing to do next on an account (radar_model.next_action).
export const NextStep = ({ action, className }) => (action ? (
  <span className={`inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200 ${className || ""}`} title={action.why}>
    Next: {action.label}
  </span>
) : null);

// Twelve weekly counts as a tiny line (competitor trend).
export const Sparkline = ({ counts, className }) => {
  const max = Math.max(1, ...counts);
  const pts = counts.map((v, i) => `${(i / Math.max(1, counts.length - 1)) * 60},${16 - (v / max) * 14}`).join(" ");
  return (
    <svg viewBox="0 0 60 18" className={className} aria-hidden="true" width="60" height="18">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
