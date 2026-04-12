create or replace function public.recalculate_project_progress_from_milestones(project_id_input bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_milestone_count integer;
  completed_milestone_count integer;
  next_progress integer;
begin
  select count(*)
  into total_milestone_count
  from public.project_timeline_events
  where public.project_timeline_events.project_id = project_id_input;

  select count(*)
  into completed_milestone_count
  from public.project_timeline_events
  where public.project_timeline_events.project_id = project_id_input
    and public.project_timeline_events.status = 'completed';

  if total_milestone_count = 0 then
    next_progress := 0;
  else
    next_progress := round(
      completed_milestone_count::numeric
      / total_milestone_count::numeric
      * 100
    );
  end if;

  insert into public.project_progress (
    project_id,
    progress_percent,
    updated_at
  )
  values (
    project_id_input,
    next_progress,
    now()
  )
  on conflict (project_id) do update
  set
    progress_percent = excluded.progress_percent,
    updated_at = now();
end;
$$;

drop trigger if exists recalculate_project_progress_after_task_change
on public.project_tasks;

drop function if exists public.recalculate_project_progress_from_task_change();

drop function if exists public.recalculate_project_progress(bigint);

create or replace function public.recalculate_project_progress_after_milestone_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_project_progress_from_milestones(old.project_id);
    return old;
  end if;

  perform public.recalculate_project_progress_from_milestones(new.project_id);

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.recalculate_project_progress_from_milestones(old.project_id);
  end if;

  return new;
end;
$$;

drop trigger if exists recalculate_project_progress_after_milestone_change
on public.project_timeline_events;

create trigger recalculate_project_progress_after_milestone_change
after insert or update or delete on public.project_timeline_events
for each row
execute function public.recalculate_project_progress_after_milestone_change();

do $$
declare
  project_row record;
begin
  for project_row in
    select id from public.projects
  loop
    perform public.recalculate_project_progress_from_milestones(project_row.id);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
