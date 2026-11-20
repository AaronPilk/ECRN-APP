-- ECRN 0006 — onboarding quiz, headhunting signals, location search,
-- resumes, contact-import fields, and the Staffing Referrals / Bullhorn sync queue.

-- ═══ Profiles: onboarding answers ═══════════════════════════════════
alter table public.profiles
  add column if not exists intent text check (intent in ('job', 'open', 'refer', 'both')),
  add column if not exists career_status text
    check (career_status in ('actively_looking', 'open_to_offers', 'not_looking')),
  add column if not exists discipline text,
  add column if not exists years_experience text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists relocation text check (relocation in ('yes', 'maybe', 'no')),
  add column if not exists move_motivators text[] not null default '{}',
  add column if not exists current_employer text,
  add column if not exists resume_path text,
  add column if not exists resume_uploaded_at timestamptz,
  add column if not exists resume_builder jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_answers jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_completed_at timestamptz;

-- ═══ Candidates: self-signups, headhunting signals, contact fields ═══
alter table public.candidates
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists current_company text,
  add column if not exists career_status text,
  add column if not exists relocation text,
  add column if not exists move_motivators text[] not null default '{}',
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists is_confidential boolean not null default false,
  add column if not exists resume_path text;

create unique index if not exists candidates_user_id_key
  on public.candidates(user_id) where user_id is not null;

-- ═══ US places (Census Gazetteer, public domain) for city search ═════
create table if not exists public.us_places (
  id bigint primary key,
  name text not null,
  state text not null,
  lat double precision not null,
  lng double precision not null,
  land_sqmi real,
  kind text
);
create index if not exists us_places_name_idx on public.us_places (lower(name) text_pattern_ops);
create index if not exists us_places_state_name_idx on public.us_places (state, lower(name));
alter table public.us_places enable row level security;
create policy "us_places: public read" on public.us_places for select to anon, authenticated using (true);

create or replace function public.search_places(q text, lim int default 8)
returns table (name text, state text, lat double precision, lng double precision)
language sql
stable
set search_path = ''
as $$
  with parts as (
    select trim(split_part(coalesce(q, ''), ',', 1)) as city,
           upper(trim(split_part(coalesce(q, ''), ',', 2))) as st
  )
  select p.name, p.state, p.lat, p.lng
  from public.us_places p, parts
  where length(parts.city) >= 2
    and lower(p.name) like lower(parts.city) || '%'
    and (parts.st = '' or p.state like parts.st || '%')
  order by (lower(p.name) = lower(parts.city)) desc,
           (p.kind = 'city') desc,
           p.land_sqmi desc nulls last
  limit least(greatest(lim, 1), 20);
$$;

create or replace function public.nearest_place(p_lat double precision, p_lng double precision)
returns table (name text, state text)
language sql
stable
set search_path = ''
as $$
  select p.name, p.state
  from public.us_places p
  where p.land_sqmi >= 3
    and p.lat between p_lat - 1 and p_lat + 1
  order by power(p.lat - p_lat, 2) + power((p.lng - p_lng) * cos(radians(p_lat)), 2)
  limit 1;
$$;

grant execute on function public.search_places(text, int) to anon, authenticated;
grant execute on function public.nearest_place(double precision, double precision) to anon, authenticated;

-- ═══ Jobs: coordinates, filled in automatically from city + state ═══
alter table public.jobs
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

create or replace function private.geocode_job()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.location_city is distinct from old.location_city
     or new.location_state is distinct from old.location_state
     or new.location_lat is null then
    select p.lat, p.lng into new.location_lat, new.location_lng
    from public.us_places p
    where lower(p.name) = lower(trim(coalesce(new.location_city, '')))
      and p.state = upper(trim(coalesce(new.location_state, '')))
    order by p.land_sqmi desc nulls last
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_geocode on public.jobs;
create trigger jobs_geocode before insert or update on public.jobs
  for each row execute function private.geocode_job();

-- ═══ Resumes: private storage, one folder per user ═══════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 10485760,
  array[
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'image/jpeg', 'image/png', 'image/heic'
  ]
)
on conflict (id) do nothing;

