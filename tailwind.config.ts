import type { Config } from "tailwindcss";

/**
 * ECRN brand tokens (from the actual brand sheet provided by Aaron).
 *
 * Visual direction:
 *   - Marketing surfaces: deep near-black background with a subtle green
 *     undertone, vibrant ECRN green for accents/CTAs, white type.
 *   - Logged-in app surfaces: Apple-clean white interior, ECRN green
 *     reserved for primary CTAs and active states.
 *
 * Logo wordmark file: /public/brand/ecrn-horizontal-white.png
 * Mark: triangle (mountain) silhouette in ECRN green.
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
        // Brand surface
        ecrn: {
          // Vibrant green from the brand logo
          green: "#16C172",
          "green-bright": "#22E380",
          "green-dark": "#0FA15D",
          // Near-black with slight green undertone, matches the casting-call site
          black: "#0A100C",
          ink: "#0F1612",
          carbon: "#161F1B",
          mist: "#F6F8F7",
          // Mobile UI rev 03 (ChatGPT handoff, Nov 2026)
          paper: "#F7F8F5",
          line: "#D9DFD8",
          secondary: "#506158",
          "green-text": "#07653E",
          "action-bright": "#36DC86",
          "action-surface": "#D9F7E5",
          "action-ink": "#052B1A",
          selected: "#C1F3D5",
          "reward-dark": "#BCDFFF",
          "reward-tint": "#E8F2FF",
        },
        // Delta Construction Partners brand
        cobalt: "#0655CE",
        navy: "#00244B",
        "delta-surface": "#E9F2FF",
        // Kept under the `delta` namespace for code that references it; same
        // visual identity now (Delta + ECRN share the dark canvas).
        delta: {
          navy: "#0A100C",
          ink: "#0F1612",
          steel: "#1F2A24",
          mist: "#F6F8F7",
        },
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "-apple-system", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
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
        soft: "0 1px 2px rgba(10, 16, 12, 0.04), 0 4px 12px rgba(10, 16, 12, 0.06)",
        float: "0 8px 24px rgba(10, 16, 12, 0.10), 0 2px 6px rgba(10, 16, 12, 0.05)",
        glow: "0 0 0 4px rgba(22, 193, 114, 0.22)",
        action: "inset 0 1px 0 #8DEFAE, 0 2px 8px rgba(22,193,114,.18)",
        pass: "0 10px 30px rgba(0, 36, 75, 0.25)",
        "glow-lg":
          "0 0 24px rgba(22, 193, 114, 0.35), 0 0 0 1px rgba(22, 193, 114, 0.4)",
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
