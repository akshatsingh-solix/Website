// SOLIXEmpower is its own website (see /empower in this repo). The corporate
// site links to it with campaign tags so registrations show where they came from.
export const EMPOWER_URL = process.env.REACT_APP_EMPOWER_URL || "/Website/empower/";

export const EMPOWER = {
  name: "SOLIXEmpower 2026",
  theme: "The Agentic Enterprise",
  dates: "Oct 28-30, 2026",
  place: "UC San Diego",
  price: "$299",
  start: "2026-10-28T07:30:00-07:00",
  end: "2026-10-30T13:30:00-07:00",
  image: "https://empower.solix.com/wp-content/uploads/2026/04/solixempower-2026-popup-new2.jpg",
  faces: [
    { name: "Sai Gundavelli", src: "https://empower.solix.com/wp-content/themes/vantage/images/sai-gundavelli.jpg" },
    { name: "Dr. Rajesh Gupta", src: "https://empower.solix.com/wp-content/themes/vantage/images/rajesh-gupta.jpg" },
    { name: "James Massa", src: "https://empower.solix.com/wp-content/themes/vantage/images/james-massa.jpg" },
    { name: "Dr. James Short", src: "https://empower.solix.com/wp-content/themes/vantage/images/james-short.jpg" },
  ],
  speakers: 25,
};

/** Link into the Empower site with UTM tags (path is relative to the Empower site root). */
export const empowerLink = (content, path = "") => {
  const url = `${EMPOWER_URL.replace(/\/?$/, "/")}${path}`;
  const q = new URLSearchParams({ utm_source: "solix.com", utm_medium: "website", utm_campaign: "empower2026", utm_content: content });
  return `${url}${url.includes("?") ? "&" : "?"}${q}`;
};

export const empowerIsLive = () => Date.now() < new Date(EMPOWER.end).getTime();
