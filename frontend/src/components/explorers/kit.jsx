import { createContext, useCallback, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/intent";
import { useTx } from "@/i18n/tx";
import { mediaSources } from "@/lib/media";
import { MediaImage } from "@/components/media/MediaImage";

const LOCALES = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE" };
export const useLocale = () => {
  const { i18n } = useTranslation();
  return LOCALES[i18n.language] || "en-US";
};

// Indicative FX from USD, for showing estimates in the visitor's currency.
export const CURRENCIES = [
  { code: "USD", rate: 1 }, { code: "EUR", rate: 0.92 }, { code: "GBP", rate: 0.79 }, { code: "INR", rate: 83 },
  { code: "JPY", rate: 150 }, { code: "AUD", rate: 1.52 }, { code: "SGD", rate: 1.35 }, { code: "AED", rate: 3.67 },
  { code: "CAD", rate: 1.36 }, { code: "BRL", rate: 5.1 },
];
const LANG_CURRENCY = { es: "EUR", fr: "EUR", de: "EUR" };
export const defaultCurrency = (lang) => LANG_CURRENCY[lang] || "USD";

export const money = (usd, code, locale) => {
  const c = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
  const v = usd * c.rate;
  return new Intl.NumberFormat(locale, { style: "currency", currency: c.code, notation: Math.abs(v) >= 1e6 ? "compact" : "standard", maximumFractionDigits: Math.abs(v) >= 1e6 ? 1 : 0 }).format(v);
};
export const num = (v, locale, opts) => new Intl.NumberFormat(locale, opts).format(v);

/** Records explorer use as engagement on the product (no-op without analytics consent). */
export const useExplorerTracking = (explorer, topics) => {
  const last = useRef(0);
  return useCallback((action) => {
    const now = Date.now();
    if (now - last.current < 4000) return;
    last.current = now;
    track("engaged", { topics, meta: { explorer, action: String(action).slice(0, 60) } });
  }, [explorer, topics]);
};

/** Pre-fills the message of the page's inline lead form with what the visitor explored. */
export const prefillLead = (message) => {
  window.dispatchEvent(new CustomEvent("solix:prefill-lead", { detail: { message } }));
  document.getElementById("talk-to-us")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/** The product family whose OpenArt visual brands the explorer header (set by the product page). */
export const ExplorerMediaContext = createContext(null);

export const ExplorerShell = ({ title, subtitle, children, className, testId }) => {
  const tx = useTx();
  const media = useContext(ExplorerMediaContext);
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-line/10 bg-card shadow-soft", className)} data-testid={testId}>
      <div className={cn("relative flex flex-wrap items-center justify-between gap-3 overflow-hidden border-b border-line/10 px-5 py-4 sm:px-7", media && "dark bg-ink-950 text-foreground")}>
        {media && (
          <MediaImage
            key={media}
            sources={mediaSources(media)}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover opacity-70 [mask-image:linear-gradient(to_left,black_10%,transparent_75%)] sm:w-2/3"
          />
        )}
        <div className="relative">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-ink"><Sparkles className="h-3.5 w-3.5" /> {tx("Interactive")}</p>
          <h3 className="mt-1 font-display text-xl font-medium tracking-tight sm:text-2xl">{title}</h3>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </div>
  );
};

export const Segmented = ({ options, value, onChange, className, size = "md", testId }) => (
  <div className={cn("inline-flex flex-wrap gap-1 rounded-full border border-line/10 bg-muted p-1", className)} role="radiogroup" data-testid={testId}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cn("rounded-full transition-colors", size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm", value === o.value ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const SliderField = ({ label, value, min, max, step = 1, onChange, format, testId }) => (
  <label className="block">
    <span className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-medium tabular-nums text-foreground">{format ? format(value) : value}</span>
    </span>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-line/10 accent-[#EE2424]"
      data-testid={testId}
    />
  </label>
);
