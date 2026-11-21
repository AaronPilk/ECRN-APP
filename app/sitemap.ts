import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { STATIC_PAGE_DATES, contentSitemap } from "@/lib/seo/pages";
import { SITE_URL } from "@/lib/site";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const revalidate = 3600;

/**
 * sitemap.xml: every indexable URL and nothing else (PILK AI SEO SOP, Phase 1).
 *
 *   - Static pages, the blog, career pages and the glossary: lib/seo/pages.ts.
 *     Dates are the day the content changed, never "now". To bump a static
 *     page's date, edit STATIC_PAGE_DATES there.
 *   - Open jobs: read from the database below, with each job's own update time.
 *
 * Not listed on purpose: the signed-in app, auth screens, /hire/thanks and
 * anything else that is noindex or redirects.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = contentSitemap();

  try {
    // Anonymous read: only public, open jobs are visible under RLS.
    const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const { data } = await sb
      .from("jobs")
      .select("id, updated_at")
      .eq("is_public", true)
      .in("status", ["open", "paused"]);

    let newestJob = 0;
    for (const j of data ?? []) {
      const updated = new Date(j.updated_at);
      if (Number.isNaN(updated.getTime())) continue;
      newestJob = Math.max(newestJob, updated.getTime());
      pages.push({ url: `${SITE_URL}/jobs/${j.id}`, lastModified: updated, changeFrequency: "weekly", priority: 0.7 });
    }

    // The job board itself changes whenever a job does.
    const board = pages.find((p) => p.url === `${SITE_URL}/jobs`);
    if (board && newestJob > new Date(STATIC_PAGE_DATES["/jobs"]).getTime()) board.lastModified = new Date(newestJob);
  } catch {
    // Static pages still ship if the database is unreachable at build time.
  }
  return pages;
}
