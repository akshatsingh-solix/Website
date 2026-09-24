import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Facebook, Linkedin, Mail, Phone, Twitter, Youtube } from "lucide-react";
import Brand from "./Brand";
import { Spinner } from "./ui";
import { subscribe } from "@/lib/api";
import { EVENT, LINKS } from "@/data/event";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const onSubmit = async (e) => {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      await subscribe(email);
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  };
  if (state === "done") return <p className="flex items-center gap-2 text-sm text-white/80"><Check className="h-4 w-4 text-emerald-400" /> You're subscribed. Watch your inbox for Empower news.</p>;
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2" data-testid="empower-newsletter">
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" aria-label="Email for the newsletter" className="field h-11 flex-1 border-white/15 bg-white/5 text-white placeholder:text-white/40" />
        <button type="submit" className="btn-primary h-11 shrink-0" disabled={state === "busy"}>{state === "busy" ? <Spinner /> : <>Subscribe <ArrowRight className="h-4 w-4" /></>}</button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </form>
  );
}

const SOCIAL = [
  { href: LINKS.linkedin, label: "LinkedIn", Icon: Linkedin },
  { href: LINKS.twitter, label: "X (Twitter)", Icon: Twitter },
  { href: LINKS.facebook, label: "Facebook", Icon: Facebook },
  { href: LINKS.youtube, label: "YouTube", Icon: Youtube },
];

export default function Footer() {
  return (
    <footer className="dark relative overflow-hidden bg-ink-950 text-foreground">
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
      <div className="container relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {EVENT.theme}: {EVENT.subtitle}. {EVENT.dates} at {EVENT.venueLong}.
            </p>
            <div className="mt-6 flex gap-2">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4 text-white/50">Event</p>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to="/register" className="hover:text-white">Register</Link></li>
              <li><Link to="/#agenda" className="hover:text-white">Agenda</Link></li>
              <li><Link to="/#speakers" className="hover:text-white">Speakers</Link></li>
              <li><Link to="/register/confirmed" className="hover:text-white">Find my registration</Link></li>
              <li><Link to="/history" className="hover:text-white">Past events</Link></li>
              <li><a href={LINKS.justificationLetter} className="hover:text-white">Justification letter</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 text-white/50">Stay in the loop</p>
            <Newsletter />
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href={`mailto:${EVENT.email}`} className="hover:text-white">{EVENT.email}</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" />{EVENT.phone}</li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>Powered by Solix Technologies, Inc. © 2026. All rights reserved. <span className="font-mono">{EVENT.hashtag}</span></p>
          <p className="flex gap-4">
            <a href={LINKS.mainSite} className="hover:text-white">solix.com</a>
            <a href={LINKS.salesContact} className="hover:text-white">Talk to sales</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
