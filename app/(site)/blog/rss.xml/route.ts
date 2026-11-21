import { allPosts } from "@/content/blog";
import { rfc822, xmlEscape } from "@/lib/blog/format";
import { BLOG_PATH, BLOG_RSS_PATH, categoryPath, postPath } from "@/lib/blog/routes";
import { BLOG_DESCRIPTION, BLOG_HEADING, BLOG_NAME } from "@/lib/blog/seo";
import { AUTHORS, BLOG_CATEGORIES } from "@/lib/blog/types";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** RSS 2.0 feed of every post, newest first. Dates are the post's calendar day at 12:00 UTC. */
export function GET() {
  const latestDay = allPosts.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), "");

  const items = allPosts
    .map((post) => {
      const url = absoluteUrl(postPath(post.slug));
      return [
        "    <item>",
        `      <title>${xmlEscape(post.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <description>${xmlEscape(post.answer)}</description>`,
        `      <pubDate>${rfc822(post.publishedAt)}</pubDate>`,
        `      <category domain="${xmlEscape(absoluteUrl(categoryPath(post.category)))}">${xmlEscape(BLOG_CATEGORIES[post.category].label)}</category>`,
        `      <dc:creator>${xmlEscape(AUTHORS[post.author].name)}</dc:creator>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${xmlEscape(`${BLOG_NAME}: ${BLOG_HEADING}`)}</title>`,
    `    <link>${xmlEscape(absoluteUrl(BLOG_PATH))}</link>`,
    `    <description>${xmlEscape(BLOG_DESCRIPTION)}</description>`,
    "    <language>en-us</language>",
    ...(latestDay ? [`    <lastBuildDate>${rfc822(latestDay)}</lastBuildDate>`] : []),
    `    <atom:link href="${xmlEscape(absoluteUrl(BLOG_RSS_PATH))}" rel="self" type="application/rss+xml" />`,
    ...(items ? [items] : []),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
