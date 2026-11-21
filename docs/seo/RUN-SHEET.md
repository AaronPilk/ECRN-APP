# ECRN run-sheet for the PILK AI SEO SOP

_Filled in Nov 20, 2026. Main host: **https://ecrn.com** (bare). The site runs at a `workers.dev` address for now, where it is hidden from search on purpose._

This is the SOP's "Today run-sheet" and every phase, filled in for ECRN. It says what is finished, what is waiting, and who has to move.

**O** = owner (you). **C** = Claude.

## What the status words mean

| Status | Meaning |
|---|---|
| **Done** | Finished and checked, in the code or on the copy that is deployed now. |
| **Done in code** | Written and checked in the code. It takes effect, or can only be proven, once ecrn.com points at this site. |
| **Waiting on owner** | Needs an account, a sign-in, an approval or a decision from you. |
| **Later** | Claude's job, but an earlier step has to happen first. |
| **Not applicable** | Does not apply to ECRN. The reason is given. |

Nothing is marked Done unless it was checked in this repo or on the deployed copy. Where a check needs the live domain, it is not marked Done.

## Today run-sheet (the 13 steps)

| # | Step | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|---|
| 1 | Audit the site: every sitemap URL, title, description, canonical, robots tag, H1, structured data, word count | C | **Done** | The audit is now a tool: `node scripts/seo-audit.mjs <url>`. First report saved: `docs/seo/audit-2026-11-20-before.md` (the copy deployed before this round: 16 pages, 0 hard failures, 6 warnings). The old one-page ecrn.com was checked by hand: see "Where ecrn.com stands today" below. | Nothing. |
| 2 | Move DNS to Cloudflare, one main host, 301 the other with path and query kept, force HTTPS | O approves, C or O clicks | **Waiting on owner** | The code side is ready: `middleware.ts` sends `www` to the bare domain with a 301 and keeps path and query, and sends HSTS on ecrn.com. It cannot be tested until the domain points here. Today `https://www.ecrn.com` fails with an SSL error. | Sign in to the registrar and to Cloudflare, then say: "move ecrn.com's DNS to Cloudflare". |
| 3 | Fix the foundation (robots, sitemap, canonicals, titles, structured data, staging noindex, llms.txt) and deploy | C | **Done in code** | Each item is listed under Phase 1 with its file. Type-check: 0 errors. The deploy and the re-run of the audit on the new build are the lead's last step. | Nothing. |
| 4 | Google Search Console: add the property, verify, submit the sitemap | C (O if a sign-in screen appears) | **Waiting on owner** | The slot for the code exists: `SITE_VERIFICATION.google` in `lib/site.ts`. It needs step 2 first. | Open Search Console signed in to the Google account that should own ecrn.com for years (a work address). |
| 5 | Request indexing for the 10 to 12 most important pages | C | **Later** | The order is set: see "Indexing order" below. Needs step 4. | Nothing. |
| 6 | Bing Webmaster Tools: add the site, verify, submit the sitemap | O + C | **Waiting on owner** | Slot: `SITE_VERIFICATION.bing` in `lib/site.ts`. | Sign in to Bing Webmaster Tools (Google sign-in works). Approve "Import from Google Search Console", or tell Claude to verify by meta tag. |
| 7a | IndexNow: key file on the site | C | **Done** | `public/b23fe234623ea350ce5b3117a291746d.txt`. The audit fetched it on the deployed copy: status 200, content matches. | Nothing. |
| 7b | IndexNow: submit all URLs | C | **Later** | `scripts/indexnow.mjs` is ready and tested against a mock site (nothing was sent to IndexNow). The first real run must wait for ecrn.com. | Nothing. |
| 7c | IndexNow: send changed pages on every deploy | C | **Later** | The script has `--since <date>` and `--if-live` for exactly this. The deploy step itself is not wired yet (see "Open items in the code"). | Nothing. |
| 7d | Cloudflare Crawler Hints on | C | **Later** | Needs the Cloudflare zone from step 2. Free plan. | Nothing. |
| 8a | AI crawlers: robots.txt allows every bot in Phase 3 | C | **Done in code** | `app/robots.ts` and `lib/seo/crawlers.ts` name all 14. The audit test-fetched the deployed copy as each crawler: all 200. | Nothing. |
| 8b | AI crawlers: Cloudflare AI Crawl Control allows them | C | **Later** | Needs the Cloudflare zone from step 2. | Tell Claude if you do not want ECRN's pages used for AI training. The default is to allow it. |
| 9 | Local listings (Google Business Profile, Bing Places, Apple Business) | O creates, C fills | **Not applicable** | ECRN has no walk-in location and meets no customers in person. Google's eligibility rules exclude online-only brands. Local listings belong to Delta Construction Partners. See `LISTINGS-AND-PROFILES.md`. | Decide with Delta whether Delta's own listings should mention ECRN. |
| 10 | Brand profiles and citations: claim handles, add them to `sameAs`, submit to directories | O creates, C writes copy | **Waiting on owner** | The copy, the exact name and URL, and the tracker are in `LISTINGS-AND-PROFILES.md`. `BRAND.sameAs` in `lib/site.ts` is empty and ready. | Create the six profiles in the order listed there and send Claude the URLs. |
| 11 | Analytics: confirm it works, link Search Console | C | **Waiting on owner** | There is no analytics in the code today (checked). The privacy policy says ECRN has no ad SDKs and no cross-site tracking, so the policy must be updated in the same deploy. | Choose one: Cloudflare Web Analytics (no cookies, simplest) or GA4. |
| 12 | Content plan: keyword list, first pages, ship them | C | **Done in code** | `CONTENT-PLAN.md`. The first pages are written: 12 blog posts, 6 career pages and a 59-term glossary. They enter the sitemap and llms files on their own. They go live with the next deploy. | Ask one Delta recruiter to read each post once. See Phase 5. |
| 13a | Write it down: SEO README and documents in the repo | C | **Done** | `docs/seo/README.md` is the index. Committing is the lead's last step. | Nothing. |
| 13b | Project memory and a reminder for the next day's indexing requests | C | **Later** | The reminder only makes sense once step 4 is done. The lead saves the state to project memory. | Nothing. |

