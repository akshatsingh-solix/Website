import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { Reveal, AuroraField } from "./Reveal";

/**
 * Inner-page hero on the light canvas. With an `image`, the render is shown
 * at full strength in a framed navy panel on the right (the same "window
 * onto the data" device as the homepage hero) and any `children` - usually
 * CTAs - sit under the copy. Without one, `children` take the right column.
 * `media` replaces the image with a live element (e.g. a FamilyVisual) in
 * the same slot.
 */
export const PageHero = ({ eyebrow, title, description, crumbs = [], children, image, media, className, compact = false }) => {
  const tx = useTx();
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 40]);

  return (
    <section className={cn("relative overflow-hidden border-b border-line/10 bg-background", className)}>
      <div className="absolute inset-0 grid-lines grid-fade" />
      <AuroraField />
      <div className={cn("container relative", compact ? "pb-14 pt-28 sm:pb-16 sm:pt-32 md:pt-40" : "pb-16 pt-28 sm:pb-20 sm:pt-36 md:pt-44")}>
        {crumbs.length > 0 && (
          <Reveal className="mb-8 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground" y={10}>
            <Link to="/" className="hover:text-foreground" data-testid="crumb-home">{tx("Home")}</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                {c.to ? <Link to={c.to} className="hover:text-foreground">{tx(c.label)}</Link> : <span className="line-clamp-1 max-w-[40ch] text-foreground">{tx(c.label)}</span>}
              </span>
            ))}
          </Reveal>
        )}

        {image || media ? (
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <Reveal blur className="lg:col-span-7">
              {eyebrow && <p className="eyebrow mb-5">{tx(eyebrow)}</p>}
              <h1 className="text-balance text-fluid-h2 font-medium text-foreground">{tx(title)}</h1>
              {description && <p className="mt-6 max-w-2xl text-fluid-lead text-muted-foreground">{tx(description)}</p>}
              {children && <div className="mt-8">{children}</div>}
            </Reveal>
            <Reveal delay={0.1} className="relative lg:col-span-5">
              <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.2),transparent)]" />
              <div className="absolute -bottom-8 -left-8 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.16),transparent)]" />
              {media ? (
                <div className="relative rounded-3xl shadow-[0_2px_6px_rgba(13,25,45,0.08),0_50px_100px_-45px_rgba(13,25,45,0.6)]">{media}</div>
              ) : (
                <div className="dark relative overflow-hidden rounded-3xl border border-line/10 bg-background shadow-[0_2px_6px_rgba(13,25,45,0.08),0_50px_100px_-45px_rgba(13,25,45,0.6)]">
                  <motion.img src={image} alt="" style={{ y: imgY, scale: 1.08 }} className="aspect-[4/3] w-full object-cover" />
                </div>
              )}
            </Reveal>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <Reveal blur className="lg:col-span-8">
              {eyebrow && <p className="eyebrow mb-5">{tx(eyebrow)}</p>}
              <h1 className="text-balance text-fluid-h2 font-medium text-foreground">{tx(title)}</h1>
              {description && <p className="mt-6 max-w-2xl text-fluid-lead text-muted-foreground">{tx(description)}</p>}
            </Reveal>
            {children && <Reveal delay={0.1} className="lg:col-span-4 lg:justify-self-end">{children}</Reveal>}
          </div>
        )}
      </div>
    </section>
  );
};
