alter table if exists public.projects
add column if not exists status text;

update public.projects
set status = 'not_started'
where status is null;

alter table if exists public.projects
alter column status set default 'not_started';

alter table if exists public.projects
alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_status_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_status_check
    check (status in ('not_started', 'in_progress', 'blocked', 'completed'));
  end if;
end $$;
