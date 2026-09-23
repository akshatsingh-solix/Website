import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, HeartHandshake, MapPin, TrendingUp } from "lucide-react";
import { LEADERSHIP, OFFICES, TIMELINE, VALUES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { NumbersRings } from "@/components/company/NumbersRings";
import { GlobalNetworkMap } from "@/components/company/GlobalNetworkMap";
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
          <Reveal delay={0.1} className="prose-solix text-base leading-relaxed text-muted-foreground md:text-lg lg:col-span-7">
            <p>Enterprises don't have a data problem. They have a data <em>history</em> problem: decades of systems, formats and regulations, each holding records the business still needs and regulators still expect.</p>
            <p>Solix built the Common Data Platform to give that history a home: governed, searchable, preserved. Then we built the products that put it to work, from archiving and application retirement to privacy automation and, now, governed Enterprise AI.</p>
            <p>Headquartered in Santa Clara, California with engineering in Hyderabad and teams across EMEA and APAC, we serve some of the most regulated organizations in the world.</p>
          </Reveal>
        </div>
      </Section>

      <Section bordered className="bg-muted">
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
              <Item key={v.title} className="rounded-2xl border border-line/10 bg-card p-6 card-hover">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-line/10 bg-accent/50 text-primary-ink"><v.icon className="h-5 w-5" strokeWidth={1.5} /></span>
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
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-line/10 lg:block" />
            <Stagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-7" stagger={0.06}>
              {TIMELINE.map((t) => (
                <Item key={t.year} className="relative">
                  <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-primary/50 bg-background font-mono text-[11px] text-primary-ink">{t.year.slice(2)}</span>
                  <p className="mt-5 font-mono text-xs text-muted-foreground">{t.year}</p>
                  <h3 className="mt-1 font-display text-lg font-medium leading-snug">{t.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                </Item>
              ))}
            </Stagger>
          </div>
        </div>
      </Section>

      <Section bordered className="bg-muted" id="leadership">
        <div className="container">
          <SectionHeading eyebrow="Leadership" title="Operators who have shipped at scale." />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERSHIP.map((l) => (
              <Item key={l.name} className="rounded-2xl border border-line/10 bg-card p-6 card-hover" data-testid="leader-card">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-teal/20 font-display text-xl font-semibold">{l.initials}</span>
                <h3 className="mt-6 font-display text-lg font-medium">{l.name}</h3>
                <p className="text-sm text-primary-ink">{l.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{l.bio}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section className="dark overflow-hidden bg-background text-foreground" id="global-presence">
        <div className="absolute inset-0 grid-lines grid-fade" />
        <div className="container relative">
          <SectionHeading eyebrow="Global presence" title="Where we work." />
          <Reveal delay={0.1} className="mt-12 rounded-2xl border border-line/10 bg-card p-6 sm:p-10">
            <GlobalNetworkMap />
          </Reveal>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFICES.map((o) => (
              <Item key={o.city} className="flex gap-4 rounded-2xl border border-line/10 bg-card p-6">
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

      <Section className="bg-muted" id="more">
        <div className="container">
          <SectionHeading eyebrow="Beyond the platform" title="How we engage with the market, investors and the world." />
          <Stagger className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              { id: "analyst-views", icon: BarChart3, eyebrow: "Analyst Views", title: "Independent perspective on where we fit.", body: "Solix briefs industry analysts regularly on our platform strategy, from archiving and application retirement to governed Enterprise AI. If you're evaluating Solix as part of an analyst-led shortlist, your account team can share the relevant reports and briefing notes for your industry and use case." },
              { id: "investor-relations", icon: TrendingUp, eyebrow: "Investor Relations", title: "Independent and growing since 2002.", body: "Solix has grown as an independent, privately held company for over two decades. For investment or partnership inquiries, reach our corporate development team through the contact form." },
              { id: "csr", icon: HeartHandshake, eyebrow: "Corporate Social Responsibility", title: "Stewardship, on and off the platform.", body: "The same stewardship we apply to customer data guides how we operate as a company: annual volunteer days for every employee, data-minimization built into our own internal systems, and a hiring practice that reflects the global, regulated industries we serve." },
            ].map((c) => (
              <Item key={c.id} id={c.id} className="flex scroll-mt-28">
                <div className="surface-elevated flex w-full flex-col p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal"><c.icon className="h-5 w-5" strokeWidth={1.5} /></span>
                  <p className="eyebrow mt-6">{c.eyebrow}</p>
                  <h3 className="mt-2 font-display text-xl font-medium tracking-tight text-foreground">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <CTABand eyebrow="Join us" title="Build the data layer for the AI-driven enterprise." primary={{ label: "View open roles", to: "/careers" }} secondary={{ label: "Partner with us", to: "/partners" }} />
    </div>
  );
}
