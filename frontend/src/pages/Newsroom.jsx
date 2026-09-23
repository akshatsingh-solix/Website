import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Download, Mail, Phone, Quote, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BOILERPLATE, BRAND_COLORS, COVERAGE, MEDIA_KIT, PRESS_CONTACT, PRESS_RELEASES } from "@/data/newsroom";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";

const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const CATS = ["All", "Product", "Customer", "Partner", "Event", "Company"];

export default function Newsroom() {
  const [cat, setCat] = useState("All");
  const featured = PRESS_RELEASES.find((p) => p.featured);
  const list = useMemo(() => PRESS_RELEASES.filter((p) => !p.featured && (cat === "All" || p.category === cat)), [cat]);

  const copyBoilerplate = async () => {
    await navigator.clipboard?.writeText(BOILERPLATE);
    toast.success("Boilerplate copied");
  };

  return (
    <div data-testid="newsroom-page">
      <PageHero
        eyebrow="Newsroom"
        crumbs={[{ label: "Company", to: "/company" }, { label: "Newsroom" }]}
        title="Announcements, coverage and everything the press needs."
        description="Product launches, customer outcomes, partnerships and events from Solix Technologies."
        compact
      >
        <div className="rounded-2xl border border-line/10 bg-card/80 p-5 text-sm backdrop-blur lg:min-w-[260px]" data-testid="press-contact-card">
          <p className="eyebrow mb-3">Media inquiries</p>
          <p className="font-medium">{PRESS_CONTACT.name}</p>
          <a href={`mailto:${PRESS_CONTACT.email}`} className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-primary-ink" data-testid="press-email-link"><Mail className="h-4 w-4" /> {PRESS_CONTACT.email}</a>
          <a href="tel:18884676549" className="mt-1.5 flex items-center gap-2 text-muted-foreground hover:text-primary-ink"><Phone className="h-4 w-4" /> {PRESS_CONTACT.phone}</a>
        </div>
      </PageHero>

      {featured && (
        <Section className="pb-10 sm:pb-12">
          <div className="container">
            <Reveal className="dark group relative overflow-hidden rounded-3xl border border-line/10 bg-background text-foreground shadow-[0_50px_100px_-50px_rgba(13,25,45,0.6)]" data-testid="featured-release">
              <div className="absolute inset-0 grid-lines opacity-60" />
              <div className="relative grid lg:grid-cols-12">
                <div className="relative min-h-[240px] overflow-hidden lg:order-2 lg:col-span-5 lg:min-h-full">
                  <img src={featured.image || "/Website/images/hero-architecture.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/10 lg:to-transparent" />
                </div>
                <div className="p-8 sm:p-12 lg:col-span-7">
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em]">
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary-ink">Featured · {featured.category}</span>
                    <span className="text-muted-foreground">{fmt(featured.date)}</span>
                  </div>
                  <h2 className="mt-6 text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">{featured.title}</h2>
                  <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">{featured.summary}</p>
                  <Button asChild className="mt-8" data-testid="featured-release-cta"><Link to={`/newsroom/${featured.id}`}>Read the announcement <ArrowUpRight /></Link></Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>
      )}

      <Section className="pt-0" id="releases">
        <div className="container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="Press releases" title="Latest announcements." />
            <div className="flex flex-wrap gap-2" role="tablist" data-testid="release-filters">
              {CATS.map((c) => (
                <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} data-testid={`release-filter-${c.toLowerCase()}`} className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", cat === c ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:border-line/40 hover:text-foreground")}>{c}</button>
              ))}
            </div>
          </div>
          <Stagger key={cat} className="mt-10 divide-y divide-line/10 border-y border-line/10" data-testid="release-list">
            {list.length === 0 && <p className="py-12 text-center text-muted-foreground" data-testid="release-empty">No releases in this category yet.</p>}
            {list.map((p) => (
              <Item key={p.id}>
                <Link to={`/newsroom/${p.id}`} className="group grid gap-3 py-6 sm:grid-cols-12 sm:items-start" data-testid={`release-${p.id}`}>
                  <div className="font-mono text-xs text-muted-foreground sm:col-span-2">{fmt(p.date)}</div>
                  <div className="sm:col-span-8">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">{p.category}</span>
                    <h3 className="mt-1.5 font-display text-xl font-medium tracking-tight transition-colors group-hover:text-primary-ink sm:text-2xl">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
                  </div>
                  <div className="sm:col-span-2 sm:text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-primary-ink">Read release <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                  </div>
                </Link>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-muted" id="coverage">
        <div className="container">
          <SectionHeading eyebrow="In the news" title="Coverage highlights." />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COVERAGE.map((c) => (
              <Item key={c.title} className="flex flex-col rounded-2xl border border-line/10 bg-card p-6 card-hover" data-testid="coverage-card">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold tracking-tight text-foreground">{c.outlet}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{c.date}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-medium leading-snug">{c.title}</h3>
                <p className="mt-4 flex gap-2 text-sm italic text-muted-foreground"><Quote className="h-4 w-4 shrink-0 text-primary/60" strokeWidth={1.5} /> {c.quote}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered id="media-kit">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Media kit" title="Logos, colors and boilerplate." description="Use the assets as provided. Do not alter proportions, colors or spacing. Questions go to media relations." />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="brand-colors">
              {BRAND_COLORS.map((c) => (
                <div key={c.hex} className="rounded-xl border border-line/10 bg-card p-3">
                  <span className="block h-10 rounded-lg border border-line/10" style={{ background: c.hex }} />
                  <p className="mt-2 text-xs font-medium">{c.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{c.hex}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2" data-testid="media-kit-list">
              {MEDIA_KIT.map((m) => (
                <a key={m.file} href={m.file} download className="group flex items-center justify-between rounded-2xl border border-line/10 bg-card p-5 card-hover" data-testid={`media-kit-${m.meta.toLowerCase()}-${m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{m.meta}</p>
                  </div>
                  <Download className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary-ink" strokeWidth={1.5} />
                </a>
              ))}
            </div>
            <div className="rounded-2xl border border-line/10 bg-card p-6" data-testid="boilerplate-card">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Company boilerplate</p>
                <Button variant="ghost" size="sm" onClick={copyBoilerplate} data-testid="copy-boilerplate"><Copy /> Copy</Button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{BOILERPLATE}</p>
            </div>
          </div>
        </div>
      </Section>

      <CTABand eyebrow="Analysts & press" title="Need a briefing, a spokesperson or a customer reference?" primary={{ label: "Contact media relations", to: `/contact?type=contact` }} secondary={{ label: "About Solix", to: "/company" }} />
    </div>
  );
}
