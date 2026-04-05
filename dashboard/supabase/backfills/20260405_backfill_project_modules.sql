insert into public.project_modules (project_id, title, type, "order")
select
  seeded.project_id,
  seeded.title,
  seeded.type,
  seeded.module_order
from (
  select
    projects.id as project_id,
    starter_modules.title,
    starter_modules.type,
    starter_modules.module_order
  from public.projects as projects
  cross join (
    values
      ('Workspace Plan', 'workspace_plan', 1),
      ('Planning / Operations', 'planning_operations', 2),
      ('Tasks / Next Steps', 'tasks', 3),
      ('Timeline', 'timeline', 4),
      ('Assets', 'assets', 5)
  ) as starter_modules(title, type, module_order)
  where not exists (
    select 1
    from public.project_modules as project_modules
    where project_modules.project_id = projects.id
  )
) as seeded
order by seeded.project_id, seeded.module_order;
