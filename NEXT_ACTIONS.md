# SiteSpresso — Next Actions

> Last reconciled: 2026-09-25 against `main` @ `005004c`. Status context: [ROADMAP.md](ROADMAP.md). Working rules: [AGENTS.md](AGENTS.md).

Ordered list of small follow-up PRs. Each one gets its own feature branch and PR against `main`. After each merge, update this file and [ROADMAP.md](ROADMAP.md).

---

## 1. ✅ Done: removed the dead admin "View JSON" link and fixed the admin billing runbook

- **Done in:** the `fix/admin-billing-dead-link` PR (2026-09-25).
- **What changed:** the "View JSON" button in `app/admin/billing/page.tsx` pointed at `GET /api/admin/billing/duplicates`, which was removed in `f21df91`. The button is gone, and [docs/ADMIN_BILLING_OPERATIONS.md](docs/ADMIN_BILLING_OPERATIONS.md) now describes the endpoint as history. Data fetching and billing behaviour are unchanged: the page still renders the report through `buildBillingDuplicatesReport()`.
- **Leftovers (tracked elsewhere):** the endpoint appeared in the committed build logs (`build-*.txt`), which item 4 has since untracked. `requireAdminSession()` in `lib/admin/guards.ts` was kept and is now used by the admin-gated debug route (item 3).

## 2. ✅ Done: Vitest unit tests for pure functions, run in CI (Q-101 partially addressed)

- **Done in:** the `test/vitest-unit-tests` PR (2026-09-25).
- **What changed:** Vitest 4.1 (`vitest.config.ts`, with the `@/` alias mirrored from `tsconfig.json`) and `npm test` / `npm run test:watch`. The suite runs as a step in `.github/workflows/build-verify.yml`. Tests live in `tests/unit/`, need no secrets or network, and use obviously fake Stripe price IDs via `vi.stubEnv`. App code is unchanged.
- **Covered:**
  - `lib/slug.ts`: `generateSlug`, `isReservedSlug`, and `findUniqueSlug` collision/limit logic, with the Supabase client mocked.
  - `lib/billing/site-limits.ts` and `lib/billing/plans.ts` (`normalizePlan`, `formatPlanPrice`, `mergePlanPricing`).
  - `lib/stripe.ts` price/plan mapping: `planFromPriceId`, `billingIntervalFromPriceId`, `planFromStripeStatus`, price-config helpers, type guards.
  - `lib/domains.ts` validation and `lib/i18n/languages.ts` `normalizeLanguage`.
- **Not covered (Q-101/Q-102 remainder):**
  - quota calculation per tier;
  - tier upgrade/downgrade transitions and webhook handling;
  - coverage targets;
  - the `/api/generate` retry logic, which is internal to the route and not exported;
  - Stripe sandbox integration tests (Q-102).
- **Edge-case records:** `scripts/test-slug-edge-cases.mjs`, which copied the slug logic, was deleted. `npm run test:edges` now runs the real-module slug suite (`tests/unit/slug.test.ts`). For T-084.2–T-084.4 (slug conflicts, the 10-attempt limit, sanitisation), the automated tests replace the manual "code verified" records. T-084.1 is covered at the function level, and the publish-route error message isn't tested. T-085–T-087 (auth, webhook idempotency, generation-failure UX) are still unrecorded manual checks.
- **Suspected bugs found (see item 8):** all fixed. 8.1 was the Agency site limit, 8.2 slug generation.

## 3. ✅ Done: `app/api/debug/subscription` restricted to admins (option b)

- **Done in:** the `fix/admin-gate-debug-subscription` PR (2026-09-25), after the owner chose option (b).
- **What changed:** `GET /api/debug/subscription` (added in `b1f501a`) used to return the caller's plan/subscription rows plus the configured Agency Stripe price env values to **any signed-in user**. It now calls `requireAdminSession()` (`lib/admin/guards.ts`) before reading anything else:
  - 401 when not signed in
  - 403 when signed in but not on the `ADMIN_ALLOWLIST_EMAILS` allowlist
  - 500 "Admin allowlist is not configured." when the allowlist is empty (fails closed)
- The admin response body is unchanged. Per the owner's instruction, the env echo was kept for admins rather than dropped. Responses are `Cache-Control: no-store` and the route is `force-dynamic`. Unexpected errors now return a generic `Internal error` (details go to the server log) instead of the raw exception message.
- **No middleware change:** the middleware matcher already excludes `/api`, and auth is enforced inside the route.

## 4. ✅ Done: untracked Supabase CLI temp state, build logs and Lighthouse JSON (security hygiene)

