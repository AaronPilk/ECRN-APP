# SEO audit: https://ecrn.aaron-9c3.workers.dev

_Run 2026-11-20 with `node scripts/seo-audit.mjs https://ecrn.aaron-9c3.workers.dev --out docs/seo/audit-2026-11-20-before.md`. Production host: https://ecrn.com._

## Summary

- Sitemap URLs: 16. Pages reached by links from the home page: 16. Deepest sitemap page: 2 clicks.
- **Hard failures: 0.** Warnings: 6. Checks passed: 26.
- This is not the production host. `X-Robots-Tag: noindex` is expected here, and canonicals are checked against https://ecrn.com.

### Hard failures

None.

### Warnings

**Titles are 30 to 60 characters (4)**

- /support → 21: "Help & Support | ECRN"
- /privacy → 21: "Privacy Policy | ECRN"
- /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 → 62: "Assistant Project Manager — Electrical Job in Tampa, FL | ECRN"
- /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff → 64: "Construction Superintendent — Healthcare Job in Miami, FL | ECRN"

**Title, description and canonical are inside `<head>` (2)**

Next.js can stream these tags into `<body>` for crawlers it does not know, and crawlers that do not run JavaScript may then miss them. Fix: htmlLimitedBots in next.config.js.

- /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 → title, description, canonical found in `<body>`
- /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff → title, description, canonical found in `<body>`

**Organization and WebSite data are on every page (7)**

- /jobs → missing WebSite
- /jobs/050ae81f-b68d-4fb8-aa56-9719b14b2e9f → missing WebSite
- /jobs/96dcf350-bcc3-4691-9b90-ab956ce1376b → missing WebSite
- /jobs/d5d6c872-5f5b-4682-9f38-93a9a051f16a → missing WebSite
- /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 → missing WebSite
- /jobs/4e629fb4-eea5-40e3-8f06-cfe33dd43251 → missing WebSite
- /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff → missing WebSite

**Pages have at least 200 words of content (9)**

Counted inside `<main>`. Short legal or form pages can be fine: judge each one.

- /jobs → 114 words
- /hire → 81 words
- /support → 156 words
- /jobs/050ae81f-b68d-4fb8-aa56-9719b14b2e9f → 60 words
- /jobs/96dcf350-bcc3-4691-9b90-ab956ce1376b → 72 words
- /jobs/d5d6c872-5f5b-4682-9f38-93a9a051f16a → 63 words
- /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 → 63 words
- /jobs/4e629fb4-eea5-40e3-8f06-cfe33dd43251 → 63 words
- /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff → 63 words

**Each Phase 3 crawler is named and allowed in robots.txt (2)**

- Google-Extended is not named (it falls under "*")
- Applebot-Extended is not named (it falls under "*")

**llms-full.txt is served (1)**

- /llms-full.txt → 404

### Passed

- Every sitemap URL returns 200
- Every page has a `<title>`
- Every page has an H1
- Every page has a canonical tag pointing to itself on the main host
- No sitemap URL is noindex
- robots.txt does not block any sitemap URL
- robots.txt does not block CSS or JS
- Structured data (JSON-LD) parses on every page
- No broken internal links
- No orphan pages (every sitemap URL is reachable by links from the home page)
- A made-up URL returns 404
- Every page is within 3 clicks of the home page
- Titles are unique
- Descriptions are unique
- Descriptions are 120 to 160 characters
- One H1 per page
- Open Graph and Twitter card tags are present
- Images have alt text
- Content pages are linked from at least 3 other pages
- Every indexable page is in the sitemap
- Internal links point at final URLs, not redirects
- The sitemap is clean
- Each crawler's test fetch of the home page returns 200
- This copy of the site is hidden from search (X-Robots-Tag: noindex)
- llms.txt is served and links only to pages in the sitemap
- The IndexNow key file is served

## Site files

| File | Status | Type | Notes |
|---|---|---|---|
| /robots.txt | 200 | text/plain | 13 group(s). Sitemap: https://ecrn.com/sitemap.xml |
| /sitemap.xml | 200 | application/xml | 16 URLs, 1 image entries |
| /llms.txt | 200 | text/plain | 559 words, 8 links to this site. X-Robots-Tag: none |
| /llms-full.txt | 404 | text/html |   |
| /blog/rss.xml | 404 | text/html |   |
| A made-up URL | 404 | text/html | Must be 404. |
| /b23fe234623ea350ce5b3117a291746d.txt | 200 | text/plain | IndexNow key file, content matches |

## Crawler access

What robots.txt says for each crawler, and a test fetch of the home page with that crawler's user agent.

