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
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A100C",
    theme_color: "#0A100C",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
