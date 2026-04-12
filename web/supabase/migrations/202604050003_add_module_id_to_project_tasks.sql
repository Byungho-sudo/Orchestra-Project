alter table if exists public.project_tasks
add column if not exists module_id uuid references public.project_modules(id) on delete cascade;

create index if not exists idx_project_tasks_module_id
on public.project_tasks (module_id);

with ranked_checklist_modules as (
  select
    project_modules.id,
    project_modules.project_id,
    row_number() over (
      partition by project_modules.project_id
      order by project_modules."order", project_modules.created_at, project_modules.id
    ) as module_rank
  from public.project_modules
  where project_modules.type in ('checklist', 'tasks')
)
update public.project_tasks
set module_id = ranked_checklist_modules.id
from ranked_checklist_modules
where public.project_tasks.project_id = ranked_checklist_modules.project_id
  and public.project_tasks.module_id is null
  and ranked_checklist_modules.module_rank = 1;

notify pgrst, 'reload schema';
