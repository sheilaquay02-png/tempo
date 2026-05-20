-- Supabase Storage setup for Tempo Memory Book images.
-- Run this once in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('memory-images', 'memory-images', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own memory images" on storage.objects;
drop policy if exists "Users can view own memory images" on storage.objects;
drop policy if exists "Users can update own memory images" on storage.objects;
drop policy if exists "Users can delete own memory images" on storage.objects;

create policy "Users can upload own memory images"
on storage.objects for insert
with check (
  bucket_id = 'memory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view own memory images"
on storage.objects for select
using (
  bucket_id = 'memory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own memory images"
on storage.objects for update
using (
  bucket_id = 'memory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'memory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own memory images"
on storage.objects for delete
using (
  bucket_id = 'memory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
