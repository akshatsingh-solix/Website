import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Brand from "./Brand";
import { EVENT, LINKS } from "@/data/event";

const NAV = [
  { to: "/#why", label: "Why attend" },
  { to: "/#agenda", label: "Agenda" },
  { to: "/#speakers", label: "Speakers" },
  { to: "/#venue", label: "Venue" },
  { to: "/history", label: "Past events" },
];

export default function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${overHero && !open ? "dark bg-transparent" : "border-b border-line/10 bg-background/85 backdrop-blur-xl"}`}>
      <div className="container flex h-[72px] items-center justify-between gap-6 text-foreground">
        <Link to="/" className="min-w-0" aria-label={`${EVENT.name} home`}><Brand /></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/75 transition hover:bg-foreground/5 hover:text-foreground">
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={LINKS.mainSite} className="hidden items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-foreground/60 transition hover:text-foreground xl:inline-flex">
            solix.com <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <Link to="/register" className="btn-primary h-10 px-4 sm:px-5" data-testid="header-register"><span className="sm:hidden">Register</span><span className="hidden sm:inline">Get your pass</span></Link>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-line/15 lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container border-t border-line/10 pb-6 pt-2 lg:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block border-b border-line/10 py-3.5 font-display text-lg font-medium">{n.label}</Link>
          ))}
          <a href={LINKS.mainSite} className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground">Visit solix.com <ArrowUpRight className="h-4 w-4" /></a>
        </nav>
      )}
    </header>
  );
}
