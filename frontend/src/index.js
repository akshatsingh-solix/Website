import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import { i18nReady } from "@/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
// A returning Spanish/French/German visitor waits for their catalogue (from
// cache, usually instant) so the page never flashes in English first.
Promise.race([i18nReady, new Promise((r) => setTimeout(r, 3000))]).then(() => root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
));

// Caching layer for repeat visits (see public/sw.js). Production builds only.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js`, { scope: `${process.env.PUBLIC_URL}/` }).catch(() => {});
  });
}
