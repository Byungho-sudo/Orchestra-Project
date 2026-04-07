create table if not exists public.project_module_text_grid_rows (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  field1 text not null default '',
  field2 text not null default '',
  field3 text not null default '',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_module_text_grid_rows_module_id_order_idx
on public.project_module_text_grid_rows (module_id, "order", created_at);

drop trigger if exists set_project_module_text_grid_rows_updated_at
on public.project_module_text_grid_rows;

create trigger set_project_module_text_grid_rows_updated_at
before update on public.project_module_text_grid_rows
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.project_module_text_grid_rows enable row level security;

drop policy if exists "Text grid rows are readable when parent project is readable"
on public.project_module_text_grid_rows;

create policy "Text grid rows are readable when parent project is readable"
on public.project_module_text_grid_rows
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_text_grid_rows.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert text grid rows"
on public.project_module_text_grid_rows;

create policy "Project owners can insert text grid rows"
on public.project_module_text_grid_rows
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_text_grid_rows.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update text grid rows"
on public.project_module_text_grid_rows;

create policy "Project owners can update text grid rows"
on public.project_module_text_grid_rows
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_text_grid_rows.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_text_grid_rows.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete text grid rows"
on public.project_module_text_grid_rows;

create policy "Project owners can delete text grid rows"
on public.project_module_text_grid_rows
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_text_grid_rows.project_id
      and public.projects.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
