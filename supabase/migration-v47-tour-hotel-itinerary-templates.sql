-- v47 - Tours como plantillas, hoteles y autollenado de itinerarios

alter table public.tours add column if not exists route text;
alter table public.tours add column if not exists description text;
alter table public.tours add column if not exists default_food_notes text;

create table if not exists public.tour_template_stops (
  id uuid primary key default uuid_generate_v4(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  place text not null,
  duration text,
  description text,
  includes_ticket boolean not null default false,
  order_index int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.hotels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  description text,
  contact text,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.itinerary_days add column if not exists tour_template_id uuid references public.tours(id) on delete set null;
alter table public.itinerary_days add column if not exists food_type text;
alter table public.itinerary_days add column if not exists food_description text;
alter table public.itinerary_days add column if not exists hotel_id uuid references public.hotels(id) on delete set null;

alter table public.tour_template_stops enable row level security;
alter table public.hotels enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['tour_template_stops','hotels'] loop
    execute format('drop policy if exists "authenticated_select_%s" on public.%I', tbl, tbl);
    execute format('drop policy if exists "authenticated_insert_%s" on public.%I', tbl, tbl);
    execute format('drop policy if exists "authenticated_update_%s" on public.%I', tbl, tbl);
    execute format('drop policy if exists "authenticated_delete_%s" on public.%I', tbl, tbl);
    execute format('create policy "authenticated_select_%s" on public.%I for select to authenticated using (true)', tbl, tbl);
    execute format('create policy "authenticated_insert_%s" on public.%I for insert to authenticated with check (true)', tbl, tbl);
    execute format('create policy "authenticated_update_%s" on public.%I for update to authenticated using (true) with check (true)', tbl, tbl);
    execute format('create policy "authenticated_delete_%s" on public.%I for delete to authenticated using (true)', tbl, tbl);
  end loop;
end $$;
