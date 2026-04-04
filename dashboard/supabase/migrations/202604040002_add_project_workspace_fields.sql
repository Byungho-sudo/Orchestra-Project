alter table if exists public.projects
add column if not exists intention text,
add column if not exists idea text,
add column if not exists target_buyer text,
add column if not exists product text,
add column if not exists price text,
add column if not exists tools text,
add column if not exists supplier text,
add column if not exists budget text,
add column if not exists notes text,
add column if not exists tasks jsonb not null default '[]'::jsonb;

update public.projects
set tasks = '[]'::jsonb
where tasks is null;
