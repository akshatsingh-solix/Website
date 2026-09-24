import { CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";
import { useTx } from "@/i18n/tx";

/**
 * "Talk to a specialist" band with the lead form on the page itself, the
 * product or service preselected. Used on product and service pages.
 */
export const InlineLeadSection = ({ id = "talk-to-us", eyebrow = "Talk to a specialist", title, description, interest, type = "demo", submitLabel = "Request a demo" }) => {
  const tx = useTx();
  const points = [
    { Icon: Clock, text: tx("A reply within one business day") },
    { Icon: CalendarCheck, text: tx("A 45-minute working session on your systems, not a generic pitch") },
    { Icon: ShieldCheck, text: tx("No obligation. We never share your details.") },
  ];
  return (
    <Section bordered id={id} className="scroll-mt-24">
      <div className="container grid gap-10 lg:grid-cols-12 lg:items-start">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-4">{tx(eyebrow)}</p>
          <h2 className="text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>}
          <ul className="mt-8 space-y-4">
            {points.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-foreground">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line/10 bg-card text-teal"><Icon className="h-4 w-4" strokeWidth={1.5} /></span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="rounded-3xl border border-line/10 bg-card p-6 shadow-soft sm:p-8" data-testid={`inline-lead-${interest || type}`}>
            <LeadForm type={type} defaultInterest={interest} submitLabel={submitLabel} successTitle="Your request is in." />
          </div>
        </Reveal>
      </div>
    </Section>
  );
};
