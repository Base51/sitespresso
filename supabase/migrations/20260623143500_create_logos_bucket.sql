-- Create logos storage bucket for site logo uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies for storage.objects in logos bucket
-- Public read for published-site rendering without signed URLs.
drop policy if exists "Public can view logos" on storage.objects;
create policy "Public can view logos"
on storage.objects
for select
using (bucket_id = 'logos');

-- Allow authenticated users to upload logos only under their own site path: sites/{siteId}/...
drop policy if exists "Users can upload own site logos" on storage.objects;
create policy "Users can upload own site logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'logos'
  and name like 'sites/%'
  and exists (
    select 1
    from public.sites s
    where s.id::text = split_part(name, '/', 2)
      and s.user_id = auth.uid()
  )
);

-- Allow authenticated users to update files only in their own site path.
drop policy if exists "Users can update own site logos" on storage.objects;
create policy "Users can update own site logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'logos'
  and exists (
    select 1
    from public.sites s
    where s.id::text = split_part(name, '/', 2)
      and s.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'logos'
  and name like 'sites/%'
  and exists (
    select 1
    from public.sites s
    where s.id::text = split_part(name, '/', 2)
      and s.user_id = auth.uid()
  )
);

-- Allow authenticated users to delete files only in their own site path.
drop policy if exists "Users can delete own site logos" on storage.objects;
create policy "Users can delete own site logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'logos'
  and exists (
    select 1
    from public.sites s
    where s.id::text = split_part(name, '/', 2)
      and s.user_id = auth.uid()
  )
);
