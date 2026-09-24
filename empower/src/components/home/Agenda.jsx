import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Coffee, Mic2, Presentation, Trophy, Users, Utensils, Wrench, MapPin, ArrowRight } from "lucide-react";
import { SectionHead } from "../ui";
import { AGENDA } from "@/data/program";

// Session types grouped into a few filters people actually use.
const KINDS = {
  keynote: { label: "Keynotes", match: /Keynote/, Icon: Mic2, tone: "bg-primary/10 text-primary-ink" },
  panel: { label: "Panels", match: /Panel/, Icon: Users, tone: "bg-blue-brand/10 text-blue" },
  workshop: { label: "Workshops", match: /Workshop|Hackathon/, Icon: Wrench, tone: "bg-emerald-500/10 text-emerald-700" },
  social: { label: "Meals & networking", match: /Networking|Break|Lunch|Dinner/, Icon: Coffee, tone: "bg-amber-500/10 text-amber-700" },
};
const kindOf = (type) => Object.keys(KINDS).find((k) => KINDS[k].match.test(type)) || "other";
const iconFor = (type) => (/Dinner|Lunch/.test(type) ? Utensils : /Hackathon/.test(type) ? Trophy : KINDS[kindOf(type)]?.Icon || Presentation);

export default function Agenda() {
  const [day, setDay] = useState(AGENDA[0].id);
  const [kind, setKind] = useState("all");
  const current = AGENDA.find((d) => d.id === day);
  const sessions = useMemo(() => current.sessions.filter((s) => kind === "all" || kindOf(s.type) === kind), [current, kind]);

  return (
    <section id="agenda" className="relative bg-muted py-24 md:py-32">
      <div className="container">
        <SectionHead
          eyebrow="Agenda"
          title="Three days, one conversation"
          lead="Data governance and compliance, cloud data management, generative AI use cases, archive strategy for AI, AI-driven finance, content services, data lakes and more."
        />

        <div role="tablist" aria-label="Conference days" className="grid gap-3 md:grid-cols-3">
          {AGENDA.map((d) => {
            const active = d.id === day;
            return (
              <button
                key={d.id}
                role="tab"
                aria-selected={active}
                onClick={() => setDay(d.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition ${active ? "dark border-transparent bg-ink-950 text-foreground shadow-lift" : "border-line/10 bg-background hover:border-line/25"}`}
                data-testid={`agenda-tab-${d.id}`}
              >
                {active && <div className="glow-field opacity-60" aria-hidden />}
                <div className="relative flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{d.label} · {d.weekday}</span>
                  <span className={`font-display text-2xl font-semibold ${active ? "text-white" : "text-foreground"}`}>{d.date}</span>
                </div>
                <p className={`relative mt-3 text-sm leading-snug ${active ? "text-white/80" : "text-muted-foreground"}`}>{d.theme}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Filter sessions">
          {[["all", "All sessions"], ...Object.entries(KINDS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${kind === k ? "border-foreground bg-foreground text-background" : "border-line/15 bg-background text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.ol key={day + kind} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-8 space-y-3" data-testid="agenda-list">
            {sessions.map((s) => {
              const k = kindOf(s.type);
              const Icon = iconFor(s.type);
              const highlight = k === "keynote" || k === "panel" || k === "workshop";
              return (
                <li key={s.time + s.title} className={`grid gap-3 rounded-2xl border border-line/10 p-5 md:grid-cols-[180px_1fr_auto] md:items-start md:gap-8 md:p-6 ${highlight ? "bg-background shadow-soft" : "bg-background/60"}`}>
                  <p className="font-mono text-sm text-muted-foreground">{s.time}</p>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${KINDS[k]?.tone || "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-3.5 w-3.5" />{s.type}
                    </span>
                    <h3 className={`mt-2.5 font-display font-semibold leading-snug ${highlight ? "text-xl" : "text-lg text-foreground/80"}`}>{s.title}</h3>
                    {s.speakers?.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                        {s.speakers.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{s.room}</p>
                </li>
              );
            })}
            {sessions.length === 0 && <li className="rounded-2xl border border-dashed border-line/20 p-8 text-center text-muted-foreground">No sessions of this kind on {current.label}.</li>}
          </motion.ol>
        </AnimatePresence>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line/10 bg-background p-6 md:flex-row md:items-center">
          <p className="text-sm text-muted-foreground">*This agenda is subject to change. Choose the days and evening receptions you'll join when you register.</p>
          <Link to="/register" className="btn-primary shrink-0">Save my seat <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
