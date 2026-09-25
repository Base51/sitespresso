# Plan: restrict client billing writes and direct site inserts

Status: **PLAN + PR only. Nothing applied to any database.**
Production apply waits for the owner's explicit message **"Apply migration"**.
Branch: `fix/rls-plan-and-site-inserts`.

## Problem

`supabase/migrations/20260618190000_m2_auth_and_schema.sql` defines:

- `"Own profile"` on `profiles`: `for all`, `using / with check (auth.uid() = id)`
- `"Own sites"` on `sites`: `for all`, `using / with check (auth.uid() = user_id)`

No later migration tightens them. Combined with Supabase's default table grants to
`anon` / `authenticated`, a signed-in user can, from the browser with the public anon key:

1. `update profiles set plan = 'agency'` on their own row (or delete and re-insert it).
   `/api/generate` trusts a stored `agency` plan over Stripe, so this unlocks unlimited sites
   **and** the agency generation quota (real AI spend).
2. `insert into sites` directly, skipping the site-limit check (which only ran in the browser,
   in `components/SitePreview.tsx`).

## Scope (owner-approved, option C)

1. Clients cannot INSERT `profiles` rows or UPDATE billing columns. Billing columns:
   **`plan`**, **`stripe_customer_id`**. Only the Stripe webhook / server (service role) sets them.
2. Clients cannot INSERT into `sites`. Creation goes through `POST /api/sites`, which applies the
   existing limit helpers (Free 1, Starter 1, Pro 3, Agency unlimited) and then inserts with the
   service role.
3. SELECT is unchanged (dashboard, editor, public sites keep working).
4. No other schema changes. No policy/table/column/function changes. No T-090.

## Exact SQL

File: `supabase/migrations/20260925150000_restrict_client_billing_and_site_inserts.sql`

```sql
begin;

revoke insert on table public.profiles from anon, authenticated;

revoke update on table public.profiles from anon, authenticated;
grant update (email, full_name, style_presets) on table public.profiles to authenticated;

revoke insert on table public.sites from anon, authenticated;

commit;
```

Why grants and not policies: RLS policies work on rows, not columns. Column-level `GRANT UPDATE (...)`
is the Postgres way to allow updating some columns but not others. The existing policies stay as they are
and still restrict which **rows** a user can touch.

## Access after the change

`anon` = not signed in. `authenticated` = signed-in user via the anon key (browser or session client).
`service_role` = server routes using `createAdminClient()`; bypasses RLS and grants.

### profiles

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | no (no matching policy) | **no** (was: blocked by RLS only) | **no** | no (no matching policy) |
| authenticated | own row (unchanged) | **no** (was: own row) | **own row, only `email`, `full_name`, `style_presets`** (was: any column) | own row (unchanged, out of scope) |
| service_role | all | all | all | all |

Not client-writable after the change: `plan`, `stripe_customer_id`, `id`, `created_at`
(`referral_code` is a generated column and was never writable).

### sites

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | published sites (unchanged) | **no** | no (no matching policy) | no (no matching policy) |
| authenticated | own sites + published sites (unchanged) | **no** (was: own rows) | own sites (unchanged) | own sites (unchanged) |
| service_role | all | all | all | all |

## Rollback SQL

File: `supabase/rollbacks/20260925150000_restrict_client_billing_and_site_inserts.rollback.sql`
(kept outside `supabase/migrations/` so it is never picked up as a migration).

```sql
begin;

revoke update (email, full_name, style_presets) on table public.profiles from authenticated;
grant insert, update on table public.profiles to anon, authenticated;
grant insert on table public.sites to anon, authenticated;

commit;
```

This restores the Supabase default grants that existed before. It reopens the hole, so only run it
with the owner's approval. The app changes below keep working after a rollback (the server route and
the admin-client checkout write don't depend on the client grants).

## App changes in this PR