create policy "resumes: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "resumes: own or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy "resumes: own update" on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "resumes: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ═══ RPC: finish onboarding ══════════════════════════════════════════
-- Sets role from intent, saves answers, and (for job seekers / open-to-move)
-- creates or links the candidate record recruiters work from.
create or replace function public.complete_onboarding(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_intent text := p ->> 'intent';
  v_prof public.profiles;
  v_role public.user_role;
  v_status text;
  v_motivators text[];
  v_candidate_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if v_intent is null or v_intent not in ('job', 'open', 'refer', 'both') then
    raise exception 'Pick what brings you to ECRN';
  end if;

  select * into v_prof from public.profiles where id = v_uid;

  v_role := case
    when v_prof.role = 'admin' then 'admin'::public.user_role
    when v_intent = 'refer' then 'referral_partner'::public.user_role
    else 'candidate'::public.user_role
  end;
  v_status := case v_intent
    when 'job' then 'actively_looking'
    when 'open' then 'open_to_offers'
    when 'both' then coalesce(nullif(p ->> 'career_status', ''), 'actively_looking')
    else 'not_looking'
  end;
  select coalesce(array_agg(x), '{}') into v_motivators
  from jsonb_array_elements_text(coalesce(p -> 'move_motivators', '[]'::jsonb)) x;

  perform set_config('ecrn.allow_role_change', 'on', true);
  update public.profiles set
    role = v_role,
    onboarded = true,
    intent = v_intent,
    career_status = v_status,
    discipline = nullif(trim(p ->> 'discipline'), ''),
    years_experience = nullif(trim(p ->> 'years_experience'), ''),
    location_city = coalesce(nullif(trim(p ->> 'location_city'), ''), location_city),
    location_state = coalesce(nullif(upper(trim(p ->> 'location_state')), ''), location_state),
    location_lat = coalesce(nullif(p ->> 'location_lat', '')::double precision, location_lat),
    location_lng = coalesce(nullif(p ->> 'location_lng', '')::double precision, location_lng),
    relocation = nullif(p ->> 'relocation', ''),
    move_motivators = v_motivators,
    current_employer = nullif(trim(p ->> 'current_employer'), ''),
    resume_path = coalesce(nullif(p ->> 'resume_path', ''), resume_path),
    resume_uploaded_at = case when nullif(p ->> 'resume_path', '') is not null then now() else resume_uploaded_at end,
    onboarding_answers = p,
    onboarding_completed_at = now()
  where id = v_uid
  returning * into v_prof;
  perform set_config('ecrn.allow_role_change', 'off', true);

  if v_intent <> 'refer' then
    select c.id into v_candidate_id from public.candidates c where c.user_id = v_uid limit 1;
    if v_candidate_id is null then
      select c.id into v_candidate_id from public.candidates c
      where c.user_id is null and lower(c.email) = lower(v_prof.email)
      order by c.created_at limit 1;
    end if;

    if v_candidate_id is null then
      insert into public.candidates (
        user_id, first_name, last_name, email, phone, location_city, location_state,
        location_lat, location_lng, current_job_title, current_company, trade, career_status,
        relocation, move_motivators, is_confidential, resume_path, source_type, status, metadata
      ) values (
        v_uid, coalesce(v_prof.first_name, 'Member'), coalesce(v_prof.last_name, ''),
        lower(v_prof.email), v_prof.phone, v_prof.location_city, v_prof.location_state,
        v_prof.location_lat, v_prof.location_lng, v_prof.discipline, v_prof.current_employer,
        v_prof.discipline, v_status, v_prof.relocation, v_motivators,
        v_status = 'open_to_offers', v_prof.resume_path, 'self_signup', 'new',
        jsonb_build_object('years_experience_band', v_prof.years_experience)
      ) returning id into v_candidate_id;
    else
      -- Already in the network (e.g. someone referred them): keep the referrer.
      update public.candidates c set
        user_id = v_uid,
        phone = coalesce(c.phone, v_prof.phone),
        location_city = coalesce(v_prof.location_city, c.location_city),
        location_state = coalesce(v_prof.location_state, c.location_state),
        location_lat = coalesce(v_prof.location_lat, c.location_lat),
        location_lng = coalesce(v_prof.location_lng, c.location_lng),
        current_job_title = coalesce(c.current_job_title, v_prof.discipline),
        current_company = coalesce(v_prof.current_employer, c.current_company),
        trade = coalesce(c.trade, v_prof.discipline),
        career_status = v_status,
        relocation = v_prof.relocation,
        move_motivators = v_motivators,
        is_confidential = (v_status = 'open_to_offers'),
        resume_path = coalesce(v_prof.resume_path, c.resume_path),
        metadata = c.metadata || jsonb_build_object('years_experience_band', v_prof.years_experience)
      where c.id = v_candidate_id;
    end if;
  end if;

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (v_uid, 'profile', v_uid, 'onboarding_completed',
          jsonb_build_object('intent', v_intent, 'career_status', v_status, 'candidate_id', v_candidate_id));

  return jsonb_build_object('role', v_role, 'candidate_id', v_candidate_id);
end;
$$;

-- ═══ RPC: save a resume path (profile + linked candidate) ════════════
create or replace function public.set_my_resume(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_path is not null and split_part(p_path, '/', 1) <> v_uid::text then
    raise exception 'Invalid resume path';
  end if;
  update public.profiles set resume_path = p_path, resume_uploaded_at = case when p_path is null then null else now() end
  where id = v_uid;
  update public.candidates set resume_path = p_path where user_id = v_uid;
end;
$$;

revoke execute on function public.complete_onboarding(jsonb) from public, anon;
revoke execute on function public.set_my_resume(text) from public, anon;
grant execute on function public.complete_onboarding(jsonb) to authenticated;
grant execute on function public.set_my_resume(text) to authenticated;

-- ═══ Referrals: name + phone are the minimum; capture company ════════
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
  v_source text := coalesce(nullif(p ->> 'source', ''), case when p_job_id is null then 'manual' else 'job_link' end);
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(p ->> 'first_name'), '') = '' then
    raise exception 'Add their name';
  end if;
  if length(regexp_replace(coalesce(p ->> 'phone', ''), '\D', '', 'g')) < 10 then
    raise exception 'Add a phone number so Delta can reach them';
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
      current_job_title, current_company, trade, years_experience, linkedin_url, resume_url, notes,
      source_type, primary_referrer_user_id, status
    ) values (
      trim(p ->> 'first_name'), coalesce(trim(p ->> 'last_name'), ''),
      nullif(lower(trim(p ->> 'email')), ''), nullif(trim(p ->> 'phone'), ''),
      nullif(trim(p ->> 'location_city'), ''), nullif(trim(p ->> 'location_state'), ''),
      nullif(trim(p ->> 'current_job_title'), ''), nullif(trim(p ->> 'current_company'), ''),
      nullif(trim(p ->> 'trade'), ''),
      nullif(regexp_replace(coalesce(p ->> 'years_experience', ''), '\D', '', 'g'), '')::int,
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

-- ═══ Account deletion also removes a self-signup candidate record ════
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if public.is_admin() then raise exception 'Admin accounts must be removed by another admin'; end if;

  select email into v_email from public.profiles where id = v_uid;

  delete from public.candidates c
  where c.primary_referrer_user_id is null
    and (c.user_id = v_uid
         or (lower(c.email) = lower(v_email) and c.source_type in ('direct_application', 'self_signup')));

  -- Resume files are removed by the app through the Storage API before this runs.
  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (null, 'profile', v_uid, 'account_deleted', '{}'::jsonb);

  delete from auth.users where id = v_uid;
end;
$$;

-- ═══ Sync queue: everything recruiters need in Bullhorn ══════════════
-- Rows are delivered to Staffing Referrals (→ Bullhorn, → Sense) by the
-- app's dispatcher once a webhook URL is configured.
create table if not exists public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'staffing_referrals',
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists integration_outbox_status_idx on public.integration_outbox (status, created_at);
alter table public.integration_outbox enable row level security;
create policy "outbox: admin read" on public.integration_outbox for select to authenticated using (public.is_admin());
create policy "outbox: admin update" on public.integration_outbox for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function private.enqueue_sync(p_event text, p_entity text, p_id uuid, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.integration_outbox (event_type, entity_type, entity_id, payload)
  values (p_event, p_entity, p_id, p_payload);
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
    new.relocation, new.resume_path, new.user_id, new.is_confidential
  ) is not distinct from (
    old.status, old.first_name, old.last_name, old.email, old.phone, old.current_job_title,
    old.current_company, old.location_city, old.location_state, old.career_status,
    old.relocation, old.resume_path, old.user_id, old.is_confidential
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
                       'years_experience_band', new.metadata ->> 'years_experience_band')
  );
  return new;
