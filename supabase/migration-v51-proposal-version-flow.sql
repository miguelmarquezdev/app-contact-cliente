-- V51: mejora del flujo de versiones de propuesta.
-- Ejecutar después de V49. No rompe datos existentes.

alter table public.client_itineraries add column if not exists proposal_status text not null default 'sent';
alter table public.client_itineraries add column if not exists version_number int not null default 1;
alter table public.client_itineraries add column if not exists requested_changes text;
alter table public.client_itineraries add column if not exists rejection_reason text;
alter table public.client_itineraries add column if not exists sent_at timestamptz;
alter table public.client_itineraries add column if not exists responded_at timestamptz;
alter table public.client_itineraries add column if not exists accepted_at timestamptz;

update public.client_itineraries
set sent_at = coalesce(sent_at, created_at)
where sent_at is null;

create table if not exists public.proposal_versions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  itinerary_id uuid references public.itineraries(id) on delete set null,
  version_number int not null default 1,
  status text not null default 'draft',
  change_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.proposal_versions enable row level security;

drop policy if exists "authenticated_select_proposal_versions" on public.proposal_versions;
drop policy if exists "authenticated_insert_proposal_versions" on public.proposal_versions;
drop policy if exists "authenticated_update_proposal_versions" on public.proposal_versions;
drop policy if exists "authenticated_delete_proposal_versions" on public.proposal_versions;
create policy "authenticated_select_proposal_versions" on public.proposal_versions for select to authenticated using (true);
create policy "authenticated_insert_proposal_versions" on public.proposal_versions for insert to authenticated with check (true);
create policy "authenticated_update_proposal_versions" on public.proposal_versions for update to authenticated using (true) with check (true);
create policy "authenticated_delete_proposal_versions" on public.proposal_versions for delete to authenticated using (true);

create index if not exists idx_client_itineraries_client_version on public.client_itineraries(client_id, version_number desc);
create index if not exists idx_client_itineraries_sent_at on public.client_itineraries(sent_at desc);
create index if not exists idx_proposal_versions_client_version on public.proposal_versions(client_id, version_number desc);
