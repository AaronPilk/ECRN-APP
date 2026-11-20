-- ECRN 0012 — demo data tools (functions only).
--
-- supabase/seed/demo_admin_seed.sql fills the admin dashboards with fictional,
-- tagged data (seed "admin_demo_v1"). These functions count it and remove it:
--
--   public.admin_demo_data_counts()  -> jsonb   how many demo rows exist per table
--   public.admin_clear_demo_data()   -> jsonb   remove them all, return what was removed
--
-- Both are admin-only wrappers around private.* functions that hold the logic
-- (the private schema is not reachable through the API).
--
-- What counts as "demo data from the seed":
--   * auth.users whose email is like seed.<n>@demo.goecrn.com (their profile goes with them)
--   * staff, candidates, referrals, job referrals, applications, payouts and
--     hiring requests whose metadata has "seed": "admin_demo_v1"
--     (plus anything hanging off a seeded candidate or member)
--   * activity_logs rows about any of those records
--   * integration_outbox rows the seed marked skipped / 'demo data', and any
--     later events about those records
--
-- Not touched: the two demo logins (partner@ / candidate@demo.goecrn.com), the
-- 7 sample candidates that belong to them, the 6 sample jobs, and every real row.
-- Real rows that pointed at a demo team member simply lose that owner.

-- ═══ Count ═══════════════════════════════════════════════════════════
create or replace function private.demo_data_counts()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with u as (
    select au.id from auth.users au where au.email like 'seed.%@demo.goecrn.com'
  ),
  st as (
    select s.id from public.staff s where s.metadata->>'seed' = 'admin_demo_v1'
  ),
  c as (
    select x.id from public.candidates x
    where x.metadata->>'seed' = 'admin_demo_v1' or x.user_id in (select id from u)
  ),
  r as (
    select x.id from public.referrals x
    where x.metadata->>'seed' = 'admin_demo_v1'
       or x.candidate_id in (select id from c) or x.referrer_user_id in (select id from u)
  ),
  jr as (
    select x.id from public.job_referrals x
    where x.metadata->>'seed' = 'admin_demo_v1'
       or x.candidate_id in (select id from c) or x.referrer_user_id in (select id from u)
  ),
  a as (
    select x.id from public.job_applications x
    where x.metadata->>'seed' = 'admin_demo_v1' or x.candidate_id in (select id from c)
  ),
  p as (
    select x.id from public.payouts x
    where x.metadata->>'seed' = 'admin_demo_v1'
       or x.candidate_id in (select id from c) or x.referrer_user_id in (select id from u)
  ),
  l as (
    select x.id from public.company_leads x where x.metadata->>'seed' = 'admin_demo_v1'
  ),
  ids as (
    select id from u union all select id from st union all select id from c union all select id from r
    union all select id from jr union all select id from a union all select id from p union all select id from l
  ),
  n as (
    select
      (select count(*) from u)  as members,
      (select count(*) from st) as staff,
      (select count(*) from c)  as candidates,
      (select count(*) from r)  as referrals,
      (select count(*) from jr) as job_referrals,
      (select count(*) from a)  as job_applications,
      (select count(*) from p)  as payouts,
      (select count(*) from l)  as company_leads,
      (select count(*) from public.activity_logs al where al.entity_id in (select id from ids)) as activity_logs,
      (select count(*) from public.integration_outbox o
        where (o.status = 'skipped' and o.last_error = 'demo data')
           or o.entity_id in (select id from ids)) as integration_outbox
  )
  select jsonb_build_object(
    'members', n.members,
    'staff', n.staff,
    'candidates', n.candidates,
    'referrals', n.referrals,
    'job_referrals', n.job_referrals,
    'job_applications', n.job_applications,
    'payouts', n.payouts,
    'company_leads', n.company_leads,
    'activity_logs', n.activity_logs,
    'integration_outbox', n.integration_outbox,
    'total', n.members + n.staff + n.candidates + n.referrals + n.job_referrals + n.job_applications
             + n.payouts + n.company_leads + n.activity_logs + n.integration_outbox,
    -- older sample rows that this tool leaves alone (shown so nobody assumes they are gone)
    'kept', jsonb_build_object(
      'demo_accounts', (select count(*) from public.profiles pr
                        where pr.metadata->>'demo' = 'true' and pr.id not in (select id from u)),
      'sample_candidates', (select count(*) from public.candidates x
                            where x.metadata->>'demo' = 'true' and x.id not in (select id from c))
    )
  )
  from n;
