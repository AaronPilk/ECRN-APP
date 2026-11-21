# ECRN — Electrical Construction Referral Network

A Delta Construction Partners initiative. Mobile-first PWA where referral partners
upload construction contacts, candidates apply to jobs, companies submit hiring needs,
and the Delta team runs everything from an admin dashboard.

**Stack:** Next.js 16 · Supabase (Postgres + Auth + Row Level Security) · Tailwind ·
Cloudflare Workers via OpenNext.

## Run locally

```bash
npm ci
npm run dev          # http://localhost:3000
```

`.env.local` (gitignored) holds the Supabase URL and publishable key.
See `.env.example`.

## Deploy to Cloudflare

```bash
git push origin main   # Cloudflare Workers Builds builds and deploys main
```

Public config lives in `wrangler.jsonc` (`vars`) and `.env.production`. Secrets are only
ever set with `wrangler secret put`.

After the first deploy, add the Worker URL in Supabase → Authentication → URL
Configuration (Site URL + Redirect URLs, plus `http://localhost:3000/**`).

## Accounts & roles

- **Admin:** existing owners sign in at `/login`; their database profile routes them to `/admin`.
  The `admin_allowlist` controls which new signups may become administrators.
- **Referral partner / candidate / company:** chosen during onboarding. Users can never
  promote themselves to admin (enforced in the database).
- **Normal member login:** `/login` opens onboarding for a new member, then the shared
  Home / Jobs / Referrals / Earnings / Profile app. Demo login and role switching are retired.
- **Native apps:** iOS and Android load this same live website. Cold launches load the
  current deployment. After a minute in the background, viewing screens reload when a
  new release is available; forms show an update button so unfinished work is preserved.

## Database

Migrations in `supabase/migrations/`:

| File | What |
|---|---|
| `0001_init.sql` | Tables, enums, indexes |
| `0002_rls.sql` | Row Level Security, signup trigger, referral/apply/hiring RPCs, duplicate detection |
| `0003_seed.sql` | Admin allowlist + starter jobs |

Key rules enforced in Postgres (not just the UI):

- Referral partners only see candidates they originally referred.
- Duplicates (email → phone → LinkedIn → name + location) are logged as "under review";
  the first referrer keeps ownership and later referrers never see the original record.
- Internal admin notes live in `candidate_notes` (admin-only).
- Marking a candidate **Placed** auto-creates a pending payout for the primary referrer,
  using the payout amount of the job they were referred to.
- Payouts are tracking only — no money moves.

## Folder map

```
app/(auth)/        login (password + magic link), signup, onboarding, password reset
app/(app)/         partner, candidate, and admin portals
app/auth/callback  Supabase email-link handler
lib/data/          repository.ts (all queries) + mappers.ts
lib/supabase/      server/browser clients + session middleware
lib/auth/          session helpers
lib/integrations/  Bullhorn placeholder
lib/notifications/ email/SMS provider stubs
supabase/          migrations
```
