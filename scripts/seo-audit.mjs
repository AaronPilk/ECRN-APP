#!/usr/bin/env node
/**
 * ECRN SEO audit (PILK AI SEO SOP: run-sheet step 1 and the Phase 1 "Check").
 *
 *   node scripts/seo-audit.mjs <baseUrl> [--out docs/seo/audit-YYYY-MM-DD.md]
 *
 *   node scripts/seo-audit.mjs http://localhost:3000
 *   node scripts/seo-audit.mjs https://ecrn.com --out docs/seo/audit-2027-02-20.md
 *
 * What it does, in order:
 *   1. Reads <baseUrl>/sitemap.xml. The sitemap lists https://ecrn.com URLs, so
 *      each one is fetched from <baseUrl> instead. That is what lets the same
 *      command work against a local build, the workers.dev copy and the live site.
 *   2. Fetches every sitemap URL and records: status, final URL, title,
 *      description, canonical, robots tags, H1, structured data, word count,
 *      internal links and images without alt text.
 *   3. Crawls the site from the home page by following links, the way a search
 *      engine does, to get each page's click depth, find orphans (in the
 *      sitemap but not linked from anywhere) and find broken links.
 *   4. Checks robots.txt, llms.txt, llms-full.txt, a made-up URL (must be 404),
 *      the IndexNow key file, and a test fetch as each search and AI crawler.
 *   5. On the live domain only: checks the http and www redirects and HSTS.
 *   6. Writes a markdown report: problems first, then the tables.
 *
 * Options:
 *   --out <file>         Write the report to a file (otherwise it prints).
 *   --site <origin>      The production origin. Default: the origin in the sitemap.
 *   --concurrency <n>    Requests in flight at once. Default 4.
 *   --timeout <ms>       Per request. Default 30000.
 *   --max-pages <n>      Stop the crawl after this many pages. Default 2000.
 *   --no-bots            Skip the per-crawler test fetches.
 *
 * Exit code: 0 = no hard failures, 1 = hard failures, 2 = could not run.
 * Hard failures: a sitemap URL that is not a 200, a missing title, H1 or
 * canonical, a sitemap URL that is not indexable, structured data that does
 * not parse, a broken internal link, an orphan page, and a made-up URL that
 * does not return 404. Everything else is a warning.
 *
 * Plain Node 22, no dependencies. Run it every quarter and after any redesign.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Settings ─────────────────────────────────────────────────────────

/** A normal browser. Cloudflare blocks default script user agents (SOP gotcha). */
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const TITLE_RANGE = [30, 60];
const DESCRIPTION_RANGE = [120, 160];
const MAX_CLICK_DEPTH = 3;
const THIN_PAGE_WORDS = 200;
const MIN_LINKING_PAGES = 3;

/**
 * The SOP's Phase 3 crawlers (same names as lib/seo/crawlers.ts). `ua` is the
 * user agent used for the test fetch. Google-Extended and Applebot-Extended
 * are robots.txt names only: they never fetch pages themselves.
 */
const CRAWLERS = [
  { name: "Googlebot", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { name: "Bingbot", ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
  { name: "Applebot", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)" },
  { name: "OAI-SearchBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot" },
  { name: "ChatGPT-User", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" },
  { name: "GPTBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot" },
  { name: "Claude-SearchBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)" },
  { name: "Claude-User", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)" },
  { name: "ClaudeBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
  { name: "PerplexityBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
  { name: "Perplexity-User", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)" },
  { name: "Google-Extended", ua: null },
  { name: "Applebot-Extended", ua: null },
  { name: "DuckDuckBot", ua: "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)" },
];

/** Links to these are files, not pages: their status is checked, they are not crawled. */
const FILE_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|json|xml|txt|pdf|zip|webmanifest|woff2?|ttf|mp4|webm|mp3)$/i;

// ── Arguments ────────────────────────────────────────────────────────

const USAGE = "Usage: node scripts/seo-audit.mjs <baseUrl> [--out docs/seo/audit-YYYY-MM-DD.md] [--site https://ecrn.com] [--concurrency 4] [--timeout 30000] [--max-pages 2000] [--no-bots]";

function readArguments(argv) {
  const opts = { base: null, out: null, site: null, concurrency: 4, timeout: 30000, maxPages: 2000, bots: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      if (argv[i + 1] === undefined) stop(`${arg} needs a value.\n${USAGE}`);
      return argv[++i];
    };
    if (arg === "--help" || arg === "-h") stop(USAGE, 0);
    else if (arg === "--out") opts.out = value();
    else if (arg === "--site") opts.site = value();
    else if (arg === "--concurrency") opts.concurrency = Math.max(1, Number(value()) || 4);
    else if (arg === "--timeout") opts.timeout = Math.max(1000, Number(value()) || 30000);
    else if (arg === "--max-pages") opts.maxPages = Math.max(1, Number(value()) || 2000);
    else if (arg === "--no-bots") opts.bots = false;
    else if (arg.startsWith("--")) stop(`Unknown option ${arg}.\n${USAGE}`);
    else if (!opts.base) opts.base = arg;
    else stop(`Unexpected argument ${arg}.\n${USAGE}`);
  }
  if (!opts.base) stop(USAGE);
  try {
    opts.base = new URL(opts.base).origin;
    if (opts.site) opts.site = new URL(opts.site).origin;
  } catch {
    stop(`The base URL must be a full URL such as http://localhost:3000 or https://ecrn.com.\n${USAGE}`);
  }
  return opts;
}

function stop(message, code = 2) {
  console.error(message);
  process.exit(code);
}

const opts = readArguments(process.argv.slice(2));
const BASE = opts.base;

// ── Fetching ─────────────────────────────────────────────────────────

/** One request, no redirect following, one retry on a network error. */
async function request(url, ua = BROWSER_UA) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, {
        redirect: "manual",
        headers: { "user-agent": ua, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(opts.timeout),
      });
    } catch (error) {
      if (attempt >= 1) return { failed: error?.cause?.code ?? error?.cause?.errors?.[0]?.code ?? error?.name ?? String(error) };
    }
  }
}

