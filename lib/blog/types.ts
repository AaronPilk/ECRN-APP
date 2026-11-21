/**
 * Blog content model. Posts are plain typed data (no MDX, no file system),
 * so they type-check, render on Cloudflare Workers, and feed the sitemap,
 * RSS, llms.txt and structured data from one source.
 *
 * Inline text supports a small markdown subset, rendered by components/blog:
 *   **bold**   *italic*   [link text](/internal-path)   [link text](https://external)
 *   [^3]  → superscript link to source number 3 in `sources`
 * Nothing else is parsed. No HTML.
 */

export type Inline = string;

export type Block =
  | { type: "p"; text: Inline }
  /** Section heading. Phrase it as the question people search when that fits. `id` is optional (auto-slugged). */
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string; id?: string }
  | { type: "ul"; items: Inline[] }
  | { type: "ol"; items: Inline[] }
  /** Comparison or data table. Keep it to 2–6 columns so it works on a phone. */
  | { type: "table"; caption?: string; head: string[]; rows: Inline[][]; note?: Inline }
  /** Highlighted box. tone: "info" (default), "tip", "warning". */
  | { type: "callout"; tone?: "info" | "tip" | "warning"; title?: string; text: Inline }
  /** 2–4 big numbers. Every value needs a `source` (id in `sources`) unless it is an ECRN program fact. */
  | { type: "stats"; items: { value: string; label: string; source?: number }[] }
  /** Numbered how-to steps. */
  | { type: "steps"; items: { title: string; text: Inline }[] }
  /** In-article call to action pointing at a money page. */
  | { type: "cta"; title: string; text: Inline; href: string; label: string };

export interface BlogSource {
  /** 1-based, referenced inline as [^id]. */
  id: number;
  title: string;
  publisher: string;
  url: string;
  /** The day the page was actually opened and read: YYYY-MM-DD. */
  accessed: string;
  /** What exactly was taken from it (figure, table name, year). */
  note?: string;
}

export const BLOG_CATEGORIES = {
  referrals: { label: "Referrals & rewards", description: "How referral rewards work in electrical construction and how to earn them." },
  pay: { label: "Pay & salary", description: "What electrical construction roles pay, with sources." },
  careers: { label: "Careers", description: "Roles, career paths and how to move up in electrical construction." },
  "job-search": { label: "Job search", description: "Finding and landing your next electrical construction role." },
  industry: { label: "Industry", description: "Where the work is and what is driving demand." },
  employers: { label: "For employers", description: "Hiring and keeping electrical construction talent." },
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;

export const AUTHORS = {
  /**
   * Organisation byline. A named Delta recruiter is added as `reviewedBy`
   * only after that person has really reviewed the article.
   */
  "ecrn-team": {
    name: "ECRN Editorial Team",
    role: "Electrical Construction Referral Network, powered by Delta Construction Partners",
    url: "/about",
  },
} as const;

export type AuthorKey = keyof typeof AUTHORS;

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  /** URL slug: /blog/<slug>. Lowercase, hyphens. Fixed by the content plan. */
  slug: string;
  /** The H1. Says what the page is, in the words people search. About 45–70 characters. */
  title: string;
  /** <title> tag: 50–60 characters, search phrase first, "| ECRN" last. */
  metaTitle: string;
  /** Meta description: 140–160 characters, makes someone click. */
  description: string;
  category: BlogCategory;
  /** The main search this page is the best answer for. */
  targetQuery: string;
  secondaryQueries: string[];
  /** Answer-first: two sentences that answer the target query outright. Plain text, 40–70 words. */
  answer: string;
  /** 3–5 one-line takeaways (plain text). */
  keyTakeaways: string[];
  /** YYYY-MM-DD. */
  publishedAt: string;
  updatedAt: string;
  author: AuthorKey;
  /** Only set once a real person has reviewed it. */
  reviewedBy?: { name: string; role: string };
  /** Image name from lib/site-images.ts (cover + share image). */
  cover: string;
  body: Block[];
  /** 4–7 real questions, shown on the page and mirrored in FAQPage data. Answers are plain text. */
  faqs: BlogFaq[];
  sources: BlogSource[];
  /** Slugs of 2–4 related posts (from the content plan). */
  related: string[];
  /** The page this article supports and links to. */
  moneyPage: { href: string; label: string };
}

/** Rough reading time from the text blocks. */
export function readingMinutes(post: BlogPost): number {
  const words = wordCount(post);
  return Math.max(2, Math.round(words / 220));
}

export function wordCount(post: BlogPost): number {
  const parts: string[] = [post.answer, ...post.keyTakeaways];
  for (const b of post.body) {
    switch (b.type) {
      case "p":
      case "h2":
      case "h3":
        parts.push(b.text);
        break;
      case "ul":
      case "ol":
        parts.push(...b.items);
        break;
      case "table":
        parts.push(...b.head, ...b.rows.flat(), b.caption ?? "", b.note ?? "");
        break;
      case "callout":
        parts.push(b.title ?? "", b.text);
        break;
      case "stats":
        parts.push(...b.items.map((i) => `${i.value} ${i.label}`));
        break;
      case "steps":
        parts.push(...b.items.map((i) => `${i.title} ${i.text}`));
        break;
      case "cta":
        parts.push(b.title, b.text);
        break;
    }
  }
  for (const f of post.faqs) parts.push(f.q, f.a);
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}
