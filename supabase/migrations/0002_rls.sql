-- ─────────────────────────────────────────────────────────────────────
-- ECRN — security layer: helper functions, triggers, RPCs, and RLS.
--
-- Design:
--   * Every table has RLS on. The browser only ever holds the public
--     (publishable) key, so these policies are the real access control.
--   * Cross-user operations (duplicate detection, applying to a job,
--     public hiring form) go through SECURITY DEFINER functions so users
--     never get broad read access to other people's candidates.
--   * Internal helpers live in the `private` schema, which is not exposed
--     through the Supabase API.
-- ─────────────────────────────────────────────────────────────────────

create schema if not exists private;

-- ═══ Helpers ═════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function private.norm_phone(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) >= 7
      then right(regexp_replace(p, '\D', '', 'g'), 10)
  end;
$$;

create or replace function private.norm_linkedin(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(trim(coalesce(p, ''))), '^https?://(www\.)?', ''),
      '/+$', ''
    ),
    ''
  );
$$;

-- Duplicate detection: email → phone → LinkedIn → name + location.
create or replace function private.find_duplicate_candidate(
  p_email text, p_phone text, p_linkedin text,
  p_first text, p_last text, p_city text, p_state text
)
returns table (candidate_id uuid, reason text)
language plpgsql
stable
set search_path = ''
as $$
begin
  if nullif(trim(p_email), '') is not null then
    return query
      select c.id, 'email'::text from public.candidates c
      where lower(c.email) = lower(trim(p_email))
      order by c.created_at limit 1;
    if found then return; end if;
  end if;

  if private.norm_phone(p_phone) is not null then
    return query
      select c.id, 'phone'::text from public.candidates c
      where private.norm_phone(c.phone) = private.norm_phone(p_phone)
      order by c.created_at limit 1;
    if found then return; end if;
  end if;

  if private.norm_linkedin(p_linkedin) is not null then
    return query
      select c.id, 'linkedin'::text from public.candidates c
      where private.norm_linkedin(c.linkedin_url) = private.norm_linkedin(p_linkedin)
      order by c.created_at limit 1;
    if found then return; end if;
  end if;

  if nullif(trim(p_first), '') is not null
     and nullif(trim(p_last), '') is not null
     and (nullif(trim(p_city), '') is not null or nullif(trim(p_state), '') is not null) then
    return query
      select c.id, 'name_location'::text from public.candidates c
      where lower(trim(c.first_name)) = lower(trim(p_first))
        and lower(trim(c.last_name)) = lower(trim(p_last))
        and (
          (nullif(trim(p_city), '') is not null and lower(trim(c.location_city)) = lower(trim(p_city)))
          or (nullif(trim(p_state), '') is not null and lower(trim(c.location_state)) = lower(trim(p_state)))
        )
      order by c.created_at limit 1;
  end if;
end;
$$;

-- ═══ New-user trigger: auto-create profile ═══════════════════════════

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_invited uuid;
begin
  select exists (
    select 1 from public.admin_allowlist a where lower(a.email) = lower(new.email)
  ) into v_is_admin;

  begin
    v_invited := nullif(new.raw_user_meta_data ->> 'invited_by', '')::uuid;
  exception when others then
    v_invited := null;
  end;
  if v_invited is not null and not exists (select 1 from public.profiles where id = v_invited) then
    v_invited := null;
  end if;

  insert into public.profiles (id, email, first_name, last_name, phone, role, onboarded, invited_by)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case when v_is_admin then 'admin'::public.user_role else 'referral_partner'::public.user_role end,
    v_is_admin,
    v_invited
  );

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (new.id, 'profile', new.id, 'account_created',
          jsonb_build_object('invited_by', v_invited, 'admin', v_is_admin));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ═══ Profile guard: users can't self-promote or rewrite attribution ══

