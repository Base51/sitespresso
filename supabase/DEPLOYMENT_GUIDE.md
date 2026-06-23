# Logo Storage Migration Guide

## Overview
This guide walks you through safely deploying logo storage to Supabase with validation and rollback protection.

## Files Reference
- **Migrations to apply:**
  - `supabase/migrations/20260623143500_create_logos_bucket.sql` - Creates bucket and basic policies
  - `supabase/migrations/20260623162000_harden_logos_storage_policies.sql` - Hardens policies for user-scoped paths

- **Safety scripts:**
  - `supabase/PREFLIGHT_CHECKLIST.sql` - Run before migrations
  - `supabase/POSTRUN_VALIDATION.sql` - Run after migrations
  - `supabase/ROLLBACK_PROCEDURE.sql` - Emergency rollback (if needed)

## Step-by-Step Deployment

### PHASE 1: Pre-Flight Checks

1. Open your Supabase dashboard → SQL Editor
2. Copy all queries from `supabase/PREFLIGHT_CHECKLIST.sql`
3. Run them one by one or as a batch
4. Save the output somewhere safe
5. **Confirm:**
   - profiles, sites, subscriptions row counts
   - logos bucket does NOT exist yet (should return empty)
   - No logo-related policies exist yet
   - sites table schema is intact

### PHASE 2: Apply First Migration

1. Open Supabase SQL Editor
2. Copy entire content of `supabase/migrations/20260623143500_create_logos_bucket.sql`
3. Paste and run
4. **Confirm:**
   - Query executes with no errors
   - You see success message

### PHASE 3: Apply Second Migration

1. Open Supabase SQL Editor (new query tab)
2. Copy entire content of `supabase/migrations/20260623162000_harden_logos_storage_policies.sql`
3. Paste and run
4. **Confirm:**
   - Query executes with no errors
   - You see success message

### PHASE 4: Post-Run Validation

1. Open Supabase SQL Editor (new query tab)
2. Copy all queries from `supabase/POSTRUN_VALIDATION.sql`
3. Run them one by one or as a batch
4. **Confirm all six queries:**
   - logos bucket exists with file_size_limit = 5242880 (5MB)
   - Four logo policies exist: "Public can view logos", "Users can upload own site logos", "Users can update own site logos", "Users can delete own site logos"
   - profiles, sites, subscriptions row counts match pre-flight output exactly
   - auth schema is intact
   - No errors

### PHASE 5: Live Test

1. Hard refresh https://sitespresso.com (Ctrl+F5)
2. Generate a new site
3. Open Customize Site → Logo
4. Upload a JPG file
5. **Confirm:**
   - Logo appears in preview
   - No error toast
6. Click Remove
7. **Confirm:**
   - Logo is removed from preview
   - Can upload another file

---

## Rollback Instructions (Emergency Only)

If something goes wrong during or after migrations:

1. Open Supabase SQL Editor
2. Copy entire content of `supabase/ROLLBACK_PROCEDURE.sql`
3. Read the whole script first
4. Run it
5. **Confirm rollback verification queries all return PASS**
6. Your business data (profiles, sites, subscriptions) is untouched
7. Logo functionality will not work until you re-apply migrations

---

## Recovery After Rollback

If you rolled back and want to reapply:

1. Run PHASE 2 again (first migration)
2. Run PHASE 3 again (second migration)
3. Run PHASE 4 again (validation)
4. Run PHASE 5 again (live test)

---

## Timeline

- **Pre-flight checks:** 2–3 minutes
- **Apply migrations:** < 1 minute each
- **Post-run validation:** 2–3 minutes
- **Live test:** 5 minutes
- **Total:** ~15 minutes if all goes well

---

## Contact / Troubleshooting

### Error: "bucket not found" during upload
→ This means migrations did not run. Go back to PHASE 2.

### Error: "policy violation" during upload
→ This means storage policies are not allowing your user. Run PHASE 4 validation to check policy conditions.

### Error: "access denied" in validation queries
→ Make sure you're logged in as admin in Supabase SQL Editor (usually auto-authenticated).

### Data loss concern
→ These migrations touch **only** storage layer (buckets + policies). Your profiles, sites, subscriptions tables are read-only referenced in policies but never modified. Safe to run.

---

## Deployment Status

- ✅ Code fixes deployed to production (API and site delete cleanup)
- ⏳ Awaiting your SQL migrations in Supabase
- ⏳ Awaiting your live test report

Once you run PHASE 1–4 and confirm success, logo upload/remove should work end-to-end.
