-- V49: flujo prospecto -> cliente, respuesta de propuesta y pagos manuales/pasarela.
-- Ejecutar después de las migraciones anteriores.

alter table public.clients add column if not exists travel_needs text;
alter table public.clients add column if not exists lifecycle_status text not null default 'prospect';
alter table public.clients add column if not exists proposal_status text not null default 'new';
alter table public.clients add column if not exists rejection_reason text;
alter table public.clients add column if not exists payment_status text not null default 'pending';
alter table public.clients add column if not exists payment_method text;
alter table public.clients add column if not exists payment_provider text;
alter table public.clients add column if not exists payment_amount numeric(12,2);
alter table public.clients add column if not exists payment_currency text not null default 'USD';
alter table public.clients add column if not exists payment_reference text;
alter table public.clients add column if not exists accepted_at timestamptz;
alter table public.clients add column if not exists rejected_at timestamptz;
alter table public.clients add column if not exists updated_at timestamptz not null default now();

alter table public.client_itineraries add column if not exists proposal_status text not null default 'sent';
alter table public.client_itineraries add column if not exists version_number int not null default 1;
alter table public.client_itineraries add column if not exists requested_changes text;
alter table public.client_itineraries add column if not exists rejection_reason text;
alter table public.client_itineraries add column if not exists sent_at timestamptz;
alter table public.client_itineraries add column if not exists responded_at timestamptz;
alter table public.client_itineraries add column if not exists accepted_at timestamptz;

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

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  method text not null default 'manual',
  provider text,
  status text not null default 'pending',
  reference text,
  notes text,
  registered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.proposal_versions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "authenticated_select_proposal_versions" on public.proposal_versions;
drop policy if exists "authenticated_insert_proposal_versions" on public.proposal_versions;
drop policy if exists "authenticated_update_proposal_versions" on public.proposal_versions;
drop policy if exists "authenticated_delete_proposal_versions" on public.proposal_versions;
create policy "authenticated_select_proposal_versions" on public.proposal_versions for select to authenticated using (true);
create policy "authenticated_insert_proposal_versions" on public.proposal_versions for insert to authenticated with check (true);
create policy "authenticated_update_proposal_versions" on public.proposal_versions for update to authenticated using (true) with check (true);
create policy "authenticated_delete_proposal_versions" on public.proposal_versions for delete to authenticated using (true);

drop policy if exists "authenticated_select_payments" on public.payments;
drop policy if exists "authenticated_insert_payments" on public.payments;
drop policy if exists "authenticated_update_payments" on public.payments;
drop policy if exists "authenticated_delete_payments" on public.payments;
create policy "authenticated_select_payments" on public.payments for select to authenticated using (true);
create policy "authenticated_insert_payments" on public.payments for insert to authenticated with check (true);
create policy "authenticated_update_payments" on public.payments for update to authenticated using (true) with check (true);
create policy "authenticated_delete_payments" on public.payments for delete to authenticated using (true);

create index if not exists idx_clients_lifecycle_status on public.clients(lifecycle_status);
create index if not exists idx_clients_proposal_status on public.clients(proposal_status);
create index if not exists idx_client_itineraries_proposal_status on public.client_itineraries(proposal_status);
