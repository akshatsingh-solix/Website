import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export const SectionHeading = ({ eyebrow, title, description, align = "left", className, light = false }) => (
  <Reveal blur className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
    {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
    <h2 className="text-balance text-fluid-h3 font-medium text-foreground">{title}</h2>
    {description && (
      <p className={cn("mt-5 text-fluid-sm", light ? "text-slate-300" : "text-muted-foreground")}>{description}</p>
    )}
  </Reveal>
);

export const Section = ({ children, className, id, bordered = false }) => (
  <section id={id} className={cn("relative py-20 sm:py-28 lg:py-32", bordered && "border-t border-white/5", className)}>
    {children}
  </section>
);
