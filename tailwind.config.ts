import type { Config } from "tailwindcss";

/**
 * ECRN brand tokens
 *
 * Visual direction:
 *   - Marketing / landing surfaces lean on `delta.navy` for a bold, premium feel
 *     consistent with deltaconstructionpartners.com (#BuiltForLeaders).
 *   - Logged-in app surfaces are Apple-clean: white background, rounded-2xl cards,
 *     soft shadows, ECRN amber accents reserved for primary CTAs.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        delta: {
          navy: "#0B1220",
          ink: "#111827",
          steel: "#1F2937",
          mist: "#F8FAFC",
        },
        ecrn: {
          amber: "#F5B419",
          "amber-dark": "#D69910",
          electric: "#2563EB",
          "electric-dark": "#1D4ED8",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "system-ui",
          "Inter",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)",
        float: "0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)",
        glow: "0 0 0 4px rgba(245, 180, 25, 0.18)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 280ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
