-- ECRN 0010 — Admin analytics: one JSON document for the owners' dashboard.
--
-- Functions only (no tables, columns or policies).
--
--   public.admin_analytics(p_days)        the only thing the app calls. Admins only.
--   private.admin_analytics_data(p_days)  builds the document (no auth check; the
--                                         private schema is not exposed by the API).
--   private.admin_analytics_*             one helper per section, so each stays readable.
--
-- p_days: 7 / 30 / 90 / 365 ... ; null or 0 = all time.
--
-- How the period works
--   * Days are calendar days in America/New_York. "Last 7 days" = today and the
--     six days before it, so the time series always adds up to the headline number.
--   * "Previous" = the same number of days immediately before the period
--     (null for all time, and null where history can't be reconstructed).
--   * Flow numbers (sign-ups, referrals, applications, placements, payouts paid)
--     count what happened in the period. Member breakdowns and the onboarding
--     funnel describe the members who joined in the period. Everything about the
--     pipeline, routing, jobs, payouts owed and integrations is "right now".
--   * Members = profiles with role referral_partner or candidate.

-- ═══ Who has been placed, and when ══════════════════════════════════
-- A candidate counts as placed when their own status reached "placed" (or a
-- later payout stage), or an application was hired, or a job referral placed.
-- When: the payout's placement date, else the first "moved to placed/hired"
-- activity entry, else the last time the candidate record changed.
create or replace function private.admin_placed_candidates()
returns table (candidate_id uuid, placed_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id,
         coalesce(
           (select min(py.placement_date)::timestamp at time zone 'America/New_York'
              from public.payouts py
             where py.candidate_id = c.id and py.placement_date is not null),
           (select min(al.created_at)
              from public.activity_logs al
             where al.action = 'status_changed'
               and al.metadata ->> 'to' in ('placed', 'hired')
               and (   (al.entity_type = 'candidate' and al.entity_id = c.id)
                    or (al.entity_type = 'job_application'
                        and al.entity_id in (select a.id from public.job_applications a where a.candidate_id = c.id))
                    or (al.entity_type = 'job_referral'
                        and al.entity_id in (select jr.id from public.job_referrals jr where jr.candidate_id = c.id)))),
           c.updated_at)
  from public.candidates c
  where c.status in ('placed', 'payout_pending', 'payout_approved', 'payout_paid')
     or exists (select 1 from public.job_applications a where a.candidate_id = c.id and a.status = 'hired')
     or exists (select 1 from public.job_referrals jr
                 where jr.candidate_id = c.id
                   and jr.status in ('placed', 'payout_pending', 'payout_approved', 'payout_paid'));
$$;

-- ═══ 1. Headline numbers, with the previous period ══════════════════
create or replace function private.admin_analytics_kpis(p_from timestamptz, p_prev_from timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select jsonb_build_object(
       'new_members', jsonb_build_object(
         'value', count(*) filter (where p_from is null or p.created_at >= p_from),
         'previous', case when p_from is null then null
                          else count(*) filter (where p.created_at >= p_prev_from and p.created_at < p_from) end),
       'total_members', jsonb_build_object(
         'value', count(*),
         'previous', case when p_from is null then null
                          else count(*) filter (where p.created_at < p_from) end),
       -- last_seen_at is overwritten on every visit, so there is no honest "previous".
       'active_members', jsonb_build_object(
         'value', count(*) filter (where p.last_seen_at >= now() - interval '7 days'),
         'previous', null))
     from public.profiles p
     where p.role in ('referral_partner', 'candidate'))
    ||
    (select jsonb_build_object('new_candidates', jsonb_build_object(
       'value', count(*) filter (where p_from is null or c.created_at >= p_from),
       'previous', case when p_from is null then null
                        else count(*) filter (where c.created_at >= p_prev_from and c.created_at < p_from) end,
       'total', count(*)))
     from public.candidates c)
    ||
    (select jsonb_build_object('referrals', jsonb_build_object(
       'value', count(*) filter (where p_from is null or r.created_at >= p_from),
       'previous', case when p_from is null then null
                        else count(*) filter (where r.created_at >= p_prev_from and r.created_at < p_from) end,
       'total', count(*)))
     from public.referrals r)
    ||
    (select jsonb_build_object('applications', jsonb_build_object(
       'value', count(*) filter (where p_from is null or a.created_at >= p_from),
       'previous', case when p_from is null then null
                        else count(*) filter (where a.created_at >= p_prev_from and a.created_at < p_from) end,
       'total', count(*)))
     from public.job_applications a)
    ||
    (select jsonb_build_object('placements', jsonb_build_object(
       'value', count(*) filter (where p_from is null or pc.placed_at >= p_from),
       'previous', case when p_from is null then null
                        else count(*) filter (where pc.placed_at >= p_prev_from and pc.placed_at < p_from) end,
       'total', count(*)))
     from private.admin_placed_candidates() pc)
    ||
    (select jsonb_build_object(
       -- Owed now. "Previous" = what already existed at the start of the period
       -- and had not been paid yet (denied / disputed payouts are left out).
       'payouts_owed_cents', jsonb_build_object(
         'value', coalesce(sum(py.amount_cents) filter (where py.status in ('pending', 'approved')), 0),
         'previous', case when p_from is null then null
                          else coalesce(sum(py.amount_cents) filter (
                                 where py.created_at < p_from
                                   and py.status in ('pending', 'approved', 'paid')
                                   and (py.status <> 'paid' or coalesce(py.paid_at, py.updated_at) >= p_from)), 0) end),
       'payouts_paid_cents', jsonb_build_object(
         'value', coalesce(sum(py.amount_cents) filter (
                    where py.status = 'paid' and (p_from is null or coalesce(py.paid_at, py.updated_at) >= p_from)), 0),
         'previous', case when p_from is null then null
                          else coalesce(sum(py.amount_cents) filter (
                                 where py.status = 'paid'
                                   and coalesce(py.paid_at, py.updated_at) >= p_prev_from
                                   and coalesce(py.paid_at, py.updated_at) < p_from), 0) end,
         'total', coalesce(sum(py.amount_cents) filter (where py.status = 'paid'), 0)))
     from public.payouts py)
    ||
    -- Job status history isn't kept, so open jobs has no "previous" either.
    (select jsonb_build_object('open_jobs', jsonb_build_object(
       'value', count(*) filter (where j.status = 'open'),
       'previous', null,
       'opened', count(*) filter (where p_from is null or j.created_at >= p_from),
       'total', count(*)))
     from public.jobs j);
$$;

-- ═══ 2. Growth over time (continuous buckets, zeros included) ═══════
-- p_start is the first local day of the series; p_unit is day | week | month.
create or replace function private.admin_analytics_series(p_from timestamptz, p_start timestamp, p_unit text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with buckets as (
    select gs.b
    from generate_series(
           date_trunc(p_unit, p_start),
           date_trunc(p_unit, now() at time zone 'America/New_York'),
           ('1 ' || p_unit)::interval) as gs(b)
  ),
  su as (
    select date_trunc(p_unit, p.created_at at time zone 'America/New_York') as b,
           count(*) filter (where p.signup_source = 'recruiter') as recruiter,
           count(*) filter (where p.signup_source = 'member_invite') as member_invite,
           count(*) filter (where p.signup_source not in ('recruiter', 'member_invite')) as organic
    from public.profiles p
    where p.role in ('referral_partner', 'candidate')
      and (p_from is null or p.created_at >= p_from)
    group by 1
  ),
  rf as (
    select date_trunc(p_unit, r.created_at at time zone 'America/New_York') as b, count(*) as n
    from public.referrals r
    where p_from is null or r.created_at >= p_from
    group by 1
  ),
  ap as (
    select date_trunc(p_unit, a.created_at at time zone 'America/New_York') as b, count(*) as n
    from public.job_applications a
    where p_from is null or a.created_at >= p_from
    group by 1
  ),
  cd as (
    select date_trunc(p_unit, c.created_at at time zone 'America/New_York') as b, count(*) as n
    from public.candidates c
    where p_from is null or c.created_at >= p_from
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'bucket', to_char(buckets.b, 'YYYY-MM-DD'),
           'recruiter', coalesce(su.recruiter, 0),
           'member_invite', coalesce(su.member_invite, 0),
           'organic', coalesce(su.organic, 0),
           'referrals', coalesce(rf.n, 0),
           'applications', coalesce(ap.n, 0),
           'candidates', coalesce(cd.n, 0)
         ) order by buckets.b), '[]'::jsonb)
  from buckets
  left join su on su.b = buckets.b
  left join rf on rf.b = buckets.b
  left join ap on ap.b = buckets.b
  left join cd on cd.b = buckets.b;
$$;

-- ═══ 3 + 4. Who joined, and how far they got ════════════════════════
-- Describes the members who joined in the period (everyone for all time).
create or replace function private.admin_analytics_members(p_from timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with m as (
    select p.id, p.intent, p.discipline, p.years_experience, p.career_status, p.relocation,
           p.move_motivators, p.signup_source, p.signup_platform, p.location_city, p.location_state,
           p.onboarded, p.onboarding_completed_at, p.tour_completed_at, p.resume_path,
           (p.resume_builder ? 'generated'
            and jsonb_typeof(p.resume_builder -> 'generated') <> 'null') as has_built
    from public.profiles p
    where p.role in ('referral_partner', 'candidate')
      and (p_from is null or p.created_at >= p_from)
  ),
  placed as (
    select pc.candidate_id from private.admin_placed_candidates() pc
  )
  select jsonb_build_object(
    'count', (select count(*) from m),
    'intent', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select m.intent as k, count(*) as n from m where m.intent is not null group by 1) s),
    'career_status', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select m.career_status as k, count(*) as n from m where m.career_status is not null group by 1) s),
    'relocation', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select m.relocation as k, count(*) as n from m where m.relocation is not null group by 1) s),
    'signup_source', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select m.signup_source as k, count(*) as n from m group by 1) s),
    'signup_platform', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select lower(trim(m.signup_platform)) as k, count(*) as n
            from m where nullif(trim(m.signup_platform), '') is not null group by 1) s),
    -- Bands are text ("0–2", "3–5" ... "20+"); order them by their first number.
    'years_experience', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n)
                                order by coalesce(substring(s.k from '[0-9]+')::int, 999), s.k), '[]'::jsonb)
      from (select trim(m.years_experience) as k, count(*) as n
            from m where nullif(trim(m.years_experience), '') is not null group by 1) s),
    -- Top 8 disciplines, everything else rolled into "Other".
    'discipline', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.ord, s.n desc, s.k), '[]'::jsonb)
      from (select case when d.rn <= 8 then d.k else 'Other' end as k,
                   sum(d.n)::bigint as n,
                   min(case when d.rn <= 8 then 0 else 1 end) as ord
            from (select min(trim(m.discipline)) as k, count(*) as n,
                         row_number() over (order by count(*) desc, lower(trim(m.discipline))) as rn
                  from m
                  where nullif(trim(m.discipline), '') is not null
                  group by lower(trim(m.discipline))) d
            group by 1) s),
    'states', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select upper(trim(m.location_state)) as k, count(*) as n
            from m where nullif(trim(m.location_state), '') is not null
            group by 1 order by 2 desc, 1 limit 10) s),
    'cities', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select min(trim(m.location_city))
                     || coalesce(', ' || min(nullif(upper(trim(m.location_state)), '')), '') as k,
                   count(*) as n
            from m where nullif(trim(m.location_city), '') is not null
            group by lower(trim(m.location_city)), upper(trim(coalesce(m.location_state, '')))
            order by 2 desc, 1 limit 10) s),
    'located', (select count(*) from m where nullif(trim(m.location_state), '') is not null),
    -- "What would make them move", from members who are employed but open to a move.
    'open_to_move', (select count(*) from m where m.career_status = 'open_to_offers' or m.intent = 'open'),
    'motivators', (
      select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
      from (select trim(mv.v) as k, count(*) as n
            from m cross join lateral unnest(m.move_motivators) as mv(v)
            where (m.career_status = 'open_to_offers' or m.intent = 'open')
              and nullif(trim(mv.v), '') is not null
            group by 1) s),
    'resume', (
      select jsonb_build_object(
        'uploaded', count(*) filter (where m.resume_path is not null),
        'built', count(*) filter (where m.resume_path is null and m.has_built),
        'none', count(*) filter (where m.resume_path is null and not m.has_built))
      from m),
    'funnel', (
      select jsonb_build_object(
        'accounts', count(*),
        'onboarded', count(*) filter (where m.onboarded or m.onboarding_completed_at is not null),
        'resume', count(*) filter (where m.resume_path is not null or m.has_built),
        'applied', count(*) filter (where f.applied),
        'referred', count(*) filter (where f.referred),
        'engaged', count(*) filter (where f.applied or f.referred),
        'placed', count(*) filter (where f.placed),
        'tour_completed', count(*) filter (where m.tour_completed_at is not null),
        'push_enabled', count(*) filter (where f.push))
      from m
      cross join lateral (
        select (exists (select 1 from public.job_applications a where a.applicant_user_id = m.id)
                or exists (select 1 from public.job_applications a
                           join public.candidates c on c.id = a.candidate_id
                           where c.user_id = m.id)) as applied,
               (exists (select 1 from public.referrals r where r.referrer_user_id = m.id)
                or exists (select 1 from public.job_referrals jr where jr.referrer_user_id = m.id)) as referred,
               -- their own candidate record was placed, or someone they referred was
               exists (select 1 from placed pl
                       join public.candidates c on c.id = pl.candidate_id
                       where c.user_id = m.id or c.primary_referrer_user_id = m.id) as placed,
               exists (select 1 from public.device_tokens d where d.user_id = m.id) as push
      ) f)
  );
