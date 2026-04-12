alter table if exists public.project_tasks
add column if not exists priority text;

update public.project_tasks
set priority = 'medium'
where priority is null;

alter table if exists public.project_tasks
alter column priority set default 'medium';

alter table if exists public.project_tasks
alter column priority set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_tasks_priority_check'
  ) then
    alter table public.project_tasks
      add constraint project_tasks_priority_check
      check (priority in ('low', 'medium', 'high'));
  end if;
end
$$;

alter table if exists public.project_tasks
add column if not exists status text;

update public.project_tasks
set status = case
  when completed = true then 'completed'
  else 'not_started'
end
where status is null;

alter table if exists public.project_tasks
alter column status set default 'not_started';

alter table if exists public.project_tasks
alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_tasks_status_check'
  ) then
    alter table public.project_tasks
      add constraint project_tasks_status_check
      check (status in ('not_started', 'in_progress', 'completed', 'blocked'));
  end if;
end
$$;

update public.project_tasks
set completed = (status = 'completed'),
    completed_at = case
      when status = 'completed' and completed_at is null then now()
      when status <> 'completed' then null
      else completed_at
    end;

notify pgrst, 'reload schema';
