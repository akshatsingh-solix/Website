import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { LEADERSHIP, OFFICES, TIMELINE, VALUES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { NumbersRings } from "@/components/company/NumbersRings";
import { Button } from "@/components/ui/button";

export default function Company() {
  return (
    <div data-testid="company-page">
      <PageHero
        eyebrow="Company"
        crumbs={[{ label: "Company" }]}
        title="Stewards of enterprise data since 2002."
        description="Solix was founded on a simple conviction: enterprise data deserves lifecycle-long stewardship. Two decades later, that conviction is the foundation the AI-driven enterprise runs on."
        image="/Website/images/company-office.jpg"
      >
        <Button asChild size="lg" variant="outline" data-testid="company-careers-button">
          <Link to="/careers">We're hiring <ArrowRight /></Link>
        </Button>
      </PageHero>

      <Section>
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Mission" title="Activate every era of enterprise data, inside a perimeter of trust." />
          </div>
          <Reveal delay={0.1} className="prose-solix text-base leading-relaxed text-slate-300 md:text-lg lg:col-span-7">
            <p>Enterprises don't have a data problem. They have a data <em>history</em> problem: decades of systems, formats and regulations, each holding records the business still needs and regulators still expect.</p>
            <p>Solix built the Common Data Platform to give that history a home: governed, searchable, preserved. Then we built the products that put it to work, from archiving and application retirement to privacy automation and, now, governed Enterprise AI.</p>
            <p>Headquartered in Santa Clara, California with engineering in Hyderabad and teams across EMEA and APAC, we serve some of the most regulated organizations in the world.</p>
          </Reveal>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40">
        <div className="container">
          <SectionHeading eyebrow="By the numbers" title="Scale is our normal operating condition." align="center" />
          <div className="mt-14"><NumbersRings /></div>
        </div>
      </Section>

      <Section bordered>
        <div className="container">
          <SectionHeading eyebrow="Values" title="What we optimize for." />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <Item key={v.title} className="rounded-2xl border border-white/10 bg-card p-6 card-hover">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-ink-950 text-primary"><v.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                <h3 className="mt-6 font-display text-xl font-medium">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered>
        <div className="container">
          <SectionHeading eyebrow="Timeline" title="Twenty-four years, one direction." />
          <div className="relative mt-16">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-white/10 lg:block" />
            <Stagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-7" stagger={0.06}>
              {TIMELINE.map((t) => (
                <Item key={t.year} className="relative">
                  <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-primary/50 bg-ink-950 font-mono text-[11px] text-primary">{t.year.slice(2)}</span>
                  <p className="mt-5 font-mono text-xs text-muted-foreground">{t.year}</p>
                  <h3 className="mt-1 font-display text-lg font-medium leading-snug">{t.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                </Item>
              ))}
            </Stagger>
          </div>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40" id="leadership">
        <div className="container">
          <SectionHeading eyebrow="Leadership" title="Operators who have shipped at scale." />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERSHIP.map((l) => (
              <Item key={l.name} className="rounded-2xl border border-white/10 bg-card p-6 card-hover" data-testid="leader-card">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-teal/20 font-display text-xl font-semibold">{l.initials}</span>
                <h3 className="mt-6 font-display text-lg font-medium">{l.name}</h3>
                <p className="text-sm text-primary">{l.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{l.bio}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered>
        <div className="container">
          <SectionHeading eyebrow="Global presence" title="Where we work." />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFICES.map((o) => (
              <Item key={o.city} className="flex gap-4 rounded-2xl border border-white/10 bg-card p-6">
                <MapPin className="h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{o.label}</p>
                  <h3 className="mt-1 font-display text-lg font-medium">{o.city}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{o.address}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40" id="analyst-views">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Analyst Views" title="Independent perspective on where we fit." />
          </div>
          <Reveal delay={0.1} className="text-sm leading-relaxed text-slate-300 lg:col-span-7 md:text-base">
            <p>Solix briefs industry analysts regularly on our platform strategy, from archiving and application retirement to governed Enterprise AI. If you're evaluating Solix as part of an analyst-led shortlist, your account team can share the relevant reports and briefing notes for your industry and use case.</p>
          </Reveal>
        </div>
      </Section>

      <Section bordered id="investor-relations">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Investor Relations" title="Independent and growing since 2002." />
          </div>
          <Reveal delay={0.1} className="text-sm leading-relaxed text-slate-300 lg:col-span-7 md:text-base">
            <p>Solix has grown as an independent, privately held company for over two decades. For investment or partnership inquiries, reach our corporate development team through the contact form below.</p>
          </Reveal>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40" id="csr">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Corporate Social Responsibility" title="Stewardship, on and off the platform." />
          </div>
          <Reveal delay={0.1} className="text-sm leading-relaxed text-slate-300 lg:col-span-7 md:text-base">
            <p>The same stewardship we apply to customer data guides how we operate as a company: annual volunteer days for every employee, data-minimization built into our own internal systems, and a hiring practice that reflects the global, regulated industries we serve.</p>
          </Reveal>
        </div>
      </Section>

      <CTABand eyebrow="Join us" title="Build the data layer for the AI-driven enterprise." primary={{ label: "View open roles", to: "/careers" }} secondary={{ label: "Partner with us", to: "/partners" }} />
    </div>
  );
}