$$;

-- ═══ 6. Team performance: who is getting people to sign up ══════════
-- Direct = signed up with the team member's own code. Network = invited by a
-- member that team member brought in. One row per team member, best first.
create or replace function private.admin_analytics_team(p_from timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with placed as (
    select pc.candidate_id from private.admin_placed_candidates() pc
  ),
  su as (
    select p.recruited_by_staff_id as sid,
           count(*) filter (where p.signup_source = 'recruiter') as direct,
           count(*) filter (where p.signup_source = 'member_invite') as network,
           count(*) filter (where p.signup_source in ('recruiter', 'member_invite')
                              and (p_from is null or p.created_at >= p_from)) as period,
           count(*) filter (where p.signup_source = 'recruiter'
                              and (p_from is null or p.created_at >= p_from)) as period_direct,
           max(p.created_at) as last_signup_at
    from public.profiles p
    where p.recruited_by_staff_id is not null
      and p.role in ('referral_partner', 'candidate')
    group by 1
  ),
  cr as (
    select c.recruiter_id as sid, count(*) as n, count(pl.candidate_id) as placed
    from public.candidates c
    left join placed pl on pl.candidate_id = c.id
    where c.recruiter_id is not null
    group by 1
  ),
  cm as (
    select c.account_manager_id as sid, count(*) as n, count(pl.candidate_id) as placed
    from public.candidates c
    left join placed pl on pl.candidate_id = c.id
    where c.account_manager_id is not null
    group by 1
  ),
  ar as (
    select a.recruiter_id as sid, count(*) as n
    from public.job_applications a where a.recruiter_id is not null group by 1
  ),
  am as (
    select a.account_manager_id as sid, count(*) as n
    from public.job_applications a where a.account_manager_id is not null group by 1
  ),
  rr as (
    select r.recruiter_id as sid, count(*) as n
    from public.job_referrals r where r.recruiter_id is not null group by 1
  ),
  rm as (
    select r.account_manager_id as sid, count(*) as n
    from public.job_referrals r where r.account_manager_id is not null group by 1
  ),
  jo as (
    select j.account_manager_id as sid, count(*) as n,
           count(*) filter (where j.status = 'open') as open
    from public.jobs j where j.account_manager_id is not null group by 1
  ),
  jx as (
    select x.staff_id as sid, count(*) as n from public.job_recruiters x group by 1
  ),
  ts as (
    select s.manager_id as sid, count(*) as n
    from public.staff s where s.manager_id is not null and s.is_active group by 1
  )
  select jsonb_build_object(
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', s.id,
               'name', trim(s.first_name || ' ' || s.last_name),
               'role', s.staff_role,
               'title', s.title,
               'is_active', s.is_active,
               'invite_code', s.invite_code,
               'manager_id', s.manager_id,
               'manager_name', case when mg.id is null then null
                                    else trim(mg.first_name || ' ' || mg.last_name) end,
               'direct_signups', coalesce(su.direct, 0),
               'network_signups', coalesce(su.network, 0),
               'period_signups', coalesce(su.period, 0),
               'period_direct_signups', coalesce(su.period_direct, 0),
               'last_signup_at', su.last_signup_at,
               'candidates_assigned', coalesce(cr.n, 0),
               'applications_assigned', coalesce(ar.n, 0),
               'job_referrals_assigned', coalesce(rr.n, 0),
               'placements', coalesce(cr.placed, 0),
               'jobs_assigned', coalesce(jx.n, 0),
               'jobs_owned', coalesce(jo.n, 0),
               'open_jobs_owned', coalesce(jo.open, 0),
               'candidates_owned', coalesce(cm.n, 0),
               'applications_owned', coalesce(am.n, 0),
               'job_referrals_owned', coalesce(rm.n, 0),
               'placements_owned', coalesce(cm.placed, 0),
               'team_size', coalesce(ts.n, 0)
             ) order by coalesce(su.direct, 0) + coalesce(su.network, 0) desc,
                        coalesce(su.direct, 0) desc, s.first_name, s.last_name), '[]'::jsonb)
      from public.staff s
      left join public.staff mg on mg.id = s.manager_id
      left join su on su.sid = s.id
      left join cr on cr.sid = s.id
      left join cm on cm.sid = s.id
      left join ar on ar.sid = s.id
      left join am on am.sid = s.id
      left join rr on rr.sid = s.id
      left join rm on rm.sid = s.id
      left join jo on jo.sid = s.id
      left join jx on jx.sid = s.id
      left join ts on ts.sid = s.id),
    'staff', (
      select jsonb_build_object(
        'total', count(*),
        'active', count(*) filter (where s.is_active),
        'owners', count(*) filter (where s.is_active and s.staff_role = 'owner'),
        'account_managers', count(*) filter (where s.is_active and s.staff_role = 'account_manager'),
        'recruiters', count(*) filter (where s.is_active and s.staff_role = 'recruiter'))
      from public.staff s),
    -- "Attributed" = the member is credited to a team member (direct or network).
    'signups', (
      select jsonb_build_object(
        'all', jsonb_build_object(
          'total', count(*),
          'attributed', count(*) filter (where p.recruited_by_staff_id is not null),
          'direct', count(*) filter (where p.signup_source = 'recruiter'),
          'network', count(*) filter (where p.signup_source = 'member_invite'),
          'organic', count(*) filter (where p.signup_source not in ('recruiter', 'member_invite'))),
        'period', jsonb_build_object(
          'total', count(*) filter (where p_from is null or p.created_at >= p_from),
          'attributed', count(*) filter (where p.recruited_by_staff_id is not null
                                           and (p_from is null or p.created_at >= p_from)),
          'direct', count(*) filter (where p.signup_source = 'recruiter'
                                       and (p_from is null or p.created_at >= p_from)),
          'network', count(*) filter (where p.signup_source = 'member_invite'
                                        and (p_from is null or p.created_at >= p_from)),
          'organic', count(*) filter (where p.signup_source not in ('recruiter', 'member_invite')
                                        and (p_from is null or p.created_at >= p_from))))
      from public.profiles p
      where p.role in ('referral_partner', 'candidate'))
  );