/**
 * Fetch a URL and follow redirects that stay on the audited host (5 at most).
 * Returns the first status, the chain, the final URL and the body when it is text.
 */
async function get(url, ua = BROWSER_UA) {
  const result = { url, status: 0, finalUrl: url, finalStatus: 0, redirects: [], headers: new Headers(), type: "", body: "", error: null };
  let current = url;
  for (let hop = 0; hop <= 5; hop++) {
    const res = await request(current, ua);
    if (res.failed) {
      result.error = res.failed;
      return result;
    }
    if (hop === 0) result.status = res.status;
    result.finalUrl = current;
    result.finalStatus = res.status;
    result.headers = res.headers;
    result.type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, current).toString();
      result.redirects.push({ status: res.status, to: next });
      await res.body?.cancel().catch(() => {});
      if (new URL(next).origin !== BASE) {
        result.finalUrl = next; // left the audited host: do not follow
        return result;
      }
      current = next;
      continue;
    }
    if (/^text\/|xml|json/.test(result.type)) result.body = await res.text().catch(() => "");
    else await res.body?.cancel().catch(() => {});
    return result;
  }
  result.error = "too many redirects";
  return result;
}

/** Run `task` over `items`, a few at a time. */
async function pool(items, task) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(opts.concurrency, queue.length) }, async () => {
    while (queue.length) await task(queue.shift());
  });
  await Promise.all(workers);
}

// ── Reading HTML (no dependencies, so: careful regular expressions) ──

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", middot: "·", copy: "©", rarr: "→" };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, entity) => {
    if (entity[0] !== "#") return ENTITIES[entity.toLowerCase()] ?? whole;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    try {
      return String.fromCodePoint(code);
    } catch {
      return whole;
    }
  });
}

const textOf = (html) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const lengthOf = (text) => [...text].length;

/** Attributes of one tag, lower-cased names, decoded values. */
function attributes(tag) {
  const out = {};
  const inner = tag.replace(/^<\/?[a-zA-Z][^\s>/]*/, "").replace(/\/?>$/, "");
  for (const m of inner.matchAll(/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const name = m[1].toLowerCase();
    if (!(name in out)) out[name] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => attributes(m[0]));

function jsonLdTypes(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => jsonLdTypes(n, out));
  else if (node && typeof node === "object") {
    if (node["@type"]) out.push(...[].concat(node["@type"]));
    if (node["@graph"]) jsonLdTypes(node["@graph"], out);
  }
  return out;
}

/** Everything the audit needs from one HTML page. */
function readPage(html, pageUrl) {
  const headEnd = html.search(/<\/head\s*>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;
  const rest = headEnd >= 0 ? html.slice(headEnd) : "";
  // Scripts, styles, templates and inline SVG are not page text (an SVG can hold its own <title>).
  const visible = (part) => part.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, " ");
  const body = visible(rest);

  const titlesIn = (part) => [...part.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)].map((m) => textOf(m[1]));
  const headTitles = titlesIn(visible(head));
  const bodyTitles = titlesIn(body);

  const metaIn = (part) => tags(part, "meta");
  const headMeta = metaIn(head);
  const bodyMeta = metaIn(body);
  const meta = (key, value) => [...headMeta, ...bodyMeta].find((m) => (m[key] ?? "").toLowerCase() === value)?.content ?? null;

  const isCanonical = (l) => (l.rel ?? "").toLowerCase().split(/\s+/).includes("canonical");
  const headCanonical = tags(head, "link").find(isCanonical);
  const bodyCanonical = tags(body, "link").find(isCanonical);

  const jsonLd = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)].map((m) => {
    try {
      return { ok: true, types: jsonLdTypes(JSON.parse(m[1])) };
    } catch (error) {
      return { ok: false, types: [], error: String(error.message).slice(0, 120) };
    }
  });

  const main = body.match(/<main\b[\s\S]*<\/main\s*>/i)?.[0] ?? body;
  const words = textOf(main).split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

  const links = [];
  for (const a of tags(body, "a")) {
    const href = (a.href ?? "").trim();
    if (!href || href.startsWith("#") || /^(?:mailto|tel|sms|javascript|data|blob):/i.test(href)) continue;
    try {
      links.push(new URL(href, pageUrl));
    } catch {
      // not a URL: ignore
    }
  }

  const images = tags(body, "img");
  const assets = [...tags(head, "link").filter((l) => /stylesheet/i.test(l.rel ?? "")).map((l) => l.href), ...tags(html, "script").map((s) => s.src)].filter(Boolean);

  return {
    title: headTitles[0] ?? bodyTitles[0] ?? null,
    titleCount: headTitles.length + bodyTitles.length,
    description: meta("name", "description"),
    canonical: (headCanonical ?? bodyCanonical)?.href ?? null,
    outsideHead: [
      !headTitles.length && bodyTitles.length ? "title" : null,
      !headMeta.some((m) => (m.name ?? "").toLowerCase() === "description") && meta("name", "description") !== null ? "description" : null,
      !headCanonical && bodyCanonical ? "canonical" : null,
    ].filter(Boolean),
    metaRobots: [meta("name", "robots"), meta("name", "googlebot")].filter(Boolean).join(", ") || null,
    h1: [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map((m) => textOf(m[1])),
    jsonLd,
    words,
    links,
    imageCount: images.length,
    imagesWithoutAlt: images.filter((i) => !("alt" in i)).length,
    ogTitle: meta("property", "og:title"),
    ogImage: meta("property", "og:image"),
    twitterCard: meta("name", "twitter:card"),
    assets,
  };
}

