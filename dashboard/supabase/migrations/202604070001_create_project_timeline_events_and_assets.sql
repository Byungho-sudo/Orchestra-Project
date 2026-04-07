create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.project_timeline_events (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date,
  description text,
  status text not null default 'planned',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_timeline_events_status_check
    check (status in ('planned', 'in_progress', 'completed', 'blocked')),
  constraint project_timeline_events_date_range_check
    check (end_date is null or end_date >= start_date)
);

create index if not exists project_timeline_events_module_id_order_idx
on public.project_timeline_events (module_id, "order", created_at);

drop trigger if exists set_project_timeline_events_updated_at
on public.project_timeline_events;

create trigger set_project_timeline_events_updated_at
before update on public.project_timeline_events
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.project_timeline_events enable row level security;

drop policy if exists "Timeline events are readable when parent project is readable"
on public.project_timeline_events;

create policy "Timeline events are readable when parent project is readable"
on public.project_timeline_events
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_timeline_events.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert timeline events"
on public.project_timeline_events;

create policy "Project owners can insert timeline events"
on public.project_timeline_events
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_timeline_events.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update timeline events"
on public.project_timeline_events;

create policy "Project owners can update timeline events"
on public.project_timeline_events
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_timeline_events.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_timeline_events.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete timeline events"
on public.project_timeline_events;

create policy "Project owners can delete timeline events"
on public.project_timeline_events
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_timeline_events.project_id
      and public.projects.user_id = auth.uid()
  )
);

create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  name text not null,
  url text,
  description text,
  category text not null default 'other',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_assets_category_check
    check (category in ('document', 'link', 'file', 'image', 'other'))
);

create index if not exists project_assets_module_id_order_idx
on public.project_assets (module_id, "order", created_at);

drop trigger if exists set_project_assets_updated_at
on public.project_assets;

create trigger set_project_assets_updated_at
before update on public.project_assets
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.project_assets enable row level security;

drop policy if exists "Assets are readable when parent project is readable"
on public.project_assets;

create policy "Assets are readable when parent project is readable"
on public.project_assets
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_assets.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert assets"
on public.project_assets;

create policy "Project owners can insert assets"
on public.project_assets
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_assets.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update assets"
on public.project_assets;

create policy "Project owners can update assets"
on public.project_assets
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_assets.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_assets.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete assets"
on public.project_assets;

create policy "Project owners can delete assets"
on public.project_assets
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_assets.project_id
      and public.projects.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
