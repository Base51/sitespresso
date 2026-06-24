# Admin Billing Operations

## Purpose

This runbook explains how admins can detect and clean duplicate active subscriptions while keeping Stripe as the billing source of truth.

## Access Control

The internal report endpoint is protected by an email allowlist:

```env
ADMIN_ALLOWLIST_EMAILS=admin@sitespresso.com,ops@sitespresso.com
```

Notes:

1. Values are comma-separated.
2. Emails are matched case-insensitively.
3. Add this variable in local, preview, and production where admin access is required.

## Endpoint

`GET /api/admin/billing/duplicates`

Response contains:

1. `totalAffectedUsers`
2. `duplicates[]` with user id/email, active-like subscription count, and per-subscription Stripe IDs
3. `hasAgencyAnnual` helper flag to speed up triage when Agency Annual is the desired plan

## Response Statuses

1. `401`: no authenticated user session
2. `403`: authenticated but not in admin allowlist
3. `500`: admin allowlist not configured or unexpected report failure
4. `200`: report generated successfully

## Cleanup Procedure

1. Open the report endpoint as an allowlisted admin.
2. For each user in `duplicates`, choose one subscription to keep.
3. In Stripe Dashboard, cancel the extra subscriptions.
4. Wait for webhook delivery (`customer.subscription.updated` / `customer.subscription.deleted`).
5. Re-run the report endpoint and verify the user no longer appears.

## Safety Rules

1. Do not manually edit subscription status rows before webhook reconciliation.
2. Prefer canceling duplicates in Stripe first, then verify Supabase reflects the change.
3. If webhook delivery fails, resend events from Stripe before manual DB correction.