- **Done in:** the `chore/untrack-temp-and-logs` PR (2026-09-25). No history rewrite.
- **What changed:** 27 files removed from the tree with `git rm --cached` (local copies are unaffected) and ignore patterns added so they aren't committed again:
  - `supabase/.temp/*` and `templates/nextjs-app/supabase/.temp/*` (9 files each): Supabase CLI project linkage metadata.
  - `build-final.txt`, `build-output.txt`, `build-test-prev.txt`, `build-test-revert.txt`, `build-with-lucide.txt`, `dev-output.txt`, `vercel-build-log.txt`: ad-hoc local build/dev logs.
  - `.lighthouse-home.json`, `.lighthouse-prod-home.json`: raw Lighthouse reports. The scores stay recorded in [docs/tasks.md](docs/tasks.md) (T-080).
- **Ignore patterns:** root `.gitignore` gained `**/supabase/.temp/`, `/build-*.txt`, `/dev-output.txt`, `/vercel-build-log.txt` and `/.lighthouse-*.json`. `templates/nextjs-app/.gitignore` gained `supabase/.temp/`. `supabase/migrations/`, `supabase/config.toml` and `docs/perf-history/*.csv` are not ignored.
- **Kept:** `docs/perf-history/*.csv`, which `scripts/perf-window.ts` writes and `scripts/perf-window-report.ts` reads as an intended artifact. No code, script, workflow or `package.json` entry read any of the removed files.
- **Still in git history:** the removed files' contents remain readable in the public repository's history, because history was not rewritten (owner decision). The linkage metadata includes the project ref/name, organisation id/slug, service versions and a connection-pooler URL. The committed pooler URL has a username and host but no password, and a pattern scan of the removed files found no API keys, JWTs, webhook secrets or passwords. As a precaution, the owner may want to review the database credentials and decide whether rotating the database password is warranted. Rotating credentials is the effective fix if anything sensitive is ever found in history. Untracking alone doesn't remove it.

## 5. ✅ Done: closed PR #2 as superseded

- Draft PR #2, "Install Vercel Speed Insights" (vercel[bot], `@vercel/speed-insights` ^1.1.0), was closed on 2026-09-25 with the owner's approval. `main` already has ^2.0.0 wired in `app/layout.tsx` (T-094).

## 6. T-090 — separate production Supabase project (requires owner approval)

- **Goal:** Complete the deferred T-090 before any remaining re-open trigger fires: first external paying customer, broad public sign-up, or risky migrations. The earlier "before a `v1.0.0` release candidate" trigger is stale: the `v1.0.1` tag (2026-06-26 release commit) neither completed nor revoked T-090 (owner-confirmed 2026-09-25). T-090 is still conditional. See [docs/SUPABASE_PROD_ISOLATION_AUDIT_2026-06-25.md](docs/SUPABASE_PROD_ISOLATION_AUDIT_2026-06-25.md) and [ROADMAP.md](ROADMAP.md).
- **Files:** mainly Vercel/Supabase configuration (not in the repo), then runbook/doc updates.
- **Risk:** **High.** It changes production environment variables and the data plane. **Owner approval required.** Don't start without an explicit go-ahead and a rollback plan.
- **Verify:** `npm run test:supabase-isolation`; production login, dashboard, billing webhook and custom-domain checks per the audit's exit criteria.

## 7. (Low priority) Decide whether `app.sitespresso.com` should redirect to the apex

- **Goal:** `app.sitespresso.com` currently returns HTTP 200 without a redirect. It's served through the verified `*.sitespresso.com` wildcard, and robots metadata points to `sitespresso.com` as canonical. **No decision has been made.** Options: leave as is, or add a 301 from `app.` to `https://sitespresso.com`.
- **Files:** probably none in the repo (Vercel domain / redirect configuration). A code alternative would touch `middleware.ts`.
- **Risk:** Low–medium. It's a DNS/Vercel configuration change, so it **requires owner approval**.
- **Verify:** `curl -sI https://app.sitespresso.com` shows the chosen behaviour; `https://sitespresso.com` and published subdomains are unaffected.

---

## 9. ✅ Done: app side merged (PR #11, `005004c`); migration applied on production (2026-09-25)

