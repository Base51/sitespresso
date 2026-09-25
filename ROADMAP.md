# SiteSpresso — Roadmap

> Last reconciled: 2026-09-25 against `main` @ `50b7d24`.
> Sources: [docs/tasks.md](docs/tasks.md) (task IDs), [docs/prd.md](docs/prd.md) (phase roadmap), and the code tree.
> This file is the single source of truth for project status. Next concrete steps live in [NEXT_ACTIONS.md](NEXT_ACTIONS.md); working rules for agents/contributors live in [AGENTS.md](AGENTS.md).

Status legend: ✅ done · 🔄 in progress · ➡️ deferred · ☐ planned · ⚠️ asserted, execution unrecorded

---

## Currency note

Code bills in **EUR** (`BILLING_CURRENCY_CODE = 'EUR'`, symbol `€` in `lib/billing/plans.ts`). Default list prices in code: Starter €9/mo · €79/yr, Pro €19/mo · €159/yr, Agency €49/mo · €399/yr. When Stripe prices are configured, the displayed amounts are overridden by the live Stripe price amounts (`getStripePlanPricingOverrides()` in `lib/stripe.ts`). Older planning docs (`docs/prd.md`, `docs/mvp.md`, `docs/brainstorm.md`, `docs/TIER_*.md`) quote USD (`$`) — treat those as historical.

---

## Done ✅

### MVP milestones (M1–M8) — see [docs/tasks.md](docs/tasks.md)

| Milestone | Scope | Evidence in tree |
|---|---|---|
| M1 Scaffold & infra | Next.js 14 App Router, TypeScript, Tailwind, ESLint/Prettier, Vercel | `package.json`, `tailwind.config.js`, `.eslintrc.json`, `.prettierrc.json` |
| M2 Auth + Supabase | Schema, RLS, profile trigger, `@supabase/ssr`, middleware, login, callback | `supabase/migrations/20260618190000_m2_auth_and_schema.sql`, `middleware.ts`, `app/login/page.tsx`, `app/auth/callback/route.ts` |
| M3 AI generation | `POST /api/generate`, Zod schema, OpenAI `gpt-4o` with JSON schema output, input sanitising, rate limiting, 2 retries | `app/api/generate/route.ts`, `lib/schemas/website.ts`, `lib/ai/prompts.ts`, `lib/redis/rate-limiter.ts` |
| M4 Preview & editor | Intake form, preview renderer, inline editing, autosave, revert, free-preview gate | `components/GenerateForm.tsx`, `components/SitePreview.tsx`, `components/EditorSidebar.tsx`, `app/editor/[id]/page.tsx` |
| M5 Publishing & subdomains | Slugs + reserved list, publish route, subdomain rewrite, published renderer, SEO meta | `lib/slug.ts`, `app/api/sites/[id]/publish/route.ts`, `middleware.ts`, `app/sites/[slug]/page.tsx` |
| M6 Billing (Stripe) | Checkout, portal, signed webhook, paywall | `app/api/billing/checkout/route.ts`, `app/api/billing/portal/route.ts`, `app/api/webhooks/stripe/route.ts`, `components/PaywallModal.tsx` |
| M7 Dashboard & account | Dashboard, site cards, billing buttons, account settings | `app/dashboard/page.tsx`, `components/DashboardContent.tsx`, `app/account/page.tsx` |
| M8 QA / perf / security | RLS + key-leak audit, Lighthouse, edge cases, cross-browser, WCAG | [docs/m8-security-audit.md](docs/m8-security-audit.md), Lighthouse scores in [docs/tasks.md](docs/tasks.md) (T-080; raw `.lighthouse-*.json` reports untracked, still in git history) |

Notes on M8:

