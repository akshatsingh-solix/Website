import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { getStoredLanguage, setManualLanguage } from "@/i18n/geoDetect";

const LANGUAGE_NAMES = { es: "Español", fr: "Français", de: "Deutsch" };

/**
 * A small, dismissible strip that only appears when the current language
 * was set by the IP-based geo lookup (never for a manual choice), so
 * visitors always know why the page changed and can revert in one click.
 */
export const LanguageDetectionNotice = () => {
  const { i18n, t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const stored = getStoredLanguage();
      // Both must agree - guards against a brief mismatch between the
      // stored source and the live i18next language (e.g. mid-detection)
      // ever rendering a notice with an empty interpolated language name.
      setVisible(stored.source === "geo" && stored.lang === i18n.language && !!LANGUAGE_NAMES[stored.lang]);
    };
    check();
    const onLangChange = () => check();
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, [i18n, i18n.language]);

  if (!visible || !LANGUAGE_NAMES[i18n.language]) return null;

  const revert = () => {
    setManualLanguage("en");
    i18n.changeLanguage("en");
    setVisible(false);
  };

  return (
    <div className="relative border-b border-teal/15 bg-accent" data-testid="language-detection-notice">
      <div className="container flex items-center justify-between gap-4 py-2.5 text-xs text-accent-foreground">
        <p>{t("language.detectedNotice", { language: LANGUAGE_NAMES[i18n.language] })}</p>
        <div className="flex shrink-0 items-center gap-3">
          <button onClick={revert} className="underline-offset-2 hover:text-foreground hover:underline" data-testid="language-notice-revert">
            {t("language.revertToEnglish")}
          </button>
          <button onClick={() => setVisible(false)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
