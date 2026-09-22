import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, AuroraField } from "./Reveal";

export const PageHero = ({ eyebrow, title, description, crumbs = [], children, image, className, compact = false }) => {
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 90]);

  return (
    <section className={cn("relative overflow-hidden border-b border-white/5", className)}>
      <div className="absolute inset-0 grid-lines opacity-50" />
      {image ? (
        <>
          <motion.img src={image} alt="" style={{ y: imgY }} className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
        </>
      ) : (
        <AuroraField />
      )}
      <div className={cn("container relative", compact ? "pt-32 pb-16 sm:pt-36 sm:pb-20" : "pt-36 pb-20 sm:pt-44 sm:pb-28")}>
        {crumbs.length > 0 && (
          <Reveal className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground" y={10}>
            <Link to="/" className="hover:text-foreground" data-testid="crumb-home">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                {c.to ? <Link to={c.to} className="hover:text-foreground">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}
              </span>
            ))}
          </Reveal>
        )}
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal blur className="lg:col-span-8">
            {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
            <h1 className="text-balance text-fluid-h2 font-medium">{title}</h1>
            {description && <p className="mt-6 max-w-2xl text-fluid-lead text-muted-foreground">{description}</p>}
          </Reveal>
          {children && <Reveal delay={0.1} className="lg:col-span-4 lg:justify-self-end">{children}</Reveal>}
        </div>
      </div>
    </section>
  );
};
