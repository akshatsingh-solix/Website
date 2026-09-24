/** Shares the Solix "Luminous Data" tokens with the corporate site (frontend/tailwind.config.js). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem", xl: "2.5rem" }, screens: { "2xl": "1320px" } },
    extend: {
      fontFamily: {
        display: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        muted: { DEFAULT: "hsl(var(--muted) / <alpha-value>)", foreground: "hsl(var(--muted-foreground) / <alpha-value>)" },
        primary: { DEFAULT: "#EE2424", ink: "hsl(var(--primary-ink) / <alpha-value>)", deep: "#B91C1C" },
        blue: { DEFAULT: "hsl(var(--brand-blue) / <alpha-value>)", brand: "#0088CF" },
        line: "rgb(var(--line) / <alpha-value>)",
        ink: { 950: "#0D192D", 900: "#112036", 800: "#1C2F43", 700: "#2C4A66", 600: "#3D6288" },
        "tint-blue": "#DDE9F2",
      },
      fontSize: {
        "fluid-hero": ["clamp(2.6rem, 1.6rem + 4.6vw, 6rem)", { lineHeight: "0.96", letterSpacing: "-0.035em" }],
        "fluid-h2": ["clamp(2rem, 1.6rem + 1.9vw, 3.5rem)", { lineHeight: "1.04", letterSpacing: "-0.03em" }],
        "fluid-h3": ["clamp(1.4rem, 1.2rem + 0.9vw, 2.1rem)", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        drift: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(4%,-3%) scale(1.08)" } },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "0.7" }, "100%": { transform: "scale(1.7)", opacity: "0" } },
      },
      animation: { marquee: "marquee 60s linear infinite", drift: "drift 18s ease-in-out infinite", "pulse-ring": "pulse-ring 2s ease-out infinite" },
      boxShadow: {
        soft: "0 1px 2px rgba(13,25,45,0.06), 0 8px 24px -12px rgba(13,25,45,0.18)",
        lift: "0 2px 8px rgba(13,25,45,0.08), 0 30px 70px -30px rgba(13,25,45,0.45)",
      },
    },
  },
  plugins: [],
};
