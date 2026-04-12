alter table if exists public.project_tasks
add column if not exists completed_at timestamptz;

update public.project_tasks
set completed_at = now()
where completed = true
  and completed_at is null;

notify pgrst, 'reload schema';
