-- Change a candidate's status and every member-visible mirror atomically.
-- Existing candidate triggers still create placement payouts and sync events.
create or replace function public.admin_update_candidate_status(
  p_candidate_id uuid,
  p_status public.referral_status,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous public.referral_status;
  v_note text := nullif(trim(p_note), '');
  v_label text;
begin
  if v_actor is null or not coalesce(public.is_admin(), false) then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if p_status is null then
    raise exception 'Choose a status' using errcode = '22023';
  end if;
  if length(v_note) > 10000 then
    raise exception 'Keep the note under 10000 characters' using errcode = '22023';
  end if;

  select c.status into v_previous from public.candidates c
    where c.id = p_candidate_id for update;
  if not found then
    raise exception 'Candidate not found' using errcode = 'P0002';
  end if;

  update public.candidates set status = p_status where id = p_candidate_id;
  update public.referrals set status = p_status
    where candidate_id = p_candidate_id and is_primary and status is distinct from p_status;
  update public.job_referrals set status = p_status
    where candidate_id = p_candidate_id and status <> 'duplicate_review' and status is distinct from p_status;

  insert into public.activity_logs(actor_user_id, entity_type, entity_id, action, metadata)
    values (v_actor, 'candidate', p_candidate_id, 'status_changed',
      jsonb_build_object('from', v_previous, 'to', p_status));

  if v_note is not null then
    v_label := case p_status
      when 'submitted' then 'Submitted'
      when 'duplicate_review' then 'Under review'
      when 'new' then 'New'
      when 'contacted' then 'Contacted'
      when 'qualified' then 'Qualified'
      when 'not_qualified' then 'Not a fit'
      when 'submitted_to_job' then 'Submitted to role'
      when 'interviewing' then 'Interviewing'
      when 'offer_stage' then 'Offer stage'
      when 'placed' then 'Placed'
      when 'payout_pending' then 'Payout pending'
      when 'payout_approved' then 'Payout approved'
      when 'payout_paid' then 'Payout paid'
      when 'rejected' then 'Rejected'
      when 'inactive' then 'Inactive'
    end;
    insert into public.candidate_notes(candidate_id, author_user_id, body)
      values (p_candidate_id, v_actor, 'Status → ' || v_label || ': ' || v_note);
    insert into public.activity_logs(actor_user_id, entity_type, entity_id, action)
      values (v_actor, 'candidate', p_candidate_id, 'note_added');
  end if;
end;
$$;

revoke execute on function public.admin_update_candidate_status(uuid, public.referral_status, text) from public, anon;
grant execute on function public.admin_update_candidate_status(uuid, public.referral_status, text) to authenticated;
