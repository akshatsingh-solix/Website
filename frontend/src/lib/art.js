import { Building2, CalendarDays, Handshake, Rocket, Users } from "lucide-react";

// Press releases without a picture of their own lead with a sigil
// (components/materials/Sigil) by category; resource cards take theirs from
// the resource type's icon (components/home/InsightsPreview).
// no-i18n
const PRESS_GLYPHS = {
  Product: { icon: Rocket, tone: "blue" },
  Customer: { icon: Users, tone: "red" },
  Partner: { icon: Handshake, tone: "blue" },
  Event: { icon: CalendarDays, tone: "red" },
  Company: { icon: Building2, tone: "red" },
};

/** { icon, tone } of a press-release category's sigil. */
export const pressGlyph = (category) => PRESS_GLYPHS[category] || PRESS_GLYPHS.Company;
