-- Agrega el campo puesto para colaboradores y tour leaders
alter table public.profiles
add column if not exists position text;

-- Puesto por defecto para equipo existente
update public.profiles
set position = 'Guía'
where role in ('tour_leader', 'collaborator')
  and (position is null or trim(position) = '');