- **T-084–T-087: ⚠️ asserted, execution unrecorded.** They are marked ✅ in `docs/tasks.md`, but the edge-case docs ([docs/t084-087-summary.md](docs/t084-087-summary.md), [docs/edge-case-test-execution.md](docs/edge-case-test-execution.md)) still list the manual tests as pending, and no execution record exists. The owner reviewed this on 2026-09-25: completion was asserted but can't be substantiated from the records. That doesn't prove the tests never ran. Since 2026-09-25, the T-084 slug cases (sanitisation, reserved slugs, conflict suffixes, the 10-attempt limit) are covered by Vitest unit tests against the real `lib/slug.ts` (`npm test`, run in CI). T-085–T-087 are still unrecorded manual checks. See [NEXT_ACTIONS.md](NEXT_ACTIONS.md) item 2.
- The "37/37 unit tests" in those docs came from `scripts/test-slug-edge-cases.mjs`, which copied slug logic instead of importing `lib/slug.ts`. It has been replaced by `tests/unit/slug.test.ts` (`npm run test:edges` now runs that suite). The unit tests surfaced suspected bugs, including the Agency plan resolving to a 1-site limit. They're not fixed yet and need owner approval: see [NEXT_ACTIONS.md](NEXT_ACTIONS.md) item 8.

### M9 launch items done

- T-091 production env vars in Vercel ✅ (per `docs/tasks.md`). All six tier Stripe price IDs (Starter/Pro/Agency × monthly/annual) are configured in Vercel Production, **confirmed by the owner on 2026-09-25**.
- T-092 `sitespresso.com` DNS ✅. `https://sitespresso.com` is the canonical production URL; Vercel has verified `sitespresso.com` and `*.sitespresso.com` (owner-confirmed 2026-09-25).
- T-093 production E2E ✅ ([docs/PRODUCTION_E2E_VALIDATION_2026-06-25.md](docs/PRODUCTION_E2E_VALIDATION_2026-06-25.md)), T-094 Vercel Analytics + Speed Insights ✅ (`app/layout.tsx`, `@vercel/speed-insights` ^2 in `package.json`), T-095 runbook ✅ ([docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md](docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md)), T-096 release tag ✅ (`v1.0.1` exists; `package.json` is `1.0.1`).

### Post-MVP items done

| ID | Feature | Evidence in tree |
|---|---|---|
| T-100 | Custom domains: save → DNS verify (CNAME + apex A/AAAA) → Vercel attach → host routing | `app/api/sites/[id]/domain/route.ts`, `.../domain/verify/route.ts`, `.../domain/attach/route.ts`, `lib/domains.ts`, `lib/domains-server.ts`, `lib/vercel-domains.ts`, `middleware.ts`; [docs/CUSTOM_DOMAINS_IMPLEMENTATION.md](docs/CUSTOM_DOMAINS_IMPLEMENTATION.md) |
| T-101 | Multi-page sites (Home / About / Contact) | `app/sites/[slug]/[page]/page.tsx`, `normalizeWebsiteContent()` in `lib/schemas/website.ts`, `scripts/migrate-multipage-content.ts`; [docs/T101_MULTIPAGE_IMPLEMENTATION_PLAN.md](docs/T101_MULTIPAGE_IMPLEMENTATION_PLAN.md) |
| T-102 | AI hero image (OpenAI `gpt-image-1`) | `app/api/sites/[id]/hero-image/route.ts` |
| T-103 | sitemap.xml, robots.txt, structured data | `app/sitemap.ts`, `app/robots.ts`, JSON-LD in `app/sites/[slug]/page.tsx` |
| T-104 | Analytics (page views) | `app/api/analytics/pageview/route.ts`, `components/PageViewTracker.tsx`, migration `20260703202000_add_site_page_views.sql` |
| T-105 / T-106 / T-107 | Google Business Profile, Calendly booking, Google Maps embeds | `contact.*_embed_url` fields in `lib/schemas/website.ts`, rendered in preview and published routes |
| T-110 | Multi-language generation (en, es, pt, fr, de, it) | `lib/i18n/languages.ts`, `language` field in schema/prompts |
| T-111 | Per-section AI refresh | `app/api/sites/[id]/refresh-section/route.ts` |
| T-112 | Lead capture before anonymous publish | `app/api/leads/route.ts`, `components/LeadCaptureModal.tsx`, migration `20260905193000_add_leads_and_referrals.sql` |
| T-113 | Referral programme | `app/api/referrals/route.ts`, `app/api/referrals/stats/route.ts`, `components/Referral*.tsx`, `lib/referral.ts` |
| — | Four paid-tier billing model (Starter / Pro / Agency × monthly / annual) | `lib/billing/plans.ts`, `lib/stripe.ts` (`planFromPriceId`, `planFromStripeStatus`) |
| — | Per-plan site limits: Free 1, Starter 1, Pro 3, Agency unlimited | `lib/billing/site-limits.ts`, enforced in `app/api/generate/route.ts`, `components/SitePreview.tsx`, `components/DashboardContent.tsx` |
| — | Per-plan monthly generation quotas: Free 3, Starter 50, Pro 500, Agency 5,000 | `lib/redis/rate-limiter.ts` (Redis, with in-memory fallback) |
| — | Legal pages (privacy, terms, refunds, cookies, DPA, contact) | `app/legal/**` |
| — | Admin billing page (duplicate active subscriptions report, allowlist-gated) | `app/admin/billing/page.tsx`, `lib/admin/*` |
| — | CI: build, type-check + lint, portable reliability pipeline | `.github/workflows/ci.yml`, `build-verify.yml`, `reliability.yml` |

