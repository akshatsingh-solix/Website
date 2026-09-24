import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 20000 });

export const submitLead = (payload) => api.post("/submissions", payload).then((r) => r.data);

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
