-- V4: flujo correcto para itinerarios independientes.
-- El constructor guarda: itinerario -> dias -> stops. No depende de tours.

alter table public.itineraries
  alter column tour_id drop not null;

alter table public.itinerary_days
  add column if not exists food text,
  add column if not exists hotel text,
  add column if not exists description text;

alter table public.itinerary_stops
  add column if not exists place text,
  add column if not exists includes_ticket boolean not null default false;

update public.itinerary_stops
set place = coalesce(place, title)
where place is null;
