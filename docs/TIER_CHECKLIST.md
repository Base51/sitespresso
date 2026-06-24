# Tier Implementation - Task Checklist & Tracking

**Last Updated:** 2026-06-23  
**Overall Progress:** 0% (Planning phase)

---

## Phase 1: MVP Tier Setup (v1.0) — 2 Weeks

### M-101: Stripe Products & Price IDs
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 2h  
**Due:** [Set date]

- [ ] Create Stripe product: `sitespresso-starter` (monthly $9)
- [ ] Create Stripe price: annual $79
- [ ] Create Stripe product: `sitespresso-pro` (monthly $19)
- [ ] Create Stripe price: annual $159
- [ ] Create Stripe product: `sitespresso-agency` (monthly $49)
- [ ] Create Stripe price: annual $399
- [ ] Copy test mode price IDs to `.env.local`
- [ ] Copy live mode price IDs to Vercel (production env)
- [ ] Verify all 6 price IDs with Stripe CLI

**Notes:**  
```
STRIPE_STARTER_PRICE_ID = ???
STRIPE_STARTER_ANNUAL_PRICE_ID = ???
STRIPE_PRO_PRICE_ID = ???
STRIPE_PRO_ANNUAL_PRICE_ID = ???
STRIPE_AGENCY_PRICE_ID = ???
STRIPE_AGENCY_ANNUAL_PRICE_ID = ???
```

---

### M-102: Billing Constants & Types
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 3h  
**Depends on:** M-101  
**Due:** [Set date]

- [ ] Create `lib/billing/constants.ts`
- [ ] Define `TIER_PRICING` object (all 4 tiers, monthly + annual)
- [ ] Define `STRIPE_PRODUCTS` mapping
- [ ] Update Supabase type: `plan` ∈ `['free', 'starter', 'pro', 'agency']`
- [ ] Update all imports to use new constants
- [ ] Run TypeScript check: `npm run type-check`
- [ ] Build succeeds: `npm run build`

**Files:**
- [ ] `lib/billing/constants.ts` (new)
- [ ] `lib/supabase/types.ts` (update)
- [ ] `app/api/billing/checkout/route.ts` (update)

---

### M-103: `planFromStripeStatus()` Function Update
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 2h  
**Depends on:** M-102  
**Due:** [Set date]

- [ ] Locate function (search: `planFromStripeStatus`)
- [ ] Add `stripePriceId` parameter
- [ ] Update logic to match price ID to tier (all 6 combos)
- [ ] Add fallback to `free` for unmapped IDs
- [ ] Update all call sites to pass `stripePriceId`
- [ ] Write unit tests (4+ scenarios)
- [ ] All tests pass: `npm run test`

**Tests to add:**
- [ ] `free` when inactive
- [ ] `starter` for monthly price ID
- [ ] `starter` for annual price ID
- [ ] `pro` for monthly price ID
- [ ] `pro` for annual price ID
- [ ] `agency` for monthly price ID
- [ ] `agency` for annual price ID
- [ ] Fallback to `free` for unknown price ID

---

### M-104: Checkout Route (`/api/billing/checkout`)
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 3h  
**Depends on:** M-102, M-103  
**Due:** [Set date]

- [ ] Accept `?plan=` query param (starter, pro, agency)
- [ ] Accept `?billing=` query param (monthly, annual)
- [ ] Validate plan is in allowed list
- [ ] Validate billing is monthly or annual
- [ ] Look up correct Stripe price ID from `STRIPE_PRODUCTS`
- [ ] Handle missing/invalid params with 400 error + message
- [ ] Pass price ID to Stripe session creation
- [ ] Store metadata: `{ plan, billing_cycle, timestamp }`
- [ ] Test all 6 combinations (3 tiers × 2 billing)

**Test URLs:**
- [ ] `localhost:3000/api/billing/checkout?plan=starter&billing=monthly`
- [ ] `localhost:3000/api/billing/checkout?plan=starter&billing=annual`
- [ ] `localhost:3000/api/billing/checkout?plan=pro&billing=monthly`
- [ ] `localhost:3000/api/billing/checkout?plan=pro&billing=annual`
- [ ] `localhost:3000/api/billing/checkout?plan=agency&billing=monthly`
- [ ] `localhost:3000/api/billing/checkout?plan=agency&billing=annual`

---

### M-105: Webhook Handler (`/api/webhooks/stripe`)
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 2h  
**Depends on:** M-103  
**Due:** [Set date]

- [ ] Extract `price_id` from Stripe event JSON
- [ ] Call `planFromStripeStatus('active', price_id)` to get tier
- [ ] Update `profiles.plan` column with tier
- [ ] Handle `customer.subscription.created` event
- [ ] Handle `customer.subscription.updated` event (upgrade/downgrade)
- [ ] Handle `customer.subscription.deleted` event (set to `free`)
- [ ] Add logging: log all events and plan changes
- [ ] Test with Stripe CLI: `stripe trigger customer.subscription.created`

