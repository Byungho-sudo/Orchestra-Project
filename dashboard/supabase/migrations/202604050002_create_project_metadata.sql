create table if not exists public.project_metadata (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  key text not null,
  value text not null,
  "order" integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists project_metadata_project_id_idx
on public.project_metadata (project_id);

create unique index if not exists project_metadata_project_id_order_idx
on public.project_metadata (project_id, "order");

alter table public.project_metadata enable row level security;

drop policy if exists "Project metadata is readable when parent project is readable"
on public.project_metadata;

create policy "Project metadata is readable when parent project is readable"
on public.project_metadata
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_metadata.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert project metadata"
on public.project_metadata;

create policy "Project owners can insert project metadata"
on public.project_metadata
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_metadata.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update project metadata"
on public.project_metadata;

create policy "Project owners can update project metadata"
on public.project_metadata
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_metadata.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_metadata.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete project metadata"
on public.project_metadata;

create policy "Project owners can delete project metadata"
on public.project_metadata
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_metadata.project_id
      and public.projects.user_id = auth.uid()
  )
);

insert into public.project_metadata (project_id, key, value, "order")
select
  seeded.project_id,
  seeded.key,
  seeded.value,
  seeded.metadata_order
from (
  select
    projects.id as project_id,
    legacy_metadata.key,
    legacy_metadata.value,
    legacy_metadata.metadata_order
  from public.projects as projects
  cross join lateral (
    values
      ('Intention', projects.intention, 1),
      ('Idea', projects.idea, 2),
      ('Target Buyer', projects.target_buyer, 3),
      ('Product', projects.product, 4),
      ('Price', projects.price, 5),
      ('Tools', projects.tools, 6),
      ('Supplier', projects.supplier, 7),
      ('Budget', projects.budget, 8),
      ('Notes', projects.notes, 9)
  ) as legacy_metadata(key, value, metadata_order)
  where btrim(coalesce(legacy_metadata.value, '')) <> ''
    and not exists (
      select 1
      from public.project_metadata
      where public.project_metadata.project_id = projects.id
    )
) as seeded
order by seeded.project_id, seeded.metadata_order;

notify pgrst, 'reload schema';
