import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PRESS_RELEASES } from "@/data/newsroom";
import { toPress, useCmsResources } from "@/lib/content";

/**
 * Newsroom releases, newest first: press releases published in the CMS plus
 * the built-in ones. A CMS release replaces a built-in one with the same id,
 * and built-ins editors withdrew in the CMS are left out.
 */
export function usePressReleases() {
  const { i18n } = useTranslation();
  const { news, withdrawn, ready } = useCmsResources();
  const releases = useMemo(() => {
    const cmsIds = new Set(news.map((n) => n.slug));
    const builtin = PRESS_RELEASES.filter((p) => !withdrawn.has(p.id) && !cmsIds.has(p.id));
    return [...news.map(toPress), ...builtin].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news, withdrawn, i18n.language]);
  return { releases, ready };
}
