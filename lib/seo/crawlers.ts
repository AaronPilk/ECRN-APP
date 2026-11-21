/**
 * Who may crawl what (PILK AI SEO SOP, Phases 1 and 3).
 * Used by app/robots.ts. scripts/seo-audit.mjs checks the live robots.txt
 * against the same crawler names: if you change this list, change it there too.
 */

/**
 * Every search and answer crawler in the SOP's Phase 3 table, allowed by name.
 * Crawler names as of Aug 2026. Recheck each vendor's docs before removing or
 * blocking one: blocking a "training" crawler does not affect search, but
 * blocking a "search" or "live fetch" crawler removes ECRN from that engine.
 */
export const ALLOWED_CRAWLERS = [
  { name: "Googlebot", use: "Google Search, AI Overviews and AI Mode" },
  { name: "Bingbot", use: "Bing, Copilot, DuckDuckGo and Yahoo results" },
  { name: "Applebot", use: "Siri and Spotlight" },
  { name: "OAI-SearchBot", use: "ChatGPT search index" },
  { name: "ChatGPT-User", use: "ChatGPT live page reads" },
  { name: "GPTBot", use: "OpenAI training" },
  { name: "Claude-SearchBot", use: "Claude search index" },
  { name: "Claude-User", use: "Claude live page fetches" },
  { name: "ClaudeBot", use: "Anthropic training" },
  { name: "PerplexityBot", use: "Perplexity index" },
  { name: "Perplexity-User", use: "Perplexity live fetches" },
  { name: "Google-Extended", use: "Gemini training and grounding (not Search)" },
  { name: "Applebot-Extended", use: "Apple training" },
  { name: "DuckDuckBot", use: "DuckDuckGo's own crawler" },
] as const;

/**
 * Private paths: the signed-in app, auth screens, the API and the invite
 * redirect (/r/CODE). Keep in step with PRIVATE_PREFIXES in middleware.ts,
 * which also sends X-Robots-Tag: noindex for them.
 *
 * These are prefix matches, so "/login" also covers "/login?next=…".
 * Two things to keep true when adding a public page:
 *   - "/r/" keeps its trailing slash, so /referral-rewards stays open.
 *   - No public URL may start with one of these ("/referrals" is the app,
 *     "/referral-rewards" is public). The audit script fails if a sitemap URL
 *     is caught by a rule.
 * CSS and JS (/_next/) are never blocked.
 */
export const PRIVATE_PATHS = [
  "/api/",
  "/admin",
  "/dashboard",
  "/referrals",
  "/earnings",
  "/profile",
  "/candidate",
  "/onboarding",
  "/install",
  "/start",
  "/auth/",
  "/r/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/check-email",
  "/account-disabled",
];
