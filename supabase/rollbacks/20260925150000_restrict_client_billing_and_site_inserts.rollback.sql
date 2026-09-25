-- Rollback for supabase/migrations/20260925150000_restrict_client_billing_and_site_inserts.sql
-- Restores the Supabase default table grants for anon/authenticated on profiles and sites.
-- WARNING: this reopens the hole (clients can set profiles.plan and bypass site limits).
-- Run only with the owner's approval, in the Supabase SQL Editor.

begin;

revoke update (email, full_name, style_presets) on table public.profiles from authenticated;
grant insert, update on table public.profiles to anon, authenticated;
grant insert on table public.sites to anon, authenticated;

commit;
