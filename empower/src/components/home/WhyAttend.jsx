import { Megaphone, Network, ShieldCheck, Sparkles, Sun, Users } from "lucide-react";
import { Reveal, SectionHead } from "../ui";
import { EVENT, WHY } from "@/data/event";

const ICONS = { Sparkles, ShieldCheck, Network, Users, Megaphone, Sun };

export default function WhyAttend() {
  return (
    <section id="why" className="relative bg-background py-24 md:py-32">
      <div className="container">
        <SectionHead
          eyebrow="Why attend"
          title={<>Where data management becomes the lynchpin for <span className="text-primary">Enterprise AI</span></>}
          lead="Gain insights on enterprise data management and generative AI through user training, demonstrations and product announcements, and learn from leaders in industry and academia why data is the foundation for every AI innovation, now and into the future."
        />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-line/10 bg-line/10 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w, i) => {
            const Icon = ICONS[w.icon] || Sparkles;
            return (
              <Reveal key={w.title} delay={(i % 3) * 0.06} className="group relative bg-background p-8 transition hover:bg-muted">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{w.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted-foreground">{w.text}</p>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="mt-10 rounded-2xl border border-line/10 bg-muted px-6 py-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Academic partners. </span>{EVENT.hosts}
        </Reveal>
      </div>
    </section>
  );
}
