import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/data/site";
import { Section, ChapterMark } from "@/components/shared/Section";
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
    <Section className="overflow-hidden bg-muted" id="proof">
      <div className="container">
        <Reveal className="grid gap-10 lg:grid-cols-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="lg:col-span-3">
            <ChapterMark n="08" label="Customer outcomes" />
            <p className="font-display text-2xl font-medium leading-tight tracking-tight text-foreground sm:text-3xl">In their words.</p>
            <div className="mt-10 flex items-center gap-2">
              <button onClick={() => setI((i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} aria-label="Previous testimonial" data-testid="testimonial-prev" className="grid h-10 w-10 place-items-center rounded-full border border-line/15 bg-background transition-colors hover:border-primary/40 hover:text-primary-ink">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setI((i + 1) % TESTIMONIALS.length)} aria-label="Next testimonial" data-testid="testimonial-next" className="grid h-10 w-10 place-items-center rounded-full border border-line/15 bg-background transition-colors hover:border-primary/40 hover:text-primary-ink">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex gap-1.5">
              {TESTIMONIALS.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Go to testimonial ${idx + 1}`} className={cn("h-1 rounded-full transition-[width,background-color] duration-300", idx === i ? "w-8 bg-primary" : "w-3 bg-line/20")} />
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-line/10 bg-card p-7 shadow-soft sm:p-10 lg:col-span-9">
            <Quote className="absolute right-6 top-6 h-16 w-16 text-primary/10 sm:h-20 sm:w-20" strokeWidth={1} />
            <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-teal" />
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                data-testid="testimonial-quote"
              >
                <p className="relative text-balance font-display text-2xl font-light leading-snug tracking-tight text-foreground sm:text-3xl lg:text-[2.1rem]">“{t.quote}”</p>
                <footer className="mt-8 flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-teal/10 font-mono text-xs font-semibold text-teal">{t.role.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>
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