| Crawler | Named in robots.txt | Allowed on / | Test fetch | X-Robots-Tag | Title seen |
|---|---|---|---|---|---|
| Googlebot | yes | yes | 200 | noindex, nofollow | in head |
| Bingbot | yes | yes | 200 | noindex, nofollow | in head |
| Applebot | yes | yes | 200 | noindex, nofollow | in head |
| OAI-SearchBot | yes | yes | 200 | noindex, nofollow | in head |
| ChatGPT-User | yes | yes | 200 | noindex, nofollow | in head |
| GPTBot | yes | yes | 200 | noindex, nofollow | in head |
| Claude-SearchBot | yes | yes | 200 | noindex, nofollow | in head |
| Claude-User | yes | yes | 200 | noindex, nofollow | in head |
| ClaudeBot | yes | yes | 200 | noindex, nofollow | in head |
| PerplexityBot | yes | yes | 200 | noindex, nofollow | in head |
| Perplexity-User | yes | yes | 200 | noindex, nofollow | in head |
| Google-Extended | no | yes | robots.txt name only |   |   |
| Applebot-Extended | no | yes | robots.txt name only |   |   |
| DuckDuckBot | yes | yes | 200 | noindex, nofollow | in head |

## Crawl and index signals

| Page | Status | Final URL | Clicks from home | Pages linking in | Canonical | Meta robots | X-Robots-Tag | Last modified |
|---|---|---|---|---|---|---|---|---|
| / | 200 | same | 0 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /how-it-works | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /referral-rewards | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /hire | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /about | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /faq | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /support | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /terms | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /privacy | 200 | same | 1 | 15 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs/050ae81f-b68d-4fb8-aa56-9719b14b2e9f | 200 | same | 1 | 2 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs/96dcf350-bcc3-4691-9b90-ab956ce1376b | 200 | same | 1 | 2 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs/d5d6c872-5f5b-4682-9f38-93a9a051f16a | 200 | same | 1 | 2 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 | 200 | same | 1 | 2 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs/4e629fb4-eea5-40e3-8f06-cfe33dd43251 | 200 | same | 2 | 1 | self | none | noindex, nofollow | 2026-11-20 |
| /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff | 200 | same | 2 | 1 | self | none | noindex, nofollow | 2026-11-20 |

## On-page

| Page | Title length | Description length | H1 count | H1 | Structured data | Words | Internal links out | Images without alt |
|---|---|---|---|---|---|---|---|---|
| / | 53 | 155 | 1 | Get paid up to $10,000 when your referral is hired. | Organization, WebSite, FAQPage | 778 | 16 | 0 of 3 |
| /jobs | 44 | 149 | 1 | Electrical construction jobs | Organization, BreadcrumbList | 114 | 18 | 0 of 2 |
| /how-it-works | 54 | 150 | 1 | How ECRN works | Organization, WebSite, BreadcrumbList, FAQPage | 466 | 12 | 0 of 2 |
| /referral-rewards | 47 | 146 | 1 | Referral rewards: up to $10,000 per hire | Organization, WebSite, BreadcrumbList, FAQPage | 412 | 12 | 0 of 2 |
| /hire | 56 | 158 | 1 | Hire electrical construction talent through ECRN | Organization, WebSite, BreadcrumbList | 81 | 12 | 0 of 2 |
| /about | 59 | 146 | 1 | A platform that formalizes what you already do | Organization, WebSite, BreadcrumbList | 226 | 12 | 0 of 2 |
| /faq | 49 | 145 | 1 | Questions worth asking | Organization, WebSite, BreadcrumbList, FAQPage | 406 | 12 | 0 of 2 |
| /support | 21 | 145 | 1 | Help & Support | Organization, WebSite | 156 | 12 | 0 of 2 |
| /terms | 44 | 145 | 1 | Terms of Use | Organization, WebSite | 703 | 12 | 0 of 2 |
| /privacy | 21 | 134 | 1 | Privacy Policy | Organization, WebSite | 472 | 12 | 0 of 2 |
| /jobs/050ae81f-b68d-4fb8-aa56-9719b14b2e9f | 58 | 160 | 1 | Low Voltage Project Manager | Organization, JobPosting, BreadcrumbList | 60 | 13 | 0 of 3 |
| /jobs/96dcf350-bcc3-4691-9b90-ab956ce1376b | 57 | 160 | 1 | Senior Electrical Project Manager | Organization, JobPosting, BreadcrumbList | 72 | 13 | 0 of 3 |
| /jobs/d5d6c872-5f5b-4682-9f38-93a9a051f16a | 46 | 159 | 1 | Electrical Estimator | Organization, JobPosting, BreadcrumbList | 63 | 13 | 0 of 3 |
| /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 | 62 | 160 | 1 | Assistant Project Manager — Electrical | Organization, JobPosting, BreadcrumbList | 63 | 13 | 0 of 3 |
| /jobs/4e629fb4-eea5-40e3-8f06-cfe33dd43251 | 59 | 160 | 1 | Mechanical Project Manager | Organization, JobPosting, BreadcrumbList | 63 | 13 | 0 of 3 |
| /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff | 64 | 160 | 1 | Construction Superintendent — Healthcare | Organization, JobPosting, BreadcrumbList | 63 | 13 | 0 of 3 |

