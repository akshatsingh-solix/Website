import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Linkedin, Twitter, Youtube, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NAV, OFFICES } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/Logo";
import { submitLead } from "@/lib/api";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid work email.");
      return;
    }
    setState("loading");
    try {
      await submitLead({ type: "newsletter", email, source_page: window.location.pathname });
      setState("done");
      toast.success("You're subscribed. Welcome to the Solix community.");
    } catch {
      setState("idle");
      toast.error("Could not subscribe right now. Please try again.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-md gap-2" data-testid="newsletter-form">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        disabled={state !== "idle"}
        className="h-11 rounded-full border-white/15 bg-ink-900 px-5 focus-visible:ring-primary"
        data-testid="newsletter-email-input"
        aria-label="Work email"
      />
      <Button type="submit" size="default" className="h-11 shrink-0" disabled={state !== "idle"} data-testid="newsletter-submit-button">
        {state === "loading" ? <Loader2 className="animate-spin" /> : state === "done" ? <Check /> : <>Subscribe <ArrowRight /></>}
      </Button>
    </form>
  );
};

export const Footer = () => (
  <footer className="relative overflow-hidden border-t border-white/10 bg-ink-950" data-testid="site-footer">
    <div className="absolute inset-0 grid-lines opacity-40" />
    <div className="container relative pt-20 pb-10 sm:pt-24">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tagline />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Solix Technologies activates enterprise data across every system and every era, so businesses can put AI to work inside the trust perimeter IT defines.
          </p>
          <p className="mt-8 eyebrow">Stay current</p>
          <NewsletterForm />
          <div className="mt-8 flex gap-2">
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
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted-foreground transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
          {NAV.map((col) => (
            <div key={col.label}>
              <Link to={col.to} className="font-display text-sm font-semibold text-foreground">{col.label}</Link>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <Link to={it.to} className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground" data-testid={`footer-link-${it.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {OFFICES.map((o) => (
          <div key={o.city}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{o.label}</p>
            <p className="mt-1.5 text-sm font-medium">{o.city}</p>
            <p className="mt-1 text-xs text-muted-foreground">{o.address}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 select-none overflow-hidden">
        <p className="font-display text-[22vw] font-semibold leading-[0.8] tracking-tighter text-white/[0.035] lg:text-[16vw]">SOLIX</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Solix Technologies, Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/company#privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/company#terms" className="hover:text-foreground">Terms</Link>
          <a href="tel:18884676549" className="hover:text-foreground">1.888.GO.SOLIX</a>
        </div>
      </div>
    </div>
  </footer>
);
