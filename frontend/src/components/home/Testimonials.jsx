import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/data/site";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";

export const Testimonials = () => {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % TESTIMONIALS.length), 7000);
    return () => clearInterval(t);
  }, [paused]);

  const t = TESTIMONIALS[i];

  return (
    <Section bordered className="overflow-hidden bg-ink-900/40">
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="container">
        <Reveal className="grid gap-10 lg:grid-cols-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="lg:col-span-3">
            <p className="eyebrow mb-4">Customer outcomes</p>
            <Quote className="h-10 w-10 text-primary/60" strokeWidth={1} />
            <div className="mt-10 flex items-center gap-2">
              <button onClick={() => setI((i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} aria-label="Previous testimonial" data-testid="testimonial-prev" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-white/40 hover:bg-white/5">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setI((i + 1) % TESTIMONIALS.length)} aria-label="Next testimonial" data-testid="testimonial-next" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-white/40 hover:bg-white/5">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex gap-1.5">
              {TESTIMONIALS.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Go to testimonial ${idx + 1}`} className={cn("h-1 rounded-full transition-[width,background-color] duration-300", idx === i ? "w-8 bg-primary" : "w-3 bg-white/20")} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                data-testid="testimonial-quote"
              >
                <p className="text-balance font-display text-2xl font-light leading-snug tracking-tight text-slate-100 sm:text-3xl lg:text-4xl">“{t.quote}”</p>
                <footer className="mt-8 flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-ink-950 font-mono text-xs text-teal">{t.role.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                  <div>
                    <p className="text-sm font-medium">{t.role}</p>
                    <p className="text-xs text-muted-foreground">{t.org}</p>
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};
