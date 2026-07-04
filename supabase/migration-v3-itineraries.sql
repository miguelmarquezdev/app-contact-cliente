-- Ejecuta este archivo si ya corriste el schema anterior.
-- Convierte itinerarios para que sean independientes de tours y agrega campos nuevos.

alter table public.itineraries
  alter column tour_id drop not null;

alter table public.itineraries
  drop constraint if exists itineraries_tour_id_fkey;

alter table public.itineraries
  add constraint itineraries_tour_id_fkey
  foreign key (tour_id) references public.tours(id) on delete set null;

alter table public.itinerary_days
  add column if not exists food text,
  add column if not exists hotel text;

alter table public.itinerary_stops
  add column if not exists place text,
  add column if not exists includes_ticket boolean not null default false,
  add column if not exists image_url text;

update public.itinerary_stops
set place = coalesce(place, title)
where place is null;
