import axios from "axios";
import { API } from "./api";
import { makeResilient } from "./net";

export const TOKEN_KEY = "solix_admin_token";

export const adminApi = axios.create({ baseURL: API, timeout: 30000 });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/auth/login")) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("solix:admin-logout"));
    }
    return Promise.reject(err);
  }
);
makeResilient(adminApi);

// Short-lived cache for admin reads, so moving between admin pages (or
// reopening a lead) is instant on a slow link, and identical requests in
// flight share one round trip. Any write clears it, so a page never shows
// data older than your own last change. Pass { fresh: true } to bypass it
// (polling), and file downloads are never cached.
const GET_TTL_MS = 20000;
const getCache = new Map();
export const clearAdminCache = () => getCache.clear();
const rawGet = adminApi.get.bind(adminApi);
adminApi.get = (url, config = {}) => {
  const { fresh, ...rest } = config;
  if (rest.responseType) return rawGet(url, rest);
  const key = url + "?" + JSON.stringify(rest.params || {});
  const hit = getCache.get(key);
  if (!fresh && hit && (hit.pending || Date.now() - hit.at < GET_TTL_MS)) return hit.promise;
  const entry = { pending: true, at: 0 };
  entry.promise = rawGet(url, rest).then(
    (r) => { entry.pending = false; entry.at = Date.now(); return r; },
    (err) => { if (getCache.get(key) === entry) getCache.delete(key); throw err; },
  );
  getCache.set(key, entry);
  return entry.promise;
};
adminApi.interceptors.request.use((config) => {
  if (!["get", "head", "options"].includes((config.method || "get").toLowerCase())) clearAdminCache();
  return config;
});
adminApi.interceptors.response.use(
  (r) => {
    if (!["get", "head", "options"].includes((r.config?.method || "get").toLowerCase())) clearAdminCache();
    return r;
  },
  (err) => {
    if (!["get", "head", "options"].includes((err.config?.method || "get").toLowerCase())) clearAdminCache();
    return Promise.reject(err);
  },
);
window.addEventListener("solix:admin-logout", clearAdminCache);

export const formatApiError = (err) => {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg ?? JSON.stringify(e)).join(" ");
  return detail?.msg ?? String(detail);
};

export const adminLogin = (email, password) => adminApi.post("/auth/login", { email, password }).then((r) => r.data);
export const adminMe = () => adminApi.get("/auth/me", { fresh: true }).then((r) => r.data);
export const fetchStats = () => adminApi.get("/admin/stats").then((r) => r.data);
export const fetchLeads = (params) => adminApi.get("/admin/submissions", { params }).then((r) => r.data);
export const deleteLead = (id) => adminApi.delete(`/admin/submissions/${id}`);
export const updateLead = (id, body) => adminApi.patch(`/admin/submissions/${id}`, body).then((r) => r.data);
export const fetchTeam = () => adminApi.get("/admin/team").then((r) => r.data);
export const saveTeam = (members) => adminApi.put("/admin/team", { members }).then((r) => r.data);
export const fetchSettings = () => adminApi.get("/admin/settings").then((r) => r.data);
export const saveSettings = (body) => adminApi.put("/admin/settings", body).then((r) => r.data);
export const fetchNotifications = () => adminApi.get("/admin/notifications", { fresh: true }).then((r) => r.data);

