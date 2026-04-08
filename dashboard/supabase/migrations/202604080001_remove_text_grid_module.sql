delete from public.project_modules
where type = 'text_grid';

drop table if exists public.project_module_text_grid_rows;

alter table public.project_modules
drop constraint if exists project_modules_type_check;

alter table public.project_modules
add constraint project_modules_type_check
check (
  type in (
    'workspace_plan',
    'planning_operations',
    'tasks',
    'timeline',
    'assets',
    'notes',
    'checklist',
    'metrics',
    'links'
  )
);

notify pgrst, 'reload schema';
