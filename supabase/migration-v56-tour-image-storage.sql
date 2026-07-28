-- v56: Supabase Storage bucket for tour images
-- Ejecuta esto después de v55.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tour-images',
  'tour-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read tour images'
  ) then
    create policy "Public can read tour images"
    on storage.objects for select
    using (bucket_id = 'tour-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload tour images'
  ) then
    create policy "Authenticated users can upload tour images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'tour-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update tour images'
  ) then
    create policy "Authenticated users can update tour images"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'tour-images')
    with check (bucket_id = 'tour-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can delete tour images'
  ) then
    create policy "Authenticated users can delete tour images"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'tour-images');
  end if;
end $$;