$$;

-- ═══ 5, 7, 9. Pipeline, routing health, applications, referrals ═════
-- All "right now", except time-to-route and the referrer leaderboard's
-- period column, which follow p_from.
create or replace function private.admin_analytics_pipeline(p_from timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with placed as (
    select pc.candidate_id from private.admin_placed_candidates() pc
  )
  select jsonb_build_object(
    'pipeline', (
      select jsonb_build_object(
        'total', count(*),
        'confidential', count(*) filter (where c.is_confidential),
        'open_to_move', count(*) filter (where c.career_status = 'open_to_offers'),
        'actively_looking', count(*) filter (where c.career_status = 'actively_looking'),
        'with_account', count(*) filter (where c.user_id is not null),
        'with_resume', count(*) filter (where c.resume_path is not null or c.resume_url is not null),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.referral_status)) with ordinality as e(s, ord)
          left join (select c2.status as s, count(*) as n from public.candidates c2 group by 1) x on x.s = e.s),
        'by_source', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.candidate_source)) with ordinality as e(s, ord)
          left join (select c2.source_type as s, count(*) as n from public.candidates c2 group by 1) x on x.s = e.s))
      from public.candidates c),
    'routing', (
      select jsonb_build_object(
        'candidates', count(*),
        'unassigned', count(*) filter (where c.account_manager_id is null),
        'no_recruiter_candidates', count(*) filter (where c.account_manager_id is not null and c.recruiter_id is null),
        'fully_assigned', count(*) filter (where c.account_manager_id is not null and c.recruiter_id is not null),
        'no_recruiter_applications', (
          select count(*) from public.job_applications a
          where a.account_manager_id is not null and a.recruiter_id is null),
        'no_recruiter_job_referrals', (
          select count(*) from public.job_referrals jr
          where jr.account_manager_id is not null and jr.recruiter_id is null),
        'unassigned_applications', (
          select count(*) from public.job_applications a where a.account_manager_id is null),
        'unassigned_job_referrals', (
          select count(*) from public.job_referrals jr where jr.account_manager_id is null),
        'routed', count(*) filter (where c.routed_at is not null
                                     and (p_from is null or c.routed_at >= p_from)),
        'avg_hours_to_route', round((avg(greatest(extract(epoch from (c.routed_at - c.created_at)), 0))
                                 filter (where c.routed_at is not null
                                           and (p_from is null or c.routed_at >= p_from)) / 3600.0)::numeric, 1),
        'median_hours_to_route', round(((percentile_cont(0.5) within group (
                                   order by greatest(extract(epoch from (c.routed_at - c.created_at)), 0)::float8)
                                 filter (where c.routed_at is not null
                                           and (p_from is null or c.routed_at >= p_from))) / 3600.0)::numeric, 1),
        'by_reason', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select c2.routing_reason as k, count(*) as n
                from public.candidates c2 where c2.routing_reason is not null group by 1) s))
      from public.candidates c),
    'applications', (
      select jsonb_build_object(
        'total', count(*),
        'awaiting_review', count(*) filter (where a.status = 'submitted'),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.application_status)) with ordinality as e(s, ord)
          left join (select a2.status as s, count(*) as n from public.job_applications a2 group by 1) x on x.s = e.s))
      from public.job_applications a),
    'referrals', (
      select jsonb_build_object(
        'total', count(*),
        'duplicates_pending', count(*) filter (where r.duplicate_status = 'pending_review'),
        'primary', count(*) filter (where r.is_primary),
        'referrers', count(distinct r.referrer_user_id),
        'job_referrals', (select count(*) from public.job_referrals),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.referral_status)) with ordinality as e(s, ord)
          left join (select r2.status as s, count(*) as n from public.referrals r2 group by 1) x on x.s = e.s),
        'by_source', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select coalesce(nullif(trim(r2.referral_source), ''), 'unknown') as k, count(*) as n
                from public.referrals r2 group by 1) s),
        'by_duplicate_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.duplicate_status)) with ordinality as e(s, ord)
          left join (select r2.duplicate_status as s, count(*) as n from public.referrals r2 group by 1) x on x.s = e.s),
        -- Top 10 by referrals in the period, then all time. Placements = people
        -- they are the primary referrer for who were placed (all time).
        'top_referrers', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'id', t.id, 'name', t.name, 'referrals', t.total,
                   'period_referrals', t.period, 'placements', t.placements
                 ) order by t.period desc, t.total desc, t.name), '[]'::jsonb)
          from (
            select pr.id,
                   coalesce(nullif(trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')), ''), pr.email) as name,
                   count(*) as total,
                   count(*) filter (where p_from is null or r2.created_at >= p_from) as period,
                   (select count(*) from placed pl
                    join public.candidates c on c.id = pl.candidate_id
                    where c.primary_referrer_user_id = pr.id) as placements
            from public.referrals r2
            join public.profiles pr on pr.id = r2.referrer_user_id
            group by pr.id
            order by 4 desc, 3 desc, 2
            limit 10
          ) t))
      from public.referrals r)
  );
