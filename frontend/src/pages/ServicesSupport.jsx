import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";

export default function ServicesSupport() {
  return (
    <div data-testid="services-support-page">
      <PageHero
        eyebrow="Services & Support"
        crumbs={[{ label: "Services & Support" }]}
        title="Delivery, engineering and support who've done this hundreds of times."
        description="Every Solix program is backed by the same team that builds the platform, an outcomes-based methodology, and a support portal that doesn't leave you guessing."
      >
        <Button asChild size="lg" data-testid="services-hero-contact">
          <Link to="/contact?type=contact">Talk to services <ArrowRight /></Link>
        </Button>
      </PageHero>

      <Section>
        <div className="container">
          <SectionHeading eyebrow="Every engagement" title="Services built around your outcome, not a statement of work." />
          <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <Item key={s.id} className="flex">
                <a href={`#${s.id}`} className="group flex w-full flex-col rounded-2xl border border-white/10 bg-card p-6 card-hover">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-ink-950 text-teal"><s.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                  <h3 className="mt-6 font-display text-lg font-medium">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                </a>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      {SERVICES.map((s, i) => (
        <Section key={s.id} id={s.id} bordered className={i % 2 === 0 ? "bg-ink-900/40" : undefined}>
          <div className="container grid gap-10 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-card text-primary"><s.icon className="h-7 w-7" strokeWidth={1.25} /></span>
              <h3 className="mt-6 font-display text-2xl font-medium">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </Reveal>
            <Stagger className="grid gap-3 lg:col-span-8 lg:grid-cols-2">
              {s.points.map((p, idx) => (
                <Item key={p} className="rounded-xl border border-white/10 bg-card/60 p-5">
                  <span className="font-mono text-xs text-muted-foreground">0{idx + 1}</span>
                  <p className="mt-2 text-sm text-slate-300">{p}</p>
                </Item>
              ))}
            </Stagger>
          </div>
        </Section>
      ))}

      <CTABand eyebrow="Ready to scope a program?" title="Bring one problem. We'll bring the method." secondary={{ label: "See the platform", to: "/platform" }} />
    </div>
  );
}
