import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, SectionHead } from "../ui";
import { SPEAKERS } from "@/data/program";

const GROUPS = [["all", "All speakers"], ["industry", "Industry"], ["academia", "Academia & public sector"], ["solix", "Solix"]];

export default function Speakers() {
  const [group, setGroup] = useState("all");
  const list = SPEAKERS.filter((s) => group === "all" || s.group === group);
  return (
    <section id="speakers" className="bg-background py-24 md:py-32">
      <div className="container">
        <SectionHead eyebrow="Speakers" title="Learn from the people doing the work" lead="CIOs, chief data officers, scientists and researchers from KPMG, JPMorganChase, Pfizer, Bristol Myers Squibb, UC San Diego and more.">
          <div className="flex flex-wrap gap-2">
            {GROUPS.map(([k, l]) => (
              <button key={k} onClick={() => setGroup(k)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${group === k ? "border-foreground bg-foreground text-background" : "border-line/15 text-muted-foreground hover:text-foreground"}`}>
                {l} <span className="ml-1 opacity-60">{k === "all" ? SPEAKERS.length : SPEAKERS.filter((s) => s.group === k).length}</span>
              </button>
            ))}
          </div>
        </SectionHead>
        <motion.ul layout className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5" data-testid="speakers-grid">
          <AnimatePresence>
            {list.map((s) => (
              <motion.li layout key={s.name} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-muted">
                  <Avatar name={s.name} src={s.image} className="aspect-[4/5] w-full grayscale transition duration-500 group-hover:scale-[1.04] group-hover:grayscale-0" />
                  <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-blue-brand transition-transform duration-500 group-hover:scale-x-100" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold leading-tight">{s.name}</p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{s.role.replace(/\s+(at|at the|of the)$/i, "")}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground/80">{s.org}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}
