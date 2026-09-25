# Admin Billing Operations

> **Update (2026-09-25):** The JSON endpoint `GET /api/admin/billing/duplicates` was **removed in commit `f21df91`** ("remove billing duplicates report endpoint"). There is no `app/api/admin/` route in the tree. The admin page `/admin/billing` still renders the report server-side via `buildBillingDuplicatesReport()` (`lib/admin/billing-report.ts`). Its "View JSON" button still points at the removed endpoint and returns 404; removing that link is tracked in [NEXT_ACTIONS.md](../NEXT_ACTIONS.md) item 1.

## Purpose

This runbook explains how admins can detect and clean up duplicate active subscriptions, keeping Stripe as the billing source of truth.

## Access Control

The admin page is protected by an email allowlist, read from an environment variable (`lib/admin/guards.ts`):

```env
ADMIN_ALLOWLIST_EMAILS=<comma-separated admin emails>
```

Notes:

1. Values are comma-separated.
2. Emails are matched case-insensitively.
3. Set this variable in each environment (local, preview, production) where admin access is required. Changing production env vars requires owner approval (see [AGENTS.md](../AGENTS.md)).

## Admin Page

Open the internal billing operations page:

`/admin/billing`

`middleware.ts` protects `/admin` (unauthenticated users are redirected to `/login?next=/admin/billing`). The page renders the report as a table:

1. Generated timestamp and `totalAffectedUsers`
2. One card per affected user with user id/email, active-like subscription count, and each subscription's Stripe subscription ID, price ID, status and last update
3. An "Agency annual present" badge (`hasAgencyAnnual`) to speed up triage when Agency Annual is the plan to keep

## Access Outcomes

1. Not signed in: redirected to login.
2. Signed in but not in the allowlist (or allowlist not configured): "Admin access denied" card with the guard's error message.
3. Allowlisted admin: report rendered.

## Cleanup Procedure

1. Open `/admin/billing` as an allowlisted admin.
2. For each affected user, choose one subscription to keep.
3. In the Stripe Dashboard, cancel the extra subscriptions.
4. Wait for webhook delivery (`customer.subscription.updated` / `customer.subscription.deleted`).
5. Refresh `/admin/billing` and verify the user no longer appears.

## Safety Rules

1. Don't manually edit subscription status rows before webhook reconciliation.
2. Cancel duplicates in Stripe first, then verify Supabase reflects the change.
3. If webhook delivery fails, resend events from Stripe before any manual database correction.
