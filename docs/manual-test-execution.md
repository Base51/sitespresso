# Manual Test Execution Guide — T-084-087

**Estimated Time**: ~90 minutes  
**Start Time**: [Your timestamp]  
**Test Environment**: localhost:3000 (dev server running)

---

## Prerequisites ✓ Check These First

- [ ] Dev server running: `npm run dev:clean` (or already running)
- [ ] Browser open to http://localhost:3000
- [ ] DevTools open (F12)
- [ ] Stripe test dashboard open (separate tab): https://dashboard.stripe.com/test
- [ ] Supabase dashboard open (separate tab): https://app.supabase.com

---

## Phase 1: Slug Tests (T-084) — ~20 mins

### T-084.1: Reserved Slug Detection ✓ [CODE VERIFIED]
**Status**: Already verified via unit tests (25 reserved slugs detected)  
**No manual test needed** — code guaranteed to reject "Admin", "API", etc.

### T-084.2: Slug Conflict Resolution [MANUAL] — ~10 mins

**Scenario**: Create two sites with same business name, verify both publish with unique slugs

**Steps**:

1. **First Site**:
   - Go to http://localhost:3000
   - Fill form: Business = "Jane's Salon", Type = "Beauty", City = "NYC"
   - Click "Generate"
   - Wait for preview
   - Click "✓ Free preview generated! Sign up to publish"
   - Fill full form and publish
   - **Expected**: Site published as `janes-salon`
   - Copy URL: `https://janes-salon.sitespresso.com`
   - Sign in and note the slug in dashboard

2. **Second Site** (same name):
   - Go back to home page (click SiteSpresso logo or navigate to `/`)
   - Fill form again: Business = "Jane's Salon" (same), Type = "Hair", City = "LA"
   - Click "Generate" → preview
   - Click "Sign up to publish" (or already signed in, just publish)
   - **Expected**: Site published as `janes-salon-2` (not `janes-salon`)
   - Verify in dashboard both sites exist

3. **Verification**:
   - Both URLs accessible:
     - `https://janes-salon.sitespresso.com` ✓
     - `https://janes-salon-2.sitespresso.com` ✓
   - Dashboard shows both sites with correct slugs ✓

**Pass Criteria**: Both sites publish successfully with unique slugs

---

### T-084.3: Slug Uniqueness Limit [MANUAL] — ~10 mins

**Scenario**: Create 11 sites with same business name, verify 11th fails

**Steps**:

1. **Create sites 1-10** (automated with same name each time):
   - Business = "Test Salon" (same each time)
   - Type = varies (Hair, Beauty, Nails, etc.)
   - City = varies (NYC, LA, SF, etc.)
   - Expected slugs: `test-salon`, `test-salon-2`, ..., `test-salon-10`

2. **Attempt to create site 11**:
   - Business = "Test Salon"
   - Type = "Spa"
   - City = "Boston"
   - Try to publish
   - **Expected Error**: "Could not generate a unique slug. Please try again." (500 error)

3. **Verification**:
   - Dashboard shows exactly 10 "Test Salon" sites ✓
   - 11th fails gracefully (no app crash) ✓
   - Error message is user-friendly ✓

**Pass Criteria**: 10 sites created, 11th fails gracefully

---

## Phase 2: Auth Tests (T-085) — ~20 mins

### T-085.1: Expired Session Handling [MANUAL] — ~5 mins

**Scenario**: Simulate session expiry, verify redirect to login

**Steps**:

1. **Sign in to app**:
   - Click "Sign In" button on home page
   - Sign in with Google or magic link
   - Land on `/dashboard`

2. **Expire session manually**:
   - Open DevTools (F12) → Application tab → Cookies
   - Find cookie with `supabase` or `auth` in name
   - Delete all Supabase-related cookies
   - Refresh page

3. **Verify behavior**:
   - Should redirect to `/login` ✓
   - Can sign in again successfully ✓
   - Landing on `/dashboard` works ✓

**Pass Criteria**: Session expiry handled gracefully

---

