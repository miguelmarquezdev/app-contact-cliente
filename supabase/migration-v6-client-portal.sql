-- V6: panel de clientes + envío/asignación de itinerarios.

create table if not exists public.client_itineraries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique(client_id, itinerary_id)
);

alter table public.client_itineraries enable row level security;

drop policy if exists "authenticated_select_client_itineraries" on public.client_itineraries;
drop policy if exists "authenticated_insert_client_itineraries" on public.client_itineraries;
drop policy if exists "authenticated_update_client_itineraries" on public.client_itineraries;
drop policy if exists "authenticated_delete_client_itineraries" on public.client_itineraries;

-- MVP: los usuarios autenticados pueden operar. La app filtra el panel cliente por sesión.
-- En producción se puede endurecer con políticas por rol.
create policy "authenticated_select_client_itineraries" on public.client_itineraries for select to authenticated using (true);
create policy "authenticated_insert_client_itineraries" on public.client_itineraries for insert to authenticated with check (true);
create policy "authenticated_update_client_itineraries" on public.client_itineraries for update to authenticated using (true) with check (true);
create policy "authenticated_delete_client_itineraries" on public.client_itineraries for delete to authenticated using (true);
