# ECRN SEO (PILK AI SEO SOP)

_Started Nov 20, 2026. Last updated Nov 20, 2026. Main host: **https://ecrn.com** (bare). `www` goes to the bare domain with a 301 in `middleware.ts`._

**Where things stand:** everything that can be done in code is done. The site runs at a `workers.dev` address, hidden from search on purpose. Search Console, Bing, IndexNow submission, the Cloudflare settings and the brand profiles all wait for the domain and for the owner. `RUN-SHEET.md` says exactly what waits on whom.

## Start here

| File | What it is | Open it when |
|---|---|---|
| `RUN-SHEET.md` | The SOP's run-sheet and every phase, filled in for ECRN: status, evidence, and what the owner has to do. Ends with "Waiting on you" and the launch-day list. | You want to know what is done and what is next. |
| `CONTENT-PLAN.md` | A map of every public page and the search it targets, the next 16 pages to write, and the rule for city pages. | Before writing any new page. |
| `AI-ANSWER-TEST.md` | The ten questions to ask ChatGPT, Claude, Perplexity and Google AI Mode each month, with the log. | Once a month. |
| `LISTINGS-AND-PROFILES.md` | The exact name, URL and descriptions to paste into every profile, the six profiles to claim first, and the directory tracker. | Before creating any account or listing. |
| `MONTHLY-REPORT-TEMPLATE.md` | The one-page monthly report, ready to fill. | First week of each month. |
| `audit-2026-11-20-before.md` | The first audit: the copy that was deployed before the blog, career pages and redesign. 16 pages, 0 hard failures, 6 warnings. | To compare with later audits. |
| `audit-YYYY-MM-DD.md` | One per audit run. The tool writes them. | After each run. |
| `PILK-AI-SEO-SOP.txt` | The SOP itself, as text. | To check a rule. |

## What is public and what is private

The public website and the member app are one Next.js codebase.

- **Public, indexable:**
  - `/`, `/jobs`, `/jobs/<id>`, `/how-it-works`, `/referral-rewards`, `/hire`, `/about`, `/faq`, `/support`, `/terms`, `/privacy`
  - `/careers` and `/careers/<role>` (6 roles)
  - `/blog`, `/blog/<post>` (12 posts), `/blog/category/<topic>` (6 topics)
  - `/glossary` (59 terms)
- **Public files for crawlers:** `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/blog/rss.xml`.
- **Private, noindex:** the app (`/dashboard`, `/referrals`, `/profile` and the rest), the auth screens, `/api`, the invite redirect `/r/<code>`.
  - Blocked in `robots.txt`.
  - Sent with an `X-Robots-Tag: noindex` header and a meta robots `noindex`.
- **Public but noindex:** `/hire/thanks`.
- **Every host that is not ecrn.com** (workers.dev, previews, localhost) is `noindex` on every page.

## Where the SEO lives in the code

| Thing | File | Notes |
|---|---|---|
| Brand facts, reward tiers, steps, FAQs | `lib/site.ts` | The one source. Pages, structured data and the llms files all read it. |
| Title, description, canonical, share tags for a page | `pageMeta()` in `lib/site.ts` | Every public page uses it. |
| Organization and WebSite data | `organizationJsonLd()`, `websiteJsonLd()` in `lib/site.ts` | On every page through `app/(site)/layout.tsx`. |
| Profile links | `BRAND.sameAs` in `lib/site.ts` | Empty until the profiles exist. |
| Search Console, Bing and Meta ownership codes | `SITE_VERIFICATION` in `lib/site.ts` | Rendered by `siteVerification()` once it is added to `app/layout.tsx`. |
| robots.txt | `app/robots.ts`, `lib/seo/crawlers.ts` | The crawler names and the private paths are in the second file. |
| sitemap.xml | `app/sitemap.ts`, `lib/seo/pages.ts` | Static pages and their dates are in the second file. Posts, career pages, the glossary and open jobs add themselves. |
| llms.txt and llms-full.txt | `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts`, `lib/seo/llms.ts` | Built from the same data as the pages, so they cannot drift. |
| Blog metadata and structured data | `lib/blog/seo.ts` | BlogPosting, Blog, CollectionPage. |
| Career page structured data | `app/(site)/careers/` | Occupation, ItemList, FAQPage. |
| Job posting data | `app/jobs/[id]/page.tsx` | JobPosting. |
| Host rules: `www` redirect, HSTS, noindex off the main host | `middleware.ts` | |
| IndexNow | `public/b23fe234623ea350ce5b3117a291746d.txt`, `scripts/indexnow.mjs` | The key file and the submit script. |
| The audit | `scripts/seo-audit.mjs` | Plain Node, no dependencies. |

## Everyday jobs

### Run the audit

```
node scripts/seo-audit.mjs https://ecrn.com --out docs/seo/audit-YYYY-MM-DD.md
```

