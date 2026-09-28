# Billing alignment flags (for Sitespresso Billing)

Draft refund/cancel wording must match checkout and the Stripe Customer Portal. Please verify each row against sandbox runs (Q-102) and mark PASS / FAIL / OPEN.

| # | Draft claim | Source in draft | Expected product behaviour | Status |
|---|---|---|---|---|
| 1 | Paid plans renew automatically until canceled | terms, refunds | Stripe subscription `cancel_at_period_end` / portal cancel | OPEN |
| 2 | After cancel in the portal, access continues until the end of the paid period | refunds | Webhook keeps plan while status is `active`/`trialing`; Free after cancel | OPEN |
| 3 | Downgrade / plan change takes effect per Stripe portal rules for the price change | refunds | Confirm immediate vs period-end for upgrades and downgrades | OPEN |
| 4 | Free plan: drafts allowed, publish blocked until paid | terms, refunds | `POST /api/sites/[id]/publish` returns `requiresBilling` when `plan === 'free'` | OPEN (code matches; confirm UX copy) |
| 5 | Site limits: Free 1, Starter 1, Pro 3, Agency unlimited | terms | `lib/billing/site-limits.ts` | OPEN (code matches) |
| 6 | Generation quotas: Free 3, Starter 50, Pro 500, Agency 5,000 / month | terms | `lib/redis/rate-limiter.ts` / ROADMAP | OPEN |
| 7 | Currency prices default Starter €9/€79, Pro €19/€159, Agency €49/€399; live Stripe amounts may override | terms | `lib/billing/plans.ts` + Stripe price overrides | OPEN |
| 8 | No automatic cash refund on cancel; refunds are case-by-case (duplicate charge, unintended upgrade, platform outage) | refunds | Confirm ops process and Stripe refund usage | OPEN |
| 10 | When a paid plan ends, published sites revert to draft (offline); content kept; republish by subscribing again | refunds | `handleSubscriptionDeleted` in `app/api/webhooks/stripe/route.ts` sets `status: 'draft'` | PASS (code matches, per Billing 2026-09-28) |
| 9 | EU consumer mandatory rights are not limited by this policy | refunds | Legal review | OPEN |

Do not change Stripe or Vercel from this docs PR. Report results in the SiteSpresso room.
