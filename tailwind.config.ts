import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Supabase-inspired dark surface scale
        surface: {
          0: "#fafafa",    // Primary text, button text
          50: "#efefef",   // Light border, subtle surface
          100: "#b4b4b4",  // Secondary link text
          200: "#a0a0a0",  // Muted text, tertiary links
          300: "#6b6b6b",  // Heavy secondary text
          400: "#434343",  // Tertiary border
          500: "#393939",  // Secondary border
          600: "#363636",  // Button border, secondary divider
          700: "#2e2e2e",  // Card border, tab border
          800: "#242424",  // Subtle divider, section hr
          900: "#171717",  // Page background, card bg
          950: "#0f0f0f",  // Deepest surface, primary button bg
        },
        // Supabase emerald green accent
        accent: {
          400: "#3ecf8e",                    // Brand green — logo, accent borders
          500: "#00c573",                    // Interactive green — links, CTAs
          600: "rgba(62, 207, 142, 0.3)",   // Green border accent
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-1": ["clamp(2.75rem, 5.5vw, 4.5rem)", { lineHeight: "1.00", letterSpacing: "-0.02em" }],
        "display-2": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.10", letterSpacing: "-0.02em" }],
        "display-3": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      },
      spacing: {
        "section": "6rem",
        "section-sm": "4rem",
        "gutter": "1.5rem",
      },
      maxWidth: {
        "prose": "65ch",
        "wide": "1280px",
      },
      borderRadius: {
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.25rem",
        "full": "9999px",
      },
      boxShadow: {
        "soft": "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -2px rgb(0 0 0 / 0.04)",
        "lift": "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 12px 24px -4px rgb(0 0 0 / 0.08)",
        "ring-accent": "0 0 0 3px rgb(16 185 129 / 0.18)",
      },
      transitionDuration: {
        "150": "150ms",
        "300": "300ms",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-up": "fade-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 300ms ease-out both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
