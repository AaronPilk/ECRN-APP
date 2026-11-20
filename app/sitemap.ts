import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const revalidate = 3600;

/** Every indexable page and nothing else; real lastmod for jobs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date("2026-11-20");
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: updated, changeFrequency: "weekly", priority: 1, images: [`${SITE_URL}/brand/jobsite.jpg`] },
    { url: `${SITE_URL}/jobs`, lastModified: updated, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/how-it-works`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/referral-rewards`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/hire`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/support`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    // Anonymous read: only public, open jobs are visible under RLS.
    const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const { data } = await sb
      .from("jobs")
      .select("id, updated_at")
      .eq("is_public", true)
      .in("status", ["open", "paused"]);
    for (const j of data ?? []) {
      pages.push({ url: `${SITE_URL}/jobs/${j.id}`, lastModified: new Date(j.updated_at), changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {
    // Static pages still ship if the database is unreachable at build time.
  }
  return pages;
}
