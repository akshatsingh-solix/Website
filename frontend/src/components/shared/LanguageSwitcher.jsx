import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, setManualLanguage } from "@/i18n/geoDetect";

const LANGUAGE_NAMES = { en: "English", es: "Español", fr: "Français", de: "Deutsch" };

/**
 * Native <select> for full keyboard/screen-reader support. `compact` shows
 * ISO codes (EN/ES/FR/DE) so the desktop header keeps its width for
 * navigation; each option still carries its full name as a tooltip and
 * accessible label.
 */
export const LanguageSwitcher = ({ className = "", compact = false }) => {
  const { i18n, t } = useTranslation();

  const onChange = (e) => {
    const lang = e.target.value;
    setManualLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <label className={cn("group relative inline-flex items-center gap-1.5 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground", compact && "px-2 py-1.5 hover:bg-muted", className)}>
      <Globe className="h-4 w-4" strokeWidth={1.5} />
      <select
        value={i18n.language}
        onChange={onChange}
        aria-label={t("language.label")}
        data-testid="language-switcher"
        className="cursor-pointer appearance-none bg-transparent pr-1 text-sm font-medium text-muted-foreground outline-none transition-colors group-hover:text-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code} title={LANGUAGE_NAMES[code]} aria-label={LANGUAGE_NAMES[code]}>{compact ? code.toUpperCase() : LANGUAGE_NAMES[code]}</option>
        ))}
      </select>
    </label>
  );
};
