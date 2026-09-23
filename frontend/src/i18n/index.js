import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";
import esContent from "./locales/es/content.json";
import frContent from "./locales/fr/content.json";
import deContent from "./locales/de/content.json";
import { SUPPORTED_LANGUAGES, getStoredLanguage } from "./geoDetect";

// Two namespaces:
// - `translation`: keyed UI strings (nav, hero, footer, language notice).
// - `content`: every other piece of site copy, keyed by a hash of its
//   English source (see tx.js / hash.js). English needs no content file -
//   the source text is the fallback.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es, content: esContent },
    fr: { translation: fr, content: frContent },
    de: { translation: de, content: deContent },
  },
  // Start in the remembered language so a returning visitor never sees an
  // English flash before detection runs.
  lng: SUPPORTED_LANGUAGES.includes(getStoredLanguage().lang) ? getStoredLanguage().lang : "en",
  fallbackLng: "en",
  ns: ["translation", "content"],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

// Keep <html lang> in sync so screen readers pronounce the page in the
// right language and browsers don't offer to "translate" it back.
const syncHtmlLang = (lng) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
