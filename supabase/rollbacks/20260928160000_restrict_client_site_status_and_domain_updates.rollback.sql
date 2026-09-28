-- Rollback for 20260928160000_restrict_client_site_status_and_domain_updates.sql
-- Restores the previous table-level UPDATE grant on sites. This REOPENS the
-- publish-without-paying hole, so only run it with the owner's approval.
-- The app changes keep working after a rollback (the publish and domain routes
-- write with the service role, which does not depend on client grants).

begin;

revoke update (content, updated_at) on table public.sites from authenticated;
grant update on table public.sites to anon, authenticated;

commit;
