alter table if exists public.project_tasks
add column if not exists due_date timestamptz;

notify pgrst, 'reload schema';
