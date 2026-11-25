// Internal traffic: Solix's own people, kept out of MarkHub's numbers (solix-backend internal_traffic.py).
//
// Two pieces live in the browser:
//  * The site side: a browser can carry an "internal" mark. It is set when someone signs in to MarkHub in this
//    browser, or opens any site page with ?solix_internal=1 (share that link with colleagues; ?solix_internal=0
//    clears it). The tracker sends the mark with its beacons, so a colleague's browsing never counts as a visitor.
//  * The MarkHub side: one view switch for every metric. "exclude" hides internal traffic (the default),
//    "include" shows everything, "only" shows just the team's own activity. Every admin read carries it.
import { useEffect, useState } from "react";

const MARK_KEY = "solix_internal";
const VIEW_KEY = "markhub_internal_view";
export const VIEW_EVENT = "solix:internal-view";
export const INTERNAL_VIEWS = [
  { value: "exclude", label: "Hide internal", short: "Hidden", help: "Numbers without Solix staff and test traffic (recommended)" },
  { value: "include", label: "Include internal", short: "Included", help: "Everyone, staff and test traffic included" },
  { value: "only", label: "Only internal", short: "Only", help: "Just the team's own activity: who tested what" },
];

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the mark simply doesn't persist */
  }
};

// --- Site: this browser's mark -----------------------------------------------------------------------------

export const isMarkedInternal = () => read(MARK_KEY) === "1";
export const setMarkedInternal = (on) => write(MARK_KEY, on ? "1" : null);

// ?solix_internal=1 marks the browser, ?solix_internal=0 clears it; read once when the app loads.
if (typeof window !== "undefined") {
  try {
    const flag = new URLSearchParams(window.location.search).get("solix_internal");
    if (flag === "1" || flag === "true") setMarkedInternal(true);
    if (flag === "0" || flag === "false") setMarkedInternal(false);
  } catch {
    /* no URL API: nothing to read */
  }
}

// --- MarkHub: the view switch --------------------------------------------------------------------------------

export const getInternalView = () => {
  const v = read(VIEW_KEY);
  return INTERNAL_VIEWS.some((m) => m.value === v) ? v : "exclude";
};

export const setInternalView = (mode) => {
  write(VIEW_KEY, mode);
  window.dispatchEvent(new CustomEvent(VIEW_EVENT, { detail: mode }));
};

export const useInternalView = () => {
  const [mode, setMode] = useState(getInternalView);
  useEffect(() => {
    const on = (e) => setMode(e.detail || getInternalView());
    window.addEventListener(VIEW_EVENT, on);
    return () => window.removeEventListener(VIEW_EVENT, on);
  }, []);
  return [mode, setInternalView];
};
