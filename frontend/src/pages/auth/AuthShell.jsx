import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, FileText, Lock, ShieldCheck, BadgeCheck } from "lucide-react";
import { useTx } from "@/i18n/tx";
import { Logo } from "@/components/shared/Logo";
import { useIntentTracking } from "@/lib/useIntentTracking";
import { AuroraField } from "@/components/shared/Reveal";

// i18n: translated at render.
const FEATURES = [
  { lead: "Talk to Your Enterprise Data:", text: "Ask plain-language questions across hundreds of contracts, reports, or emails simultaneously." },
  { lead: "Auto-Extract Key Data:", text: "Pull structured information from any source — invoices, contracts, emails, ERP reports, etc." },
  { lead: "Summarize Instantly:", text: "Generate executive summaries of lengthy reports, legal agreements, or research papers in seconds." },
  { lead: "Auto-Classify & Govern:", text: "Every uploaded document is automatically classified, tagged with metadata, and routed to the right retention policy." },
];

// no-i18n: certification names.
const BADGES = [
  { icon: Lock, label: "HIPAA" },
  { icon: ShieldCheck, label: "PCI DSS" },
  { icon: BadgeCheck, label: "SOC 1 & 2" },
];

const ease = [0.22, 1, 0.36, 1];

/**
 * Shared frame for the Solix ECS sign-in and sign-up pages, following the
 * solix.com/ai layout: headline across the top, the product story on the
 * left, the form card on the right.
 */
export const AuthShell = ({ children }) => {
  const tx = useTx();
  useIntentTracking();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground" data-testid="auth-shell">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#EAF3FA_0%,#FFFFFF_45%,#F1F7FC_100%)]" />
      <div className="absolute inset-0 grid-lines grid-fade opacity-80" />
      <AuroraField />

      <header className="container relative flex items-center justify-between py-5">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="auth-back-home">
          <ArrowLeft className="h-4 w-4" /> {tx("Back to website")}
        </Link>
      </header>

      <main className="container relative pb-16 pt-6 sm:pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="text-center">
          <h1 className="font-display text-[clamp(2rem,1.2rem+3.4vw,3.5rem)] font-extrabold uppercase leading-[1.02] tracking-tight">
            <span className="text-teal">{tx("Talk to your")}</span> <span className="text-foreground">{tx("Enterprise data")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tx("Solix ECS transforms your unstructured content — contracts, invoices, emails, reports — into an intelligent, searchable knowledge base. Ask questions, get answers, automate workflows, and stay compliant.")}
          </p>
        </motion.div>

        <div className="mt-10 grid items-start gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.1 }} className="order-2 lg:order-1 lg:col-span-7" aria-labelledby="ecs-story">
            <h2 id="ecs-story" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{tx("Your Documents Are Now Alive")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {tx("Stop digging through folders. Ask questions, extract intelligence, and automate decisions — directly from the content your business already has.")}
            </p>
            <ul className="mt-7 space-y-3.5">
              {FEATURES.map((f) => (
                <li key={f.lead} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-[2px] bg-teal" />
                  <span><span className="font-semibold text-foreground">{tx(f.lead)}</span> <span className="text-muted-foreground">{tx(f.text)}</span></span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              {BADGES.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-background/80 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-soft">
                  <Icon className="h-3.5 w-3.5 text-teal" strokeWidth={2} /> {label}
                </span>
              ))}
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <Link to="/signup" className="font-display text-lg font-semibold text-teal hover:underline" data-testid="auth-trial-link">{tx("Start your 30-day free trial")}</Link>
                <p className="text-sm text-muted-foreground">{tx("No credit card required")}</p>
              </div>
              {/* A glimpse of the product: one governed question, answered with sources. */}
              <div className="max-w-lg rounded-2xl border border-line/10 bg-background/90 p-4 shadow-soft" aria-hidden="true">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-teal"><FileText className="h-4 w-4" /></span>
                  <p className="text-sm text-foreground">{tx("Which supplier contracts auto-renew next quarter?")}</p>
                </div>
                <div className="mt-3 flex items-start gap-3 border-t border-line/10 pt-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm text-foreground">{tx("9 contracts auto-renew between July and September; 3 carry price-escalation clauses.")}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{tx("Cited from 9 documents · policy-checked")}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.18 }} className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4 xl:col-start-9">
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

/** The white form card used by both pages. */
export const AuthCard = ({ children, testId }) => (
  <div className="rounded-2xl border border-line/10 bg-background p-6 shadow-[0_2px_6px_rgba(13,25,45,0.05),0_40px_80px_-40px_rgba(13,25,45,0.35)] sm:p-7" data-testid={testId}>
    {children}
  </div>
);
