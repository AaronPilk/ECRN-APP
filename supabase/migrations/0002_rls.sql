-- ─────────────────────────────────────────────────────────────────────
-- Row-level security policies for ECRN
--
-- Visibility rules (per the product spec):
--   - Users see their own profile.
--   - Referral partners see candidates/referrals they submitted, but not
--     globally — no browsing other people's networks.
--   - Candidates see their own applications/profile.
--   - Companies have no login in V1; the public hiring form writes to
--     company_leads via the service role.
--   - Admin sees everything.
--   - Payout info is only visible to the related referrer and admin.
-- ─────────────────────────────────────────────────────────────────────

-- Helper: is the current auth user an admin?
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Helper: get the profile id for the current auth user.
create or replace function current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where auth_user_id = auth.uid() limit 1;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Enable RLS on every table
-- ═══════════════════════════════════════════════════════════════════

alter table profiles            enable row level security;
alter table candidates          enable row level security;
alter table referrals           enable row level security;
alter table jobs                enable row level security;
alter table job_referrals       enable row level security;
alter table job_applications    enable row level security;
alter table company_leads       enable row level security;
alter table payouts             enable row level security;
alter table activity_logs       enable row level security;
alter table notification_events enable row level security;
alter table integrations        enable row level security;

-- ═══════════════════════════════════════════════════════════════════
-- profiles
-- ═══════════════════════════════════════════════════════════════════

create policy "profiles_self_select" on profiles
  for select using (auth_user_id = auth.uid() or is_admin());

create policy "profiles_self_update" on profiles
  for update using (auth_user_id = auth.uid() or is_admin());

create policy "profiles_self_insert" on profiles
  for insert with check (auth_user_id = auth.uid() or is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- candidates
--   Referral partners see candidates they referred (primary or duplicate
--   attempt). Candidates see their own row (matched via email on profile).
--   Admin sees all.
-- ═══════════════════════════════════════════════════════════════════

create policy "candidates_referrer_or_admin_select" on candidates
  for select using (
    is_admin()
    or primary_referrer_user_id = current_profile_id()
    or id in (
      select candidate_id from referrals where referrer_user_id = current_profile_id()
    )
    or lower(email) = (select lower(email) from profiles where id = current_profile_id())
  );

create policy "candidates_referrer_or_admin_insert" on candidates
  for insert with check (
    is_admin() or primary_referrer_user_id = current_profile_id()
  );

create policy "candidates_admin_update" on candidates
  for update using (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- referrals
-- ═══════════════════════════════════════════════════════════════════

create policy "referrals_owner_or_admin_select" on referrals
  for select using (
    is_admin() or referrer_user_id = current_profile_id()
  );

create policy "referrals_owner_insert" on referrals
  for insert with check (
    referrer_user_id = current_profile_id() or is_admin()
  );

create policy "referrals_admin_update" on referrals
  for update using (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- jobs — public jobs visible to everyone; drafts only to admin
-- ═══════════════════════════════════════════════════════════════════

create policy "jobs_public_select" on jobs
  for select using (
    is_admin() or (is_public = true and status in ('open', 'paused'))
  );

create policy "jobs_admin_write" on jobs
  for all using (is_admin()) with check (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- job_referrals
-- ═══════════════════════════════════════════════════════════════════

create policy "job_referrals_owner_or_admin_select" on job_referrals
  for select using (
    is_admin() or referrer_user_id = current_profile_id()
  );

create policy "job_referrals_owner_insert" on job_referrals
  for insert with check (
    referrer_user_id = current_profile_id() or is_admin()
  );

create policy "job_referrals_admin_update" on job_referrals
  for update using (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- job_applications
-- ═══════════════════════════════════════════════════════════════════

create policy "job_applications_self_or_admin_select" on job_applications
  for select using (
    is_admin() or applicant_user_id = current_profile_id()
  );

create policy "job_applications_self_insert" on job_applications
  for insert with check (
    applicant_user_id = current_profile_id() or is_admin()
  );

create policy "job_applications_admin_update" on job_applications
  for update using (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- company_leads — admin only (form submits via service role)
-- ═══════════════════════════════════════════════════════════════════

create policy "company_leads_admin_select" on company_leads
  for select using (is_admin());

create policy "company_leads_admin_write" on company_leads
  for all using (is_admin()) with check (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- payouts — referrer sees their own payouts, admin sees all
-- ═══════════════════════════════════════════════════════════════════

create policy "payouts_owner_or_admin_select" on payouts
  for select using (
    is_admin() or referrer_user_id = current_profile_id()
  );

create policy "payouts_admin_write" on payouts
  for all using (is_admin()) with check (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- activity_logs — admin only
-- ═══════════════════════════════════════════════════════════════════

create policy "activity_logs_admin_select" on activity_logs
  for select using (is_admin());

create policy "activity_logs_authenticated_insert" on activity_logs
  for insert with check (auth.uid() is not null);

-- ═══════════════════════════════════════════════════════════════════
-- notification_events — user sees their own, admin sees all
-- ═══════════════════════════════════════════════════════════════════

create policy "notification_events_self_select" on notification_events
  for select using (
    is_admin() or user_id = current_profile_id()
  );

create policy "notification_events_admin_write" on notification_events
  for all using (is_admin()) with check (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- integrations — admin only
-- ═══════════════════════════════════════════════════════════════════

create policy "integrations_admin_all" on integrations
  for all using (is_admin()) with check (is_admin());
