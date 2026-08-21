import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
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
        // Ember — warm charcoal surface scale (every gray leans brown, never blue)
        surface: {
          0: "#f5efe6",    // Primary text (warm cream)
          50: "#ede5da",   // Subtle surface on dark
          100: "#d9cec0",  // Secondary link hover
          200: "#c4b8ab",  // Muted text, links resting
          300: "#94897c",  // Body secondary text
          400: "#6e655a",  // Eyebrow, meta text
          500: "#4a4038",  // Hover border
          600: "#3a332d",  // Strong border, button border
          700: "#2e2823",  // Card border, divider
          800: "#1c1815",  // Raised card bg, section band
          900: "#141110",  // Page background
          950: "#0e0c0b",  // Deepest surface, primary button bg
        },
        // Ember accent — tangerine interactive + amber brand
        accent: {
          400: "#ffb86a",                    // Amber — logo mark, highlights
          500: "#ff6b35",                    // Tangerine — links, CTAs, focus
          600: "rgba(255, 107, 53, 0.35)",   // Accent border, glow rings
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-1": ["clamp(3rem, 6.5vw, 5.5rem)", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
        "display-2": ["clamp(2.25rem, 4.5vw, 3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
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
        "lift": "0 12px 32px -12px rgb(0 0 0 / 0.6)",
        "glow-accent": "0 0 40px -8px rgb(255 107 53 / 0.35)",
      },
      transitionDuration: {
        "150": "150ms",
        "380": "380ms",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.82)" },
        },
        "drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 380ms ease-out both",
        "pulse-dot": "pulse-dot 2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "drift": "drift 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