end;
$$;

drop trigger if exists candidates_sync on public.candidates;
create trigger candidates_sync after insert or update on public.candidates
  for each row execute function private.sync_candidate();

create or replace function private.sync_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.enqueue_sync(
    'referral.created', 'referral', new.id,
    jsonb_build_object(
      'referral', to_jsonb(new) - 'metadata',
      'referrer', (select jsonb_build_object('id', pr.id, 'first_name', pr.first_name, 'last_name', pr.last_name,
                                             'email', pr.email, 'phone', pr.phone)
                   from public.profiles pr where pr.id = new.referrer_user_id)
    )
  );
  return new;
end;
$$;

drop trigger if exists referrals_sync on public.referrals;
create trigger referrals_sync after insert on public.referrals
  for each row execute function private.sync_referral();

create or replace function private.sync_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  perform private.enqueue_sync(
    case when tg_op = 'INSERT' then 'application.created' else 'application.status_changed' end,
    'job_application', new.id,
    jsonb_build_object(
      'application', to_jsonb(new) - 'metadata',
      'job', (select jsonb_build_object('id', j.id, 'title', j.title, 'external_crm_id', j.external_crm_id)
              from public.jobs j where j.id = new.job_id)
    )
  );
  return new;
end;
$$;

drop trigger if exists job_applications_sync on public.job_applications;
create trigger job_applications_sync after insert or update on public.job_applications
  for each row execute function private.sync_application();

