const GEO_IP_ENDPOINT = "https://ipapi.co/json/";
const STORAGE_KEY = "solix-lang";
const STORAGE_SOURCE_KEY = "solix-lang-source"; // "manual" | "geo"
export const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de"];

// ISO 3166-1 alpha-2 country code -> supported language. A country not
// listed here (including every English-speaking market) falls back to
// English - the default already served, so no lookup result is needed
// for it to work correctly.
const COUNTRY_LANGUAGE = {
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
  GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
  CR: "es", PA: "es", UY: "es",
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr",
  DE: "de", AT: "de", LI: "de",
};

export function getStoredLanguage() {
  try {
    return { lang: localStorage.getItem(STORAGE_KEY), source: localStorage.getItem(STORAGE_SOURCE_KEY) };
  } catch {
    return { lang: null, source: null };
  }
}

export function setManualLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(STORAGE_SOURCE_KEY, "manual");
  } catch {
    // Private browsing or storage disabled - the language still changes
    // for this session, it just won't be remembered on the next visit.
  }
}

function rememberGeoLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(STORAGE_SOURCE_KEY, "geo");
  } catch {
    // Same as above - non-fatal.
  }
}

/**
 * Resolves the visitor's language: any previously-resolved choice - manual
 * or a prior geo lookup - wins outright and skips a fresh network call
 * entirely, so the geo-IP lookup only ever runs once per visitor (not once
 * per page load) and a slow/failed lookup on a later visit can never
 * override an already-settled language with a stale fallback. Only a
 * visitor with no stored preference at all triggers a lookup. Always
 * resolves - falls back to English on any network error, timeout, CORS
 * block, or unsupported/undetected country, so a slow or failed lookup
 * never delays or breaks the page (the site already renders in English by
 * default while this runs).
 */
export async function detectLanguage({ timeoutMs = 2500 } = {}) {
  const stored = getStoredLanguage();
  if (stored.lang && SUPPORTED_LANGUAGES.includes(stored.lang) && (stored.source === "manual" || stored.source === "geo")) {
    return { lang: stored.lang, source: stored.source };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(GEO_IP_ENDPOINT, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`geo-ip lookup failed: ${res.status}`);
    const data = await res.json();
    const country = data?.country_code || data?.country || null;
    const lang = (country && COUNTRY_LANGUAGE[country]) || "en";
    rememberGeoLanguage(lang);
    return { lang, source: "geo", country };
  } catch {
    return { lang: "en", source: "geo-fallback" };
  }
}