// ── Reading robots.txt (RFC 9309: longest match wins, Allow wins a tie) ──

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let group = null;
  let readingAgents = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const colon = line.indexOf(":");
    if (!line || colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === "user-agent") {
      if (!group || !readingAgents) groups.push((group = { agents: [], rules: [] }));
      group.agents.push(value.toLowerCase());
      readingAgents = true;
      continue;
    }
    readingAgents = false;
    if ((field === "allow" || field === "disallow") && group) group.rules.push({ allow: field === "allow", path: value });
    else if (field === "sitemap") sitemaps.push(value);
  }
  return { groups, sitemaps };
}

/** The rules a crawler obeys: its own group if it is named, otherwise the "*" group. */
function rulesFor(robots, crawler) {
  const own = robots.groups.filter((g) => g.agents.includes(crawler.toLowerCase()));
  const chosen = own.length ? own : robots.groups.filter((g) => g.agents.includes("*"));
  return { named: own.length > 0, rules: chosen.flatMap((g) => g.rules) };
}

function ruleMatches(pattern, path) {
  const anchored = pattern.endsWith("$");
  const source = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`).test(path);
}

function allowedBy(rules, path) {
  let best = { length: -1, allow: true };
  for (const rule of rules) {
    if (!rule.path || !ruleMatches(rule.path, path)) continue;
    if (rule.path.length > best.length || (rule.path.length === best.length && rule.allow)) best = { length: rule.path.length, allow: rule.allow };
  }
  return best.allow;
}

// ── URL helpers ──────────────────────────────────────────────────────

/** "/path?query" with no trailing slash (except the home page) and no #fragment. */
function keyOf(url) {
  const u = new URL(url);
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : "/";
  return `${path || "/"}${u.search}`;
}

const sameUrl = (a, b) => a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
/** Resolve a possibly relative URL against a page on the given origin. */
function absoluteOn(origin, href, key) {
  try {
    return new URL(href, `${origin}${key}`).toString();
  } catch {
    return href;
  }
}
const xml = (text) => text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");

// ── 1. The sitemap ───────────────────────────────────────────────────

let sitemapType = "";

async function readSitemap(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const res = await get(url);
  if (res.finalStatus !== 200 || !res.body) stop(`Could not read ${url} (${res.finalStatus ? `status ${res.finalStatus}` : res.error}). Is the site running at ${BASE}?`);
  sitemapType ||= res.type;
  const entries = [];
  // A sitemap index points at more sitemaps: read each one from the audited host.
  for (const m of res.body.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)) {
    const loc = m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1];
    if (loc) entries.push(...(await readSitemap(`${BASE}${keyOf(xml(loc))}`, seen)));
  }
  for (const m of res.body.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1];
    if (!loc) continue;
    entries.push({
      loc: xml(loc),
      lastmod: m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1] ?? null,
      images: (m[1].match(/<image:loc>/g) ?? []).length,
    });
  }
  return entries;
}

console.error(`Auditing ${BASE} …`);
const sitemap = await readSitemap(`${BASE}/sitemap.xml`);
if (!sitemap.length) stop(`${BASE}/sitemap.xml lists no URLs.`);

/** The production origin: what canonicals and the robots.txt Sitemap line must use. */
const SITE = opts.site ?? new URL(sitemap[0].loc).origin;
const ON_PRODUCTION = BASE === SITE;
const isInternal = (u) => u.origin === BASE || u.origin === SITE;

const robotsRes = await get(`${BASE}/robots.txt`);
const robots = parseRobots(robotsRes.finalStatus === 200 ? robotsRes.body : "");
const everyone = rulesFor(robots, "*").rules;
const blocked = (key) => !allowedBy(everyone, key);

// ── 2 and 3. Fetch every sitemap URL, then crawl from the home page ──

/** key → everything known about that URL. */
const pages = new Map();

async function load(key) {
  if (pages.has(key)) return pages.get(key);
  const page = { key, res: null, data: null, finalKey: key };
  pages.set(key, page);
  page.res = await get(`${BASE}${key}`);
  const res = page.res;
  if (new URL(res.finalUrl).origin === BASE) page.finalKey = keyOf(res.finalUrl);
  if (res.finalStatus === 200 && res.type === "text/html") page.data = readPage(res.body, res.finalUrl);
  res.body = ""; // free the memory
  return page;
}

const sitemapKeys = [...new Set(sitemap.map((e) => keyOf(e.loc)))];
await pool(sitemapKeys, load);
console.error(`  ${sitemapKeys.length} sitemap URLs fetched`);

/** Links on a page, sorted into pages to crawl and things to status-check only. */
function linksOf(page) {
  const crawl = new Set();
  const check = new Set();
  for (const url of page.data?.links ?? []) {
    if (!isInternal(url)) continue;
    const key = keyOf(url);
    if (key === page.key || key === page.finalKey) continue;
    if (key.startsWith("/api/")) continue; // never call API routes
    if (FILE_EXTENSION.test(url.pathname) || blocked(key)) check.add(blocked(key) ? keyOf(`${BASE}${url.pathname}`) : key);
    else crawl.add(key);
  }
  return { crawl: [...crawl], check: [...check] };
}

const depth = new Map([["/", 0]]);
const linkedFrom = new Map(); // key → Set of pages that link to it
const note = (target, source) => (linkedFrom.get(target) ?? linkedFrom.set(target, new Set()).get(target)).add(source);

let frontier = ["/"];
let crawlStopped = false;
while (frontier.length) {
  await pool(frontier, load);
  const next = [];
  for (const key of frontier) {
    const page = pages.get(key);
    if (page.finalKey !== key && !depth.has(page.finalKey)) depth.set(page.finalKey, depth.get(key));
    const { crawl, check } = linksOf(page);
    for (const target of [...crawl, ...check]) note(target, key);
    for (const target of crawl) {
      if (depth.has(target)) continue;
      if (depth.size >= opts.maxPages) {
        crawlStopped = true;
        continue;
      }
      depth.set(target, depth.get(key) + 1);
      next.push(target);
    }
  }
  frontier = next;
}
console.error(`  ${depth.size} pages reached by links from the home page`);

// Sitemap pages the crawl never reached still need their links counted.
for (const key of sitemapKeys) for (const target of [...linksOf(pages.get(key)).crawl, ...linksOf(pages.get(key)).check]) note(target, key);

// Files and private pages that are linked: check they exist, do not crawl them.
const statusOnly = [...linkedFrom.keys()].filter((key) => !pages.has(key));
await pool(statusOnly, async (key) => {
  const res = await get(`${BASE}${key}`);
  pages.set(key, { key, res, data: null, finalKey: key, statusOnly: true });
});

// ── 4. Site files, the 404 test and the crawler test fetches ─────────

const llms = await get(`${BASE}/llms.txt`);
const llmsFull = await get(`${BASE}/llms-full.txt`);
const rss = await get(`${BASE}/blog/rss.xml`);
const missingPath = `/seo-audit-this-page-does-not-exist-${Date.now()}`;
const missing = await get(`${BASE}${missingPath}`);

let indexNow = null;
try {
  const script = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), "indexnow.mjs"), "utf8");
  const keyValue = script.match(/const KEY = "([0-9a-f]{8,128})"/i)?.[1];
  if (keyValue) {
    const res = await get(`${BASE}/${keyValue}.txt`);
    indexNow = { key: keyValue, status: res.finalStatus, matches: res.body.trim() === keyValue };
  }
} catch {
  // scripts/indexnow.mjs not found: skip this check
}

const botFetches = [];
if (opts.bots) {
  for (const crawler of CRAWLERS.filter((c) => c.ua)) {
    const res = await get(`${BASE}/`, crawler.ua);
    const data = res.finalStatus === 200 && res.type === "text/html" ? readPage(res.body, res.finalUrl) : null;
    botFetches.push({ name: crawler.name, status: res.finalStatus || res.error, robotsHeader: res.headers.get("x-robots-tag"), title: data?.title ?? null, outsideHead: data?.outsideHead ?? [] });
  }
}

/** Live domain only: http and www must 301 to the same path on the main host, and HSTS must be sent. */
const hostChecks = [];
if (ON_PRODUCTION && SITE.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(SITE)) {
  const host = new URL(SITE).host;
  const other = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const samples = [`http://${host}/`, `http://${other}/`, `https://${other}/`, `https://${other}/how-it-works?utm_source=test`];
  for (const from of samples) {
    const want = `${SITE}${new URL(from).pathname}${new URL(from).search}`;
    let current = from;
    const hops = [];
    for (let hop = 0; hop < 5; hop++) {
      const res = await request(current);
      if (res.failed) {
        hops.push(String(res.failed));
        break;
      }
      await res.body?.cancel().catch(() => {});
      const location = res.headers.get("location");
      if (!(res.status >= 300 && res.status < 400 && location)) {
        hops.push(String(res.status));
        break;
      }
      hops.push(String(res.status));
      current = new URL(location, current).toString();
    }
    hostChecks.push({ from, want, landed: current, hops, ok: sameUrl(current, want) && hops.at(-1) === "200" && hops.slice(0, -1).every((h) => h === "301" || h === "308") });
  }
}
const hsts = pages.get("/")?.res.headers.get("strict-transport-security") ?? null;

