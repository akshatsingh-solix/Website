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

/**
 * Renders translated copy that keeps inline emphasis: `<em>…</em>` and
 * `<strong>…</strong>` in the (translated) string become real elements, so
 * each language can place the emphasis where its grammar puts it.
 */
export const Rich = ({ text }) =>
  String(text)
    .split(/(<em>.*?<\/em>|<strong>.*?<\/strong>)/g)
    .map((part, i) => {
      const em = /^<em>(.*)<\/em>$/.exec(part);
      if (em) return <em key={i}>{em[1]}</em>;
      const strong = /^<strong>(.*)<\/strong>$/.exec(part);
      if (strong) return <strong key={i}>{strong[1]}</strong>;
      return part;
    });

/** Lower-cases a name for use mid-sentence, except in German, where nouns stay capitalized. */
export const midSentence = (name, lng) => (lng === "de" ? name : name.toLowerCase());
