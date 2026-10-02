/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Types are checked separately with `npm run type-check`.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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
