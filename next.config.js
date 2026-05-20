/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Type checking and linting are run separately via `npm run type-check`
  // and `npm run lint`, not blocking the build.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Allow Delta/ECRN logo hotlinks from deltaconstructionpartners.com
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deltaconstructionpartners.com",
      },
    ],
  },
  // Headers needed for the PWA service worker to be served with the right scope
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