### Indexing order (for step 5)

Search Console allows about 10 to 12 requests a day. We hit the limit at 11 on other sites.

| Day | Pages |
|---|---|
| 1 | `/`, `/referral-rewards`, `/how-it-works`, `/jobs`, `/careers`, `/hire`, `/blog`, `/blog/is-ecrn-legit`, `/blog/how-construction-referral-bonuses-work`, `/careers/electrical-project-manager`, `/careers/electrical-superintendent` |
| 2 | `/about`, `/faq`, the other four career pages, `/blog/electrical-project-manager-salary`, `/blog/electrician-salary-by-state`, `/blog/electrical-foreman-vs-superintendent`, `/blog/recruiter-vs-job-board-vs-referral-network`, `/glossary` |
| 3 | The remaining six posts, then real job pages |

### Where ecrn.com stands today

Read on Nov 20, 2026, before this site replaces it.

| Thing | What was found |
|---|---|
| ecrn.com | One page with `#about`, `#how-it-works`, `#faq` and `#join` anchors. No meta description. `/robots.txt` and `/sitemap.xml` both return 404. So there are no old URLs to redirect: anchors do not need redirects. `http://` already redirects to `https://`. |
| www.ecrn.com | Broken. `http://www.ecrn.com` redirects to `https://www.ecrn.com`, which fails with an SSL error. Anyone who types `www` gets a browser warning. Step 2 fixes it. |
| A second copy | The same page is public at `ecrn-website-chi6v.kinsta.page`, with no `noindex`, and it shows up in web search. It is a duplicate that competes with ecrn.com. |
| goecrn.com | A separate ECRN-branded page (a creator casting call). It is not this site. |
| deltaecrn.com | The old page names this domain as its contact. It answers with an empty page. |
| Meta tag | The old page carries a Facebook domain verification tag. The same code is stored in `SITE_VERIFICATION.facebook` so the verification survives the move. |
| Delta's site | deltaconstructionpartners.com already carries Search Console and Bing verification tags, so a Google account for this already exists at Delta. Its home page does not link to ecrn.com. |

