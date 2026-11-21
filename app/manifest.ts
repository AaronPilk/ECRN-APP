import type { MetadataRoute } from "next";

/**
 * PWA manifest for ECRN.
 *
 * Served at /manifest.webmanifest. Linked from app/layout.tsx via the
 * `manifest` metadata field, and consumed by both iOS Safari and Android
 * Chrome when users tap "Add to Home Screen".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ECRN — Electrical Construction Referral Network",
    short_name: "ECRN",
    description:
      "Refer construction industry talent. Earn when Delta places them. A Delta Construction Partners initiative.",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A100C",
    theme_color: "#0A100C",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
