# Production Deployment Runbook

This runbook defines how to deploy and validate SiteSpresso in production.

## Scope

Use this guide for production releases to `https://sitespresso.com`.

## Prerequisites

1. Vercel project is linked (`.vercel/repo.json` present).
2. Production environment variables are configured in Vercel.
3. Supabase production database is reachable.
4. Stripe live products and prices are configured.

## Required Production Environment Variables

Core app:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SITE_URL`
5. `OPENAI_API_KEY`

Stripe billing:

1. `STRIPE_SECRET_KEY`
2. `STRIPE_WEBHOOK_SECRET`
3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. `STRIPE_STARTER_PRICE_ID`
5. `STRIPE_STARTER_ANNUAL_PRICE_ID`
6. `STRIPE_PRO_PRICE_ID`
7. `STRIPE_PRO_ANNUAL_PRICE_ID`
8. `STRIPE_AGENCY_PRICE_ID`
9. `STRIPE_AGENCY_ANNUAL_PRICE_ID`

Custom-domain attach:

1. `VERCEL_ACCESS_TOKEN`
2. `VERCEL_PROJECT_ID`
3. `VERCEL_TEAM_ID`

## Release Procedure

1. Build locally:

   `npm run build`

2. Run smoke checks:

   `npm run test:smoke`

3. Deploy production build:

   `npx --yes vercel --prod --yes`

4. Confirm deployment alias points to `https://sitespresso.com`.

## Post-Deploy Validation

1. Public API contract checks:

   `pwsh -ExecutionPolicy Bypass -File scripts/custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com"`

2. Billing configuration checks:

   `npm run test:billing-config`

3. Manual spot checks:

   1. Landing page loads and pricing cards render.
   2. Login works and dashboard loads.
   3. Published subdomain resolves (`{slug}.sitespresso.com`).
   4. Existing custom domain still resolves when attached.

## Apex Domain Customer Validation

If validating an apex custom domain:

1. Save customer apex domain in dashboard.
2. Ensure DNS is set to expected target (`expectedTarget`) or expected A/AAAA set (`expectedRecords`).
3. Keep DNS proxy/CDN disabled while running Verify.
4. Run Verify, then Attach.
5. Confirm `domain_verified = true` and `domain_attached = true`.

See also: `docs/CUSTOM_DOMAIN_APEX_GUIDE.md`.

## Rollback Procedure

1. Open Vercel deployment history.
2. Promote previous known-good deployment to production.
3. Re-run post-deploy validation checks.

## Ownership

1. Application deploy: SiteSpresso engineering owner
2. DNS and domain attach: SiteSpresso engineering owner
3. Billing and Stripe configuration: SiteSpresso product owner