## Phase 1: Technical foundation

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| One host: bare domain is the main host, everything else 301s to it with path and query | C + O | **Done in code** | `middleware.ts`: `www.ecrn.com` goes to `ecrn.com` with a 301, path and query kept. The middleware skips files such as `.txt`, `.xml` and images, so the Cloudflare Redirect Rule is still needed. The audit script tests `http://`, `https://`, bare, `www` and a deep path with `?utm_source=test` by itself when it runs on ecrn.com. | Approve the DNS move (step 2). |
| HTTPS everywhere: Always Use HTTPS, SSL Full (strict), HSTS | C + O | **Done in code** for HSTS. **Later** for the two Cloudflare settings. | `middleware.ts` sends `Strict-Transport-Security` on ecrn.com only. | Approve the DNS move (step 2). |
| robots.txt: allow everything public, block only private paths, list the sitemap, never block CSS or JS | C | **Done in code** | `app/robots.ts`. Rendered with Next's own code and read: 14 crawlers named plus a catch-all, 18 private paths, `Sitemap: https://ecrn.com/sitemap.xml`, nothing under `/_next/`. `/r/` keeps its slash, so `/referral-rewards` is open. `/blog`, `/careers` and `/glossary` are open. The audit fails if any sitemap URL is caught by a rule. | Nothing. |
| Sitemap: every indexable page and nothing else, real dates, image entries | C | **Done in code** | `app/sitemap.ts` and `lib/seo/pages.ts`. Today it builds 37 pages plus the open jobs: 10 static pages, 3 index pages, 6 career pages, 6 blog categories, 12 posts. 25 image entries, each for a photo file that exists in `public/img`. Dates come from each page's own data, never "now". | Nothing. |
| Canonical tag on every page, pointing to itself on the main host | C | **Done in code** | `pageMeta()` in `lib/site.ts`. Audit of the deployed copy: 16 of 16 pages point to themselves on ecrn.com. The blog, career and glossary pages use the same helper (read in the code). | Nothing. |
| Titles and descriptions: unique, 50 to 60 and 140 to 160 characters | C | **Done in code**, with gaps | Posts and career pages: titles 52 to 59, descriptions 149 to 159 (measured from the data). No duplicates on the deployed copy. Gaps: `/support` and `/privacy` titles are 21 characters, and long job titles pass 60. See "Open items in the code". | Nothing. |
| One H1 per page, headings in order | C | **Done in code** | Audit of the deployed copy: every page has exactly one H1. The new templates each render one (read in the code). The lead's audit of the final build is the proof. | Nothing. |
| Open Graph and Twitter card tags with a 1200×630 image | C | **Done in code** | `pageMeta()`. `public/og.jpg` is 1200×630 (measured). Posts and career pages use their own `-og.jpg`. Audit of the deployed copy: present on all 16 pages. | Nothing. |
| Structured data: Organization and WebSite on every page, then the type each page really is | C | **Done in code**, with gaps | Organization and WebSite: `app/(site)/layout.tsx`. Page types in the code: FAQPage, BreadcrumbList, JobPosting, BlogPosting, Blog, CollectionPage, Occupation, ItemList, DefinedTermSet. Audit of the deployed copy: every block parses. Gaps: job pages lack WebSite, the logo is white, and JobPosting needs three fixes. See "Open items in the code". | Nothing. |
| Check with Google's Rich Results Test and the Schema.org validator | C | **Later** | Needs a public URL of the new build. Pages to test: a job, a post, a career page, `/faq`, `/glossary`. | Nothing. |
| Hide staging and preview copies | C + O | **Done** for pages. Gaps for files and for the old copy. | The deployed `workers.dev` copy sends `X-Robots-Tag: noindex, nofollow` on every page (audit, all 16). Gap 1: images, `.txt` and `.xml` files on `workers.dev` do not carry the header, because the middleware skips them. Gap 2: the old copy at `ecrn-website-chi6v.kinsta.page` is public and indexable. | Ask whoever runs the old site's hosting (Kinsta) to delete that copy or password-protect it. |
| llms.txt at the root, llms-full.txt with the full detail | C | **Done in code** | `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts`, built by `lib/seo/llms.ts` from the same data as the pages. Output read line by line: 12 posts, 6 career pages, 59 glossary terms, every FAQ. | Nothing. |
| Real 404s | C | **Done** | The deployed copy returns 404 for a made-up URL and for a job id that does not exist. A closed job is hidden from visitors by a database rule (`jobs: public read`), so it returns the same 404. The audit tests a made-up URL on every run. | Nothing. |
| Speed and Core Web Vitals: Lighthouse on mobile | C | **Later** | Not measured. Pages to test: `/`, `/jobs`, a job, a post, a career page. One problem is already known: scripts, styles and images are served with no browser caching (measured: `max-age=0`). See "Open items in the code". | Nothing. |
| Mobile: no sideways scroll at 360 px, 44 px tap targets | C | **Later** | This is the site builder's work and the lead's screenshot check. It was not checked in this pass. | Nothing. |
| Internal links: every page within 3 clicks, descriptive link text, no orphans | C | **Done in code** | Deployed copy: deepest page is 2 clicks, no orphans, no broken links. New pages: the header links Careers and Blog, the footer links Blog, Career guides and Glossary (`components/site/SiteChrome.tsx`). Every post and career page has at least 4 links in from other content (measured from the data). The lead's audit of the final build is the proof. | Nothing. |
| Languages: hreflang | C | **Not applicable** | One language. `<html lang="en">`. | Nothing. |
| Adult or regulated sites | C | **Not applicable** | No adult content. No license number or "licensed" claim appears anywhere on the site. | Nothing. |
| Check: re-run the audit and Lighthouse, every row passes | C | **Later** | `node scripts/seo-audit.mjs <url of the new build> --out docs/seo/audit-YYYY-MM-DD.md` | Nothing. |

