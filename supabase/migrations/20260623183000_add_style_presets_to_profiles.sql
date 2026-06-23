alter table public.profiles
add column if not exists style_presets jsonb not null default '[]'::jsonb;
