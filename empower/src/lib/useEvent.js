import { useEffect, useState } from "react";
import { getEvent } from "./api";

// Live event settings (passes, prices, seats, registration open). Falls back to
// the complimentary pass so the page still renders if the API is waking up.
const FALLBACK = {
  registration_open: true,
  waitlist: false,
  seats_left: null,
  tickets: [{ id: "full-pass", name: "Full event pass", price: 0, currency: "USD", provider: "free", seats_left: null, sold_out: false,
    description: "All three days, Oct 28-30: keynotes, panels, hands-on workshops, the hackathon finals, networking meals and evening receptions." }],
  interests: [
    { key: "enterprise-ai", label: "Enterprise AI & agents" },
    { key: "data-governance", label: "Enterprise Data Governance" },
    { key: "cloud-data-management", label: "Cloud Data Management" },
    { key: "knowledge-graph", label: "Application Knowledge Graph (AKG)" },
    { key: "life-sciences", label: "AI in Pharma & Life Sciences" },
    { key: "content-services", label: "Content Intelligence (ECS)" },
  ],
  days: [
    { id: "day1", label: "Oct 28 · Day 1", dinner: "Solix User Group Cocktails & Dinner" },
    { id: "day2", label: "Oct 29 · Day 2", dinner: "Dinner & San Diego Supercomputer Center tour" },
    { id: "day3", label: "Oct 30 · Day 3 (half day)", dinner: null },
  ],
  has_promo_codes: false,
};

let cached = null;
export function useEvent() {
  const [state, setState] = useState(() => ({ data: cached || FALLBACK, live: !!cached, error: null }));
  useEffect(() => {
    if (cached) return;
    const ctl = new AbortController();
    getEvent(ctl.signal)
      .then((data) => { cached = data; setState({ data, live: true, error: null }); })
      .catch((error) => { if (error.name !== "AbortError") setState((s) => ({ ...s, error })); });
    return () => ctl.abort();
  }, []);
  return state;
}

/** Prices from the API are in cents. */
export function money(cents, currency = "USD") {
  if (!cents) return "Complimentary";
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}