$$;

-- ═══ 8, 10, 11. Jobs, payouts, hiring requests ══════════════════════
create or replace function private.admin_analytics_business(p_from timestamptz, p_prev_from timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'jobs', (
      select jsonb_build_object(
        'total', count(*),
        'open', count(*) filter (where j.status = 'open'),
        'public_open', count(*) filter (where j.status = 'open' and j.is_public),
        'urgent_open', count(*) filter (where j.status = 'open' and j.urgency in ('high', 'critical')),
        'new_in_period', count(*) filter (where p_from is null or j.created_at >= p_from),
        -- Jobs that still need someone: draft, open or paused with no account manager.
        'without_owner', count(*) filter (where j.account_manager_id is null
                                            and j.status in ('draft', 'open', 'paused')),
        'avg_days_open', round((avg(extract(epoch from (now() - j.created_at)) / 86400.0)
                                  filter (where j.status = 'open'))::numeric, 1),
        'avg_payout_cents', round(avg(j.referral_payout_amount)
                                    filter (where j.status = 'open' and j.referral_payout_amount > 0)),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.job_status)) with ordinality as e(s, ord)
          left join (select j2.status as s, count(*) as n from public.jobs j2 group by 1) x on x.s = e.s),
        'open_by_trade', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select coalesce(nullif(trim(j2.trade), ''), 'unknown') as k, count(*) as n
                from public.jobs j2 where j2.status = 'open' group by 1) s),
        'open_by_state', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select coalesce(nullif(upper(trim(j2.location_state)), ''), 'unknown') as k, count(*) as n
                from public.jobs j2 where j2.status = 'open' group by 1) s),
        -- id / name are null for the "no owner" row.
        'by_account_manager', (
          select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'jobs', s.n, 'open', s.open)
                                    order by s.n desc, s.name nulls last), '[]'::jsonb)
          from (select st.id,
                       case when st.id is null then null
                            else trim(st.first_name || ' ' || st.last_name) end as name,
                       count(*) as n,
                       count(*) filter (where j2.status = 'open') as open
                from public.jobs j2
                left join public.staff st on st.id = j2.account_manager_id
                group by st.id) s),
        -- Ten busiest jobs. "company" is the real client name (admin only) when set.
        'top', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'id', t.id, 'title', t.title, 'company', t.company, 'status', t.status,
                   'location', t.location, 'owner_name', t.owner_name,
                   'applications', t.apps, 'referrals', t.refs
                 ) order by t.apps + t.refs desc, t.created_at desc), '[]'::jsonb)
          from (
            select x.*
            from (
              select j2.id, j2.title, j2.status, j2.created_at,
                     coalesce(nullif(trim(jp.client_company), ''), nullif(trim(j2.company_name), '')) as company,
                     nullif(concat_ws(', ', nullif(trim(j2.location_city), ''), nullif(trim(j2.location_state), '')), '') as location,
                     case when st.id is null then null
                          else trim(st.first_name || ' ' || st.last_name) end as owner_name,
                     (select count(*) from public.job_applications a where a.job_id = j2.id) as apps,
                     (select count(*) from public.job_referrals r where r.job_id = j2.id) as refs
              from public.jobs j2
              left join public.job_private jp on jp.job_id = j2.id
              left join public.staff st on st.id = j2.account_manager_id
            ) x
            order by x.apps + x.refs desc, x.created_at desc
            limit 10
          ) t))
      from public.jobs j),
    'payouts', (
      select jsonb_build_object(
        'total', count(*),
        'pending_count', count(*) filter (where py.status = 'pending'),
        'approved_count', count(*) filter (where py.status = 'approved'),
        'paid_count', count(*) filter (where py.status = 'paid'),
        'pending_cents', coalesce(sum(py.amount_cents) filter (where py.status = 'pending'), 0),
        'approved_cents', coalesce(sum(py.amount_cents) filter (where py.status = 'approved'), 0),
        'paid_cents', coalesce(sum(py.amount_cents) filter (where py.status = 'paid'), 0),
        'avg_cents', round(avg(py.amount_cents)
                             filter (where py.status in ('pending', 'approved', 'paid') and py.amount_cents > 0)),
        'avg_paid_cents', round(avg(py.amount_cents) filter (where py.status = 'paid' and py.amount_cents > 0)),
        'largest_cents', max(py.amount_cents) filter (where py.status in ('pending', 'approved', 'paid')),
        'missing_amount', count(*) filter (where py.status in ('pending', 'approved') and py.amount_cents = 0),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0), 'cents', coalesce(x.cents, 0))
                                    order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.payout_status)) with ordinality as e(s, ord)
          left join (select p2.status as s, count(*) as n, sum(p2.amount_cents) as cents
                     from public.payouts p2 group by 1) x on x.s = e.s),
        -- Always the last 12 calendar months, whatever range is selected.
        'paid_by_month', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'bucket', to_char(mo.b, 'YYYY-MM-DD'),
                   'cents', coalesce(x.cents, 0),
                   'count', coalesce(x.n, 0)) order by mo.b), '[]'::jsonb)
          from generate_series(
                 date_trunc('month', now() at time zone 'America/New_York') - interval '11 months',
                 date_trunc('month', now() at time zone 'America/New_York'),
                 interval '1 month') as mo(b)
          left join (
            select date_trunc('month', coalesce(p2.paid_at, p2.updated_at) at time zone 'America/New_York') as b,
                   sum(p2.amount_cents) as cents, count(*) as n
            from public.payouts p2
            where p2.status = 'paid'
            group by 1
          ) x on x.b = mo.b))
      from public.payouts py),
    'leads', (
      select jsonb_build_object(
        'total', count(*),
        'new_in_period', count(*) filter (where p_from is null or l.created_at >= p_from),
        'new_previous', case when p_from is null then null
                             else count(*) filter (where l.created_at >= p_prev_from and l.created_at < p_from) end,
        'waiting', count(*) filter (where l.status = 'new'),
        'open', count(*) filter (where l.status in ('new', 'contacted', 'qualified', 'engaged')),
        'won', count(*) filter (where l.status = 'won'),
        'positions_open', coalesce(sum(l.number_of_candidates)
                                     filter (where l.status in ('new', 'contacted', 'qualified', 'engaged')), 0),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.company_lead_status)) with ordinality as e(s, ord)
          left join (select l2.status as s, count(*) as n from public.company_leads l2 group by 1) x on x.s = e.s),
        'by_urgency', (
          select coalesce(jsonb_agg(jsonb_build_object('key', e.s, 'count', coalesce(x.n, 0)) order by e.ord), '[]'::jsonb)
          from unnest(enum_range(null::public.job_urgency)) with ordinality as e(s, ord)
          left join (select l2.urgency as s, count(*) as n from public.company_leads l2
                     where l2.status in ('new', 'contacted', 'qualified', 'engaged') group by 1) x on x.s = e.s))
      from public.company_leads l)
  );
