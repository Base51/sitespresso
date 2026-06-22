# SiteSpresso — Implementation Backlog

> Version: 1.1 | Status: Active | Date: 2026-06-22
> Format: `[PRIORITY] Task — Status`
> Priorities: **P0** (launch blocker) | **P1** (launch target) | **P2** (post-MVP)

---

## Milestones

| # | Milestone | Target | Status |
|---|---|---|---|
| M1 | Project scaffold & infrastructure | Week 1 | Complete |
| M2 | Auth + Supabase integration | Week 2 | Complete |
| M3 | AI generation pipeline | Week 3 | Complete |
| M4 | Site preview & editor | Week 4 | Complete |
| M5 | Publishing & subdomain routing | Week 5 | Complete |
| M6 | Billing (Stripe) | Week 5–6 | Complete |
| M7 | Dashboard & account management | Week 6 | In Progress |
| M8 | QA, performance, security review | Week 6 | In Progress (P0 security done) |
| M9 | Production launch | Week 6 | Not Started |

---

## M1 — Project Scaffold & Infrastructure

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-001 | Initialize Next.js 14 project with App Router and TypeScript | P0 | — | ✅ |
| T-002 | Configure Tailwind CSS | P0 | T-001 | ✅ |
| T-003 | Set up ESLint + Prettier with project conventions | P1 | T-001 | ✅ |
| T-004 | Create Vercel project, connect GitHub repo | P0 | T-001 | ✅ |
| T-005 | Configure wildcard domain `*.sitespresso.com` in Vercel | P0 | T-004 | ✅ |
| T-006 | Create Supabase project (production) | P0 | — | ✅ |
| T-007 | Store all secrets in Vercel environment variables | P0 | T-004, T-006 | ✅ |
| T-008 | Create `.env.local` template with required variables (no secrets) | P1 | T-007 | ✅ |

---

## M2 — Auth & Supabase Integration

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-010 | Run Supabase DB migrations: `profiles`, `sites`, `subscriptions` tables | P0 | T-006 | ✅ |
| T-011 | Enable Row-Level Security and create all RLS policies | P0 | T-010 | ✅ |
| T-012 | Create Supabase trigger to auto-insert `profiles` row on user sign-up | P0 | T-010 | ✅ |
| T-013 | Install and configure `@supabase/ssr` for Next.js App Router | P0 | T-001, T-006 | ✅ |
| T-014 | Implement Next.js middleware for session refresh and route protection | P0 | T-013 | ✅ |
| T-015 | Build `/login` page with Google OAuth and magic link sign-in | P0 | T-013 | ✅ |
| T-016 | Build `/auth/callback` route handler for OAuth redirect | P0 | T-015 | ✅ |
| T-017 | Implement sign-out action and clear session cookie | P0 | T-015 | ✅ |
| T-018 | Test: full auth flow (sign-up → dashboard → sign-out → sign-in) | P0 | T-017 | ✅ |

---

## M3 — AI Generation Pipeline

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-020 | Install OpenAI Node.js SDK | P0 | T-001 | ✅ |
| T-021 | Define Zod schema for website JSON structure | P0 | T-001 | ✅ |
| T-022 | Implement `POST /api/generate` route handler | P0 | T-020, T-021 | ✅ |
| T-023 | Write system prompt template for local business content generation | P0 | T-022 | ✅ |
| T-024 | Enforce `response_format: json_object` and validate against Zod schema | P0 | T-022, T-021 | ✅ |
| T-025 | Sanitize and length-cap user inputs before prompt injection | P0 | T-022 | ✅ |
| T-026 | Implement rate limiting on `/api/generate` (IP + user-level) | P0 | T-022 | ✅ |
| T-027 | Implement retry logic on OpenAI API failures (max 2 retries) | P1 | T-022 | ✅ |
| T-028 | Test: generation for 5 business types (restaurant, barbershop, gym, salon, repair) | P0 | T-024 | ✅ |

---

