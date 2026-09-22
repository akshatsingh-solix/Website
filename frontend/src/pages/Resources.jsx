import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESOURCES, RESOURCE_TYPES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { ResourceCard } from "@/components/home/InsightsPreview";
import { ResourceDialog } from "@/components/shared/ResourceDialog";
import { CTABand } from "@/components/shared/CTABand";
import { Input } from "@/components/ui/input";

export default function Resources() {
  const [params, setParams] = useSearchParams();
  const type = params.get("type") ?? "all";
  const [q, setQ] = useState("");
  const [resource, setResource] = useState(null);

  const list = useMemo(
    () => RESOURCES.filter((r) => (type === "all" || r.type === type) && (q === "" || `${r.title} ${r.desc} ${r.tag}`.toLowerCase().includes(q.toLowerCase()))),
    [type, q]
  );

  return (
    <div data-testid="resources-page">
      <PageHero
        eyebrow="Resources"
        crumbs={[{ label: "Resources" }]}
        title="Insights for people who run enterprise data."
        description="White papers, webinars, case studies and field notes from two decades of archiving, retirement, privacy and AI programs."
        compact
      />

      <Section className="pt-10 sm:pt-12">
        <div className="container">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" data-testid="resource-filters">
              {RESOURCE_TYPES.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={type === t.key}
                  onClick={() => setParams(t.key === "all" ? {} : { type: t.key })}
                  data-testid={`resource-filter-${t.key}`}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-[background-color,border-color,color] duration-200",
                    type === t.key ? "border-primary bg-primary text-white" : "border-white/15 text-slate-300 hover:border-white/40 hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative lg:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources" className="h-11 rounded-full border-white/15 bg-ink-900 pl-11 focus-visible:ring-primary" data-testid="resource-search-input" aria-label="Search resources" />
            </div>
          </div>

          {list.length === 0 ? (
            <p className="mt-16 text-center text-muted-foreground" data-testid="resources-empty">No resources match your search yet.</p>
          ) : (
            <Stagger key={`${type}-${q}`} className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((r) => <Item key={r.id} className="flex"><ResourceCard r={r} onOpen={setResource} /></Item>)}
            </Stagger>
          )}
        </div>
      </Section>

      <CTABand eyebrow="Prefer a conversation?" title="Skip the reading list. Talk to an architect." />
      <ResourceDialog resource={resource} onClose={() => setResource(null)} />
    </div>
  );
}
