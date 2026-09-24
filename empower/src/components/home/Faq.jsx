import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionHead } from "../ui";
import { FAQ } from "@/data/event";

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-muted py-24 md:py-32">
      <div className="container grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <SectionHead eyebrow="FAQ" title="Good to know" lead="Anything else? We're at info@solixempower.com." />
        <ul className="divide-y divide-line/10 border-y border-line/10">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button className="flex w-full items-center justify-between gap-6 py-5 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                  <span className="font-display text-lg font-medium">{f.q}</span>
                  <Plus className={`h-5 w-5 shrink-0 transition ${isOpen ? "rotate-45 text-primary" : "text-muted-foreground"}`} />
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <p className="overflow-hidden leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
