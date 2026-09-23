import { Link } from "react-router-dom";
import { ArrowRight, Bot, Check, Lock, Route, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/Section";
import { AuroraField, Reveal } from "@/components/shared/Reveal";
import { NeuralField } from "./NeuralField";

const POINTS = [
  { icon: Lock, title: "Trust perimeter", desc: "Access, masking and retention policies travel with every query, prompt and answer." },
  { icon: ScanSearch, title: "Governed retrieval", desc: "RAG over curated data products, never over raw copies or shadow exports." },
  { icon: Route, title: "Traceable answers", desc: "Every response links back to source records, versions and policy decisions." },
];

const CHECKS = ["Access policy", "PII masked", "Retention honoured", "Lineage attached"];

/** Chapter 06, the second navy moment: governed AI, shown working. */
export const AISection = () => (
  <section className="dark relative overflow-hidden bg-background py-16 text-foreground sm:py-20 lg:py-24" id="enterprise-ai" data-testid="ai-section">
    <div className="absolute inset-0 grid-lines grid-fade" />
    <AuroraField />
    <div className="container relative grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
      <Reveal className="group relative lg:col-span-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line/10 bg-background shadow-[0_60px_120px_-50px_rgba(0,0,0,0.85)]">
          <img src="/Website/images/ai-neural.jpg" alt="Neural network of governed enterprise data" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
          <NeuralField className="absolute inset-0 h-full w-full opacity-60 mix-blend-screen" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/85 to-transparent" />

          <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-1.5 sm:left-5 sm:top-5">
            {CHECKS.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full border border-line/15 bg-background/70 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-foreground backdrop-blur animate-fade-up" style={{ animationDelay: `${0.4 + i * 0.25}s` }}>
                <Check className="h-3 w-3 text-teal" /> {c}
              </span>
            ))}
          </div>

          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-line/15 bg-background/80 p-4 backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" strokeWidth={1.5} /></span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-foreground">“Which retired SAP contracts expire in Q3 with auto-renew clauses?”</p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-teal">answered from 3 preserved systems · policy-checked</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="lg:col-span-6">
        <SectionHeading chapter="06" eyebrow="Enterprise AI" title="AI your risk team will sign off on." description="Most AI programs stall at governance. Solix starts there. Business builders compose agents and copilots on data products IT has already curated, classified and secured." />
        <div className="mt-10 grid gap-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} delay={0.08 * i} className="flex gap-4 rounded-2xl border border-line/10 bg-card/50 p-4 transition-colors duration-300 hover:border-teal/40 hover:bg-card">
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
            <Link to="/products/enterprise-ai">Explore Enterprise AI <ArrowRight /></Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("solix:open-chat"))} data-testid="ai-section-try-chat">
            <Bot /> Try our AI concierge
          </Button>
        </Reveal>
      </div>
    </div>
  </section>
);