// --- Leads, reports, views, scoring, users ---------------------------------
const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"));
export const fetchPeople = (params) => adminApi.get("/admin/leads", { params: clean(params) }).then((r) => r.data);
export const fetchLeadsMeta = () => adminApi.get("/admin/leads/meta").then((r) => r.data);
export const fetchLead = (id) => adminApi.get(`/admin/leads/${id}`).then((r) => r.data);
export const patchLead = (id, body) => adminApi.patch(`/admin/leads/${id}`, body).then((r) => r.data);
export const bulkPatchLeads = (body) => adminApi.post("/admin/leads/bulk", body).then((r) => r.data);
export const rescoreLead = (id) => adminApi.post(`/admin/leads/${id}/rescore`).then((r) => r.data);
export const fetchOverview = (params) => adminApi.get("/admin/reports/overview", { params: clean(params) }).then((r) => r.data);
export const fetchViews = () => adminApi.get("/admin/views").then((r) => r.data);
export const createView = (body) => adminApi.post("/admin/views", body).then((r) => r.data);
export const deleteView = (id) => adminApi.delete(`/admin/views/${id}`);
export const fetchScoring = () => adminApi.get("/admin/scoring").then((r) => r.data);
export const saveScoring = (body) => adminApi.put("/admin/scoring", body).then((r) => r.data);
export const fetchUsers = () => adminApi.get("/admin/users").then((r) => r.data);
export const createUser = (body) => adminApi.post("/admin/users", body).then((r) => r.data);
export const updateUser = (id, body) => adminApi.patch(`/admin/users/${id}`, body).then((r) => r.data);
export const changePassword = (body) => adminApi.post("/auth/password", body);

// --- Content (CMS) ----------------------------------------------------------
export const fetchContentList = (params) => adminApi.get("/admin/content", { params: clean(params) }).then((r) => r.data);
export const fetchContentItem = (id) => adminApi.get(`/admin/content/${id}`).then((r) => r.data);
export const createContent = (body) => adminApi.post("/admin/content", body).then((r) => r.data);
export const updateContent = (id, body) => adminApi.put(`/admin/content/${id}`, body).then((r) => r.data);
export const publishContent = (id, publish_at) => adminApi.post(`/admin/content/${id}/publish`, { publish_at: publish_at || null }).then((r) => r.data);
export const unpublishContent = (id) => adminApi.post(`/admin/content/${id}/unpublish`).then((r) => r.data);
export const archiveContent = (id) => adminApi.delete(`/admin/content/${id}`);
export const fetchContentVersions = (id) => adminApi.get(`/admin/content/${id}/versions`).then((r) => r.data);
export const restoreContentVersion = (id, v) => adminApi.post(`/admin/content/${id}/versions/${v}/restore`).then((r) => r.data);
export const uploadFile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return adminApi.post("/admin/files", form, { timeout: 120000 }).then((r) => r.data);
};
export const fetchFiles = (params) => adminApi.get("/admin/files", { params }).then((r) => r.data);
/** Absolute URL for a backend file path like /api/files/<id>/<name>. */
export const apiFileUrl = (path) => (path && path.startsWith("/api/") ? `${API}${path.slice(4)}` : path);

async function saveBlob(res, fallback) {
  const name = /filename="?([^"]+)"?/.exec(res.headers["content-disposition"] || "")?.[1] || fallback;
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportPeople(params, format) {
  const res = await adminApi.get("/admin/leads-export", { params: { ...clean(params), format }, responseType: "blob", timeout: 120000 });
  await saveBlob(res, `solix-leads.${format}`);
}

export async function downloadLeadsCsv(params) {
  const res = await adminApi.get("/admin/submissions/export", { params, responseType: "blob" });
  const name = /filename="?([^"]+)"?/.exec(res.headers["content-disposition"] || "")?.[1] || "solix-leads.csv";
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Events (SOLIXEmpower registrations) -------------------------------------
export const fetchEvents = () => adminApi.get("/admin/events").then((r) => r.data);
export const fetchEventSettings = (slug) => adminApi.get(`/admin/events/${slug}`).then((r) => r.data);
export const saveEventSettings = (slug, body) => adminApi.put(`/admin/events/${slug}`, body).then((r) => r.data);
export const fetchRegistrations = (slug, params) => adminApi.get(`/admin/events/${slug}/registrations`, { params: clean(params) }).then((r) => r.data);
export const patchRegistration = (slug, id, body) => adminApi.patch(`/admin/events/${slug}/registrations/${id}`, body).then((r) => r.data);
export async function exportRegistrations(slug, params, format) {
  const res = await adminApi.get(`/admin/events/${slug}/registrations-export`, { params: { ...clean(params), format }, responseType: "blob", timeout: 120000 });
  await saveBlob(res, `${slug}-registrations.${format}`);
}

