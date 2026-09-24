import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { SmartImage } from "../ui";
import { useCountdown } from "@/lib/useCountdown";
import { fmtDate, mainTicket, money, useEvent } from "@/lib/useEvent";
import { EVENT } from "@/data/event";

function Countdown() {
  const c = useCountdown(EVENT.start);
  if (c.done) return null;
  const cells = [["Days", c.days], ["Hours", c.hours], ["Min", c.minutes], ["Sec", c.seconds]];
  return (
    <div className="flex gap-2" aria-label={`${c.days} days until the event`} data-testid="countdown">
      {cells.map(([l, v]) => (
        <div key={l} className="min-w-[64px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center backdrop-blur">
          <div className="font-display text-2xl font-semibold tabular-nums text-white">{String(v).padStart(2, "0")}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/50">{l}</div>
        </div>
      ))}
    </div>
  );
}

// The pass itself, as an object you want to hold: tilts toward the cursor.
function PassCard() {
  const { data } = useEvent();
  const ticket = mainTicket(data);
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 18 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[400px]"
    >
      <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-primary/40 via-transparent to-blue-brand/40 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-ink-800/90 via-ink-900/95 to-ink-950 p-7 shadow-lift backdrop-blur-xl">
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Admit one · {EVENT.shortDates}</span>
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-8 font-display text-3xl font-semibold leading-tight text-white">{ticket?.name || "Full event pass"}</p>
          <p className="mt-2 text-sm text-white/60">3 days · keynotes · workshops · hackathon finals · 2 evening receptions</p>
          <div className="my-7 border-t border-dashed border-white/20" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Venue</p><p className="mt-1 text-white/90">Qualcomm Institute, UC San Diego</p></div>
            <div><p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Price</p><p className="mt-1 font-display text-xl font-semibold text-white">{money(ticket?.price, ticket?.currency)}</p></div>
          </div>
          <Link to="/register" className="btn-primary btn-lg mt-7 w-full" data-testid="hero-pass-register">Claim your pass <ArrowRight className="h-4 w-4" /></Link>
          <p className="mt-3 text-center text-xs text-white/50">
            {ticket?.sales_ended ? "Pass sales have ended" : `${data.seats_left != null ? `${data.seats_left} seats left` : "Limited seats"}${ticket?.sales_end_at ? ` · sales end ${fmtDate(ticket.sales_end_at)}` : ""}`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="dark relative isolate overflow-hidden bg-ink-950 pb-20 pt-32 text-foreground md:pb-28 md:pt-40">
      <SmartImage sources={EVENT.heroImages} alt="" loading="eager" className="hero-drift absolute inset-0 -z-20 h-full w-full object-cover opacity-50" fallback={null} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/60 via-ink-950/80 to-ink-950" aria-hidden />
      <div className="glow-field -z-10" aria-hidden />
      <div className="grid-lines absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />

      <div className="container grid items-center gap-14 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            <span className="hidden sm:inline">SOLIXEmpower 2026 · {EVENT.edition} · </span>Registration open
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="mt-7 text-fluid-hero font-semibold text-white">
            The <span className="text-gradient-accent">Agentic</span><br />Enterprise
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }} className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
            {EVENT.subtitle}. Three days with the leaders, researchers and Solix users putting AI agents to work on trusted enterprise data.
          </motion.p>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{EVENT.dates}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{EVENT.venue}, UC San Diego</li>
          </motion.ul>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/register" className="btn-primary btn-lg" data-testid="hero-register">Register now <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/#agenda" className="btn-ghost btn-lg border-white/20 bg-white/5 text-white hover:bg-white/10">Explore the agenda</Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10"><Countdown /></motion.div>
        </div>
        <div className="flex justify-center lg:justify-end"><PassCard /></div>
      </div>
      <p className="container mt-16 text-xs uppercase tracking-[0.2em] text-white/40">{EVENT.collaboration}</p>
    </section>
  );
}
