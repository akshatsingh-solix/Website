import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import WhyAttend from "@/components/home/WhyAttend";
import Agenda from "@/components/home/Agenda";
import Speakers from "@/components/home/Speakers";
import Hackathon from "@/components/home/Hackathon";
import Pass from "@/components/home/Pass";
import Legacy from "@/components/home/Legacy";
import Venue from "@/components/home/Venue";
import Faq from "@/components/home/Faq";
import { EVENT } from "@/data/event";
import { mainTicket, money, useEvent } from "@/lib/useEvent";

// On phones, keep registration one tap away once the hero scrolls out.
function StickyRegister() {
  const [show, setShow] = useState(false);
  const { data } = useEvent();
  const ticket = mainTicket(data);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`fixed inset-x-3 bottom-3 z-40 transition-all duration-300 md:hidden ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
      <div className="dark flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-950/95 p-3 pl-4 text-foreground shadow-lift backdrop-blur">
        <span className="text-sm"><span className="block font-semibold text-white">{EVENT.shortDates}</span><span className="text-white/60">UC San Diego · {ticket?.price ? `${money(ticket.price, ticket.currency)} pass` : "free pass"}</span></span>
        <Link to="/register" className="btn-primary h-10 px-4">Register <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

export default function Home() {
  useEffect(() => { document.title = `${EVENT.name} · ${EVENT.theme} · ${EVENT.shortDates}, San Diego`; }, []);
  return (
    <>
      <Hero />
      <Stats />
      <WhyAttend />
      <Agenda />
      <Speakers />
      <Hackathon />
      <Pass />
      <Legacy />
      <Venue />
      <Faq />
      <StickyRegister />
    </>
  );
}