// ── 5. Findings ──────────────────────────────────────────────────────

const failures = [];
const warnings = [];
const passed = [];

/**
 * Record one check. `items` are the problems found: none means it passed.
 * `hard: true` makes the problems count toward exit code 1.
 */
function check({ hard = false, label, help = "", items }) {
  if (!items.length) passed.push(label);
  else (hard ? failures : warnings).push({ label, help, items });
}

/** One row per sitemap URL. */
const rows = sitemap.map((entry) => {
  const key = keyOf(entry.loc);
  const page = pages.get(key);
  const data = page.data;
  const header = page.res.headers.get("x-robots-tag");
  return {
    key,
    entry,
    data,
    status: page.res.status || page.res.error,
    redirected: page.res.redirects.length ? page.res.finalUrl : null,
    header,
    canonicalOk: data?.canonical ? sameUrl(absoluteOn(SITE, data.canonical, key), entry.loc) : false,
    noindexMeta: /noindex/i.test(data?.metaRobots ?? ""),
    noindexHeader: /noindex/i.test(header ?? ""),
    depth: depth.get(key) ?? null,
    inlinks: [...(linkedFrom.get(key) ?? [])].filter((source) => source !== key).length,
    types: (data?.jsonLd ?? []).flatMap((block) => block.types),
  };
});

