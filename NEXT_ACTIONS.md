# SiteSpresso — Next Actions

> Last reconciled: 2026-09-25 against `main` @ `50b7d24`. Status context: [ROADMAP.md](ROADMAP.md). Working rules: [AGENTS.md](AGENTS.md).

Ordered list of small follow-up PRs. Each one gets its own feature branch and PR against `main`. After each merge, update this file and [ROADMAP.md](ROADMAP.md).

---

## 1. Remove the dead admin "View JSON" link and fix the admin billing runbook

- **Goal:** `GET /api/admin/billing/duplicates` was removed in commit `f21df91` (there is no `app/api/admin/` in the tree), but `app/admin/billing/page.tsx` still links to it (the link returns 404). Remove the link. The report page itself still works because it calls `buildBillingDuplicatesReport()` directly.
- **Files:** `app/admin/billing/page.tsx`; [docs/ADMIN_BILLING_OPERATIONS.md](docs/ADMIN_BILLING_OPERATIONS.md) (this PR already notes the removal; tidy up after the code change).
- **Risk:** Very low (UI link only). The page is admin-only and allowlist-gated.
- **Verify:** `npm run lint`, `npx tsc --noEmit`, `npm run build`; open `/admin/billing` as an allowlisted admin and confirm there's no dead link.

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
- **Also fixes these test gaps:**
  - `scripts/test-slug-edge-cases.mjs` (`npm run test:edges`) copies the slug logic instead of importing `lib/slug.ts`, so it can drift from real code. Its "retry logic" checks assert constants against themselves. It isn't in CI. Replace it with Vitest tests, or make it import the real module.
  - Most `test:*` scripts are PowerShell (`pwsh`) or `tsx` scripts that check file contents/presence (`scripts/smoke-check.ps1`) or need cloud credentials (multipage/analytics/custom-domain QA, perf budget). They're skipped in CI via `test:reliability:ci`. They aren't a substitute for unit tests.

## 3. Decide the future of `app/api/debug/subscription` (security — needs owner decision)

- **Goal:** `GET /api/debug/subscription` (added in `b1f501a`) returns the caller's profile/subscription rows plus the configured Agency Stripe price env values to **any signed-in user**, and it's deployed with the app. Price IDs aren't secret keys, but a production debug surface should be a deliberate choice.
- **Options:** (a) delete the route; (b) gate it with the existing admin allowlist (`lib/admin/guards.ts`) and drop the env echo; (c) keep it (document why).
- **Files:** `app/api/debug/subscription/route.ts` (and docs).
- **Risk:** Low for (a)/(b), but it touches billing diagnostics, so **owner decision required before any change**.
- **Verify:** `npm run build`; a request as a non-admin user returns 401/403 (option b) or 404 (option a).

## 4. Untrack Supabase CLI temp state, build logs and Lighthouse JSON (security hygiene)

- **Goal:** These are committed but shouldn't be (see [docs/DEVICE_MIGRATION_WINDOWS_MACOS.md](docs/DEVICE_MIGRATION_WINDOWS_MACOS.md), which says not to commit Supabase CLI temp state):
  - `supabase/.temp/*` and `templates/nextjs-app/supabase/.temp/*`: project linkage metadata.
  - `build-final.txt`, `build-output.txt`, `build-test-prev.txt`, `build-test-revert.txt`, `build-with-lucide.txt`, `dev-output.txt`, `vercel-build-log.txt`.
  - `.lighthouse-home.json`, `.lighthouse-prod-home.json` (~750 KB).
- Run `git rm --cached` on them and add ignore patterns.
- **Files:** `.gitignore` and the untracked paths. (Keep Lighthouse evidence elsewhere if wanted, for example a summary in `docs/`.)
- **Risk:** Low. The files stay in git history, so if anything sensitive is ever found in them, rotating that credential is the fix; untracking alone doesn't remove it. The linked project metadata isn't a secret key.
- **Verify:** `git ls-files supabase/.temp` is empty; `npm run build` and CI stay green.

## 5. Close PR #2 as superseded

- **Goal:** Draft PR #2, "Install Vercel Speed Insights" (vercel[bot]), adds `@vercel/speed-insights` ^1.1.0. `main` already has ^2.0.0 wired in `app/layout.tsx` (T-094).
- **Files:** none (GitHub action only).
- **Risk:** None. **Owner to confirm** before closing.
- **Verify:** PR #2 closed with a comment pointing to `app/layout.tsx` on `main`.

## 6. T-090 — separate production Supabase project (requires owner approval)

- **Goal:** Complete the deferred T-090 before any re-open trigger fires (first paying customer, broad public sign-up, risky migrations). See [docs/SUPABASE_PROD_ISOLATION_AUDIT_2026-06-25.md](docs/SUPABASE_PROD_ISOLATION_AUDIT_2026-06-25.md) and [ROADMAP.md](ROADMAP.md).
- **Files:** mainly Vercel/Supabase configuration (not in the repo), then runbook/doc updates.
- **Risk:** **High.** It changes production environment variables and the data plane. **Owner approval required.** Don't start without an explicit go-ahead and a rollback plan.
- **Verify:** `npm run test:supabase-isolation`; production login, dashboard, billing webhook and custom-domain checks per the audit's exit criteria.

---

## Owner confirmations needed (from the 2026-09-25 reconciliation)

- Whether all six tier Stripe price IDs are configured in Vercel production: **⚠️ Unverified — owner to confirm.**
- Whether the T-084–T-087 manual edge-case tests were actually run: **⚠️ Unverified — owner to confirm.**
- Production app URL (`sitespresso.com` per runbook and code defaults vs `app.sitespresso.com` in the original architecture draft): **⚠️ Unverified — owner to confirm.**
