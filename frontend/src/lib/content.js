// Published CMS content (blogs, white papers, datasheets, ...) for the site.
//
// Jamstack with an instant layer on top:
//   1. content-snapshot.json is baked into every build and served from the
//      CDN, so pages never wait on (or break without) the backend;
//   2. the last API response is cached in localStorage for repeat visits;
//   3. the API is revalidated in the background (at most once a minute),
//      so something published in the admin shows up within seconds.
import { useEffect, useState, useSyncExternalStore } from "react";
import { BookOpen, Briefcase, CalendarDays, FileSpreadsheet, FileText, Lightbulb, Mic, Newspaper, Presentation, ScrollText, Video } from "lucide-react";
import { API } from "@/lib/api";

const CACHE_KEY = "solix-content-v1";
const REVALIDATE_MS = 60_000;
const SNAPSHOT_URL = `${process.env.PUBLIC_URL || ""}/content-snapshot.json`;

export const TYPE_ICONS = {
  blog: Newspaper, whitepaper: FileText, datasheet: FileSpreadsheet, casestudy: Briefcase, ebook: BookOpen,
  webinar: Video, podcast: Mic, leadership: Lightbulb, event: CalendarDays, brief: ScrollText, collateral: Presentation,
};

let state = { items: [], source: "none", at: 0 };
const listeners = new Set();
let inflight = null;

const emit = (next) => {
  state = next;
  listeners.forEach((l) => l());
};

const readCache = () => {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return c && Array.isArray(c.items) ? c : null;
  } catch {
    return null;
  }
};

const writeCache = (items) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, at: Date.now() }));
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
    if (cached) emit({ items: cached.items, source: "cache", at: cached.at });
    else {
      try {
        const snap = await withTimeout(SNAPSHOT_URL, 5000).then((r) => (r.ok ? r.json() : null));
        if (snap?.items && state.source === "none") emit({ items: snap.items, source: "snapshot", at: 0 });
      } catch {
        /* no snapshot yet */
      }
    }
  }
  if (state.source === "api" && Date.now() - state.at < REVALIDATE_MS) return;
  try {
    const res = await withTimeout(`${API}/content?full=true`, 10000);
    if (res.ok) {
      const { items } = await res.json();
      emit({ items, source: "api", at: Date.now() });
      writeCache(items);
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

// Map once per state change so consumers get stable object identities.
let lastMapped = { from: null, items: [] };
const mapped = (snap) => {
  if (lastMapped.from !== snap) lastMapped = { from: snap, items: snap.items.map(toResource) };
  return lastMapped.items;
};

/** Published CMS items, mapped to the same shape as the site's built-in resources. */
export function useCmsResources() {
  const snap = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    refreshContent();
  }, []);
  return { items: mapped(snap), ready: snap.source !== "none", source: snap.source };
}

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
});

/** One CMS item with its body; falls back to the API when the list lacks it. */
export function useCmsArticle(slug) {
  const { items, ready } = useCmsResources();
  const listed = slug ? items.find((i) => i.slug === slug) : null;
  const [fetched, setFetched] = useState(null);
  const [missing, setMissing] = useState(false);
  const hasBody = listed?.body != null;
  useEffect(() => {
    if (!slug || !ready || hasBody) return;
    let alive = true;
    withTimeout(`${API}/content/${encodeURIComponent(slug)}`, 10000)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => alive && setFetched(toResource(d)))
      .catch(() => alive && setMissing(true));
    return () => {
      alive = false;
    };
  }, [slug, ready, hasBody]);
  const resource = listed?.body != null ? listed : fetched || listed || null;
  return { resource, loading: !!slug && !resource && !missing, missing: !!slug && !resource && missing };
}

export const fileHref = (url) => (url && url.startsWith("/api/") ? `${API}${url.slice(4)}` : url);
