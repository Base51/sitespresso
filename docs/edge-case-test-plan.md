# M8 Edge Case Testing Plan (T-084-087)

**Date**: 2026-06-22  
**Scope**: T-084, T-085, T-086, T-087  
**Target**: Verify app handles edge cases gracefully without crashes or data corruption

---

## T-084: Slug Conflict & Reserved Slug Edge Cases

### Test Scenarios

#### T-084.1: Reserved Slug Detection
- **Setup**: User creates site with business name that resolves to reserved slug
- **Examples**: "Admin Services", "API Solutions", "Dashboard Pro", "www-something"
- **Expected**: 
  - Error returned: "Business name resolves to a reserved slug. Please choose a different name."
  - Site NOT created
  - No publish attempt made
- **Status**: ✅ CODE VERIFIED (`lib/slug.ts:isReservedSlug()` checks 25 reserved slugs)

#### T-084.2: Slug Conflict Resolution
- **Setup**: Two users create sites with same business name
- **Scenario 1**: User A publishes "Jane's Salon" → slug = `janes-salon`
- **Scenario 2**: User B publishes "Jane's Salon" → slug = `janes-salon-2`
- **Expected**: Both sites publish successfully with unique slugs
- **Status**: ✅ CODE VERIFIED (`lib/slug.ts:findUniqueSlug()` appends `-2`, `-3`, etc.)

#### T-084.3: Slug Uniqueness Limit
- **Setup**: Try to create 11+ sites with same business name
- **Expected**: After 10 attempts (`maxAttempts = 10`), 11th fails with error
- **Edge Case**: `findUniqueSlug()` returns `null` after exhausting all attempts
- **Status**: ✅ CODE VERIFIED (`maxAttempts = 10` in slug.ts)

#### T-084.4: Special Character Slug Sanitization
- **Test Cases**:
  - "John's Coffee Shop" → `johns-coffee-shop` (apostrophe removed)
  - "A&B Solutions" → `ab-solutions` (ampersand removed)
  - "Test---Multiple---Hyphens" → `test-multiple-hyphens` (collapsed)
  - "  Leading spaces  " → `leading-spaces` (trimmed)
  - "ALL-CAPS SLUG" → `all-caps-slug` (lowercased)
- **Expected**: All special chars removed, spaces → hyphens, lowercase
- **Status**: ✅ CODE VERIFIED (`generateSlug()` regex and transformations)

### Manual Test Checklist

- [ ] Attempt to publish site named "API Services" → error shown
- [ ] Create two sites with name "Plumber" → both publish, 2nd is `plumber-2`
- [ ] Create site with name "O'Reilly's Shop" → special chars handled
- [ ] Create 11 duplicate names → 11th fails gracefully

---

## T-085: Auth Edge Cases

### Test Scenarios

#### T-085.1: Expired Session Handling
- **Setup**: Create authenticated session, wait for expiry (or manually expire token)
- **Expected**:
  - Middleware calls `supabase.auth.getUser()` → returns null for expired token
  - User redirected to `/login?next=/dashboard`
  - User can re-authenticate and return to `/dashboard`
  - No error pages or 500s
- **Notes**: Supabase SDK should auto-refresh; if not, user must re-login
- **Status**: ⚠️ NEEDS TESTING

#### T-085.2: Redirect Loop Prevention
- **Setup**: Manually visit `/login?next=/login`
- **Expected**:
  - If user is authenticated, redirect to `/dashboard` (not `/login` again)
  - If unauthenticated, show `/login` page (not loop)
- **Middleware Logic**: 
  ```typescript
  if (user && pathname === '/login') {
    // Redirect to dashboard, delete 'next' param
    return NextResponse.redirect('/dashboard');
  }
  ```
- **Status**: ✅ CODE VERIFIED (middleware prevents redirect loop)

#### T-085.3: Protected Route Access
- **Setup**: Unauthenticated user visits `/dashboard` or `/account`
- **Expected**: 
  - Middleware redirects to `/login?next=/dashboard`
  - User can sign in and return to original path
- **Verification**: Check `isProtectedPath()` includes all protected routes
- **Status**: ✅ CODE VERIFIED (`PROTECTED_PATHS = ['/dashboard']`)

#### T-085.4: Sign-In Callback Redirect
- **Setup**: User clicks sign-in button with `?next=/account`
- **Expected**: 
  - After successful sign-in, redirected to `/account` (not `/dashboard`)
  - If no `next` param, default to `/dashboard`
- **Status**: ⚠️ NEEDS VERIFICATION (check `/auth/callback` and login page logic)

### Manual Test Checklist

- [ ] Set session expiry to 1 second, wait, try to access protected page
- [ ] Visit `/login?next=/login` while authenticated → redirects to `/dashboard`
- [ ] Visit `/dashboard` unauthenticated → redirects to `/login?next=/dashboard`
- [ ] Sign in with `?next=/account` → lands on `/account`

---

## T-086: Stripe Webhook Idempotency

### Test Scenarios

#### T-086.1: Duplicate Webhook Event
- **Setup**: Send same `checkout.session.completed` event twice
- **Event Details**: Same `stripe_subscription_id` and `stripe_customer_id`
- **Expected**:
  - First event: Creates subscription record + updates profile + publishes site
  - Second event: Updates existing subscription (via upsert on `stripe_subscription_id`)
  - Only ONE subscription in DB (no duplicate)
  - Site published flag remains true (not toggled)
