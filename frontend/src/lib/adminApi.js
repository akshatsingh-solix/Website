import axios from "axios";
import { API } from "./api";

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

export const formatApiError = (err) => {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg ?? JSON.stringify(e)).join(" ");
  return detail?.msg ?? String(detail);
};

export const adminLogin = (email, password) => adminApi.post("/auth/login", { email, password }).then((r) => r.data);
export const adminMe = () => adminApi.get("/auth/me").then((r) => r.data);
export const fetchStats = () => adminApi.get("/admin/stats").then((r) => r.data);
export const fetchLeads = (params) => adminApi.get("/admin/submissions", { params }).then((r) => r.data);
export const deleteLead = (id) => adminApi.delete(`/admin/submissions/${id}`);
export const updateLead = (id, body) => adminApi.patch(`/admin/submissions/${id}`, body).then((r) => r.data);
export const fetchSettings = () => adminApi.get("/admin/settings").then((r) => r.data);
export const saveSettings = (body) => adminApi.put("/admin/settings", body).then((r) => r.data);
export const fetchNotifications = () => adminApi.get("/admin/notifications").then((r) => r.data);

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
