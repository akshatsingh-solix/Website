import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, PlayCircle, Quote } from "lucide-react";
import { Avatar, Logo, Reveal } from "@/components/ui";
import { EVENT, HISTORY, LINKS, PARTNERS } from "@/data/event";

export default function History() {
  useEffect(() => { document.title = `Past events · ${EVENT.name}`; }, []);
  return (
    <>
      <section className="dark relative isolate overflow-hidden bg-ink-950 pb-20 pt-36 text-foreground">
        <div className="glow-field -z-10" aria-hidden />
        <div className="grid-lines absolute inset-0 -z-10 opacity-40" aria-hidden />
        <div className="container max-w-4xl">
          <p className="eyebrow">SOLIXEmpower since 2016</p>
          <h1 className="mt-4 text-fluid-hero font-semibold text-white">A decade of <span className="text-gradient-accent">data</span> conversations</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">From data lakes in New York to Enterprise AI at UC San Diego: the themes, speakers and voices that shaped every Empower.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={LINKS.playlist} target="_blank" rel="noreferrer" className="btn-ghost border-white/20 bg-white/5 text-white hover:bg-white/10"><PlayCircle className="h-4 w-4" />Watch past sessions</a>
            <Link to="/register" className="btn-primary">Join us in 2026 <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="container max-w-5xl">
          <ol className="relative border-l border-line/15 pl-8 md:pl-12">
            {HISTORY.map((h) => (
              <Reveal as="li" key={h.year} className="relative pb-16 last:pb-0">
                <span className="absolute -left-[41px] top-1 grid h-5 w-5 place-items-center rounded-full border-4 border-background bg-primary md:-left-[57px]" />
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <p className="font-display text-5xl font-semibold tracking-tight md:text-6xl">{h.year}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{h.where}{h.when ? ` · ${h.when}` : ""}</p>
                </div>
                {h.theme && <p className="mt-3 font-display text-xl font-medium">{h.theme}</p>}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-3 text-muted-foreground">Topics</p>
                    <div className="flex flex-wrap gap-2">{h.topics.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                    <p className="eyebrow mb-3 mt-6 text-muted-foreground">Speakers included</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">{h.speakers.map((s) => <li key={s}>{s}</li>)}</ul>
                    {h.recording && <a href={h.recording} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue"><PlayCircle className="h-4 w-4" />Watch the {h.year} recordings</a>}
                  </div>
                  {h.quote && (
                    <figure className="surface p-6">
                      <Quote className="h-7 w-7 text-primary/30" />
                      <blockquote className="mt-3 leading-relaxed">"{h.quote.text}"</blockquote>
                      <figcaption className="mt-5 flex items-center gap-3">
                        <Avatar name={h.quote.by} src={h.quote.image} className="h-11 w-11 rounded-full text-sm" />
                        <span className="text-sm"><span className="block font-semibold">{h.quote.by}</span><span className="text-muted-foreground">{h.quote.role}</span></span>
                      </figcaption>
                    </figure>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container">
          <p className="eyebrow mb-6">Partners, academic and media collaborators</p>
          <div className="flex flex-wrap gap-3">{PARTNERS.map((p) => <Logo key={p.name} {...p} />)}</div>
        </div>
      </section>
    </>
  );
}
