import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowRight, Bot, Check, Database, Lock, RotateCcw, Route, ScanSearch, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/Section";
import { AuroraField, Reveal } from "@/components/shared/Reveal";
import { NeuralField } from "./NeuralField";
import { Picture } from "@/components/shared/Picture";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";
import { useDarkSurface } from "@/components/layout/navTone";

const POINTS = [
  { icon: Lock, title: "Trust perimeter", desc: "Access, masking and retention policies travel with every query, prompt and answer." },
  { icon: ScanSearch, title: "Governed retrieval", desc: "RAG over curated data products, never over raw copies or shadow exports." },
  { icon: Route, title: "Traceable answers", desc: "Every response links back to source records, versions and policy decisions." },
];

// Illustrative sessions. `[[...]]` marks a value the policy engine masks in the answer.
const SESSIONS = [
  {
    q: "Which retired SAP contracts expire in Q3 with auto-renew clauses?",
    checks: ["Access policy: Legal Ops", "PII masked: 2 fields", "Retention honoured", "Lineage attached"],
    sources: ["SAP ECC (retired 2021)", "Contracts vault", "Oracle EBS archive"],
    a: "14 contracts expire in Q3 with auto-renew clauses. The largest is with [[Supplier 0417]], renewing on 30 September. 9 of the 14 were migrated from SAP ECC when it was retired.",
    meta: "1.8s · 3 sources · policy-checked",
  },
  {
    q: "Show patient records past retention that are on legal hold.",
    checks: ["Access policy: Compliance", "PHI masked: 5 fields", "Legal hold respected", "Lineage attached"],
    sources: ["Epic Clarity archive", "Legacy EHR (retired)", "Hold register"],
    a: "212 records are past their retention date but held for litigation [[Case 2024-118]]. They stay preserved and will be released for defensible deletion when the hold lifts.",
    meta: "2.1s · 3 sources · policy-checked",
  },
  {
    q: "Summarize GDPR access requests fulfilled last quarter by region.",
    checks: ["Access policy: Privacy Office", "Personal data masked", "Purpose limitation checked", "Lineage attached"],
    sources: ["DSAR workflow log", "Salesforce", "Email archive"],
    a: "1,284 requests were fulfilled, 91% inside 30 days. EMEA accounted for 62%. Median fulfilment time fell from 11 days to 2 after automation.",
    meta: "1.6s · 3 sources · policy-checked",
  },
];

