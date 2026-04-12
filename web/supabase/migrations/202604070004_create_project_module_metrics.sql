create table if not exists public.project_module_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  name text not null,
  current_value numeric not null,
  target_value numeric,
  unit text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_module_metrics_target_value_check
    check (target_value is null or target_value >= 0)
);

create index if not exists project_module_metrics_module_id_order_idx
on public.project_module_metrics (module_id, "order", created_at);

drop trigger if exists set_project_module_metrics_updated_at
on public.project_module_metrics;

create trigger set_project_module_metrics_updated_at
before update on public.project_module_metrics
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.project_module_metrics enable row level security;

drop policy if exists "Module metrics are readable when parent project is readable"
on public.project_module_metrics;

create policy "Module metrics are readable when parent project is readable"
on public.project_module_metrics
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_metrics.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert module metrics"
on public.project_module_metrics;

create policy "Project owners can insert module metrics"
on public.project_module_metrics
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_metrics.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update module metrics"
on public.project_module_metrics;

create policy "Project owners can update module metrics"
on public.project_module_metrics
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_metrics.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_metrics.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete module metrics"
on public.project_module_metrics;

create policy "Project owners can delete module metrics"
on public.project_module_metrics
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_metrics.project_id
      and public.projects.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
