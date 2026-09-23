import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Linkedin, Twitter, Youtube, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NAV, OFFICES } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/Logo";
import { submitLead } from "@/lib/api";
import { NAV_LABEL_KEYS } from "./Navbar";

const NewsletterForm = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("footer.invalidEmail"));
      return;
    }
    setState("loading");
    try {
      await submitLead({ type: "newsletter", email, source_page: window.location.pathname });
      setState("done");
      toast.success(t("footer.subscribed"));
    } catch {
      setState("idle");
      toast.error(t("footer.subscribeError"));
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2" data-testid="newsletter-form">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("footer.workEmail")}
        disabled={state !== "idle"}
        className="h-11 rounded-full border-line/15 bg-card px-5 focus-visible:ring-primary"
        data-testid="newsletter-email-input"
        aria-label={t("footer.workEmail")}
      />
      <Button type="submit" size="default" className="h-11 shrink-0" disabled={state !== "idle"} data-testid="newsletter-submit-button">
        {state === "loading" ? <Loader2 className="animate-spin" /> : state === "done" ? <Check /> : <>{t("footer.subscribe")} <ArrowRight /></>}
      </Button>
    </form>
  );
};

export const Footer = () => {
  const { t } = useTranslation();
  return (
  <footer className="dark relative overflow-hidden bg-background text-foreground" data-testid="site-footer">
    <div className="absolute inset-0 grid-lines grid-fade opacity-70" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.18),transparent)]" />
    <div className="container relative pb-10 pt-16 sm:pt-20">
      <div className="grid gap-10 border-b border-line/10 pb-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <Logo tagline />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
        <div className="lg:col-span-7 lg:justify-self-end">
          <p className="eyebrow">{t("footer.stayCurrent")}</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
            <NewsletterForm />
            <div className="flex gap-2">
              {[
                { Icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/solix-technologies" },
                { Icon: Twitter, label: "X", href: "https://x.com/solixtech" },
                { Icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@solixtechnologies" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  data-testid={`footer-social-${label.toLowerCase()}`}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line/10 text-muted-foreground transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line/30 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 pt-12 sm:grid-cols-4 lg:grid-cols-7">
        {NAV.map((col) => {
          const subLinks = col.groups
            ? col.groups.map((g) => ({ label: g.heading, to: col.to }))
            : (col.items || col.simpleItems)?.slice(0, 6);
          return (
            <div key={col.label}>
              <Link to={col.to} className="font-display text-sm font-semibold text-foreground hover:text-primary-ink">{NAV_LABEL_KEYS[col.label] ? t(NAV_LABEL_KEYS[col.label]) : col.label}</Link>
              {subLinks && (
                <ul className="mt-4 space-y-2.5">
                  {subLinks.map((it) => (
                    <li key={it.label}>
                      <Link to={it.to} className="text-sm leading-snug text-muted-foreground transition-colors duration-200 hover:text-foreground" data-testid={`footer-link-${it.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-14 grid gap-6 border-t border-line/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {OFFICES.map((o) => (
          <div key={o.city}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary-ink">{o.label}</p>
            <p className="mt-1.5 text-sm font-medium">{o.city}</p>
            <p className="mt-1 text-xs text-muted-foreground">{o.address}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 select-none overflow-hidden">
        <p className="font-display text-[22vw] font-semibold leading-[0.8] tracking-tighter text-line/[0.05] lg:text-[13vw]">SOLIX</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-line/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {t("footer.copyright")}</p>
        <div className="flex gap-6">
          <a href="https://www.solix.com/privacy-policy/" target="_blank" rel="noreferrer" className="hover:text-foreground">{t("footer.privacy")}</a>
          <a href="https://www.solix.com/terms-and-conditions/" target="_blank" rel="noreferrer" className="hover:text-foreground">{t("footer.terms")}</a>
          <a href="tel:18884676549" className="hover:text-foreground">1.888.GO.SOLIX</a>
        </div>
      </div>
    </div>
  </footer>
  );
};