## Phase 2: Search engines and fast indexing

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Google Search Console: URL-prefix property by meta tag, Domain property by DNS TXT, submit `sitemap.xml` | C (O adds the TXT if Claude is blocked) | **Waiting on owner** | Code slot: `SITE_VERIFICATION.google`. | Be signed in to the right Google account. Check the address under the avatar first: a property under the wrong account is slow to undo. |
| Google: request indexing | C | **Later** | Order is in "Indexing order" above. | Nothing. |
| Google: add the brand's Instagram, TikTok, X and YouTube in Search Console | O approves | **Later** | Needs the profiles from step 10. | Approve when Claude asks. |
| Bing Webmaster Tools | O + C | **Waiting on owner** | Code slot: `SITE_VERIFICATION.bing`. Bing also feeds Copilot, DuckDuckGo and Yahoo. | Sign in once. |
| IndexNow: 32-character key at `/<key>.txt`, post all sitemap URLs, send only changed pages after a deploy | C | **Done** for the key and the script. **Later** for the first submission. | `public/b23fe234623ea350ce5b3117a291746d.txt`, `scripts/indexnow.mjs`, `npm run indexnow`. | Nothing. |
| Cloudflare Crawler Hints | C | **Later** | Caching, Configuration, Crawler Hints. It reports pages Cloudflare has cached. ECRN's pages are not cached at the edge today (measured: `no-store`), so our own IndexNow script stays the main route. | Nothing. |
| Yandex Webmaster | O + C | **Not applicable** | No Russian or Turkish audience. IndexNow already reaches Yandex. | Nothing. |
| Naver Search Advisor | O + C | **Not applicable** | No Korean audience. | Nothing. |
| Brave Search | none | **Done in code** | There is nothing to submit. Brave uses its own crawler, and robots.txt allows every bot. Links earn the rest. | Nothing. |
| Things to skip: Google's sitemap ping, the Indexing API for normal pages, paid indexing services | none | **Not applicable** | None are used. One exception for later: Google does allow the Indexing API for job posting pages. It needs a Google Cloud service account and your OK. | Nothing now. |

## Phase 3: AI answer engines

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Bots allowed in robots.txt | C | **Done in code** | All 14 names from the SOP table: Googlebot, Bingbot, Applebot, OAI-SearchBot, ChatGPT-User, GPTBot, Claude-SearchBot, Claude-User, ClaudeBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, DuckDuckBot. | Nothing. |
| Cloudflare AI Crawl Control set to allow Search, Agents and Training. Bot Preference Sync off. Bot Fight Mode off for verified bots. | C | **Later** | Needs the Cloudflare zone. Cloudflare's own setting can override robots.txt, so it is checked there too. | Say so if you want training bots blocked. |
| Test fetch as each bot, expect 200 | C | **Done in code** | Built into the audit ("Crawler access" table). Deployed copy: all 200. Must be repeated on ecrn.com, because that is where Cloudflare's rules apply. | Nothing. |
| llms.txt and llms-full.txt linking the key pages with a one-line answer each | C | **Done in code** | See Phase 1. Every key page, career page and post is listed with a one-line answer. | Nothing. |
| Answer-first pages: two-sentence answer on top, H2 questions, short paragraphs, tables, real numbers and dates, a named author | C | **Done in code** | Every post and career page has an `answer` shown first. Static pages open with the answer in the hero. Byline: ECRN Editorial Team, with published and updated dates. | Nothing. |
| FAQ blocks shown on the page and matched by FAQPage data | C | **Done in code** | On each page the visible list and the data come from the same array, so they cannot differ: home, how it works, referral rewards, FAQ, careers, each career page, each post. | Nothing. |
| Same facts everywhere: name, description, founder, address, phone | C + O | **Done** on the site. **Waiting on owner** off the site. | One source on the site: `lib/site.ts`. The copy to paste elsewhere is in `LISTINGS-AND-PROFILES.md`. Off-site mismatches found today: the old page says "deltaecrn.com", and goecrn.com is a different page. | Decide what happens to deltaecrn.com and goecrn.com. |
| `sameAs` links to every profile in the Organization data | C | **Waiting on owner** | `BRAND.sameAs` in `lib/site.ts` is empty. Delta's three profile links in the data were checked against Delta's own footer today: they match. | Send the profile URLs as you create them. |
| Entity profiles: LinkedIn company page, Crunchbase | O creates, C writes | **Waiting on owner** | Copy is ready. | Create them. LinkedIn first. |
| Wikidata | none | **Not applicable** | ECRN has no independent press coverage yet, so it does not meet Wikidata's notability rules. Never fake it. Revisit after real coverage. | Nothing. |
| Track it: Bing AI Performance monthly, and the 10-question AI answer test | C | **Done** for the test sheet. **Later** for the first run. | `AI-ANSWER-TEST.md`. The first run is 2 to 4 weeks after launch. | Nothing. |

## Phase 4: Local and business listings

