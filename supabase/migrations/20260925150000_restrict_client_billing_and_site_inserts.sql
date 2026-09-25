-- Restrict client writes to billing columns and direct site inserts.
--
-- NOT APPLIED. Production apply waits for the owner's explicit "Apply migration".
-- Plan, access matrix and rollback: docs/RLS_PLAN_AND_SITE_INSERTS.md
-- Rollback SQL: supabase/rollbacks/20260925150000_restrict_client_billing_and_site_inserts.rollback.sql
--
-- Scope: grants only. No policy, table, column or function changes.
-- service_role (webhook, reconcile-billing, checkout, auth callback, POST /api/sites)
-- bypasses these grants and RLS and is unaffected.

begin;

-- profiles: clients may no longer INSERT (prevents delete + re-insert with plan = 'agency').
-- New signups are unaffected: handle_new_user() is SECURITY DEFINER and the auth
-- callback upserts with the service role.
revoke insert on table public.profiles from anon, authenticated;

-- profiles: clients may UPDATE only non-billing columns.
-- Billing columns (plan, stripe_customer_id) become server-only.
revoke update on table public.profiles from anon, authenticated;
grant update (email, full_name, style_presets) on table public.profiles to authenticated;

-- sites: clients may no longer INSERT. Creation goes through POST /api/sites,
-- which enforces the plan's site limit before inserting with the service role.
-- Owner SELECT / UPDATE / DELETE on sites are unchanged.
revoke insert on table public.sites from anon, authenticated;

commit;
