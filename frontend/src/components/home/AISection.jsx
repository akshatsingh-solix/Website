import { Link } from "react-router-dom";
import { ArrowRight, Bot, Lock, Route, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { NeuralField } from "./NeuralField";

const POINTS = [
  { icon: Lock, title: "Trust perimeter", desc: "Access, masking and retention policies travel with every query, prompt and answer." },
  { icon: ScanSearch, title: "Governed retrieval", desc: "RAG over curated data products, never over raw copies or shadow exports." },
  { icon: Route, title: "Traceable answers", desc: "Every response links back to source records, versions and policy decisions." },
];

export const AISection = () => (
  <Section bordered className="overflow-hidden">
    <div className="container grid items-center gap-14 lg:grid-cols-12">
      <Reveal blur className="group relative lg:col-span-6">
        <div className="absolute -inset-10 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-ink-950">
          <div className="grid-lines absolute inset-0 opacity-30" />
          <NeuralField className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
          <div className="glass absolute bottom-5 left-5 right-5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary"><Bot className="h-5 w-5" strokeWidth={1.5} /></span>
              <div className="flex-1 text-sm">
                <p className="text-slate-200">“Which retired SAP contracts expire in Q3 with auto-renew clauses?”</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-teal">answered from 3 preserved systems · policy-checked</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
      <div className="lg:col-span-6">
        <Reveal>
          <p className="eyebrow mb-4">Enterprise AI</p>
          <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">AI your risk team will sign off on.</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Most AI programs stall at governance. Solix starts there. Business builders compose agents and copilots on data products IT has already curated, classified and secured.
          </p>
        </Reveal>
        <div className="mt-10 space-y-6">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} delay={0.08 * i} className="flex gap-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-card text-teal"><p.icon className="h-5 w-5" strokeWidth={1.5} /></span>
              <div>
                <h3 className="font-display text-lg font-medium">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
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
  </Section>
);
