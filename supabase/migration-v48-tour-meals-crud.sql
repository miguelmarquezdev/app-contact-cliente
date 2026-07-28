-- v48 - Comidas múltiples en tours base + observaciones para autollenar itinerarios

alter table public.tours add column if not exists meal_types text[] not null default '{}';
alter table public.tours add column if not exists meal_observations jsonb not null default '{}'::jsonb;

-- Migra notas antiguas si existían solo como texto.
update public.tours
set meal_observations = jsonb_build_object('Notas', default_food_notes)
where default_food_notes is not null
  and default_food_notes <> ''
  and meal_observations = '{}'::jsonb;