**Not applicable to ECRN.** The SOP says to skip this phase for online-only sites, and Google penalizes fake addresses. ECRN is a network and an app. It has no office of its own that customers visit. Every row below belongs to Delta Construction Partners, the firm that does the recruiting, and is Delta's call.

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Google Business Profile | O | **Not applicable** | Google's eligibility rule excludes online-only brands. | Nothing for ECRN. |
| Bing Places for Business | O | **Not applicable** | Follows the Google profile. | Nothing for ECRN. |
| Apple Business | O | **Not applicable** | Maps needs a walk-in location. The brand-only setup (Branded Mail, caller ID) needs the legal entity, which is Delta. | Nothing for ECRN. |
| Yelp, BBB, Facebook page, Nextdoor | O | **Not applicable** for Yelp, BBB and Nextdoor. The Facebook page is a brand profile: see step 10. | Same reason. | Nothing for ECRN. |
| Industry directories | O creates, C writes | **Waiting on owner** | These are not local listings. They are in the tracker in `LISTINGS-AND-PROFILES.md`. | Approve a named batch when Claude proposes one. |
| Data aggregators (Data Axle, Foursquare, Localeze) | O | **Not applicable** | They carry name, address and phone. ECRN has no address or phone of its own. | Nothing. |
| The weekly Google Business Profile routine | O + C | **Not applicable** | No profile. | Nothing. |
| Copy the competitor ranking above you on Maps | C | **Not applicable** | No profile. | Nothing. |

One thing Delta can do that helps ECRN: mention ECRN, with a link to ecrn.com, on Delta's own website and profiles.

## Phase 5: Content that ranks

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Searches from Search Console (positions 8 to 30) | C | **Later** | Needs 2 to 4 weeks of data after launch. | Nothing. |
| Searches from Bing keyword research | C | **Later** | Needs step 6. | Nothing. |
| Searches from autocomplete, "People also ask", related searches | C | **Done** | `CONTENT-PLAN.md`, researched Nov 20, 2026. No search volumes were invented: the plan records what ranks and what people ask. | Nothing. |
| Customer questions from sales calls, reviews, emails, support | O | **Waiting on owner** | Nobody has given these yet. They are the best source there is. | Ask Delta's recruiters for the 20 questions they hear most from candidates and from contractors. |
| Competitors' top pages | C | **Done** | `CONTENT-PLAN.md`, section "Who ranks today". | Nothing. |
| Money pages | C | **Done in code** | `/referral-rewards`, `/jobs`, `/hire`, and six career pages at `/careers/<role>`. | Nothing. |
| Entity pages | C | **Done in code**. **Waiting on owner** for people. | `/about` and `/blog/is-ecrn-legit`. There are no team bios, because no names were given for the site. | Decide whether named Delta recruiters should appear on ECRN. |
| Comparison pages | C | **Done in code** | `/blog/recruiter-vs-job-board-vs-referral-network`, `/blog/electrical-foreman-vs-superintendent`. | Nothing. |
| Answer guides | C | **Done in code** | The other ten posts. See the page map in `CONTENT-PLAN.md`. | Nothing. |
| Data-driven lists from data we hold | C | **Later** | Posts use public data (BLS, Census) with sources. Lists from ECRN's own data need real placement numbers from Delta. | Share placement data when Delta is ready. |
| Rule: no mass-produced filler. A person who knows the business checks every fact. | O | **Waiting on owner** | Each post lists its sources on the page (3 to 15 per post, counted from the data), and the lead's fact-check is still to come. No person at Delta has reviewed them yet, so no post names a reviewer. | Have one Delta recruiter read each post. Then Claude adds "Reviewed by" with the name and role. |
| Rule: no doorway pages | C | **Done** | There are no city pages. `CONTENT-PLAN.md` says when one is allowed. | Nothing. |
| Rule: real authorship and dates, refresh top pages each quarter | C | **Done in code** | Author, published and updated dates on every post. Quarterly refresh is in Phase 8. | Nothing. |
| Rule: every new page gets 3 or more links from related pages and links to its money page | C | **Done in code** | Measured from the data: every post and career page has 4 to 9 content links in. One post links to no indexable money page. See "Open items in the code". | Nothing. |
| Pace: 2 to 4 strong pages a week | C | **Later** | The next 16 pages are chosen and ordered in `CONTENT-PLAN.md`. | Nothing. |

