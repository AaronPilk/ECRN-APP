# Data and action audit — November 20, 2026

## Scope reviewed

This is a targeted data/action review for the mobile release. It is not a claim that every line of the repository has been individually reviewed.

- Read `docs/ARCHITECTURE.md` and `docs/ADMIN_BUILD_CONTRACT.md` for the current data model, role boundaries, and builder responsibilities.
- Reviewed the data repository, member dashboard/referral/earnings/profile flows, candidate application/resume pages and actions, and jobs list/detail consumers.
- Reviewed admin mutations and their authorization/validation; inspected team, member, settings, sync, and routing action/query paths and admin analytics/staff/jobs helpers.
- Checked the admin page authorization inventory, including the redirect-only users page and the resume page's explicit admin check.
- Searched assigned data/admin/integration/page/component directories for unsafe rendering, asynchronous loops, broad invalidation, repeated fetches, and error-handling patterns.
- Read integration signature verification, outbound mapping/dispatch, Bullhorn pull synchronization, and inbound normalization/mirror/echo paths. This did not include a line-by-line review of every admin presentation component or every inbound vendor handler.
- Read current database permissions/policies for the tables touched by the two atomic admin RPCs. Both functions use the existing session's RLS permissions with `SECURITY INVOKER`.

## Fixes included

- Reused jobs, individual-job, and member-payout reads within the same React server request. Public job-list queries no longer send full descriptions, requirements, or integration metadata to list clients.
- Loaded independent application job/activity reads in parallel and sorted the combined timeline newest first.
- Corrected the dashboard earnings amount to match its displayed approved/paid/estimated label.
- Replaced resume autosave's root-layout invalidation with targeted invalidation on completed resume operations. Drafts are validated and size-bounded.
- Added the missing `/candidate/resume/build` page and an authenticated `/api/resume/view` endpoint that signs only the current member's own stored resume. The member UI uses a direct link so opening the file does not depend on a popup after an asynchronous call.
- Added pending submit feedback and repeat-click protection to application and referral forms using the shared `SubmitButton` component.
- Validated admin identifiers/status values and bounded notes. Removed a duplicate job-private write and added missing relevant page invalidation.
- Updated admin settings copy to describe normal account sign-in and role-based landing.
- Moved primary-referrer reassignment into one database transaction: referral flags, candidate credit, unpaid payout ownership, and audit record succeed or fail together.
- Moved candidate-status updates into one database transaction: candidate/referral statuses, optional note, and audit entries succeed or fail together. Existing placement and integration triggers remain enabled; job referrals under duplicate review retain their status.

## Verification

- TypeScript check completed successfully with `tsc --noEmit --incremental false` after the final application wiring.
- Primary-reassignment migration was applied and its rollback-only permission/no-op verification passed, as reported by the release coordinator.
- Candidate-status migration was applied and its rollback-only verification passed, as reported by the release coordinator. `/tmp/ecrn-status-verification.sql` tests member denial, null/overlong-input rejection with unchanged rows, and an admin save with a temporary note; the transaction ends with `ROLLBACK`.
- The release coordinator owns the production build, authenticated browser checks, deployment, and native archive/upload validation.

## Remaining limitations and risks

- **Integration delivery claim:** `dispatchOutbox` increments `attempts` optimistically but leaves the row queued/failed while a request is in flight. A later overlapping dispatcher can read that new attempt count and claim the same row again. Before connecting/scheduling production outbound delivery, add a database claim lease (or an equivalent queue claim), expiry/retry behavior, and an overlap test. No new delivery scheduler or connector was enabled in this release.
- **List scale:** several member/admin aggregates are computed from complete PostgREST result lists. Default result limits and growing payloads will require server-side aggregation/pagination at higher volumes. This release removes redundant requests but does not redesign those queries.
- **External integrations:** live Bullhorn/vendor credentials and deliveries were not exercised. Static review is not an end-to-end integration acceptance test.
- Contact import remains serial. Parallelizing it without first making candidate deduplication concurrency-safe would introduce duplicate-candidate races.

Database migration files must deploy before code that calls their new RPCs.
