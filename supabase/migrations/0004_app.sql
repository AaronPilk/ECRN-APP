-- ─────────────────────────────────────────────────────────────────────
-- ECRN — native app support: push device tokens + in-app account deletion
-- (Apple requires apps with sign-up to offer account deletion in-app.)
-- ─────────────────────────────────────────────────────────────────────

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index device_tokens_user_idx on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;

create policy "device_tokens: own or admin read" on public.device_tokens
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "device_tokens: own delete" on public.device_tokens
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Register (or move) a push token to the signed-in user.
create or replace function public.register_device_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(p_token), '') = '' or length(p_token) > 4096 then raise exception 'Invalid token'; end if;
  if p_platform not in ('ios', 'android', 'web') then raise exception 'Invalid platform'; end if;

  insert into public.device_tokens (user_id, token, platform)
  values (v_uid, trim(p_token), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, last_seen_at = now();
end;
$$;

-- Permanently delete the signed-in user's account.
-- Referral records they submitted stay with Delta (contact data belongs to
-- the recruiting pipeline) but are no longer linked to them; their own
-- direct-application candidate record is removed.
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
  where lower(c.email) = lower(v_email)
    and c.source_type = 'direct_application'
    and c.primary_referrer_user_id is null;

  insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata)
  values (null, 'profile', v_uid, 'account_deleted', '{}'::jsonb);

  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.register_device_token(text, text) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.register_device_token(text, text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
