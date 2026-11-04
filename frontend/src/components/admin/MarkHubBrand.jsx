// MarkHub is the console; the client whose workspace this is (Solix) sits to its right.
// Files and usage rules: public/brand/markhub/README.md.
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { SolixMark } from "@/components/shared/Logo";

// The Shared Stem symbol: an M and an H share one upright, the only accent-colored part.
// Structure follows the text color; the stem's color is set in index.css (.markhub-signal).
export const MarkHubMark = ({ className }) => (
  <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
    <g fill="currentColor">
      <rect x="8" y="8" width="14" height="80" />
      <polygon points="8,8 22,8 31.5,28.2 41,8 55,8 31.5,58" />
      <rect x="55" y="41" width="19" height="14" />
      <rect x="74" y="8" width="14" height="80" />
    </g>
    <rect className="markhub-signal" x="41" y="8" width="14" height="80" />
  </svg>
);

// compact: in the admin header the client's name hides on phones and beside the md-width search box.
const ClientLogo = ({ compact }) => (
  <span className="inline-flex items-center gap-2" aria-label="Solix">
    <SolixMark className="h-7 w-7 shrink-0" />
    <span className={cn("font-display text-base font-semibold tracking-[0.15em]", compact && "hidden sm:inline md:hidden lg:inline")}>SOLIX</span>
  </span>
);

// Proportions follow the approved lockup: name at 0.78x the symbol, divider at 0.8x.
export const MarkHubLockup = ({ className, compact = false }) => (
  <span className={cn("flex items-center gap-2.5", className)} data-testid="markhub-lockup">
    <MarkHubMark className="h-8 w-8 shrink-0" />
    <span className="font-markhub text-[25px] font-semibold leading-none">MarkHub</span>
    <span className="h-[26px] w-px bg-current opacity-25" aria-hidden="true" />
    <ClientLogo compact={compact} />
  </span>
);

// Admin tabs read "MarkHub · Solix" with the MarkHub icon; the public site's own title and icon come back on leave.
export const useMarkHubChrome = () => {
  useEffect(() => {
    const icon = document.querySelector("link[rel='icon']");
    const before = { title: document.title, href: icon?.getAttribute("href"), type: icon?.getAttribute("type") };
    document.title = "MarkHub · Solix";
    if (icon) {
      icon.setAttribute("href", `${process.env.PUBLIC_URL || ""}/brand/markhub/favicon.svg`);
      icon.setAttribute("type", "image/svg+xml");
    }
    return () => {
      document.title = before.title;
      if (icon && before.href) icon.setAttribute("href", before.href);
      if (icon && before.type) icon.setAttribute("type", before.type);
    };
  }, []);
};
