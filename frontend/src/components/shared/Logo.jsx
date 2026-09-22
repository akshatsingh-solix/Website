import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const SolixMark = ({ className }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#EE2424" />
    <path d="M23.5 3.5 10.5 22.5h8.2L15.2 37 30 17h-8.2L26 3.5Z" fill="#FFFFFF" />
  </svg>
);

export const Logo = ({ className, compact = false, tagline = false, light = false }) => (
  <Link to="/" aria-label="Solix Technologies home" data-testid="nav-logo" className={cn("group inline-flex items-center gap-2.5", className)}>
    <SolixMark className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:rotate-[-8deg]" />
    {!compact && (
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[22px] font-semibold tracking-[0.12em]", light ? "text-ink-950" : "text-foreground")}>
          SOLIX<sup className="ml-0.5 text-[8px] font-medium tracking-normal opacity-60">TM</sup>
        </span>
        {tagline && <span className="mt-1 font-sans text-[10px] tracking-wide text-muted-foreground">Empowering the Data-driven Enterprise</span>}
      </span>
    )}
  </Link>
);
