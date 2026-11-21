const { execFileSync } = require("node:child_process");

function releaseId() {
  if (process.env.WORKERS_CI_COMMIT_SHA) return process.env.WORKERS_CI_COMMIT_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "development";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_ECRN_BUILD_ID: releaseId() },
  // Cloudflare's production build must also pass TypeScript validation.
  typescript: { ignoreBuildErrors: false },
  // Cloudflare Workers: serve images as-is (no Next image optimizer).
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

// Lets `next dev` use Cloudflare bindings locally. Safe no-op otherwise.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare")
    .then((m) => m.initOpenNextCloudflareForDev())
    .catch(() => {});
}
