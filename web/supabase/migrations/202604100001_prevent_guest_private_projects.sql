create or replace function public.create_project_with_default_modules(
  p_name text,
  p_description text,
  p_due_date date,
  p_visibility text default 'public'
)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_project public.projects%rowtype;
  v_user_id uuid;
  v_name text;
  v_description text;
  v_visibility text;
  v_is_guest boolean;
begin
  v_user_id := auth.uid();
  v_name := btrim(coalesce(p_name, ''));
  v_description := nullif(btrim(coalesce(p_description, '')), '');
  v_visibility := lower(coalesce(p_visibility, 'public'));

  if v_name = '' then
    raise exception 'Project name is required'
      using errcode = '23514';
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception 'Invalid project visibility: %', v_visibility
      using errcode = '22023';
  end if;

  if v_visibility = 'private' and v_user_id is null then
    raise exception 'Authentication required for private projects'
      using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.guest_users as gu
    where gu.auth_user_id = v_user_id
  )
  into v_is_guest;

  if v_visibility = 'private' and v_is_guest then
    raise exception 'Guests cannot create private projects'
      using errcode = '42501';
  end if;

  insert into public.projects (
    name,
    description,
    due_date,
    progress,
    user_id,
    visibility,
    status
  )
  values (
    v_name,
    v_description,
    p_due_date,
    0,
    v_user_id,
    v_visibility,
    'not_started'
  )
  returning * into v_project;

  insert into public.project_modules (project_id, title, type, "order")
  values
    (v_project.id, 'Checklist', 'checklist', 1),
    (v_project.id, 'Timeline', 'timeline', 2),
    (v_project.id, 'Assets', 'assets', 3);

  return v_project;
end;
$$;

revoke all on function public.create_project_with_default_modules(text, text, date, text) from public;
grant execute on function public.create_project_with_default_modules(text, text, date, text) to anon;
grant execute on function public.create_project_with_default_modules(text, text, date, text) to authenticated;
grant execute on function public.create_project_with_default_modules(text, text, date, text) to service_role;

notify pgrst, 'reload schema';