### T-085.2: Redirect Loop Prevention [MANUAL] — ~5 mins

**Scenario**: Visit `/login?next=/login` while authenticated, verify no redirect loop

**Steps**:

1. **While authenticated**:
   - Visit this URL directly: `http://localhost:3000/login?next=/login`
   - **Expected**: Redirect to `/dashboard` (not loop on `/login`)
   - Check URL bar changes to `http://localhost:3000/dashboard`

2. **While unauthenticated**:
   - Sign out completely (click Sign Out)
   - Visit: `http://localhost:3000/login?next=/login`
   - **Expected**: Stay on `/login` page, see login form (not loop)

**Pass Criteria**: No redirect loops, behavior correct

---

### T-085.3: Protected Route Access [MANUAL] — ~5 mins

**Scenario**: Unauthenticated user visits protected pages

**Steps**:

1. **Sign out** completely first

2. **Visit protected routes**:
   - Go to: `http://localhost:3000/dashboard`
   - **Expected**: Redirect to `/login?next=/dashboard` ✓
   - Go to: `http://localhost:3000/account`
   - **Expected**: Redirect to `/login?next=/account` ✓

3. **Sign in** and verify `next` redirect works:
   - From the login page (with `next` param), sign in
   - **Expected**: Redirect to original page (`/dashboard` or `/account`) ✓

**Pass Criteria**: Protected routes redirect correctly

---

### T-085.4: Sign-In Callback Redirect [MANUAL] — ~5 mins

**Scenario**: Sign in with custom `next` parameter

**Steps**:

1. **Sign out first**

2. **Test with custom next param**:
   - Visit: `http://localhost:3000/login?next=/account`
   - Click "Sign In"
   - After successful sign-in, **expected**: Land on `/account` (not `/dashboard`)

3. **Test default (no next)**:
   - Visit: `http://localhost:3000/login` (no `next` param)
   - Click "Sign In"
   - After sign-in, **expected**: Land on `/dashboard` (default)

**Pass Criteria**: Callback redirects respect `next` parameter

---

## Phase 3: Stripe Webhook Tests (T-086) — ~20 mins

**Note**: Requires Stripe test dashboard access

### T-086.1: Duplicate Webhook Event [MANUAL] — ~5 mins

**Scenario**: Send same webhook twice, verify no duplicate subscriptions

**Steps**:

1. **Find recent event in Stripe**:
   - Go to: https://dashboard.stripe.com/test/events
   - Find a recent `checkout.session.completed` event
   - Click on it

2. **Resend event**:
   - Click "Resend" button
   - Wait ~10 seconds

3. **Verify in Supabase**:
   - Go to Supabase dashboard → subscriptions table
   - Filter by the customer ID
   - **Expected**: Only 1 subscription record (not 2 duplicates) ✓
   - Check sites table: published site is there ✓

**Pass Criteria**: No duplicate subscription records created

---

### T-086.2: Invalid Webhook Signature [MANUAL] — ~5 mins

**Scenario**: Send webhook with invalid signature, verify rejection

**Steps**:

