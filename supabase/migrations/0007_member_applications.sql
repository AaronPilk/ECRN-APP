-- ECRN 0007 — one member experience: applications link to the member's
-- account and carry their profile (resume, location, career signals).

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

  select c.id into v_candidate_id from public.candidates c where c.user_id = v_uid limit 1;
  if v_candidate_id is null then
    select c.id into v_candidate_id from public.candidates c
    where lower(c.email) = lower(v_email)
    order by c.created_at limit 1;
  end if;

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

  -- Link the record to the member's account so their profile (resume,
  -- location, career signals) follows every application into Bullhorn.
  update public.candidates c set
    user_id = coalesce(c.user_id, v_uid),
    resume_path = coalesce(c.resume_path, pr.resume_path),
    location_lat = coalesce(c.location_lat, pr.location_lat),
    location_lng = coalesce(c.location_lng, pr.location_lng),
    career_status = coalesce(c.career_status, pr.career_status),
    relocation = coalesce(c.relocation, pr.relocation),
    current_company = coalesce(c.current_company, pr.current_employer),
    is_confidential = c.is_confidential or coalesce(pr.career_status = 'open_to_offers', false)
  from public.profiles pr
  where c.id = v_candidate_id and pr.id = v_uid
    and not exists (select 1 from public.candidates x where x.user_id = v_uid and x.id <> c.id);

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

-- Product tour: shown once after onboarding, replayable from Profile.
alter table public.profiles add column if not exists tour_completed_at timestamptz;