$$;

-- ═══ Remove ══════════════════════════════════════════════════════════
create or replace function private.clear_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tag constant text := 'admin_demo_v1';
  v_started constant timestamptz := clock_timestamp();
  v_users uuid[];
  v_staff uuid[];
  v_candidates uuid[];
  v_referrals uuid[];
  v_job_referrals uuid[];
  v_applications uuid[];
  v_payouts uuid[];
  v_leads uuid[];
  v_all uuid[];
  -- real rows that stay, but pointed at a demo team member or a demo member
  v_kept_candidates uuid[];
  v_kept_applications uuid[];
  v_kept_job_referrals uuid[];
  v_kept_recruited uuid[];
  v_kept_invited uuid[];
  n_members int := 0;
  n_staff int := 0;
  n_candidates int := 0;
  n_referrals int := 0;
  n_job_referrals int := 0;
  n_applications int := 0;
  n_payouts int := 0;
  n_leads int := 0;
  n_activity int := 0;
  n_outbox int := 0;
  n_jobs int := 0;
begin
  -- 1. Work out exactly which rows are demo rows, before deleting anything.
  select coalesce(array_agg(au.id), '{}') into v_users
  from auth.users au where au.email like 'seed.%@demo.goecrn.com';

  select coalesce(array_agg(s.id), '{}') into v_staff
  from public.staff s where s.metadata->>'seed' = v_tag;

  select coalesce(array_agg(c.id), '{}') into v_candidates
  from public.candidates c
  where c.metadata->>'seed' = v_tag or c.user_id = any (v_users);

  select coalesce(array_agg(r.id), '{}') into v_referrals
  from public.referrals r
  where r.metadata->>'seed' = v_tag or r.candidate_id = any (v_candidates) or r.referrer_user_id = any (v_users);

  select coalesce(array_agg(jr.id), '{}') into v_job_referrals
  from public.job_referrals jr
  where jr.metadata->>'seed' = v_tag or jr.candidate_id = any (v_candidates) or jr.referrer_user_id = any (v_users);

  select coalesce(array_agg(a.id), '{}') into v_applications
  from public.job_applications a
  where a.metadata->>'seed' = v_tag or a.candidate_id = any (v_candidates);

  select coalesce(array_agg(p.id), '{}') into v_payouts
  from public.payouts p
  where p.metadata->>'seed' = v_tag or p.candidate_id = any (v_candidates) or p.referrer_user_id = any (v_users);

  select coalesce(array_agg(l.id), '{}') into v_leads
  from public.company_leads l where l.metadata->>'seed' = v_tag;

  v_all := v_users || v_staff || v_candidates || v_referrals || v_job_referrals
           || v_applications || v_payouts || v_leads;

  -- 2. History and queued sync events about those rows (and only those rows).
  delete from public.activity_logs al where al.entity_id = any (v_all);
  get diagnostics n_activity = row_count;

  delete from public.integration_outbox o
  where (o.status = 'skipped' and o.last_error = 'demo data') or o.entity_id = any (v_all);
  get diagnostics n_outbox = row_count;

  -- 3. The records themselves, children first so every count is exact.
  delete from public.payouts p where p.id = any (v_payouts);
  get diagnostics n_payouts = row_count;

  delete from public.job_applications a where a.id = any (v_applications);
  get diagnostics n_applications = row_count;

  delete from public.job_referrals jr where jr.id = any (v_job_referrals);
  get diagnostics n_job_referrals = row_count;

  delete from public.referrals r where r.id = any (v_referrals);
  get diagnostics n_referrals = row_count;

  delete from public.candidates c where c.id = any (v_candidates);   -- candidate_notes go with them
  get diagnostics n_candidates = row_count;

  delete from public.company_leads l where l.id = any (v_leads);
  get diagnostics n_leads = row_count;

  -- 4. Demo members. Remember real members a demo member had invited.
  select coalesce(array_agg(pr.id), '{}') into v_kept_invited
  from public.profiles pr
  where pr.invited_by = any (v_users) and not (pr.id = any (v_users));

  delete from public.notification_events ne where ne.user_id = any (v_users);
  delete from auth.users au where au.id = any (v_users);             -- profiles and identities cascade
  get diagnostics n_members = row_count;

  -- 5. Demo team. Real rows they owned fall back to "no owner".
  select coalesce(array_agg(c.id), '{}') into v_kept_candidates
  from public.candidates c
  where c.account_manager_id = any (v_staff) or c.recruiter_id = any (v_staff);

  select coalesce(array_agg(a.id), '{}') into v_kept_applications
  from public.job_applications a
  where a.account_manager_id = any (v_staff) or a.recruiter_id = any (v_staff);

  select coalesce(array_agg(jr.id), '{}') into v_kept_job_referrals
  from public.job_referrals jr
  where jr.account_manager_id = any (v_staff) or jr.recruiter_id = any (v_staff);

  select coalesce(array_agg(pr.id), '{}') into v_kept_recruited
  from public.profiles pr where pr.recruited_by_staff_id = any (v_staff);

  select count(*) into n_jobs from public.jobs j where j.account_manager_id = any (v_staff);

  delete from public.staff s where s.id = any (v_staff);              -- job_recruiters cascade, owners become null
  get diagnostics n_staff = row_count;

  -- 6. Leave the rows that stay in a consistent state.
  update public.candidates c
  set routed_at = null, routing_reason = null
  where c.id = any (v_kept_candidates) and c.account_manager_id is null and c.recruiter_id is null;

  update public.profiles pr
  set signup_source = 'organic'
  where (pr.id = any (v_kept_recruited) and pr.signup_source = 'recruiter' and pr.recruited_by_staff_id is null)
     or (pr.id = any (v_kept_invited) and pr.signup_source = 'member_invite' and pr.invited_by is null);

  -- Taking the demo owners off those rows queued sync events. They describe
  -- this cleanup, not anything a recruiter did, so they are dropped.
  delete from public.integration_outbox o
  where o.created_at >= v_started
    and o.entity_id = any (v_kept_candidates || v_kept_applications || v_kept_job_referrals)
    and o.event_type in ('candidate.updated', 'application.assigned', 'job_referral.updated');

  return jsonb_build_object(
    'members', n_members,
    'staff', n_staff,
    'candidates', n_candidates,
    'referrals', n_referrals,
    'job_referrals', n_job_referrals,
    'job_applications', n_applications,
    'payouts', n_payouts,
    'company_leads', n_leads,
    'activity_logs', n_activity,
    'integration_outbox', n_outbox,
    'total', n_members + n_staff + n_candidates + n_referrals + n_job_referrals + n_applications
             + n_payouts + n_leads + n_activity + n_outbox,
    'unassigned', jsonb_build_object(
      'jobs', n_jobs,
      'candidates', coalesce(array_length(v_kept_candidates, 1), 0),
      'job_applications', coalesce(array_length(v_kept_applications, 1), 0),
      'job_referrals', coalesce(array_length(v_kept_job_referrals, 1), 0)
    )
  );
end;
$$;

revoke execute on function private.demo_data_counts() from public, anon, authenticated;
revoke execute on function private.clear_demo_data() from public, anon, authenticated;

-- ═══ Admin-only entry points ═════════════════════════════════════════
create or replace function public.admin_demo_data_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return private.demo_data_counts();
end;
$$;

create or replace function public.admin_clear_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  v_result := private.clear_demo_data();
  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values ((select auth.uid()), 'system', null, 'demo_data_cleared', v_result);
  return v_result;
end;
$$;

revoke execute on function public.admin_demo_data_counts() from public, anon;
revoke execute on function public.admin_clear_demo_data() from public, anon;
grant execute on function public.admin_demo_data_counts() to authenticated;
grant execute on function public.admin_clear_demo_data() to authenticated;
