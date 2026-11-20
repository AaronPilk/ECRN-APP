-- ECRN 0009 — privacy hardening.

-- 1) A referrer can read the candidate record they created only until that
--    person joins ECRN themselves. After that the record carries the member's
--    own private answers (open to a move, current employer, résumé), so the
--    referrer sees just what they originally submitted (the referral snapshot).
drop policy if exists "candidates: owner or admin read" on public.candidates;
create policy "candidates: referrer until they join, or admin" on public.candidates
  for select to authenticated
  using ((primary_referrer_user_id = (select auth.uid()) and user_id is null) or public.is_admin());

create or replace function public.i_referred_candidate(p_candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.candidates c
    where c.id = p_candidate and c.primary_referrer_user_id = (select auth.uid())
  );
$$;
revoke execute on function public.i_referred_candidate(uuid) from public, anon;
grant execute on function public.i_referred_candidate(uuid) to authenticated;

drop policy if exists "activity: read" on public.activity_logs;
create policy "activity: read" on public.activity_logs
  for select to authenticated
  using (
    public.is_admin()
    or actor_user_id = (select auth.uid())
    or (action = 'status_changed' and entity_type = 'candidate' and public.i_referred_candidate(entity_id))
    or (action = 'status_changed' and entity_type = 'job_application' and exists (
          select 1 from public.job_applications a
          where a.id = activity_logs.entity_id and a.applicant_user_id = (select auth.uid())))
  );

-- 2) Confidential client names and internal notes move to an admin-only table.
--    public.jobs is readable by anyone (it's the public job board), so it must
--    never hold a confidential client name or recruiter notes.
create table public.job_private (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  client_company text,
  internal_notes text,
  updated_at timestamptz not null default now()
);
alter table public.job_private enable row level security;
create policy "job_private: admin" on public.job_private for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.job_private (job_id, client_company, internal_notes)
select id, company_name, internal_notes from public.jobs
on conflict (job_id) do nothing;
update public.jobs set company_name = null where not is_company_public and company_name is not null;
update public.jobs set internal_notes = null where internal_notes is not null;

-- Safety net: whatever writes a client name or notes onto public.jobs, the
-- value is stashed in job_private and removed from the public row unless the
-- job is explicitly marked "company public".
create or replace function private.jobs_protect_client()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.company_name is not null or new.internal_notes is not null then
    insert into public.job_private (job_id, client_company, internal_notes)
    values (new.id, new.company_name, new.internal_notes)
    on conflict (job_id) do update set
      client_company = coalesce(excluded.client_company, public.job_private.client_company),
      internal_notes = coalesce(excluded.internal_notes, public.job_private.internal_notes),
      updated_at = now();
  end if;
  if new.internal_notes is not null or (not new.is_company_public and new.company_name is not null) then
    update public.jobs set
      internal_notes = null,
      company_name = case when is_company_public then company_name else null end
    where id = new.id;
  elsif new.is_company_public and new.company_name is null then
    update public.jobs j set company_name = p.client_company
    from public.job_private p
    where p.job_id = j.id and j.id = new.id and p.client_company is not null;
  end if;
  return null;
end;
$$;
create trigger jobs_z_protect_client
  after insert or update of company_name, is_company_public, internal_notes on public.jobs
  for each row execute function private.jobs_protect_client();