## Phase 6: Authority and links

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Brand profiles, each linking to the site and added to `sameAs` | O creates, C writes | **Waiting on owner** | `LISTINGS-AND-PROFILES.md`. | Create them. |
| Links from owners, partners and team: bios, email signatures, other sites you own | O | **Waiting on owner** | Delta's home page does not link to ecrn.com today. A link from the parent company's own site is the strongest link ECRN can get on day one. | Ask Delta to link to ecrn.com from its site, and add ecrn.com to recruiter email signatures and LinkedIn bios. |
| Everything you already publish points to the right page | O | **Waiting on owner** | goecrn.com and the social bios. | Point them at ecrn.com. Use a separate tracking link per source so bio traffic does not blur the numbers. |
| Launch and listing sites for apps | O creates, C writes | **Later** | Only after the iPhone and Android apps are public. Fit is low: these sites reach founders, not electricians. | Nothing now. |
| The free dofollow list run | C researches, O approves | **Later** | The tracker is started. Claude submits only after you OK a named batch, 10 to 15 a week. | Approve batches when asked. |
| Earned links: journalist requests, trade associations, unlinked mentions, linkable assets | C + O | **Later** | The salary-by-state table and the shortage statistics page are the first linkable assets. Journalist answers need a named Delta expert. | Name one Delta person who can be quoted. |
| Never: bought links, link networks, profile spam, link swaps at scale | all | **Done** | None are used. None will be. | Nothing. |

## Phase 7: Measurement

| Item | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Analytics in place, linked to Search Console, team visits and bots kept out | C | **Waiting on owner** | No analytics in the code. The admin dashboard already counts sign-ups and where they came from, but not visits or search. | Choose the tool (step 11). |
| Conversions defined and reported by channel | C | **Later** | The four that matter: account created, referral submitted, job application sent, employer form sent. | Nothing. |
| Microsoft Clarity | C | **Not applicable** | Optional in the SOP. It needs a cookie banner and a policy change. Not now. | Nothing. |
| Rank tracking for 20 to 50 target searches | C | **Later** | The target searches are the "search it targets" column in `CONTENT-PLAN.md`. Search Console's average position is enough to start. | Nothing. |
| Monthly numbers and the one-page report | C | **Done** for the template. **Later** for the first report. | `MONTHLY-REPORT-TEMPLATE.md`. | Nothing. |

## Phase 8: Ongoing cadence

Nothing here can start before launch. All rows are **Later**.

| When | Task | Who | What makes it possible |
|---|---|---|---|
| Every deploy | Changed pages go out by IndexNow. New pages land in the sitemap. | Automatic | The sitemap part is already automatic. The IndexNow part needs the deploy step wired: `node scripts/indexnow.mjs --since <date of the last deploy> --if-live`. |
| Daily, first week | Request indexing for the next 10 to 12 pages | C | Search Console (step 4). |
| Weekly | Publish 2 to 4 new or refreshed pages. Answer 3 to 5 journalist requests. Check Search Console for new errors. | C + O | The backlog in `CONTENT-PLAN.md`. The Google Business Profile part does not apply. |
| Monthly | One-page report. AI answer test. Rewrite the title and description of the 3 pages with the most impressions and the lowest click-through. Fix broken links. Add links to new pages. | C | `MONTHLY-REPORT-TEMPLATE.md`, `AI-ANSWER-TEST.md`, `node scripts/seo-audit.mjs https://ecrn.com`. |
| Quarterly | Update the top 10 pages with fresh facts and dates. Re-run the full audit and Lighthouse. Check the name and URL on every profile. Review the keyword list. | C | BLS usually publishes new wage data in spring: the pay pages must be updated then. Bump the page's date in its data, or in `STATIC_PAGE_DATES` for static pages. |
| After any redesign or URL change | 301 every old URL, re-submit the sitemap, re-check redirects, watch the Pages report for two weeks | C | The audit lists every URL before and after. |

## Added 16 Nov 2026: priority order

| Tier | Work | Status | Evidence |
|---|---|---|---|
| S | Crawl and indexing: every "not indexed" group in Search Console is deliberate or fixed | **Later** | Needs Search Console. What is deliberately not indexed is already decided: the app, the auth screens, `/api`, `/r/` invite redirects, `/hire/thanks`. They are blocked or `noindex`, and none is in the sitemap. |
| S | Internal links: within 3 clicks, nothing orphaned, new pages linked from older ones | **Done in code** | The audit computes click depth, orphans and the number of pages linking in, and fails on orphans and broken links. |
| A | Mobile: every key page works on a phone | **Later** | Not checked in this pass. |
| B | Schema: only what the page shows. FAQPage data equals the FAQs on the page. | **Done in code** | Same array feeds both on every page. |
| C | Speed: fix only what is slow on a phone | **Later** | One fix is already known: browser caching for scripts, styles and images. |
| D | Sitemap, HTTPS | **Done in code** for the sitemap and HSTS. **Later** for the Cloudflare switches. | See Phase 1. |
| F | llms.txt: keep it accurate, spend no time on it | **Done in code** | It is generated from the site's own data on every build, so it cannot go stale by hand. |

## Added 16 Nov 2026: the four plays

