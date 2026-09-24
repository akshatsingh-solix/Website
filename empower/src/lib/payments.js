// Payment providers the events backend can hand us. None of these need keys in
// the browser: Eventbrite runs its own checkout widget, Stripe Payment Links are
// hosted pages, and invoices are handled by the events team.
import { reportPayment } from "./api";

const EB_SRC = "https://www.eventbrite.com/static/widgets/eb_widgets.js";
let ebLoading = null;

function loadEventbrite() {
  if (window.EBWidgets) return Promise.resolve(window.EBWidgets);
  if (!ebLoading) {
    ebLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = EB_SRC;
      s.async = true;
      s.onload = () => (window.EBWidgets ? resolve(window.EBWidgets) : reject(new Error("Eventbrite checkout didn't load.")));
      s.onerror = () => { ebLoading = null; reject(new Error("Eventbrite checkout couldn't load. Check your connection or ad blocker.")); };
      document.head.appendChild(s);
    });
  }
  return ebLoading;
}

/** Opens the Eventbrite checkout modal; resolves with the order id when the order completes. */
export async function payWithEventbrite({ eventId, promoCode, code, email }) {
  const EB = await loadEventbrite();
  const triggerId = `eb-trigger-${Date.now()}`;
  const trigger = document.createElement("button");
  trigger.id = triggerId;
  trigger.type = "button";
  trigger.style.display = "none";
  document.body.appendChild(trigger);
  return new Promise((resolve) => {
    EB.createWidget({
      widgetType: "checkout",
      eventId: String(eventId),
      modal: true,
      modalTriggerElementId: triggerId,
      promoCode: promoCode || undefined,
      onOrderComplete: async ({ orderId }) => {
        try { await reportPayment(code, email, "eventbrite", orderId ? String(orderId) : null); } catch { /* staff can still verify in Eventbrite */ }
        trigger.remove();
        resolve(orderId);
      },
    });
    trigger.click();
  });
}

export function payWithStripeLink(url) {
  window.location.assign(url);
}

const KEY = "empower_registration";
export function rememberRegistration(reg) {
  try { localStorage.setItem(KEY, JSON.stringify({ code: reg.code, email: reg.email })); } catch { /* ignore */ }
}
export function rememberedRegistration() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
export function forgetRegistration() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
