import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CreditCard, FileText, Lock, Tag, Ticket, Utensils, Code2 } from "lucide-react";
import { Spinner } from "@/components/ui";
import { money, useEvent } from "@/lib/useEvent";
import { getQuote, linkage, register, utm } from "@/lib/api";
import { payWithEventbrite, payWithStripeLink, rememberRegistration } from "@/lib/payments";
import { COUNTRIES } from "@/data/countries";
import { EVENT, INCLUDED } from "@/data/event";

const STEPS = ["Pass", "Your details", "Your event", "Review"];
const DRAFT_KEY = "empower_draft";
const EMPTY = {
  ticket_id: "", promo_code: "", first_name: "", last_name: "", email: "", company: "", job_title: "", phone: "", country: "",
  interests: [], days: ["day1", "day2", "day3"], dinners: [], hackathon: false, dietary: "", accessibility: "", how_heard: "",
  billing_contact: "", po_number: "", marketing_opt_in: true, accept_terms: false,
};
const HOW_HEARD = ["Solix email", "Solix website", "LinkedIn", "A colleague", "Solix account team", "UC San Diego", "Partner", "Search", "Other"];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function loadDraft() {
  try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}"), accept_terms: false }; } catch { return EMPTY; }
}

function Field({ label, error, children, hint, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-primary-ink">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function Toggle({ checked, onChange, children, icon: Icon, testid }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} data-testid={testid}
      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition ${checked ? "border-primary/60 bg-primary/[0.06] text-foreground" : "border-line/15 hover:border-line/30"}`}>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${checked ? "border-primary bg-primary text-white" : "border-line/30"}`}>{checked && <Check className="h-3.5 w-3.5" />}</span>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export default function Register() {
  const { data: event, live } = useEvent();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(loadDraft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [promoState, setPromoState] = useState({ busy: false, message: null, valid: false });
  const [submit, setSubmit] = useState({ busy: false, error: null, pending: null });

  const tickets = event.tickets || [];
  const ticket = tickets.find((t) => t.id === form.ticket_id) || null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  useEffect(() => { document.title = `Register · ${EVENT.name}`; }, []);
  // Preselect the pass from ?pass= or the only/first available one.
  useEffect(() => {
    if (form.ticket_id && tickets.some((t) => t.id === form.ticket_id)) return;
    const wanted = params.get("pass");
    const pick = tickets.find((t) => t.id === wanted) || tickets.find((t) => !t.sold_out) || tickets[0];
    if (pick) set("ticket_id", pick.id);
  }, [tickets, params]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { accept_terms, ...draft } = form; // eslint-disable-line no-unused-vars
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [form]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  // Dinners only make sense for days you attend.
  useEffect(() => { setForm((f) => ({ ...f, dinners: f.dinners.filter((d) => f.days.includes(d)) })); }, [form.days]);

  const price = useMemo(() => {
    if (quote && quote.ticket_id === form.ticket_id) return quote;
    return ticket ? { price: ticket.price, discount: 0, total: ticket.price, currency: ticket.currency } : null;
  }, [quote, ticket, form.ticket_id]);

  const applyPromo = async () => {
    if (!form.promo_code.trim() || !ticket) return;
    setPromoState({ busy: true, message: null, valid: false });
    try {
      const q = await getQuote(ticket.id, form.promo_code.trim());
      setQuote({ ...q, ticket_id: ticket.id });
      setPromoState({ busy: false, message: q.promo_message, valid: q.promo_valid });
    } catch (e) {
      setPromoState({ busy: false, message: e.message, valid: false });
    }
  };

  const validate = (s) => {
    const e = {};
    if (s === 0 && !ticket) e.ticket_id = "Choose a pass.";
    if (s === 1) {
      for (const k of ["first_name", "last_name", "company", "job_title"]) if (!form[k].trim()) e[k] = "Required";
      if (!EMAIL_RX.test(form.email.trim())) e.email = "Enter a valid work email.";
    }
    if (s === 2 && form.days.length === 0) e.days = "Pick at least one day.";
    if (s === 3) {
      if (!form.accept_terms) e.accept_terms = "Please accept to continue.";
      if (needsInvoice && !form.billing_contact.trim()) e.billing_contact = "Who should we send the invoice to?";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => validate(step) && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const payable = price && price.total > 0 && ticket?.provider !== "free";
  const needsInvoice = payable && ticket?.provider === "invoice";
  const waitlist = event.waitlist || ticket?.sold_out;

  const finish = (reg) => {
    rememberRegistration(reg);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    navigate("/register/confirmed", { state: { registration: reg } });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate(3)) return;
    setSubmit({ busy: true, error: null, pending: null });
    try {
      const body = {
        ...form,
        email: form.email.trim(),
        promo_code: promoState.valid ? form.promo_code.trim() : null,
        phone: form.phone || null, country: form.country || null, dietary: form.dietary || null, accessibility: form.accessibility || null,
        how_heard: form.how_heard || null, billing_contact: form.billing_contact || null, po_number: form.po_number || null,
        utm: utm(), ...linkage(),
      };
      const reg = await register(body);
      const pay = reg.payment;
      if (reg.status === "pending_payment" && pay?.provider === "eventbrite" && pay.eventbrite_event_id) {
        setSubmit({ busy: false, error: null, pending: reg });
        await payWithEventbrite({ eventId: pay.eventbrite_event_id, promoCode: pay.promo_code, code: reg.code, email: reg.email });
        finish({ ...reg, status: "payment_reported" });
        return;
      }
      if (reg.status === "pending_payment" && pay?.provider === "stripe_link" && pay.url) {
        rememberRegistration(reg);
        setSubmit({ busy: false, error: null, pending: reg });
        payWithStripeLink(pay.url);
        return;
      }
      finish(reg);
    } catch (err) {
      setSubmit({ busy: false, error: err.message, pending: null });
    }
  };

  const closed = live && !event.registration_open;

  return (
    <section className="relative min-h-screen bg-muted pb-24 pt-28 md:pt-32">
      <div className="container">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to the event</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">Register · {EVENT.shortDates}</p>
            <h1 className="mt-3 text-fluid-h2 font-semibold">{waitlist ? "Join the waitlist" : "Claim your seat at SOLIXEmpower 2026"}</h1>

            <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Registration steps">
              {STEPS.map((s, i) => (
                <li key={s}>
                  <button type="button" disabled={i > step} onClick={() => i < step && setStep(i)} className="w-full text-left">
                    <span className={`block h-1.5 rounded-full transition ${i <= step ? "bg-primary" : "bg-line/15"}`} />
                    <span className={`mt-2 block text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}><span className="font-mono">0{i + 1}</span> <span className="hidden sm:inline">{s}</span></span>
                  </button>
                </li>
              ))}
            </ol>

            {closed ? (
              <div className="surface mt-8 p-8">
                <h2 className="text-2xl font-semibold">Registration is closed</h2>
                <p className="mt-2 text-muted-foreground">Email <a className="text-blue underline" href={`mailto:${EVENT.email}`}>{EVENT.email}</a> and we'll let you know if seats open up.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="surface mt-8 p-6 md:p-9" data-testid="register-form">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    {step === 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Choose your pass</h2>
                        {tickets.map((t) => {
                          const active = t.id === form.ticket_id;
                          return (
                            <button type="button" key={t.id} onClick={() => { set("ticket_id", t.id); setQuote(null); setPromoState({ busy: false, message: null, valid: false }); }}
                              className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${active ? "border-primary bg-primary/[0.04] ring-4 ring-primary/10" : "border-line/15 hover:border-line/30"}`}
                              data-testid={`ticket-${t.id}`}>
                              <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-primary" : "border-line/30"}`}>{active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}</span>
                              <span className="flex-1">
                                <span className="flex flex-wrap items-baseline justify-between gap-2">
                                  <span className="font-display text-lg font-semibold">{t.name}</span>
                                  <span className="font-display text-xl font-semibold">{money(t.price, t.currency)}</span>
                                </span>
                                {t.description && <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{t.description}</span>}
                                <span className="mt-2 flex flex-wrap gap-2">
                                  {t.seats_left != null && !t.sold_out && <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-800">{t.seats_left} seats left</span>}
                                  {t.sold_out && <span className="chip">Sold out · waitlist</span>}
                                  {t.price > 0 && <span className="chip"><CreditCard className="h-3.5 w-3.5" />{t.provider === "invoice" ? "Pay by invoice" : "Secure online payment"}</span>}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                        {errors.ticket_id && <p className="text-sm text-primary-ink">{errors.ticket_id}</p>}
                        {event.has_promo_codes && ticket?.price > 0 && (
                          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line/20 p-4 sm:flex-row sm:items-end">
                            <Field label="Promo code" className="flex-1">
                              <input className="field uppercase" value={form.promo_code} onChange={(e) => set("promo_code", e.target.value.toUpperCase())} placeholder="e.g. EARLYBIRD" />
                            </Field>
                            <button type="button" onClick={applyPromo} className="btn-ghost h-11" disabled={promoState.busy || !form.promo_code.trim()}>{promoState.busy ? <Spinner /> : <><Tag className="h-4 w-4" />Apply</>}</button>
                          </div>
                        )}
                        {promoState.message && <p className={`text-sm ${promoState.valid ? "text-emerald-700" : "text-primary-ink"}`}>{promoState.message}</p>}
                      </div>
                    )}

                    {step === 1 && (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <h2 className="text-xl font-semibold sm:col-span-2">About you</h2>
                        <Field label="First name" error={errors.first_name}><input className="field" autoComplete="given-name" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} data-testid="reg-first" /></Field>
                        <Field label="Last name" error={errors.last_name}><input className="field" autoComplete="family-name" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} data-testid="reg-last" /></Field>
                        <Field label="Work email" error={errors.email} className="sm:col-span-2" hint="Your confirmation and pass go here."><input className="field" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} data-testid="reg-email" /></Field>
                        <Field label="Company" error={errors.company}><input className="field" autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} data-testid="reg-company" /></Field>
                        <Field label="Job title" error={errors.job_title}><input className="field" autoComplete="organization-title" value={form.job_title} onChange={(e) => set("job_title", e.target.value)} data-testid="reg-title" /></Field>
                        <Field label="Phone (optional)"><input className="field" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                        <Field label="Country (optional)">
                          <input className="field" list="countries" autoComplete="country-name" value={form.country} onChange={(e) => set("country", e.target.value)} />
                          <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
                        </Field>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-7">
                        <div>
                          <h2 className="text-xl font-semibold">Which days will you join?</h2>
                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {event.days.map((d) => <Toggle key={d.id} checked={form.days.includes(d.id)} onChange={() => toggleIn("days", d.id)} testid={`day-${d.id}`}>{d.label}</Toggle>)}
                          </div>
                          {errors.days && <p className="mt-2 text-sm text-primary-ink">{errors.days}</p>}
                        </div>
                        {event.days.some((d) => d.dinner && form.days.includes(d.id)) && (
                          <div>
                            <h3 className="font-display text-lg font-semibold">Evening receptions</h3>
                            <p className="text-sm text-muted-foreground">Included with your pass. Tell us so we can plan seating.</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {event.days.filter((d) => d.dinner && form.days.includes(d.id)).map((d) => (
                                <Toggle key={d.id} icon={Utensils} checked={form.dinners.includes(d.id)} onChange={() => toggleIn("dinners", d.id)}>
                                  <span className="block font-medium">{d.dinner}</span><span className="text-xs text-muted-foreground">{d.label.split(" · ")[0]}, 5:00 PM</span>
                                </Toggle>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-lg font-semibold">What do you want to get out of Empower?</h3>
                          <p className="text-sm text-muted-foreground">We'll point you to the sessions and people that match.</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {event.interests.map((i) => {
                              const on = form.interests.includes(i.key);
                              return (
                                <button type="button" key={i.key} onClick={() => toggleIn("interests", i.key)} aria-pressed={on} className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-foreground bg-foreground text-background" : "border-line/15 hover:border-line/30"}`} data-testid={`interest-${i.key}`}>
                                  {on && <Check className="-ml-1 mr-1 inline h-3.5 w-3.5" />}{i.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <Toggle icon={Code2} checked={form.hackathon} onChange={(v) => set("hackathon", v)}>I'm interested in the SOLIXEmpower hackathon</Toggle>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="Dietary requirements (optional)"><input className="field" value={form.dietary} onChange={(e) => set("dietary", e.target.value)} placeholder="Vegetarian, gluten free…" /></Field>
                          <Field label="How did you hear about us? (optional)">
                            <select className="field" value={form.how_heard} onChange={(e) => set("how_heard", e.target.value)}>
                              <option value="">Select…</option>
                              {HOW_HEARD.map((h) => <option key={h}>{h}</option>)}
                            </select>
                          </Field>
                          <Field label="Accessibility needs (optional)" className="sm:col-span-2"><textarea className="field" rows={2} value={form.accessibility} onChange={(e) => set("accessibility", e.target.value)} /></Field>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Review {payable ? "and pay" : "and confirm"}</h2>
                        <dl className="grid gap-x-6 gap-y-3 rounded-2xl bg-muted p-5 text-sm sm:grid-cols-2">
                          <div><dt className="text-muted-foreground">Attendee</dt><dd className="font-medium">{form.first_name} {form.last_name}</dd></div>
                          <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium break-all">{form.email}</dd></div>
                          <div><dt className="text-muted-foreground">Company</dt><dd className="font-medium">{form.company} · {form.job_title}</dd></div>
                          <div><dt className="text-muted-foreground">Days</dt><dd className="font-medium">{event.days.filter((d) => form.days.includes(d.id)).map((d) => d.label.split(" · ")[0]).join(", ")}</dd></div>
                        </dl>
                        {needsInvoice && (
                          <div className="grid gap-5 rounded-2xl border border-line/15 p-5 sm:grid-cols-2">
                            <p className="flex items-center gap-2 font-medium sm:col-span-2"><FileText className="h-4 w-4 text-blue" /> Invoice details</p>
                            <Field label="Billing contact email or name" error={errors.billing_contact}><input className="field" value={form.billing_contact} onChange={(e) => set("billing_contact", e.target.value)} /></Field>
                            <Field label="PO number (optional)"><input className="field" value={form.po_number} onChange={(e) => set("po_number", e.target.value)} /></Field>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Toggle checked={form.marketing_opt_in} onChange={(v) => set("marketing_opt_in", v)}>Keep me posted about SOLIXEmpower and Solix news. Unsubscribe anytime.</Toggle>
                          <Toggle checked={form.accept_terms} onChange={(v) => set("accept_terms", v)} testid="reg-terms">
                            I agree that Solix Technologies may use these details to manage my registration and contact me about the event, and I accept the event terms (agenda subject to change).
                          </Toggle>
                          {errors.accept_terms && <p className="text-sm text-primary-ink">{errors.accept_terms}</p>}
                        </div>
                        {submit.error && <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary-ink" role="alert">{submit.error}</p>}
                        {submit.pending && (
                          <p className="rounded-xl border border-blue-brand/30 bg-blue-brand/5 p-3 text-sm">
                            Your seat is held as <span className="font-mono font-semibold">{submit.pending.code}</span>. Finish payment in the checkout window. <Link className="text-blue underline" to="/register/confirmed" state={{ registration: submit.pending }}>View my registration</Link>
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-9 flex items-center justify-between gap-3 border-t border-line/10 pt-6">
                  {step > 0 ? <button type="button" onClick={back} className="btn-ghost"><ArrowLeft className="h-4 w-4" />Back</button> : <span />}
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} className="btn-primary" data-testid="reg-next">Continue <ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <button type="submit" className="btn-primary btn-lg" disabled={submit.busy} data-testid="reg-submit">
                      {submit.busy ? <Spinner /> : waitlist ? "Join the waitlist" : payable ? (needsInvoice ? "Request invoice" : <>Continue to payment <Lock className="h-4 w-4" /></>) : "Confirm my free seat"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="dark relative overflow-hidden rounded-3xl bg-ink-950 p-7 text-foreground shadow-lift">
              <div className="glow-field opacity-70" aria-hidden />
              <div className="relative">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50"><Ticket className="h-4 w-4 text-primary" /> Order summary</p>
                <p className="mt-5 font-display text-2xl font-semibold text-white">{ticket?.name || "Choose a pass"}</p>
                <p className="mt-1 text-sm text-white/60">{EVENT.dates}<br />{EVENT.venueLong}</p>
                <div className="my-6 border-t border-dashed border-white/15" />
                {price && (
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70"><dt>Pass</dt><dd>{money(price.price, price.currency)}</dd></div>
                    {price.discount > 0 && <div className="flex justify-between text-emerald-300"><dt>Promo {form.promo_code}</dt><dd>-{money(price.discount, price.currency)}</dd></div>}
                    <div className="flex justify-between border-t border-white/10 pt-3 font-display text-xl font-semibold text-white"><dt>Total</dt><dd data-testid="reg-total">{money(price.total, price.currency)}</dd></div>
                  </dl>
                )}
                <ul className="mt-6 space-y-2 text-sm text-white/70">
                  {INCLUDED.slice(0, 4).map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}</li>)}
                </ul>
                {payable && <p className="mt-6 flex items-center gap-2 text-xs text-white/50"><Lock className="h-3.5 w-3.5" />{ticket.provider === "eventbrite" ? "Checkout by Eventbrite" : ticket.provider === "stripe_link" ? "Secure checkout by Stripe" : "Invoice / PO accepted"}</p>}
              </div>
            </div>
            <p className="mt-4 px-2 text-sm text-muted-foreground">Already registered? <Link to="/register/confirmed" className="font-medium text-blue underline-offset-4 hover:underline">Find your registration</Link></p>
          </aside>
        </div>
      </div>
    </section>
  );
}
