import { firstSentence } from "@/lib/blog/format";
import { BLOG_CATEGORIES } from "@/lib/blog/types";
import { BRAND, FAQS, SITE_URL, STEPS, TIERS } from "@/lib/site";
import { STATIC_PAGES, STATIC_PAGE_DATES, absolute, hubPages, siteContent, type SiteContent, type SitePage } from "./pages";
import { latestDay, plain } from "./text";

/**
 * Text for /llms.txt (the short guide) and /llms-full.txt (the full detail).
 * AI tools read these to answer questions about ECRN, so every line must be
 * true today. Rules:
 *   - Program facts come from lib/site.ts (BRAND, TIERS, STEPS, FAQS) wherever
 *     they exist there. The few written out below mirror
 *     docs/SITE_BUILD_CONTRACT.md ("Facts you may state") and the program
 *     terms in app/(site)/terms/page.tsx. Change them together.
 *   - Never add reviews, counts, client names, addresses or phone numbers.
 *   - Blog posts, career pages and glossary terms are read from their data, so
 *     new ones appear here on the next deploy with no edit to this file.
 */

const DELTA = BRAND.parent.name;

const SUMMARY = `ECRN (${BRAND.legalName}) is a free referral network and job board for electrical construction, powered by ${DELTA}. Members apply to open roles with one account, or refer people they know and earn up to $10,000 when a referral is hired and completes the guarantee period (typically 90 days).`;

const WHO_POWERS_IT = `${DELTA} (${BRAND.parent.url}) is a construction recruiting firm. It has been recruiting since ${BRAND.parent.foundingDate}, has 30+ recruiters and has national contractor relationships. Its recruiters handle every ECRN referral and application: vetting, interviews and follow-up.`;

/** The apps are in testing: never say "in the App Store" or "on Google Play". */
const WHERE = "on the web, with iPhone and Android apps";

/** The reward rules, from the contract's fact list and the program terms page. */
const REWARD_RULES = [
  `Amounts are estimates. ${DELTA} confirms the final amount in writing before payout.`,
  `A reward is paid after the referred person is placed with a ${DELTA} client and completes the guarantee period, typically 90 days from their start date.`,
  "If the placement ends before the guarantee period is complete, no reward is paid.",
  "There is no cap on the number of people a member can refer.",
  "If two members refer the same person, the first verified referral on record keeps ownership.",
  "Referrals are submitted through ECRN, on the website or in the app.",
];

/** From the program terms (app/(site)/terms/page.tsx, "Eligibility" and "Taxes"). */
const ELIGIBILITY = [
  "To receive a referral reward a member must be registered with ECRN, 18 or older and legally authorized to work in the United States.",
  `Employees of ${DELTA} and their immediate family members cannot receive referral rewards.`,
  "Referral rewards may be taxable income, and members are responsible for any taxes. The program terms explain how this is reported.",
];

const link = (label: string, path: string, note: string) => `- [${label}](${absolute(path)}): ${note}`;

/** The first sentence of an answer, as plain text: the same line the blog cards show. */
const oneSentence = (answer: string) => firstSentence(plain(answer));

function tierLine(index: number): string {
  const t = TIERS[index];
  return `${t.tier}, ${t.name.toLowerCase()}: ${t.amount.toLowerCase()} (${t.roles.join(", ")})`;
}

function keyPages(content: SiteContent): { main: SitePage[]; optional: SitePage[] } {
  const all = [...STATIC_PAGES, ...hubPages(content)];
  return { main: all.filter((p) => !p.secondary && p.path !== "/glossary"), optional: all.filter((p) => p.secondary || p.path === "/glossary") };
}

/** /llms.txt: what ECRN is, who powers it, and the key pages with a one-line answer each. */
export function buildLlmsTxt(content: SiteContent = siteContent()): string {
  const { posts, roles } = content;
  const { main, optional } = keyPages(content);
  const out: string[] = [
    `# ${BRAND.name} (${BRAND.legalName})`,
    "",
    `> ${SUMMARY}`,
    "",
    "- Free to join. One account can apply to jobs and refer people.",
    `- Powered by ${DELTA} (${BRAND.parent.url}), a construction recruiting firm: recruiting since ${BRAND.parent.foundingDate}, 30+ recruiters, national contractor relationships.`,
    "- Referral rewards: up to $10,000 per hire, in four tiers by role level. Amounts are estimates, confirmed in writing before payout.",
    `- Rewards are paid after the referral is placed with a ${DELTA} client and completes the guarantee period, typically 90 days. There is no cap on the number of referrals.`,
    "- Members who are employed can mark themselves \"open to the right move\". Only Delta's recruiters see it.",
    `- ECRN works ${WHERE}.`,
    `- Full detail in one file: ${SITE_URL}/llms-full.txt`,
    "",
    "## Key pages",
    "",
    ...main.map((p) => link(p.label, p.path, p.answer)),
    link("Referral program terms", "/terms#program", "The ECRN Referral Compensation Program terms: eligibility, payout tiers, payout conditions and taxes."),
  ];

  if (roles.length) {
    out.push("", "## Career pages", "", ...roles.map((r) => link(r.title, `/careers/${r.slug}`, oneSentence(r.answer))));
  }
  if (posts.length) {
    out.push("", "## Blog", "", ...posts.map((p) => link(p.title, `/blog/${p.slug}`, oneSentence(p.answer))));
  }

  out.push(
    "",
    "## Optional",
    "",
    ...optional.map((p) => link(p.label, p.path, p.answer)),
    `- [Full text for AI tools](${SITE_URL}/llms-full.txt): every program fact, FAQ, career page answer, blog summary and glossary definition in one file.`,
    ""
  );
  return out.join("\n");
}

