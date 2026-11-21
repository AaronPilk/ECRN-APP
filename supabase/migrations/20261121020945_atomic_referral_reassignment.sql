-- Keep primary credit, the candidate, unpaid rewards and the audit entry in
-- one transaction. A failed promotion must never clear the existing primary.
create or replace function public.admin_reassign_primary_referrer(
  p_candidate_id uuid,
  p_referrer_profile_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous uuid;
  v_status public.referral_status;
  v_referral_id uuid;
  v_is_primary boolean;
begin
  if v_actor is null or not coalesce(public.is_admin(), false) then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  -- Serialize two owners reassigning the same candidate at the same time.
  select c.primary_referrer_user_id, c.status
    into v_previous, v_status
    from public.candidates c
    where c.id = p_candidate_id
    for update;
  if not found then
    raise exception 'Candidate not found' using errcode = 'P0002';
  end if;

  -- Credit can only go to a member who actually referred this candidate.
  -- Historical duplicate rows for the same member must not promote twice.
  select r.id, r.is_primary into v_referral_id, v_is_primary
    from public.referrals r
    where r.candidate_id = p_candidate_id
      and r.referrer_user_id = p_referrer_profile_id
    order by r.is_primary desc, r.created_at, r.id
    limit 1
    for update;
  if v_referral_id is null then
    raise exception 'That member has not referred this candidate' using errcode = '22023';
  end if;

  if v_previous = p_referrer_profile_id and v_is_primary then
    return;
  end if;

  update public.referrals
    set is_primary = false
    where candidate_id = p_candidate_id and is_primary and id <> v_referral_id;

  update public.referrals
    set is_primary = true,
        duplicate_status = 'overridden_primary',
        status = v_status
    where id = v_referral_id;

  update public.candidates
    set primary_referrer_user_id = p_referrer_profile_id
    where id = p_candidate_id;

  -- Already-paid rewards keep their original payee and payment history.
  update public.payouts
    set referrer_user_id = p_referrer_profile_id
    where candidate_id = p_candidate_id and status in ('pending', 'approved');

  insert into public.activity_logs(actor_user_id, entity_type, entity_id, action, metadata)
    values (
      v_actor, 'candidate', p_candidate_id, 'primary_referrer_reassigned',
      jsonb_build_object('from', v_previous, 'to', p_referrer_profile_id)
    );
end;
$$;

revoke execute on function public.admin_reassign_primary_referrer(uuid, uuid) from public, anon;
grant execute on function public.admin_reassign_primary_referrer(uuid, uuid) to authenticated;
