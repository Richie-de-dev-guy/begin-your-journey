-- Media bucket: anyone can view files (they illustrate public pages),
-- only staff with media.manage may upload, replace, or delete.
create policy "public read media files" on storage.objects for select to anon
  using (bucket_id = 'media');
create policy "staff upload media files" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_permission(auth.uid(), 'media.manage'));
create policy "staff update media files" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_permission(auth.uid(), 'media.manage'));
create policy "staff delete media files" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_permission(auth.uid(), 'media.manage'));