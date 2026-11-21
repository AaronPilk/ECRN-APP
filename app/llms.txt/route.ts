import { LLMS_HEADERS, buildLlmsTxt } from "@/lib/seo/llms";

export const dynamic = "force-static";

/**
 * /llms.txt: the short plain-text guide to ECRN for AI tools
 * (PILK AI SEO SOP, Phases 1 and 3). The text is built in lib/seo/llms.ts from
 * the same data the pages use, so it cannot drift from the site.
 * The full detail is at /llms-full.txt.
 */
export function GET() {
  return new Response(buildLlmsTxt(), { headers: LLMS_HEADERS });
}
