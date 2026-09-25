# SiteSpresso — Next Actions

> Last reconciled: 2026-09-25 against `main` @ `50b7d24`. Status context: [ROADMAP.md](ROADMAP.md). Working rules: [AGENTS.md](AGENTS.md).

Ordered list of small follow-up PRs. Each one gets its own feature branch and PR against `main`. After each merge, update this file and [ROADMAP.md](ROADMAP.md).

---

## 1. ✅ Done: removed the dead admin "View JSON" link and fixed the admin billing runbook

- **Done in:** the `fix/admin-billing-dead-link` PR (2026-09-25).
- **What changed:** the "View JSON" button in `app/admin/billing/page.tsx` pointed at `GET /api/admin/billing/duplicates`, which was removed in `f21df91`. The button is gone, and [docs/ADMIN_BILLING_OPERATIONS.md](docs/ADMIN_BILLING_OPERATIONS.md) now describes the endpoint as history. Data fetching and billing behaviour are unchanged: the page still renders the report through `buildBillingDuplicatesReport()`.
- **Leftovers (tracked elsewhere):** the endpoint appeared in the committed build logs (`build-*.txt`), which item 4 has since untracked. `requireAdminSession()` in `lib/admin/guards.ts` was kept and is now used by the admin-gated debug route (item 3).

## 2. Add Vitest unit tests for pure functions and run them in CI (Q-101)

- **Goal:** There is no unit-test framework today. Add Vitest and test pure functions **without changing their behaviour**:
  - `lib/slug.ts` (`generateSlug`, `isReservedSlug`)
  - `lib/billing/site-limits.ts` (`resolveSiteLimit`, `isSiteLimitReached`, `getSiteLimitMessage`)
  - `lib/billing/plans.ts` (`normalizePlan`, `mergePlanPricing`, `formatPlanPrice`)
  - `lib/stripe.ts` (`planFromPriceId`, `billingIntervalFromPriceId`, `planFromStripeStatus`), using stubbed env vars with fake IDs.
  - `lib/domains.ts` validation helpers.
- Add an `npm test` script and a CI step (for example in `.github/workflows/build-verify.yml`).
- **Files:** `package.json`, `package-lock.json`, new `vitest.config.ts`, new `tests/**` (or `*.test.ts`), one workflow file.
- **Risk:** Low. It adds dev dependencies and a CI step. The billing modules are only read by tests, not modified. If a test exposes a bug, report it rather than fixing billing logic in the same PR (billing changes need owner approval).
- **Verify:** `npm test` passes locally and in CI; `npm run build` is unaffected.
- **Manual edge-case checks (T-084–T-087):** their status is *asserted, execution unrecorded* (see [ROADMAP.md](ROADMAP.md)). Either re-run the manual checklist in [docs/edge-case-test-execution.md](docs/edge-case-test-execution.md) and record the date, environment and pass/fail for each case in `docs/`, or replace the cases that can be automated (slug generation/reserved slugs, webhook signature rejection, rate-limit responses) with Vitest tests in this item and record the rest manually. Checks that touch Stripe must use test mode only.
- **Also fixes these test gaps:**
  - `scripts/test-slug-edge-cases.mjs` (`npm run test:edges`) copies the slug logic instead of importing `lib/slug.ts`, so it can drift from real code. Its "retry logic" checks assert constants against themselves. It isn't in CI. Replace it with Vitest tests, or make it import the real module.
  - Most `test:*` scripts are PowerShell (`pwsh`) or `tsx` scripts that check file contents/presence (`scripts/smoke-check.ps1`) or need cloud credentials (multipage/analytics/custom-domain QA, perf budget). They're skipped in CI via `test:reliability:ci`. They aren't a substitute for unit tests.

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

## 5. Close PR #2 as superseded

- **Goal:** Draft PR #2, "Install Vercel Speed Insights" (vercel[bot]), adds `@vercel/speed-insights` ^1.1.0. `main` already has ^2.0.0 wired in `app/layout.tsx` (T-094).
- **Files:** none (GitHub action only).
- **Risk:** None. **Owner to confirm** before closing.
- **Verify:** PR #2 closed with a comment pointing to `app/layout.tsx` on `main`.

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

## Owner confirmations (resolved 2026-09-25)

- **Stripe price IDs:** all six tier price IDs are configured in Vercel Production (owner-confirmed).
- **T-084–T-087 manual edge-case tests:** asserted, execution unrecorded. There's no record of the manual runs, which doesn't prove they never happened. Follow-up is in item 2 above.
- **Production URL:** `https://sitespresso.com` is canonical. `app.sitespresso.com` also serves the app through the `*.sitespresso.com` wildcard, with canonical metadata pointing to the apex. Optional follow-up is in item 7.
- **T-090:** still conditional. The `v1.0.0` release-candidate trigger is stale; the other re-open triggers remain (item 6).
