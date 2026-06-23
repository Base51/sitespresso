-- ============================================================================
-- ROLLBACK PROCEDURE
-- Use this ONLY if migrations cause issues
-- ============================================================================

-- IMPORTANT: This is a DESTRUCTIVE operation. Back up your data first.
-- Rollback will remove the logos bucket and all associated policies.

-- ============================================================================
-- STEP 1: Drop all logo-related storage policies (in any order)
-- ============================================================================

DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own site logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own site logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own site logos" ON storage.objects;

-- ============================================================================
-- STEP 2: Delete all logo files from storage (if any exist)
-- ============================================================================

-- Via SQL:
DELETE FROM storage.objects
WHERE bucket_id = 'logos';

-- ============================================================================
-- STEP 3: Drop the logos bucket
-- ============================================================================

DELETE FROM storage.buckets
WHERE id = 'logos';

-- ============================================================================
-- VERIFICATION: Confirm rollback is complete
-- ============================================================================

-- Run this to verify all logo storage is removed:
SELECT 
  'logos_bucket_exists' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS - Bucket deleted'
    ELSE 'FAIL - Bucket still exists'
  END AS status
FROM storage.buckets
WHERE id = 'logos'
UNION ALL
SELECT
  'logo_policies_exist' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS - All policies deleted'
    ELSE 'FAIL - Policies still exist'
  END AS status
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%logo%'
UNION ALL
SELECT
  'logo_objects_exist' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS - No logo files remain'
    ELSE 'FAIL - Logo files still exist'
  END AS status
FROM storage.objects
WHERE bucket_id = 'logos';

-- ============================================================================
-- AFTER ROLLBACK
-- ============================================================================

-- 1. Your business tables (profiles, sites, subscriptions) are unaffected.
-- 2. All logo upload/delete functionality will fail until you re-run migrations.
-- 3. No data loss in your core database.

-- ============================================================================
-- IF YOU NEED TO RE-APPLY AFTER ROLLBACK
-- ============================================================================

-- Simply run the two migrations again in order:
-- 1. supabase/migrations/20260623143500_create_logos_bucket.sql
-- 2. supabase/migrations/20260623162000_harden_logos_storage_policies.sql
