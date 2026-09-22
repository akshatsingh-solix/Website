import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Logo = ({ className, compact = false }) => (
  <Link to="/" aria-label="Solix Technologies home" data-testid="nav-logo" className={cn("group inline-flex items-center gap-2.5", className)}>
    <span className="relative grid h-8 w-8 place-items-center">
      <span className="absolute inset-0 rounded-md border border-white/15 bg-ink-900 transition-colors duration-300 group-hover:border-primary/60" />
      <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="16" height="4" rx="1" className="fill-primary" />
        <rect x="4" y="10" width="16" height="4" rx="1" className="fill-slate-300 transition-transform duration-300 group-hover:translate-x-0.5" />
        <rect x="4" y="16" width="16" height="4" rx="1" className="fill-teal" />
      </svg>
    </span>
    {!compact && (
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        SOLIX<span className="text-primary">.</span>
      </span>
    )}
  </Link>
);
