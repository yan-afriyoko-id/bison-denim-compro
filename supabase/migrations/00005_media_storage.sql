-- Media storage bucket for uploaded files (hero images, covers, media library)
-- A public bucket named "media" so uploaded assets are reachable by URL.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Allow anyone to read public media (public bucket)
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select
  using (bucket_id = 'media');

-- Authenticated staff can upload, update, delete files in the media bucket.
drop policy if exists "media_staff_write" on storage.objects;
create policy "media_staff_write" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media_staff_update" on storage.objects;
create policy "media_staff_update" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "media_staff_delete" on storage.objects;
create policy "media_staff_delete" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media');
