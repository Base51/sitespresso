alter table public.sites
add column if not exists domain_attached boolean not null default false;
