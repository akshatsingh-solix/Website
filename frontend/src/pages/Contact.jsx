import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { OFFICES } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";
import { SignalField } from "@/components/motion/signal/SignalField";
import { SplitWords } from "@/components/motion/KineticText";
import { ScrambleText } from "@/components/motion/Scramble";
import { useDarkSurface } from "@/components/layout/navTone";

const MODES = [
  { key: "demo", label: "Request a demo", title: "See Solix on your data.", desc: "A 45-minute working session with a solutions architect, tailored to the systems and outcomes you care about." },
  { key: "contact", label: "Contact sales", title: "Talk to our team.", desc: "Questions about pricing, deployment models, partnerships or an existing program? We'll route you to the right person." },
];

export default function Contact() {
  const tx = useTx();
  const modes = useLocalized(MODES);
  const [params, setParams] = useSearchParams();
  const mode = modes.find((m) => m.key === params.get("type")) ?? modes[0];
  const interest = params.get("interest") ?? undefined;
  const ref = useRef(null);
  useDarkSurface(ref);

  // The whole page is one navy stage: the data field gathers into a single
  // core behind the copy (every request lands with one team), the form sits
  // on glass to the right.
  return (
    <div ref={ref} className="dark relative overflow-hidden bg-background text-foreground" data-testid="contact-page">
      <div className="absolute inset-0 grid-lines grid-fade opacity-80" />
      <div className="absolute -left-40 top-20 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.16),transparent)]" />
      <div className="absolute -right-40 bottom-0 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.18),transparent)]" />
      <div className="absolute inset-0">
        <SignalField formations={["cloud", "sphere"]} progress={1} place={{ x: 0.3, y: -0.02, scale: 1.05, mx: 0, my: -0.3 }} density={0.6} />
      </div>
      <div className="absolute inset-0 grain" />
      <div className="container relative grid gap-14 pt-32 pb-24 md:pt-40 lg:grid-cols-12 lg:pt-44">
        <Reveal className="lg:col-span-5">
          <ScrambleText as="p" text={tx("Contact")} trigger="mount" className="eyebrow mb-5 block" />
          <div className="mb-8 inline-flex rounded-full border border-line/15 bg-card/60 p-1 backdrop-blur" role="tablist" data-testid="contact-mode-tabs">
            {modes.map((m) => (
              <button
                key={m.key}
                role="tab"
                aria-selected={mode.key === m.key}
                onClick={() => setParams(interest ? { type: m.key, interest } : { type: m.key })}
                data-testid={`contact-mode-${m.key}`}
                className={cn("relative rounded-full px-4 py-2 text-sm transition-colors duration-200", mode.key === m.key ? "text-white" : "text-muted-foreground hover:text-foreground")}
              >
                {mode.key === m.key && <motion.span layoutId="contact-mode-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={mode.key} exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}>
              <h1 className="text-balance font-display text-4xl font-medium leading-[1] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                <SplitWords text={mode.title} play stagger={0.06} />
              </h1>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">{mode.desc}</motion.p>
            </motion.div>
          </AnimatePresence>

          <dl className="mt-12 space-y-6 text-sm">
            <div className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/10 bg-line/5 text-teal"><Phone className="h-5 w-5" strokeWidth={1.5} /></span>
              <div><dt className="text-muted-foreground">{tx("Sales & support")}</dt><dd className="mt-0.5 font-medium"><a href="tel:18884676549" className="hover:text-primary-ink">1.888.GO.SOLIX (467.6549)</a></dd></div>
            </div>
            <div className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/10 bg-line/5 text-teal"><Mail className="h-5 w-5" strokeWidth={1.5} /></span>
              <div><dt className="text-muted-foreground">{tx("Email")}</dt><dd className="mt-0.5 font-medium"><a href="mailto:info@solix.com" className="hover:text-primary-ink">info@solix.com</a></dd></div>
            </div>
            <div className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/10 bg-line/5 text-teal"><MapPin className="h-5 w-5" strokeWidth={1.5} /></span>
              <div><dt className="text-muted-foreground">{tx("Headquarters")}</dt><dd className="mt-0.5 font-medium">{OFFICES[0].address}</dd></div>
            </div>
            <div className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/10 bg-line/5 text-teal"><Clock className="h-5 w-5" strokeWidth={1.5} /></span>
              <div><dt className="text-muted-foreground">{tx("Response time")}</dt><dd className="mt-0.5 font-medium">{tx("Within one business day")}</dd></div>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.12} className="lg:col-span-7">
          <div className="beam-border relative rounded-3xl border border-line/10 bg-card/70 p-6 shadow-[0_2px_6px_rgba(0,0,0,0.2),0_60px_120px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-10">
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
