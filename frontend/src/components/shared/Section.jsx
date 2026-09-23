import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/**
 * Storyboard chapter marker ("03 — The platform"). The homepage reads as a
 * numbered narrative - problem, lifecycle, platform, outcomes, proof - so
 * visitors always know where they are in the argument.
 */
export const ChapterMark = ({ n, label, className }) => (
  <div className={cn("mb-5 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em]", className)}>
    <span className="text-primary-ink">{n}</span>
    <span className="h-px w-10 bg-gradient-to-r from-primary/70 to-teal/60" />
    <span className="text-muted-foreground">{label}</span>
  </div>
);

export const SectionHeading = ({ eyebrow, chapter, title, description, align = "left", className }) => (
  <Reveal blur className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
    {chapter ? (
      <ChapterMark n={chapter} label={eyebrow} className={align === "center" ? "justify-center" : undefined} />
    ) : (
      eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>
    )}
    <h2 className="text-balance text-fluid-h3 font-medium text-foreground">{title}</h2>
    {description && <p className="mt-5 text-fluid-sm leading-relaxed text-muted-foreground">{description}</p>}
  </Reveal>
);

export const Section = ({ children, className, id, bordered = false }) => (
  <section id={id} className={cn("relative py-16 sm:py-20 lg:py-24", bordered && "border-t border-line/10", className)}>
    {children}
  </section>
);