create or replace function private.sync_job_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.enqueue_sync(
    'job_referral.created', 'job_referral', new.id,
    jsonb_build_object(
      'job_referral', to_jsonb(new) - 'metadata',
      'job', (select jsonb_build_object('id', j.id, 'title', j.title, 'external_crm_id', j.external_crm_id)
              from public.jobs j where j.id = new.job_id)
    )
  );
  return new;
end;
$$;

drop trigger if exists job_referrals_sync on public.job_referrals;
create trigger job_referrals_sync after insert on public.job_referrals
  for each row execute function private.sync_job_referral();

create or replace function private.sync_company_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.enqueue_sync('company_lead.created', 'company_lead', new.id, to_jsonb(new) - 'metadata');
  return new;
end;
$$;

drop trigger if exists company_leads_sync on public.company_leads;
create trigger company_leads_sync after insert on public.company_leads
  for each row execute function private.sync_company_lead();

create or replace function private.sync_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.onboarding_completed_at is not null and old.onboarding_completed_at is null then
    perform private.enqueue_sync(
      'member.onboarded', 'profile', new.id,
      to_jsonb(new) - 'metadata' - 'onboarding_answers' - 'resume_builder'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync on public.profiles;
create trigger profiles_sync after update on public.profiles
  for each row execute function private.sync_member();

-- Label a point with the main city around it (e.g. "Orlando", not a small CDP next door).
create or replace function public.nearest_place(p_lat double precision, p_lng double precision)
returns table (name text, state text)
language sql
stable
set search_path = ''
as $$
  (select p.name, p.state from public.us_places p
   where p.kind = 'city'
     and p.lat between p_lat - 0.3 and p_lat + 0.3
     and p.lng between p_lng - 0.35 and p_lng + 0.35
   order by p.land_sqmi desc nulls last
   limit 1)
  union all
  (select p.name, p.state from public.us_places p
   where p.lat between p_lat - 1 and p_lat + 1
   order by power(p.lat - p_lat, 2) + power((p.lng - p_lng) * cos(radians(p_lat)), 2)
   limit 1)
  limit 1;
$$;
