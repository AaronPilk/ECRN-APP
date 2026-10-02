-- ─────────────────────────────────────────────────────────────────────
-- ECRN — core schema (Supabase)
--
-- profiles.id == auth.users.id. A profile row is created automatically
-- by the on_auth_user_created trigger (see 0003_functions.sql) whenever
-- someone signs up, so the app never inserts profiles directly.
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

-- ═══ Enums ═══════════════════════════════════════════════════════════

create type public.user_role as enum ('admin', 'referral_partner', 'candidate', 'company_contact');

create type public.candidate_source as enum (
  'referred', 'direct_application', 'admin_import', 'company_submission'
);

create type public.referral_status as enum (
  'submitted', 'duplicate_review', 'new', 'contacted', 'qualified', 'not_qualified',
  'submitted_to_job', 'interviewing', 'offer_stage', 'placed',
  'payout_pending', 'payout_approved', 'payout_paid', 'rejected', 'inactive'
);

create type public.job_status as enum ('draft', 'open', 'paused', 'filled', 'archived');
create type public.job_urgency as enum ('low', 'normal', 'high', 'critical');

create type public.application_status as enum (
  'submitted', 'reviewing', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn'
);

create type public.company_lead_status as enum (
  'new', 'contacted', 'qualified', 'engaged', 'won', 'lost', 'archived'
);

create type public.payout_status as enum ('pending', 'approved', 'paid', 'denied', 'disputed');

create type public.duplicate_status as enum (
  'unique', 'pending_review', 'confirmed_duplicate', 'overridden_primary'
);

create type public.notification_channel as enum ('email', 'sms', 'push', 'inapp');
create type public.notification_status as enum ('queued', 'sent', 'delivered', 'failed', 'opt_out');

-- ═══ updated_at helper ═══════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ═══ Admin allowlist ═════════════════════════════════════════════════
-- Any signup whose email is in this table becomes an admin automatically.

create table public.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- ═══ profiles ════════════════════════════════════════════════════════

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'referral_partner',
  onboarded boolean not null default false,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  location_city text,
  location_state text,
  linkedin_url text,
  company_name text,
  invited_by uuid references public.profiles(id) on delete set null,
  external_crm_id text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(lower(email));
create index profiles_invited_by_idx on public.profiles(invited_by);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ═══ candidates ══════════════════════════════════════════════════════

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  location_city text,
  location_state text,
  current_job_title text,
  trade text,
  years_experience int,
  linkedin_url text,
  resume_url text,
  notes text,
  source_type public.candidate_source not null default 'referred',
  primary_referrer_user_id uuid references public.profiles(id) on delete set null,
  duplicate_of_candidate_id uuid references public.candidates(id) on delete set null,
  assigned_recruiter_id uuid references public.profiles(id) on delete set null,
  status public.referral_status not null default 'new',
  external_crm_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidates_email_idx on public.candidates(lower(email));
create index candidates_phone_idx on public.candidates(phone);
create index candidates_linkedin_idx on public.candidates(lower(linkedin_url));
create index candidates_referrer_idx on public.candidates(primary_referrer_user_id);
create index candidates_dupe_idx on public.candidates(duplicate_of_candidate_id);
create index candidates_recruiter_idx on public.candidates(assigned_recruiter_id);
create index candidates_status_idx on public.candidates(status);
create trigger candidates_updated_at before update on public.candidates
  for each row execute function public.set_updated_at();

-- Internal (admin-only) notes on a candidate. Kept out of `candidates` so
-- referral partners can never read Delta's internal commentary.
create table public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  author_user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index candidate_notes_candidate_idx on public.candidate_notes(candidate_id);
create index candidate_notes_author_idx on public.candidate_notes(author_user_id);

-- ═══ referrals ═══════════════════════════════════════════════════════

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referral_source text,
  status public.referral_status not null default 'new',
  is_primary boolean not null default true,
  duplicate_status public.duplicate_status not null default 'unique',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index referrals_candidate_idx on public.referrals(candidate_id);
create index referrals_referrer_idx on public.referrals(referrer_user_id);
create unique index referrals_one_primary_per_candidate
  on public.referrals(candidate_id) where is_primary = true;
create trigger referrals_updated_at before update on public.referrals
  for each row execute function public.set_updated_at();

-- ═══ jobs ════════════════════════════════════════════════════════════

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text,
  is_company_public boolean not null default false,
  location_city text,
  location_state text,
  job_type text,
  trade text,
  description text,
  requirements text,
  compensation_min int,
  compensation_max int,
  compensation_display text,
  start_date date,
  urgency public.job_urgency not null default 'normal',
  status public.job_status not null default 'draft',
  is_public boolean not null default false,
  referral_payout_amount int,          -- cents
  referral_payout_display text,
  internal_notes text,
  external_crm_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_status_idx on public.jobs(status, is_public);
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ═══ job_referrals ═══════════════════════════════════════════════════

create table public.job_referrals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.referral_status not null default 'submitted_to_job',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_referrals_job_idx on public.job_referrals(job_id);
create index job_referrals_candidate_idx on public.job_referrals(candidate_id);
create index job_referrals_referrer_idx on public.job_referrals(referrer_user_id);
create trigger job_referrals_updated_at before update on public.job_referrals
  for each row execute function public.set_updated_at();

-- ═══ job_applications ════════════════════════════════════════════════

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  applicant_user_id uuid references public.profiles(id) on delete set null,
  status public.application_status not null default 'submitted',
  resume_url text,
  linkedin_url text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_applications_job_idx on public.job_applications(job_id);
create index job_applications_candidate_idx on public.job_applications(candidate_id);
create index job_applications_applicant_idx on public.job_applications(applicant_user_id);
create trigger job_applications_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();

-- ═══ company_leads ═══════════════════════════════════════════════════

create table public.company_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  location text,
  role_needed text,
  number_of_candidates int,
  start_date date,
  compensation_range text,
  job_description text,
  urgency public.job_urgency not null default 'normal',
  status public.company_lead_status not null default 'new',
  notes text,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  external_crm_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index company_leads_status_idx on public.company_leads(status);
create index company_leads_assigned_idx on public.company_leads(assigned_to_user_id);
create trigger company_leads_updated_at before update on public.company_leads
  for each row execute function public.set_updated_at();

-- ═══ payouts (tracking only — no money moves) ════════════════════════

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  amount_cents int not null default 0,
  status public.payout_status not null default 'pending',
  placement_date date,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_referrer_idx on public.payouts(referrer_user_id);
create index payouts_candidate_idx on public.payouts(candidate_id);
create index payouts_job_idx on public.payouts(job_id);
create trigger payouts_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

-- ═══ activity_logs ═══════════════════════════════════════════════════

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_actor_idx on public.activity_logs(actor_user_id);
create index activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);
create index activity_logs_created_idx on public.activity_logs(created_at desc);

-- ═══ notification_events ═════════════════════════════════════════════

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  channel public.notification_channel not null,
  status public.notification_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create index notification_events_user_idx on public.notification_events(user_id);

-- ═══ integrations ════════════════════════════════════════════════════

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  status text not null default 'inactive',
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger integrations_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();
