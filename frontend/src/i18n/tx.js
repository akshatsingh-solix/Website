import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./index";
import { hashKey } from "./hash";

/**
 * Translate a piece of English site copy into the active language.
 *
 *   const tx = useTx();
 *   <h2>{tx("Data compounds. Your budget shouldn't.")}</h2>
 *   <p>{tx("{{count}} positions across four continents.", { count: 5 })}</p>
 *
 * The English text is the key (see hash.js). Missing translations fall back
 * to English, so wrapping a string is always safe.
 */
export const translateText = (text, vars, lng) => {
  if (typeof text !== "string" || !text) return text;
  return i18n.t(hashKey(text), { ns: "content", defaultValue: text, lng, ...vars });
};

export const useTx = () => {
  const { i18n: instance } = useTranslation("content");
  const lng = instance.language;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((text, vars) => translateText(text, vars, lng), [lng]);
};
