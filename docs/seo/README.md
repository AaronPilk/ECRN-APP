# ECRN SEO (PILK AI SEO SOP)

_Started Nov 20, 2026. Main host: **https://ecrn.com** (bare). `www` 301s to bare in `middleware.ts`._

The public website and the member app are one Next.js codebase:

- **Public, indexable:** `/`, `/jobs`, `/jobs/[id]`, `/how-it-works`, `/referral-rewards`, `/hire`, `/about`, `/faq`, `/support`, `/terms`, `/privacy`.
- **Private, noindex:** the app (`/dashboard`, `/referrals`, `/profile`…), auth screens, `/api`.
  - These are blocked in `robots.txt`.
  - They also get an `X-Robots-Tag: noindex` header and a meta robots `noindex`.

## Phase 1 status (done in code)

| Item | Where | Status |
|---|---|---|
| One host, www → bare 301 with path + query | `middleware.ts` (also add a Cloudflare Redirect Rule) | ✅ code |
| HSTS header | `middleware.ts` (main host only) | ✅ |
| robots.txt allows all search + AI bots, blocks private paths, lists sitemap | `app/robots.ts` | ✅ |
| sitemap.xml: indexable pages only, real lastmod for jobs | `app/sitemap.ts` | ✅ (10 pages + every open job) |
| Canonical on every page → ecrn.com | `lib/site.ts → pageMeta()` | ✅ |
| Unique titles (≤60) + descriptions (≤160) | each page's `metadata` | ✅ see audit |
| One H1 per page | all public pages | ✅ |
| OG/Twitter 1200×630 image | `public/og.jpg` | ✅ |
| JSON-LD: Organization + WebSite on every page | `app/(site)/layout.tsx` | ✅ |
| JSON-LD: FAQPage (on-page FAQs only), BreadcrumbList, JobPosting | pages | ✅ |
| Non-ecrn.com hosts (workers.dev, previews) noindex | `middleware.ts` | ✅ |
| llms.txt | `app/llms.txt/route.ts` | ✅ |
| Real 404 | `app/not-found.tsx` | ✅ (status 404) |
| IndexNow key + submit script | `public/b23fe234623ea350ce5b3117a291746d.txt`, `npm run indexnow` | ✅ |
| Images: WebP hero, sized | `public/brand/jobsite*.webp` | ✅ |

## Audit (local build, Nov 20)

| Page | Title (chars) | Desc | H1 | Schema |
|---|---|---|---|---|
| `/` | ECRN: Electrical Construction Jobs & Referral Rewards (52) | 160 | 1 | Organization, WebSite, FAQPage |
| `/how-it-works` | How ECRN Works: Refer, Apply, Get Hired or Paid \| ECRN (54) | 150 | 1 | + BreadcrumbList, FAQPage |
| `/referral-rewards` | Referral Rewards: Up to $10,000 per Hire \| ECRN (47) | 146 | 1 | + BreadcrumbList, FAQPage |
| `/jobs` | Electrical Construction Jobs Near You \| ECRN (44) | 149 | 1 | BreadcrumbList |
| `/jobs/[id]` | {Title} Job in {City, ST} \| ECRN | ≤160 | 1 | JobPosting, BreadcrumbList |
| `/hire` | Hire Electrical Construction Talent \| ECRN for Employers (56) | 158 | 1 | BreadcrumbList |
| `/about` | About ECRN: A Delta Construction Partners Initiative \| ECRN (59) | 146 | 1 | BreadcrumbList |
| `/faq` | ECRN FAQ: Referral Payouts, Jobs & Joining \| ECRN (48) | 145 | 1 | FAQPage, BreadcrumbList |
| `/support`, `/terms`, `/privacy` | unique | 134–145 | 1 | Organization, WebSite |

Re-run before launch on the live domain:

- Lighthouse on mobile for `/`, `/jobs`, a job page and `/referral-rewards`.
- Google Rich Results Test on a job page (JobPosting) and `/faq`.

## Launch run-sheet (after Cloudflare + domain)

O = owner. C = Claude.

1. **(O)** Move ecrn.com DNS to Cloudflare, keeping the registrar. **(C)** Give the exact steps:
   - Pick bare `ecrn.com` as the main host.
   - Redirect Rule: `www.ecrn.com/*` → `https://ecrn.com/${1}`, 301, keep the query string.
   - Turn on Always Use HTTPS. Set SSL to Full (strict).
2. **(O)** Point the Worker at `ecrn.com`. Then:
   - Set `NEXT_PUBLIC_SITE_URL=https://ecrn.com`. It's already the default.
   - Update `capacitor.config.ts` `server.url` to `https://ecrn.com`.
3. **Old URLs:** the current ecrn.com is one page with `#about`, `#how-it-works`, `#faq` and `#join` anchors. Anchors don't need redirects.
4. **(C)** Google Search Console:
   - Add a URL-prefix property for `https://ecrn.com` and verify with a meta tag. I add the tag to `app/layout.tsx`.
   - Add a Domain property by DNS TXT.
   - Submit `sitemap.xml`.
   - Request indexing for: `/`, `/jobs`, `/how-it-works`, `/referral-rewards`, `/hire`, `/faq`, `/about`, then the job pages. The limit is about 11 a day.
5. **(O+C)** Bing Webmaster Tools:
   - Import from Search Console, or verify with the `msvalidate.01` meta tag.
   - Submit the sitemap.
6. **(C)** IndexNow:
   - Run `npm run indexnow` after the first deploy, and after each deploy.
   - Turn on Cloudflare Crawler Hints.
7. **(C)** Cloudflare AI Crawl Control:
   - Allow Search, Agents and Training.
   - Turn off Bot Preference Sync so our `robots.txt` stays as written.
   - Test-fetch the site as each bot's user agent and expect a 200.
8. **(O)** Brand profiles: claim the ECRN LinkedIn page and social handles. **(C)** Add them to `BRAND.sameAs` in `lib/site.ts`.
9. **Local listings (Phase 4):** skip for ECRN unless Delta wants a Google Business Profile for the brand. ECRN has no walk-in location.
10. **Job postings:** Google allows the Indexing API for JobPosting pages. That's optional and owner-approved: it needs a Google Cloud service account.
11. **(C)** Analytics: GA4 or Cloudflare Web Analytics on marketing pages only. Update the privacy policy in the same deploy.
12. **(C)** Content plan (Phase 5). First pages to write, answer-first, 800–1,500 words each, every fact checked by Delta:
    - "Electrical project manager salary" guide
    - "Electrical estimator jobs" money page
    - "How construction referral bonuses work"
    - "Is a recruiter worth it for electrical contractors?" (an objection page)
    - City job pages only where Delta has real jobs and placements there

## Facts to keep identical everywhere

- **Name:** ECRN (Electrical Construction Referral Network)
- **Tagline:** Power Your Connections.
- **Parent:** Delta Construction Partners (since 2008, 30+ recruiters), https://deltaconstructionpartners.com
- **Payouts:** up to $10,000 per hire, in four tiers (Tier 1 $2,500, Tier 2 $5,000, Tier 3 $7,500, Tier 4 $10,000). They are estimates, paid after a guarantee period of about 90 days.

## Monthly

Follow SOP Phase 7:

- Search Console impressions, clicks and indexed pages, against the sitemap.
- Bing AI Performance.
- Ask ChatGPT, Claude, Perplexity and Google AI Mode the same 10 questions, such as "best electrical construction referral program" and "electrical project manager jobs Tampa". Log whether ECRN is named and which page is cited.
