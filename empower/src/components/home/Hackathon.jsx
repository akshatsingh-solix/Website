import { ArrowUpRight, Code2, Trophy } from "lucide-react";
import { Reveal } from "../ui";
import { LINKS } from "@/data/event";

export default function Hackathon() {
  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container">
        <Reveal className="relative overflow-hidden rounded-[32px] border border-line/10 bg-gradient-to-br from-tint-blue via-background to-background p-8 md:p-14">
          <div className="grid-lines absolute inset-0 opacity-70 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden />
          <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="eyebrow mb-4">SOLIXEmpower Hackathon</p>
              <h2 className="text-fluid-h3 font-semibold">Hackathon finals close the conference on October 30.</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Winners are announced live in the Theater before the closing lunch. Find the challenge, team sign-up and rules on the hackathon site, and let us know you're taking part when you register.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={LINKS.hackathon} target="_blank" rel="noreferrer" className="btn-primary">Hackathon details <ArrowUpRight className="h-4 w-4" /></a>
                <span className="chip"><Code2 className="h-3.5 w-3.5" />Tick "hackathon" when you register</span>
              </div>
            </div>
            <div className="relative mx-auto grid h-56 w-56 place-items-center">
              <div className="absolute inset-0 animate-[spin_30s_linear_infinite] rounded-full border border-dashed border-primary/40" />
              <div className="absolute inset-6 animate-[spin_22s_linear_infinite_reverse] rounded-full border border-dashed border-blue-brand/40" />
              <div className="grid h-28 w-28 place-items-center rounded-full bg-ink-950 text-white shadow-lift"><Trophy className="h-12 w-12 text-primary" /></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
