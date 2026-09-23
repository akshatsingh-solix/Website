import { useSearchParams } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { OFFICES } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";

const MODES = [
  { key: "demo", label: "Request a demo", title: "See Solix on your data.", desc: "A 45-minute working session with a solutions architect, tailored to the systems and outcomes you care about." },
  { key: "contact", label: "Contact sales", title: "Talk to our team.", desc: "Questions about pricing, deployment models, partnerships or an existing program? We'll route you to the right person." },
];

export default function Contact() {
  const [params, setParams] = useSearchParams();
  const mode = MODES.find((m) => m.key === params.get("type")) ?? MODES[0];
  const interest = params.get("interest") ?? undefined;

  return (
    <div className="relative overflow-hidden" data-testid="contact-page">
      <div className="absolute inset-0 grid-lines opacity-50" />
      <div className="absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.1),transparent)]" />
      <div className="container relative grid gap-14 pt-32 pb-24 md:pt-40 lg:grid-cols-12 lg:pt-44">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-5">Contact</p>
          <div className="mb-8 inline-flex rounded-full border border-line/10 bg-card p-1" role="tablist" data-testid="contact-mode-tabs">
            {MODES.map((m) => (
              <button
                key={m.key}
                role="tab"
                aria-selected={mode.key === m.key}
                onClick={() => setParams(interest ? { type: m.key, interest } : { type: m.key })}
                data-testid={`contact-mode-${m.key}`}
                className={cn("rounded-full px-4 py-2 text-sm transition-colors duration-200", mode.key === m.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
              >
                {m.label}
              </button>
            ))}
          </div>
          <h1 className="text-balance text-4xl font-medium tracking-tighter sm:text-5xl lg:text-6xl">{mode.title}</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">{mode.desc}</p>

          <dl className="mt-12 space-y-6 text-sm">
            <div className="flex gap-4">
              <Phone className="h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
              <div><dt className="text-muted-foreground">Sales & support</dt><dd className="mt-0.5 font-medium"><a href="tel:18884676549" className="hover:text-primary-ink">1.888.GO.SOLIX (467.6549)</a></dd></div>
            </div>
            <div className="flex gap-4">
              <Mail className="h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
              <div><dt className="text-muted-foreground">Email</dt><dd className="mt-0.5 font-medium"><a href="mailto:info@solix.com" className="hover:text-primary-ink">info@solix.com</a></dd></div>
            </div>
            <div className="flex gap-4">
              <MapPin className="h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
              <div><dt className="text-muted-foreground">Headquarters</dt><dd className="mt-0.5 font-medium">{OFFICES[0].address}</dd></div>
            </div>
            <div className="flex gap-4">
              <Clock className="h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
              <div><dt className="text-muted-foreground">Response time</dt><dd className="mt-0.5 font-medium">Within one business day</dd></div>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.12} className="lg:col-span-7">
          <div className="rounded-3xl border border-line/10 bg-card/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur sm:p-10">
            <LeadForm
              key={mode.key + (interest ?? "")}
              type={mode.key}
              defaultInterest={interest}
              submitLabel={mode.key === "demo" ? "Request a demo" : "Send message"}
              successTitle={mode.key === "demo" ? "Your demo request is in." : "Message received."}
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