1. **Test with curl/Postman** (simulates attacker):
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H "stripe-signature: invalid_signature_xyz" \
     -H "Content-Type: application/json" \
     -d '{"type":"checkout.session.completed","data":{"object":{"id":"xyz"}}}'
   ```

2. **Expected response**:
   - Status: 400
   - Body: `{"error": "Invalid webhook signature..."}`
   - **No data processed** ✓

3. **App should still be running**:
   - Visit http://localhost:3000 → should work ✓

**Pass Criteria**: Invalid signatures rejected, no data corruption

---

### T-086.3-4: Out-of-Order & Missing Metadata [INFO ONLY]

**Status**: Cannot test easily without modifying Stripe events  
**Code Verification**: ✅ Already verified:
- Missing metadata → error handling in place
- Out-of-order events → upsert logic handles correctly

---

## Phase 4: Generation Tests (T-087) — ~20 mins

### T-087.1: Generation Rate Limit [MANUAL] — ~10 mins

**Scenario**: Hit rate limit by generating 3+ times rapidly

**Steps**:

1. **Home page setup**:
   - Go to http://localhost:3000
   - Open DevTools → Network tab
   - Keep it open to see requests

2. **Generate 3 times rapidly**:
   - Fill form (Business name, type, city)
   - Click "Generate" → watch loading state
   - When done, immediately click "Generate" again (refill form first)
   - Do this 3 times in quick succession (~1-2 mins apart)

3. **Watch for rate limit**:
   - Requests 1-2: Should succeed ✓
   - Request 3: Should fail with error:
     ```
     "Too many generation requests. Try again later."
     "Retry in X seconds"
     ```
   - Error status: 429 ✓

4. **Wait for cooldown**:
   - Wait 2 minutes
   - Try again: Should succeed ✓

**Pass Criteria**: Rate limit enforced, cooldown respected

---

### T-087.2: Generation Failure UX [MANUAL] — ~5 mins

**Scenario**: Monitor loading state during generation

**Steps**:

1. **Fill form** and click "Generate"

2. **Observe**:
   - Loading state shows: "Generating..." ✓
   - Button disabled during generation ✓
   - Network tab shows 1 POST to `/api/generate` ✓
   - Retries happen server-side (invisible to user) ✓

3. **After success/failure**:
   - Loading state disappears ✓
   - Shows result or error message ✓
   - User can generate again ✓

**Pass Criteria**: UX feedback is clear, retries transparent

---

### T-087.3: Malformed Response Handling [INFO ONLY]

**Status**: Difficult to test without mocking OpenAI  
**Code Verification**: ✅ Already verified:
- Error caught in try-catch
- User sees friendly error message
- No stack traces exposed

---

## Summary Checklist

### Auto-Verified (Unit Tests) ✅
- [ ] T-084.1: Reserved slug detection (25 slugs) — `npm run test:edges`
- [ ] T-087: Retry logic (MAX_RETRIES=2, backoff)

### Manual Testing
- [ ] T-084.2: Slug conflict (2 sites with same name)
- [ ] T-084.3: Slug limit (11th site fails)
- [ ] T-085.1: Expired session → redirect
- [ ] T-085.2: Redirect loop prevention
- [ ] T-085.3: Protected route access
- [ ] T-085.4: Sign-in callback redirect
- [ ] T-086.1: Duplicate webhook (no duplicate in DB)
- [ ] T-086.2: Invalid webhook signature (400 error)
- [ ] T-087.1: Rate limit (429 on 3rd request)
- [ ] T-087.2: Generation UX (loading state, retries)

---

## Pass/Fail Criteria

**PASS if**:
- All 12 tests complete successfully
- No app crashes or 500 errors
- All error messages are user-friendly
- No data corruption

**FAIL if**:
- Any test shows unexpected behavior
- App crashes or locks up
- Stack traces appear to user
- Database has corrupted/duplicate data

---

## Estimated Timing

| Phase | Tests | Time |
|-------|-------|------|
| T-084 | Slug tests (2 manual) | 20 min |
| T-085 | Auth tests (4 manual) | 20 min |
| T-086 | Webhook tests (2 manual) | 15 min |
| T-087 | Generation tests (2 manual) | 15 min |
| **TOTAL** | **10 manual tests** | **~70 mins** |

---

## Next Steps After Testing

- [ ] Mark all tests as PASSED
- [ ] Update `docs/tasks.md` → T-084-087 = ✅
- [ ] Move to **T-080 (Lighthouse)** → `npm run build && lighthouse-cli https://your-site.sitespresso.com`
- [ ] Then **T-088 (Cross-browser)** → Chrome, Firefox, Safari
- [ ] Then **T-089 (WCAG)** → axe DevTools or Wave
- [ ] Then **Phase 1: Brand Integration** (3-4 hours)

---

## Help & Troubleshooting

- **Can't sign in?** Check `.env.local` has Supabase keys
- **Dev server not running?** Run `npm run dev:clean`
- **Supabase down?** Check https://status.supabase.com
- **Stripe test keys invalid?** Regenerate from dashboard
