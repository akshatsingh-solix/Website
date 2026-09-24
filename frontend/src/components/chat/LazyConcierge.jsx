import { Suspense, lazy, useEffect, useState } from "react";

const ConciergeWidget = lazy(() => import("./ConciergeWidget"));

/**
 * Loads the chat widget (and its built-in answer engine) once the page is
 * idle, so it never competes with the first paint on a slow connection.
 * A "solix:open-chat" event before then loads it straight away, opened.
 */
export const LazyConcierge = () => {
  const [state, setState] = useState(null); // null | "idle" | "open"

  useEffect(() => {
    const onOpen = () => setState("open");
    window.addEventListener("solix:open-chat", onOpen);
    const load = () => setState((s) => s || "idle");
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(load, { timeout: 6000 }) : setTimeout(load, 3000);
    return () => {
      window.removeEventListener("solix:open-chat", onOpen);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  if (!state) return null;
  return (
    <Suspense fallback={null}>
      <ConciergeWidget defaultOpen={state === "open"} />
    </Suspense>
  );
};
