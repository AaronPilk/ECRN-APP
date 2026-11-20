import { FAQS, SITE_URL, TIERS } from "@/lib/site";

export const dynamic = "force-static";

/** Plain-text guide for AI tools (llms.txt). Keep it accurate. */
export function GET() {
  const body = `# ECRN (Electrical Construction Referral Network)

> ECRN is a free network and job board for electrical construction professionals, run by Delta Construction Partners (recruiting since 2008, 30+ recruiters). Members find jobs and apply with one profile, or refer people they know and earn up to $10,000 when a referral is hired and completes the guarantee period (typically 90 days).

## Key pages
- [Home](${SITE_URL}/): what ECRN is and how members earn or find roles
- [Open jobs](${SITE_URL}/jobs): current electrical construction roles recruited by Delta Construction Partners
- [How it works](${SITE_URL}/how-it-works): join, refer or apply, Delta handles placement, get hired or paid
- [Referral rewards](${SITE_URL}/referral-rewards): payout tiers by role and when payouts are made
- [For employers](${SITE_URL}/hire): contractors request talent from Delta Construction Partners
- [About](${SITE_URL}/about): mission, vision, and Delta Construction Partners
- [FAQ](${SITE_URL}/faq): common questions
- [Program terms](${SITE_URL}/terms#program): referral compensation terms

## Referral payout tiers (estimates)
${TIERS.map((t) => `- ${t.tier}, ${t.name}: ${t.amount} (${t.roles.join(", ")})`).join("\n")}

## FAQ
${FAQS.map((f) => `- ${f.q} ${f.a}`).join("\n")}

## Apps
ECRN is available on the web and as an app for iPhone and Android.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
