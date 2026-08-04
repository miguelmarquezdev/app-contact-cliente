-- v67: avatars visibles en admin + imagen principal para itinerarios.
-- Ejecutar después de v66.

alter table public.itineraries
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz not null default now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'itinerary-images',
  'itinerary-images',
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
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public can read itinerary images') then
    create policy "Public can read itinerary images"
    on storage.objects for select
    using (bucket_id = 'itinerary-images');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Team can upload itinerary images') then
    create policy "Team can upload itinerary images"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'itinerary-images' and (public.app_can_manage_commercial() or public.app_can_manage_operations() or public.app_is_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Team can update itinerary images') then
    create policy "Team can update itinerary images"
    on storage.objects for update to authenticated
    using (bucket_id = 'itinerary-images' and (public.app_can_manage_commercial() or public.app_can_manage_operations() or public.app_is_admin()))
    with check (bucket_id = 'itinerary-images' and (public.app_can_manage_commercial() or public.app_can_manage_operations() or public.app_is_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Team can delete itinerary images') then
    create policy "Team can delete itinerary images"
    on storage.objects for delete to authenticated
    using (bucket_id = 'itinerary-images' and (public.app_can_manage_commercial() or public.app_can_manage_operations() or public.app_is_admin()));
  end if;
end $$;

create index if not exists idx_itineraries_updated_at on public.itineraries(updated_at desc);
