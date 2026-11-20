# ECRN architecture & product decisions

_Last updated Nov 20, 2026._

## One source of truth: the website

- ECRN is a Next.js web app. It will live under **ecrn.com** (domains get mapped when Cloudflare is wired up).
- The **iOS and Google Play apps are native shells** (Capacitor) that load the live site, so web deploys update the apps instantly with no store resubmission.
  A new store build is only needed when native config changes: permissions, plugins, icons.
- Admins mainly use the dashboard on desktop at the same URL.

## Stack

| Piece | What it does |
|---|---|
| Supabase (project `izsbniekpywmpjwmheyg`, TRACT org for now) | Postgres, auth, row-level security, resume storage (`resumes` bucket, private) |
| Cloudflare Workers via OpenNext | Hosting (to be pointed at ecrn.com) |
| Staffing Referrals | Receives ECRN events and feeds **Bullhorn** (Delta's CRM; recruiters work there) |
| Sense (sensehq.com) | Texts and emails, driven from Bullhorn / Staffing Referrals. ECRN doesn't send outreach itself |

## Bullhorn sync

- Database triggers write every important event to `integration_outbox`:
  - candidate created or updated
  - referral created
  - job referral
  - application created or status changed
  - hiring request (company lead)
  - member onboarded
- `lib/integrations/staffing-referrals.ts` maps each event to Bullhorn-style fields (Candidate, Lead, JobSubmission). It POSTs to `STAFFING_REFERRALS_WEBHOOK_URL`, signed with HMAC (`STAFFING_REFERRALS_SECRET`, header `X-ECRN-Signature`).
- Until those env vars exist, events simply queue.
- Admin → **Bullhorn sync** shows the queue and the exact payloads.
- Next step: get Staffing Referrals' spec and confirm field names. Inbound status updates from Bullhorn come after that.

## One member experience

- There is no separate partner side or job-seeker side. Every member gets the same app: **Home, Jobs, Referrals, Earnings, Profile**.
- On any job, a member can **apply directly** (one tap, using their profile and resume) or **refer someone**.
- The onboarding answer ("looking", "open to a move", "refer", "both") only changes:
  - which questions are asked
  - the order of the Home sections
  - the confidential flag for recruiters
- After onboarding, a **guided product tour** walks through the features. It's stored as `profiles.tour_completed_at`, and members can replay it from Profile.

## Public website (ecrn.com)

- The marketing site lives in `app/(site)`. It's a rebuild of the old one-page ecrn.com, split into indexable pages.
- `/jobs` is a public job board with JobPosting schema. Signed-in members see the same pages inside the app shell.
- SEO setup, audit and launch steps: `docs/seo/README.md`.

## Onboarding (fewest taps)

1. **Sign-up screen:** first name, last name, phone, email, password.
2. **Quiz:** one question per screen. Single-choice answers advance on tap.
   - **What brings you here?**
     - Looking for work
     - Employed but open to the right move (confidential)
     - Refer and earn
     - Both
   - **Referral partners:** "connection to construction", then done. They land on contact import.
   - **Job seekers:**
     - Discipline
     - Years of experience
     - Location (one-tap GPS or city search)
     - Open to relocating
     - What would make a move worth it, plus their current employer. Both are private, and this step appears only for "open to a move".
     - Resume: upload, build with us, or skip
3. **Finish:** one RPC, `complete_onboarding`, sets the role, saves the answers, and creates or links the candidate record recruiters see. "Open to a move" members are flagged **confidential** for recruiters.

## Other features

- **Contact import** (native): auto-fills name, mobile number, email, job title and company. A review screen requires name + phone before anything is sent. The database also enforces name + phone for every referral.
- **Jobs near me:** GPS or city search, using the `us_places` table (Census Gazetteer, public domain). Job coordinates fill automatically from city + state.
- **Resume builder:** short question flow in the profile. It produces a clean resume (print or save as PDF). If `ANTHROPIC_API_KEY` is set, Claude polishes the wording using only the facts given.

## Before real users sign up

Supabase's built-in email only delivers to the project team, and email confirmation is on, so outside sign-ups are rejected right now. Either:

- turn off **Confirm email** (Authentication → Sign In / Providers → Email), or
- add custom SMTP (e.g. Resend) and keep confirmation on.