---

## In progress 🔄

- **T-108 Agency plan** — foundation shipped (per-plan site limits + dashboard limit UX; Agency tier purchasable when its Stripe prices are configured). Agency-specific features from `docs/TIER_IMPLEMENTATION_ROADMAP.md` M-302 (team members/roles, analytics export API) are not in the tree.
- **M9 Production launch** — open only because T-090 is deferred (below).

---

## Deferred ➡️

### T-090 — Separate production Supabase project

Deferred on 2026-06-26 for the pre-customer stage ([docs/SUPABASE_PROD_ISOLATION_AUDIT_2026-06-25.md](docs/SUPABASE_PROD_ISOLATION_AUDIT_2026-06-25.md)). Local and template environments currently point at a single Supabase project.

**Mandatory re-open triggers** (complete T-090 before any of these):

1. Onboarding the first external paying customer.
2. Enabling broad public sign-up.
3. Running non-trivial migration work that could affect production data safety.
4. ~~Creating a release candidate for `v1.0.0`~~: **stale.** The `v1.0.1` tag points to the 2026-06-26 release commit. Tagging it neither completed nor revoked T-090 (owner-confirmed 2026-09-25).

T-090 is **still conditional**: triggers 1–3 remain in force, most importantly **before the first external paying customer**.

**Exit criteria:** `npm run test:supabase-isolation` passes; Vercel Production points only to the production Supabase project; local/template/preview point to a non-production project; post-cutover smoke and billing checks pass.

T-090 changes production environment variables, so it **requires owner approval** (see [AGENTS.md](AGENTS.md)).

---

## Planned ☐

| Item | Source | Notes |
|---|---|---|
| T-109 White-label mode for agency resellers | `docs/tasks.md`, PRD v2.1 | Not started. |
| Agency features: team invites/roles, analytics export API | `docs/TIER_IMPLEMENTATION_ROADMAP.md` M-302 | Not started. |
| Multi-site management extras: bulk delete, export | `docs/TIER_IMPLEMENTATION_ROADMAP.md` M-301d/e | Not started. |
| Real unit tests for billing and slug logic (Q-101) | `docs/TIER_IMPLEMENTATION_ROADMAP.md` Q-101 | Partly done: Vitest suite in `tests/unit/` (plan normalisation, site limits, Stripe price/status mapping, slugs, domains), run in CI. Quota, tier-transition and webhook tests are still open. See [NEXT_ACTIONS.md](NEXT_ACTIONS.md) items 2 and 8. |
| Stripe sandbox integration tests (Q-102) | `docs/TIER_IMPLEMENTATION_ROADMAP.md` Q-102 | Not started. |
| Review aggregation | PRD v3.0 | Not started. |
| Custom-domain monitoring/alerts, in-product apex help link | `docs/CUSTOM_DOMAINS_IMPLEMENTATION.md` Phase 5 | Not started. |
| Repo hygiene and security follow-ups | [NEXT_ACTIONS.md](NEXT_ACTIONS.md) | Done: admin "View JSON" dead link removed in PR #5; `/api/debug/subscription` restricted to admins in PR #6; Supabase CLI temp state, build logs and Lighthouse JSON untracked and ignored in PR #7 (no history rewrite); superseded PR #2 closed. |
