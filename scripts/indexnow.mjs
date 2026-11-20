#!/usr/bin/env node
/**
 * Submit ECRN URLs to IndexNow (Bing, Yandex, Seznam, Naver…).
 *   node scripts/indexnow.mjs            → every URL in the live sitemap
 *   node scripts/indexnow.mjs /jobs /faq → just these paths
 * Run after each deploy (PILK AI SEO SOP, Phase 2).
 */
const SITE = process.env.SITE_URL || "https://ecrn.com";
const KEY = "b23fe234623ea350ce5b3117a291746d";
const host = new URL(SITE).host;

async function urlsFromSitemap() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`, { headers: { "user-agent": "Mozilla/5.0 ECRN-IndexNow" } })).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const urlList = args.length ? args.map((p) => new URL(p, SITE).toString()) : await urlsFromSitemap();
if (!urlList.length) throw new Error("No URLs to submit");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} for ${urlList.length} URL(s)`);
if (res.status >= 300) process.exit(1);
