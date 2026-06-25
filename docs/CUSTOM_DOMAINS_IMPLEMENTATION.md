# Custom Domains Implementation

## Purpose

This document tracks the phased implementation of custom domains, starting with the paid-gated registration foundation. In the current slice, users can save a custom domain, run DNS verification checks, and attach the domain to the Vercel project, but live routing is not active yet.

## Current Slice

Registration + verification + attach preparation, visible to all users, usable only on paid plans.

## Entitlement Rules

1. Free users can see the feature.
2. Free users cannot save or update a custom domain.
3. Starter, Pro, and Agency users can save a custom domain.
4. API enforcement is required even if the UI is bypassed.

## Detailed Tasks

### Phase 1: Schema

1. Add `custom_domain text unique null` to `sites`.
2. Add `domain_verified boolean not null default false` to `sites`.
3. Keep routing unchanged in this slice.

### Phase 2: Validation

1. Accept `example.com` and `www.example.com`.
2. Reject protocol-prefixed values such as `https://example.com`.
3. Reject wildcard domains such as `*.example.com`.
4. Reject paths and query strings.
5. Reject SiteSpresso internal hostnames.

### Phase 3: API

Route: `PATCH /api/sites/[id]/domain`

1. Require authentication.
2. Verify site ownership.
3. Verify user plan is not `free`.
4. Validate domain syntax.
5. Reject duplicates already claimed by another site.
6. Save domain and reset verification state.
7. Return instructional copy for the next DNS step.

Route: `POST /api/sites/[id]/domain/verify`

1. Require authentication.
2. Verify site ownership.
3. Verify user plan is not `free`.
4. Require saved custom domain and published site slug.
5. Resolve CNAME DNS and compare against `{slug}.sitespresso.com`.
6. If CNAME is not available or mismatched, compare A/AAAA resolution with the expected target to support apex-domain setups.
7. Persist `domain_verified` true/false based on current DNS result.
8. Return expected target, observed records, and user-safe status message.

Route: `POST /api/sites/[id]/domain/attach`

1. Require authentication.
2. Verify site ownership.
3. Verify user plan is not `free`.
4. Require saved domain + published slug + `domain_verified = true`.
5. Call Vercel Project Domains API to attach custom domain.
6. Persist `domain_attached = true` on success.
7. Return attach status and user-safe message.

### Phase 4: Dashboard UX

1. Show custom domain section on every site card.
2. Paid users:
   - editable input
   - save button
   - `Not verified` status badge
   - `Attach to Vercel` action once DNS is verified
3. Free users:
   - visible but disabled field
   - `Paid feature` badge
   - upgrade CTA
4. Add `Check DNS` action for paid users after domain is saved.
5. Show attach status (`Attached` / `Not attached`) for paid users.
6. Explain that live traffic still uses the SiteSpresso subdomain until future slices ship.

### Phase 5: Future Slices

1. Middleware support for custom hostnames
2. SSL/live activation

## User Flow

### Paid user

1. Open Dashboard.
2. Enter custom domain in site card.
3. Save domain.
4. See `Not verified` status and guidance.
5. Run `Check DNS` to validate CNAME configuration and update verification status.
6. Click `Attach to Vercel` once verified.

### Free user

1. Open Dashboard.
2. See custom domain section and value proposition.
3. Discover feature is paid-only.
4. Click upgrade CTA to continue.

## Verification Checklist

1. Paid user can save valid domain.
2. Free user sees feature but cannot save.
3. Free user direct API call is blocked.
4. Duplicate domain claims return conflict.
5. Invalid domain values return validation error.
6. Paid user can run verification and see clear pass/fail message.
7. Paid user can attach verified domain and see attached status.
8. Existing publish flow still returns `{slug}.sitespresso.com`.
9. `npm run build` passes.
