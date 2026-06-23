-- ============================================================================
-- PRE-FLIGHT CHECKLIST QUERIES
-- Run these BEFORE executing the storage migrations to verify baseline state
-- ============================================================================

-- 1. Verify core business tables exist and have data
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

-- 2. Check if logos bucket already exists (should return empty before migration)
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'logos';

-- 3. List current storage policies on storage.objects (should show existing ones if any)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 4. Verify sites table schema has expected columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sites'
ORDER BY ordinal_position;

-- 5. Count any existing logo storage objects (should return 0 before first upload)
SELECT COUNT(*) as existing_logo_objects
FROM storage.objects
WHERE bucket_id = 'logos';

-- Save output of all five queries before proceeding to migrations.
