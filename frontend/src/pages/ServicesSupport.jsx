import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { InlineLeadSection } from "@/components/forms/InlineLeadSection";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";

export default function ServicesSupport() {
  const tx = useTx();
  return (
    <div data-testid="services-support-page">
      <PageHero
        eyebrow="Services & Support"
        crumbs={[{ label: "Services & Support" }]}
        title="Delivery, engineering and support who've done this hundreds of times."
        description="Every Solix program is backed by the same team that builds the platform, an outcomes-based methodology, and a support portal that doesn't leave you guessing."
      >
        <Button asChild size="lg" data-testid="services-hero-contact">
          <a href="#talk-to-us" onClick={(e) => { e.preventDefault(); document.getElementById("talk-to-us")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{tx("Talk to services")} <ArrowRight /></a>
        </Button>
      </PageHero>

      <Section>
        <div className="container">
          <SectionHeading eyebrow="Every engagement" title="Services built around your outcome, not a statement of work." />
          <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <Item key={s.id} className="flex">
                <a href={`#${s.id}`} className="group flex w-full flex-col rounded-2xl border border-line/10 bg-card p-6 card-hover">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/10 bg-accent/50 text-teal"><s.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                  <h3 className="mt-6 font-display text-lg font-medium">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                </a>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      {SERVICES.map((s, i) => (
        <Section key={s.id} id={s.id} bordered className={i % 2 === 0 ? "bg-muted" : undefined}>
          <div className="container grid gap-10 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift"><s.icon className="h-7 w-7" strokeWidth={1.25} /></span>
              <h3 className="mt-6 font-display text-2xl font-medium">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </Reveal>
            <Stagger className={`grid gap-3 sm:grid-cols-2 lg:col-span-8 ${s.points.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {s.points.map((p, idx) => (
                <Item key={p} className="flex">
                  <div className="relative w-full overflow-hidden rounded-xl border border-line/10 bg-card p-5 shadow-soft">
                    <span className={`absolute inset-x-0 top-0 h-0.5 ${idx % 2 ? "bg-teal" : "bg-primary"}`} />
                    <span className="font-mono text-xs font-semibold text-primary-ink">0{idx + 1}</span>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">{p}</p>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
        </Section>
      ))}

      <InlineLeadSection
        eyebrow="Ready to scope a program?"
        title={tx("Bring one problem. We'll bring the method.")}
        description={tx("Tell us what you need, from an assessment or a migration to managed operations or support, and our services team will scope it with you.")}
        interest="services"
        type="contact"
        submitLabel="Talk to services"
      />
    </div>
  );
}