create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not public.is_admin()
     and coalesce(current_setting('ecrn.allow_role_change', true), '') <> 'on' then
    if new.role is distinct from old.role then
      raise exception 'Role changes are not allowed here';
    end if;
    new.invited_by := old.invited_by;
    new.email := old.email;
    new.is_active := old.is_active;
    new.external_crm_id := old.external_crm_id;
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function private.guard_profile_update();

-- ═══ Auto-create a pending payout when a candidate is placed ═════════

create or replace function private.on_candidate_placed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job uuid;
  v_amount int;
begin
  if new.status = 'placed'
     and old.status is distinct from 'placed'
     and new.primary_referrer_user_id is not null
     and not exists (select 1 from public.payouts p where p.candidate_id = new.id) then

    select jr.job_id, j.referral_payout_amount
      into v_job, v_amount
    from public.job_referrals jr
    join public.jobs j on j.id = jr.job_id
    where jr.candidate_id = new.id
    order by jr.created_at desc
    limit 1;

    insert into public.payouts (candidate_id, referrer_user_id, job_id, amount_cents, status, placement_date, notes)
    values (
      new.id, new.primary_referrer_user_id, v_job, coalesce(v_amount, 0), 'pending', current_date,
      case when v_amount is null then 'Set the payout amount for this placement.' end
    );
  end if;
  return new;
end;
$$;

create trigger candidates_on_placed
  after update of status on public.candidates
  for each row execute function private.on_candidate_placed();

-- ═══ RPC: choose role during onboarding ══════════════════════════════

