/** @type {import('tailwindcss').Config} */
module.exports = {
  blocklist: ["overline"],
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem", xl: "2.5rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      fontFamily: {
        display: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Brand blue, replacing the earlier generic cyan - matches the Solix
        // brand guide's button/hyperlink blue (#0088CF) instead of an
        // off-the-shelf "AI startup" teal. Class name kept as `teal` to avoid
        // a mechanical rename across every consumer; the color itself is blue.
        teal: { DEFAULT: "#0088CF", dim: "#00669E" },
        ember: { DEFAULT: "#EE2424", deep: "#B91C1C" },
        // Real Solix navy scale, from the SOLIX Brand Design System (Navy
        // 950/900/800/700/600) - not a generic slate.
        ink: { 950: "#0D192D", 900: "#112036", 800: "#1C2F43", 700: "#2C4A66", 600: "#3D6288" },
        // Neutral scale from the brand system - replaces framework-default
        // Tailwind slate/gray tokens that had crept into chart components.
        grey: { 50: "#F5F5F5", 400: "#B0B0B2", 700: "#424242", 900: "#1D1D1D" },
        "tint-blue": "#DDE9F2",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontSize: {
        "fluid-sm": ["clamp(0.875rem, 0.83rem + 0.2vw, 1rem)", { lineHeight: "1.6" }],
        "fluid-h1": ["clamp(2.75rem, 2rem + 3.6vw, 5.5rem)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        "fluid-h2": ["clamp(2rem, 1.6rem + 1.9vw, 3.5rem)", { lineHeight: "1.04", letterSpacing: "-0.03em" }],
        "fluid-h3": ["clamp(1.5rem, 1.3rem + 0.9vw, 2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "fluid-lead": ["clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)", { lineHeight: "1.6" }],
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "0.7" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
        dash: { to: { strokeDashoffset: "-40" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "aurora-drift-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, 6%) scale(1.08)" },
          "66%": { transform: "translate(-3%, 3%) scale(0.96)" },
        },
        "aurora-drift-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "40%": { transform: "translate(-5%, -4%) scale(1.1)" },
          "70%": { transform: "translate(3%, -5%) scale(0.94)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 48s linear infinite",
        float: "float 7s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(0.2, 0.6, 0.3, 1) infinite",
        dash: "dash 1.6s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        blink: "blink 1s step-end infinite",
        "aurora-1": "aurora-drift-1 22s ease-in-out infinite",
        "aurora-2": "aurora-drift-2 26s ease-in-out infinite",
        "spin-slow": "spin-slow 40s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
