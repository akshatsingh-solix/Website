import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 20000 });

export const submitLead = (payload) => api.post("/submissions", payload).then((r) => r.data);

export const fetchChatHistory = (sessionId) => api.get(`/chat/${sessionId}`).then((r) => r.data);

export const clearChatHistory = (sessionId) => api.delete(`/chat/${sessionId}`);

export async function streamChat({ sessionId, message, onDelta, onError, signal }) {
  const res = await fetch(`${API}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
    signal,
  });
  if (!res.ok || !res.body) {
    onError?.("The concierge is unavailable right now.");
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
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
      if (data.delta) onDelta(data.delta);
      if (data.error) onError?.(data.error);
    }
  }
}