**Events checklist:**
- [ ] subscription.created → set plan from price_id
- [ ] subscription.updated → update plan from price_id
- [ ] subscription.deleted → set plan to free
- [ ] payment_intent.succeeded → (optional logging)

---

### M-106: Dashboard Plan Display Update
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 2h  
**Depends on:** M-104  
**Due:** [Set date]

- [ ] Update plan display text (capitalize: "Starter", "Pro", "Agency")
- [ ] Show current plan label and renewal date
- [ ] Add upgrade button for Free/Starter/Pro → next tier
- [ ] Hide upgrade button for Agency tier
- [ ] Update button color (CTA green or brand color)
- [ ] Make mobile-responsive (test on phone/tablet)
- [ ] Test on all 4 user tiers
- [ ] Build passes: `npm run build`

**Dashboard changes:**
- [ ] Plan display (current tier name)
- [ ] Renewal date (if applicable)
- [ ] Upgrade CTA button
- [ ] Mobile responsive layout

---

### M-107: Documentation (Billing & Pricing)
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 1h  
**Depends on:** M-106  
**Due:** [Set date]

- [ ] Create `docs/PRICING.md` (customer-facing)
- [ ] Create `docs/TIER_FEATURES.md` (feature matrix)
- [ ] Create `docs/BILLING_SUPPORT.md` (support FAQ)
- [ ] Document each tier: features, quota, price
- [ ] Include feature comparison table
- [ ] FAQ: plan changes, refunds, billing cycles
- [ ] Markdown formatted and readable

---

## Phase 2: Pro Tier Unlock (v1.1) — 2 Weeks

### M-201: Custom Domain Feature Implementation
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 20+ hours  
**Depends on:** M-107 (Phase 1 complete)  
**Due:** [Set date]

**Major subtasks:** (see [CUSTOM_DOMAINS_IMPLEMENTATION.md](./CUSTOM_DOMAINS_IMPLEMENTATION.md) for details)
- [x] Registration foundation: `custom_domain` + `domain_verified` on `sites`
- [x] Paid-gated dashboard UI with visible locked state for free users
- [x] API enforcement: paid tiers only
- [ ] DNS CNAME verification endpoint
- [ ] Publishing: route custom domain to site
- [ ] SSL certificate auto-provisioning
- [ ] Error handling: DNS failures, SSL issues
- [ ] End-to-end testing

**Note:** This is a large feature. Consider breaking into sprints.

---

### M-202: Pro Tier Launch
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 2h  
**Depends on:** M-201  
**Due:** [Set date]

- [ ] Set `PRO_TIER_ENABLED=true` in Vercel (production)
- [ ] Update landing page: show Pro tier pricing/features
- [ ] Update pricing page: 3-tier comparison table (Free, Starter, Pro)
- [ ] Create launch email: "Introducing Pro tier with custom domains"
- [ ] Send email to Free/Starter users
- [ ] Monitor: checkout flow, errors, support tickets
- [ ] Announce on Twitter/LinkedIn

---

## Phase 3: Agency Tier & Multi-Site (v1.2) — 2 Weeks

### M-301: Multi-Site Support
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 15+ hours  
**Depends on:** M-201  
**Due:** [Set date]

- [ ] Database: update site limits per tier
- [ ] Quota logic: confirm per-user, not per-site
- [ ] Dashboard: site list pagination (Pro: 3 max, Agency: unlimited)
- [ ] UI: show "site count: 2/3" or similar
- [ ] Error: "You've reached your site limit. Upgrade to Pro for 3 sites."
- [ ] Bulk actions: delete multiple, export list
- [ ] End-to-end testing (all tier limits)

---

### M-302: Agency Tier Features (Team, White-label, API)
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 20+ hours  
**Depends on:** M-301  
**Due:** [Set date]

**Major subtasks:** (see AGENCY_FEATURES_IMPLEMENTATION.md for details)
- [ ] Team management: invite, roles (admin/editor/viewer)
- [ ] White-label: custom company branding
- [ ] Analytics API: export data (JSON/CSV)
- [ ] Dedicated support: Slack channel
- [ ] Priority requests: feature voting

---

### M-303: Agency Tier Launch
**Status:** ⏳ Not Started  
**Owner:** [Unassigned]  
**Effort:** 1h  
**Depends on:** M-302  
**Due:** [Set date]

- [ ] Set `AGENCY_TIER_ENABLED=true` in Vercel
- [ ] Update landing page: show all 4 tiers
- [ ] Update pricing: Agency tier pricing/features
- [ ] Email Pro users: "Upgrade to Agency for team collaboration"
- [ ] Monitor: adoption, feature usage, support

---

## Testing & QA

### Q-101: Unit Tests (Billing Logic)
**Status:** ⏳ Not Started  
**Parallel with:** M-103, M-104  
**Effort:** 4h

