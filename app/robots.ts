import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Allow every search and AI answer engine (PILK AI SEO SOP, Phase 3).
 * Only private app, auth and API paths are blocked. CSS/JS are never blocked.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/api/", "/admin", "/dashboard", "/referrals", "/earnings", "/profile", "/candidate", "/onboarding",
    "/start", "/auth/", "/r/", "/login", "/signup", "/forgot-password", "/reset-password", "/check-email", "/install",
  ];
  const bots = [
    "Googlebot", "Bingbot", "Applebot", "OAI-SearchBot", "ChatGPT-User", "GPTBot", "Claude-SearchBot", "Claude-User",
    "ClaudeBot", "PerplexityBot", "Perplexity-User", "DuckDuckBot",
  ];
  return {
    rules: [
      ...bots.map((userAgent) => ({ userAgent, allow: "/", disallow: privatePaths })),
      { userAgent: "*", allow: "/", disallow: privatePaths },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
