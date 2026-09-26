import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESOURCES, RESOURCE_TYPES } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { useTx, translateText } from "@/i18n/tx";
import { useCmsResources, fileHref } from "@/lib/content";
import { resourceCover } from "@/lib/art";

// Singular form of a type's plural label: "Case Studies" -> "Case Study", "Blogs" -> "Blog".
// Singular labels per resource type (the filter tabs use the plural ones).
// i18n
const TYPE_SINGULAR = { datasheet: "Datasheet", whitepaper: "White Paper", webinar: "Webinar", podcast: "Podcast", ebook: "eBook", casestudy: "Case Study", leadership: "Leadership Lesson", blog: "Blog", event: "Event", brief: "Solution Brief", collateral: "Marketing Material" };
export const typeLabel = (key) => translateText(TYPE_SINGULAR[key] ?? RESOURCE_TYPES.find((t) => t.key === key)?.label ?? key);

export const ResourceCard = ({ r, className }) => {
  const tx = useTx();
  const Icon = r.icon;
  return (
    <Link
      to={`/resources/${r.slug}`}
      data-testid={`resource-card-${r.id}`}
      className={cn("spot group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line/10 bg-card p-6 text-left shadow-soft card-hover", className)}
    >
      <span className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-teal to-primary transition-transform duration-500 group-hover:scale-x-100" />
      <div className="dark relative -mx-6 -mt-6 mb-5 aspect-[16/7] overflow-hidden border-b border-line/10 bg-background">
        <img src={(r.cover && fileHref(r.cover)) || resourceCover(r.type)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform [transition-duration:1200ms] ease-out group-hover:scale-110" />
      </div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {typeLabel(r.type)}
        </span>
        {r.gated && <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <h3 className="mt-5 font-display text-xl font-medium leading-snug tracking-tight text-foreground">{r.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
      <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {r.readTime} · {r.date}</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-primary-ink">
          {r.gated ? tx("Get access") : tx("Read")} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
};

export const InsightsPreview = () => {
  const tx = useTx();
  const { items: cms, withdrawn } = useCmsResources();
  // Newest published CMS items lead; the built-in library fills the rest.
  const latest = [...cms, ...RESOURCES.filter((r) => !cms.some((c) => c.slug === r.slug) && !withdrawn.has(r.slug))].slice(0, 4);
  return (
  <Section className="bg-background" id="insights">
    <div className="container">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading chapter="09" eyebrow="Insights" title="Field notes from two decades of enterprise data." />
        <Link to="/resources" className="link-underline shrink-0 text-sm font-medium text-foreground" data-testid="insights-view-all">
          {tx("Browse all resources")} →
        </Link>
      </div>
      <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {latest.map((r) => (
          <Item key={r.id} className="flex">
            <ResourceCard r={r} />
          </Item>
        ))}
      </Stagger>
    </div>
  </Section>
  );
};
