-- ─────────────────────────────────────────────────────────────────────
-- ECRN — initial schema
-- Generated as part of MVP Batch 1.
--
-- Conventions:
--   - All primary keys are uuid, defaulted via gen_random_uuid()
--   - Every table has created_at / updated_at TIMESTAMPTZ
--   - Soft deletes are not used in V1; archive via status enums instead
--   - Foreign keys to auth.users use ON DELETE CASCADE for owner rows
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════
-- Enums
-- ═══════════════════════════════════════════════════════════════════

create type user_role as enum (
  'admin',
  'referral_partner',
  'candidate',
  'company_contact'
);

create type candidate_source as enum (
  'referred',
  'direct_application',
  'admin_import',
  'company_submission'
);

create type referral_status as enum (
  'submitted',
  'duplicate_review',
  'new',
  'contacted',
  'qualified',
  'not_qualified',
  'submitted_to_job',
  'interviewing',
  'offer_stage',
  'placed',
  'payout_pending',
  'payout_approved',
  'payout_paid',
  'rejected',
  'inactive'
);

create type job_status as enum ('draft', 'open', 'paused', 'filled', 'archived');

create type job_urgency as enum ('low', 'normal', 'high', 'critical');

create type application_status as enum (
  'submitted',
  'reviewing',
  'interviewing',
  'offer',
  'hired',
  'rejected',
  'withdrawn'
);

create type company_lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'engaged',
  'won',
  'lost',
  'archived'
);

create type payout_status as enum (
  'pending',
  'approved',
  'paid',
  'denied',
  'disputed'
);

create type duplicate_status as enum (
  'unique',
  'pending_review',
  'confirmed_duplicate',
  'overridden_primary'
);

create type notification_channel as enum ('email', 'sms', 'push', 'inapp');

create type notification_status as enum (
  'queued',
  'sent',
  'delivered',
  'failed',
  'opt_out'
);

-- ═══════════════════════════════════════════════════════════════════
-- Helper: updated_at trigger
-- ═══════════════════════════════════════════════════════════════════

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- profiles — extends auth.users with app-level fields
-- ═══════════════════════════════════════════════════════════════════

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  role user_role not null default 'referral_partner',
  first_name text,
  last_name text,
  email text not null,
  phone text,
  location_city text,
  location_state text,
  linkedin_url text,
  company_name text,
  external_crm_id text,                       -- for future Bullhorn sync
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on profiles(role);
create index profiles_email_idx on profiles(lower(email));
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- candidates — the people in Delta's network
-- ═══════════════════════════════════════════════════════════════════