| Play | Who | Status | Evidence | What you need to do |
|---|---|---|---|---|
| Internal links with a `site:` search | C | **Later** | Google must index the site first. Until then the audit's "Pages linking in" column does the same job. | Nothing. |
| Objection pages from Reddit ("worth it", "scam", "waste of money") | C | **Done in code** for two. **Later** for more. | `/blog/is-ecrn-legit` and `/blog/are-construction-recruiters-worth-it`. Each has one heading per objection and a section on when it is not the right fit. Next ones are in `CONTENT-PLAN.md`. | Nothing. |
| Free .gov listing: SBA Small Business Search through SAM.gov | O | **Not applicable** to ECRN | SAM.gov registers a legal entity with an EIN and bank details. ECRN is an initiative of Delta, so this would be Delta's registration and Delta's decision. Never pay anyone for it. | Raise it with Delta if wanted. |
| Directory rules from the Klint list | C | **Done** | Applied in `LISTINGS-AND-PROFILES.md`: taglines written as the search to win, followed links first, no paid listings, no badge swaps without your say. | Nothing. |

## The SOP's gotchas, applied to ECRN

| Gotcha | What it means here |
|---|---|
| Registrar forwarding drops paths | Use a Cloudflare Redirect Rule for `www`, never the registrar's forwarding. |
| Old DNS answers for an hour | Do the switch outside business hours. Re-test after an hour. |
| Claude blocked on DNS changes | You say the exact instruction again, or click it with Claude's steps. |
| Google and Microsoft sign-in screens | Claude cannot touch them. Verify by meta tag, or you click through. |
| Check the Google account before every Google action | Chrome can have several Google accounts signed in. Read the address under the avatar first, every time. |
| Staging copy indexable | Two here: the old copy on `kinsta.page`, and files on `workers.dev`. Both are listed above. |
| Cloudflare's AI crawler policy can override robots.txt | Check AI Crawl Control on the day the zone is created, then run the audit and read the "Crawler access" table. |
| `www` returning 522 | Fix with a Single Redirect: `https://www.ecrn.com/*` to `https://ecrn.com/${1}`, 301, keep the query string. Turn on Always Use HTTPS first. |
| Do not add a domain redirect before the code deploy | Deploy this site on ecrn.com first. Only then redirect deltaecrn.com or any other domain to it. |
| Cloudflare Web Analytics automatic setup | Use the manual snippet on the public pages only, never inside the signed-in app. |
| The privacy policy must match the analytics | The policy says no tracking. Change both in one deploy. |
| Licensing for a regulated business | The site makes no license claim. Keep it that way unless Delta confirms one against the regulator's public record. |
| No AI-generated or stock photos on a Business Profile | The site's photos are generated for ECRN and are labeled illustrative in the code. They must never go on a Google Business Profile. |

## Open items in the code

These are not yours. They are for Claude, and most sit in files the SEO pass was not allowed to edit. Each one is small.

| # | Item | Why it matters |
|---|---|---|
| 1 | The public job board holds six starter jobs from the first database seed. | Google's job posting rules forbid postings for jobs that do not exist, and can remove a site from job results. Every public job must be a real, open Delta role before ecrn.com goes live. This one needs you: see "Waiting on you". |
| 2 | Add the verification slot to the root layout: `verification: siteVerification()` in `app/layout.tsx`. | Without it the Search Console and Bing codes have nowhere to render. |
| 3 | Add `public/_headers`: long browser caching for `/_next/static/*` and `/img/*`, and `X-Robots-Tag: noindex` for the `workers.dev` host. Also let the middleware run for `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml` and `/blog/rss.xml` (its matcher skips every `.txt` and `.xml`). | Measured today: every script, style and image is re-checked on every page view. Files on `workers.dev` can be indexed, and those five routes get neither the staging `noindex` nor the `www` redirect. |
| 4 | Set `htmlLimitedBots: /.*/` in `next.config.js`. | Measured today: two job pages delivered their title, description and canonical inside `<body>` (see the saved audit). Most AI crawlers do not run JavaScript and can miss them there. |
| 5 | JobPosting data in `app/jobs/[id]/page.tsx`: use the name "confidential" when the client is confidential, drop the made-up `validThrough`, and take the data off any job that is not taking applications (check what "paused" means). | All three are in Google's own job posting rules. |
| 6 | Job page titles and descriptions are cut with `.slice()`. Descriptions end mid-word. | They read as broken in search results. |
| 7 | `/jobs` and job pages have Organization data but no WebSite data. | The SOP asks for both on every page. |
| 8 | The Organization logo is white on a transparent background. | Google shows logos on white. It will be invisible. Use the dark square mark (`/icons/icon.svg`) or export a dark version. |
| 9 | `/support` and `/privacy` titles are 21 characters. | Short titles waste the space search engines give. |
| 10 | `/blog/how-to-job-search-confidentially` links to `/signup` as its money page and to no indexable money page. | `/signup` is private and cannot rank. Add one link to `/how-it-works` or `/jobs`. |
| 11 | The viewport sets `maximumScale: 1`, which blocks pinch zoom. | Lighthouse marks it as an accessibility failure. |
| 12 | Wire IndexNow into the deploy: `node scripts/indexnow.mjs --since <date> --if-live`. | SOP step 7: changed pages go out on every deploy. |
| 13 | The program terms and `/referral-rewards` say a Form 1099 is issued at $600. The IRS threshold is $2,000 for payments made after Dec 31, 2025. | The page states a number that is out of date. Delta's counsel should confirm the wording. |
| 14 | Delete `app/(site)/blog/preview-sample/page.tsx` before launch. | It is a layout test page. It is `noindex`, but it should not ship. |

