create table if not exists public.project_modules (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  title text not null,
  type text not null,
  "order" integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists project_modules_project_id_order_idx
on public.project_modules (project_id, "order", created_at);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_modules_type_check'
      and conrelid = 'public.project_modules'::regclass
  ) then
    alter table public.project_modules
    add constraint project_modules_type_check
    check (type in ('text_grid', 'notes', 'checklist', 'metrics', 'links'));
  end if;
end $$;

alter table public.project_modules enable row level security;

drop policy if exists "Project modules are readable when parent project is readable"
on public.project_modules;

create policy "Project modules are readable when parent project is readable"
on public.project_modules
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_modules.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert project modules"
on public.project_modules;

create policy "Project owners can insert project modules"
on public.project_modules
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_modules.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update project modules"
on public.project_modules;

create policy "Project owners can update project modules"
on public.project_modules
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_modules.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_modules.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete project modules"
on public.project_modules;

create policy "Project owners can delete project modules"
on public.project_modules
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_modules.project_id
      and public.projects.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
