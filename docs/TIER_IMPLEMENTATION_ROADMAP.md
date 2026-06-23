# SiteSpresso Pricing Tier Implementation Roadmap

**Version:** 1.0  
**Created:** 2026-06-23  
**Status:** Planning  
**Target Launch:** v1.0 (Free + Starter), v1.1 (Pro), v1.2 (Agency)

---

## Executive Summary

Implement 4-tier pricing model (Free, Starter, Pro, Agency) to monetize SiteSpresso while maintaining freemium approach. Starter tier launches with v1.0 (custom domains via v1.1). Pro and Agency tiers unlock post-launch.

**Expected impact:**
- Free tier: acquisition funnel
- Starter: primary revenue (SMBs, freelancers)
- Pro: growth tier (multi-site, advanced features)
- Agency: long-tail (white-label, resellers)

---

## Phase 1: MVP Tier Setup (v1.0 - Weeks 1-2)

### M-101: Define Stripe Products & Price IDs

**Owner:** [To assign]  
**Priority:** P0 (blocking)  
**Effort:** 2 hours  
**Dependencies:** None

**Description:**
Create Stripe billing products and price IDs for all 4 tiers. Currently only `STRIPE_STARTER_PRICE_ID` exists; need Pro and Agency.

**Tasks:**
- [ ] Log into Stripe dashboard
- [ ] Create 3 products:
  - `sitespresso-starter` (monthly: $9, annual: $79)
  - `sitespresso-pro` (monthly: $19, annual: $159)
  - `sitespresso-agency` (monthly: $49, annual: $399)
- [ ] Enable annual billing options for each
- [ ] Copy all `price_id` values (test mode + live mode)
- [ ] Store in `.env.local`:
  ```
  STRIPE_STARTER_PRICE_ID=price_xxx (test)
  STRIPE_STARTER_ANNUAL_PRICE_ID=price_yyy (test)
  STRIPE_PRO_PRICE_ID=price_aaa (test)
  STRIPE_PRO_ANNUAL_PRICE_ID=price_bbb (test)
  STRIPE_AGENCY_PRICE_ID=price_ccc (test)
  STRIPE_AGENCY_ANNUAL_PRICE_ID=price_ddd (test)
  ```
- [ ] Verify in Vercel dashboard (production env)

**Acceptance Criteria:**
- ✅ All 6 Stripe products created (monthly + annual for each tier)
- ✅ Price IDs stored in `.env.local` and Vercel
- ✅ Test API calls successful to Stripe
- ✅ No typos or mismatched IDs

**Testing:**
```bash
# Verify Stripe products exist
stripe products list --api-key $STRIPE_SECRET_KEY
```

**Blocked By:** None  
**Blocks:** M-102, M-103

---

### M-102: Update Billing Constants & Types

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 3 hours  
**Dependencies:** M-101

**Description:**
Update TypeScript types and constants to recognize all 4 tier names (`free`, `starter`, `pro`, `agency`) and map them to Stripe products.

**Files to update:**
- `lib/billing/constants.ts` (create if missing)
- `lib/supabase/types.ts` (update plan type)
- `app/api/billing/checkout/route.ts`

**Tasks:**
- [ ] Create/update `lib/billing/constants.ts`:
  ```typescript
  export const TIER_PRICING = {
    free: { monthly: 0, annual: 0 },
    starter: { monthly: 9, annual: 79 },
    pro: { monthly: 19, annual: 159 },
    agency: { monthly: 49, annual: 399 },
  } as const;

  export const STRIPE_PRODUCTS = {
    starter_monthly: process.env.STRIPE_STARTER_PRICE_ID,
    starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    pro_monthly: process.env.STRIPE_PRO_PRICE_ID,
    pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    agency_monthly: process.env.STRIPE_AGENCY_PRICE_ID,
    agency_annual: process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID,
  };
  ```
