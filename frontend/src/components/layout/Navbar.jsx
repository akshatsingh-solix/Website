import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight, ChevronDown, LogIn, Menu, Phone, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCE } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/shared/Logo";
import { Magnetic } from "@/components/shared/Reveal";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { LanguageDetectionNotice } from "@/components/shared/LanguageDetectionNotice";
import { useAccount } from "@/components/account/AccountAuth";
import { useTx } from "@/i18n/tx";

// Only the site's top-level nav chrome is translated so far - the deep
// mega-menu content (product/solution/industry names) is still English
// and is being translated page by page. Keyed off the English label so
// data/site.js doesn't need restructuring for this first pass.
// English source: this component translates its own copy via tx() and
// keeps ids/test ids on the English labels.
const NAV = SOURCE.NAV;

export const NAV_LABEL_KEYS = {
  Platform: "nav.platform",
  Products: "nav.products",
  Solutions: "nav.solutions",
  "Services & Support": "nav.servicesSupport",
  Resources: "nav.resources",
  Partners: "nav.partners",
  Company: "nav.company",
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Display copy goes through tx(); ids and test ids stay on the English
// source so they're stable in every language.
const GroupedPanel = ({ item, onNavigate }) => {
  const tx = useTx();
  return (
    <div className="grid gap-8 p-8 lg:grid-cols-4 lg:p-10" data-testid={`mega-panel-${slug(item.label)}`}>
      {item.groups.map((group) => (
        <div key={group.heading}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-ink">{tx(group.heading)}</p>
          <div className="mt-4 flex flex-col gap-0.5">
            {group.items.map(({ label, desc, to }) => (
              <Link key={label} to={to} onClick={onNavigate} data-testid={`mega-link-${slug(label)}`} className="group -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-muted">
                <span className="block text-sm font-medium text-foreground group-hover:text-primary-ink">{tx(label)}</span>
                {desc && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{tx(desc)}</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SimpleLinksPanel = ({ item, onNavigate }) => {
  const tx = useTx();
  return (
    <div className="grid gap-x-8 gap-y-1 p-8 sm:grid-cols-2 lg:grid-cols-4 lg:p-10" data-testid={`mega-panel-${slug(item.label)}`}>
      {item.simpleItems.map(({ label, to }) => (
        <Link key={label} to={to} onClick={onNavigate} data-testid={`mega-link-${slug(label)}`} className="rounded-lg px-2 py-2.5 text-[15px] text-foreground transition-colors duration-200 hover:bg-muted hover:text-teal">
          {tx(label)}
        </Link>
      ))}
    </div>
  );
};

const FlatPanel = ({ item, onNavigate, label }) => {
  const tx = useTx();
  return (
    <div className="grid lg:grid-cols-12" data-testid={`mega-panel-${slug(item.label)}`}>
      <div className="dark relative overflow-hidden bg-background p-8 text-foreground lg:col-span-4">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.35),transparent)]" />
        <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.3),transparent)]" />
        <p className="eyebrow relative mb-3">{label}</p>
        <p className="relative max-w-xs text-sm leading-relaxed text-muted-foreground">{tx(item.blurb)}</p>
        <Link to={item.featured.to} onClick={onNavigate} data-testid={`mega-featured-${item.label.toLowerCase()}`} className="group relative mt-8 block rounded-xl border border-line/10 bg-card/70 p-5 transition-[border-color,background-color] duration-300 hover:border-primary/60 hover:bg-card">
          <p className="font-display text-lg font-medium">{tx(item.featured.title)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tx(item.featured.desc)}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink">
            {tx("Explore")} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
      <div className="grid gap-1 p-4 sm:grid-cols-2 lg:col-span-8 lg:p-6">
        {item.items.map(({ label: itemLabel, desc, to, icon: Icon }) => (
          <Link key={itemLabel} to={to} onClick={onNavigate} data-testid={`mega-link-${slug(itemLabel)}`} className="group flex items-start gap-4 rounded-xl p-4 transition-colors duration-200 hover:bg-muted">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line/10 bg-accent/60 text-teal transition-colors duration-200 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary-ink">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span>
              <span className="block font-medium text-foreground">{tx(itemLabel)}</span>
              {desc && <span className="mt-0.5 block text-sm text-muted-foreground">{tx(desc)}</span>}
            </span>
          </Link>
        ))}
        <Link to={item.to} onClick={onNavigate} data-testid={`mega-viewall-${item.label.toLowerCase()}`} className="group mt-2 flex items-center justify-between rounded-xl border border-dashed border-line/15 px-4 py-3 text-sm text-muted-foreground transition-colors duration-200 hover:border-line/40 hover:text-foreground sm:col-span-2">
          {tx("View all")} · {label}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

const MegaPanel = ({ item, onNavigate, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    className="absolute inset-x-0 top-full pt-3"
  >
    <div className="container">
      <div className="max-h-[75vh] overflow-hidden overflow-y-auto rounded-2xl border border-line/10 bg-popover shadow-[0_2px_6px_rgba(13,25,45,0.05),0_40px_80px_-30px_rgba(13,25,45,0.35)]">
        {item.groups ? (
          <GroupedPanel item={item} onNavigate={onNavigate} />
        ) : item.simpleItems ? (
          <SimpleLinksPanel item={item} onNavigate={onNavigate} />
        ) : (
          <FlatPanel item={item} onNavigate={onNavigate} label={label} />
        )}
      </div>
    </div>
  </motion.div>
);

/** Sign-in state aware: Login / Try Solix, or the trial account link. */
const AccountButtons = ({ onNavigate, stacked = false }) => {
  const { t } = useTranslation();
  const tx = useTx();
  const { account } = useAccount() || {};
  const size = stacked ? "lg" : "sm";
  if (account) {
    return (
      <>
        <Button asChild variant="outline" size={size} data-testid="nav-account">
          <Link to="/account" onClick={onNavigate}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-teal text-[10px] font-semibold text-white">{account.first_name?.[0]?.toUpperCase()}</span>
            {tx("My trial")}
          </Link>
        </Button>
        <Button asChild size={size} className={stacked ? undefined : "hidden sm:inline-flex"} data-testid="nav-request-demo">
          <Link to="/contact?type=demo" onClick={onNavigate}>{tx("Request a demo")} <ArrowRight /></Link>
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild variant="outline" size={size} data-testid={stacked ? "mobile-nav-login" : "nav-login"}>
        <Link to="/signin" onClick={onNavigate}><LogIn /> {t("nav.login")}</Link>
      </Button>
      {stacked ? (
        <Button asChild size={size} data-testid="mobile-nav-demo">
          <Link to="/signup" onClick={onNavigate}>{t("nav.trySolix")} <ArrowRight /></Link>
        </Button>
      ) : (
        <Magnetic strength={0.2} className="hidden sm:block">
          <Button asChild size={size} data-testid="nav-try-solix">
            <Link to="/signup">{t("nav.trySolix")} <ArrowRight /></Link>
          </Button>
        </Magnetic>
      )}
    </>
  );
};

const MobileNav = ({ onNavigate }) => {
  const { t } = useTranslation();
  const tx = useTx();
  return (
    <div className="flex h-full flex-col">
      <Accordion type="single" collapsible className="mt-6 w-full">
        {NAV.map((item) => {
          const flatItems = item.groups ? item.groups.flatMap((g) => g.items) : item.items || item.simpleItems;
          const label = NAV_LABEL_KEYS[item.label] ? t(NAV_LABEL_KEYS[item.label]) : tx(item.label);
          if (!flatItems) {
            return (
              <Link key={item.label} to={item.to} onClick={onNavigate} className="flex items-center justify-between border-b border-line/10 py-4 font-display text-lg" data-testid={`mobile-nav-${item.label.toLowerCase()}`}>
                {label}
              </Link>
            );
          }
          return (
            <AccordionItem key={item.label} value={item.label} className="border-line/10">
              <AccordionTrigger className="font-display text-lg hover:no-underline" data-testid={`mobile-nav-${item.label.toLowerCase()}`}>
                {label}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pb-2">
                  <Link to={item.to} onClick={onNavigate} className="rounded-lg px-3 py-2 text-sm font-medium text-primary-ink hover:bg-muted">
                    {tx("View all")} · {label}
                  </Link>
                  {flatItems.map(({ label: itemLabel, to }) => (
                    <Link key={itemLabel} to={to} onClick={onNavigate} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                      {tx(itemLabel)}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <div className="mt-5">
        <LanguageSwitcher className="rounded-lg border border-input px-3 py-2" />
      </div>
      <div className="mt-6 flex flex-col gap-3 pt-2">
        <AccountButtons onNavigate={onNavigate} stacked />
      </div>
    </div>
  );
};

/**
 * Slim bar above the main navigation (tablet and up): the Solix ECS trial
 * promo, phone, contact and the language switcher. Keeping language here
 * frees the main bar for a clearly labelled Login button in every
 * language. It folds away once the page scrolls.
 */
const UtilityBar = ({ hidden }) => {
  const tx = useTx();
  return (
    <div className={cn("hidden overflow-hidden border-b border-line/10 bg-muted/80 transition-[max-height,opacity] duration-300 md:block", hidden ? "max-h-0 border-transparent opacity-0" : "max-h-10 opacity-100")} data-testid="utility-bar">
      <div className="container flex h-9 items-center justify-between gap-6 text-xs">
        <Link to="/signup" className="group flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground" data-testid="utility-trial-link">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
            <Sparkles className="h-3 w-3" /> {tx("New")}
          </span>
          <span className="truncate">{tx("Solix ECS: talk to your enterprise data.")}</span>
          <span className="hidden shrink-0 font-semibold text-teal group-hover:underline lg:inline">{tx("Start your 30-day free trial")} →</span>
        </Link>
        <div className="flex shrink-0 items-center gap-5 text-muted-foreground">
          <a href="tel:18884676549" className="hidden items-center gap-1.5 transition-colors hover:text-foreground lg:inline-flex"><Phone className="h-3.5 w-3.5" /> 1.888.GO.SOLIX</a>
          <Link to="/contact?type=contact" className="transition-colors hover:text-foreground">{tx("Contact sales")}</Link>
          <LanguageSwitcher className="text-xs" />
        </div>
      </div>
    </div>
  );
};

export const Navbar = () => {
  const { t } = useTranslation();
  const tx = useTx();
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
  const labelOf = (item) => (NAV_LABEL_KEYS[item.label] ? t(NAV_LABEL_KEYS[item.label]) : tx(item.label));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open ? "border-b border-line/10 bg-background/90 shadow-[0_8px_30px_-18px_rgba(13,25,45,0.25)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      )}
      onMouseLeave={() => setOpen(null)}
      data-testid="site-header"
    >
      <LanguageDetectionNotice />
      <UtilityBar hidden={scrolled} />
      <div className="container flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label={tx("Primary")}>
          {NAV.map((item) => {
            const hasDropdown = Boolean(item.items || item.groups || item.simpleItems);
            return (
              <div key={item.label} onMouseEnter={() => hasDropdown && setOpen(item.label)} className="relative">
                <NavLink
                  to={item.to}
                  data-testid={`nav-${slug(item.label)}`}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-2 text-[13.5px] transition-colors duration-200 2xl:px-3 2xl:text-sm",
                      isActive || open === item.label ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {labelOf(item)}
                  {hasDropdown && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open === item.label && "rotate-180")} />}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <AccountButtons />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="ml-1 grid h-10 w-10 place-items-center rounded-full border border-line/15 bg-background/70 xl:hidden" aria-label={tx("Open menu")} data-testid="mobile-menu-button">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto border-line/10 bg-background p-6">
              <SheetTitle className="sr-only">{tx("Navigation")}</SheetTitle>
              <Logo />
              <MobileNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AnimatePresence>{active && <MegaPanel key={active.label} item={active} label={labelOf(active)} onNavigate={() => setOpen(null)} />}</AnimatePresence>
    </header>
  );
};
