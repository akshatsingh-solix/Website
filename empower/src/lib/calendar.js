import { EVENT, LINKS } from "@/data/event";

const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl() {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${EVENT.name}: ${EVENT.theme}`,
    dates: `${stamp(EVENT.start)}/${stamp(EVENT.end)}`,
    details: `${EVENT.subtitle}. Agenda: ${siteUrl()}#agenda`,
    location: `${EVENT.venueLong}, ${EVENT.address}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function siteUrl(path = "") {
  return `${window.location.origin}${import.meta.env.BASE_URL}${path}`;
}

export function downloadIcs(code) {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Solix Technologies//SOLIXEmpower//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${EVENT.slug}-${code || "attendee"}@solixempower`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(EVENT.start)}`,
    `DTEND:${stamp(EVENT.end)}`,
    `SUMMARY:${EVENT.name}: ${EVENT.theme}`,
    `LOCATION:${`${EVENT.venueLong}, ${EVENT.address}`.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${(code ? `Registration ${code}. ` : "") + `Parking: ${LINKS.parking}`}`,
    `URL:${siteUrl()}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "SOLIXEmpower-2026.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
