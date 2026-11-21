# ECRN monthly search report (SOP Phase 7)

_Template. Copy it to `docs/seo/reports/YYYY-MM.md` in the first week of each month and fill it in. It must stay on one page._

**Month:** ________  **Period:** ________ to ________  **Filled in on:** ________  **By:** ________

## The numbers

Compare a full calendar month with the full month before it.

| # | Number | Where to find it | Last month | This month | Change |
|---|---|---|---|---|---|
| 1 | Pages indexed, out of pages in the sitemap | Search Console, Pages | of | of | |
| 2 | Impressions | Search Console, Performance | | | |
| 3 | Clicks | Search Console, Performance | | | |
| 4 | Click-through rate | Search Console, Performance | | | |
| 5 | Average position | Search Console, Performance | | | |
| 6 | Visits from organic search | Analytics | | | |
| 7 | Accounts created from organic search | Analytics, with the admin dashboard as the cross-check | | | |
| 8 | Referrals submitted, job applications sent, employer requests sent, from organic search | Analytics | / / | / / | |
| 9 | Bing clicks | Bing Webmaster Tools, Search Performance | | | |
| 10 | AI citations | Bing Webmaster Tools, AI Performance | | | |
| 11 | AI answer test: ECRN named, out of 40 answers | `AI-ANSWER-TEST.md` scoreboard | of 40 | of 40 | |
| 12 | AI answer test: an ecrn.com page cited, out of 40 answers | `AI-ANSWER-TEST.md` scoreboard | of 40 | of 40 | |
| 13 | New referring domains | Search Console, Links. Bing, Backlinks. | | | |
| 14 | Core Web Vitals: share of URLs that pass, on mobile | Search Console, Core Web Vitals | | | |
| 15 | Pages published or refreshed | `CONTENT-PLAN.md` backlog | | | |
| 16 | Audit: hard failures and warnings | `node scripts/seo-audit.mjs https://ecrn.com` | / | / | |
| | Google Business Profile calls, directions and website clicks | Not applicable: ECRN has no Business Profile | n/a | n/a | n/a |

## The 3 biggest wins

1.
2.
3.

## The 3 problems

1.
2.
3.

## Next month's 5 actions

| # | Action | Who | Done when |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

## How to fill it in

- **Row 1.** If indexed is well below the sitemap count, open the Pages report and read each "not indexed" reason. Each group must be either deliberate or fixed and sent for validation.
- **Rows 2 to 5.** Filter to the last full month and compare with the previous one. Then sort the Queries tab by impressions: pages at positions 8 to 30 are the next pages to improve.
- **Rows 6 to 8.** Keep your own visits and bots out of the numbers. The admin dashboard counts every sign-up, so use it to sanity-check analytics.
- **Rows 11 and 12.** Run the AI answer test the same week, with the same ten questions.
- **Row 16.** Run the audit the same week and save the report next to this one. Hard failures go straight into "The 3 problems".
- **Every month, as part of the actions:** rewrite the title and description of the 3 pages with the most impressions and the lowest click-through. Fix every broken link the audit finds. Add links from older pages to the pages published this month.
- **Every third month:** update the 10 pages with the most impressions with fresh facts and dates, re-run Lighthouse on mobile, and check the name and URL on every profile in `LISTINGS-AND-PROFILES.md`.
