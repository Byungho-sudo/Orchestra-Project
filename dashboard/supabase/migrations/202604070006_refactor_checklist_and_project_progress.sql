alter table if exists public.project_tasks
add column if not exists notes text;

alter table if exists public.project_tasks
add column if not exists "order" integer;

with ranked_project_tasks as (
  select
    id,
    row_number() over (
      partition by module_id
      order by created_at asc, id asc
    ) - 1 as next_order
  from public.project_tasks
)
update public.project_tasks
set "order" = ranked_project_tasks.next_order
from ranked_project_tasks
where public.project_tasks.id = ranked_project_tasks.id
  and public.project_tasks."order" is null;

alter table if exists public.project_tasks
alter column "order" set default 0;

update public.project_tasks
set "order" = 0
where "order" is null;

alter table if exists public.project_tasks
alter column "order" set not null;

alter table if exists public.project_tasks
add column if not exists updated_at timestamptz;

update public.project_tasks
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table if exists public.project_tasks
alter column updated_at set default now();

create index if not exists idx_project_tasks_module_order
on public.project_tasks (module_id, "order", created_at);

drop trigger if exists set_project_tasks_updated_at on public.project_tasks;
create trigger set_project_tasks_updated_at
before update on public.project_tasks
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.project_progress (
  project_id bigint primary key
    references public.projects(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'paused', 'completed', 'cancelled')),
  health text not null default 'on_track'
    check (health in ('on_track', 'at_risk', 'off_track')),
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  confidence integer null
    check (confidence between 0 and 100),
  summary text null,
  last_reviewed_at timestamptz null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_progress_status
on public.project_progress (status);

create index if not exists idx_project_progress_health
on public.project_progress (health);

alter table public.project_progress enable row level security;

drop policy if exists "Project progress is readable when parent project is readable"
on public.project_progress;

create policy "Project progress is readable when parent project is readable"
on public.project_progress
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_progress.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert project progress"
on public.project_progress;

create policy "Project owners can insert project progress"
on public.project_progress
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_progress.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update project progress"
on public.project_progress;

create policy "Project owners can update project progress"
on public.project_progress
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_progress.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_progress.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete project progress"
on public.project_progress;

create policy "Project owners can delete project progress"
on public.project_progress
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_progress.project_id
      and public.projects.user_id = auth.uid()
  )
);

insert into public.project_progress (
  project_id,
  status,
  health,
  progress_percent,
  updated_at
)
select
  public.projects.id,
  case
    when public.projects.status = 'blocked' then 'paused'
    when public.projects.status in ('not_started', 'in_progress', 'completed') then public.projects.status
    else 'not_started'
  end,
  case
    when public.projects.status = 'blocked' then 'off_track'
    else 'on_track'
  end,
  greatest(0, least(100, coalesce(public.projects.progress, 0))),
  now()
from public.projects
on conflict (project_id) do update
set
  status = excluded.status,
  health = coalesce(public.project_progress.health, excluded.health),
  progress_percent = excluded.progress_percent,
  updated_at = now();

drop trigger if exists set_project_progress_updated_at on public.project_progress;
create trigger set_project_progress_updated_at
before update on public.project_progress
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.ensure_project_progress_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_progress (
    project_id,
    status,
    health,
    progress_percent
  )
  values (
    new.id,
    case
      when new.status = 'blocked' then 'paused'
      when new.status in ('not_started', 'in_progress', 'completed') then new.status
      else 'not_started'
    end,
    case
      when new.status = 'blocked' then 'off_track'
      else 'on_track'
    end,
    greatest(0, least(100, coalesce(new.progress, 0)))
  )
  on conflict (project_id) do nothing;

  return new;
end;
$$;

drop trigger if exists ensure_project_progress_after_project_insert on public.projects;
create trigger ensure_project_progress_after_project_insert
after insert on public.projects
for each row
execute function public.ensure_project_progress_row();

create or replace function public.recalculate_project_progress(project_id_input bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_task_count integer;
  completed_task_count integer;
  next_progress integer;
begin
  select count(*)
  into total_task_count
  from public.project_tasks
  where public.project_tasks.project_id = project_id_input;

  select count(*)
  into completed_task_count
  from public.project_tasks
  where public.project_tasks.project_id = project_id_input
    and public.project_tasks.completed = true;

  if total_task_count = 0 then
    next_progress := 0;
  else
    next_progress := round((completed_task_count::numeric / total_task_count::numeric) * 100);
  end if;

  insert into public.project_progress (
    project_id,
    progress_percent
  )
  values (
    project_id_input,
    next_progress
  )
  on conflict (project_id) do update
  set
    progress_percent = excluded.progress_percent,
    updated_at = now();
end;
$$;

create or replace function public.recalculate_project_progress_from_task_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_project_progress(old.project_id);
    return old;
  end if;

  perform public.recalculate_project_progress(new.project_id);

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.recalculate_project_progress(old.project_id);
  end if;

  return new;
end;
$$;

drop trigger if exists recalculate_project_progress_after_task_change on public.project_tasks;
create trigger recalculate_project_progress_after_task_change
after insert or update or delete on public.project_tasks
for each row
execute function public.recalculate_project_progress_from_task_change();

do $$
declare
  project_row record;
begin
  for project_row in
    select id
    from public.projects
  loop
    perform public.recalculate_project_progress(project_row.id);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
