import { useState } from "react";
import { motion } from "framer-motion";

// Remote images come from the existing Empower media library. If one fails
// (moved, blocked, offline) we show a branded fallback instead of a broken icon.
// `sources` is an ordered list to try in turn (e.g. local copy, CDN, original).
export function SmartImage({ src, sources, alt, className = "", fallback, ...rest }) {
  const list = sources || (src ? [src] : []);
  const [i, setI] = useState(0);
  if (i >= list.length) return fallback ?? <div aria-hidden className={`bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 ${className}`} />;
  return <img src={list[i]} alt={alt} loading="lazy" decoding="async" onError={() => setI((n) => n + 1)} className={className} {...rest} />;
}

export function initials(name) {
  return name.replace(/^(Dr\.|Prof\.)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function Avatar({ name, src, className = "" }) {
  return (
    <SmartImage
      src={src}
      alt={name}
      className={`object-cover ${className}`}
      fallback={
        <div aria-label={name} role="img" className={`grid place-items-center bg-gradient-to-br from-ink-700 via-ink-900 to-ink-950 font-display text-2xl font-semibold text-white/90 ${className}`}>
          {initials(name)}
        </div>
      }
    />
  );
}

export function Logo({ name, src }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-16 min-w-[140px] items-center justify-center rounded-xl border border-line/10 bg-white px-5" title={name}>
      {failed ? (
        <span className="whitespace-nowrap font-display text-sm font-semibold tracking-tight text-ink-700">{name}</span>
      ) : (
        <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className="max-h-10 max-w-[120px] object-contain grayscale transition hover:grayscale-0" />
      )}
    </div>
  );
}

export function Reveal({ children, delay = 0, className = "", as = "div" }) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}

export function SectionHead({ eyebrow, title, lead, align = "left", children }) {
  const center = align === "center";
  return (
    <div className={`mb-12 flex flex-col gap-6 md:mb-16 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <Reveal className={center ? "max-w-3xl" : "max-w-3xl"}>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="text-fluid-h2 font-semibold text-foreground">{title}</h2>
        {lead && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{lead}</p>}
      </Reveal>
      {children}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} aria-hidden />;
}
