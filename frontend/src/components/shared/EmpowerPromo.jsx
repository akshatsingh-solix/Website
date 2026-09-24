import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, MapPin, Ticket, X } from "lucide-react";
import { getConsent, privacySignal, track } from "@/lib/intent";
import { EMPOWER, empowerIsLive, empowerLink } from "@/lib/empower";
import { useTx } from "@/i18n/tx";

// Bottom-left invitation to SOLIXEmpower. It waits until the cookie choice is
// made (the consent banner uses the same corner), opens once, and after it's
// closed stays as a small pill so the event is always one click away.
const STATE_KEY = "solix-empower-promo"; // "min" (pill) | "hidden" (pill closed too)
const HIDE_ON = /^\/(signin|signup|account|ai\/sign)/;

const readState = () => {
  try { return sessionStorage.getItem(STATE_KEY) || localStorage.getItem(STATE_KEY); } catch { return null; }
};
const writeState = (v, durable) => {
  try { (durable ? localStorage : sessionStorage).setItem(STATE_KEY, v); } catch { /* storage blocked */ }
};

function useDaysLeft() {
  const calc = () => Math.max(0, Math.ceil((new Date(EMPOWER.start).getTime() - Date.now()) / 864e5));
  const [days, setDays] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setDays(calc()), 60_000);
    return () => clearInterval(t);
  }, []);
  return days;
}

function Face({ name, src, i }) {
  const [failed, setFailed] = useState(false);
  const initials = name.replace(/^Dr\.\s+/, "").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span className="relative -ml-2 grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-[#0D192D] bg-gradient-to-br from-[#2C4A66] to-[#112036] text-[10px] font-semibold text-white first:ml-0" style={{ zIndex: 10 - i }} title={name}>
      {failed ? initials : <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />}
    </span>
  );
}

export const EmpowerPromo = () => {
  const tx = useTx();
  const { pathname } = useLocation();
  const days = useDaysLeft();
  const [ready, setReady] = useState(false);
  // Phones start with the compact pill: a full card would cover most of the first screen.
  const [mode, setMode] = useState(() => {
    const saved = readState();
    if (saved === "hidden" || saved === "min" || saved === "card") return saved;
    return window.matchMedia?.("(max-width: 639px)").matches ? "min" : "card";
  });
  const [imgOk, setImgOk] = useState(true);

  // Appear only once the visitor has answered the cookie banner (or it won't be shown).
  useEffect(() => {
    let t;
    const arm = () => { t = setTimeout(() => setReady(true), 2500); };
    if (getConsent() || privacySignal()) arm();
    const onConsent = () => { clearTimeout(t); arm(); };
    window.addEventListener("solix:consent", onConsent);
    return () => { clearTimeout(t); window.removeEventListener("solix:consent", onConsent); };
  }, []);
  // Reopening the cookie banner takes the corner back.
  useEffect(() => {
    const onOpen = () => setReady(false);
    window.addEventListener("solix:consent-open", onOpen);
    return () => window.removeEventListener("solix:consent-open", onOpen);
  }, []);

  useEffect(() => {
    if (ready && mode === "card") track("cta", { meta: { cta: "empower_promo_view" } });
  }, [ready, mode]);

  if (!empowerIsLive() || HIDE_ON.test(pathname) || mode === "hidden") return null;

  const minimize = () => { setMode("min"); writeState("min", false); };
  const hide = () => { setMode("hidden"); writeState("hidden", false); };
  const countdown = days > 1 ? tx("{{count}} days to go", { count: days }) : days === 1 ? tx("Tomorrow") : tx("Happening now");

  return (
    <AnimatePresence>
      {ready && mode === "card" && (
        <motion.aside
          key="card"
          role="complementary"
          aria-label={EMPOWER.name}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-4 z-[55] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#0D192D] text-white shadow-[0_2px_8px_rgba(13,25,45,0.2),0_40px_90px_-30px_rgba(13,25,45,0.8)] max-sm:bottom-24"
          data-testid="empower-promo"
        >
          <div className="relative h-36 overflow-hidden">
            {imgOk && <img src={EMPOWER.image} alt="" onError={() => setImgOk(false)} className="absolute inset-0 h-full w-full object-cover opacity-60" />}
            <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_0%_0%,rgba(238,36,36,0.55),transparent_60%),radial-gradient(80%_120%_at_100%_100%,rgba(0,136,207,0.55),transparent_60%)]" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D192D] via-[#0D192D]/40 to-transparent" aria-hidden />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" aria-hidden />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-[#EE2424]" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#EE2424]" /></span>
              {countdown}
            </span>
            <button type="button" onClick={minimize} aria-label={tx("Minimize")} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white/80 backdrop-blur transition hover:bg-black/50 hover:text-white" data-testid="empower-promo-close">
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">SOLIX<span className="text-[#FF4D4D]">Empower</span> 2026</p>
              <p className="font-display text-2xl font-semibold leading-tight tracking-tight">{tx("The Agentic Enterprise")}</p>
            </div>
          </div>
          <div className="p-4 pt-3">
            <p className="text-[13px] leading-relaxed text-white/70">{tx("Three days of Enterprise AI keynotes, panels and hands-on workshops with CIOs, CDOs and UC San Diego researchers.")}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#FF4D4D]" />{EMPOWER.dates}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#FF4D4D]" />{EMPOWER.place}</span>
              <span className="inline-flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5 text-[#FF4D4D]" />{tx("Full pass {{price}}", { price: EMPOWER.price })}</span>
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex">{EMPOWER.faces.map((f, i) => <Face key={f.name} {...f} i={i} />)}</span>
              <span className="text-xs text-white/60">{tx("{{count}}+ speakers from KPMG, JPMorganChase, Pfizer and more", { count: EMPOWER.speakers })}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <a href={empowerLink("promo_card", "register")} data-intent="empower_register" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#EE2424] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(238,36,36,0.8)] transition hover:bg-[#B91C1C]" data-testid="empower-promo-register">
                {tx("Get your pass")} <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href={empowerLink("promo_card")} data-intent="empower_explore" className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-medium text-white/90 transition hover:bg-white/10">
                {tx("Explore")}
              </a>
            </div>
          </div>
        </motion.aside>
      )}
      {ready && mode === "min" && (
        <motion.div
          key="pill"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-5 left-4 z-[55] flex max-w-[calc(100vw-11rem)] items-center rounded-full border border-white/10 bg-[#0D192D] text-white shadow-[0_18px_40px_-12px_rgba(13,25,45,0.7)] max-sm:bottom-5"
          data-testid="empower-pill"
        >
          <button type="button" onClick={() => { setMode("card"); writeState("card", false); }} className="flex min-w-0 items-center gap-2.5 py-2 pl-2 pr-3 text-left" aria-label={tx("Open SOLIXEmpower 2026 details")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#EE2424] to-[#0088CF] font-display text-sm font-bold">E</span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-[13px] font-semibold">SOLIXEmpower 2026</span>
              <span className="block truncate text-[11px] text-white/60">{countdown} · {EMPOWER.place}</span>
            </span>
          </button>
          <button type="button" onClick={hide} aria-label={tx("Dismiss")} className="mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
