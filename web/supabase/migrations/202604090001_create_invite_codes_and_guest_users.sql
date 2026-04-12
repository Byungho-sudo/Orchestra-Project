create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  code_prefix text null,
  label text null,
  is_active boolean not null default true,
  max_uses integer null check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invite_codes_active_idx
  on public.invite_codes (is_active);

create index if not exists invite_codes_expires_at_idx
  on public.invite_codes (expires_at);

alter table public.invite_codes enable row level security;

create table if not exists public.guest_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  invite_code_id uuid not null references public.invite_codes(id) on delete restrict,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz null
);

create index if not exists guest_users_auth_user_id_idx
  on public.guest_users (auth_user_id);

create index if not exists guest_users_invite_code_id_idx
  on public.guest_users (invite_code_id);

create index if not exists guest_users_status_idx
  on public.guest_users (status);

alter table public.guest_users enable row level security;

drop trigger if exists set_invite_codes_updated_at on public.invite_codes;
create trigger set_invite_codes_updated_at
before update on public.invite_codes
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_guest_users_updated_at on public.guest_users;
create trigger set_guest_users_updated_at
before update on public.guest_users
for each row
execute function public.set_current_timestamp_updated_at();

drop policy if exists "Users can read own guest profile" on public.guest_users;
create policy "Users can read own guest profile"
on public.guest_users
for select
to authenticated
using (auth.uid() = auth_user_id);
