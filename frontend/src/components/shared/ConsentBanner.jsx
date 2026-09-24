import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getConsent, privacySignal, setConsent } from "@/lib/intent";
import { useTx } from "@/i18n/tx";

const PRIVACY_URL = "https://www.solix.com/privacy-policy/";

/** Asks once for analytics consent; the site works the same either way. */
export const ConsentBanner = () => {
  const tx = useTx();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Wait a moment so the banner doesn't compete with the hero on first paint.
    const t = setTimeout(() => setOpen(!getConsent() && !privacySignal()), 1200);
    const reopen = () => setOpen(true);
    window.addEventListener("solix:consent-open", reopen);
    return () => {
      clearTimeout(t);
      window.removeEventListener("solix:consent-open", reopen);
    };
  }, []);

  const choose = (value) => {
    setConsent(value);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label={tx("Cookie preferences")}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 z-[55] w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-line/10 bg-background p-5 shadow-[0_2px_8px_rgba(13,25,45,0.06),0_30px_80px_-30px_rgba(13,25,45,0.45)] max-sm:bottom-24"
          data-testid="consent-banner"
        >
          <p className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
            <Cookie className="h-4 w-4 text-teal" strokeWidth={1.75} /> {tx("Your privacy choices")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {tx("With your permission we use analytics cookies to learn which products and resources interest you, so we can tailor what we show and how our team follows up.")}{" "}
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="font-medium text-teal underline underline-offset-2">{tx("Privacy Policy")}</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => choose("all")} data-testid="consent-accept">{tx("Accept analytics")}</Button>
            <Button size="sm" variant="outline" onClick={() => choose("essential")} data-testid="consent-essential">{tx("Essential only")}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
