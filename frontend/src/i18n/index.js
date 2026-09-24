import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";
import { SUPPORTED_LANGUAGES, getStoredLanguage } from "./geoDetect";

// Two namespaces:
// - `translation`: keyed UI strings (nav, hero, footer, language notice).
// - `content`: every other piece of site copy, keyed by a hash of its
//   English source (see tx.js / hash.js). English needs no content file -
//   the source text is the fallback.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
  },
  // Start in the remembered language so a returning visitor never sees an
  // English flash before detection runs.
  lng: SUPPORTED_LANGUAGES.includes(getStoredLanguage().lang) ? getStoredLanguage().lang : "en",
  fallbackLng: "en",
  ns: ["translation", "content"],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  // Re-render when a lazily loaded content catalogue arrives.
  react: { bindI18nStore: "added" },
});

// The big `content` catalogues (~60 KB each, gzipped) load on demand, so a
// visitor only downloads the language they read.
const contentLoaders = {
  es: () => import("./locales/es/content.json"),
  fr: () => import("./locales/fr/content.json"),
  de: () => import("./locales/de/content.json"),
};

export const loadContent = async (lng) => {
  if (!contentLoaders[lng] || i18n.hasResourceBundle(lng, "content")) return;
  const mod = await contentLoaders[lng]();
  i18n.addResourceBundle(lng, "content", mod.default || mod, true, true);
};

i18n.on("languageChanged", (lng) => {
  loadContent(lng).catch(() => {});
});

/** Resolves once the starting language's catalogue is ready (instant for English). */
export const i18nReady = loadContent(i18n.language).catch(() => {});

// Keep <html lang> in sync so screen readers pronounce the page in the
// right language and browsers don't offer to "translate" it back.
const syncHtmlLang = (lng) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