/** Rows that answered 200 with HTML and no redirect: the only ones worth reading. */
const ok = rows.filter((r) => r.status === 200 && r.data);
const namedCrawlers = CRAWLERS.map((c) => ({ ...c, ...rulesFor(robots, c.name) }));
const outside = (length, [min, max]) => length < min || length > max;
/** Names of the entries whose value is falsy: missing({ "og:title": null }) → "og:title". */
const missingOf = (parts) => Object.entries(parts).filter(([, present]) => !present).map(([name]) => name).join(", ");

/** Pages that share the same title or description. */
function duplicates(field) {
  const groups = new Map(); // lower-cased text → { text as written, pages }
  for (const r of ok) {
    const text = r.data[field];
    if (!text) continue;
    const group = groups.get(text.toLowerCase()) ?? { text, keys: [] };
    group.keys.push(r.key);
    groups.set(text.toLowerCase(), group);
  }
  return [...groups.values()].filter((g) => g.keys.length > 1).map((g) => `"${g.text}" on ${g.keys.join(", ")}`);
}

// Hard failures: each of these is a real defect.

check({
  hard: true,
  label: "Every sitemap URL returns 200",
  help: "The sitemap may list only live, final pages: no redirects, no 404s.",
  items: rows
    .filter((r) => r.status !== 200 || !r.data)
    .map((r) => `${r.key} → ${r.status}${r.redirected ? ` → ${r.redirected}` : ""}${r.status === 200 ? " (not an HTML page)" : ""}`),
});

check({ hard: true, label: "Every page has a `<title>`", items: ok.filter((r) => !r.data.title).map((r) => r.key) });

check({ hard: true, label: "Every page has an H1", items: ok.filter((r) => r.data.h1.length === 0).map((r) => r.key) });

check({
  hard: true,
  label: "Every page has a canonical tag pointing to itself on the main host",
  items: ok.filter((r) => !r.canonicalOk).map((r) => `${r.key} → canonical is ${r.data.canonical ?? "missing"}, expected ${r.entry.loc}`),
});

check({
  hard: true,
  label: "No sitemap URL is noindex",
  help: "A page in the sitemap must be indexable.",
  items: [
    ...ok.filter((r) => r.noindexMeta).map((r) => `${r.key} → meta robots "${r.data.metaRobots}"`),
    // On staging the noindex header is correct, so it only counts on the production host.
    ...(ON_PRODUCTION ? rows.filter((r) => r.noindexHeader).map((r) => `${r.key} → X-Robots-Tag "${r.header}"`) : []),
  ],
});

check({
  hard: true,
  label: "robots.txt does not block any sitemap URL",
  items: [
    ...(robotsRes.finalStatus === 200 ? [] : [`/robots.txt → ${robotsRes.finalStatus || robotsRes.error}`]),
    ...rows.flatMap((r) => {
      const blockedFor = [{ name: "*", rules: everyone }, ...namedCrawlers].filter((c) => !allowedBy(c.rules, r.key)).map((c) => c.name);
      return blockedFor.length ? [`${r.key} is disallowed for ${blockedFor.join(", ")}`] : [];
    }),
  ],
});

const homeAssets = (pages.get("/")?.data?.assets ?? []).flatMap((asset) => {
  try {
    const url = new URL(asset, BASE);
    return url.origin === BASE ? [url.pathname] : [];
  } catch {
    return [];
  }
});
check({
  hard: true,
  label: "robots.txt does not block CSS or JS",
  items: [...new Set(homeAssets)].filter((path) => !allowedBy(rulesFor(robots, "Googlebot").rules, path)).map((path) => `${path} is disallowed`),
});

check({
  hard: true,
  label: "Structured data (JSON-LD) parses on every page",
  items: ok.flatMap((r) => r.data.jsonLd.filter((block) => !block.ok).map((block) => `${r.key} → ${block.error}`)),
});

const isBroken = (res) => Boolean(res) && (res.error || res.finalStatus === 404 || res.finalStatus === 410 || res.finalStatus >= 500);
check({
  hard: true,
  label: "No broken internal links",
  items: [...linkedFrom.entries()]
    .filter(([target]) => isBroken(pages.get(target)?.res))
    .map(([target, sources]) => {
      const res = pages.get(target).res;
      const from = [...sources];
      return `${target} → ${res.finalStatus || res.error}, linked from ${from.slice(0, 5).join(", ")}${from.length > 5 ? ` and ${from.length - 5} more` : ""}`;
    }),
});

// A crawl that stopped at --max-pages has not seen every link, so it cannot call a page an orphan.
if (!crawlStopped) {
  check({
    hard: true,
    label: "No orphan pages (every sitemap URL is reachable by links from the home page)",
    help: "Add a link from a related page, or from an index page such as /blog or /careers.",
    items: rows.filter((r) => r.depth === null).map((r) => r.key),
  });
}

check({
  hard: true,
  label: "A made-up URL returns 404",
  items:
    missing.finalStatus === 404 && !missing.redirects.length
      ? []
      : [`${missingPath} → ${missing.status || missing.error}${missing.redirects.length ? ` → ${missing.finalUrl}` : ""} (must be 404, not 200 and not a redirect)`],
});

if (hostChecks.length) {
  check({
    hard: true,
    label: "http and www redirect to the same path on the main host (301)",
    items: hostChecks.filter((c) => !c.ok).map((c) => `${c.from} → ${c.hops.join(" → ")}, landed on ${c.landed}, expected ${c.want}`),
  });
}

// Warnings: worth fixing, judged case by case.

