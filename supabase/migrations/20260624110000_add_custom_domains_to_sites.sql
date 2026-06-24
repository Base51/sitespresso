alter table public.sites
  add column custom_domain text unique,
  add column domain_verified boolean not null default false;
