import { ArrowDown, ArrowRight, Compass } from "lucide-react";
import { SERVICES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { InlineLeadSection } from "@/components/forms/InlineLeadSection";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { Sigil } from "@/components/materials/Sigil";
import { MetalIcon } from "@/components/materials/MetalIcon";

export default function ServicesSupport() {
  const tx = useTx();
  return (
    <div data-testid="services-support-page">
      <PageHero
        eyebrow="Services & Support"
        crumbs={[{ label: "Services & Support" }]}
        title="Delivery, engineering and support who've done this hundreds of times."
        description="Every Solix program is backed by the same team that builds the platform, an outcomes-based methodology, and a support portal that doesn't leave you guessing."
        media={<Sigil icon={Compass} tone="red" float className="aspect-[4/3] w-full rounded-3xl border border-line/15" />}
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
                <a href={`#${s.id}`} className="spot relative group flex w-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-card card-hover" data-testid={`service-card-${s.id}`}>
                  <Sigil icon={s.icon} tone={s.tone} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="aspect-[16/9] w-full shrink-0" />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-medium">{s.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.desc}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink">{tx("How we deliver")} <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" /></span>
                  </div>
                </a>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      {SERVICES.map((s, i) => (
        <Section key={s.id} id={s.id} bordered className={i % 2 === 0 ? "bg-muted" : undefined}>
          <div className="container grid gap-10 lg:grid-cols-12 lg:items-start">
            <Reveal className="group lg:col-span-4">
              <Sigil icon={s.icon} tone={s.tone} sizes="(min-width: 1024px) 30vw, 100vw" float className="aspect-[4/3] w-full rounded-3xl border border-line/10 shadow-lift" />
              <h3 className="mt-6 font-display text-2xl font-medium">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </Reveal>
            <Stagger className={`grid gap-3 sm:grid-cols-2 lg:col-span-8 ${s.points.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {s.points.map((p, idx) => (
                <Item key={p} className="flex">
                  <div className="relative w-full overflow-hidden rounded-xl border border-line/10 bg-card p-5 shadow-soft">
                    <span className={`absolute inset-x-0 top-0 h-0.5 ${s.tone === "blue" ? "bg-gradient-to-r from-teal to-teal/30" : "bg-gradient-to-r from-primary to-primary/30"}`} />
                    <span className="flex items-center gap-2 font-mono text-xs font-semibold text-primary-ink"><MetalIcon icon={s.icon} tone={s.tone} className="h-4 w-4" /> 0{idx + 1}</span>
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
