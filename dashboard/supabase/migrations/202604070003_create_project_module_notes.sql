create table if not exists public.project_module_notes (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  content text not null default '',
  template_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_module_notes_module_id_key unique (module_id)
);

create index if not exists project_module_notes_project_id_idx
on public.project_module_notes (project_id);

create index if not exists project_module_notes_module_id_idx
on public.project_module_notes (module_id);

drop trigger if exists set_project_module_notes_updated_at
on public.project_module_notes;

create trigger set_project_module_notes_updated_at
before update on public.project_module_notes
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.project_module_notes enable row level security;

drop policy if exists "Module notes are readable when parent project is readable"
on public.project_module_notes;

create policy "Module notes are readable when parent project is readable"
on public.project_module_notes
for select
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_notes.project_id
      and (
        public.projects.visibility = 'public'
        or public.projects.user_id = auth.uid()
      )
  )
);

drop policy if exists "Project owners can insert module notes"
on public.project_module_notes;

create policy "Project owners can insert module notes"
on public.project_module_notes
for insert
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_notes.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can update module notes"
on public.project_module_notes;

create policy "Project owners can update module notes"
on public.project_module_notes
for update
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_notes.project_id
      and public.projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_notes.project_id
      and public.projects.user_id = auth.uid()
  )
);

drop policy if exists "Project owners can delete module notes"
on public.project_module_notes;

create policy "Project owners can delete module notes"
on public.project_module_notes
for delete
using (
  exists (
    select 1
    from public.projects
    where public.projects.id = public.project_module_notes.project_id
      and public.projects.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
