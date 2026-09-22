import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, LogIn, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/shared/Logo";
import { Magnetic } from "@/components/shared/Reveal";

const GroupedPanel = ({ item, onNavigate }) => (
  <div className="grid gap-8 p-8 lg:grid-cols-4 lg:p-10" data-testid={`mega-panel-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
    {item.groups.map((group) => (
      <div key={group.heading}>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{group.heading}</p>
        <div className="mt-4 flex flex-col gap-0.5">
          {group.items.map(({ label, desc, to }) => (
            <Link
              key={label}
              to={to}
              onClick={onNavigate}
              data-testid={`mega-link-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="group -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-white/5"
            >
              <span className="block text-sm font-medium text-slate-200 group-hover:text-foreground">{label}</span>
              {desc && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{desc}</span>}
            </Link>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const FlatPanel = ({ item, onNavigate }) => (
  <div className="grid lg:grid-cols-12" data-testid={`mega-panel-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
    <div className="relative border-b border-white/10 p-8 lg:col-span-4 lg:border-b-0 lg:border-r">
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <p className="eyebrow mb-3">{item.label}</p>
      <p className="max-w-xs text-sm leading-relaxed text-slate-300">{item.blurb}</p>
      <Link
        to={item.featured.to}
        onClick={onNavigate}
        data-testid={`mega-featured-${item.label.toLowerCase()}`}
        className="group mt-8 block rounded-xl border border-white/10 bg-ink-900/70 p-5 transition-[border-color,background-color] duration-300 hover:border-primary/50 hover:bg-ink-900"
      >
        <p className="font-display text-lg font-medium">{item.featured.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.featured.desc}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
          Explore <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    </div>
    <div className="grid gap-1 p-4 sm:grid-cols-2 lg:col-span-8 lg:p-6">
      {item.items.map(({ label, desc, to, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          onClick={onNavigate}
          data-testid={`mega-link-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="group flex items-start gap-4 rounded-xl p-4 transition-colors duration-200 hover:bg-white/5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-900 text-slate-300 transition-colors duration-200 group-hover:border-primary/50 group-hover:text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <span>
            <span className="block font-medium text-foreground">{label}</span>
            {desc && <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>}
          </span>
        </Link>
      ))}
      <Link
        to={item.to}
        onClick={onNavigate}
        data-testid={`mega-viewall-${item.label.toLowerCase()}`}
        className="group mt-2 flex items-center justify-between rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-muted-foreground transition-colors duration-200 hover:border-white/40 hover:text-foreground sm:col-span-2"
      >
        View all {item.label.toLowerCase()}
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </div>
  </div>
);

const MegaPanel = ({ item, onNavigate }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    className="absolute inset-x-0 top-full pt-3"
  >
    <div className="container">
      <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-ink-950/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        {item.groups ? <GroupedPanel item={item} onNavigate={onNavigate} /> : <FlatPanel item={item} onNavigate={onNavigate} />}
      </div>
    </div>
  </motion.div>
);

const MobileNav = ({ onNavigate }) => (
  <div className="flex h-full flex-col">
    <Accordion type="single" collapsible className="mt-6 w-full">
      {NAV.map((item) => {
        const flatItems = item.groups ? item.groups.flatMap((g) => g.items) : item.items;
        if (!flatItems) {
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className="flex items-center justify-between border-b border-white/10 py-4 font-display text-lg"
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <AccordionItem key={item.label} value={item.label} className="border-white/10">
            <AccordionTrigger className="font-display text-lg hover:no-underline" data-testid={`mobile-nav-${item.label.toLowerCase()}`}>
              {item.label}
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1 pb-2">
                <Link to={item.to} onClick={onNavigate} className="rounded-lg px-3 py-2 text-sm text-primary hover:bg-white/5">
                  All {item.label}
                </Link>
                {flatItems.map(({ label, to }) => (
                  <Link key={label} to={to} onClick={onNavigate} className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-foreground">
                    {label}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
    <div className="mt-auto flex flex-col gap-3 pt-8">
      <Button asChild size="lg" data-testid="mobile-nav-demo">
        <Link to="/contact?type=demo" onClick={onNavigate}>Try Solix</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link to="/services-support#support-portal" onClick={onNavigate}><LogIn /> Login</Link>
      </Button>
    </div>
  </div>
);

export const Navbar = () => {
  const [open, setOpen] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const active = NAV.find((n) => n.label === open);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open ? "glass border-b border-white/10 bg-ink-950/75" : "border-b border-transparent bg-transparent"
      )}
      onMouseLeave={() => setOpen(null)}
      data-testid="site-header"
    >
      <div className="container flex h-16 items-center justify-between lg:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const hasDropdown = Boolean(item.items || item.groups);
            return (
              <div key={item.label} onMouseEnter={() => hasDropdown && setOpen(item.label)} className="relative">
                <NavLink
                  to={item.to}
                  data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm transition-colors duration-200",
                      isActive || open === item.label ? "text-foreground" : "text-slate-300 hover:text-foreground"
                    )
                  }
                >
                  {item.label}
                  {hasDropdown && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open === item.label && "rotate-180")} />}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm" data-testid="nav-login">
            <Link to="/services-support#support-portal"><LogIn className="h-4 w-4" /> Login</Link>
          </Button>
          <Magnetic strength={0.2}>
            <Button asChild size="sm" data-testid="nav-try-solix">
              <Link to="/contact?type=demo">Try Solix <ArrowRight /></Link>
            </Button>
          </Magnetic>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 lg:hidden" aria-label="Open menu" data-testid="mobile-menu-button">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm border-white/10 bg-ink-950 p-6">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
            <MobileNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <AnimatePresence>{active && <MegaPanel key={active.label} item={active} onNavigate={() => setOpen(null)} />}</AnimatePresence>
    </header>
  );
};
