import { useState } from "react";
import { ArrowRight, Briefcase, Check, MapPin } from "lucide-react";
import { JOBS, PERKS } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadForm } from "@/components/forms/LeadForm";

export default function Careers() {
  const [job, setJob] = useState(null);

  return (
    <div data-testid="careers-page">
      <PageHero
        eyebrow="Careers"
        crumbs={[{ label: "Company", to: "/company" }, { label: "Careers" }]}
        title="Do the hardest work in enterprise data. Ship it to the biggest customers."
        description="We are engineers, architects, consultants and sellers who take petabytes and decades as normal operating conditions. If that sounds like your kind of problem, we'd like to meet you."
        image="/Website/images/culture-careers.jpg"
      />

      <Section>
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Open roles" title={`${JOBS.length} positions across four continents.`} description="Hybrid by default. Remote where the role allows." />
          </div>
          <Stagger className="space-y-3 lg:col-span-8" data-testid="jobs-list">
            {JOBS.map((j) => (
              <Item key={j.id}>
                <button
                  onClick={() => setJob(j)}
                  data-testid={`job-card-${j.id}`}
                  className="group grid w-full gap-4 rounded-2xl border border-line/10 bg-card p-6 text-left card-hover sm:grid-cols-12 sm:items-center"
                >
                  <div className="sm:col-span-7">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-ink">{j.team}</p>
                    <h3 className="mt-1.5 font-display text-xl font-medium">{j.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{j.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:col-span-4 sm:flex-col sm:gap-2">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {j.location}</span>
                    <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {j.type}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-primary-ink sm:col-span-1 sm:justify-end">
                    Apply <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section bordered className="bg-muted">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Benefits" title="Taken care of, so you can take care of the work." />
          </div>
          <Reveal delay={0.1} className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-xl border border-line/10 bg-card px-4 py-3 text-sm">
                <Check className="h-4 w-4 shrink-0 text-teal" /> {p}
              </div>
            ))}
          </Reveal>
        </div>
      </Section>

      <Dialog open={!!job} onOpenChange={(o) => !o && setJob(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-line/10 bg-background sm:max-w-2xl" data-testid="job-apply-dialog">
          {job && (
            <>
              <DialogHeader>
                <p className="eyebrow">{job.team} · {job.location}</p>
                <DialogTitle className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{job.title}</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">{job.desc}</DialogDescription>
              </DialogHeader>
              <div className="mt-2 rounded-2xl border border-line/10 bg-card p-6">
                <LeadForm
                  type="career"
                  extra={{ role: job.title }}
                  submitLabel="Submit application"
                  successTitle="Application received."
                  successDesc="Our talent team reviews every application personally and will respond within five business days."
                  showInterest={false}
                  compact
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
