import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import qrcode from "qrcode-generator";
import { ArrowRight, CalendarPlus, Check, Clock, Copy, CreditCard, Download, FileText, Linkedin, MapPin, Share2, Hourglass, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui";
import { lookup, reportPayment } from "@/lib/api";
import { downloadIcs, googleCalendarUrl, siteUrl } from "@/lib/calendar";
import { forgetRegistration, payWithEventbrite, payWithStripeLink, rememberRegistration, rememberedRegistration } from "@/lib/payments";
import { money } from "@/lib/useEvent";
import { EVENT, LINKS } from "@/data/event";

const STATUS = {
  confirmed: { title: "You're in.", text: "Your seat is confirmed. We've saved your pass below; bring it (or just your name) to check-in.", Icon: Check, tone: "text-emerald-400" },
  paid: { title: "You're in.", text: "Payment received and your seat is confirmed.", Icon: Check, tone: "text-emerald-400" },
  payment_reported: { title: "Payment received.", text: "Thanks! Eventbrite emails your receipt, and your seat is held while the events team matches your payment. You don't need to do anything else.", Icon: Clock, tone: "text-sky-300" },
  pending_payment: { title: "Almost there.", text: "Your seat is held. Complete payment to confirm it.", Icon: CreditCard, tone: "text-amber-300" },
  invoice_requested: { title: "Seat held, invoice on its way.", text: "The events team will email an invoice to your billing contact. Your seat is confirmed once it's paid.", Icon: FileText, tone: "text-sky-300" },
  waitlisted: { title: "You're on the waitlist.", text: "The event is at capacity. We'll email you as soon as a seat opens up.", Icon: Hourglass, tone: "text-amber-300" },
  cancelled: { title: "This registration was cancelled.", text: `Questions? Email ${EVENT.email}.`, Icon: XCircle, tone: "text-red-300" },
};

function Qr({ value }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }, [value]);
  return <div className="h-28 w-28 rounded-xl bg-white p-2.5 [&_svg]:h-full [&_svg]:w-full" aria-label={`QR code for ${value}`} role="img" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function LookupForm({ onFound, initial }) {
  const [code, setCode] = useState(initial?.code || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [state, setState] = useState({ busy: false, error: null });
  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try {
      const reg = await lookup(code.trim().toUpperCase(), email.trim());
      rememberRegistration(reg);
      onFound(reg);
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };
  return (
    <form onSubmit={onSubmit} className="surface mx-auto mt-10 max-w-lg space-y-4 p-8" data-testid="lookup-form">
      <h1 className="text-2xl font-semibold">Find your registration</h1>
      <p className="text-sm text-muted-foreground">Enter the code from your confirmation (it starts with EMP-) and the email you registered with.</p>
      <label className="block"><span className="label">Registration code</span><input className="field font-mono uppercase" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="EMP-XXXXXX" /></label>
      <label className="block"><span className="label">Email</span><input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {state.error && <p className="text-sm text-primary-ink" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={state.busy}>{state.busy ? <Spinner /> : "Find registration"}</button>
      <p className="text-center text-sm text-muted-foreground">Not registered yet? <Link to="/register" className="font-medium text-blue">Register now</Link></p>
    </form>
  );
}

export default function Confirmed() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const [reg, setReg] = useState(state?.registration || null);
  const [loading, setLoading] = useState(!state?.registration);
  const [payBusy, setPayBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const remembered = rememberedRegistration();

  useEffect(() => { document.title = `Your registration · ${EVENT.name}`; }, []);
  // Refresh from the server (after a Stripe redirect, or on a return visit).
  useEffect(() => {
    const code = params.get("code") || reg?.code || remembered?.code;
    const email = reg?.email || remembered?.email;
    if (!code || !email) { setLoading(false); return; }
    lookup(code, email).then(setReg).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="grid min-h-[70vh] place-items-center pt-24"><Spinner className="h-6 w-6 text-primary" /></div>;
  if (!reg) return <section className="min-h-[80vh] bg-muted px-4 pb-24 pt-28"><LookupForm onFound={setReg} initial={{ code: params.get("code") || "" }} /></section>;

  const s = STATUS[reg.status] || STATUS.confirmed;
  const shareUrl = siteUrl("?utm_source=attendee&utm_medium=share&utm_campaign=empower2026");
  const shareText = `I'm attending ${EVENT.name}: ${EVENT.theme}, ${EVENT.dates} at UC San Diego. Join me! ${EVENT.hashtag}`;

  const payNow = async () => {
    const pay = reg.payment;
    if (!pay) return;
    setPayBusy(true);
    try {
      if (pay.provider === "stripe_link" && pay.url) return payWithStripeLink(pay.url);
      if (pay.provider === "eventbrite") {
        try {
          await payWithEventbrite({ eventId: pay.eventbrite_event_id, promoCode: pay.promo_code, code: reg.code, email: reg.email });
          setReg({ ...reg, status: "payment_reported" });
        } catch {
          // Widget blocked (ad blocker, offline): use Eventbrite's own event page.
          window.open(`https://www.eventbrite.com/e/${pay.eventbrite_event_id}`, "_blank", "noopener");
        }
      }
    } finally {
      setPayBusy(false);
    }
  };
  const confirmStripe = async () => {
    setPayBusy(true);
    try { setReg(await reportPayment(reg.code, reg.email, "stripe_link", null)); } finally { setPayBusy(false); }
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: EVENT.name, text: shareText, url: shareUrl }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const confirmedish = ["confirmed", "paid", "payment_reported"].includes(reg.status);

  return (
    <section className="bg-muted pb-24">
      <div className="dark relative isolate overflow-hidden bg-ink-950 pb-40 pt-32 text-foreground">
        <div className="glow-field -z-10" aria-hidden />
        <div className="grid-lines absolute inset-0 -z-10 opacity-40" aria-hidden />
        <div className="container text-center">
          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} className={`mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white/5 ${s.tone}`}>
            <s.Icon className="h-8 w-8" />
          </motion.span>
          <h1 className="mt-6 text-fluid-h2 font-semibold text-white" data-testid="confirm-title">{s.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">{s.text}</p>
          {reg.already_registered && <p className="mt-3 text-sm text-white/50">You'd already registered with this email, so here's your existing registration.</p>}
        </div>
      </div>

      <div className="container -mt-28">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mx-auto max-w-3xl">
          <div className="dark relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 text-foreground shadow-lift" data-testid="digital-pass">
            <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
            <div className="relative grid gap-6 p-7 md:grid-cols-[1fr_auto] md:p-9">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">{EVENT.name} · {reg.ticket_name}</p>
                <p className="mt-5 font-display text-3xl font-semibold text-white md:text-4xl">{reg.first_name} {reg.last_name}</p>
                <p className="mt-1 text-white/70">{reg.job_title} · {reg.company}</p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div><p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Code</p><p className="mt-1 font-mono text-lg font-semibold text-white" data-testid="reg-code">{reg.code}</p></div>
                  <div><p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Dates</p><p className="mt-1 text-white/90">{EVENT.shortDates}</p></div>
                  <div><p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Amount</p><p className="mt-1 text-white/90">{money(reg.amount, reg.currency)}</p></div>
                </div>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-end">
                {confirmedish && <Qr value={`${EVENT.slug}:${reg.code}`} />}
                <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/70">{reg.status.replace(/_/g, " ")}</span>
              </div>
            </div>
            <div className="relative flex items-center gap-2 border-t border-dashed border-white/15 px-7 py-4 text-sm text-white/60 md:px-9"><MapPin className="h-4 w-4 text-primary" />{EVENT.venueLong} · {EVENT.address}</div>
          </div>

          {reg.status === "pending_payment" && reg.payment && (
            <div className="surface mt-6 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
              <p className="text-sm"><span className="font-semibold">Complete payment to confirm your seat.</span> <span className="text-muted-foreground">{reg.payment.provider === "eventbrite" ? "Checkout runs securely on Eventbrite." : "Checkout runs securely on Stripe."}</span></p>
              <div className="flex shrink-0 gap-2">
                {reg.payment.provider === "stripe_link" && <button onClick={confirmStripe} className="btn-ghost" disabled={payBusy}>I've paid</button>}
                <button onClick={payNow} className="btn-primary" disabled={payBusy}>{payBusy ? <Spinner /> : <>Pay {money(reg.amount, reg.currency)}</>}</button>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href={googleCalendarUrl()} target="_blank" rel="noreferrer" className="surface flex items-center gap-3 p-4 text-sm font-medium transition hover:-translate-y-0.5"><CalendarPlus className="h-5 w-5 text-blue" />Google Calendar</a>
            <button onClick={() => downloadIcs(reg.code)} className="surface flex items-center gap-3 p-4 text-left text-sm font-medium transition hover:-translate-y-0.5"><Download className="h-5 w-5 text-blue" />Outlook / Apple (.ics)</button>
            <a href={LINKS.justificationLetter} className="surface flex items-center gap-3 p-4 text-sm font-medium transition hover:-translate-y-0.5"><FileText className="h-5 w-5 text-blue" />Justification letter</a>
            <a href={LINKS.maps} target="_blank" rel="noreferrer" className="surface flex items-center gap-3 p-4 text-sm font-medium transition hover:-translate-y-0.5"><MapPin className="h-5 w-5 text-blue" />Directions & parking</a>
          </div>

          <div className="surface mt-6 grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-semibold">Bring a colleague</h2>
              <p className="mt-1 text-sm text-muted-foreground">Empower is better with your team. Share the event; seats are limited.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn-ghost" target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}><Linkedin className="h-4 w-4" />Share on LinkedIn</a>
              <button onClick={share} className="btn-ghost">{copied ? <><Check className="h-4 w-4" />Copied</> : <>{navigator.share ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}Share link</>}</button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Link to="/#agenda" className="surface group p-7 transition hover:-translate-y-0.5">
              <p className="eyebrow">Plan your days</p>
              <p className="mt-3 font-display text-xl font-semibold">Browse the three-day agenda</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue">Open agenda <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
            <a href={`${LINKS.mainSite}products/enterprise-ai?utm_source=empower&utm_medium=confirmation&utm_campaign=empower2026`} className="surface group p-7 transition hover:-translate-y-0.5">
              <p className="eyebrow">Before you arrive</p>
              <p className="mt-3 font-display text-xl font-semibold">Get to know Solix Enterprise AI</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue">Visit solix.com <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </a>
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Not you? <button className="font-medium text-blue underline-offset-4 hover:underline" onClick={() => { forgetRegistration(); setReg(null); }}>Look up another registration</button> · Questions: <a className="text-blue" href={`mailto:${EVENT.email}`}>{EVENT.email}</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
