import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/site";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/intent";
import { useTx } from "@/i18n/tx";

// Each answer adds weight to the products that solve it.
const QUESTIONS = [
  {
    id: "goal", q: "What do you most want to achieve?",
    options: [
      { id: "cost", label: "Cut infrastructure and licence costs", w: { "enterprise-archiving": 3, "database-archiving": 2, "file-archiving": 2, "active-archiving-compliance": 1 } },
      { id: "retire", label: "Retire legacy applications", w: { "application-retirement": 4, "data-preservation": 2, "mainframe-archiving": 1 } },
      { id: "privacy", label: "Meet privacy and compliance rules", w: { "consumer-data-privacy": 3, "enterprise-data-governance": 3, "ediscovery": 2, "ai-governance": 1 } },
      { id: "ai", label: "Put AI to work on our data", w: { "enterprise-ai": 3, "data-ask": 3, "data-sense": 2, "agentic": 2, "application-knowledge-graph": 2, "eai-pharma": 1, "ai-healthcare": 1 } },
      { id: "cloud", label: "Modernise onto one cloud data platform", w: { "enterprise-edition": 3, "common-data-platform": 3, "enterprise-data-lake": 2, "ai-warehouse": 2 } },
      { id: "content", label: "Manage documents and content", w: { "enterprise-content-services": 4, "email-archiving": 2, "ediscovery": 1 } },
    ],
  },
  {
    id: "systems", q: "Where does most of that data live today?",
    options: [
      { id: "sap", label: "SAP", w: { "sap-archiving": 4, "application-retirement": 1 } },
      { id: "oracle", label: "Oracle E-Business Suite", w: { "oracle-oebs-archiving": 4, "application-retirement": 1 } },
      { id: "mainframe", label: "Mainframe", w: { "mainframe-archiving": 4, "data-preservation": 1 } },
      { id: "files", label: "Email, files and documents", w: { "email-archiving": 3, "file-archiving": 3, "enterprise-content-services": 2 } },
      { id: "databases", label: "Many databases and custom apps", w: { "database-archiving": 3, "common-data-platform": 2, "application-knowledge-graph": 1 } },
      { id: "cloudstack", label: "Cloud warehouses and lakes", w: { "enterprise-data-lake": 3, "ai-warehouse": 3 } },
    ],
  },
  {
    id: "industry", q: "Which industry are you in?",
    options: [
      { id: "fs", label: "Financial services & insurance", w: { "consumer-data-privacy": 1, "enterprise-data-governance": 1, "ediscovery": 1 } },
      { id: "health", label: "Healthcare", w: { "ai-healthcare": 5, "data-preservation": 1 } },
      { id: "pharma", label: "Pharma & life sciences", w: { "eai-pharma": 5, "data-preservation": 1 } },
      { id: "mfg", label: "Manufacturing & energy", w: { "sap-archiving": 1, "application-retirement": 1 } },
      { id: "public", label: "Government & public sector", w: { "data-preservation": 2, "ediscovery": 1 } },
      { id: "other", label: "Other", w: {} },
    ],
  },
];

export const ProductFinder = () => {
  const tx = useTx();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const finished = step >= QUESTIONS.length;

  const results = useMemo(() => {
    // The goal counts double; systems and industry refine it, and count half
    // for products that don't serve the goal at all.
    const goal = QUESTIONS[0].options.find((o) => o.id === answers.goal)?.w || {};
    const score = {};
    Object.entries(goal).forEach(([slug, w]) => { score[slug] = w * 2; });
    QUESTIONS.slice(1).forEach((q) => {
      const opt = q.options.find((o) => o.id === answers[q.id]);
      Object.entries(opt?.w || {}).forEach(([slug, w]) => { score[slug] = (score[slug] || 0) + (goal[slug] ? w : w / 2); });
    });
    const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = top[0]?.[1] || 1;
    return top.map(([slug, s]) => ({ product: PRODUCTS.find((p) => p.slug === slug), match: Math.round(70 + (s / max) * 28) })).filter((r) => r.product);
  }, [answers]);

  const choose = (qid, oid) => {
    setAnswers((a) => ({ ...a, [qid]: oid }));
    setStep((s) => s + 1);
    track("engaged", { meta: { explorer: "product-finder", action: `${qid}:${oid}` } });
  };
  const reset = () => { setAnswers({}); setStep(0); };
  const q = QUESTIONS[step];

  return (
    <div className="overflow-hidden rounded-3xl border border-line/10 bg-card shadow-soft" data-testid="product-finder">
      <div className="flex items-center justify-between gap-3 border-b border-line/10 px-5 py-4 sm:px-7">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-ink"><Sparkles className="h-3.5 w-3.5" /> {tx("Product finder")}</p>
        <div className="flex gap-1.5" aria-hidden>
          {QUESTIONS.map((x, i) => <span key={x.id} className={cn("h-1.5 w-8 rounded-full", i < step || finished ? "bg-primary" : i === step ? "bg-primary/40" : "bg-line/15")} />)}
        </div>
      </div>
      <div className="min-h-[320px] p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <p className="font-mono text-xs text-muted-foreground">{tx("Question {{n}} of {{t}}", { n: step + 1, t: QUESTIONS.length })}</p>
              <h3 className="mt-2 font-display text-2xl font-medium tracking-tight">{tx(q.q)}</h3>
              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {q.options.map((o) => (
                  <button key={o.id} type="button" onClick={() => choose(q.id, o.id)} className={cn("rounded-2xl border px-4 py-4 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft", answers[q.id] === o.id ? "border-primary/60 bg-primary/5" : "border-line/10 bg-background")} data-testid="finder-option">
                    {tx(o.label)}
                  </button>
                ))}
              </div>
              {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{tx("Back")}</button>}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} data-testid="finder-results">
              <h3 className="font-display text-2xl font-medium tracking-tight">{tx("Your best matches")}</h3>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {results.map(({ product, match }, i) => (
                  <motion.div key={product.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={cn("flex flex-col rounded-2xl border p-5", i === 0 ? "border-primary/40 bg-primary/5" : "border-line/10 bg-background")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{tx(product.category)}</span>
                      <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[11px] text-background">{match}%</span>
                    </div>
                    <p className="mt-3 font-display text-lg font-medium">{product.name}</p>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{product.tagline}</p>
                    <Link to={`/products/${product.slug}#explore`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-ink hover:underline" data-testid="finder-result-link">{tx("Explore it")} <ArrowRight className="h-4 w-4" /></Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {results[0] && <Button asChild><Link to={`/contact?type=demo&interest=${results[0].product.slug}`}>{tx("Talk to an expert about these")} <ArrowRight /></Link></Button>}
                <Button variant="outline" onClick={reset}><RotateCcw /> {tx("Start again")}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
