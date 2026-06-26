# Supabase Production Isolation Audit - 2026-06-25

## Objective

Assess task T-090: separate production Supabase project from development.

## Findings

1. Current local environment references one Supabase project URL/ref:
   - NEXT_PUBLIC_SUPABASE_URL points to a single project ref (`iiskdauwnbptplrvlxvs`).
2. Template local environment uses the same Supabase project ref.
3. No explicit second Supabase project configuration artifact is present in repository docs/config for production isolation.

Conclusion: Production Supabase isolation is not yet proven as complete from repository/runtime evidence available in this workspace.

## Risk

Without clear dev/prod project separation:

1. Development changes can impact production data.
2. Test users and production users may share auth and data plane.
3. Migration safety and rollback confidence are reduced.

## Required Completion Criteria for T-090

1. Create dedicated production Supabase project (if not already separate).
2. Create dedicated development/staging Supabase project.
3. Split environment variable sets by environment:
   - Vercel Production -> production Supabase URL/keys
   - Vercel Preview/Development -> non-production Supabase URL/keys
4. Confirm Supabase CLI/project linkage for migrations targets the intended environment.
5. Run post-cutover validation:
   - Auth sign-in works in production
   - Dashboard reads/writes expected data
   - Billing webhooks still reconcile correctly
   - Custom-domain verify/attach flows still pass
6. Record final project refs (redacted) and ownership in docs.

## Cutover Plan (Recommended)

1. Provision new non-production Supabase project.
2. Export current schema/migrations and apply to non-production.
3. Update local `.env.local` to non-production project.
4. Keep Vercel production env on production project.
5. Set Vercel preview env to non-production project.
6. Run `npm run test:reliability` locally against non-production.
7. Run production smoke and billing checks after env confirmation.
8. Update runbook and mark T-090 complete.

## Status

T-090 is deferred for the current pre-customer stage.

## Deferral Decision (2026-06-26)

Deferral approved while the product remains in pre-customer validation.

### Mandatory Reactivation Triggers

Re-open and complete T-090 before any of the following:

1. Onboarding first external paying customer.
2. Enabling broad public sign-up.
3. Running non-trivial migration work that could affect production data safety.
4. Creating release candidate for `v1.0.0`.

### Reactivation Exit Criteria

1. `npm run test:supabase-isolation` passes.
2. Production Vercel env points only to production Supabase project.
3. Local/template/preview envs point to non-production Supabase project.
4. Post-cutover smoke and billing checks pass.