check({
  label: `Every page is within ${MAX_CLICK_DEPTH} clicks of the home page`,
  items: rows.filter((r) => r.depth !== null && r.depth > MAX_CLICK_DEPTH).map((r) => `${r.key} → ${r.depth} clicks`),
});

check({ label: "Titles are unique", items: duplicates("title") });
check({ label: "Descriptions are unique", items: duplicates("description") });

check({
  label: `Titles are ${TITLE_RANGE[0]} to ${TITLE_RANGE[1]} characters`,
  items: ok.filter((r) => r.data.title && outside(lengthOf(r.data.title), TITLE_RANGE)).map((r) => `${r.key} → ${lengthOf(r.data.title)}: "${r.data.title}"`),
});

check({
  label: `Descriptions are ${DESCRIPTION_RANGE[0]} to ${DESCRIPTION_RANGE[1]} characters`,
  items: ok
    .filter((r) => !r.data.description || outside(lengthOf(r.data.description), DESCRIPTION_RANGE))
    .map((r) => `${r.key} → ${r.data.description ? lengthOf(r.data.description) : "missing"}`),
});

check({
  label: "One H1 per page",
  items: ok.filter((r) => r.data.h1.length > 1).map((r) => `${r.key} → ${r.data.h1.length}: ${r.data.h1.map((h) => `"${h}"`).join(", ")}`),
});

check({
  label: "Title, description and canonical are inside `<head>`",
  help: "Next.js can stream these tags into `<body>` for crawlers it does not know, and crawlers that do not run JavaScript may then miss them. Fix: htmlLimitedBots in next.config.js.",
  items: ok.filter((r) => r.data.outsideHead.length).map((r) => `${r.key} → ${r.data.outsideHead.join(", ")} found in \`<body>\``),
});

check({
  label: "Open Graph and Twitter card tags are present",
  items: ok
    .map((r) => ({ key: r.key, gone: missingOf({ "og:title": r.data.ogTitle, "og:image": r.data.ogImage, "twitter:card": r.data.twitterCard }) }))
    .filter((r) => r.gone)
    .map((r) => `${r.key} → missing ${r.gone}`),
});

check({
  label: "Organization and WebSite data are on every page",
  items: ok
    .map((r) => ({ key: r.key, gone: missingOf({ Organization: r.types.includes("Organization"), WebSite: r.types.includes("WebSite") }) }))
    .filter((r) => r.gone)
    .map((r) => `${r.key} → missing ${r.gone}`),
});

check({
  label: `Pages have at least ${THIN_PAGE_WORDS} words of content`,
  help: "Counted inside `<main>`. Short legal or form pages can be fine: judge each one.",
  items: ok.filter((r) => r.data.words < THIN_PAGE_WORDS).map((r) => `${r.key} → ${r.data.words} words`),
});

check({
  label: "Images have alt text",
  items: ok.filter((r) => r.data.imagesWithoutAlt > 0).map((r) => `${r.key} → ${r.data.imagesWithoutAlt} of ${r.data.imageCount} images have no alt attribute`),
});

check({
  label: `Content pages are linked from at least ${MIN_LINKING_PAGES} other pages`,
  help: "SOP Phase 5: every new page gets 3 or more links from related pages. Job postings are not counted.",
  items: rows.filter((r) => r.key !== "/" && !/^\/jobs\/[^/]+$/.test(r.key) && r.inlinks < MIN_LINKING_PAGES).map((r) => `${r.key} → linked from ${r.inlinks}`),
});

check({
  label: "Every indexable page is in the sitemap",
  help: "Add it to the sitemap, or mark it noindex if it should stay out of search.",
  items: [...depth.keys()]
    .filter((key) => {
      const page = pages.get(key);
      if (sitemapKeys.includes(key) || !page?.data || page.finalKey !== key) return false;
      const canonicalElsewhere = page.data.canonical && !sameUrl(absoluteOn(SITE, page.data.canonical, key), `${SITE}${key}`);
      const noindex = /noindex/i.test(page.data.metaRobots ?? "") || (ON_PRODUCTION && /noindex/i.test(page.res.headers.get("x-robots-tag") ?? ""));
      return !noindex && !canonicalElsewhere;
    })
    .map((key) => `${key} is reachable, indexable and not in the sitemap`),
});

check({
  label: "Internal links point at final URLs, not redirects",
  items: [...linkedFrom.entries()]
    .filter(([target]) => !blocked(target) && pages.get(target)?.res.redirects.length)
    .map(([target, sources]) => `${target} → ${pages.get(target).res.finalUrl}, linked from ${[...sources].slice(0, 3).join(", ")}`),
});

check({
  label: "The sitemap is clean",
  items: [
    ...(sitemap.length !== sitemapKeys.length ? [`${sitemap.length - sitemapKeys.length} duplicate URL(s)`] : []),
    ...sitemap.filter((e) => !e.lastmod).map((e) => `${keyOf(e.loc)} has no lastmod`),
    ...sitemap.filter((e) => e.lastmod && new Date(e.lastmod).getTime() > Date.now() + 864e5).map((e) => `${keyOf(e.loc)} has a lastmod in the future (${e.lastmod})`),
  ],
});

check({
  label: "Each Phase 3 crawler is named and allowed in robots.txt",
  items: [
    ...namedCrawlers.filter((c) => !c.named).map((c) => `${c.name} is not named (it falls under "*")`),
    ...namedCrawlers.filter((c) => !allowedBy(c.rules, "/")).map((c) => `${c.name} is blocked from /`),
    ...(robots.sitemaps.some((s) => sameUrl(s, `${SITE}/sitemap.xml`)) ? [] : [`No "Sitemap: ${SITE}/sitemap.xml" line (found: ${robots.sitemaps.join(", ") || "none"})`]),
  ],
});