- **Merged:** PR #11 as merge commit `005004c` (2026-09-25, owner-approved, including the checkout change under AGENTS.md rule 5). Branch was `fix/rls-plan-and-site-inserts`. Plan, SQL, access matrix, rollback and apply steps: [docs/RLS_PLAN_AND_SITE_INSERTS.md](docs/RLS_PLAN_AND_SITE_INSERTS.md).
- **Why:** the `for all` policies "Own profile" and "Own sites" let a signed-in user set `profiles.plan = 'agency'` (unlimited sites plus the agency generation quota) and insert `sites` rows past the limit.
- **App side (safe to deploy first):** new `POST /api/sites` (limit check, then service-role insert), `SitePreview` uses it, checkout writes `stripe_customer_id` with the service role.
- **Database side:** grants-only migration `20260925150000_restrict_client_billing_and_site_inserts.sql`. **Applied on production 2026-09-25 at about 16:53 PT** from the Supabase SQL Editor, after the owner said "Apply migration" and a new draft had saved on production.
- **Post-check:** the three queries in the plan doc matched: 22 table-level grant rows (no INSERT on `profiles` or `sites`, no table-level UPDATE on `profiles`, owner UPDATE on `sites` kept), `authenticated` can update only `email`, `full_name` and `style_presets`, and the three RLS policies are unchanged.
- **QA post-migration retest: PASS** on a Free throwaway account: draft save, account name change, style preset save, and the dashboard still shows the 1/1 limit. The checkout test was skipped by the owner's decision, so no Stripe customer was created.
- **Migration history:** Supabase's migration history does **not** record this migration, because it was run from the SQL Editor. A later `supabase db push` would re-run it; that is harmless because it only revokes and grants.
- **Follow-up (not in scope):** owners can still UPDATE any column on their own `sites` rows, including `status`, so a client could publish without the publish route.
- **Out of scope, noted:** `templates/nextjs-app/supabase/migrations/` has the same weak policies; no DB-level race protection on the site count.

## Owner confirmations (resolved 2026-09-25)

- **Stripe price IDs:** all six tier price IDs are configured in Vercel Production (owner-confirmed).
- **T-084–T-087 manual edge-case tests:** asserted, execution unrecorded. There's no record of the manual runs, which doesn't prove they never happened. Follow-up is in item 2 above.
- **Production URL:** `https://sitespresso.com` is canonical. `app.sitespresso.com` also serves the app through the `*.sitespresso.com` wildcard, with canonical metadata pointing to the apex. Optional follow-up is in item 7.
- **T-090:** still conditional. The `v1.0.0` release-candidate trigger is stale; the other re-open triggers remain (item 6).

## 8. ✅ Done: fixed the bugs found by the unit tests

These were found while writing the item 2 tests. Both fixes were owner-approved. No tests remain skipped or todo.

- **8.1 ✅ Done: Agency site limit** (owner-approved billing-behaviour fix, `fix/agency-unlimited-sites` PR, 2026-09-25).
  - **The bug:** `lib/billing/site-limits.ts` maps `agency` to `null` (unlimited), but `resolveSiteLimit()` returned `SITE_LIMIT_BY_PLAN[plan] ?? 1`. Because `null ?? 1` is `1`, Agency was limited to 1 site.
  - **The fix:** it now returns the configured value whenever the plan has an entry, so `null` means unlimited. Unknown or missing plans still normalise to `free` (1 site), and Free/Starter/Pro (1/1/3) are unchanged.
  - **Callers:** `/api/generate`, `components/SitePreview.tsx` and `components/DashboardContent.tsx` already handled `null`, so none needed changing.
  - **Database:** no migration, RLS policy or trigger limits sites per user, so no data migration is needed. Existing Agency accounts can create more sites as soon as this deploys.
  - **Tests:** the 3 skipped tests are re-enabled and extended in `tests/unit/site-limits.test.ts`.
- **8.2 ✅ Done: slug generation** (owner-approved, `fix/slug-generation` PR, 2026-09-25). Only new slugs are affected: existing sites keep their slugs, and no database rewrite or migration was done.
  - The pure helpers moved to the client-safe `lib/slug-format.ts`. `lib/slug.ts` re-exports them and keeps `findUniqueSlug()`.
  - **Accents:** transliterated via NFKD plus stripping combining marks, with explicit mappings for ß/æ/ø/œ/ł/đ/ð/þ and similar ("Café Lisboa" → `cafe-lisboa`, "São Paulo" → `sao-paulo`).
  - **Characters and separators:** output is only `[a-z0-9-]`. Underscores, dots, slashes and similar become hyphens, and there are no leading, trailing or repeated hyphens.
  - **Length:** capped at 63 characters, the DNS label limit. `findUniqueSlug()` and the draft slug in `components/SitePreview.tsx` truncate the base before appending `-N` or the random suffix.
  - **Empty results:** a name with no usable Latin characters (for example Japanese or Cyrillic) gets a deterministic `site-<hash>` fallback. `findUniqueSlug()` now rejects malformed (for example empty) base slugs.
  - **Draft slugs:** `SitePreview` now uses `generateSlug()` instead of its own inline slug logic. Previously an empty name could produce a draft slug with a leading hyphen.
  - **No user slug input:** there's no user-editable slug field. Slugs come only from the business name.
- **8.3 ✅ Done: doc mismatch** (fixed in the same PR; the reserved list and exact-match behaviour are unchanged). [docs/edge-case-test-plan.md](docs/edge-case-test-plan.md) T-084.1 listed "Admin Services", "API Solutions" and "www-something" as reserved examples. They slugify to non-reserved slugs, and only exact matches such as "Admin" or "API" are rejected. It also said there were 25 reserved slugs; there are 27.
