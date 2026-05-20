# Supabase schema

This directory contains the database schema for ECRN, applied as ordered SQL
migrations. **You do not need a Supabase project to run V1** — the app uses a
mock data store. This schema is here so when you're ready to swap to a real
database, everything is already designed.

## Apply migrations

Option A — Supabase dashboard (easiest):

1. Create a project at <https://supabase.com>.
2. SQL Editor → paste each file in order: `0001_init.sql`, then `0002_rls.sql`.
3. Copy the project URL and anon/service-role keys into `.env.local`.

Option B — Supabase CLI:

```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-ref>
supabase db push
```

## Files

- `0001_init.sql` — extensions, enums, tables, indexes, triggers.
- `0002_rls.sql` — row-level security policies for every table.

The `lib/data/repository.ts` interface mirrors this schema 1:1 — when you flip
to Supabase, only the implementation of the repository changes, not any page.
