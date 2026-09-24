import { Link } from "react-router-dom";
import { ArrowRight, Check, FileText, Download, Lock, RotateCcw } from "lucide-react";
import { Reveal } from "../ui";
import { fmtDate, money, useEvent } from "@/lib/useEvent";
import { EVENT, INCLUDED, LINKS } from "@/data/event";

export default function Pass() {
  const { data } = useEvent();
  const tickets = data.tickets || [];
  return (
    <section id="register" className="dark relative isolate overflow-hidden bg-ink-950 py-24 text-foreground md:py-32">
      <div className="glow-field -z-10 opacity-80" aria-hidden />
      <div className="grid-lines absolute inset-0 -z-10 opacity-40" aria-hidden />
      <div className="container grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="eyebrow mb-4">Register now</p>
          <h2 className="text-fluid-h2 font-semibold text-white">Limited seats. <br />Three tracks, one conversation.</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">{EVENT.hosts}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/80"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}</li>
            ))}
          </ul>
        </Reveal>

        <div className="space-y-4">
          {!data.registration_open && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">Registration is closed. Email {EVENT.email} and we'll let you know if seats open up.</div>
          )}
          {tickets.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-white/50">{i === 0 ? "Most popular" : "Pass"}</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white">{t.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-semibold text-white">{money(t.price, t.currency)}</p>
                    {t.seats_left != null && !t.sold_out && <p className="mt-1 text-xs text-amber-300">Only {t.seats_left} left</p>}
                    {t.sold_out && <p className="mt-1 text-xs text-amber-300">Sold out · join the waitlist</p>}
                    {t.sales_end_at && !t.sales_ended && <p className="mt-1 text-xs text-white/50">Sales end {fmtDate(t.sales_end_at)}</p>}
                  </div>
                </div>
                {t.description && <p className="mt-4 leading-relaxed text-white/70">{t.description}</p>}
                {t.sales_ended ? (
                  <p className="mt-7 rounded-xl border border-white/10 p-3 text-center text-sm text-white/70">Sales for this pass have ended. Questions? {EVENT.email}</p>
                ) : (
                  <Link to={`/register?pass=${t.id}`} className="btn-primary btn-lg mt-7 w-full" data-testid={`pass-cta-${t.id}`}>
                    {data.waitlist || t.sold_out ? "Join the waitlist" : t.price ? `Get your pass · ${money(t.price, t.currency)}` : "Register free"} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {t.price > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-white/50">
                    <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />{t.provider === "eventbrite" ? "Secure checkout by Eventbrite" : t.provider === "stripe_link" ? "Secure checkout by Stripe" : "Invoice / PO accepted"}</span>
                    {data.refund_policy && <span className="inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />{data.refund_policy}</span>}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.12}>
            <a href={LINKS.justificationLetter} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25" id="justification">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-brand/15 text-blue"><FileText className="h-6 w-6" /></span>
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold text-white">Need approval? Get the justification letter</span>
                <span className="block text-sm text-white/60">A ready-to-send template that explains what you'll bring back to your team.</span>
              </span>
              <Download className="h-5 w-5 text-white/50 transition group-hover:translate-y-0.5 group-hover:text-white" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