## M4 — Site Preview & Editor

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-030 | Build intake form page (`/` or `/new`) with Business Name, Type, City fields | P0 | T-001 | ✅ |
| T-031 | Add business type dropdown with 20+ local business categories | P0 | T-030 | ✅ |
| T-032 | Implement form validation (required fields, length limits) | P0 | T-030 | ✅ |
| T-033 | Build loading/generation screen with progress feedback UI | P0 | T-030 | ✅ |
| T-034 | Build website preview renderer component (`SitePreview`) | P0 | T-021 | ✅ |
| T-035 | Implement `SitePreview` sections: Hero, About, Services, Contact | P0 | T-034 | ✅ |
| T-036 | Make `SitePreview` mobile-responsive | P0 | T-035 | ✅ |
| T-037 | Implement inline click-to-edit for text fields in preview | P0 | T-034 | ✅ |
| T-038 | Auto-save edited site content to Supabase (1s debounce) | P0 | T-037, T-013 | ✅ |
| T-039 | Persist draft site to Supabase on generation (unauthenticated → prompt sign-in) | P0 | T-038 | ✅ |
| T-040 | Build error state UI for generation failure with retry CTA | P0 | T-033 | ✅ |
| T-041 | Add "Revert section" option to restore original AI content | P1 | T-037 | ✅ |
| T-042 | Add one-free-preview auth gate (trial flag + redirect to login) | P0 | T-030, T-040 | ✅ |
| T-043 | Add home-page auth CTA (Sign In / Go to Dashboard) | P1 | T-015, T-070 | ✅ |

---

## M5 — Publishing & Subdomain Routing

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-050 | Implement slug generation utility (business name → URL-safe slug) | P0 | T-001 | ✅ |
| T-051 | Add reserved slug blocklist (www, app, api, admin, etc.) | P0 | T-050 | ✅ |
| T-052 | Handle slug conflicts (append `-2`, `-3` or prompt user) | P0 | T-050 | ✅ |
| T-053 | Implement `POST /api/sites/[id]/publish` route handler | P0 | T-010, T-013 | ✅ |
| T-054 | Implement Next.js middleware for subdomain → `/sites/[slug]` rewrite | P0 | T-005 | ✅ |
| T-055 | Build `/app/sites/[slug]/page.tsx` server component (published site renderer) | P0 | T-034 | ✅ |
| T-056 | Return 404 page for unpublished or unknown slugs | P0 | T-055 | ✅ |
| T-057 | Optimize published site for Edge rendering (no heavy client-side JS) | P1 | T-055 | ✅ |
| T-058 | Test: publish flow end-to-end, verify `{slug}.sitespresso.com` is live | P0 | T-053, T-054, T-055 | ✅ |
| T-059 | Add SEO meta tags to published site (title, description, og:image) | P1 | T-055 | ✅ |

---

## M6 — Billing (Stripe)

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-060 | Create Stripe product and price (Starter $9/mo) | P0 | — | ✅ |
| T-061 | Install Stripe Node.js SDK | P0 | T-001 | ✅ |
| T-062 | Implement `POST /api/billing/checkout` route handler | P0 | T-061, T-013 | ✅ |
| T-063 | Implement `POST /api/billing/portal` route handler | P0 | T-061, T-013 | ✅ |
| T-064 | Implement `POST /api/webhooks/stripe` route handler with signature verification | P0 | T-061 | ✅ |
| T-065 | Handle `checkout.session.completed`: activate subscription, publish site | P0 | T-064, T-053 | ✅ |
| T-066 | Handle `customer.subscription.updated`: sync status to Supabase | P0 | T-064 | ✅ |
| T-067 | Handle `customer.subscription.deleted`: set plan to free, queue unpublish | P0 | T-064 | ✅ |
| T-068 | Build paywall modal (shown when free user attempts to publish) | P0 | T-062 | ✅ |
| T-069 | Test: full billing flow (checkout → activation → portal → cancellation) — pass with deferred deleted-event verification | P0 | T-065, T-066, T-067 | ✅ |

---

