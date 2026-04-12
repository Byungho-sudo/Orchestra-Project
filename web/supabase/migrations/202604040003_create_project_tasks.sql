create table if not exists public.project_tasks (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.project_tasks enable row level security;

drop policy if exists "Project tasks are readable when parent project is readable"
on public.project_tasks;

create policy "Project tasks are readable when parent project is readable"
on public.project_tasks
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_tasks.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert project tasks"
on public.project_tasks;

create policy "Project owners can insert project tasks"
on public.project_tasks
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_tasks.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update project tasks"
on public.project_tasks;

create policy "Project owners can update project tasks"
on public.project_tasks
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_tasks.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_tasks.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete project tasks"
on public.project_tasks;

create policy "Project owners can delete project tasks"
on public.project_tasks
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_tasks.project_id
      and public.projects.user_id = auth.uid()
  )
);