- [ ] Update Supabase `profiles` table constraint if needed (ensure plan in `['free', 'starter', 'pro', 'agency']`)
- [ ] Update checkout route to accept `?plan=pro&billing=annual`
- [ ] Verify TypeScript compilation

**Acceptance Criteria:**
- ✅ `TIER_PRICING` constant defined with all 4 tiers
- ✅ `STRIPE_PRODUCTS` maps tiers to env vars
- ✅ TypeScript `plan` type updated: `type Plan = 'free' | 'starter' | 'pro' | 'agency'`
- ✅ `npm run build` passes with no errors

**Testing:**
```bash
npm run build
npm run type-check # If available
```

**Blocked By:** M-101  
**Blocks:** M-103, M-104

---

### M-103: Update `planFromStripeStatus()` Function

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** M-102

**Description:**
Currently `planFromStripeStatus()` only recognizes `free` or `starter`. Update to handle all 4 tiers by matching Stripe subscription price ID to tier.

**File:** `lib/billing/stripe-helpers.ts` (or relevant location)

**Current Code (example):**
```typescript
export function planFromStripeStatus(subscriptionStatus?: string): Plan {
  // Only recognizes 'free' vs 'starter'
  return subscriptionStatus === 'active' ? 'starter' : 'free';
}
```

**Updated Code:**
```typescript
export function planFromStripeStatus(
  subscriptionStatus?: string,
  stripePriceId?: string
): Plan {
  if (subscriptionStatus !== 'active') return 'free';
  
  // Match price ID to tier
  if (stripePriceId === process.env.STRIPE_STARTER_PRICE_ID || 
      stripePriceId === process.env.STRIPE_STARTER_ANNUAL_PRICE_ID) {
    return 'starter';
  }
  if (stripePriceId === process.env.STRIPE_PRO_PRICE_ID || 
      stripePriceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
    return 'pro';
  }
  if (stripePriceId === process.env.STRIPE_AGENCY_PRICE_ID || 
      stripePriceId === process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID) {
    return 'agency';
  }
  
  return 'free'; // Default fallback
}
```

**Tasks:**
- [ ] Locate `planFromStripeStatus()` function
- [ ] Update to accept and match `stripePriceId`
- [ ] Update all call sites to pass `stripePriceId`
- [ ] Add unit tests for each tier mapping
- [ ] Verify no plan misclassification

**Acceptance Criteria:**
- ✅ Function correctly maps all 6 Stripe price IDs to 4 tiers
- ✅ Fallback returns `free` for unmapped IDs
- ✅ All call sites pass `stripePriceId`
- ✅ Unit tests cover: free, starter (monthly), starter (annual), pro, agency
- ✅ Build passes

**Testing:**
```typescript
describe('planFromStripeStatus', () => {
  it('returns free for inactive subscription', () => {
    expect(planFromStripeStatus('canceled')).toBe('free');
  });
  
  it('returns starter for starter price IDs', () => {
    expect(planFromStripeStatus('active', STRIPE_STARTER_PRICE_ID)).toBe('starter');
  });
  
  // ... test pro, agency, etc.
});
```

**Blocked By:** M-102  
**Blocks:** M-104, M-105

---

### M-104: Update Checkout Route (`/api/billing/checkout`)

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 3 hours  
**Dependencies:** M-102, M-103

**Description:**
Extend checkout route to accept `?plan=pro&billing=annual` query params and create subscription for correct tier.

**File:** `app/api/billing/checkout/route.ts`

**Current:** Only allows Starter  
**Updated:** Allows Free → Starter/Pro/Agency upgrade flow

