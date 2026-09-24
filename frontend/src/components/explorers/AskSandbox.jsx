import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Brain, Check, Database, FileSearch, Lock, Network, Send, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { ExplorerShell, Segmented, prefillLead, useExplorerTracking } from "./kit";
import { DATASETS, DEFAULT_DATASET, ROLES } from "./askData";

const STEPS = [
  { key: "intent", Icon: Brain, label: "Understood the question" },
  { key: "graph", Icon: Network, label: "Mapped it to your systems with the Application Knowledge Graph" },
  { key: "query", Icon: Database, label: "Ran a governed query" },
  { key: "policy", Icon: ShieldCheck, label: "Applied your access and privacy policies" },
  { key: "answer", Icon: FileSearch, label: "Answered, with sources" },
];

const match = (text, questions) => {
  const words = text.toLowerCase();
  let best = null;
  let score = 0;
  for (const q of questions) {
    const s = q.keywords.reduce((n, k) => n + (words.includes(k) ? 1 : 0), 0);
    if (s > score) { score = s; best = q; }
  }
  return best;
};

export default function AskSandbox({ product }) {
  const tx = useTx();
  const [datasetId, setDatasetId] = useState(DEFAULT_DATASET[product.slug] || "finance");
  const [role, setRole] = useState("analyst");
  const [input, setInput] = useState("");
  const [run, setRun] = useState(null); // { question, step, custom }
  const timers = useRef([]);
  const engaged = useExplorerTracking("ask-sandbox", useMemo(() => [product.slug], [product.slug]));
  const dataset = DATASETS.find((d) => d.id === datasetId);
  const roleInfo = ROLES.find((r) => r.id === role);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { setRun(null); }, [datasetId]);

  const ask = (question, custom) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRun({ question, step: 0, custom });
    STEPS.forEach((_, i) => timers.current.push(setTimeout(() => setRun((r) => r && { ...r, step: i + 1 }), 550 * (i + 1))));
    engaged(question ? question.q : "custom");
  };
  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = match(input, dataset.questions);
    ask(q, input.trim());
    setInput("");
  };

  const q = run?.question;
  const done = run && run.step >= STEPS.length;
  const maskCol = (col) => q?.pii?.length && (col === "Customer" || col === "Patient" || col === "Customer contact" || col === "Participant ID");
  const cell = (v, col) => {
    if (role === "executive" && maskCol(col)) return "•••";
    if (role !== "auditor" && col === "Patient") return `Patient ${String(v).slice(-2).padStart(4, "•")}`;
    return typeof v === "number" ? v.toLocaleString() : tx(String(v));
  };

  return (
    <ExplorerShell title={tx("Ask your enterprise data a question")} subtitle={tx("Pick an industry and a role, then ask. This sandbox uses fictional sample data to show how {{name}} answers on governed enterprise data.", { name: product.name })} testId="explorer-ask">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented options={DATASETS.map((d) => ({ value: d.id, label: tx(d.label) }))} value={datasetId} onChange={setDatasetId} testId="ask-dataset" />
        <Segmented size="sm" options={ROLES.map((r) => ({ value: r.id, label: tx(r.label) }))} value={role} onChange={(v) => { setRole(v); engaged(`role:${v}`); }} testId="ask-role" />
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5 text-teal" />{tx(roleInfo.rule)}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tx("Connected systems")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dataset.systems.map((s) => <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-line/10 bg-muted px-3 py-1 text-xs"><Database className="h-3 w-3 text-teal" />{tx(s)}</span>)}
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tx("Try asking")}</p>
          <div className="mt-2 space-y-2">
            {dataset.questions.map((x) => (
              <button key={x.q} type="button" onClick={() => ask(x)} className={cn("w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors", q === x ? "border-primary/50 bg-primary/5" : "border-line/10 hover:border-line/30 hover:bg-muted")} data-testid="ask-suggestion">
                {tx(x.q)}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={tx("Or type your own question…")} aria-label={tx("Your question")} className="h-11 min-w-0 flex-1 rounded-xl border border-line/15 bg-background px-4 text-sm outline-none focus:border-primary/60" data-testid="ask-input" />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label={tx("Ask")}><Send /></Button>
          </form>
        </div>

        <div className="min-h-[340px] rounded-2xl border border-line/10 bg-muted/50 p-4 sm:p-5 lg:col-span-7" aria-live="polite">
          {!run && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <Sparkles className="mx-auto h-8 w-8 text-primary/60" />
                <p className="mt-3 max-w-xs text-sm text-muted-foreground">{tx("Choose a question to watch the answer being built, step by step.")}</p>
              </div>
            </div>
          )}
          {run && (
            <div>
              <p className="rounded-xl bg-background px-4 py-3 text-sm font-medium shadow-sm">{run.custom ? run.custom : tx(q.q)}</p>
              <ol className="mt-4 space-y-2">
                {STEPS.map(({ key, Icon, label }, i) => (
                  <AnimatePresence key={key}>
                    {run.step > i && (
                      <motion.li initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal/15 text-teal"><Icon className="h-3 w-3" /></span>
                        <span className="pt-0.5">
                          {tx(label)}
                          {key === "graph" && q && <span className="ml-1 font-mono text-[11px] text-foreground/70">{q.tables.map((t) => tx(t)).join(" · ")}</span>}
                          {key === "policy" && q && (q.pii.length ? <span className="ml-1 text-foreground/70">{tx("Masked for this role:")} {q.pii.map((p) => tx(p)).join(", ")}</span> : <span className="ml-1 text-foreground/70">{tx("No personal data in this answer.")}</span>)}
                        </span>
                      </motion.li>
                    )}
                  </AnimatePresence>
                ))}
              </ol>
              {done && q && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4" data-testid="ask-answer">
                  <p className="text-sm leading-relaxed">{tx(q.answer)}</p>
                  {role !== "executive" && (
                    <div className="mt-3 overflow-x-auto rounded-xl border border-line/10 bg-background">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="border-b border-line/10 text-muted-foreground">{q.columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{tx(c)}</th>)}</tr></thead>
                        <tbody>{q.rows.map((row, ri) => <tr key={ri} className="border-b border-line/5 last:border-0">{row.map((v, ci) => <td key={ci} className="px-3 py-2 tabular-nums">{cell(v, q.columns[ci])}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                  {role === "auditor" && <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0D192D] p-3 font-mono text-[11px] leading-relaxed text-sky-100">{q.sql}</pre>}
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Check className="h-3 w-3 text-teal" />{tx("Sources:")} {dataset.systems.map((s) => tx(s)).join(", ")}</p>
                </motion.div>
              )}
              {done && !q && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm leading-relaxed">
                  <p>{tx("That's a great question for your own data. This sandbox only has a few sample scenarios, but in your environment {{name}} answers questions like this across all your connected systems, with the same governance.", { name: product.name })}</p>
                </motion.div>
              )}
              {done && (
                <Button size="sm" variant="outline" className="mt-4" onClick={() => prefillLead(tx("I tried the {{name}} sandbox and would like to see it on our data. Question: {{q}}", { name: product.name, q: run.custom || tx(q.q) }))} data-testid="ask-cta">
                  {tx("Ask this on your data")} <ArrowRight />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </ExplorerShell>
  );
}