- Works against any copy of the site: `http://localhost:3000`, the workers.dev address, or ecrn.com.
- It reads the sitemap, fetches every page, crawls the links from the home page, and checks robots.txt, the llms files, a made-up URL and a test fetch as each crawler.
- On ecrn.com it also tests the `http` and `www` redirects and HSTS.
- Exit code 1 means a hard failure: a sitemap URL that is not a 200, a missing title, H1 or canonical, a sitemap page that is not indexable, structured data that does not parse, a broken internal link, an orphan page, or a made-up URL that does not return 404.
- Run it before every launch, every quarter, and after any redesign.

### Send pages to IndexNow

Only once ecrn.com serves this site.

```
npm run indexnow                                    # every URL in the sitemap
node scripts/indexnow.mjs --since 2026-12-01        # only pages changed on or after that day
node scripts/indexnow.mjs /jobs /faq                # just these
node scripts/indexnow.mjs --since 2026-12-01 --dry-run   # show what would be sent
```

`--if-live` makes it exit quietly when the key file is not on the site yet, so it is safe in a deploy step.

### Add or change a page

| You did this | Do this too |
|---|---|
| Added a blog post | Nothing. Add it to a batch file in `content/blog/` and it enters the sitemap, the RSS feed and both llms files on the next deploy. |
| Added a career page | Nothing. Add it to `content/roles.ts`. |
| Added or changed a glossary term | Set `GLOSSARY_UPDATED_AT` in `content/glossary.ts` to today. |
| Changed a post or a career page | Set its `updatedAt` to today. |
| Added a new static page | Add it to `STATIC_PAGE_DATES` and `STATIC_PAGES` in `lib/seo/pages.ts`. |
| Changed the copy of a static page | Set its date in `STATIC_PAGE_DATES` to today. Never set dates to "now" on every build. |
| Put a photo on a static page | Add its name to `STATIC_PAGE_PHOTOS` in `lib/seo/pages.ts` so the sitemap lists it. |
| Added a private path | Add it to `PRIVATE_PATHS` in `lib/seo/crawlers.ts` and to `PRIVATE_PREFIXES` in `middleware.ts`. |
| Changed a reward amount or a program rule | Change `lib/site.ts`, the program terms page, and the short rule lists at the top of `lib/seo/llms.ts`. |

Then request indexing for the page in Search Console and run IndexNow with `--since`.

### Add a profile or a verification code

- Profile URL: add it to `BRAND.sameAs` in `lib/site.ts`.
- Search Console or Bing code: paste it into `SITE_VERIFICATION` in `lib/site.ts`, deploy, then click Verify.

## The first audit, in short

`audit-2026-11-20-before.md`, run against the workers.dev copy before this round's work was deployed.

| Result | Detail |
|---|---|
| 0 hard failures | Every page 200, one H1, self canonical, structured data parses, no broken links, no orphans, real 404. |
| Titles outside 30 to 60 characters | `/support` and `/privacy` are 21. Two job titles are 62 and 64. |
| Metadata outside `<head>` on 2 job pages | Next.js streamed the title, description and canonical into `<body>`. Fix: `htmlLimitedBots` in `next.config.js`. |
| WebSite data missing | On `/jobs` and every job page. |
| Thin pages | `/hire` has 81 words. Job pages have 60 to 72. |
| Not yet deployed at the time | `llms-full.txt`, and the two new names in robots.txt. Both are in the code now. |

The open items are listed in `RUN-SHEET.md`, "Open items in the code".

## Facts to keep identical everywhere

On the site, in every profile, in every directory. Copy, do not retype. The longer versions are in `LISTINGS-AND-PROFILES.md`.

- **Name:** ECRN (Electrical Construction Referral Network)
- **Website:** https://ecrn.com
- **Tagline:** Power Your Connections.
- **What it is:** a free referral network and job board for electrical construction. One account can apply to jobs and refer people.
- **Parent:** Delta Construction Partners, a construction recruiting firm (recruiting since 2008, 30+ recruiters, national contractor relationships), https://deltaconstructionpartners.com
- **Rewards:** up to $10,000 per hire, in four tiers: field positions up to $2,500, field leadership up to $5,000, office positions up to $7,500, executive leadership up to $10,000.
- **Conditions:** amounts are estimates, confirmed in writing before payout. Paid after the referral is placed with a Delta client and completes the guarantee period, typically 90 days. No cap on referrals. The first verified referral on record keeps ownership.
- **Where:** on the web, with iPhone and Android apps. Never "in the App Store" or "on Google Play" until the apps are public.
- **Never state:** an address, a phone number, hours, a founder's name, reviews, member or placement counts, client names, awards or license claims. ECRN has none that have been given for publication.

## Rhythm

- **Every deploy:** new pages enter the sitemap on their own. Run IndexNow with `--since`.
- **Monthly:** `MONTHLY-REPORT-TEMPLATE.md`, `AI-ANSWER-TEST.md`, and the audit.
- **Quarterly:** refresh the top pages, re-run Lighthouse, check every profile, re-rank the backlog in `CONTENT-PLAN.md`.

The full schedule is Phase 8 in `RUN-SHEET.md`.
