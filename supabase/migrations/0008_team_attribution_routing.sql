-- ECRN 0008 — Delta team (account managers + recruiters), sign-up attribution,
-- job ownership, automatic routing to the owning account manager, and the
-- inbound side of the Staffing Referrals / Bullhorn sync.

-- ═══ Team ═══════════════════════════════════════════════════════════
create type public.staff_role as enum ('owner', 'account_manager', 'recruiter');

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null, -- their ECRN login, if any
  first_name text not null,
  last_name text not null default '',
  email text,
  phone text,
  title text,
  staff_role public.staff_role not null default 'recruiter',
  manager_id uuid references public.staff(id) on delete set null,          -- account manager a recruiter reports to
  invite_code text not null check (invite_code ~ '^[A-Za-z0-9]{3,24}$'),   -- ecrn.com/r/CODE and the sign-up "invite code"
  specialties text[] not null default '{}',                                -- e.g. {Electrical,Mechanical}
  territories text[] not null default '{}',                                -- state codes, e.g. {FL,GA}
  external_crm_id text,                                                    -- Bullhorn CorporateUser id
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index staff_invite_code_key on public.staff (upper(invite_code));
create unique index staff_external_crm_id_key on public.staff (external_crm_id) where external_crm_id is not null;
create index staff_manager_idx on public.staff (manager_id);
create index staff_email_idx on public.staff (lower(email));
create trigger staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();
alter table public.staff enable row level security;
create policy "staff: admin" on public.staff for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ═══ Sign-up attribution ════════════════════════════════════════════
alter table public.profiles
  add column if not exists recruited_by_staff_id uuid references public.staff(id) on delete set null,
  add column if not exists signup_source text not null default 'organic'
    check (signup_source in ('organic', 'recruiter', 'member_invite')),
  add column if not exists signup_platform text,   -- web | ios | android
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_platform text;
create index if not exists profiles_recruited_by_idx on public.profiles (recruited_by_staff_id);
create index if not exists profiles_created_at_idx on public.profiles (created_at);

-- Members can't rewrite their own attribution.
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
    new.recruited_by_staff_id := old.recruited_by_staff_id;
    new.signup_source := old.signup_source;
    new.signup_platform := old.signup_platform;
  end if;
  return new;
end;
$$;

-- New accounts: an invite code that matches a recruiter credits that recruiter.
-- A member invite credits the member, and their recruiter gets the network credit.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_invited uuid;
  v_code text := upper(nullif(trim(new.raw_user_meta_data ->> 'invite_code'), ''));
  v_staff uuid;
  v_source text := 'organic';
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

  if v_code is not null then
    select s.id into v_staff from public.staff s where upper(s.invite_code) = v_code and s.is_active limit 1;
  end if;
  if v_staff is not null then
    v_source := 'recruiter';
  elsif v_invited is not null then
    v_source := 'member_invite';
    select p.recruited_by_staff_id into v_staff from public.profiles p where p.id = v_invited;
  end if;

  insert into public.profiles (
    id, email, first_name, last_name, phone, role, onboarded, invited_by,
    recruited_by_staff_id, signup_source, signup_platform
  ) values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case when v_is_admin then 'admin'::public.user_role else 'referral_partner'::public.user_role end,
    v_is_admin,
    v_invited,
    v_staff,
    v_source,
    nullif(left(new.raw_user_meta_data ->> 'platform', 12), '')
  );

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (new.id, 'profile', new.id, 'account_created',
          jsonb_build_object('invited_by', v_invited, 'admin', v_is_admin, 'recruited_by_staff_id', v_staff, 'source', v_source));
  return new;
end;
$$;

-- Who does this code belong to? (shown on the sign-up screen)
create or replace function public.resolve_invite_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v jsonb;
  c text := trim(coalesce(p_code, ''));
