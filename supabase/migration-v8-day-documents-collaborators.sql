-- V8: documentos por día + colaboradores asignados por día.
-- Ejecutar en Supabase SQL Editor > New query > Run.

create table if not exists public.itinerary_day_documents (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid not null references public.itinerary_days(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_path text,
  file_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.itinerary_day_collaborators (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid not null references public.itinerary_days(id) on delete cascade,
  collaborator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(day_id, collaborator_id)
);

alter table public.itinerary_day_documents enable row level security;
alter table public.itinerary_day_collaborators enable row level security;

drop policy if exists "authenticated_select_itinerary_day_documents" on public.itinerary_day_documents;
drop policy if exists "authenticated_insert_itinerary_day_documents" on public.itinerary_day_documents;
drop policy if exists "authenticated_update_itinerary_day_documents" on public.itinerary_day_documents;
drop policy if exists "authenticated_delete_itinerary_day_documents" on public.itinerary_day_documents;

create policy "authenticated_select_itinerary_day_documents" on public.itinerary_day_documents for select to authenticated using (true);
create policy "authenticated_insert_itinerary_day_documents" on public.itinerary_day_documents for insert to authenticated with check (true);
create policy "authenticated_update_itinerary_day_documents" on public.itinerary_day_documents for update to authenticated using (true) with check (true);
create policy "authenticated_delete_itinerary_day_documents" on public.itinerary_day_documents for delete to authenticated using (true);

drop policy if exists "authenticated_select_itinerary_day_collaborators" on public.itinerary_day_collaborators;
drop policy if exists "authenticated_insert_itinerary_day_collaborators" on public.itinerary_day_collaborators;
drop policy if exists "authenticated_update_itinerary_day_collaborators" on public.itinerary_day_collaborators;
drop policy if exists "authenticated_delete_itinerary_day_collaborators" on public.itinerary_day_collaborators;

create policy "authenticated_select_itinerary_day_collaborators" on public.itinerary_day_collaborators for select to authenticated using (true);
create policy "authenticated_insert_itinerary_day_collaborators" on public.itinerary_day_collaborators for insert to authenticated with check (true);
create policy "authenticated_update_itinerary_day_collaborators" on public.itinerary_day_collaborators for update to authenticated using (true) with check (true);
create policy "authenticated_delete_itinerary_day_collaborators" on public.itinerary_day_collaborators for delete to authenticated using (true);

-- Bucket para PDFs y fotos del itinerario.
insert into storage.buckets (id, name, public)
values ('itinerary-day-documents', 'itinerary-day-documents', true)
on conflict (id) do nothing;

drop policy if exists "authenticated_read_itinerary_day_documents_bucket" on storage.objects;
drop policy if exists "authenticated_upload_itinerary_day_documents_bucket" on storage.objects;
drop policy if exists "authenticated_update_itinerary_day_documents_bucket" on storage.objects;
drop policy if exists "authenticated_delete_itinerary_day_documents_bucket" on storage.objects;

create policy "authenticated_read_itinerary_day_documents_bucket"
on storage.objects for select to authenticated
using (bucket_id = 'itinerary-day-documents');

create policy "authenticated_upload_itinerary_day_documents_bucket"
on storage.objects for insert to authenticated
with check (bucket_id = 'itinerary-day-documents');

create policy "authenticated_update_itinerary_day_documents_bucket"
on storage.objects for update to authenticated
using (bucket_id = 'itinerary-day-documents')
with check (bucket_id = 'itinerary-day-documents');

create policy "authenticated_delete_itinerary_day_documents_bucket"
on storage.objects for delete to authenticated
using (bucket_id = 'itinerary-day-documents');