## M7 — Dashboard & Account Management

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-070 | Build `/dashboard` page (protected route) | P0 | T-014 | ✅ |
| T-071 | Display user's site card(s) with status badge (Draft / Published / Unpublished) | P0 | T-070 | ✅ |
| T-072 | Add "Edit Site" link from dashboard to site editor | P0 | T-071 | ✅ |
| T-073 | Add "View Live Site" link for published sites | P0 | T-071 | ✅ |
| T-074 | Display subscription plan and renewal date on dashboard | P1 | T-070, T-066 | ✅ |
| T-075 | Add "Manage Billing" button linking to Stripe Billing Portal | P1 | T-063 | ✅ |
| T-076 | Build account settings page (display name, email) | P2 | T-070 | ☐ |

---

## M8 — QA, Performance & Security Review

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-080 | Run Lighthouse audit on published site — target ≥ 90 mobile | P1 | T-057 | ✅ (Prod: Perf 98, A11y 100, BP 100, SEO 100) |
| T-081 | Review all API routes for missing auth checks | P0 | All API tasks | ✅ |
| T-082 | Review all Supabase queries — confirm RLS is enforced | P0 | T-011 | ✅ |
| T-083 | Verify OpenAI and Stripe keys are never in client bundles | P0 | All API tasks | ✅ |
| T-083a | Implement automatic cache cleanup to prevent dev server stale assets | P1 | T-001 | ✅ |
| T-084 | Test slug conflict and reserved slug edge cases | P0 | T-051, T-052 | 🔄 (Unit tests: ✅, Manual: ⚠️) |
| T-085 | Test auth edge cases (expired session, sign-in redirect loop) | P0 | T-018 | ⚠️ (Manual testing) |
| T-086 | Test Stripe webhook idempotency (duplicate events) | P0 | T-069 | ⚠️ (Manual testing) |
| T-087 | Test generation failure and retry UX | P0 | T-040 | ⚠️ (Manual testing) |
| T-088 | Cross-browser test: Chrome, Safari, Firefox (mobile + desktop) | P1 | All UI tasks | 🔄 (Chromium responsive pass; Safari/Firefox manual pending) |
| T-089 | WCAG 2.1 AA accessibility audit on intake form and dashboard | P1 | All UI tasks | 🔄 (Lighthouse home page a11y 100; dashboard/manual audit pending) |

---

## M9 — Production Launch

| ID | Task | Priority | Depends On | Status |
|---|---|---|---|---|
| T-090 | Configure production Supabase project (separate from dev) | P0 | T-006 | ☐ |
| T-091 | Set all production environment variables in Vercel | P0 | T-007 | ☐ |
| T-092 | Configure `sitespresso.com` DNS and verify Vercel domain setup | P0 | T-005 | ☐ |
| T-093 | Run end-to-end smoke test on production environment | P0 | All M1–M8 | ☐ |
| T-094 | Set up Vercel error monitoring (Vercel Analytics + Error Tracking) | P1 | T-004 | ☐ |
| T-095 | Write production README with setup and deployment instructions | P1 | All tasks | ☐ |
| T-096 | Tag `v1.0.0` release on GitHub | P1 | T-093 | ☐ |

---

## Post-MVP Backlog (P2)

| ID | Task |
|---|---|
| T-100 | Custom domain support (DNS CNAME + Vercel domain API) |
| T-101 | Multi-page sites (Home, About, Contact) |
| T-102 | AI hero image generation (DALL·E 3 or Stability) |
| T-103 | SEO tools: sitemap.xml, robots.txt, structured data |
| T-104 | Analytics dashboard (page views, unique visitors) |
| T-105 | Google Business Profile embed |
| T-106 | Booking widget integration (Calendly embed) |
| T-107 | Google Maps embed for contact section |
| T-108 | Agency plan: unlimited sites, client management |
| T-109 | White-label mode: custom branding for agency resellers |
| T-110 | Multi-language generation (Spanish, Portuguese) |
| T-111 | AI "refresh content" on demand |
| T-112 | Email capture on generate (pre-auth lead gen) |
| T-113 | Referral program |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ☐ | Not started |
| 🔄 | In progress |
| ✅ | Completed |
| ⛔ | Blocked |
| ➡️ | Deferred |