/** /llms-full.txt: everything an AI tool needs to answer a question about ECRN. */
export function buildLlmsFullTxt(content: SiteContent = siteContent()): string {
  const { posts, roles, glossary, glossaryUpdatedAt } = content;
  const pages = [...STATIC_PAGES, ...hubPages(content)];
  const updated = latestDay(
    [...Object.values(STATIC_PAGE_DATES), ...posts.map((p) => p.updatedAt), ...roles.map((r) => r.updatedAt), glossary.length ? glossaryUpdatedAt : undefined],
    STATIC_PAGE_DATES["/"]
  );

  const out: string[] = [
    `# ${BRAND.name} (${BRAND.legalName}): full reference`,
    "",
    `> ${SUMMARY}`,
    "",
    `Website: ${SITE_URL}/`,
    `Short version of this file: ${SITE_URL}/llms.txt`,
    `Last updated: ${updated}`,
    "",
    "## What ECRN is",
    "",
    `- Name: ${BRAND.name}, short for ${BRAND.legalName}.`,
    `- Tagline: ${BRAND.tagline}`,
    "- What it does: a referral network and job board for electrical construction professionals. Members apply to open roles or refer people they know.",
    "- Cost: free to join.",
    "- One account can apply to jobs and refer people.",
    `- Who runs the recruiting: ${DELTA}.`,
    `- Where it works: ${WHERE}.`,
    "",
    `## Who powers ECRN: ${DELTA}`,
    "",
    WHO_POWERS_IT,
    `ECRN is an initiative of ${DELTA}.`,
    "",
    "## How ECRN works",
    "",
    ...STEPS.map((s, i) => `${i + 1}. ${s.title}. ${s.body}`),
    "",
    "## How to refer someone",
    "",
    "- Enter the person's name and phone number, or pick them from your phone's contacts in the ECRN app.",
    "- Only the contacts you choose are sent.",
    "- Delta's recruiters contact the person and handle the hiring process. No recruiting experience is needed.",
    "",
    "## Looking for a job without your employer knowing",
    "",
    "- Members who are employed can mark themselves \"open to the right move\".",
    "- Only Delta's recruiters see it. The member's current employer is never contacted.",
    "",
    "## Referral rewards",
    "",
    "Up to $10,000 per hire, in four tiers by the level of the role filled:",
    "",
    ...TIERS.map((_, i) => `- ${tierLine(i)}. ${TIERS[i].summary}`),
    "",
    "Rules:",
    "",
    ...REWARD_RULES.map((r) => `- ${r}`),
    ...ELIGIBILITY.map((r) => `- ${r}`),
    `- The program terms on the site are the authority if anything here differs: ${SITE_URL}/terms#program`,
    "",
    "## For employers",
    "",
    `Electrical contractors who want to hire tell ${DELTA} what they need at ${SITE_URL}/hire, and a recruiter reaches out.`,
    "",
    "## Frequently asked questions",
    "",
    ...FAQS.flatMap((f) => [`### ${f.q}`, "", plain(f.a), ""]),
  ];

  if (roles.length) {
    out.push(
      "## Career pages",
      "",
      "One page per role that Delta Construction Partners recruits for.",
      "",
      ...roles.flatMap((r) => [
        `### ${r.title}`,
        "",
        `URL: ${absolute(`/careers/${r.slug}`)}`,
        `Updated: ${latestDay([r.updatedAt], STATIC_PAGE_DATES["/careers"])}`,
        ...(TIERS[r.tierIndex] ? [`ECRN referral reward for this role level: ${tierLine(r.tierIndex)}. Estimate, confirmed in writing before payout.`] : []),
        "",
        plain(r.answer),
        "",
      ])
    );
  }

  if (posts.length) {
    out.push(
      "## Blog",
      "",
      "Each article lists its sources on its own page. Figures below come from those sources.",
      "",
      ...posts.flatMap((p) => [
        `### ${p.title}`,
        "",
        `URL: ${absolute(`/blog/${p.slug}`)}`,
        `Category: ${BLOG_CATEGORIES[p.category]?.label ?? p.category}`,
        `Published: ${p.publishedAt}. Updated: ${p.updatedAt}.`,
        "",
        plain(p.answer),
        "",
        ...(p.keyTakeaways.length ? ["Key takeaways:", "", ...p.keyTakeaways.map((k) => `- ${plain(k)}`), ""] : []),
      ])
    );
  }

  if (glossary.length) {
    out.push(
      "## Glossary of electrical construction terms",
      "",
      `URL: ${absolute("/glossary")}`,
      `Updated: ${latestDay([glossaryUpdatedAt], STATIC_PAGE_DATES["/glossary"])}`,
      "",
      ...glossary.map((g) => `- ${g.term}${g.aka?.length ? ` (also called ${g.aka.join(", ")})` : ""}: ${plain(g.definition)} ${absolute(`/glossary#${g.slug}`)}`),
      ""
    );
  }

  out.push("## Pages on ecrn.com", "", ...pages.map((p) => link(p.label, p.path, p.answer)), "");
  return out.join("\n");
}

/**
 * Headers for both files: plain text, UTF-8. They are left indexable on
 * purpose, so search-backed AI engines can read and quote them. Nothing on the
 * site links to them and they are not in the sitemap.
 */
export const LLMS_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
};
