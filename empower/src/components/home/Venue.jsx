import { Car, MapPin, Navigation, Utensils } from "lucide-react";
import { Reveal, SectionHead } from "../ui";
import { AGENDA } from "@/data/program";
import { EVENT, LINKS } from "@/data/event";

const dinners = AGENDA.flatMap((d) => d.sessions.filter((s) => s.type === "Dinner").map((s) => ({ ...s, date: d.date })));

export default function Venue() {
  return (
    <section id="venue" className="bg-background py-24 md:py-32">
      <div className="container">
        <SectionHead eyebrow="Venue" title="Get directions to the event" />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Reveal className="surface flex flex-col p-8">
            <MapPin className="h-7 w-7 text-primary" />
            <h3 className="mt-5 text-2xl font-semibold">{EVENT.venue}</h3>
            <p className="mt-1 text-muted-foreground">Atkinson Hall, University of California San Diego</p>
            <p className="mt-5 leading-relaxed text-muted-foreground">The Qualcomm Institute is in Atkinson Hall on the UC San Diego campus, at the corner of Voigt Drive and Equality Lane.</p>
            <p className="mt-3 font-medium">{EVENT.address}</p>
            <div className="mt-6 space-y-4 border-t border-line/10 pt-6 text-sm">
              <p className="flex gap-3"><Car className="h-5 w-5 shrink-0 text-blue" /><span>Visitor parking is in UC San Diego's Hopkins Parking Structure. <a className="font-medium text-blue underline-offset-4 hover:underline" href={LINKS.parking} target="_blank" rel="noreferrer">Parking directions</a></span></p>
              {dinners.map((d) => (
                <p key={d.title} className="flex gap-3"><Utensils className="h-5 w-5 shrink-0 text-blue" /><span><span className="font-medium">{d.date}, {d.time.split(" - ")[0]}:</span> {d.title} at {d.room}</span></p>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <a href={LINKS.maps} target="_blank" rel="noreferrer" className="btn-primary"><Navigation className="h-4 w-4" />Get directions</a>
              <a href={`mailto:${EVENT.email}`} className="btn-ghost">Ask a question</a>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="overflow-hidden rounded-2xl border border-line/10 bg-muted">
            <iframe title="Map of the Qualcomm Institute, UC San Diego" src={LINKS.mapEmbed} className="h-full min-h-[380px] w-full grayscale-[0.3]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
