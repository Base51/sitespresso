# Release Candidate - 2026-06-26

## Current State

1. `main` has passed reliability and production validation checks.
2. Production custom-domain flow (including real apex domain) is validated.
3. Production runbook and validation evidence are documented.

## Versioning Observation

1. Git tag `v1.0.0` already exists.
2. Existing `v1.0.0` points to an older commit (`82586a4d6381ce3ec7c8fc4f4924b29c68f445f9`).
3. Current `main` is at `73355ff547e5b7a06b440d78b50cc6ae4a887495`.

## Recommendation

Do not move or overwrite existing `v1.0.0` tag.

Use a new release tag from current `main`, for example:

1. `v1.0.1` (recommended patch release)
2. `v1.1.0` (if you consider current scope a minor release)

`package.json` has been aligned to `1.0.1` to match this release path.

Run version guardrails before tagging:

1. `npm run test:release-version:strict`
2. `npm run test:reliability`

## Suggested Tagging Command

```bash
git tag -a v1.0.1 -m "Release v1.0.1 - production custom-domain completion and launch readiness updates"
git push origin v1.0.1
```

## Suggested Release Notes Focus

1. Completed custom-domain lifecycle:
   - save
   - DNS verify (including apex)
   - Vercel attach
   - middleware host routing
2. Added production deployment runbook.
3. Added production E2E validation report.
4. Added Supabase isolation audit and deferred policy gate for pre-customer stage.