create or replace function public.set_my_role(p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_role = 'admin' then raise exception 'Not allowed'; end if;

  if public.is_admin() then
    update public.profiles set onboarded = true where id = v_uid;
    return;
  end if;

  perform set_config('ecrn.allow_role_change', 'on', true);
  update public.profiles set role = p_role, onboarded = true where id = v_uid;
  perform set_config('ecrn.allow_role_change', 'off', true);

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (v_uid, 'profile', v_uid, 'role_set', jsonb_build_object('role', p_role));
end;
$$;

-- ═══ RPC: submit a referral (with duplicate protection) ══════════════

create or replace function public.submit_referral(p jsonb, p_job_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_dup_id uuid;
  v_dup_reason text;
  v_candidate_id uuid;
  v_referral_id uuid;
  v_is_duplicate boolean := false;
  v_source text := case when p_job_id is null then 'manual' else 'job_link' end;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(p ->> 'first_name'), '') = '' or coalesce(trim(p ->> 'last_name'), '') = '' then
    raise exception 'First and last name are required';
  end if;
  if coalesce(trim(p ->> 'email'), '') = '' and coalesce(trim(p ->> 'phone'), '') = '' then
    raise exception 'Add an email or phone number so Delta can reach them';
  end if;
  if p_job_id is not null and not public.is_admin() and not exists (
    select 1 from public.jobs j where j.id = p_job_id and j.is_public and j.status in ('open', 'paused')
  ) then
    raise exception 'That job is no longer open';
  end if;

  select d.candidate_id, d.reason into v_dup_id, v_dup_reason
  from private.find_duplicate_candidate(
    p ->> 'email', p ->> 'phone', p ->> 'linkedin_url',
    p ->> 'first_name', p ->> 'last_name', p ->> 'location_city', p ->> 'location_state'
  ) d;

  if v_dup_id is not null then
    v_candidate_id := v_dup_id;
    -- Same person re-submitting their own contact: reuse their referral.
    select r.id into v_referral_id from public.referrals r
    where r.candidate_id = v_candidate_id and r.referrer_user_id = v_uid
    order by r.created_at limit 1;

    if v_referral_id is null then
      v_is_duplicate := true;
      insert into public.referrals (
        candidate_id, referrer_user_id, referral_source, status,
        is_primary, duplicate_status, notes, metadata
      ) values (
        v_candidate_id, v_uid, v_source, 'duplicate_review',
        false, 'pending_review', nullif(trim(p ->> 'notes'), ''),
        jsonb_build_object('duplicate_reason', v_dup_reason, 'submitted', p)
      ) returning id into v_referral_id;

      insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
      values (v_uid, 'referral', v_referral_id, 'duplicate_detected',
              jsonb_build_object('candidate_id', v_candidate_id, 'reason', v_dup_reason, 'job_id', p_job_id));
    end if;
  else
    insert into public.candidates (
      first_name, last_name, email, phone, location_city, location_state,
      current_job_title, trade, years_experience, linkedin_url, resume_url, notes,
      source_type, primary_referrer_user_id, status
    ) values (
      trim(p ->> 'first_name'), trim(p ->> 'last_name'),
      nullif(lower(trim(p ->> 'email')), ''), nullif(trim(p ->> 'phone'), ''),
      nullif(trim(p ->> 'location_city'), ''), nullif(trim(p ->> 'location_state'), ''),
      nullif(trim(p ->> 'current_job_title'), ''), nullif(trim(p ->> 'trade'), ''),
      nullif(p ->> 'years_experience', '')::int,
      nullif(trim(p ->> 'linkedin_url'), ''), nullif(trim(p ->> 'resume_url'), ''),
      nullif(trim(p ->> 'notes'), ''),
      'referred', v_uid, 'new'
    ) returning id into v_candidate_id;

    insert into public.referrals (
      candidate_id, referrer_user_id, referral_source, status, is_primary, duplicate_status, notes, metadata
    ) values (
      v_candidate_id, v_uid, v_source, 'new', true, 'unique',
      nullif(trim(p ->> 'notes'), ''), jsonb_build_object('submitted', p)
    ) returning id into v_referral_id;

    insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
    values (v_uid, 'referral', v_referral_id, 'referral_submitted',
            jsonb_build_object('candidate_id', v_candidate_id, 'job_id', p_job_id));
  end if;

  if p_job_id is not null and not exists (
    select 1 from public.job_referrals jr
    where jr.job_id = p_job_id and jr.candidate_id = v_candidate_id and jr.referrer_user_id = v_uid
  ) then
    insert into public.job_referrals (job_id, candidate_id, referrer_user_id, status, notes)
    values (
      p_job_id, v_candidate_id, v_uid,
      case when v_is_duplicate then 'duplicate_review'::public.referral_status
           else 'submitted_to_job'::public.referral_status end,
      nullif(trim(p ->> 'notes'), '')
    );

    insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
    values (v_uid, 'referral', v_referral_id, 'referred_to_job', jsonb_build_object('job_id', p_job_id));
  end if;

  return jsonb_build_object(
    'referral_id', v_referral_id,
    'candidate_id', v_candidate_id,
    'is_duplicate', v_is_duplicate
  );
end;
$$;

-- ═══ RPC: apply to a job (preserves an existing referrer) ════════════

create or replace function public.apply_to_job(p_job_id uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_candidate_id uuid;
  v_app_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.jobs j where j.id = p_job_id and j.is_public and j.status in ('open', 'paused')
  ) then
    raise exception 'That job is no longer open';
  end if;

  select pr.email into v_email from public.profiles pr where pr.id = v_uid;

  select c.id into v_candidate_id from public.candidates c
  where lower(c.email) = lower(v_email)
  order by c.created_at limit 1;

  if v_candidate_id is null then
    insert into public.candidates (
      first_name, last_name, email, phone, location_city, location_state,
      current_job_title, trade, linkedin_url, resume_url, source_type, status
    ) values (
      coalesce(nullif(trim(p ->> 'first_name'), ''), 'Candidate'),
      coalesce(nullif(trim(p ->> 'last_name'), ''), ''),
      lower(v_email),
      nullif(trim(p ->> 'phone'), ''),
      nullif(trim(p ->> 'location_city'), ''), nullif(trim(p ->> 'location_state'), ''),
      nullif(trim(p ->> 'current_job_title'), ''), nullif(trim(p ->> 'trade'), ''),
      nullif(trim(p ->> 'linkedin_url'), ''), nullif(trim(p ->> 'resume_url'), ''),
      'direct_application', 'new'
    ) returning id into v_candidate_id;
  else
    -- Already in the network (possibly referred by someone): keep the
    -- original referrer, just fill in anything we were missing.
    update public.candidates c set
      linkedin_url = coalesce(c.linkedin_url, nullif(trim(p ->> 'linkedin_url'), '')),
      resume_url = coalesce(nullif(trim(p ->> 'resume_url'), ''), c.resume_url),
      phone = coalesce(c.phone, nullif(trim(p ->> 'phone'), '')),
      current_job_title = coalesce(c.current_job_title, nullif(trim(p ->> 'current_job_title'), ''))
    where c.id = v_candidate_id;
  end if;

  select a.id into v_app_id from public.job_applications a
  where a.job_id = p_job_id and a.applicant_user_id = v_uid limit 1;

  if v_app_id is null then
    insert into public.job_applications (job_id, candidate_id, applicant_user_id, resume_url, linkedin_url, notes)
    values (
      p_job_id, v_candidate_id, v_uid,
      nullif(trim(p ->> 'resume_url'), ''), nullif(trim(p ->> 'linkedin_url'), ''),
      nullif(trim(p ->> 'notes'), '')
    ) returning id into v_app_id;

    insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
    values (v_uid, 'job_application', v_app_id, 'application_submitted',
            jsonb_build_object('job_id', p_job_id, 'candidate_id', v_candidate_id));
  end if;

  return jsonb_build_object('application_id', v_app_id, 'candidate_id', v_candidate_id);
end;
$$;

-- ═══ RPC: public company hiring form (no login) ══════════════════════

create or replace function public.submit_company_lead(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(trim(p ->> 'company_name'), '') = ''
     or coalesce(trim(p ->> 'contact_name'), '') = ''
     or coalesce(trim(p ->> 'email'), '') = '' then
    raise exception 'Company, contact name, and email are required';
  end if;

  insert into public.company_leads (
    company_name, contact_name, email, phone, location, role_needed,
    number_of_candidates, compensation_range, job_description, notes
  ) values (
    left(trim(p ->> 'company_name'), 200), left(trim(p ->> 'contact_name'), 200),
    left(lower(trim(p ->> 'email')), 200), left(nullif(trim(p ->> 'phone'), ''), 50),
    left(nullif(trim(p ->> 'location'), ''), 200), left(nullif(trim(p ->> 'role_needed'), ''), 200),
    nullif(p ->> 'number_of_candidates', '')::int,
    left(nullif(trim(p ->> 'compensation_range'), ''), 200),
    left(nullif(trim(p ->> 'job_description'), ''), 10000),
    left(nullif(trim(p ->> 'notes'), ''), 5000)
  ) returning id into v_id;

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values ((select auth.uid()), 'company_lead', v_id, 'company_lead_submitted', '{}'::jsonb);

  return v_id;
end;
$$;

-- ═══ RPC: invite-link banner ("Jane D. invited you") ═════════════════

create or replace function public.referrer_display_name(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(trim(coalesce(pr.first_name, '') || ' ' || coalesce(left(pr.last_name, 1) || '.', '')), '')
  from public.profiles pr
  where pr.id = p_id and pr.role in ('referral_partner', 'admin') and pr.is_active;
$$;

-- Function execute permissions
revoke execute on function public.set_my_role(public.user_role) from public, anon;
revoke execute on function public.submit_referral(jsonb, uuid) from public, anon;
revoke execute on function public.apply_to_job(uuid, jsonb) from public, anon;
grant execute on function public.set_my_role(public.user_role) to authenticated;
grant execute on function public.submit_referral(jsonb, uuid) to authenticated;
grant execute on function public.apply_to_job(uuid, jsonb) to authenticated;
grant execute on function public.submit_company_lead(jsonb) to anon, authenticated;
grant execute on function public.referrer_display_name(uuid) to anon, authenticated;

-- ═══ Row level security ══════════════════════════════════════════════

alter table public.admin_allowlist     enable row level security;
alter table public.profiles            enable row level security;
alter table public.candidates          enable row level security;
alter table public.candidate_notes     enable row level security;
alter table public.referrals           enable row level security;
alter table public.jobs                enable row level security;
alter table public.job_referrals       enable row level security;
alter table public.job_applications    enable row level security;
alter table public.company_leads       enable row level security;
alter table public.payouts             enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.notification_events enable row level security;
alter table public.integrations        enable row level security;

-- admin_allowlist
create policy "allowlist: admin read" on public.admin_allowlist
  for select to authenticated using (public.is_admin());
create policy "allowlist: admin write" on public.admin_allowlist
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles (insert happens via trigger only)
create policy "profiles: self or admin read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: self or admin update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- candidates: only the primary referrer and admins. Duplicate-attempt
-- referrers never see the original record (privacy of ownership).
create policy "candidates: owner or admin read" on public.candidates
  for select to authenticated
  using (primary_referrer_user_id = (select auth.uid()) or public.is_admin());
create policy "candidates: admin write" on public.candidates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- candidate_notes: admin only
create policy "candidate_notes: admin" on public.candidate_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- referrals
create policy "referrals: owner or admin read" on public.referrals
  for select to authenticated
  using (referrer_user_id = (select auth.uid()) or public.is_admin());
create policy "referrals: admin write" on public.referrals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- jobs: public + open jobs for everyone; plus jobs you've touched; admins all
create policy "jobs: public read" on public.jobs
  for select to anon, authenticated
  using (
    (is_public and status in ('open', 'paused'))
    or public.is_admin()
    or exists (select 1 from public.job_applications a
               where a.job_id = jobs.id and a.applicant_user_id = (select auth.uid()))
    or exists (select 1 from public.job_referrals jr
               where jr.job_id = jobs.id and jr.referrer_user_id = (select auth.uid()))
  );
create policy "jobs: admin insert" on public.jobs
  for insert to authenticated with check (public.is_admin());
create policy "jobs: admin update" on public.jobs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "jobs: admin delete" on public.jobs
  for delete to authenticated using (public.is_admin());

-- job_referrals
create policy "job_referrals: owner or admin read" on public.job_referrals
  for select to authenticated
  using (referrer_user_id = (select auth.uid()) or public.is_admin());
create policy "job_referrals: admin write" on public.job_referrals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- job_applications
create policy "applications: owner or admin read" on public.job_applications
  for select to authenticated
  using (applicant_user_id = (select auth.uid()) or public.is_admin());
create policy "applications: admin write" on public.job_applications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- company_leads: admin only (public form uses submit_company_lead())
create policy "company_leads: admin" on public.company_leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- payouts: the referrer sees their own; admins manage all
create policy "payouts: owner or admin read" on public.payouts
  for select to authenticated
  using (referrer_user_id = (select auth.uid()) or public.is_admin());
create policy "payouts: admin write" on public.payouts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- activity_logs: admins see all; users see their own actions plus status
-- changes on their own referrals/candidates/applications.
create policy "activity: read" on public.activity_logs
  for select to authenticated
  using (
    public.is_admin()
    or actor_user_id = (select auth.uid())
    or (action = 'status_changed' and entity_type = 'candidate' and exists (
          select 1 from public.candidates c
          where c.id = activity_logs.entity_id and c.primary_referrer_user_id = (select auth.uid())))
    or (action = 'status_changed' and entity_type = 'job_application' and exists (
          select 1 from public.job_applications a
          where a.id = activity_logs.entity_id and a.applicant_user_id = (select auth.uid())))
  );
create policy "activity: insert own" on public.activity_logs
  for insert to authenticated
  with check (actor_user_id = (select auth.uid()) or public.is_admin());

-- notification_events
create policy "notifications: self or admin read" on public.notification_events
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "notifications: admin write" on public.notification_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- integrations
create policy "integrations: admin" on public.integrations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