if (opts.bots) {
  check({
    label: "Each crawler's test fetch of the home page returns 200",
    help: "A spoofed crawler can be refused by Cloudflare's fake-bot protection even when the real one gets through. Confirm in Cloudflare (AI Crawl Control, and Security → Events) before changing anything.",
    items: botFetches.filter((b) => b.status !== 200).map((b) => `${b.name} → ${b.status}`),
  });
}

if (!ON_PRODUCTION) {
  const exposedFiles = [
    ["/llms.txt", llms],
    ["/llms-full.txt", llmsFull],
  ].filter(([, res]) => res.finalStatus === 200 && !/noindex/i.test(res.headers.get("x-robots-tag") ?? ""));
  check({
    label: "This copy of the site is hidden from search (X-Robots-Tag: noindex)",
    help: `Only ${SITE} should be indexable. Staging and preview hosts must send X-Robots-Tag: noindex.`,
    items: [...rows.filter((r) => r.data && !r.noindexHeader).map((r) => r.key), ...exposedFiles.map(([path]) => `${path} (text file)`)],
  });
}

if (hostChecks.length) check({ label: "HSTS header is sent", items: hsts ? [] : ["No Strict-Transport-Security header on /"] });

const llmsLinks = [...llms.body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => new URL(m[1])).filter(isInternal);
check({
  label: "llms.txt is served and links only to pages in the sitemap",
  items: [
    ...(llms.finalStatus === 200 ? [] : [`/llms.txt → ${llms.finalStatus || llms.error}`]),
    ...(llms.finalStatus === 200 && llms.type !== "text/plain" ? [`/llms.txt is served as ${llms.type}, expected text/plain`] : []),
    ...(llms.finalStatus === 200 && !llms.body.trimStart().startsWith("# ") ? ["/llms.txt does not start with a # title line"] : []),
    ...[...new Set(llmsLinks.map((url) => keyOf(url)))].filter((key) => !FILE_EXTENSION.test(key) && !sitemapKeys.includes(key)).map((key) => `links to ${key}, which is not in the sitemap`),
  ],
});

check({
  label: "llms-full.txt is served",
  items: [
    ...(llmsFull.finalStatus === 200 ? [] : [`/llms-full.txt → ${llmsFull.finalStatus || llmsFull.error}`]),
    ...(llmsFull.finalStatus === 200 && llmsFull.type !== "text/plain" ? [`/llms-full.txt is served as ${llmsFull.type}, expected text/plain`] : []),
  ],
});

if (indexNow) {
  check({
    label: "The IndexNow key file is served",
    items: indexNow.status === 200 && indexNow.matches ? [] : [`/${indexNow.key}.txt → ${indexNow.status}${indexNow.status === 200 ? " but the content is not the key" : ""}`],
  });
}

if (crawlStopped) {
  warnings.push({
    label: "The crawl stopped early",
    help: "Click depth and the orphan check are incomplete in this report.",
    items: [`More than ${opts.maxPages} pages. Raise --max-pages to crawl them all.`],
  });
}

// ── 6. The report ────────────────────────────────────────────────────

const cell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim() || " ";

function table(headers, lines) {
  return [`| ${headers.join(" | ")} |`, `|${headers.map(() => "---").join("|")}|`, ...lines.map((line) => `| ${line.map(cell).join(" | ")} |`)].join("\n");
}

function findings(groups) {
  if (!groups.length) return "None.\n";
  return groups.map((g) => [`**${g.label} (${g.items.length})**`, ...(g.help ? ["", g.help] : []), "", ...g.items.map((item) => `- ${item}`), ""].join("\n")).join("\n");
}

const wordsIn = (text) => text.split(/\s+/).filter(Boolean).length;
const robotsHeaderOf = (res) => res.headers.get("x-robots-tag") ?? "none";
const deepest = Math.max(0, ...rows.map((r) => r.depth ?? 0));
/** Today's date where the script runs, as YYYY-MM-DD. */
const now = new Date();
const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, "0")).join("-");

const siteFiles = [
  ["/robots.txt", robotsRes.finalStatus || robotsRes.error, robotsRes.type, `${robots.groups.length} group(s). Sitemap: ${robots.sitemaps.join(", ") || "none"}`],
  ["/sitemap.xml", 200, sitemapType, `${sitemap.length} URLs, ${sitemap.reduce((n, e) => n + e.images, 0)} image entries`],
  ["/llms.txt", llms.finalStatus || llms.error, llms.type, llms.finalStatus === 200 ? `${wordsIn(llms.body)} words, ${llmsLinks.length} links to this site. X-Robots-Tag: ${robotsHeaderOf(llms)}` : ""],
  ["/llms-full.txt", llmsFull.finalStatus || llmsFull.error, llmsFull.type, llmsFull.finalStatus === 200 ? `${wordsIn(llmsFull.body)} words. X-Robots-Tag: ${robotsHeaderOf(llmsFull)}` : ""],
  ["/blog/rss.xml", rss.finalStatus || rss.error, rss.type, rss.finalStatus === 200 ? `${(rss.body.match(/<item[\s>]|<entry[\s>]/g) ?? []).length} items` : ""],
  ["A made-up URL", missing.status || missing.error, missing.type, "Must be 404."],
  ...(indexNow ? [[`/${indexNow.key}.txt`, indexNow.status, "text/plain", indexNow.matches ? "IndexNow key file, content matches" : "IndexNow key file, content does NOT match"]] : []),
];