// --- Built-in content, website migration, site settings, asset emails -------
export const importBuiltin = (items, on_conflict = "skip") => adminApi.post("/admin/content/import-builtin", { items, on_conflict }, { timeout: 120000 }).then((r) => r.data);
export const previewMigration = (body) => adminApi.post("/admin/migrations/preview", body, { timeout: 180000 }).then((r) => r.data);
export const startMigration = (body) => adminApi.post("/admin/migrations", body, { timeout: 60000 }).then((r) => r.data);
export const fetchMigrations = () => adminApi.get("/admin/migrations", { fresh: true }).then((r) => r.data);
export const fetchMigration = (id) => adminApi.get(`/admin/migrations/${id}`, { fresh: true }).then((r) => r.data);
export const cancelMigration = (id) => adminApi.post(`/admin/migrations/${id}/cancel`).then((r) => r.data);
export async function downloadRedirects(format) {
  const res = await adminApi.get("/admin/migrations/redirects", { params: { format }, responseType: "blob" });
  await saveBlob(res, `redirects.${format === "nginx" ? "nginx.conf" : format === "apache" ? "htaccess" : "csv"}`);
}
export const fetchSite = () => adminApi.get("/admin/site").then((r) => r.data);
export const saveSite = (body) => adminApi.put("/admin/site", body).then((r) => r.data);
export const fetchDelivery = () => adminApi.get("/admin/delivery").then((r) => r.data);
export const saveDelivery = (body) => adminApi.put("/admin/delivery", body).then((r) => r.data);
export const fetchDeliveries = (params) => adminApi.get("/admin/deliveries", { params: clean(params) }).then((r) => r.data);
export const testDelivery = (body) => adminApi.post("/admin/deliveries/test", body, { timeout: 60000 }).then((r) => r.data);
export const resendDelivery = (id) => adminApi.post(`/admin/deliveries/${id}/resend`, null, { timeout: 60000 }).then((r) => r.data);
export const publishImported = () => adminApi.post("/admin/content-imported/publish").then((r) => r.data);
export const restoreImportedDates = () => adminApi.post("/admin/content-imported/restore-dates").then((r) => r.data);

// --- SEO / AEO / GEO analytics ------------------------------------------------
export const fetchSeoStatus = () => adminApi.get("/admin/seo/status", { fresh: true }).then((r) => r.data);
export const fetchSeoConfig = () => adminApi.get("/admin/seo/config").then((r) => r.data);
export const saveSeoConfig = (body) => adminApi.put("/admin/seo/config", body).then((r) => r.data);
export const fetchSeoSnapshot = (geo) => adminApi.get("/admin/seo/snapshot", { params: { geo } }).then((r) => r.data);
export const syncSeo = (geo) => adminApi.post("/admin/seo/sync", { geo }, { timeout: 300000 }).then((r) => r.data);
export const discoverCompetitors = (geo) => adminApi.post("/admin/seo/competitors/discover", { geo }, { timeout: 60000 }).then((r) => r.data);
export const fetchSeoUrl = (url, geo) => adminApi.get("/admin/seo/url", { params: { url, geo }, timeout: 60000 }).then((r) => r.data);
export const fetchSeoKeyword = (phrase, geo) => adminApi.get("/admin/seo/keyword", { params: { phrase, geo }, timeout: 60000 }).then((r) => r.data);
export const fetchSeoTopics = (refresh) => adminApi.get("/admin/seo/topics", { params: refresh ? { refresh: true } : {}, timeout: 120000, fresh: !!refresh }).then((r) => r.data);
export const fetchAiVisibility = () => adminApi.get("/admin/seo/ai-visibility").then((r) => r.data);
export const runAiVisibility = () => adminApi.post("/admin/seo/ai-visibility/run", null, { timeout: 600000 }).then((r) => r.data);
