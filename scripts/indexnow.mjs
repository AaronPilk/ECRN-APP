#!/usr/bin/env node
/**
 * Submit ECRN URLs to IndexNow (Bing, Yandex, Seznam, Naver and others).
 * Run after each deploy, once ecrn.com is live (PILK AI SEO SOP, Phase 2).
 *
 *   node scripts/indexnow.mjs                      every URL in the live sitemap
 *   node scripts/indexnow.mjs --since 2026-11-20   only URLs whose <lastmod> is on or after that day
 *   node scripts/indexnow.mjs /jobs /faq           just these paths
 *
 *   --dry-run   print what would be sent, send nothing
 *   --if-live   exit quietly (code 0) when the key file is not on the site yet,
 *               so a deploy step does not fail before the domain is connected
 *
 * SITE_URL=https://… points it at another host (default https://ecrn.com).
 * The key file is public/<KEY>.txt. IndexNow answers 200 or 202 when it accepts.
 */
const SITE = (process.env.SITE_URL || "https://ecrn.com").replace(/\/$/, "");
const KEY = "b23fe234623ea350ce5b3117a291746d";
const host = new URL(SITE).host;
/** A normal user agent: Cloudflare can block default script agents. */
const headers = { "user-agent": "Mozilla/5.0 (compatible; ECRN-IndexNow/1.0)" };

// ── Arguments ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const dryRun = flag("--dry-run");
const ifLive = flag("--if-live");

let since = null;
const sinceAt = args.indexOf("--since");
if (sinceAt !== -1) {
  since = args[sinceAt + 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since ?? "")) {
    console.error("--since needs a date like 2026-11-20");
    process.exit(2);
  }
}
const paths = args.filter((a, i) => !a.startsWith("--") && !(sinceAt !== -1 && i === sinceAt + 1));

// ── Which URLs ───────────────────────────────────────────────────────

/** Every <url> in the live sitemap, with its <lastmod> when it has one. */
async function sitemapEntries() {
  const res = await fetch(`${SITE}/sitemap.xml`, { headers });
  if (!res.ok) throw new Error(`${SITE}/sitemap.xml answered ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap((m) => {
    const loc = m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1];
    const lastmod = m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1] ?? null;
    return loc ? [{ loc: loc.replace(/&amp;/g, "&"), lastmod }] : [];
  });
}

let urlList;
if (paths.length) {
  urlList = paths.map((p) => new URL(p, SITE).toString());
} else {
  const entries = await sitemapEntries().catch((error) => {
    console.error(`Could not read the sitemap: ${error.message}`);
    process.exit(1);
  });
  if (since) {
    // <lastmod> is a day or a full timestamp: compare the day part.
    const changed = entries.filter((e) => e.lastmod && e.lastmod.slice(0, 10) >= since);
    const undated = entries.filter((e) => !e.lastmod).length;
    console.log(`${changed.length} of ${entries.length} sitemap URLs changed on or after ${since}${undated ? ` (skipped ${undated} with no lastmod)` : ""}`);
    urlList = changed.map((e) => e.loc);
    if (!urlList.length) {
      console.log("Nothing to submit.");
      process.exit(0);
    }
  } else {
    urlList = entries.map((e) => e.loc);
  }
}

// IndexNow only accepts URLs on the host the key belongs to.
const foreign = urlList.filter((u) => new URL(u).host !== host);
if (foreign.length) console.warn(`Skipping ${foreign.length} URL(s) that are not on ${host}`);
urlList = [...new Set(urlList.filter((u) => new URL(u).host === host))];
if (!urlList.length) {
  console.error(`No URLs to submit for ${host}.`);
  process.exit(1);
}

if (dryRun) {
  console.log(`Dry run: would submit ${urlList.length} URL(s) for ${host}`);
  for (const u of urlList) console.log(`  ${u}`);
  process.exit(0);
}

// ── The key file must be live first, or IndexNow rejects the request ──

const keyLocation = `${SITE}/${KEY}.txt`;
const keyFile = await fetch(keyLocation, { headers }).then(async (r) => (r.ok ? (await r.text()).trim() : null)).catch(() => null);
if (keyFile !== KEY) {
  console.log(`The IndexNow key file is not live at ${keyLocation}. Nothing was submitted.`);
  console.log("That is expected until the new site is deployed on this host.");
  process.exit(ifLive ? 0 : 1);
}

// ── Submit, up to 10,000 URLs per call ───────────────────────────────

let failed = false;
for (let i = 0; i < urlList.length; i += 10000) {
  const batch = urlList.slice(i, i + 10000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation, urlList: batch }),
  });
  console.log(`IndexNow: ${res.status} for ${batch.length} URL(s)`);
  if (res.status >= 300) failed = true;
}
if (failed) process.exit(1);
