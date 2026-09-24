import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import { Avatar, Logo, SectionHead } from "../ui";
import { CUSTOMERS, HISTORY, PARTICIPANTS } from "@/data/event";

const QUOTES = HISTORY.filter((h) => h.quote).map((h) => ({ ...h.quote, year: h.year, where: h.where }));
const LOGOS = [...CUSTOMERS, ...PARTICIPANTS.filter((p) => !CUSTOMERS.some((c) => c.name === p.name))];

export default function Legacy() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % QUOTES.length), 7000);
    return () => clearInterval(t);
  }, []);
  const q = QUOTES[i];
  return (
    <section className="overflow-hidden bg-muted py-24 md:py-32">
      <div className="container">
        <SectionHead eyebrow="A decade of Empower" title="Since 2016, from New York to Bangalore to San Diego">
          <Link to="/history" className="btn-ghost shrink-0">Explore past events <ArrowRight className="h-4 w-4" /></Link>
        </SectionHead>
        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" aria-label="Editions">
            {QUOTES.map((x, n) => (
              <li key={x.year}>
                <button onClick={() => setI(n)} className={`whitespace-nowrap rounded-full px-4 py-2 font-mono text-sm transition ${n === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{x.year}</button>
              </li>
            ))}
          </ol>
          <div className="surface min-h-[260px] p-8 md:p-12">
            <Quote className="h-10 w-10 text-primary/30" />
            <AnimatePresence mode="wait">
              <motion.figure key={q.year} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                <blockquote className="mt-4 font-display text-2xl font-medium leading-snug md:text-3xl">"{q.text}"</blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <Avatar name={q.by} src={q.image} className="h-14 w-14 rounded-full text-base" />
                  <span>
                    <span className="block font-semibold">{q.by}</span>
                    <span className="block text-sm text-muted-foreground">{q.role} · Empower {q.year}, {q.where}</span>
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="mt-16">
        <p className="container mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizations that have joined Empower</p>
        <div className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
            {[...LOGOS, ...LOGOS].map((l, n) => <Logo key={n} {...l} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
