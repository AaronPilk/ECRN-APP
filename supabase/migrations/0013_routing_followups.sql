-- ECRN 0013 — follow-ups found while building the admin screens.

-- 1) A hand-off to a recruiter inside the same account manager's team is not a
--    re-route: keep the original reason (job owner / brought them in / territory).
--    Clearing both fields sends the person back to the unassigned queue.
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
    update public.candidates c set
      account_manager_id = v_am,
      recruiter_id = p_recruiter,
      routed_at = case
        when v_am is null and p_recruiter is null then null
        when c.account_manager_id is distinct from v_am or c.routed_at is null then now()
        else c.routed_at end,
      routing_reason = case
        when v_am is null and p_recruiter is null then null
        when c.account_manager_id is not distinct from v_am and c.routing_reason is not null then c.routing_reason
        else 'manual' end
    where c.id = p_id;
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

-- 2) When a job gets an owner, the people who applied or were referred to it
--    (and still have no owner) follow, not just the applications.
create or replace function private.jobs_owner_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if new.account_manager_id is distinct from old.account_manager_id and new.account_manager_id is not null then
    update public.job_applications set account_manager_id = new.account_manager_id
      where job_id = new.id and (account_manager_id is null or account_manager_id = old.account_manager_id) and recruiter_id is null;
    update public.job_referrals set account_manager_id = new.account_manager_id
      where job_id = new.id and (account_manager_id is null or account_manager_id = old.account_manager_id) and recruiter_id is null;
    for r in
      select distinct c.id
      from public.candidates c
      where (c.account_manager_id is null or c.routing_reason = 'territory')
        and (exists (select 1 from public.job_applications a where a.candidate_id = c.id and a.job_id = new.id)
          or exists (select 1 from public.job_referrals jr where jr.candidate_id = c.id and jr.job_id = new.id))
    loop
      perform private.route_candidate(r.id, new.id);
    end loop;
  end if;
  return null;
end;
$$;

-- 3) Whoever changes a candidate's status (admin screen, Bullhorn sync, SQL),
--    the referrer's copy follows. Once a referred person joins ECRN the
--    referral row is the only status their referrer can see.
create or replace function private.candidate_status_mirror()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    update public.referrals r set status = new.status
      where r.candidate_id = new.id and r.is_primary and r.status is distinct from new.status;
    update public.job_referrals jr set status = new.status
      where jr.candidate_id = new.id and jr.status <> 'duplicate_review' and jr.status is distinct from new.status;
  end if;
  return null;
end;
$$;
drop trigger if exists candidates_status_mirror on public.candidates;
create trigger candidates_status_mirror after update of status on public.candidates
  for each row execute function private.candidate_status_mirror();

-- 4) Members can read payout notes on their Earnings screen, so the automatic
--    "set the amount" reminder for admins moves to metadata.
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

    insert into public.payouts (candidate_id, referrer_user_id, job_id, amount_cents, status, placement_date, metadata)
    values (
      new.id, new.primary_referrer_user_id, v_job, coalesce(v_amount, 0), 'pending', current_date,
      jsonb_build_object('needs_amount', v_amount is null)
    );
  end if;
  return new;
end;
$$;
update public.payouts set notes = null, metadata = metadata || '{"needs_amount": true}'::jsonb
  where notes = 'Set the payout amount for this placement.';
