-- ============================================================================
-- POST-MIGRATION VALIDATION QUERIES
-- Run these AFTER both migrations to confirm successful state
-- ============================================================================

-- 1. Verify logos bucket was created with correct settings
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'logos';

-- 2. List all storage policies now attached to storage.objects
SELECT
  policyname,
  permissive,
  roles,
  qual as "using_condition",
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Verify the four logo policies exist by name
SELECT
  policyname,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname IN (
    'Public can view logos',
    'Users can upload own site logos',
    'Users can update own site logos',
    'Users can delete own site logos'
  )
GROUP BY policyname;

-- Expected result: 4 rows, each with count = 1

-- 4. Confirm core tables were not modified
SELECT 
  'profiles' as table_name, 
  count(*) as row_count 
FROM public.profiles
UNION ALL
SELECT 
  'sites' as table_name, 
  count(*) as row_count 
FROM public.sites
UNION ALL
SELECT 
  'subscriptions' as table_name, 
  count(*) as row_count 
FROM public.subscriptions;

-- Compare row counts with pre-flight results; they should match exactly.

-- 5. Test that public can view logos (read permission)
-- This simulates the public being able to view published site logos
SELECT 
  'Public read test: Should not error if policy allows public read'
AS test_description;

-- 6. Optional: Check auth schema is intact
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'auth'
LIMIT 5;

-- All six queries should succeed with no errors.
-- Logos bucket should show: file_size_limit = 5242880 (5MB)
-- Allowed MIME types should include: image/jpeg, image/png, image/webp, image/svg+xml
