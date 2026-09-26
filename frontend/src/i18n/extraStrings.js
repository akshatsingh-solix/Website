// i18n: strings that reach tx() at runtime but aren't literal tx("...")
// calls in the source, so the catalog tool (scripts/i18n-extract.js) can't
// see them otherwise. Nothing imports this file; it only feeds the catalog.
const EXTRA_STRINGS = [
  // Filter keys kept in English in the data, translated where displayed.
  "Cloud Archive Products", "EAI Pharma", "Enterprise AI (EAI)", "Enterprise Foundation", "Platform",
  "AI Solutions", "Preservation & Archive",
  "Product", "Customer", "Partner", "Event", "Company",

  // Beat labels of the pinned homepage hero (Hero.jsx BEATS) and the route
  // curtain's destination names (RouteCurtain.jsx).
  "Signal", "Govern", "Activate", "Services & Support", "My trial",

  // Component default props.
  "Ready when you are",
  "See your data activated in a live demo.",
  "Bring one system you wish you could switch off, one dataset your AI team can't touch, or one audit you dread. We'll show you the path.",
  "Request a demo",
  "Talk to an expert",
  "Thank you — we'll be in touch shortly.",
  "A Solix expert will reach out within one business day to schedule your session.",

  // Lead form validation (zod schema in LeadForm.jsx).
  "Please enter your name",
  "Enter a valid work email",
  "Company is required",

  // Messages returned by the Solix API.
  "Incorrect email or password.",
  "Too many failed attempts. Try again in 15 minutes.",
  "An account with this email already exists. Sign in instead.",
  "Password must be 6-30 characters and include a letter, a number and a symbol.",
  "Session expired. Please sign in again.",
  "We couldn't sign you in right now. Please try again.",
  "We couldn't send the request right now. Please try again.",
  "We couldn't create your account right now. Please try again.",
  "The concierge is temporarily unavailable. Please try again.",
  "The concierge is unavailable right now. Please try again shortly.",
];

export default EXTRA_STRINGS;
