// Published CMS content (blogs, white papers, datasheets, ...) for the site.
//
// Jamstack with an instant layer on top:
//   1. content-snapshot.json is baked into every build and served from the
//      CDN, so pages never wait on (or break without) the backend;
//   2. the last API response is cached in localStorage for repeat visits;
//   3. the API is revalidated in the background (at most once a minute),
//      so something published in the admin shows up within seconds.
import { useEffect, useState, useSyncExternalStore } from "react";
import { BookOpen, Briefcase, CalendarDays, FileSpreadsheet, FileText, Lightbulb, Megaphone, Mic, Newspaper, Presentation, ScrollText, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/api";
import { translateText } from "@/i18n/tx";

const CACHE_KEY = "solix-content-v1";
const REVALIDATE_MS = 60_000;
const SNAPSHOT_URL = `${process.env.PUBLIC_URL || ""}/content-snapshot.json`;

export const TYPE_ICONS = {
  blog: Newspaper, whitepaper: FileText, datasheet: FileSpreadsheet, casestudy: Briefcase, ebook: BookOpen,
  webinar: Video, podcast: Mic, leadership: Lightbulb, event: CalendarDays, brief: ScrollText, collateral: Presentation, news: Megaphone,
};

// `withdrawn`: slugs of built-in items editors unpublished or archived in the CMS.
let state = { items: [], withdrawn: [], source: "none", at: 0 };
const listeners = new Set();
let inflight = null;

const emit = (next) => {
  state = next;
  listeners.forEach((l) => l());
};

const readCache = () => {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return c && Array.isArray(c.items) ? { ...c, withdrawn: c.withdrawn || [] } : null;
  } catch {
    return null;
  }
};

const writeCache = (items, withdrawn) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, withdrawn, at: Date.now() }));
  } catch {
    /* quota or blocked storage: the snapshot still covers us */
  }
};

const withTimeout = (url, ms) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
};

async function load() {
  if (state.source === "none") {
    const cached = readCache();
    if (cached) emit({ items: cached.items, withdrawn: cached.withdrawn, source: "cache", at: cached.at });
    else {
      try {
        const snap = await withTimeout(SNAPSHOT_URL, 5000).then((r) => (r.ok ? r.json() : null));
        if (snap?.items && state.source === "none") emit({ items: snap.items, withdrawn: snap.withdrawn || [], source: "snapshot", at: 0 });
      } catch {
        /* no snapshot yet */
      }
    }
  }
  if (state.source === "api" && Date.now() - state.at < REVALIDATE_MS) return;
  try {
    const res = await withTimeout(`${API}/content?full=true`, 10000);
    if (res.ok) {
      const { items, withdrawn = [] } = await res.json();
      emit({ items, withdrawn, source: "api", at: Date.now() });
      writeCache(items, withdrawn);
    }
  } catch {
    /* backend asleep or offline: keep showing snapshot / cached content */
  }
}

export const refreshContent = () => {
  if (!inflight) inflight = load().finally(() => { inflight = null; });
  return inflight;
};

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Map once per state change (and language) so consumers get stable object identities.
let lastMapped = { from: null, lng: null, items: [], news: [], withdrawn: new Set() };
const mapped = (snap, lng) => {
  if (lastMapped.from !== snap || lastMapped.lng !== lng) {
    const all = snap.items.map((i) => localizeResource(toResource(i), lng));
    lastMapped = { from: snap, lng, items: all.filter((r) => r.type !== "news"), news: all.filter((r) => r.type === "news"), withdrawn: new Set(snap.withdrawn || []) };
  }
  return lastMapped;
};

/**
 * Published CMS items, mapped to the same shape as the site's built-in
 * resources. `items` feed Resources; `news` (press releases) feed the
 * Newsroom; `withdrawn` lists built-in slugs to hide.
 */
export function useCmsResources() {
  const snap = useSyncExternalStore(subscribe, () => state);
  const { i18n } = useTranslation();
  useEffect(() => {
    refreshContent();
  }, []);
  const m = mapped(snap, i18n.language);
  return { items: m.items, news: m.news, withdrawn: m.withdrawn, ready: snap.source !== "none", source: snap.source };
}

// Built-in copy the CMS took over keeps its translations (keyed by the English text).
const localizeResource = (r, lng) => {
  if (!lng || lng === "en") return r;
  const t = (x) => (x ? translateText(x, undefined, lng) : x);
  return { ...r, title: t(r.title), desc: t(r.desc), tag: t(r.tag), authorRole: t(r.authorRole) };
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(document.documentElement.lang || "en", { month: "short", year: "numeric" });
};

export const toResource = (item) => ({
  id: `cms-${item.id}`,
  slug: item.slug,
  type: item.type,
  title: item.title,
  desc: item.summary,
  tag: item.tag || "",
  rawTag: item.tag || "",
  readTime: item.type === "webinar" || item.type === "podcast" ? "" : `${item.read_minutes || 1} min`,
  date: item.type === "event" && item.event_date ? item.event_date : fmtDate(item.publish_at || item.published_at),
  gated: !!item.gated,
  icon: TYPE_ICONS[item.type] || FileText,
  author: item.author || "Solix Technologies",
  authorRole: item.author_role || "",
  products: item.products || [],
  cover: item.cover_image || null,
  video: item.video_url || null,
  file: item.file || null,
  body: item.body,
  seoTitle: item.seo_title,
  seoDescription: item.seo_description,
  cms: true,
  sortKey: item.publish_at || item.published_at || "",
  isoDate: (item.publish_at || item.published_at || "").slice(0, 10),
  origin: item.origin || "cms",
});

/** One CMS item with its body; falls back to the API when the list lacks it. */
export function useCmsArticle(slug) {
  const { items, news, ready } = useCmsResources();
  const { i18n } = useTranslation();
  const listed = slug ? items.find((i) => i.slug === slug) || news.find((i) => i.slug === slug) : null;
  const [fetched, setFetched] = useState(null);
  const [missing, setMissing] = useState(false);
  const hasBody = listed?.body != null;
  useEffect(() => {
    if (!slug || !ready || hasBody) return;
    let alive = true;
    withTimeout(`${API}/content/${encodeURIComponent(slug)}`, 10000)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => alive && setFetched(localizeResource(toResource(d), i18n.language)))
      .catch(() => alive && setMissing(true));
    return () => {
      alive = false;
    };
  }, [slug, ready, hasBody]); // eslint-disable-line react-hooks/exhaustive-deps
  const resource = listed?.body != null ? listed : fetched || listed || null;
  return { resource, loading: !!slug && !resource && !missing, missing: !!slug && !resource && missing };
}

const PRESS_CATEGORIES = ["Product", "Customer", "Partner", "Event", "Company"];

/** A CMS press release ("news") in the shape of the Newsroom's built-in releases (body stays Markdown). */
export const toPress = (r) => ({
  id: r.slug,
  date: r.isoDate,
  year: (r.isoDate || "").slice(0, 4),
  category: PRESS_CATEGORIES.includes(r.rawTag) ? r.rawTag : "Company",
  image: r.cover ? fileHref(r.cover) : null,
  title: r.title,
  summary: r.desc,
  markdown: r.body || "",
  cms: true,
});

export const fileHref = (url) => (url && url.startsWith("/api/") ? `${API}${url.slice(4)}` : url);