- **Implementation**: Uses `.upsert(..., { onConflict: 'stripe_subscription_id' })`
- **Status**: ✅ CODE VERIFIED (upsert logic in place)

#### T-086.2: Webhook Out-of-Order Processing
- **Setup**: Send events in reverse order
  1. `customer.subscription.deleted` 
  2. `customer.subscription.updated`
  3. `checkout.session.completed`
- **Expected**: Final state should be consistent regardless of order (if using proper idempotency)
- **Current Status**: ⚠️ POTENTIAL ISSUE
  - Deletion sets `plan: 'free'` and `status: 'draft'`
  - Then update sets `plan: 'starter'` and site back to `published`
  - Result should be: `plan: 'starter'`, site `published` ✓
- **Status**: ⚠️ NEEDS TESTING (verify final state is correct)

#### T-086.3: Missing or Invalid Metadata
- **Setup**: Send webhook with missing `user_id` or `stripe_customer_id`
- **Expected**: 
  - Error thrown: "Could not resolve user for subscription..."
  - Webhook returns 500
  - Stripe retry queue will retry (Stripe retries for 3 days)
- **Status**: ✅ CODE VERIFIED (error handling in place)

#### T-086.4: Webhook Signature Validation
- **Setup**: Modify webhook signature or send invalid request
- **Expected**: 
  - Webhook rejected with 400: "Invalid webhook signature"
  - No data processed
- **Status**: ✅ CODE VERIFIED (`stripe.webhooks.constructEvent()` validates signature)

### Manual Test Checklist (Stripe Dashboard)

- [ ] Go to Stripe test dashboard → Webhooks
- [ ] Send `checkout.session.completed` event twice → verify 1 subscription created
- [ ] Monitor subscription count in Supabase
- [ ] Verify site auto-published on first event only
- [ ] Check database for no duplicate records

---

## T-087: Generation Failure & Retry UX

### Test Scenarios

#### T-087.1: OpenAI API Timeout
- **Setup**: Mock OpenAI API to timeout after 30 seconds
- **Expected**:
  - First attempt times out
  - Retries with exponential backoff (1s, 2s)
  - After 2 retries, returns 500 error to user
  - User sees: "Generation failed: timeout"
  - No infinite loops or hanging
- **Implementation**: `callOpenAIWithRetry()` with `MAX_RETRIES = 2`
- **Status**: ✅ CODE VERIFIED (retry logic in place)

#### T-087.2: Malformed OpenAI Response
- **Setup**: Mock OpenAI to return invalid JSON
- **Expected**:
  - `JSON.parse()` throws error
  - Error caught and returned as 500
  - User sees: "Generation failed: SyntaxError..."
  - No retry (parsing error is not retryable)
- **Status**: ✅ CODE VERIFIED (try-catch in place)

#### T-087.3: Schema Validation Failure
- **Setup**: Mock OpenAI to return valid JSON but doesn't match `WebsiteSchema`
- **Example**: Missing required field `business_name`
- **Expected**:
  - `WebsiteSchema.parse()` throws Zod validation error
  - Caught and returned as 500
  - User sees: "Generation failed: Validation error..."
- **Status**: ✅ CODE VERIFIED (schema validation in place)

#### T-087.4: Rate Limit Hit
- **Setup**: User generates 3+ times in quick succession (>2 per minute)
- **Expected**:
  - 3rd request returns 429: "Too many generation requests"
  - Response includes `Retry-After` header
  - User sees: "Try again in X seconds"
  - Can generate again after cooldown
- **Implementation**: Rate limiter checks both IP + user ID
- **Status**: ✅ CODE VERIFIED (rate limiter enforced)

#### T-087.5: User Feedback During Retry
- **Setup**: User clicks "Generate" → API retries twice
- **Expected**:
  - User sees loading state during retries
  - If final retry fails, error message is user-friendly
  - Not showing "Retry 1 of 2" (confusing)
  - Just: "Generating..." → success or "Generation failed"
- **Status**: ⚠️ UX VERIFICATION NEEDED (check frontend loading state)

### Manual Test Checklist

- [ ] Generate 3 times rapidly → 3rd shows rate limit error
- [ ] Monitor browser console for retry logs
- [ ] Verify "Generating..." state lasts through retries
- [ ] Mock OpenAI timeout → see retries + final error
- [ ] Verify error message is user-friendly (not stack trace)

---

## Test Execution Order

1. **Slug Tests** (manual, quick) — 15 mins
2. **Auth Tests** (manual + code review) — 20 mins
3. **Webhook Tests** (via Stripe dashboard) — 15 mins
4. **Generation Tests** (manual + UX check) — 20 mins

**Total Est. Time**: ~70 mins

---

## Sign-Off Template

Once all tests pass, update status:

```
✅ T-084: Slug edge cases verified
✅ T-085: Auth edge cases verified  
✅ T-086: Stripe webhook idempotency verified
✅ T-087: Generation failure UX verified
```

Then move to: **T-080 (Lighthouse audit), T-088 (cross-browser), T-089 (accessibility)**
