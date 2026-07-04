-- Tour Client Manager - Supabase Schema
-- 1) Crear proyecto Supabase
-- 2) SQL Editor > pegar todo este archivo > Run
-- 3) Authentication > crear primer usuario admin
-- 4) Luego ejecutar el UPDATE final para volverlo admin si es necesario

create extension if not exists "uuid-ossp";

create type public.user_role as enum ('admin', 'tour_leader', 'collaborator', 'client');
create type public.user_status as enum ('active', 'inactive');
create type public.tour_status as enum ('pending', 'confirmed', 'preparation', 'operating', 'finished', 'cancelled');
create type public.document_visibility as enum ('internal', 'team', 'client');
create type public.chat_room_type as enum ('client', 'internal');

create table if not exists public.profiles (
  id uuid primary key,
  full_name text not null default '',
  email text not null unique,
  phone text,
  avatar_url text,
  role public.user_role not null default 'client',
  position text,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  country text,
  passport_number text,
  notes_internal text,
  created_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  code text,
  start_date date,
  end_date date,
  status public.tour_status not null default 'pending',
  tour_leader_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_clients (
  id uuid primary key default uuid_generate_v4(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(tour_id, client_id)
);

create table if not exists public.tour_collaborators (
  id uuid primary key default uuid_generate_v4(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  collaborator_id uuid not null references public.profiles(id) on delete cascade,
  permission_level text not null default 'view',
  created_at timestamptz not null default now(),
  unique(tour_id, collaborator_id)
);

create table if not exists public.itineraries (
  id uuid primary key default uuid_generate_v4(),
  -- Itinerario independiente: ya no depende obligatoriamente de tours.
  tour_id uuid references public.tours(id) on delete set null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.itinerary_days (
  id uuid primary key default uuid_generate_v4(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  day_number int not null,
  title text not null,
  route text,
  food text,
  hotel text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.itinerary_stops (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid not null references public.itinerary_days(id) on delete cascade,
  -- place es el campo principal para el lugar/stop. title queda por compatibilidad.
  place text,
  title text,
  location text,
  start_time time,
  duration text,
  includes_ticket boolean not null default false,
  image_url text,
  description text,
  order_index int not null default 1,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);


create table if not exists public.client_itineraries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique(client_id, itinerary_id)
);

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  tour_id uuid references public.tours(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  title text not null,
  file_url text not null,
  file_type text,
  visibility public.document_visibility not null default 'internal',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  tour_id uuid references public.tours(id) on delete cascade,
  type public.chat_room_type not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_participants (
  id uuid primary key default uuid_generate_v4(),
  chat_room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(chat_room_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  chat_room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  message text not null,
  file_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tours enable row level security;
alter table public.tour_clients enable row level security;
alter table public.tour_collaborators enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_stops enable row level security;
alter table public.client_itineraries enable row level security;
alter table public.documents enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;

-- MVP policies: todo usuario logueado puede leer/escribir.
-- Para producción, reemplazar por políticas finas por rol y asignación de tour.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'profiles','clients','tours','tour_clients','tour_collaborators','itineraries','itinerary_days','itinerary_stops','client_itineraries','documents','chat_rooms','chat_participants','chat_messages','notifications'
  ] loop
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

-- Después de crear tu primer usuario en Supabase Auth, cambia su rol a admin:
-- update public.profiles set role = 'admin' where email = 'TU-CORREO@DOMINIO.COM';
