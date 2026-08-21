-- ============================================================================
-- Storage policies for the "uploads" bucket
-- Run AFTER creating the "uploads" bucket in Storage UI (as public bucket).
--
-- NOTE: This migration is currently UNUSED by the app. Image uploads go to
-- Vercel Blob (see src/app/admin/api/upload/route.ts), not Supabase Storage.
-- Kept for reference in case you switch upload targets.
-- ============================================================================

-- Allow public read access to all files
create policy "public_can_read_uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

-- Allow service_role to upload/delete (admin operations)
create policy "service_role_can_insert_uploads"
  on storage.objects for insert
  with check (bucket_id = 'uploads');

create policy "service_role_can_update_uploads"
  on storage.objects for update
  using (bucket_id = 'uploads')
  with check (bucket_id = 'uploads');

create policy "service_role_can_delete_uploads"
  on storage.objects for delete
  using (bucket_id = 'uploads');