| File | Change |
|---|---|
| `app/api/sites/route.ts` (new) | `POST /api/sites`. 401 without a session. `user_id` comes from the session only (a `user_id` in the body is ignored). Calls `createDraftSite`. |
| `lib/sites/create-draft.ts` (new) | Validates `business_name` / `business_type` / `city`; reads plan, latest active subscription and site count with the **session** client; returns 403 (`requiresUpgrade`, `currentPlan`, `siteCount`, `siteLimit`, same shape as `/api/generate`) when the limit is reached; only then gets the **service-role** client and inserts `status: 'draft'`. |
| `lib/billing/effective-plan.ts` (new) | `determineEffectivePlan(storedPlan, priceId)`: same rule as `/api/generate` (stored agency wins, else active paid subscription, else stored plan). `/api/generate` itself is not changed in this PR. |
| `components/SitePreview.tsx` | First draft save calls `POST /api/sites` instead of `supabase.from('sites').insert(...)`. The later `update` of the same draft still uses the browser client (owner UPDATE is kept). The browser-side limit check is removed; the server now enforces it, including subscription plans the old client check ignored. |
| `app/api/billing/checkout/route.ts` | The `stripe_customer_id` write now uses `createAdminClient()` instead of the session client. Without this, checkout for a user with no Stripe customer would silently fail to save the customer id after the migration. No other billing behaviour changes. |
| `scripts/smoke-check.ps1` | The static check "Draft creation enforces per-plan site limits" now looks in `lib/sites/create-draft.ts`, plus a new check that `SitePreview` calls `/api/sites`. |
| `scripts/verify-rls.mjs` | Expectations updated: own site insert **blocked**, own plan / `stripe_customer_id` update **blocked**, profile insert **blocked**, own `full_name` / `style_presets` update **allowed**, own site update **allowed**. Seeding now requires the service role key. **Run only against a non-production project.** |

Unchanged writers that already use the service role: Stripe webhook, `reconcile-billing`, auth callback
profile upsert, `handle_new_user()` trigger (`security definer`).

## Tests

- `tests/unit/effective-plan.test.ts`: plan resolution (stored agency, subscription override, fallbacks).
- `tests/unit/create-draft.test.ts`: fake Supabase clients (no DB, no network). Covers limits
  Free 1 / Starter 1 / Pro 3 / Agency unlimited, subscription-based Pro, 400 on invalid input,
  no service-role call when the limit is reached or the count fails, insert uses the session `user_id`
  even if the body carries another one, status forced to `draft`, session client never inserts.
- Existing `tests/unit/site-limits.test.ts` still pins the per-plan limits.
- No live production DB test is included or implied.

## How it will be applied

Existing practice is the **Supabase SQL Editor** (`supabase/DEPLOYMENT_GUIDE.md`), not the CLI.

1. Merge this PR (owner says "merge") and let Vercel deploy the app. The app changes are safe **before**
   the migration: the server route and admin-client checkout write work with the current grants too.
2. Wait for the owner's message **"Apply migration"**. Nothing is applied before that.
3. In the Supabase SQL Editor for the production project, run the pre-check, then the migration file, then
   the post-check:

   ```sql
   -- pre/post check: which table-level and column-level privileges clients hold
   select grantee, table_name, privilege_type
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name in ('profiles','sites')
     and grantee in ('anon','authenticated')
   order by 1,2,3;

   select grantee, column_name, privilege_type
   from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles'
     and grantee = 'authenticated' and privilege_type = 'UPDATE'
   order by 2;
   ```

   Expected after: no `INSERT` for `anon`/`authenticated` on either table, no table-level `UPDATE` on
   `profiles`, and column-level `UPDATE` only on `email`, `full_name`, `style_presets`.
4. Manual smoke test in production: sign in, create a site (Free: first succeeds, second gets the upgrade
   message), edit and save it, change name on the account page, save a style preset, start a checkout.
5. If anything breaks: run the rollback SQL above (owner approval), then investigate.

## Known limits / follow-ups (not in this PR)

- **Race condition:** two simultaneous create requests could both pass the count check. A database
  constraint or locked function would close it; that is a schema change and out of scope.
- **Profile DELETE** by the owner is still allowed (out of scope). It no longer helps an attacker because
  re-insert is blocked.
- **New `profiles` columns** added later are not client-updatable unless explicitly granted.
- **`templates/nextjs-app/supabase/migrations/`** contains the same weak `for all` policies. Left untouched
  on purpose; needs its own decision.
- `/api/generate` still trusts a stored `agency` plan. That is fine once clients can't write `plan`.
