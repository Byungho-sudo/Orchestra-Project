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
    'text_grid',
    'notes',
    'checklist',
    'metrics',
    'links'
  )
);

notify pgrst, 'reload schema';
