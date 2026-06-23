-- Harden logos storage policies:
-- 1) Enforce user-scoped upload paths: users/{userId}/sites/{siteId}/...
-- 2) Keep controlled legacy delete support: sites/{siteId}/...
-- 3) Preserve public read for rendering logos on published pages.

-- Public read for logo assets.
drop policy if exists "Public can view logos" on storage.objects;
create policy "Public can view logos"
on storage.objects
for select
using (bucket_id = 'logos');

-- Upload only into caller-owned user/site path.
drop policy if exists "Users can upload own site logos" on storage.objects;
create policy "Users can upload own site logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'sites'
  and split_part(name, '/', 4) <> ''
  and exists (
    select 1
    from public.sites s
    where s.id::text = split_part(name, '/', 4)
      and s.user_id = auth.uid()
  )
);

-- Update only files within caller-owned user/site path.
drop policy if exists "Users can update own site logos" on storage.objects;
create policy "Users can update own site logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'logos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'sites'
)
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 3) = 'sites'
  and split_part(name, '/', 4) <> ''
  and exists (
    select 1
    from public.sites s
    where s.id::text = split_part(name, '/', 4)
      and s.user_id = auth.uid()
  )
);

-- Delete from caller-owned user/site path, and allow legacy cleanup for caller-owned sites.
drop policy if exists "Users can delete own site logos" on storage.objects;
create policy "Users can delete own site logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'logos'
  and (
    (
      split_part(name, '/', 1) = 'users'
      and split_part(name, '/', 2) = auth.uid()::text
      and split_part(name, '/', 3) = 'sites'
    )
    or
    (
      split_part(name, '/', 1) = 'sites'
      and split_part(name, '/', 2) <> ''
      and exists (
        select 1
        from public.sites s
        where s.id::text = split_part(name, '/', 2)
          and s.user_id = auth.uid()
      )
    )
  )
);