**Tasks:**
- [ ] Accept `plan` query param: `checkout?plan=pro&billing=annual`
- [ ] Validate plan is in `['starter', 'pro', 'agency']` (free doesn't need checkout)
- [ ] Determine billing cycle: `?billing=monthly` (default) or `?billing=annual`
- [ ] Look up correct Stripe price ID from constants
- [ ] Pass to Stripe session creation
- [ ] Redirect to Stripe checkout
- [ ] Store metadata: `{ plan, billing_cycle, previous_plan }`
- [ ] Test all combinations (3 tiers × 2 billing = 6 paths)

**Acceptance Criteria:**
- ✅ Accepts plan parameter (starter/pro/agency)
- ✅ Accepts billing parameter (monthly/annual)
- ✅ Correct Stripe price ID selected for each combo
- ✅ Checkout redirects to Stripe with correct product
- ✅ All 6 combinations tested in browser
- ✅ No 500 errors; proper error messages for invalid params

**Testing:**
```bash
# Test each tier + billing combo
curl "http://localhost:3000/api/billing/checkout?plan=pro&billing=annual"
curl "http://localhost:3000/api/billing/checkout?plan=starter&billing=monthly"
# etc.
```

**Blocked By:** M-102, M-103  
**Blocks:** M-105, M-106

---

### M-105: Update Webhook Handler (`/api/webhooks/stripe`)

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** M-103

**Description:**
Webhook handler updates user's plan in DB when subscription changes. Ensure it correctly identifies tier from Stripe price ID.

**File:** `app/api/webhooks/stripe/route.ts`

**Current:** Likely only sets 'starter' or 'free'  
**Updated:** Maps price ID to correct tier (starter/pro/agency)

**Events to handle:**
- `customer.subscription.created` → Set plan from price ID
- `customer.subscription.updated` → Update plan from new price ID
- `customer.subscription.deleted` → Revert to `free`
- `invoice.payment_succeeded` → Log transaction (optional)

**Tasks:**
- [ ] Extract `price_id` from Stripe event
- [ ] Call `planFromStripeStatus('active', price_id)` to get tier
- [ ] Update `profiles.plan` column with correct tier
- [ ] Handle edge case: subscription upgrade mid-month
- [ ] Handle edge case: subscription downgrade
- [ ] Add logging for each event
- [ ] Test webhook signature validation

**Acceptance Criteria:**
- ✅ Webhook correctly updates plan for all 4 tiers
- ✅ Downgrade (pro → starter) works
- ✅ Upgrade (starter → pro) works
- ✅ Cancellation → free works
- ✅ All events logged for debugging
- ✅ Stripe webhook test endpoint passes

**Testing:**
```bash
# Use Stripe CLI to forward events
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test event
stripe trigger customer.subscription.created
```

**Blocked By:** M-103  
**Blocks:** M-106

---

### M-106: Update Dashboard Plan Display

**Owner:** [To assign]  
**Priority:** P1  
**Effort:** 2 hours  
**Dependencies:** M-103, M-104

**Description:**
Dashboard currently shows `plan` and "Manage Billing" button. Update to show:
1. Current plan (Free/Starter/Pro/Agency)
2. Upgrade/downgrade buttons if applicable
3. Link to upgrade to next tier

**File:** `app/dashboard/page.tsx`

**Current Display:**
```
Current plan: starter
[Manage Billing] button
```

**Updated Display:**
```
Current plan: Starter
Renewal date: July 15, 2026
[Manage Billing] [Upgrade to Pro →] buttons
(or "You're on our highest tier" for Agency)
```

**Tasks:**
- [ ] Display tier name with proper capitalization
- [ ] Show next tier upgrade link (Pro if on Starter, Agency if on Pro)
- [ ] Hide upgrade button for Agency tier
- [ ] Show annual renewal date if applicable
- [ ] Add CTA: "Upgrade" button color-coded
- [ ] Mobile responsive

**Acceptance Criteria:**
- ✅ All 4 tiers display correctly on dashboard
- ✅ Upgrade button shows for Free/Starter/Pro
- ✅ No upgrade button for Agency
- ✅ Renewal date displays
- ✅ Mobile responsive (tablet/phone)
- ✅ Build passes

**Testing:**
- [ ] View as Free user
- [ ] View as Starter user
- [ ] View as Pro user
- [ ] View as Agency user
- [ ] Test on mobile, tablet, desktop

**Blocked By:** M-104  
**Blocks:** M-107

---

### M-107: Create Billing Documentation

**Owner:** [To assign]  
**Priority:** P2  
**Effort:** 1 hour  
**Dependencies:** M-106

**Description:**
Document the tier system, features, and pricing for customers and support team.

**Deliverables:**
1. `docs/PRICING.md` - Customer-facing pricing page (markdown)
2. `docs/BILLING_SUPPORT.md` - Support troubleshooting guide
3. `docs/TIER_FEATURES.md` - Feature matrix and plan comparison

**Content:**
- Tier names, prices, features
- FAQ: Can I change plans? Refunds? Downgrade?
- Support contact info
- Feature matrix table

**Acceptance Criteria:**
- ✅ Pricing docs created and clear
- ✅ Feature matrix complete and accurate
- ✅ FAQ covers common questions
- ✅ Markdown formatted and readable

**Blocked By:** M-106  
**Blocks:** None (independent)

---

## Phase 2: Pro Tier Unlock (v1.1 - Weeks 3-4)

### M-201: Implement Custom Domain Feature

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 20+ hours (large feature)  
**Dependencies:** M-101 through M-107

**Description:**
Enable users to attach custom domains to sites. This is the key differentiator for Pro tier. High complexity—DNS CNAME verification, SSL provisioning, Vercel domain API integration.

**Subtasks:**
- M-201a: Database schema for domains
- M-201b: Vercel domain API wrapper
- M-201c: DNS verification flow (CNAME check)
- M-201d: Dashboard UI for domain management
- M-201e: Publishing with custom domain
- M-201f: SSL certificate provisioning
- M-201g: Testing (happy path + edge cases)

**See:** [CUSTOM_DOMAINS_IMPLEMENTATION.md](./CUSTOM_DOMAINS_IMPLEMENTATION.md) (separate detailed doc)

**Acceptance Criteria:**
- ✅ User can add custom domain to Pro site
- ✅ DNS CNAME verification works
- ✅ SSL certificate auto-provisions
- ✅ Published site works on custom domain
- ✅ Subdomain fallback if domain fails
- ✅ Error messaging clear for DNS issues

**Blocked By:** All Phase 1 tasks  
**Blocks:** M-202

---

### M-202: Pro Tier Launch & Communication

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** M-201

**Description:**
Enable Pro tier in production:
1. Activate Pro tier in UI
2. Update landing page with Pro pricing
3. Send launch email to beta users
4. Monitor signup rate and conversion

**Tasks:**
- [ ] Set `PRO_TIER_ENABLED=true` in Vercel
- [ ] Update landing page: show all 3 tiers (Free/Starter/Pro)
- [ ] Update pricing page comparison table
- [ ] Create launch email template
- [ ] Send to Free and Starter users: "Try Pro with custom domains"
- [ ] Monitor analytics: upgrade rate, churn
- [ ] Monitor support: refund/downgrade requests

**Acceptance Criteria:**
- ✅ Pro tier visible on landing page and in app
- ✅ Checkout accepts `?plan=pro`
- ✅ Email sent to active users
- ✅ No critical bugs reported (24hr monitoring)

**Blocked By:** M-201  
**Blocks:** None

---

## Phase 3: Agency Tier & Multi-Site (v1.2 - Weeks 5-6)

### M-301: Multi-Site Support

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 15+ hours  
**Dependencies:** M-201

**Description:**
Enable Pro (3 sites) and Agency (unlimited sites). This requires:
- Dashboard site list pagination/management
- Quota per site vs. per user (likely unchanged)
- Bulk actions (delete multiple, export)

**Subtasks:**
- M-301a: Update quota logic (per user, not per site)
- M-301b: Dashboard site management UX
- M-301c: Site limit enforcement (show "upgrade" if at limit)
- M-301d: Bulk site deletion
- M-301e: Export site data (JSON/CSV)

**Acceptance Criteria:**
- ✅ Pro users can create up to 3 sites
- ✅ Agency users unlimited sites
- ✅ Free/Starter still limited to 1 site
- ✅ Clear "upgrade" CTA when limit reached
- ✅ Dashboard handles 10+ sites without lag

**Blocked By:** M-201  
**Blocks:** M-302

---

### M-302: Agency Tier Features (Team, White-label, API)

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 20+ hours  
**Dependencies:** M-301

**Description:**
Unlock Agency-only features. This is a large feature set with multiple subtasks.

**Subtasks:**
- M-302a: Team management (invite members, roles: admin/editor/viewer)
- M-302b: White-label option (custom branding, domain)
- M-302c: Analytics API (export data, webhook integration)
- M-302d: Dedicated Slack support channel
- M-302e: Priority feature request process

**See:** [AGENCY_FEATURES_IMPLEMENTATION.md](./AGENCY_FEATURES_IMPLEMENTATION.md) (separate detailed doc)

**Acceptance Criteria:**
- ✅ Agency users can invite team members
- ✅ Team members can edit sites with proper permissions
- ✅ White-label branding removed (custom company name)
- ✅ Analytics API functional (export JSON/CSV)
- ✅ Support channel created and monitored

**Blocked By:** M-301  
**Blocks:** M-303

---

### M-303: Agency Tier Launch

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 1 hour  
**Dependencies:** M-302

**Description:**
Activate Agency tier in production and promote to Pro users.

**Tasks:**
- [ ] Set `AGENCY_TIER_ENABLED=true` in Vercel
- [ ] Update landing/pricing page: show all 4 tiers
- [ ] Target Pro users: "Upgrade to Agency for team collaboration and white-label"
- [ ] Update help docs with Agency features
- [ ] Monitor signup rate and feature adoption

**Acceptance Criteria:**
- ✅ Agency tier visible and purchasable
- ✅ No critical bugs in team/white-label features
- ✅ Support ready for Agency tier questions

**Blocked By:** M-302  
**Blocks:** None

---

## Testing & Quality Assurance

### Q-101: Unit Tests for Billing Logic

**Owner:** [To assign]  
**Priority:** P1  
**Effort:** 4 hours  
**Parallel with:** M-103, M-104

**Tests to write:**
- `planFromStripeStatus()` for all 4 tiers
- Quota calculation per tier
- Tier upgrade/downgrade logic
- Annual discount calculation
- Edge cases: cancellation, failed payment, reactivation

**Acceptance Criteria:**
- ✅ 90%+ code coverage for `lib/billing/*`
- ✅ All tier transitions tested
- ✅ CI/CD passes test suite

---

### Q-102: Integration Tests (Stripe Sandbox)

**Owner:** [To assign]  
**Priority:** P1  
**Effort:** 6 hours  
**Parallel with:** M-104, M-105

**Tests:**
- Checkout flow (Free → Starter → Pro → Agency)
- Webhook events (create, update, delete subscription)
- Plan display on dashboard
- Quota enforcement per plan
- Downgrade/upgrade scenarios

**Tools:** Stripe CLI, Jest/Vitest integration tests

**Acceptance Criteria:**
- ✅ All 6 checkout paths work (3 tiers × 2 billing)
- ✅ Webhook correctly updates DB plan
- ✅ No payment processing errors
- ✅ Graceful error handling

---

### Q-103: Manual UAT (User Acceptance Testing)

**Owner:** [To assign]  
**Priority:** P1  
**Effort:** 4 hours  
**Parallel with:** M-106, M-107

**Scenarios:**
1. New user: Free tier → Starter upgrade
2. Existing user: Free → Pro (annual billing)
3. Account manager: Downgrade Pro → Starter
4. Refund request: Cancel subscription
5. Custom domain: Pro user adds domain (v1.1)
6. Multi-site: Pro user creates 3 sites (v1.2)

**Success:** All scenarios complete without errors, clear UI messaging

**Blocked By:** M-106  
**Blocks:** Launch

---

## Deployment & Rollout

### D-101: Staging Deployment (v1.0)

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 1 hour  
**Dependencies:** All Phase 1 tasks

**Checklist:**
- [ ] All env vars (`STRIPE_*_PRICE_ID`) set in staging Vercel
- [ ] Staging Stripe account active (test mode)
- [ ] Database migrations applied (if any)
- [ ] Webhook endpoint configured in Stripe
- [ ] Health checks pass: `/api/health`, `/api/user/quota`

**Acceptance Criteria:**
- ✅ Staging environment fully functional
- ✅ No console errors in browser
- ✅ Checkout works end-to-end (test payment)
- ✅ Ready for UAT

---

### D-102: Production Deployment (v1.0)

**Owner:** [To assign]  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** D-101 + Q-103

**Checklist:**
- [ ] Production Stripe account active (live mode)
- [ ] All env vars set in production Vercel
- [ ] Database migrations applied (prod)
- [ ] Webhook endpoint LIVE in Stripe (not test)
- [ ] SSL certificates valid
- [ ] DNS configured
- [ ] Backup of Supabase ready
- [ ] Monitoring/alerts set up (errors, failed payments)
- [ ] Support team briefed on tier features
- [ ] Pricing page live

**Go-live steps:**
1. Deploy to Vercel (production branch)
2. Verify: can checkout Starter tier
3. Monitor for 1 hour: watch error logs, payment processing
4. Announce on Twitter/email: "Pricing tiers now live!"

**Rollback plan:**
- Disable checkout: set `CHECKOUT_ENABLED=false`
- Revert all users to Free tier (optional, destructive)

**Acceptance Criteria:**
- ✅ Production payments processing
- ✅ No critical errors (errors < baseline)
- ✅ Support receives no refund requests (first hour)
- ✅ Team celebrates! 🎉

---

## Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Stripe API rate limit exceeded | Low | High | Implement exponential backoff, queue non-critical webhooks |
| Incorrect plan assignment | Medium | Medium | Comprehensive tests for `planFromStripeStatus()`, manual audit |
| Webhook failures cause sync issues | Low | High | Dead-letter queue for failed webhooks, retry logic |
| Users confused by tier options | Medium | Low | Clear landing page, in-app tooltips, support docs |
| Payment processing delays | Low | Medium | Monitor Stripe status page, have support escalation path |
| Downgrade abuse (upgrade → downgrade immediately) | Low | Low | Require 7-day minimum before downgrade (future feature) |

---

## Success Metrics (Post-Launch)

Track these KPIs to measure tier strategy success:

| Metric | Target | Tracking |
|--------|--------|----------|
| Free→Starter conversion rate | ≥ 5% | Mixpanel/GA event: `checkout_initiated` |
| Starter tier ARPU | $7/mo avg | Stripe dashboard |
| Customer acquisition cost (CAC) | < $5 | Revenue ÷ marketing spend |
| Churn rate (Starter) | < 10%/month | Stripe + Supabase query |
| Feature adoption (Pro: custom domain) | > 50% of Pro users | Audit `sites.custom_domain` |
| Support tickets per user | < 0.5/month | HubSpot or similar |

---

## Dependencies & Milestones

```
Phase 1 (MVP):
  M-101 (Stripe setup) → M-102 → M-103 → M-104 → M-105 → M-106 → M-107
  (2 weeks, 15 tasks)
  Launch: Free + Starter active

Phase 2 (Pro):
  M-201 (Custom domains) → M-202 (Launch Pro)
  (2 weeks, 2 tasks)
  Launch: Pro tier active

Phase 3 (Agency):
  M-301 (Multi-site) → M-302 (Agency features) → M-303 (Launch Agency)
  (2 weeks, 3 tasks)
  Launch: All 4 tiers active
```

**Total effort:** ~70-80 hours across 3-4 weeks for full 4-tier implementation

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-23 | Initial roadmap: 4 tiers, 3 phases, 13 major tasks |

