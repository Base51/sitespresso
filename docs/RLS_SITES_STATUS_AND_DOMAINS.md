# Plan: server-only publish status and custom-domain status on `sites`

Status: **PR only. Migration NOT applied to any database.**
Production apply waits for the owner's explicit message **"Apply migration"**.
Branch: `fix/server-only-publish-and-domain-status`. Follows [RLS_PLAN_AND_SITE_INSERTS.md](RLS_PLAN_AND_SITE_INSERTS.md) (PR #11).

## Problem

After PR #11, clients can no longer insert `sites` rows, but the `"Own sites"` policy (`for all`,
`auth.uid() = user_id`) plus the default table-level UPDATE grant still let a signed-in user update
**any column** on their own rows from the browser with the public anon key:

1. `update sites set status = 'published', slug = '<anything>'` skips the paywall check in
   `POST /api/sites/[id]/publish` (Free users get "Billing required before publishing." there). The
   slug also skips the reserved-word and uniqueness logic in `lib/slug.ts`.
2. `update sites set domain_verified = true, domain_attached = true` skips the DNS check and the
   Vercel attach step. Middleware routes a custom domain only when it is verified and attached, so this
   is a data-integrity problem even though Vercel still has to serve the host.

## Scope

1. Clients may UPDATE only `content` and `updated_at` on their own `sites` rows.
2. The publish route and the three custom-domain routes write with the service role, after their
   existing auth, ownership and plan checks, and with an extra `user_id` filter on the write.
3. SELECT, DELETE and the policies are unchanged. No table, column or function changes. No T-090.

## Exact SQL

File: `supabase/migrations/20260928160000_restrict_client_site_status_and_domain_updates.sql`

```sql
begin;

revoke update on table public.sites from anon, authenticated;
grant update (content, updated_at) on table public.sites to authenticated;

commit;
```

## Every writer of `sites`, and what it needs

| Writer | Client | Columns written | After this PR |
|---|---|---|---|
| `components/SitePreview.tsx` (editor autosave) | browser, anon key | `content`, `updated_at` | allowed by the column grant |
| `app/api/sites/[id]/hero-image` (POST and DELETE) | session | `content`, `updated_at` | allowed by the column grant |
| `app/api/sites/[id]/refresh-section` | session | `content`, `updated_at` | allowed by the column grant |
| `app/api/sites/[id]/logo` (POST) | session | `updated_at` | allowed by the column grant |
| `app/api/sites/[id]/logo` (DELETE) | session | storage only, no `sites` write | unaffected |
| `app/api/sites/[id]/delete` | session | DELETE row | unaffected (DELETE grant unchanged) |
| `app/api/sites/[id]/publish` | **moved to service role** | `slug`, `status`, `published_at` | server-only |
| `app/api/sites/[id]/domain` (PATCH) | **moved to service role** | `custom_domain`, `domain_verified`, `domain_attached`, `updated_at` | server-only |
| `app/api/sites/[id]/domain/attach` | **moved to service role** | `domain_attached`, `updated_at` | server-only |
| `app/api/sites/[id]/domain/verify` | **moved to service role** | `domain_verified`, `updated_at` | server-only |
| `POST /api/sites` (`lib/sites/create-draft.ts`) | service role (since PR #11) | INSERT | unaffected |
| Stripe webhook (`checkout.session.completed`, `customer.subscription.deleted`) | service role | `status`, `published_at` | unaffected |

Found with a repo-wide search for `.from('sites')` followed by `.update(` / `.upsert(` in `app/`, `lib/`,
`components/` and `middleware.ts`. No `rpc` call writes `sites` from a client.

## Access after the change

`anon` = not signed in. `authenticated` = signed-in user via the anon key. `service_role` bypasses RLS and grants.

### sites

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | published sites (unchanged) | no (PR #11) | **no** (was: grant, no matching policy) | no matching policy |
| authenticated | own + published (unchanged) | no (PR #11) | **own rows, only `content`, `updated_at`** (was: any column) | own rows (unchanged) |
| service_role | all | all | all | all |

Server-only after the change: `status`, `slug`, `published_at`, `custom_domain`, `domain_verified`,
`domain_attached`, `user_id`, `business_name`, `business_type`, `city`, `id`, `created_at`.

## Rollback SQL

File: `supabase/rollbacks/20260928160000_restrict_client_site_status_and_domain_updates.rollback.sql`

```sql
begin;

revoke update (content, updated_at) on table public.sites from authenticated;
grant update on table public.sites to anon, authenticated;

commit;
```

This reopens the hole, so only run it with the owner's approval. The app changes keep working after a
rollback, because the moved routes use the service role.

## Tests

- `tests/unit/publish-route.test.ts`: Free user gets `requiresBilling` and nothing is written; a paid user
  publishes through the service role with `id` and `user_id` filters, and the session client never writes;
  another user's site returns 403 before any write; signed out returns 401.
- `scripts/verify-rls.mjs`: now expects own `content` updates to work and own `status`, `slug`,
  `published_at`, `custom_domain`, `domain_verified`, `domain_attached` and `business_name` updates to fail.
  **Never run it against production** (it creates and deletes test users). It needs a separate project (T-090).

## How it will be applied

Same as PR #11: Supabase SQL Editor, after the app is deployed.

1. Owner says "merge"; Vercel deploys. The app changes are safe **before** the migration: the moved routes
   work with the current grants too.
2. QA smoke on production with a Free throwaway account: edit and save the draft, then click Publish and
   confirm the billing prompt.
3. Owner says **"Apply migration"**. Nothing is applied before that.
4. In the SQL Editor, run each query on its own (the editor only shows the last result):

   ```sql
   -- pre/post check 1: table-level grants on sites
   select grantee, privilege_type
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'sites'
     and grantee in ('anon','authenticated')
   order by 1,2;

   -- pre/post check 2: column-level UPDATE on sites for authenticated
   select column_name
   from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'sites'
     and grantee = 'authenticated' and privilege_type = 'UPDATE'
   order by 1;

   -- pre/post check 3: policies (must be unchanged)
   select tablename, policyname, cmd from pg_policies
   where schemaname = 'public' and tablename = 'sites'
   order by 1,2;
   ```

   Expected after: check 1 has no UPDATE row for either role (DELETE, REFERENCES, SELECT, TRIGGER,
   TRUNCATE remain; INSERT is already gone since PR #11), so **10 rows**. Check 2 lists exactly
   `content` and `updated_at`. Check 3 is unchanged: `Own sites` (ALL) and `Published sites are public`
   (SELECT).
5. QA retest: draft save, hero image, refresh-section and logo still work; a Free user can't publish from
   the browser; a paid test user (sandbox) can still publish and save a custom domain.

## Known limits (out of scope)

- `templates/nextjs-app/supabase/migrations/` still has the same weak policies.
- The domain "already claimed" check reads with the session client, so it only sees the user's own and
  published sites; the `custom_domain` unique constraint still blocks duplicates.
- Publish checks `profiles.plan`, which is server-only since PR #11. It doesn't re-check the Stripe
  subscription status.
