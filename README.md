# ECRN — Electrical Construction Referral Network

A Delta Construction Partners initiative.

ECRN is a mobile-first PWA that turns Delta's network into a referral engine. Referral
partners upload contacts they know in the construction/electrical industry; if Delta
places one of those contacts, the referrer earns a payout. Candidates can apply
directly. Companies can submit hiring needs. Delta admins run everything from a
single dashboard.

This repository contains **MVP Batch 1**: the foundation — project scaffold, schema,
mock data layer, auth shell, role-based onboarding, app layout, PWA support, and the
public landing page. Batches 2–8 build out the actual referral/job/admin features
on top of this foundation.

---

## Quickstart

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

No environment variables are required for V1 — the app uses an in-memory mock data
store and a cookie-based mock auth so you can click around the entire flow without
provisioning Supabase. See `lib/data/repository.ts` and `lib/auth/mock.ts`.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | SSR, route handlers for future webhooks, PWA-friendly |
| Language | TypeScript | type safety across the data layer |
| Styling | Tailwind CSS | Apple-clean utility-first; brand tokens in `tailwind.config.ts` |
| Forms | React Hook Form + Zod | typed validation that matches the DB schema |
| Auth (target) | Supabase Auth | Postgres-native, row-level security |
| DB (target) | Supabase Postgres | schema in `supabase/migrations/` |
| Storage (target) | Supabase Storage | resume uploads |
| Hosting | Vercel-ready, also works on any Node host | see "Deployment" |

## Folder structure

```
app/                       Next.js App Router pages
  (auth)/                  signup, login, forgot password, onboarding
  (app)/                   logged-in shell — referral partner, candidate, admin
  page.tsx                 public landing
  layout.tsx               root layout (fonts, metadata, PWA register)
  manifest.ts              PWA manifest
components/
  ui/                      Button, Card, Input, Label, Logo — Apple-clean primitives
  layout/                  AppShell, MobileNav, Sidebar
  onboarding/              AddToHomeScreenGuide
lib/
  auth/                    mock session helpers (V1) — swap to Supabase later
  data/                    repository abstraction; mock store + seeds
  supabase/                client + server Supabase clients (inactive in V1)
  integrations/            bullhorn.ts placeholder for future CRM sync
  notifications/           dispatcher + provider stubs (email/SMS)
  utils/                   cn(), duplicate detection
types/                     shared TS types matching the Supabase schema
supabase/
  migrations/              0001_init.sql, 0002_rls.sql — full schema + RLS policies
public/
  sw.js                    minimal service worker
  icons/                   PWA icons
```

## Data layer — mock today, Supabase tomorrow

Every piece of data flows through `lib/data/repository.ts`. In V1 it's backed by
`lib/data/mock-store.ts` (in-memory + cookie-persisted). To switch to Supabase later,
swap the backend in `repository.ts`; no page code has to change.

The Supabase schema is already written in `supabase/migrations/` so you can spin up
a project and apply it without any further design work. See
`supabase/README.md` for the apply-migrations steps.

## Roles

Four user types, set during onboarding:

- `referral_partner` — uploads contacts, refers them to jobs, tracks payouts
- `candidate` — applies to jobs directly
- `company_contact` — submits hiring needs (no login required in V1; the public
  hiring-request form writes a `company_leads` row for the admin)
- `admin` — Delta team, sees everything

The admin role is auto-assigned to any signup whose email is listed in
`NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated). Default: `aaron@skyway.media`.

## What's NOT in Batch 1 (by design)

These come in later batches per the build plan:

- Adding/editing referrals (Batch 2)
- Open jobs + applying (Batch 3)
- Admin dashboard CRUD (Batch 4)
- Company hiring funnel (Batch 5)
- Payout ledger (Batch 6)
- Email/SMS provider wiring (Batch 7)
- Bullhorn sync (Batch 8)

The pages and routes for these *exist* as stubs so navigation works end-to-end.

## Deployment

The app is host-agnostic Next.js. Easiest path: Vercel (push to GitHub → connect repo
→ deploy). Anywhere Node 18+ runs will work — `npm run build && npm start`.

**On running a local server:** for real users with logins, the app needs to be
reachable from the internet, which means either a hosted platform (Vercel, Render,
Fly.io, Railway) or self-hosting on a machine with a static IP, SSL certificate, and
firewall configured. A Mac mini on your office network can technically work but
involves port forwarding, dynamic DNS, and Let's Encrypt — meaningfully more ops
overhead than a $20/month Vercel plan. For the V1 mock-data build, you can run it
locally on your laptop while we shape the product.
