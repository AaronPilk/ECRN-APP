# ECRN architecture & product decisions

_Last updated Nov 20, 2026 (admin side, team routing, Next.js 16)._

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

## Admin side (owners only)

Anyone on the owners list (`admin_allowlist`, managed in Admin → Settings) becomes an admin when they sign up with that email. Recruiters and account managers do **not** log in to ECRN; they work in Bullhorn.

| Screen | What it is for |
|---|---|
| Dashboard | Every number in one place: growth, who the members are, team leaderboards, pipeline, jobs, payouts, sync health |
| Routing | The queue of people with no owner or no recruiter, with one-click assignment and "Auto-route everyone" |
| Activity | The full audit trail |
| Members / Candidates | Everyone with an account; everyone in the recruiting pipeline |
| Team | Account managers and recruiters, each with a personal sign-up link, code and QR code |
| Jobs / Applications / Referrals / Payouts / Companies | The pipeline, with owners and recruiters on every row |
| Integrations | Staffing Referrals and Bullhorn: outbox, inbox, mirror, simulator, field mapping |
| Settings | Owners list, demo data, launch checklist |

### Attribution: which recruiter brought each person in

- Every team member (`staff`) has an `invite_code`. Their link is `ecrn.com/r/CODE`; the code can also be typed on the sign-up screen or added later in Profile.
- `profiles.recruited_by_staff_id` + `signup_source`: `recruiter` (their code), `member_invite` (invited by a member, whose recruiter gets the network credit) or `organic`.

### Routing: who owns each person and application

Database triggers decide, in this order (see `0008` and `0013`):

1. The **account manager who owns the job** (`jobs.account_manager_id`) gets its applications and job referrals.
2. Otherwise the **recruiter credited with the sign-up** (theirs, or their referrer's), with that recruiter's account manager.
3. Otherwise an account manager whose **territory** covers the person's state.
4. Otherwise the person waits in Admin → Routing.

A manual or Bullhorn assignment is never overwritten. The owner and recruiter travel with every event sent to Staffing Referrals / Bullhorn.

## Staffing Referrals / Bullhorn

- **Outbound:** triggers queue every event in `integration_outbox`; `lib/integrations/staffing-referrals.ts` sends them once `STAFFING_REFERRALS_WEBHOOK_URL` is set.
- **Inbound:** `POST /api/integrations/staffing-referrals` (signed) applies team, job, candidate, submission and placement updates and keeps a raw copy in `crm_records`.
- **Simulator:** Admin → Integrations lets an owner run a sample Bullhorn event through the same code before anything is connected.
- Hand-off document for whoever provides API access: `docs/BULLHORN_INTEGRATION.md`.

## Privacy rules built into the database

- `jobs` is the public job board, so confidential client names and internal notes live in admin-only `job_private` (`0009`).
- A referrer can read the candidate record they created only until that person joins ECRN. After that they see what they submitted plus the status, never the person's private answers.
- Demo data is tagged, is never sent to Bullhorn, and is removed from Admin → Settings.

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
