import type { MetadataRoute } from "next";
import { ALLOWED_CRAWLERS, PRIVATE_PATHS } from "@/lib/seo/crawlers";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt (PILK AI SEO SOP, Phases 1 and 3).
 *
 * Every search and AI answer crawler is allowed by name (one group that lists
 * them all), plus a catch-all for everyone else. Only the private app, auth,
 * API and invite redirect paths are blocked. CSS and JS are never blocked.
 * The sitemap is listed with its full URL on the main host.
 *
 * Cloudflare can override this file: AI Crawl Control and "Bot Preference
 * Sync" must be set to allow these crawlers and leave robots.txt as written
 * (see docs/seo/RUN-SHEET.md).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ALLOWED_CRAWLERS.map((c) => c.name), allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