## Titles and descriptions

| Page | Title | Description |
|---|---|---|
| / | ECRN: Electrical Construction Jobs & Referral Rewards | Find electrical construction jobs or refer people you know and earn up to $10,000 when they're hired. Free to join. Powered by Delta Construction Partners. |
| /jobs | Electrical Construction Jobs Near You \| ECRN | Open electrical construction jobs for PMs, estimators, superintendents and engineers. Search near you or by city, apply in one tap, or refer someone. |
| /how-it-works | How ECRN Works: Refer, Apply, Get Hired or Paid \| ECRN | How ECRN works: join free, refer people from your contacts or apply to electrical construction jobs, and Delta Construction Partners handles the rest. |
| /referral-rewards | Referral Rewards: Up to $10,000 per Hire \| ECRN | ECRN referral payouts by role: up to $2,500 for field positions, $5,000 for field leadership, $7,500 for office roles, and $10,000 for executives. |
| /hire | Hire Electrical Construction Talent \| ECRN for Employers | Hire vetted electrical construction professionals sourced from industry referrals. Tell Delta Construction Partners what you need; a recruiter will reach out. |
| /about | About ECRN: A Delta Construction Partners Initiative \| ECRN | ECRN is the Electrical Construction Referral Network, built by Delta Construction Partners to reward the connections electrical pros already have. |
| /faq | ECRN FAQ: Referral Payouts, Jobs & Joining \| ECRN | Answers about ECRN: how referral payouts work, when you get paid, looking for a job confidentially, what it costs, and who is behind the network. |
| /support | Help & Support \| ECRN | Get help with ECRN: referral payouts, duplicate referrals, account access, deleting your account, and hiring through Delta Construction Partners. |
| /terms | Terms of Use & Referral Program Terms \| ECRN | The terms for using ECRN and the ECRN Referral Compensation Program: eligibility, payout tiers, the 90-day guarantee period, taxes, and disputes. |
| /privacy | Privacy Policy \| ECRN | How ECRN collects, uses, and protects your information, including contacts you choose to refer, resumes, and location for nearby jobs. |
| /jobs/050ae81f-b68d-4fb8-aa56-9719b14b2e9f | Low Voltage Project Manager Job in Jacksonville, FL \| ECRN | Low Voltage Project Manager in Jacksonville, FL, $100–125K. Recruited by Delta Construction Partners. Apply with a free ECRN account or refer someone and earn u |
| /jobs/96dcf350-bcc3-4691-9b90-ab956ce1376b | Senior Electrical Project Manager Job in Tampa, FL \| ECRN | Senior Electrical Project Manager in Tampa, FL, $130–165K + bonus + vehicle. Recruited by Delta Construction Partners. Apply with a free ECRN account or refer s |
| /jobs/d5d6c872-5f5b-4682-9f38-93a9a051f16a | Electrical Estimator Job in Orlando, FL \| ECRN | Electrical Estimator in Orlando, FL, $95–130K. Recruited by Delta Construction Partners. Apply with a free ECRN account or refer someone and earn up to $3,500. |
| /jobs/9978e292-794c-4966-bdd8-684fb6c8ab79 | Assistant Project Manager — Electrical Job in Tampa, FL \| ECRN | Assistant Project Manager — Electrical in Tampa, FL, $75–95K. Recruited by Delta Construction Partners. Apply with a free ECRN account or refer someone and earn |
| /jobs/4e629fb4-eea5-40e3-8f06-cfe33dd43251 | Mechanical Project Manager Job in St. Petersburg, FL \| ECRN | Mechanical Project Manager in St. Petersburg, FL, $115–150K + bonus. Recruited by Delta Construction Partners. Apply with a free ECRN account or refer someone a |
| /jobs/9d6e01b3-6929-4e75-8773-3cc7e30ef0ff | Construction Superintendent — Healthcare Job in Miami, FL \| ECRN | Construction Superintendent — Healthcare in Miami, FL, $120–155K + per diem. Recruited by Delta Construction Partners. Apply with a free ECRN account or refer s |

## How to read this

- **Status** is the first response. A page in the sitemap must be 200 with no redirect.
- **Clicks from home** is the shortest path of links from the home page. ORPHAN means no page links to it.
- **Pages linking in** counts the different pages on this site that link to the page, menus and footer included.
- **Canonical** must be the page's own URL on the production host.
- **Title length** should be 30 to 60 characters and **description length** 120 to 160. The site's own target is tighter: titles 50 to 60, descriptions 140 to 160.
- **Words** are counted inside `<main>`, so menus and the footer do not inflate the number.
- **Structured data** lists the JSON-LD types found. Check one page of each kind in Google's Rich Results Test before launch.
- This audit reads HTML the way a crawler does. It does not measure speed: run Lighthouse on mobile for that.