$$;

-- ═══ 12, 13. Integrations health, app usage, recent activity ════════
-- Never returns integrations.config (it may hold credentials).
create or replace function private.admin_analytics_system(p_from timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'integrations', jsonb_build_object(
      'providers', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'provider', i.provider, 'status', i.status,
                 'last_synced_at', i.last_synced_at, 'updated_at', i.updated_at) order by i.provider), '[]'::jsonb)
        from public.integrations i),
      'outbox', (
        select jsonb_build_object(
          'total', count(*),
          'queued', count(*) filter (where o.status = 'queued'),
          'sent', count(*) filter (where o.status = 'sent'),
          'failed', count(*) filter (where o.status = 'failed'),
          'skipped', count(*) filter (where o.status = 'skipped'),
          'in_period', count(*) filter (where p_from is null or o.created_at >= p_from),
          'oldest_queued_at', min(o.created_at) filter (where o.status = 'queued'),
          'last_sent_at', max(o.sent_at),
          'by_event', (
            select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n, 'queued', s.q, 'failed', s.f)
                                      order by s.n desc, s.k), '[]'::jsonb)
            from (select o2.event_type as k, count(*) as n,
                         count(*) filter (where o2.status = 'queued') as q,
                         count(*) filter (where o2.status = 'failed') as f
                  from public.integration_outbox o2 group by 1) s))
        from public.integration_outbox o),
      'inbox', (
        select jsonb_build_object(
          'total', count(*),
          'received', count(*) filter (where ib.status = 'received'),
          'applied', count(*) filter (where ib.status = 'applied'),
          'failed', count(*) filter (where ib.status = 'failed'),
          'ignored', count(*) filter (where ib.status = 'ignored'),
          'in_period', count(*) filter (where p_from is null or ib.received_at >= p_from),
          'last_received_at', max(ib.received_at),
          'by_event', (
            select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
            from (select ib2.event_type as k, count(*) as n from public.integration_inbox ib2 group by 1) s))
        from public.integration_inbox ib),
      'crm', (
        select jsonb_build_object(
          'total', count(*),
          'linked', count(*) filter (where cr.ecrn_id is not null),
          'last_synced_at', max(cr.synced_at),
          'by_entity', (
            select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
            from (select cr2.entity_type as k, count(*) as n from public.crm_records cr2 group by 1) s))
        from public.crm_records cr),
      -- ECRN records that already carry a Bullhorn id.
      'linked', jsonb_build_object(
        'staff', (select count(*) from public.staff s where s.external_crm_id is not null),
        'jobs', (select count(*) from public.jobs j where j.external_crm_id is not null),
        'candidates', (select count(*) from public.candidates c where c.external_crm_id is not null))),
    'notifications', (
      select jsonb_build_object(
        'total', count(*),
        'in_period', count(*) filter (where p_from is null or n.created_at >= p_from),
        'failed', count(*) filter (where n.status::text = 'failed'),
        'by_status', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select n2.status::text as k, count(*) as n from public.notification_events n2 group by 1) s),
        'by_channel', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select n2.channel::text as k, count(*) as n from public.notification_events n2 group by 1) s))
      from public.notification_events n),
    -- App usage across all members, right now.
    'engagement', (
      select jsonb_build_object(
        'members', count(*),
        'active_1d', count(*) filter (where p.last_seen_at >= now() - interval '1 day'),
        'active_7d', count(*) filter (where p.last_seen_at >= now() - interval '7 days'),
        'active_30d', count(*) filter (where p.last_seen_at >= now() - interval '30 days'),
        'never_seen', count(*) filter (where p.last_seen_at is null),
        'onboarded', count(*) filter (where p.onboarded or p.onboarding_completed_at is not null),
        'tour_completed', count(*) filter (where p.tour_completed_at is not null),
        'inactive_accounts', count(*) filter (where not p.is_active),
        'push_enabled', (select count(distinct d.user_id) from public.device_tokens d),
        'devices', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select lower(d.platform) as k, count(*) as n from public.device_tokens d group by 1) s),
        'last_platform', (
          select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
          from (select lower(trim(p2.last_platform)) as k, count(*) as n
                from public.profiles p2
                where p2.role in ('referral_partner', 'candidate')
                  and nullif(trim(p2.last_platform), '') is not null
                group by 1) s))
      from public.profiles p
      where p.role in ('referral_partner', 'candidate')),
    'activity', jsonb_build_object(
      'total', (select count(*) from public.activity_logs al where p_from is null or al.created_at >= p_from),
      'by_action', (
        select coalesce(jsonb_agg(jsonb_build_object('key', s.k, 'count', s.n) order by s.n desc, s.k), '[]'::jsonb)
        from (select al.action as k, count(*) as n
              from public.activity_logs al
              where p_from is null or al.created_at >= p_from
              group by 1 order by 2 desc, 1 limit 12) s),
      -- Latest 15 entries with who did it, who/what it was about, and a plain label.
      'recent', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'id', t.id,
                 'action', t.action,
                 'entity_type', t.entity_type,
                 'entity_id', t.entity_id,
                 'created_at', t.created_at,
                 'actor_id', t.actor_user_id,
                 'actor_name', t.actor_name,
                 'subject', t.subject,
                 'candidate_id', t.candidate_id,
                 'label', t.label
               ) order by t.created_at desc), '[]'::jsonb)
        from (
          select al.id, al.action, al.entity_type, al.entity_id, al.created_at, al.actor_user_id,
                 coalesce(nullif(trim(coalesce(ap.first_name, '') || ' ' || coalesce(ap.last_name, '')), ''), ap.email) as actor_name,
                 case al.entity_type
                   when 'candidate' then (
                     select trim(c.first_name || ' ' || c.last_name) from public.candidates c where c.id = al.entity_id)
                   when 'profile' then (
                     select coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email)
                     from public.profiles p where p.id = al.entity_id)
                   when 'job' then (select j.title from public.jobs j where j.id = al.entity_id)
                   when 'referral' then (
                     select trim(c.first_name || ' ' || c.last_name)
                     from public.referrals r join public.candidates c on c.id = r.candidate_id
                     where r.id = al.entity_id)
                   when 'job_referral' then (
                     select trim(c.first_name || ' ' || c.last_name) || ' for ' || j.title
                     from public.job_referrals r
                     join public.candidates c on c.id = r.candidate_id
                     join public.jobs j on j.id = r.job_id
                     where r.id = al.entity_id)
                   when 'job_application' then (
                     select trim(c.first_name || ' ' || c.last_name) || ' for ' || j.title
                     from public.job_applications a
                     join public.candidates c on c.id = a.candidate_id
                     join public.jobs j on j.id = a.job_id
                     where a.id = al.entity_id)
                   when 'payout' then (
                     select trim(c.first_name || ' ' || c.last_name)
                     from public.payouts py join public.candidates c on c.id = py.candidate_id
                     where py.id = al.entity_id)
                   when 'company_lead' then (
                     select l.company_name from public.company_leads l where l.id = al.entity_id)
                   when 'staff' then (
                     select trim(s.first_name || ' ' || s.last_name) from public.staff s where s.id = al.entity_id)
                 end as subject,
                 case al.entity_type
                   when 'candidate' then (select c.id from public.candidates c where c.id = al.entity_id)
                   when 'referral' then (select r.candidate_id from public.referrals r where r.id = al.entity_id)
                   when 'job_referral' then (select r.candidate_id from public.job_referrals r where r.id = al.entity_id)
                   when 'job_application' then (select a.candidate_id from public.job_applications a where a.id = al.entity_id)
                   when 'payout' then (select py.candidate_id from public.payouts py where py.id = al.entity_id)
                 end as candidate_id,
                 case al.action
                   when 'account_created' then 'New account'
                   when 'onboarding_completed' then 'Finished onboarding'
                   when 'role_set' then 'Role set'
                   when 'referral_submitted' then 'New referral'
                   when 'duplicate_detected' then 'Possible duplicate referral'
                   when 'referred_to_job' then 'Referred to a job'
                   when 'application_submitted' then 'New application'
                   when 'status_changed' then
                     (case al.entity_type
                        when 'candidate' then 'Candidate'
                        when 'job_application' then 'Application'
                        when 'job_referral' then 'Job referral'
                        when 'referral' then 'Referral'
                        when 'payout' then 'Payout'
                        when 'job' then 'Job'
                        when 'company_lead' then 'Hiring request'
                        else 'Record' end)
                     || coalesce(' moved to ' || nullif(replace(al.metadata ->> 'to', '_', ' '), ''), ' status changed')
                   when 'note_added' then 'Note added'
                   when 'primary_referrer_reassigned' then 'Primary referrer changed'
                   when 'routed' then 'Routed automatically'
                     || coalesce(' (' || nullif(replace(al.metadata ->> 'reason', '_', ' '), '') || ')', '')
                   when 'assigned' then 'Owner assigned'
                   when 'invite_code_claimed' then 'Recruiter code added'
                   when 'account_deleted' then 'Account deleted'
                   when 'created' then
                     upper(left(al.entity_type, 1)) || replace(substr(al.entity_type, 2), '_', ' ') || ' created'
                   when 'updated' then
                     upper(left(al.entity_type, 1)) || replace(substr(al.entity_type, 2), '_', ' ') || ' updated'
                   else upper(left(al.action, 1)) || replace(substr(al.action, 2), '_', ' ')
                 end as label
          from (
            select l.* from public.activity_logs l order by l.created_at desc limit 15
          ) al
          left join public.profiles ap on ap.id = al.actor_user_id
        ) t))
  );
