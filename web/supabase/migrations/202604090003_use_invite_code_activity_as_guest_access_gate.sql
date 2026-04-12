drop policy if exists "Users can read linked invite codes" on public.invite_codes;

create policy "Users can read linked invite codes"
on public.invite_codes
for select
to authenticated
using (
  exists (
    select 1
    from public.guest_users
    where public.guest_users.invite_code_id = public.invite_codes.id
      and public.guest_users.auth_user_id = auth.uid()
  )
);