- [ ] Test: `planFromStripeStatus()` all 4 tiers
- [ ] Test: tier upgrade scenarios
- [ ] Test: tier downgrade scenarios
- [ ] Test: quota per tier
- [ ] Test: annual discount calculation
- [ ] Coverage: ≥90% for `lib/billing/*`
- [ ] CI/CD passes: `npm run test`

---

### Q-102: Integration Tests (Stripe Sandbox)
**Status:** ⏳ Not Started  
**Parallel with:** M-104, M-105  
**Effort:** 6h

- [ ] Test checkout: Free → Starter
- [ ] Test checkout: Free → Pro (annual)
- [ ] Test checkout: Starter → Agency
- [ ] Test webhook: subscription created
- [ ] Test webhook: subscription updated (upgrade)
- [ ] Test webhook: subscription deleted (cancel)
- [ ] Test: plan display on dashboard (all 4 tiers)
- [ ] Test: quota enforcement per plan

---

### Q-103: Manual UAT
**Status:** ⏳ Not Started  
**Parallel with:** M-106, M-107  
**Effort:** 4h

- [ ] Scenario: New user signs up → Free → Starter upgrade
- [ ] Scenario: User downgrades: Starter → Free
- [ ] Scenario: Annual billing: Free → Pro (annual checkout)
- [ ] Scenario: Dashboard displays correct plan and renewal date
- [ ] Scenario: Upgrade CTA visible on dashboard (all tiers)
- [ ] Scenario: Mobile responsive (all flows on phone)
- [ ] All scenarios pass without errors

---

## Deployment

### D-101: Staging Deployment
**Status:** ⏳ Not Started  
**Depends on:** All Phase 1 tasks  
**Effort:** 1h

- [ ] Set all `STRIPE_*` env vars in Vercel staging
- [ ] Use Stripe test mode account
- [ ] Apply database migrations (if any)
- [ ] Configure webhook endpoint in Stripe (staging)
- [ ] Test checkout end-to-end (test payment card)
- [ ] Verify health checks: `/api/health`
- [ ] Ready for UAT

---

### D-102: Production Deployment
**Status:** ⏳ Not Started  
**Depends on:** D-101 + Q-103  
**Effort:** 2h

- [ ] Backup Supabase database (prod)
- [ ] Set all `STRIPE_*` env vars in Vercel (production)
- [ ] Use Stripe live mode account
- [ ] Configure webhook endpoint in Stripe (live, not test)
- [ ] Health checks pass
- [ ] DNS configured, SSL valid
- [ ] Support team briefed
- [ ] Monitor error logs for 1 hour post-deploy
- [ ] Announce launch

---

## Success Metrics (Post-Launch)

**Tier Adoption:**
- [ ] Free→Starter conversion rate: target ≥5%
- [ ] Starter tier ARPU: target ~$7/mo
- [ ] Pro tier adoption: track monthly

**Customer Health:**
- [ ] Churn rate (Starter): target <10%/month
- [ ] Support tickets per user: target <0.5/month
- [ ] Feature adoption: custom domain >50% of Pro users

**Business:**
- [ ] Customer acquisition cost: target <$5
- [ ] Monthly recurring revenue (MRR): target $500+ by end of Q2
- [ ] Payback period: target <10 months

---

## Notes & Decisions

### Technical Decisions
- **Pricing model:** Monthly + annual (annual = ~30% discount)
- **Quota reset:** Monthly (calendar month, 30 days from signup)
- **Billing cycle:** Trial → paid OR free tier permanently → upgrade
- **Downgrade:** Prorated? TBD (initial: no prorating)

### Product Decisions
- **Free tier:** Permanent (not time-limited trial)
- **Custom domain:** Paid-tier feature (Starter, Pro, Agency), not available on Free
- **Multi-site:** Pro (3), Agency (unlimited)
- **Team collaboration:** Agency only

### Pricing Decisions
- Free: $0 (forever)
- Starter: $9/mo, $79/year (2-month discount)
- Pro: $19/mo, $159/year (3-month discount)
- Agency: $49/mo, $399/year (3-month discount)

---

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Product Manager | [Name] | [Date] | [ ] |
| Engineering Lead | [Name] | [Date] | [ ] |
| Finance/Ops | [Name] | [Date] | [ ] |

---

## Quick Links

- Pricing plan: [TIER_IMPLEMENTATION_ROADMAP.md](./TIER_IMPLEMENTATION_ROADMAP.md)
- Custom domains details: [CUSTOM_DOMAINS_IMPLEMENTATION.md](./CUSTOM_DOMAINS_IMPLEMENTATION.md) (TODO)
- Agency features details: [AGENCY_FEATURES_IMPLEMENTATION.md](./AGENCY_FEATURES_IMPLEMENTATION.md) (TODO)
- Stripe dashboard: https://dashboard.stripe.com
- Vercel dashboard: https://vercel.com/dashboard

