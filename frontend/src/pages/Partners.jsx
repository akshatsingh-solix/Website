import { PARTNER_BENEFITS, PARTNER_TIERS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { BrandMark } from "@/components/shared/BrandMark";
import { LeadForm } from "@/components/forms/LeadForm";

export default function Partners() {
  return (
    <div data-testid="partners-page">
      <PageHero
        eyebrow="Partners"
        crumbs={[{ label: "Company", to: "/company" }, { label: "Partners" }]}
        title="An ecosystem built around the customer's data, not ours."
        description="Hyperscalers, platform vendors, system integrators and resellers deliver Solix programs worldwide. Join them."
        image="/Website/images/partners-ecosystem.jpg"
      />

      <Section id="our-partners">
        <div className="container">
          <SectionHeading eyebrow="Our Partners" title="An ecosystem organized by what you need done." />
          <Stagger className="mt-14 grid gap-6 lg:grid-cols-2">
            {PARTNER_TIERS.map((t) => (
              <Item key={t.id} id={t.id} className="spot relative surface-elevated scroll-mt-28 p-7 card-hover lg:[&:last-child:nth-child(odd)]:col-span-2" data-testid={`partner-tier-${t.id}`}>
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/10 bg-accent/50 text-teal"><t.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                <h3 className="mt-6 font-display text-2xl font-medium">{t.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {t.partners.map((p) => <BrandMark key={p} name={p} />)}
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-muted" id="become-a-partner">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Become a partner" title="Grow with the platform regulated enterprises already trust." />
            <Reveal delay={0.1} className="mt-10 space-y-5">
              {PARTNER_BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{b.title}</p>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
          <Reveal delay={0.15} className="rounded-2xl border border-line/10 bg-card p-6 sm:p-8 lg:col-span-7">
            <LeadForm
              type="partner"
              submitLabel="Apply to partner"
              successTitle="Thanks for your interest in partnering."
              successDesc="Our partner team will review your application and reach out within three business days."
              showInterest={false}
            />
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
