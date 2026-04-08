create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text not null,
  description text null,
  type text not null check (type in ('bug', 'feature', 'improvement', 'refactor')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null default 'inbox' check (status in ('inbox', 'planned', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_created_at_idx on public.tickets (created_at desc);
create index if not exists tickets_user_id_idx on public.tickets (user_id);

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row
execute function public.set_current_timestamp_updated_at();
