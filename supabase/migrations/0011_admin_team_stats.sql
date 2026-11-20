-- ECRN 0011 — numbers behind the admin Team screens (functions only).
--
-- "Which recruiters are getting people to sign up" in one round trip: one row
-- per team member with their sign-ups, workload and a 12-week trend.
--
-- The logic lives in the private schema (not reachable through the API); the
-- public wrapper only answers company owners.
--
-- Definitions (the same ones the dashboard analytics in 0010 use)
--   member          a profile with role referral_partner or candidate
--   direct sign-up  recruited_by_staff_id = the team member and
--                   signup_source = 'recruiter' (their own link or code)
--   network sign-up recruited_by_staff_id = the team member and
--                   signup_source = 'member_invite' (invited by a member
--                   they brought in)
--   sign-ups        direct + network; the 7 / 30 day counts, the onboarded
--                   count and the weekly series all count these
--   attributed      any member with a recruited_by_staff_id
--   weeks           Monday-based calendar weeks in US Eastern time; the series
--                   is 12 weeks long, oldest first, zero-filled, and the last
--                   entry is the current (partial) week

create or replace function private.admin_team_stats_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select date_trunc('week', now() at time zone 'America/New_York')::date as this_week
  ),
  weeks as (
    select g.i as idx, (b.this_week - (11 - g.i) * 7) as week_start
    from bounds b
    cross join generate_series(0, 11) as g(i)
  ),
  members as (
    select
      p.id,
      p.recruited_by_staff_id as staff_id,
      p.signup_source,
      p.onboarded,
      p.created_at,
      date_trunc('week', p.created_at at time zone 'America/New_York')::date as week_start
    from public.profiles p
    where p.role in ('referral_partner', 'candidate')
  ),
  credited as (
    select m.*
    from members m
    where m.staff_id is not null
      and m.signup_source in ('recruiter', 'member_invite')
  ),
  per_staff as (
    select
      c.staff_id,
      count(*) filter (where c.signup_source = 'recruiter') as direct_signups,
      count(*) filter (where c.signup_source = 'member_invite') as network_signups,
      count(*) filter (where c.created_at >= now() - interval '7 days') as signups_7d,
      count(*) filter (where c.created_at >= now() - interval '30 days') as signups_30d,
      count(*) filter (where c.onboarded) as onboarded,
      max(c.created_at) as last_signup_at
    from credited c
    group by c.staff_id
  ),
  per_staff_week as (
    select c.staff_id, c.week_start, count(*) as n
    from credited c
    group by c.staff_id, c.week_start
  ),
  placed as (
    -- A person counts once per team member, whether they recruit or own them.
    select x.staff_id, count(distinct x.candidate_id) as n
    from (
      select c.recruiter_id as staff_id, c.id as candidate_id
      from public.candidates c
      where c.recruiter_id is not null
        and c.status in ('placed', 'payout_pending', 'payout_approved', 'payout_paid')
      union all
      select c.account_manager_id, c.id
      from public.candidates c
      where c.account_manager_id is not null
        and c.status in ('placed', 'payout_pending', 'payout_approved', 'payout_paid')
    ) x
    group by x.staff_id
  )
  select jsonb_build_object(
    'generated_at', now(),
    'week_starts', (select jsonb_agg(to_char(w.week_start, 'YYYY-MM-DD') order by w.idx) from weeks w),
    'totals', jsonb_build_object(
      'members', (select count(*) from members),
      'attributed', (select count(*) from members m where m.staff_id is not null),
      'unattributed', (select count(*) from members m where m.staff_id is null),
      'direct', (select count(*) from credited c where c.signup_source = 'recruiter'),
      'network', (select count(*) from credited c where c.signup_source = 'member_invite'),
      'signups_7d', (select count(*) from credited c where c.created_at >= now() - interval '7 days'),
      'signups_30d', (select count(*) from credited c where c.created_at >= now() - interval '30 days'),
      'members_30d', (select count(*) from members m where m.created_at >= now() - interval '30 days'),
      'weekly', (
        select jsonb_agg(coalesce(c.n, 0) order by w.idx)
        from weeks w
        left join (
          select psw.week_start, sum(psw.n) as n from per_staff_week psw group by psw.week_start
        ) c on c.week_start = w.week_start
      )
    ),
    'staff', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'direct_signups', coalesce(ps.direct_signups, 0),
          'network_signups', coalesce(ps.network_signups, 0),
          'signups_7d', coalesce(ps.signups_7d, 0),
          'signups_30d', coalesce(ps.signups_30d, 0),
          'onboarded', coalesce(ps.onboarded, 0),
          'last_signup_at', ps.last_signup_at,
          'candidates_assigned', (select count(*) from public.candidates c where c.recruiter_id = s.id),
          'candidates_owned', (select count(*) from public.candidates c where c.account_manager_id = s.id),
          'applications_assigned', (select count(*) from public.job_applications a where a.recruiter_id = s.id),
          'applications_owned', (select count(*) from public.job_applications a where a.account_manager_id = s.id),
          'job_referrals_assigned', (select count(*) from public.job_referrals jr where jr.recruiter_id = s.id),
          'job_referrals_owned', (select count(*) from public.job_referrals jr where jr.account_manager_id = s.id),
          'placements', coalesce(pl.n, 0),
          'jobs_owned', (select count(*) from public.jobs j where j.account_manager_id = s.id),
          'jobs_assigned', (select count(*) from public.job_recruiters r where r.staff_id = s.id),
          'team_size', (select count(*) from public.staff t where t.manager_id = s.id),
          'active_team_size', (select count(*) from public.staff t where t.manager_id = s.id and t.is_active),
          'weekly', (
            select jsonb_agg(coalesce(psw.n, 0) order by w.idx)
            from weeks w
            left join per_staff_week psw on psw.staff_id = s.id and psw.week_start = w.week_start
          )
        )
        order by s.first_name, s.last_name, s.id
      )
      from public.staff s
      left join per_staff ps on ps.staff_id = s.id
      left join placed pl on pl.staff_id = s.id
    ), '[]'::jsonb)
  );
$$;

-- What the app calls: the same numbers, for company owners only.
create or replace function public.admin_team_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  return private.admin_team_stats_data();
end;
$$;

revoke execute on function private.admin_team_stats_data() from public, anon, authenticated;
revoke execute on function public.admin_team_stats() from public, anon;
grant execute on function public.admin_team_stats() to authenticated;