begin
  if length(c) < 3 then return null; end if;
  select jsonb_build_object('kind', 'staff', 'code', s.invite_code,
                            'name', trim(s.first_name || ' ' || s.last_name), 'title', s.title)
    into v from public.staff s where upper(s.invite_code) = upper(c) and s.is_active limit 1;
  if v is not null then return v; end if;
  if c ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select jsonb_build_object('kind', 'member', 'code', p.id,
                              'name', trim(coalesce(p.first_name, '') || ' ' || left(coalesce(p.last_name, ''), 1)))
      into v from public.profiles p where p.id = c::uuid and p.is_active;
  end if;
  return v;
end;
$$;
grant execute on function public.resolve_invite_code(text) to anon, authenticated;

-- ═══ Job ownership ══════════════════════════════════════════════════
alter table public.jobs
  add column if not exists account_manager_id uuid references public.staff(id) on delete set null;
create index if not exists jobs_account_manager_idx on public.jobs (account_manager_id);

create table public.job_recruiters (
  job_id uuid not null references public.jobs(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (job_id, staff_id)
);
create index job_recruiters_staff_idx on public.job_recruiters (staff_id);
alter table public.job_recruiters enable row level security;
create policy "job_recruiters: admin" on public.job_recruiters for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ═══ Routing: who owns each person and each application ═════════════
alter table public.candidates
  add column if not exists account_manager_id uuid references public.staff(id) on delete set null,
  add column if not exists recruiter_id uuid references public.staff(id) on delete set null,
  add column if not exists routed_at timestamptz,
  add column if not exists routing_reason text;  -- job_owner | recruiter_attribution | territory | manual | bullhorn
alter table public.job_applications
  add column if not exists account_manager_id uuid references public.staff(id) on delete set null,
  add column if not exists recruiter_id uuid references public.staff(id) on delete set null;
alter table public.job_referrals
  add column if not exists account_manager_id uuid references public.staff(id) on delete set null,
  add column if not exists recruiter_id uuid references public.staff(id) on delete set null;
create index if not exists candidates_account_manager_idx on public.candidates (account_manager_id);
create index if not exists candidates_recruiter_staff_idx on public.candidates (recruiter_id);
create index if not exists job_applications_am_idx on public.job_applications (account_manager_id);
create index if not exists job_applications_rec_idx on public.job_applications (recruiter_id);
create index if not exists job_referrals_am_idx on public.job_referrals (account_manager_id);
create index if not exists job_referrals_rec_idx on public.job_referrals (recruiter_id);

/**
 * Give a candidate an owner, in this order:
 *   1. the account manager who owns the job they applied / were referred to
 *   2. the recruiter who brought them (or the person who referred them) into ECRN
 *   3. an account manager whose territory covers their state (specialty breaks ties)
 * A human or Bullhorn assignment is never overwritten; only a weak territory
 * match gives way to a job owner. No match = stays in the unassigned queue.
 */
create or replace function private.route_candidate(p_candidate uuid, p_job uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.candidates;
  v_am uuid;
  v_rec uuid;
  v_reason text;
  v_sid uuid;
  v_srole public.staff_role;
  v_smgr uuid;
begin
  select * into c from public.candidates where id = p_candidate;
  if not found then return; end if;
  if c.account_manager_id is not null
     and not (p_job is not null and c.routing_reason = 'territory') then
    return;
  end if;

  if p_job is not null then
    select j.account_manager_id into v_am from public.jobs j where j.id = p_job;
    if v_am is not null then v_reason := 'job_owner'; end if;
  end if;
  if v_am is null and c.account_manager_id is not null then
    return; -- nothing better than the existing territory match
  end if;

  if v_am is null then
    select st.id, st.staff_role, st.manager_id into v_sid, v_srole, v_smgr
    from public.staff st
    where st.is_active and st.id = coalesce(
      (select pr.recruited_by_staff_id from public.profiles pr where pr.id = c.user_id),
      (select pr.recruited_by_staff_id from public.profiles pr where pr.id = c.primary_referrer_user_id)
    );
    if v_sid is not null then
      if v_srole = 'recruiter' then
        v_rec := v_sid;
        v_am := v_smgr;
      else
        v_am := v_sid;
      end if;
      v_reason := 'recruiter_attribution';
    end if;
  end if;

  if v_am is null and v_rec is null and c.location_state is not null then
    select st.id into v_am
    from public.staff st
    where st.is_active and st.staff_role = 'account_manager'
      and upper(c.location_state) = any (st.territories)
    order by (exists (
               select 1 from unnest(st.specialties) sp
               where coalesce(c.trade, '') ilike '%' || sp || '%'
                  or coalesce(c.current_job_title, '') ilike '%' || sp || '%'
             )) desc,
             st.created_at
    limit 1;
    if v_am is not null then v_reason := 'territory'; end if;
  end if;

  if v_am is null and v_rec is null then return; end if;

  update public.candidates set
    account_manager_id = coalesce(v_am, account_manager_id),
    recruiter_id = coalesce(recruiter_id, v_rec),
    routed_at = now(),
    routing_reason = v_reason
  where id = p_candidate;

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (null, 'candidate', p_candidate, 'routed',
          jsonb_build_object('account_manager_id', v_am, 'recruiter_id', v_rec, 'reason', v_reason, 'job_id', p_job));
end;
$$;

create or replace function private.candidates_route()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.route_candidate(new.id, null);
  return null;
end;
$$;
-- "z" so it runs after candidates_sync (created event first, then the routed update).
create trigger candidates_z_route after insert on public.candidates
  for each row execute function private.candidates_route();

-- Applications and job referrals go to the account manager who owns the job.
create or replace function private.job_item_route_before()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.account_manager_id is null then
    select j.account_manager_id into new.account_manager_id from public.jobs j where j.id = new.job_id;
  end if;
  if new.recruiter_id is null then
    -- Keep the person's own recruiter when that recruiter is on this account manager's team.
    select c.recruiter_id into new.recruiter_id
    from public.candidates c
    join public.staff s on s.id = c.recruiter_id
    where c.id = new.candidate_id
      and (new.account_manager_id is null or s.manager_id = new.account_manager_id or s.id = new.account_manager_id);
  end if;
  return new;
end;
$$;
create or replace function private.job_item_route_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.route_candidate(new.candidate_id, new.job_id);
  return null;
end;
$$;
create trigger job_applications_a_route before insert on public.job_applications
  for each row execute function private.job_item_route_before();
create trigger job_applications_z_route after insert on public.job_applications
  for each row execute function private.job_item_route_after();
create trigger job_referrals_a_route before insert on public.job_referrals
  for each row execute function private.job_item_route_before();
create trigger job_referrals_z_route after insert on public.job_referrals
  for each row execute function private.job_item_route_after();

-- When a job gets (or changes) its owner, open items that had no owner follow it.
create or replace function private.jobs_owner_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.account_manager_id is distinct from old.account_manager_id and new.account_manager_id is not null then
    update public.job_applications set account_manager_id = new.account_manager_id
      where job_id = new.id and (account_manager_id is null or account_manager_id = old.account_manager_id) and recruiter_id is null;
    update public.job_referrals set account_manager_id = new.account_manager_id
      where job_id = new.id and (account_manager_id is null or account_manager_id = old.account_manager_id) and recruiter_id is null;
  end if;
  return null;
end;
$$;
create trigger jobs_owner_changed after update of account_manager_id on public.jobs
  for each row execute function private.jobs_owner_changed();

-- Admin: assign an owner / recruiter by hand.
create or replace function public.admin_assign(p_entity text, p_id uuid, p_account_manager uuid, p_recruiter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_am uuid := coalesce(p_account_manager, (select s.manager_id from public.staff s where s.id = p_recruiter));
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if p_entity = 'candidate' then
    update public.candidates set account_manager_id = v_am, recruiter_id = p_recruiter,
      routed_at = now(), routing_reason = 'manual' where id = p_id;
  elsif p_entity = 'job_application' then
    update public.job_applications set account_manager_id = v_am, recruiter_id = p_recruiter where id = p_id;
  elsif p_entity = 'job_referral' then
    update public.job_referrals set account_manager_id = v_am, recruiter_id = p_recruiter where id = p_id;
  else
    raise exception 'Unknown entity %', p_entity;
  end if;
  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values ((select auth.uid()), p_entity, p_id, 'assigned',
          jsonb_build_object('account_manager_id', v_am, 'recruiter_id', p_recruiter));
end;
$$;

-- Admin: re-run automatic routing for everyone still unassigned.
create or replace function public.admin_route_unassigned()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  n int := 0;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  for r in
    select c.id,
           coalesce(
             (select a.job_id from public.job_applications a where a.candidate_id = c.id order by a.created_at desc limit 1),
             (select jr.job_id from public.job_referrals jr where jr.candidate_id = c.id order by jr.created_at desc limit 1)
           ) as job_id
    from public.candidates c
    where c.account_manager_id is null
  loop
    perform private.route_candidate(r.id, r.job_id);
    if exists (select 1 from public.candidates c where c.id = r.id and (c.account_manager_id is not null or c.recruiter_id is not null)) then
      n := n + 1;
    end if;
  end loop;
  update public.job_applications a set account_manager_id = j.account_manager_id
    from public.jobs j where j.id = a.job_id and a.account_manager_id is null and j.account_manager_id is not null;
  update public.job_referrals jr set account_manager_id = j.account_manager_id
    from public.jobs j where j.id = jr.job_id and jr.account_manager_id is null and j.account_manager_id is not null;
  return n;
end;
$$;

-- Members: add a recruiter's code after sign-up (e.g. installed from the App Store first).
create or replace function public.claim_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_staff public.staff;
  v_cand uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_staff from public.staff s where upper(s.invite_code) = upper(trim(coalesce(p_code, ''))) and s.is_active limit 1;
  if v_staff.id is null then raise exception 'That code isn''t recognized'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.recruited_by_staff_id is not null) then
    raise exception 'Your account is already linked to a recruiter';
  end if;
  perform set_config('ecrn.allow_role_change', 'on', true);
  update public.profiles set recruited_by_staff_id = v_staff.id,
    signup_source = case when signup_source = 'organic' then 'recruiter' else signup_source end
  where id = v_uid;
  perform set_config('ecrn.allow_role_change', 'off', true);
  select c.id into v_cand from public.candidates c where c.user_id = v_uid limit 1;
  if v_cand is not null then perform private.route_candidate(v_cand, null); end if;
  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (v_uid, 'profile', v_uid, 'invite_code_claimed', jsonb_build_object('staff_id', v_staff.id));
  return jsonb_build_object('name', trim(v_staff.first_name || ' ' || v_staff.last_name));
end;
$$;

revoke execute on function public.admin_assign(text, uuid, uuid, uuid) from public, anon;
revoke execute on function public.admin_route_unassigned() from public, anon;
revoke execute on function public.claim_invite_code(text) from public, anon;
grant execute on function public.admin_assign(text, uuid, uuid, uuid) to authenticated;
grant execute on function public.admin_route_unassigned() to authenticated;
grant execute on function public.claim_invite_code(text) to authenticated;

-- ═══ Outbound sync now carries the owner and recruiter ═══════════════
alter table public.integration_outbox alter column created_at set default clock_timestamp();

create or replace function private.staff_ref(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('ecrnId', s.id, 'name', trim(s.first_name || ' ' || s.last_name),
                            'email', s.email, 'role', s.staff_role, 'bullhornUserId', s.external_crm_id)
  from public.staff s where s.id = p_id;
$$;

create or replace function private.sync_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref jsonb;
begin
  if tg_op = 'UPDATE' and (
    new.status, new.first_name, new.last_name, new.email, new.phone, new.current_job_title,
    new.current_company, new.location_city, new.location_state, new.career_status,
    new.relocation, new.resume_path, new.user_id, new.is_confidential,
    new.account_manager_id, new.recruiter_id
  ) is not distinct from (
    old.status, old.first_name, old.last_name, old.email, old.phone, old.current_job_title,
    old.current_company, old.location_city, old.location_state, old.career_status,
    old.relocation, old.resume_path, old.user_id, old.is_confidential,
    old.account_manager_id, old.recruiter_id
  ) then
    return new;
  end if;

  select jsonb_build_object('id', pr.id, 'first_name', pr.first_name, 'last_name', pr.last_name,
                            'email', pr.email, 'phone', pr.phone)
    into v_ref
  from public.profiles pr where pr.id = new.primary_referrer_user_id;

  perform private.enqueue_sync(
    case when tg_op = 'INSERT' then 'candidate.created' else 'candidate.updated' end,
    'candidate', new.id,
    jsonb_build_object('candidate', to_jsonb(new) - 'metadata', 'referrer', v_ref,
                       'years_experience_band', new.metadata ->> 'years_experience_band',
                       'owner', private.staff_ref(new.account_manager_id),
                       'recruiter', private.staff_ref(new.recruiter_id))
  );
  return new;
end;
$$;

create or replace function private.sync_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event text;
begin
  if tg_op = 'INSERT' then
    v_event := 'application.created';
  elsif new.status is distinct from old.status then
    v_event := 'application.status_changed';
  elsif new.account_manager_id is distinct from old.account_manager_id
     or new.recruiter_id is distinct from old.recruiter_id then
    v_event := 'application.assigned';
  else
    return new;
  end if;
  perform private.enqueue_sync(
    v_event, 'job_application', new.id,
    jsonb_build_object(
      'application', to_jsonb(new) - 'metadata',
      'job', (select jsonb_build_object('id', j.id, 'title', j.title, 'external_crm_id', j.external_crm_id)
              from public.jobs j where j.id = new.job_id),
      'owner', private.staff_ref(new.account_manager_id),
      'recruiter', private.staff_ref(new.recruiter_id)
    )
  );
  return new;
end;
$$;

create or replace function private.sync_job_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.account_manager_id is not distinct from old.account_manager_id
     and new.recruiter_id is not distinct from old.recruiter_id
     and new.status is not distinct from old.status then
    return new;
  end if;
  perform private.enqueue_sync(
    case when tg_op = 'INSERT' then 'job_referral.created' else 'job_referral.updated' end,
    'job_referral', new.id,
    jsonb_build_object(
      'job_referral', to_jsonb(new) - 'metadata',
      'job', (select jsonb_build_object('id', j.id, 'title', j.title, 'external_crm_id', j.external_crm_id)
              from public.jobs j where j.id = new.job_id),
      'owner', private.staff_ref(new.account_manager_id),
      'recruiter', private.staff_ref(new.recruiter_id)
    )
  );
  return new;
end;
$$;
drop trigger if exists job_referrals_sync on public.job_referrals;
create trigger job_referrals_sync after insert or update on public.job_referrals
  for each row execute function private.sync_job_referral();

-- ═══ Inbound: events from Staffing Referrals / Bullhorn ══════════════
create table public.integration_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'staffing_referrals',
  event_type text not null,
  external_id text,                       -- the provider's event id (dedupe)
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (status in ('received', 'applied', 'failed', 'ignored')),
  result jsonb,
  error text,
  received_at timestamptz not null default clock_timestamp(),
  processed_at timestamptz
);
create unique index integration_inbox_dedupe on public.integration_inbox (provider, external_id) where external_id is not null;
create index integration_inbox_status_idx on public.integration_inbox (status, received_at);
alter table public.integration_inbox enable row level security;
create policy "inbox: admin" on public.integration_inbox for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A raw mirror of CRM records (Bullhorn CorporateUser, JobOrder, Candidate,
-- JobSubmission, Placement, ClientCorporation…) so nothing from Bullhorn is lost
-- even before ECRN has a screen for it.
create table public.crm_records (
  provider text not null default 'bullhorn',
  entity_type text not null,
  external_id text not null,
  data jsonb not null default '{}'::jsonb,
  ecrn_table text,
  ecrn_id uuid,
  synced_at timestamptz not null default now(),
  primary key (provider, entity_type, external_id)
);
create index crm_records_ecrn_idx on public.crm_records (ecrn_table, ecrn_id);
alter table public.crm_records enable row level security;
create policy "crm_records: admin" on public.crm_records for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.integrations (provider, status, config) values
  ('staffing_referrals', 'inactive', '{}'::jsonb),
  ('bullhorn', 'inactive', '{}'::jsonb),
  ('sense', 'inactive', '{}'::jsonb)
on conflict (provider) do nothing;