/** Answer text with masked spans rendered as redaction bars. */
const Answer = ({ text, words, maskedLabel }) => {
  const parts = text.split(/(\[\[.*?\]\])/g);
  let count = 0;
  return (
    <p className="text-[15px] leading-relaxed text-foreground">
      {parts.map((part, i) => {
        const masked = /^\[\[(.*)\]\]$/.exec(part);
        if (masked) {
          const show = count < words;
          count += 1;
          return show ? (
            <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-0.5 inline-flex translate-y-[2px] items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 align-baseline font-mono text-[11px] uppercase tracking-[0.1em] text-primary-ink" title={maskedLabel}>
              <Lock className="h-3 w-3" /> ██████
            </motion.span>
          ) : null;
        }
        const tokens = part.split(/(\s+)/);
        return tokens.map((tok, k) => {
          if (/^\s+$/.test(tok)) return count < words ? tok : null;
          if (!tok) return null;
          const show = count < words;
          count += 1;
          return show ? <span key={`${i}-${k}`}>{tok}</span> : null;
        });
      })}
      {count > words && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-[caret_1s_steps(1)_infinite] bg-primary" />}
    </p>
  );
};

const wordCount = (text) => text.split(/(\[\[.*?\]\])/g).reduce((n, part) => n + (/^\[\[/.test(part) ? 1 : part.split(/\s+/).filter(Boolean).length), 0);

/**
 * The console: a governed question typed in, the policy engine clearing it
 * check by check, sources lighting up, then the answer streaming out with
 * sensitive values redacted. Plays on its own when scrolled into view;
 * visitors can pick another question or replay.
 */
const GovernedConsole = () => {
  const tx = useTx();
  const sessions = useLocalized(SESSIONS);
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const [s, setS] = useState(0);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState({ typed: 0, checks: 0, sources: 0, words: 0, done: false });
  const session = sessions[s];

  useEffect(() => {
    if (!inView) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = wordCount(session.a);
    if (reduce) {
      setPhase({ typed: session.q.length, checks: 4, sources: 3, words: total, done: true });
      return undefined;
    }
    setPhase({ typed: 0, checks: 0, sources: 0, words: 0, done: false });
    const timers = [];
    let t = 200;
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    for (let i = 1; i <= session.q.length; i++) at((t += 22), () => setPhase((p) => ({ ...p, typed: i })));
    t += 350;
    for (let i = 1; i <= 4; i++) at((t += 420), () => setPhase((p) => ({ ...p, checks: i })));
    for (let i = 1; i <= 3; i++) at((t += 220), () => setPhase((p) => ({ ...p, sources: i })));
    t += 250;
    for (let i = 1; i <= total; i++) at((t += 55), () => setPhase((p) => ({ ...p, words: i })));
    at((t += 200), () => setPhase((p) => ({ ...p, done: true })));
    // Move on to the next question after a pause, unless the visitor picked one.
    at(t + 5200, () => setS((n) => (n + 1) % SESSIONS.length));
    return () => timers.forEach(clearTimeout);
  }, [s, run, inView, session.q, session.a]);

  const pick = (i) => { setS(i); setRun((r) => r + 1); };

  return (
    <div ref={ref} className="beam-border relative overflow-hidden rounded-3xl border border-line/10 bg-card/70 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl" data-testid="ai-console">
      <div className="flex items-center justify-between border-b border-line/10 px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-3.5 w-3.5" /></span>
          {tx("Solix Enterprise AI · governed session")}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" /> {tx("live")}
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* Prompt */}
        <div className="rounded-2xl border border-line/10 bg-background/60 px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tx("Question")}</p>
          <p className="mt-1.5 min-h-[3em] text-[15px] text-foreground">
            {session.q.slice(0, phase.typed)}
            {phase.typed < session.q.length && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-[caret_1s_steps(1)_infinite] bg-teal" />}
          </p>
        </div>

        {/* Policy engine */}
        <div className="grid gap-2 sm:grid-cols-2">
          {session.checks.map((c, i) => {
            const state = phase.checks > i ? "ok" : phase.checks === i && phase.typed >= session.q.length ? "run" : "wait";
            return (
              <div key={c} className={cn("relative flex items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-xs transition-[border-color,background-color] duration-300", state === "ok" ? "border-teal/40 bg-teal/10 text-foreground" : "border-line/10 bg-background/40 text-muted-foreground")}>
                {state === "run" && <span className="absolute inset-y-0 left-0 w-1/2 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(0,136,207,0.25),transparent)] bg-[length:200%_100%]" />}
                <span className={cn("relative grid h-5 w-5 shrink-0 place-items-center rounded-full", state === "ok" ? "bg-teal text-white" : "border border-line/20")}>
                  {state === "ok" ? <Check className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3 opacity-50" />}
                </span>
                <span className="relative font-mono uppercase tracking-[0.08em]">{c}</span>
              </div>
            );
          })}
        </div>

        {/* Sources */}
        <div className="flex flex-wrap gap-2">
          {session.sources.map((src, i) => (
            <span key={src} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10.5px] transition-[border-color,color,opacity] duration-500", phase.sources > i ? "border-primary/40 text-foreground opacity-100" : "border-line/10 text-muted-foreground opacity-40")}>
              <Database className={cn("h-3 w-3", phase.sources > i ? "text-primary-ink" : "")} /> {src}
            </span>
          ))}
        </div>

        {/* Answer */}
        <div className="min-h-[7.5rem] rounded-2xl border border-line/10 bg-background/60 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" strokeWidth={1.75} /></span>
            <div className="min-w-0 flex-1">
              {phase.words > 0 ? <Answer text={session.a} words={phase.words} maskedLabel={tx("Masked by policy")} /> : <p className="text-sm text-muted-foreground">{phase.checks > 0 ? tx("Checking policy before answering…") : " "}</p>}
              <AnimatePresence>
                {phase.done && (
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-teal">
                    {session.meta}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Pick a question */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line/10 pt-4">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tx("Try")}</span>
          {sessions.map((x, i) => (
            <button
              key={x.q}
              type="button"
              onClick={() => pick(i)}
              className={cn("max-w-[15rem] truncate rounded-full border px-3 py-1.5 text-left text-xs transition-colors", i === s ? "border-primary/50 bg-primary/10 text-foreground" : "border-line/15 text-muted-foreground hover:border-line/40 hover:text-foreground")}
              data-testid={`ai-console-q${i}`}
            >
              {x.q}
            </button>
          ))}
          <button type="button" onClick={() => setRun((r) => r + 1)} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-line/15 text-muted-foreground transition-colors hover:border-primary hover:text-foreground" aria-label={tx("Replay")} data-testid="ai-console-replay">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/** Chapter 06, the second navy moment: governed AI, shown working. */
export const AISection = () => {
  const tx = useTx();
  const points = useLocalized(POINTS);
  const ref = useRef(null);
  useDarkSurface(ref);
  return (
    <section ref={ref} className="dark relative overflow-hidden bg-background py-20 text-foreground sm:py-24 lg:py-32" id="enterprise-ai" data-testid="ai-section">
      {/* The rendered neural globe (scripts/art/lattice.frag) sits behind the
          glass console, so it glows through the console's blur. */}
      <Picture src="/Website/images/key-lattice.jpg" sizes="100vw" alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_50%] opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
      <div className="absolute inset-0 grid-lines grid-fade opacity-60" />
      <AuroraField />
      <NeuralField className="pointer-events-none absolute -left-40 top-10 hidden h-[640px] w-[680px] opacity-25 lg:block" />
      <div className="container relative grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <SectionHeading chapter="04" eyebrow="Enterprise AI" title="AI your risk team will sign off on." description="Most AI programs stall at governance. Solix starts there. Business builders compose agents and copilots on data products IT has already curated, classified and secured." />
          <div className="mt-10 grid gap-3">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={0.08 * i} className="spot relative flex gap-4 rounded-2xl border border-line/10 bg-card/50 p-4 transition-colors duration-300 hover:bg-card">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/15 text-teal"><p.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                <div>
                  <h3 className="font-display text-base font-medium sm:text-lg">{p.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" data-testid="ai-section-learn">
              <Link to="/products/enterprise-ai">{tx("Explore Enterprise AI")} <ArrowRight /></Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("solix:open-chat"))} data-testid="ai-section-try-chat">
              <Bot /> {tx("Try our AI concierge")}
            </Button>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-7">
          <GovernedConsole />
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{tx("Illustrative session. Your data, your policies.")}</p>
        </Reveal>
      </div>
    </section>
  );
};
