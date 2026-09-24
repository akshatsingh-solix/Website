import { useTranslation } from "react-i18next";
import i18nInstance from "./index";
import { translateText } from "./tx";

// Keys whose values are identifiers, routes, assets or filter values - never
// display copy - so they are left untouched when data is localized.
// (`category`/`group` are filter keys: translate them at render with tx.)
const SKIP_KEYS = new Set([
  "id", "slug", "to", "href", "file", "image", "icon", "accent", "span", "type", "key", "tone",
  "fill", "hex", "email", "phone", "year", "products", "category", "group", "meta",
  "readTime", "featured", "gated", "suffix", "pct", "color", "registerUrl", "links",
]);

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype && !v.$$typeof;

const walk = (value, lng) => {
  if (typeof value === "string") return translateText(value, undefined, lng);
  if (Array.isArray(value)) return value.map((v) => walk(v, lng));
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = SKIP_KEYS.has(k) ? v : walk(v, lng);
    return out;
  }
  return value;
};

const cache = new Map(); // lng -> WeakMap(source -> localized)

/** Deep-translates the display copy in a data structure (memoized per language). */
export const localizeData = (data, lng) => {
  if (!lng || lng === "en" || data === null || typeof data !== "object") return data;
  if (!cache.has(lng)) cache.set(lng, new WeakMap());
  const byLang = cache.get(lng);
  if (!byLang.has(data)) byLang.set(data, walk(data, lng));
  return byLang.get(data);
};

/** `const products = useLocalized(PRODUCTS)` - re-renders on language change. */
export const useLocalized = (data) => {
  const { i18n } = useTranslation("content");
  return localizeData(data, i18n.language);
};

/**
 * A data export that always reads in the active language. Wrap a module's
 * source data once:
 *
 *   const PRODUCTS_EN = [...];
 *   export const PRODUCTS = localizedSource(PRODUCTS_EN);
 *
 * and every consumer (`PRODUCTS.find(...)`, `.map`, spread, `Object.keys`)
 * gets translated copy with no code changes. Components re-render on a
 * language change because App subscribes to it at the root.
 */
export const localizedSource = (source) => {
  const current = () => localizeData(source, i18nInstance.language);
  return new Proxy(source, {
    get(_target, prop) {
      const view = current();
      const value = Reflect.get(view, prop);
      return typeof value === "function" ? value.bind(view) : value;
    },
    has: (_target, prop) => prop in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_target, prop) => Reflect.getOwnPropertyDescriptor(current(), prop),
  });
};
