create or replace function public.redeem_guest_invite(
  p_code_hash text,
  p_auth_user_id uuid,
  p_display_name text
)
returns table (
  guest_user_id uuid,
  auth_user_id uuid,
  invite_code_id uuid,
  display_name text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invite_codes%rowtype;
  v_existing_guest public.guest_users%rowtype;
  v_matching_guest public.guest_users%rowtype;
  v_display_name text := btrim(p_display_name);
  v_normalized_display_name text := lower(btrim(p_display_name));
begin
  if p_auth_user_id is null then
    raise exception 'guest_auth_required';
  end if;

  if p_code_hash is null or btrim(p_code_hash) = '' then
    raise exception 'invalid_invite_code';
  end if;

  if v_display_name is null or v_display_name = '' then
    raise exception 'invalid_display_name';
  end if;

  if char_length(v_display_name) > 80 then
    raise exception 'invalid_display_name';
  end if;

  select gu.*
  into v_existing_guest
  from public.guest_users as gu
  where gu.auth_user_id = p_auth_user_id
  limit 1;

  if found then
    raise exception 'guest_already_exists';
  end if;

  select ic.*
  into v_invite
  from public.invite_codes as ic
  where ic.code_hash = p_code_hash
  for update;

  if not found then
    raise exception 'invalid_invite_code';
  end if;

  if not v_invite.is_active then
    raise exception 'inactive_invite_code';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'expired_invite_code';
  end if;

  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'invite_code_exhausted';
  end if;

  select gu.*
  into v_matching_guest
  from public.guest_users as gu
  where gu.invite_code_id = v_invite.id
    and lower(btrim(gu.display_name)) = v_normalized_display_name
  order by gu.created_at asc
  limit 1
  for update;

  if found then
    update public.projects as p
    set user_id = p_auth_user_id
    where p.user_id = v_matching_guest.auth_user_id;

    return query
    update public.guest_users as gu
    set auth_user_id = p_auth_user_id,
        display_name = v_display_name,
        last_seen_at = now(),
        updated_at = now()
    where gu.id = v_matching_guest.id
    returning
      gu.id,
      gu.auth_user_id,
      gu.invite_code_id,
      gu.display_name,
      gu.status;

    return;
  end if;

  update public.invite_codes as ic
  set use_count = ic.use_count + 1
  where ic.id = v_invite.id;

  return query
  insert into public.guest_users as gu (
    auth_user_id,
    invite_code_id,
    display_name,
    status,
    last_seen_at
  )
  values (
    p_auth_user_id,
    v_invite.id,
    v_display_name,
    'active',
    now()
  )
  returning
    gu.id,
    gu.auth_user_id,
    gu.invite_code_id,
    gu.display_name,
    gu.status;
end;
$$;

revoke all on function public.redeem_guest_invite(text, uuid, text) from public;
revoke all on function public.redeem_guest_invite(text, uuid, text) from anon;
revoke all on function public.redeem_guest_invite(text, uuid, text) from authenticated;
