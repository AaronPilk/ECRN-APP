import { LLMS_HEADERS, buildLlmsFullTxt } from "@/lib/seo/llms";

export const dynamic = "force-static";

/**
 * /llms-full.txt: everything an AI tool needs to answer a question about ECRN
 * in one plain-text file: program facts, reward tiers, steps, every FAQ, each
 * career page's answer, each blog post's answer and key takeaways, and every
 * glossary definition (PILK AI SEO SOP, Phases 1 and 3).
 * Built in lib/seo/llms.ts from the same data the pages use.
 */
export function GET() {
  return new Response(buildLlmsFullTxt(), { headers: LLMS_HEADERS });
}
