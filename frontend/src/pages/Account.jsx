import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bot, CalendarClock, FolderOpen, LogOut, MailCheck, Sparkles } from "lucide-react";
import { useTx } from "@/i18n/tx";
import { useAccount } from "@/components/account/AccountAuth";
import { Section } from "@/components/shared/Section";
import { AuroraField, Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

const TRIAL_DAYS = 30;

/** Signed-in home for a Solix ECS trial account. */
export default function Account() {
  const tx = useTx();
  const { i18n } = useTranslation();
  const location = useLocation();
  const { account, signout } = useAccount();

  useEffect(() => {
    document.title = `${tx("Your Solix ECS trial")} | Solix`;
  }, [tx]);

  const ends = new Date(account.trial_ends_at);
  const daysLeft = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86400000));
  const used = Math.min(100, Math.round(((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100));
  const endsLabel = ends.toLocaleDateString(i18n.language, { month: "long", day: "numeric", year: "numeric" });

  const details = [
    [tx("Name"), `${account.first_name} ${account.last_name}`],
    [tx("Business Email"), account.email],
    [tx("Business Name"), account.company],
    [tx("Phone Number"), account.phone],
    [tx("Job Title"), account.job_title],
    [tx("Company Size"), account.company_size],
    [tx("Country"), account.country && tx(account.country)],
    [tx("Use case"), account.use_case && tx(account.use_case)],
  ].filter(([, v]) => v);

  const steps = [
    { icon: MailCheck, title: tx("We've let the Solix team know"), desc: tx("They'll reach out at {{email}} to set up your Solix ECS workspace.", { email: account.email }) },
    { icon: FolderOpen, title: tx("Pick your first document set"), desc: tx("Contracts, invoices, email or reports: one collection is enough to see answers with citations.") },
    { icon: Bot, title: tx("Ask your first question"), desc: tx("Try the Solix concierge now to see how governed answers point back to their sources.") },
  ];

  return (
    <div data-testid="account-page">
      <section className="relative overflow-hidden border-b border-line/10 bg-background">
        <div className="absolute inset-0 grid-lines grid-fade" />
        <AuroraField />
        <div className="container relative grid gap-10 pb-14 pt-32 md:pt-40 lg:grid-cols-12 lg:items-end lg:pt-44">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow mb-4">{tx("Solix ECS · Free trial")}</p>
            <h1 className="text-balance text-fluid-h2 font-medium" data-testid="account-welcome">
              {location.state?.welcome ? tx("Welcome aboard, {{name}}.", { name: account.first_name }) : tx("Welcome back, {{name}}.", { name: account.first_name })}
            </h1>
            <p className="mt-5 max-w-xl text-fluid-lead text-muted-foreground">{tx("Your 30-day free trial of Solix ECS is active. Here's what happens next.")}</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="dark relative overflow-hidden rounded-3xl border border-line/10 bg-background p-7 text-foreground shadow-[0_50px_100px_-50px_rgba(13,25,45,0.6)]" data-testid="account-trial-card">
              <div className="absolute inset-0 grid-lines opacity-60" />
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.3),transparent)]" />
              <div className="relative flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><CalendarClock className="h-5 w-5" /></span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Trial")}</span>
              </div>
              <p className="relative mt-6 font-display text-5xl font-semibold tracking-tight" data-testid="account-days-left">{daysLeft}</p>
              <p className="relative text-sm text-muted-foreground">{tx("days left · ends {{date}}", { date: endsLabel })}</p>
              <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-line/10">
                <div className="h-full rounded-full bg-gradient-to-r from-teal to-primary" style={{ width: `${Math.max(used, 4)}%` }} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Section className="bg-muted">
        <div className="container grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-medium tracking-tight">{tx("What happens next")}</h2>
            <ol className="mt-6 space-y-3">
              {steps.map((s, i) => (
                <li key={s.title} className="surface-elevated flex gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal"><s.icon className="h-5 w-5" strokeWidth={1.75} /></span>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-ink">0{i + 1}</p>
                    <h3 className="mt-0.5 font-display text-lg font-medium">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => window.dispatchEvent(new CustomEvent("solix:open-chat"))} data-testid="account-open-chat">
                <Sparkles /> {tx("Ask Sol a question")}
              </Button>
              <Button asChild size="lg" variant="outline" data-testid="account-book-onboarding">
                <Link to="/contact?type=demo">{tx("Book an onboarding session")} <ArrowRight /></Link>
              </Button>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="surface-elevated p-6" data-testid="account-details">
              <h2 className="font-display text-lg font-medium">{tx("Your account")}</h2>
              <dl className="mt-4 divide-y divide-line/10 text-sm">
                {details.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-5 gap-3 py-2.5">
                    <dt className="col-span-2 text-muted-foreground">{k}</dt>
                    <dd className="col-span-3 break-words text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button variant="outline" className="mt-5 w-full" onClick={signout} data-testid="account-signout">
                <LogOut /> {tx("Sign out")}
              </Button>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}