## Waiting on you

In the order to do them.

1. **Confirm the jobs.** Every job on the public board must be a real, open Delta role. Replace or remove the six starter jobs. This blocks launch.
2. **Say go on DNS.** Sign in to the registrar and to Cloudflare, then say "move ecrn.com's DNS to Cloudflare". Everything marked "Later" starts here.
3. **Pick the Google account that owns ecrn.com.** A Delta work address, not a personal Gmail. Then open Search Console and Bing Webmaster Tools signed in to it.
4. **Remove the old copy.** Ask whoever runs the old site's hosting to delete or lock `ecrn-website-chi6v.kinsta.page`. Decide what deltaecrn.com and goecrn.com should do.
5. **Create the six profiles** in `LISTINGS-AND-PROFILES.md`, LinkedIn first, and send the URLs.
6. **Choose the analytics tool.** Cloudflare Web Analytics or GA4.
7. **Ask Delta to link to ecrn.com** from deltaconstructionpartners.com, and from recruiter signatures and bios.
8. **Get one Delta recruiter to read the 12 posts and 6 career pages.** Send the name and role for the "Reviewed by" line.
9. **Give ECRN a support email on its own domain.** The site shows a personal agency address today.
10. **Send a logo that works on a white background.** The horizontal logo is white.
11. **Have Delta's counsel sign off the program terms.** The old site called them sample terms. The 1099 line needs the 2026 threshold.
12. **Say so if AI training bots should be blocked.** The default is to allow them.

## What Claude does the day the domain is live

1. Point the Worker at `ecrn.com`. Confirm `NEXT_PUBLIC_SITE_URL` is unset or `https://ecrn.com`. Change `server.url` in `capacitor.config.ts` to `https://ecrn.com` (that one needs a new app build).
2. In Cloudflare: add the Single Redirect from `www` to the bare domain (301, keep the query string), turn on Always Use HTTPS, set SSL to Full (strict).
3. Run the audit on the live site. It must show 0 hard failures, the host redirects passing, HSTS present, and no `noindex` on public pages:

   ```
   node scripts/seo-audit.mjs https://ecrn.com --out docs/seo/audit-YYYY-MM-DD.md
   ```

4. Check the redirects by hand as well:

   ```
   curl -sI "http://ecrn.com/" | head -3
   curl -sI "https://www.ecrn.com/how-it-works?utm_source=test" | head -3
   curl -sI "https://ecrn.com/this-page-does-not-exist" | head -1
   ```

5. Cloudflare AI Crawl Control: allow Search, Agents and Training (unless you said no). Turn Bot Preference Sync off. Confirm `https://ecrn.com/robots.txt` is still exactly what the code wrote. Read the "Crawler access" table in the audit: every row 200.
6. Search Console: add the URL-prefix property for `https://ecrn.com`, paste the code into `SITE_VERIFICATION.google`, deploy, verify. Add the Domain property by DNS TXT. Submit `https://ecrn.com/sitemap.xml`.
7. Request indexing for the day 1 list.
8. Bing Webmaster Tools: import from Search Console or verify with `SITE_VERIFICATION.bing`. Submit the sitemap.
9. IndexNow: run `npm run indexnow` and expect 200 or 202. Turn on Crawler Hints.
10. Rich Results Test and Schema.org validator on a job, a post, a career page, `/faq` and `/glossary`.
11. Lighthouse on mobile for `/`, `/jobs`, a job, a post and a career page. Targets: LCP under 2.5 s, INP under 200 ms, CLS under 0.1.
12. Add each profile URL to `BRAND.sameAs` as it arrives, and deploy.
13. Add analytics as chosen, on the public pages only, and update the privacy policy in the same deploy.
14. Set the reminder for the day 2 indexing list. Start the first monthly report. Put the first AI answer test in the calendar for 3 weeks out.
15. Search `site:ecrn.com` and `site:kinsta.page "Electrical Construction Referral Network"` once a week for two weeks. Nothing but the new pages should remain.