create table candidates (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  location_city text,
  location_state text,
  current_job_title text,
  trade text,                                  -- e.g. 'electrical', 'mechanical'
  years_experience int,
  linkedin_url text,
  resume_url text,
  notes text,
  source_type candidate_source not null default 'referred',
  primary_referrer_user_id uuid references profiles(id) on delete set null,
  duplicate_of_candidate_id uuid references candidates(id) on delete set null,
  status referral_status not null default 'submitted',
  external_crm_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidates_email_idx on candidates(lower(email));
create index candidates_phone_idx on candidates(phone);
create index candidates_referrer_idx on candidates(primary_referrer_user_id);
create index candidates_status_idx on candidates(status);
create index candidates_trade_idx on candidates(trade);
create index candidates_linkedin_idx on candidates(lower(linkedin_url));
create trigger candidates_updated_at before update on candidates
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- referrals — every attempt to refer a candidate (1 candidate → N attempts)
-- The first attempt becomes the "primary" referral and sets
-- candidates.primary_referrer_user_id. Subsequent attempts at the same
-- candidate (matched on email/phone/linkedin) are stored here as
-- duplicate_status = 'pending_review' or 'confirmed_duplicate'.
-- ═══════════════════════════════════════════════════════════════════

create table referrals (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  referrer_user_id uuid not null references profiles(id) on delete cascade,
  referral_source text,                        -- 'manual', 'invite_link', 'csv', etc.
  status referral_status not null default 'submitted',
  is_primary boolean not null default true,
  duplicate_status duplicate_status not null default 'unique',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index referrals_candidate_idx on referrals(candidate_id);
create index referrals_referrer_idx on referrals(referrer_user_id);
create index referrals_status_idx on referrals(status);
create unique index referrals_one_primary_per_candidate
  on referrals(candidate_id) where is_primary = true;
create trigger referrals_updated_at before update on referrals
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- jobs — open roles Delta is recruiting for
-- ═══════════════════════════════════════════════════════════════════

create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text,
  is_company_public boolean not null default false,
  location_city text,
  location_state text,
  job_type text,                               -- full-time, contract, etc.
  trade text,                                  -- electrical, mechanical, etc.
  description text,
  requirements text,
  compensation_min int,
  compensation_max int,
  compensation_display text,                   -- "$80–110K + benefits"
  start_date date,
  urgency job_urgency not null default 'normal',
  status job_status not null default 'draft',
  is_public boolean not null default false,
  referral_payout_amount int,
  referral_payout_display text,
  internal_notes text,
  external_crm_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_status_idx on jobs(status);
create index jobs_is_public_idx on jobs(is_public);
create index jobs_trade_idx on jobs(trade);
create trigger jobs_updated_at before update on jobs
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- job_referrals — a candidate referred TO a specific job
-- ═══════════════════════════════════════════════════════════════════

create table job_referrals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  referrer_user_id uuid not null references profiles(id) on delete cascade,
  status referral_status not null default 'submitted_to_job',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_referrals_job_idx on job_referrals(job_id);
create index job_referrals_candidate_idx on job_referrals(candidate_id);
create index job_referrals_referrer_idx on job_referrals(referrer_user_id);
create trigger job_referrals_updated_at before update on job_referrals
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- job_applications — candidate applied directly to a job
-- ═══════════════════════════════════════════════════════════════════

create table job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  applicant_user_id uuid references profiles(id) on delete set null,
  status application_status not null default 'submitted',
  resume_url text,
  linkedin_url text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_applications_job_idx on job_applications(job_id);
create index job_applications_candidate_idx on job_applications(candidate_id);
create index job_applications_status_idx on job_applications(status);
create trigger job_applications_updated_at before update on job_applications
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- company_leads — hiring requests submitted by companies
-- (companies do NOT have logins in V1; the form just writes here)
-- ═══════════════════════════════════════════════════════════════════

create table company_leads (
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
  urgency job_urgency not null default 'normal',
  status company_lead_status not null default 'new',
  notes text,
  assigned_to_user_id uuid references profiles(id) on delete set null,
  external_crm_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index company_leads_status_idx on company_leads(status);
create trigger company_leads_updated_at before update on company_leads
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- payouts — referral payout tracking (NO real money movement in V1)
-- ═══════════════════════════════════════════════════════════════════

create table payouts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  referrer_user_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  amount_cents int not null default 0,
  status payout_status not null default 'pending',
  placement_date date,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_referrer_idx on payouts(referrer_user_id);
create index payouts_candidate_idx on payouts(candidate_id);
create index payouts_status_idx on payouts(status);
create trigger payouts_updated_at before update on payouts
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- activity_logs — audit trail for every important action
-- ═══════════════════════════════════════════════════════════════════

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles(id) on delete set null,
  entity_type text not null,                   -- 'candidate', 'referral', 'job', etc.
  entity_id uuid,
  action text not null,                        -- 'created', 'status_changed', etc.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_actor_idx on activity_logs(actor_user_id);
create index activity_logs_entity_idx on activity_logs(entity_type, entity_id);
create index activity_logs_created_idx on activity_logs(created_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- notification_events — every outbound notification, queued or sent
-- ═══════════════════════════════════════════════════════════════════

create table notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  event_type text not null,                    -- 'referral_status_change', etc.
  channel notification_channel not null,
  status notification_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  provider_id text,                            -- external message id from SendGrid/Twilio
  error text,
  created_at timestamptz not null default now()
);

create index notification_events_user_idx on notification_events(user_id);
create index notification_events_status_idx on notification_events(status);
create index notification_events_created_idx on notification_events(created_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- integrations — external service configuration (Bullhorn, etc.)
-- ═══════════════════════════════════════════════════════════════════

create table integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,               -- 'bullhorn', 'sendgrid', 'twilio'
  status text not null default 'inactive',     -- 'active', 'inactive', 'error'
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger integrations_updated_at before update on integrations
  for each row execute function set_updated_at();
