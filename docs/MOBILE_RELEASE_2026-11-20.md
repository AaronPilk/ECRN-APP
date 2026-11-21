# Mobile repair release — November 20, 2026

## Findings from the supplied recording

The 93-second recording was reviewed across its full duration using one-second
frame samples, with source inspection of the recorded flows. The walkthrough's
unstable step objects restarted its layout/scroll effects on rectangle updates.
Contacts rendered the whole 1,804-row address book; review inherited the previous
scroll position. Demo selection obscured the normal account workflow. Auth and
data reads repeated during navigation, and several submissions lacked pending UI.

## Changes

- Stable tour steps and rectangle measurements; one scroll per step, with a fixed
  card above the bottom safe area.
- Virtual contacts, full-list search, preserved selection, review scroll reset.
- One normal login; database role selects admin or member home. Retired demo
  shortcuts and sessions. New members follow normal onboarding.
- Verified JWT claims and request-scoped profile/client/query reuse; preserved
  refresh cookies; local-session logout; last-seen writes after the response.
- Immediate navigation/submission feedback, stale city/GPS response cancellation,
  onboarding error recovery, and serialized resume saves before generation.
- Repaired resume-builder route and authenticated file viewing. Untouched resume
  drafts no longer save during React development effect replay.
- Atomic admin candidate status and referral-credit changes using existing RLS.
- Exact supplied logo used in web, native lock screen, icons, launch screens and
  offline fallback. Native plugin configuration and signing remain unchanged.
- Website remains the source of truth. The native client checks the deployed Git
  revision on resume and periodically; viewing screens can reload automatically,
  while forms retain their content until the user chooses to reload.
- Browser offline fallback caches a static offline page instead of account HTML.
- Public homepage streams job cards independently; paused jobs are excluded from
  public open-job counts. Hiring form validates whole positive counts.

## Verification

- Full TypeScript validation passes. Production builds enforce it too.
- Eight auth regression tests pass.
- Cloudflare/OpenNext production bundle builds successfully.
- Local crawl: 43/43 sitemap pages return 200, reachable within two clicks, with
  no broken internal links. All 286 image-manifest files exist.
- Real consumer password login reaches onboarding. Its dashboard, jobs, profile
  and resume-builder route were checked in the browser. Temporary test onboarding,
  tour and empty-draft values were restored to a fresh member state afterward.
- Existing administrator login reaches `/admin`; dashboard, members, jobs,
  referrals, payouts, team and settings return 200 under that account.
- Isolated contacts/tour browser fixture uses 1,804 synthetic records and no
  production mutations. Scrolling keeps a small visible row window, searching
  finds record 1,804, selection survives filtering, and tour positions remain
  stable between interactions. Phone viewport checks use 430 × 932 pixels.
- Both database RPCs passed permission and rollback-only consistency checks.
- iOS launch storyboard compiles without warnings; icon is 1024 × 1024, opaque.

## Scope and remaining limits

Review covered auth, member and admin data/action paths, the recorded mobile
components, native integration helpers, public routes/forms, branding, SEO and
deployment configuration. This is not a guarantee that every line is defect-free.
The detailed data review is in `DATA_FLOW_AUDIT_2026-11-20.md`.

Actual iPhone frame timing, Face ID, contacts permission/native picker and push
delivery still need device acceptance testing. Browser checks do not measure
iPhone Core Web Vitals or native frame rate. External Bullhorn/vendor delivery
was not enabled or tested. The outbox needs a claim lease before overlapping
production dispatch is enabled; larger data lists need pagination/aggregation.

The dependency audit reports 16 advisories, mostly build tooling/transitive
packages, plus the existing Zod 3 collection-size advisory. This release does not
apply unreviewed major dependency upgrades. A separate dependency update should
cover Zod, Capacitor asset tooling and their transitive packages with compatibility
testing. Existing request/body and schema bounds remain in place.

Release commits are prepared in an isolated worktree because the original checkout
contains concurrent website work. No uncommitted work from that checkout is included.
