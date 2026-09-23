import { api } from "./api";

export const ACCOUNT_TOKEN_KEY = "solix-account-token";

const authHeaders = () => {
  const token = localStorage.getItem(ACCOUNT_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const accountSignup = (body) => api.post("/accounts/signup", body).then((r) => r.data);
export const accountSignin = (email, password) => api.post("/accounts/signin", { email, password }).then((r) => r.data);
export const accountMe = () => api.get("/accounts/me", { headers: authHeaders() }).then((r) => r.data);
export const accountForgotPassword = (email) => api.post("/accounts/forgot-password", { email }).then((r) => r.data);

/** The API's human-readable reason, or `fallback` for network/validation errors. */
export const apiErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, "");
  return fallback;
};

// Consumer mailbox providers - the trial is for business accounts.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com", "msn.com",
  "aol.com", "icloud.com", "me.com", "mac.com", "proton.me", "protonmail.com", "gmx.com", "gmx.de", "mail.com",
  "yandex.com", "zoho.com", "web.de", "free.fr", "orange.fr", "laposte.net", "libero.it", "rediffmail.com", "qq.com", "163.com",
]);

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isBusinessEmail = (v) => isEmail(v) && !FREE_EMAIL_DOMAINS.has(v.trim().split("@")[1].toLowerCase());

// Same rule the API enforces: 6-30 chars with a letter, a digit and a symbol.
export const PASSWORD_RULES = [
  { key: "length", label: "6–30 characters", test: (p) => p.length >= 6 && p.length <= 30 },
  { key: "letter", label: "A letter (A–z)", test: (p) => /[A-Za-z]/.test(p) },
  { key: "digit", label: "A number (0–9)", test: (p) => /\d/.test(p) },
  { key: "symbol", label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
export const isStrongPassword = (p) => PASSWORD_RULES.every((r) => r.test(p));

export const ECS_PRIVACY_URL = "https://www.solix.com/products/enterprise-content-services/privacy-policy/";
export const ECS_TERMS_URL = "https://www.solix.com/products/enterprise-content-services/terms-of-service/";
