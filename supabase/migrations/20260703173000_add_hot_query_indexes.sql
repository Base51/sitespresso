-- Performance indexes for high-traffic query paths

-- Dashboard site listing by owner ordered by freshness.
create index if not exists idx_sites_user_updated_at
  on public.sites (user_id, updated_at desc);

-- Published-site scans (sitemap/audits) constrained to published rows.
create index if not exists idx_sites_published_updated_at
  on public.sites (updated_at desc)
  where status = 'published';

-- Active custom-domain lookup path used by middleware host routing.
create index if not exists idx_sites_custom_domain_active
  on public.sites (custom_domain)
  where custom_domain is not null
    and status = 'published'
    and domain_verified = true
    and domain_attached = true;

-- Fast retrieval of latest active subscription per user.
create index if not exists idx_subscriptions_user_status_updated_at
  on public.subscriptions (user_id, status, updated_at desc);