$$;

-- ═══ The whole document ═════════════════════════════════════════════
create or replace function private.admin_analytics_data(p_days int)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c_tz constant text := 'America/New_York';
  v_days int := nullif(least(greatest(coalesce(p_days, 0), 0), 3660), 0);  -- null = all time
  v_today timestamp := date_trunc('day', now() at time zone c_tz);         -- local midnight today
  v_first timestamp;        -- first local day covered by the time series
  v_from timestamptz;       -- start of the period (null = all time)
  v_prev_from timestamptz;  -- start of the previous period
  v_span int;               -- days covered by the time series
  v_unit text;              -- day | week | month
  v_pipe jsonb;
  v_biz jsonb;
  v_sys jsonb;
begin
  if v_days is not null then
    v_first := v_today - make_interval(days => v_days - 1);
    v_from := v_first at time zone c_tz;
    v_prev_from := (v_first - make_interval(days => v_days)) at time zone c_tz;
    v_span := v_days;
  else
    -- All time: start the series at the first record (at least two weeks back).
    select (least(
              (select min(p.created_at) from public.profiles p where p.role in ('referral_partner', 'candidate')),
              (select min(c.created_at) from public.candidates c),
              (select min(r.created_at) from public.referrals r),
              (select min(a.created_at) from public.job_applications a)
            )) at time zone c_tz
      into v_first;
    v_first := date_trunc('day', least(coalesce(v_first, v_today), v_today - interval '13 days'));
    v_span := (v_today::date - v_first::date) + 1;
  end if;

  -- Daily up to a month, weekly up to half a year, monthly beyond.
  v_unit := case when v_span <= 31 then 'day' when v_span <= 180 then 'week' else 'month' end;

  v_pipe := private.admin_analytics_pipeline(v_from);
  v_biz := private.admin_analytics_business(v_from, v_prev_from);
  v_sys := private.admin_analytics_system(v_from);

  return jsonb_build_object(
    'generated_at', now(),
    'range', jsonb_build_object(
      'days', v_days,
      'from', v_from,
      'previous_from', v_prev_from,
      'bucket', v_unit,
      'timezone', c_tz),
    -- Things an owner should act on, each with a live count.
    'attention', jsonb_build_object(
      'unassigned_people', coalesce((v_pipe #>> '{routing,unassigned}')::int, 0),
      'jobs_without_owner', coalesce((v_biz #>> '{jobs,without_owner}')::int, 0),
      'payouts_to_approve', coalesce((v_biz #>> '{payouts,pending_count}')::int, 0),
      'duplicates_to_review', coalesce((v_pipe #>> '{referrals,duplicates_pending}')::int, 0),
      'failed_sync_events', coalesce((v_sys #>> '{integrations,outbox,failed}')::int, 0)
                          + coalesce((v_sys #>> '{integrations,inbox,failed}')::int, 0),
      'applications_to_review', coalesce((v_pipe #>> '{applications,awaiting_review}')::int, 0),
      'hiring_requests_waiting', coalesce((v_biz #>> '{leads,waiting}')::int, 0)),
    'kpis', private.admin_analytics_kpis(v_from, v_prev_from),
    'series', private.admin_analytics_series(v_from, v_first, v_unit),
    'members', private.admin_analytics_members(v_from),
    'team', private.admin_analytics_team(v_from)
  ) || v_pipe || v_biz || v_sys;
end;
$$;

-- ═══ Public entry point (admins only) ═══════════════════════════════
create or replace function public.admin_analytics(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return private.admin_analytics_data(p_days);
end;
$$;

revoke execute on function public.admin_analytics(int) from public, anon;
grant execute on function public.admin_analytics(int) to authenticated;

-- The private helpers are only ever called by the function above.
revoke execute on function private.admin_placed_candidates() from public, anon, authenticated;
revoke execute on function private.admin_analytics_kpis(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_analytics_series(timestamptz, timestamp, text) from public, anon, authenticated;
revoke execute on function private.admin_analytics_members(timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_analytics_team(timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_analytics_pipeline(timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_analytics_business(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_analytics_system(timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_analytics_data(int) from public, anon, authenticated;
