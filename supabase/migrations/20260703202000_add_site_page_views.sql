create table if not exists public.site_page_views (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text not null,
  path text not null,
  host text,
  visitor_fingerprint text,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_site_page_views_site_viewed_at
  on public.site_page_views (site_id, viewed_at desc);

create index if not exists idx_site_page_views_slug_viewed_at
  on public.site_page_views (slug, viewed_at desc);

create index if not exists idx_site_page_views_viewed_at
  on public.site_page_views (viewed_at desc);

create or replace function public.log_site_page_view(
  p_site_id uuid,
  p_slug text,
  p_path text,
  p_host text,
  p_visitor_fingerprint text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_page_views (
    site_id,
    slug,
    path,
    host,
    visitor_fingerprint,
    viewed_at
  )
  values (
    p_site_id,
    p_slug,
    p_path,
    p_host,
    p_visitor_fingerprint,
    now()
  );
end;
$$;

alter table public.site_page_views enable row level security;

drop policy if exists "Owners can read site analytics" on public.site_page_views;
create policy "Owners can read site analytics" on public.site_page_views
  for select
  using (
    exists (
      select 1
      from public.sites
      where sites.id = site_page_views.site_id
        and sites.user_id = auth.uid()
    )
  );
