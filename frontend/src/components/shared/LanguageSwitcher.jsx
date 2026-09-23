import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, setManualLanguage } from "@/i18n/geoDetect";

const LANGUAGE_NAMES = { en: "English", es: "Español", fr: "Français", de: "Deutsch" };

export const LanguageSwitcher = ({ className = "" }) => {
  const { i18n } = useTranslation();

  const onChange = (e) => {
    const lang = e.target.value;
    setManualLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <label className={`group relative inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground ${className}`}>
      <Globe className="h-4 w-4" strokeWidth={1.5} />
      <select
        value={i18n.language}
        onChange={onChange}
        aria-label="Language"
        data-testid="language-switcher"
        className="cursor-pointer appearance-none bg-transparent pr-1 text-sm text-muted-foreground outline-none transition-colors group-hover:text-foreground [&>option]:bg-ink-950 [&>option]:text-foreground"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>{LANGUAGE_NAMES[code]}</option>
        ))}
      </select>
    </label>
  );
};
