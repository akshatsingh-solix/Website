import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 20000 });

// The backend runs on a host that sleeps when idle and can take up to a
// minute to wake. Forms therefore (1) wake it as soon as a form is shown,
// (2) wait long enough on submit, and (3) retry once on a network error,
// timeout or 5xx gateway error. Validation errors (4xx) are never retried.
let warming = null;
export const warmBackend = () => {
  if (!BACKEND_URL) return Promise.resolve(false);
  if (!warming) {
    warming = api.get("/", { timeout: 70000 }).then(() => true).catch(() => { warming = null; return false; });
  }
  return warming;
};

const retryable = (err) => !err.response || err.code === "ECONNABORTED" || [502, 503, 504].includes(err.response?.status);

export async function submitLead(payload, { attempts = 2 } = {}) {
  if (!BACKEND_URL) throw Object.assign(new Error("Forms are not connected to a backend."), { code: "NO_BACKEND" });
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await api.post("/submissions", payload, { timeout: 65000 });
      return r.data;
    } catch (err) {
      lastErr = err;
      if (!retryable(err) || i === attempts - 1) break;
      await new Promise((res) => setTimeout(res, 2500));
    }
  }
  throw lastErr;
}

/** A readable message for a failed form submission. */
export const submissionError = (err) => {
  const detail = err?.response?.data?.detail;
  if (err?.response?.status === 422) {
    const first = Array.isArray(detail) ? detail[0] : null;
    const field = first?.loc?.[first.loc.length - 1];
    if (field === "email") return "Please enter a valid work email address.";
    return typeof detail === "string" ? detail : "Some details look incomplete. Please check the form and try again.";
  }
  if (err?.response?.status === 429) return "Too many attempts from your network. Please wait a minute and try again.";
  return "We couldn't reach our servers. Your details are still here, so please try again, or email us directly.";
};

export const fetchChatHistory = (sessionId) => api.get(`/chat/${sessionId}`).then((r) => r.data);

export const clearChatHistory = (sessionId) => api.delete(`/chat/${sessionId}`);

/**
 * Streams an AI concierge reply. Resolves to "ok", or to "unavailable" when
 * the backend has no model configured, errors before replying, or doesn't
 * answer within `timeoutMs` - the caller then answers with the built-in
 * concierge instead.
 */
export async function streamChat({ sessionId, message, language = "en", onDelta, onEvent, onError, timeoutMs = 8000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message, language }),
      signal: controller.signal,
    });
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok || !res.body) return "unavailable";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let replied = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith("data:")) continue;
      const data = JSON.parse(line.slice(5));
      if (data.error && !replied) return "unavailable";
      if (data.delta) {
        replied = true;
        onDelta(data.delta);
      }
      if (data.event) onEvent?.(data);
      if (data.error) onError?.(data.error);
    }
  }
  return replied ? "ok" : "unavailable";
}
