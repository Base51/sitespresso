-- Restrict which sites columns clients can UPDATE.
--
-- NOT APPLIED. Production apply waits for the owner's explicit "Apply migration".
-- Plan, access matrix and rollback: docs/RLS_SITES_STATUS_AND_DOMAINS.md
-- Rollback SQL: supabase/rollbacks/20260928160000_restrict_client_site_status_and_domain_updates.rollback.sql
--
-- Problem: the "Own sites" policy lets a signed-in user UPDATE any column on their
-- own rows, so a Free user could set status = 'published' (and pick any slug)
-- straight from the browser, skipping the paywall in POST /api/sites/[id]/publish.
-- They could also set domain_verified / domain_attached without the DNS or Vercel
-- checks.
--
-- Scope: grants only. No policy, table, column or function changes.
-- service_role (publish route, domain routes, Stripe webhook) bypasses these
-- grants and RLS and is unaffected.

begin;

-- sites: clients may UPDATE only the editable content and its timestamp.
-- Written by the browser editor (SitePreview) and the session-client routes
-- hero-image, refresh-section and logo.
-- Server-only after this: status, slug, published_at, custom_domain,
-- domain_verified, domain_attached, user_id, business_name, business_type,
-- city, id, created_at.
revoke update on table public.sites from anon, authenticated;
grant update (content, updated_at) on table public.sites to authenticated;

commit;
