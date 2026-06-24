# Custom Domains Implementation

## Purpose

This document tracks the phased implementation of custom domains, starting with the paid-gated registration foundation. In the current slice, users can save a custom domain to a site, but live routing and DNS verification are not active yet.

## Current Slice

Registration only, visible to all users, usable only on paid plans.

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

### Phase 4: Dashboard UX

1. Show custom domain section on every site card.
2. Paid users:
   - editable input
   - save button
   - `Not verified` status badge
3. Free users:
   - visible but disabled field
   - `Paid feature` badge
   - upgrade CTA
4. Explain that live traffic still uses the SiteSpresso subdomain until future slices ship.

### Phase 5: Future Slices

1. DNS verification flow
2. Vercel domain attach API
3. Middleware support for custom hostnames
4. SSL/live activation

## User Flow

### Paid user

1. Open Dashboard.
2. Enter custom domain in site card.
3. Save domain.
4. See `Not verified` status and guidance.

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
6. Existing publish flow still returns `{slug}.sitespresso.com`.
7. `npm run build` passes.
