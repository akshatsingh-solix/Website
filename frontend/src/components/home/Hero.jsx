import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataFlowDiagram } from "./DataFlowDiagram";

const WORDS = ["activates", "governs", "preserves", "unlocks"];
const ease = [0.22, 1, 0.36, 1];

export const Hero = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden" data-testid="home-hero">
      <div className="absolute inset-0 grid-lines" />
      <div className="absolute inset-0 grain" />
      <img src="/images/hero-architecture.jpg" alt="" className="absolute right-0 top-0 h-full w-full object-cover object-right opacity-30 lg:w-3/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/30" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink-950 to-transparent" />
      <div className="absolute -left-40 top-20 h-[560px] w-[560px] rounded-full bg-primary/15 blur-3xl" />

      <div className="container relative grid min-h-[92vh] items-center gap-12 pt-32 pb-20 lg:grid-cols-12 lg:pt-36">
        <div className="lg:col-span-7">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="eyebrow mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-primary" /> Empowering the Data-driven Enterprise
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.08 }}
            className="text-balance text-5xl font-medium leading-[1.02] tracking-tighter sm:text-6xl lg:text-7xl"
          >
            Put AI in the hands of <span className="text-primary">your business.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.18 }} className="mt-7 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Solix{" "}
            <span className="relative inline-block h-[1.625em] w-[5.6ch] overflow-hidden align-top text-teal">
              <AnimatePresence mode="wait">
                <motion.span
                  key={WORDS[i]}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="absolute left-0 top-0 leading-[1.625]"
                  data-testid="hero-rotating-word"
                >
                  {WORDS[i]}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            your enterprise data. Every system. Every era. So the people who know your business can build the solutions they need, inside the trust perimeter IT defines.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.3 }} className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" data-testid="hero-demo-button">
              <Link to="/contact">Request a demo <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" data-testid="hero-explore-button">
              <Link to="/products/enterprise-edition"><Play className="fill-current" /> Explore Enterprise Edition</Link>
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal" strokeWidth={1.5} /> SOC 2 · HIPAA · GDPR ready</span>
            <span className="font-mono tracking-wider">150+ CONNECTORS</span>
            <span className="font-mono tracking-wider">PETABYTE SCALE</span>
            <span className="font-mono tracking-wider">SINCE 2002</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease, delay: 0.25 }}
          className="relative lg:col-span-5"
        >
          <div className="absolute -inset-6 rounded-3xl bg-teal/5 blur-2xl" />
          <div className="glass relative rounded-2xl p-4 shadow-[0_40px_120px_-40px_rgba(0,212,255,0.35)]">
            <div className="mb-3 flex items-center justify-between px-2 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live data fabric</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
                <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" /> streaming
              </span>
            </div>
            <DataFlowDiagram />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