const crawlerRows = namedCrawlers.map((c) => {
  const fetched = botFetches.find((b) => b.name === c.name);
  const titleSeen = !fetched ? "" : !fetched.title ? "none" : fetched.outsideHead.includes("title") ? "in body" : "in head";
  return [c.name, c.named ? "yes" : "no", allowedBy(c.rules, "/") ? "yes" : "NO", fetched ? fetched.status : "robots.txt name only", fetched?.robotsHeader ?? "", titleSeen];
});

const signalRows = rows.map((r) => [
  r.key,
  r.status,
  r.redirected ?? "same",
  r.depth ?? (crawlStopped ? "not reached" : "ORPHAN"),
  r.inlinks,
  r.data ? (r.canonicalOk ? "self" : r.data.canonical ?? "MISSING") : "",
  r.data?.metaRobots ?? "none",
  r.header ?? "none",
  (r.entry.lastmod ?? "missing").slice(0, 10),
]);

const onPageRows = rows.map((r) => {
  if (!r.data) return [r.key, "", "", "", "", "", "", "", ""];
  const schema = [...new Set(r.types)].join(", ") || "none";
  return [
    r.key,
    r.data.title ? lengthOf(r.data.title) : "MISSING",
    r.data.description ? lengthOf(r.data.description) : "MISSING",
    r.data.h1.length,
    r.data.h1.join(" / "),
    r.data.jsonLd.some((block) => !block.ok) ? `${schema} (PARSE ERROR)` : schema,
    r.data.words,
    new Set(r.data.links.filter(isInternal).map((url) => keyOf(url))).size,
    `${r.data.imagesWithoutAlt} of ${r.data.imageCount}`,
  ];
});

const report = [
  `# SEO audit: ${BASE}`,
  "",
  `_Run ${today} with \`node scripts/seo-audit.mjs ${BASE}${opts.out ? ` --out ${opts.out}` : ""}\`. Production host: ${SITE}._`,
  "",
  "## Summary",
  "",
  `- Sitemap URLs: ${rows.length}. Pages reached by links from the home page: ${depth.size}. Deepest sitemap page: ${deepest} click${deepest === 1 ? "" : "s"}.`,
  `- **Hard failures: ${failures.length}.** Warnings: ${warnings.length}. Checks passed: ${passed.length}.`,
  ON_PRODUCTION
    ? "- This is the production host, so every sitemap page must be indexable."
    : `- This is not the production host. \`X-Robots-Tag: noindex\` is expected here, and canonicals are checked against ${SITE}.`,
  "",
  "### Hard failures",
  "",
  findings(failures),
  "### Warnings",
  "",
  findings(warnings),
  "### Passed",
  "",
  ...passed.map((label) => `- ${label}`),
  "",
  "## Site files",
  "",
  table(["File", "Status", "Type", "Notes"], siteFiles),
  "",
  ...(opts.bots
    ? [
        "## Crawler access",
        "",
        "What robots.txt says for each crawler, and a test fetch of the home page with that crawler's user agent.",
        "",
        table(["Crawler", "Named in robots.txt", "Allowed on /", "Test fetch", "X-Robots-Tag", "Title seen"], crawlerRows),
        "",
      ]
    : []),
  ...(hostChecks.length
    ? [
        "## Host redirects (live domain)",
        "",
        table(["Request", "Chain", "Landed on", "OK"], hostChecks.map((c) => [c.from, c.hops.join(" → "), c.landed, c.ok ? "yes" : "NO"])),
        "",
        `Strict-Transport-Security: ${hsts ?? "missing"}`,
        "",
      ]
    : []),
  "## Crawl and index signals",
  "",
  table(["Page", "Status", "Final URL", "Clicks from home", "Pages linking in", "Canonical", "Meta robots", "X-Robots-Tag", "Last modified"], signalRows),
  "",
  "## On-page",
  "",
  table(["Page", "Title length", "Description length", "H1 count", "H1", "Structured data", "Words", "Internal links out", "Images without alt"], onPageRows),
  "",
  "## Titles and descriptions",
  "",
  table(["Page", "Title", "Description"], rows.filter((r) => r.data).map((r) => [r.key, r.data.title ?? "MISSING", r.data.description ?? "MISSING"])),
  "",
  "## How to read this",
  "",
  "- **Status** is the first response. A page in the sitemap must be 200 with no redirect.",
  "- **Clicks from home** is the shortest path of links from the home page. ORPHAN means no page links to it.",
  "- **Pages linking in** counts the different pages on this site that link to the page, menus and footer included.",
  "- **Canonical** must be the page's own URL on the production host.",
  `- **Title length** should be ${TITLE_RANGE[0]} to ${TITLE_RANGE[1]} characters and **description length** ${DESCRIPTION_RANGE[0]} to ${DESCRIPTION_RANGE[1]}. The site's own target is tighter: titles 50 to 60, descriptions 140 to 160.`,
  "- **Words** are counted inside `<main>`, so menus and the footer do not inflate the number.",
  "- **Structured data** lists the JSON-LD types found. Check one page of each kind in Google's Rich Results Test before launch.",
  "- This audit reads HTML the way a crawler does. It does not measure speed: run Lighthouse on mobile for that.",
  "",
].join("\n");

if (opts.out) {
  const file = resolve(process.cwd(), opts.out);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, report);
  console.error(`Report written to ${opts.out}`);
} else {
  console.log(report);
}
console.error(`Hard failures: ${failures.length}. Warnings: ${warnings.length}. Passed: ${passed.length}.`);
for (const group of failures) console.error(`  FAIL ${group.label}: ${group.items.length}`);
process.exitCode = failures.length ? 1 : 0;
