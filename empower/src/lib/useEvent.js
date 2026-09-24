import { useEffect, useState } from "react";
import { getEvent } from "./api";
import { PASS } from "@/data/event";

// Live event settings (passes, prices, seats, registration open). Falls back to
// the published pass so the page still renders if the API is waking up.
const FALLBACK = {
  registration_open: true,
  waitlist: false,
  seats_left: null,
  refund_policy: PASS.refundPolicy,
  tickets: [{ id: PASS.id, name: PASS.name, price: PASS.price, currency: PASS.currency, provider: PASS.provider, eventbrite_event_id: PASS.eventbriteEventId,
    sales_end_at: PASS.salesEnd, sales_ended: false, seats_left: null, sold_out: false,
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

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" }) : null);

/** The pass people are most likely to buy: the first one still on sale. */
export const mainTicket = (data) => (data.tickets || []).find((t) => !t.sales_ended && !t.sold_out) || (data.tickets || [])[0];

/** Prices from the API are in cents. */
export function money(cents, currency = "USD") {
  if (!cents) return "Complimentary";
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}
