-- v61: RLS real por rol, propietario, asignación y chat.
-- Ejecutar después de todas las migraciones anteriores.
-- Importante:
-- - En esta app el enum user_role actual usa: admin, tour_leader, collaborator, client.
-- - Superadmin, Ventas, Operaciones, Guía, Conductor/Transportista, Reservas, Soporte
--   se controlan con profiles.position.
-- - El primer usuario admin debe existir antes de aplicar esta migración.

-- 1) Helpers seguros para consultar rol/posición sin recursión de RLS.
create or replace function public.app_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role::text from public.profiles where id = auth.uid()), '')
$$;

create or replace function public.app_current_position()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce((select position from public.profiles where id = auth.uid()), ''))
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_current_role() = 'admin', false)
    or public.app_current_position() in ('superadmin', 'admin', 'administrador', 'administrator')
$$;

create or replace function public.app_is_sales()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin()
    or public.app_current_position() in ('ventas', 'sales', 'reservas', 'counter')
$$;

create or replace function public.app_is_operations()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin()
    or public.app_current_position() in ('operaciones', 'operations', 'operacion', 'operación', 'soporte', 'support')
$$;

create or replace function public.app_is_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_current_role() in ('admin', 'tour_leader', 'collaborator')
    or public.app_current_position() in (
      'superadmin','admin','administrador','administrator',
      'ventas','sales','reservas','counter',
      'operaciones','operations','operacion','operación',
      'guía','guia','guide',
      'conductor','transportista','driver',
      'soporte','support'
    )
$$;

create or replace function public.app_can_manage_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin() or public.app_is_sales() or public.app_is_operations()
$$;

create or replace function public.app_can_manage_commercial()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin() or public.app_is_sales()
$$;

create or replace function public.app_can_manage_operations()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin() or public.app_is_operations()
$$;

create or replace function public.app_owns_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.profile_id = auth.uid()
  )
$$;

create or replace function public.app_is_assigned_to_tour(p_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tours t
    where t.id = p_tour_id
      and t.tour_leader_id = auth.uid()
  )
  or exists (
    select 1
    from public.tour_collaborators tc
    where tc.tour_id = p_tour_id
      and tc.collaborator_id = auth.uid()
  )
$$;

create or replace function public.app_is_assigned_to_itinerary(p_itinerary_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.itineraries i
    where i.id = p_itinerary_id
      and i.tour_id is not null
      and public.app_is_assigned_to_tour(i.tour_id)
  )
  or exists (
    select 1
    from public.itinerary_days d
    join public.itinerary_day_collaborators dc on dc.day_id = d.id
    where d.itinerary_id = p_itinerary_id
      and dc.collaborator_id = auth.uid()
  )
$$;

create or replace function public.app_can_access_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin()
    or public.app_is_sales()
    or public.app_is_operations()
    or public.app_owns_client(p_client_id)
    or exists (
      select 1
      from public.client_itineraries ci
      where ci.client_id = p_client_id
        and public.app_is_assigned_to_itinerary(ci.itinerary_id)
    )
    or exists (
      select 1
      from public.tour_clients tc
      where tc.client_id = p_client_id
        and public.app_is_assigned_to_tour(tc.tour_id)
    )
$$;

create or replace function public.app_can_access_itinerary(p_itinerary_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin()
    or public.app_is_sales()
    or public.app_is_operations()
    or public.app_is_assigned_to_itinerary(p_itinerary_id)
    or exists (
      select 1
      from public.client_itineraries ci
      join public.clients c on c.id = ci.client_id
      where ci.itinerary_id = p_itinerary_id
        and c.profile_id = auth.uid()
    )
$$;

create or replace function public.app_can_access_day(p_day_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.itinerary_days d
    where d.id = p_day_id
      and public.app_can_access_itinerary(d.itinerary_id)
  )
  or exists (
    select 1
    from public.itinerary_day_collaborators dc
    where dc.day_id = p_day_id
      and dc.collaborator_id = auth.uid()
  )
$$;

create or replace function public.app_is_chat_participant(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin()
    or exists (
      select 1
      from public.chat_rooms cr
      where cr.id = p_room_id
        and (cr.direct_user_a = auth.uid() or cr.direct_user_b = auth.uid())
    )
    or exists (
      select 1
      from public.chat_participants cp
      where cp.chat_room_id = p_room_id
        and cp.user_id = auth.uid()
    )
$$;

create or replace function public.app_can_access_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and (
        public.app_is_admin()
        or public.app_is_operations()
        or d.uploaded_by = auth.uid()
        or (d.visibility in ('team','client') and d.tour_id is not null and public.app_is_assigned_to_tour(d.tour_id))
        or (d.visibility = 'client' and exists (
          select 1
          from public.tour_clients tc
          join public.clients c on c.id = tc.client_id
          where tc.tour_id = d.tour_id
            and c.profile_id = auth.uid()
        ))
      )
  )
$$;

create or replace function public.app_can_access_payment(p_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.payments p
    where p.id = p_payment_id
      and (
        public.app_is_admin()
        or public.app_is_sales()
        or public.app_is_operations()
        or public.app_owns_client(p.client_id)
      )
  )
$$;

-- 2) Activar RLS en todas las tablas usadas por la app.
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

do $$
begin
  if to_regclass('public.itinerary_day_documents') is not null then
    execute 'alter table public.itinerary_day_documents enable row level security';
  end if;
  if to_regclass('public.itinerary_day_collaborators') is not null then
    execute 'alter table public.itinerary_day_collaborators enable row level security';
  end if;
  if to_regclass('public.tour_template_stops') is not null then
    execute 'alter table public.tour_template_stops enable row level security';
  end if;
  if to_regclass('public.hotels') is not null then
    execute 'alter table public.hotels enable row level security';
  end if;
  if to_regclass('public.proposal_versions') is not null then
    execute 'alter table public.proposal_versions enable row level security';
  end if;
  if to_regclass('public.payments') is not null then
    execute 'alter table public.payments enable row level security';
  end if;
end $$;

-- 3) Borrar políticas MVP anteriores en tablas public.
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'profiles','clients','tours','tour_clients','tour_collaborators',
        'itineraries','itinerary_days','itinerary_stops','client_itineraries',
        'documents','chat_rooms','chat_participants','chat_messages','notifications',
        'itinerary_day_documents','itinerary_day_collaborators',
        'tour_template_stops','hotels','proposal_versions','payments'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- 4) Políticas por tabla.

-- profiles
create policy "profiles_select_role_scope"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.app_is_admin()
  or status = 'active'
);

create policy "profiles_insert_admin"
on public.profiles for insert to authenticated
with check (public.app_is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles for update to authenticated
using (id = auth.uid() or public.app_is_admin())
with check (id = auth.uid() or public.app_is_admin());

create policy "profiles_delete_admin"
on public.profiles for delete to authenticated
using (public.app_is_admin());

-- clients / prospectos
create policy "clients_select_scope"
on public.clients for select to authenticated
using (public.app_can_access_client(id));

create policy "clients_insert_sales_admin"
on public.clients for insert to authenticated
with check (public.app_can_manage_commercial());

create policy "clients_update_owner_or_team"
on public.clients for update to authenticated
using (public.app_can_access_client(id))
with check (public.app_can_access_client(id));

create policy "clients_delete_admin_sales"
on public.clients for delete to authenticated
using (public.app_can_manage_commercial());

-- tours / catálogo
create policy "tours_select_authenticated_catalog"
on public.tours for select to authenticated
using (true);

create policy "tours_insert_team"
on public.tours for insert to authenticated
with check (public.app_can_manage_catalog());

create policy "tours_update_team"
on public.tours for update to authenticated
using (public.app_can_manage_catalog())
with check (public.app_can_manage_catalog());

create policy "tours_delete_team"
on public.tours for delete to authenticated
using (public.app_can_manage_catalog());

-- tour_clients
create policy "tour_clients_select_scope"
on public.tour_clients for select to authenticated
using (
  public.app_is_admin()
  or public.app_is_sales()
  or public.app_is_operations()
  or public.app_is_assigned_to_tour(tour_id)
  or public.app_owns_client(client_id)
);

create policy "tour_clients_insert_team"
on public.tour_clients for insert to authenticated
with check (public.app_can_manage_operations() or public.app_can_manage_commercial());

create policy "tour_clients_update_team"
on public.tour_clients for update to authenticated
using (public.app_can_manage_operations() or public.app_can_manage_commercial())
with check (public.app_can_manage_operations() or public.app_can_manage_commercial());

create policy "tour_clients_delete_team"
on public.tour_clients for delete to authenticated
using (public.app_can_manage_operations() or public.app_can_manage_commercial());

-- tour_collaborators
create policy "tour_collaborators_select_scope"
on public.tour_collaborators for select to authenticated
using (
  public.app_is_admin()
  or public.app_is_operations()
  or collaborator_id = auth.uid()
  or public.app_is_assigned_to_tour(tour_id)
);

create policy "tour_collaborators_insert_ops"
on public.tour_collaborators for insert to authenticated
with check (public.app_can_manage_operations());

create policy "tour_collaborators_update_ops"
on public.tour_collaborators for update to authenticated
using (public.app_can_manage_operations())
with check (public.app_can_manage_operations());

create policy "tour_collaborators_delete_ops"
on public.tour_collaborators for delete to authenticated
using (public.app_can_manage_operations());

-- itinerarios
create policy "itineraries_select_scope"
on public.itineraries for select to authenticated
using (public.app_can_access_itinerary(id));

create policy "itineraries_insert_commercial_ops"
on public.itineraries for insert to authenticated
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "itineraries_update_commercial_ops"
on public.itineraries for update to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations())
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "itineraries_delete_commercial_ops"
on public.itineraries for delete to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations());

-- itinerary_days
create policy "itinerary_days_select_scope"
on public.itinerary_days for select to authenticated
using (public.app_can_access_day(id));

create policy "itinerary_days_insert_team"
on public.itinerary_days for insert to authenticated
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "itinerary_days_update_team"
on public.itinerary_days for update to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations())
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "itinerary_days_delete_team"
on public.itinerary_days for delete to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations());

-- itinerary_stops
create policy "itinerary_stops_select_scope"
on public.itinerary_stops for select to authenticated
using (public.app_can_access_day(day_id));

create policy "itinerary_stops_insert_team"
on public.itinerary_stops for insert to authenticated
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "itinerary_stops_update_team"
on public.itinerary_stops for update to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations())
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "itinerary_stops_delete_team"
on public.itinerary_stops for delete to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations());

-- client_itineraries / propuestas
create policy "client_itineraries_select_scope"
on public.client_itineraries for select to authenticated
using (
  public.app_can_access_client(client_id)
  or public.app_can_access_itinerary(itinerary_id)
);

create policy "client_itineraries_insert_commercial_ops"
on public.client_itineraries for insert to authenticated
with check (public.app_can_manage_commercial() or public.app_can_manage_operations());

create policy "client_itineraries_update_client_or_team"
on public.client_itineraries for update to authenticated
using (
  public.app_can_manage_commercial()
  or public.app_can_manage_operations()
  or public.app_owns_client(client_id)
)
with check (
  public.app_can_manage_commercial()
  or public.app_can_manage_operations()
  or public.app_owns_client(client_id)
);

create policy "client_itineraries_delete_commercial_ops"
on public.client_itineraries for delete to authenticated
using (public.app_can_manage_commercial() or public.app_can_manage_operations());

-- documents generales
create policy "documents_select_scope"
on public.documents for select to authenticated
using (public.app_can_access_document(id));

create policy "documents_insert_ops"
on public.documents for insert to authenticated
with check (
  public.app_can_manage_operations()
  or public.app_can_manage_commercial()
  or uploaded_by = auth.uid()
);

create policy "documents_update_ops"
on public.documents for update to authenticated
using (public.app_can_manage_operations() or uploaded_by = auth.uid())
with check (public.app_can_manage_operations() or uploaded_by = auth.uid());

create policy "documents_delete_ops"
on public.documents for delete to authenticated
using (public.app_can_manage_operations() or uploaded_by = auth.uid());

-- chat_rooms
create policy "chat_rooms_select_participant"
on public.chat_rooms for select to authenticated
using (public.app_is_chat_participant(id));

create policy "chat_rooms_insert_direct_or_admin"
on public.chat_rooms for insert to authenticated
with check (
  public.app_is_admin()
  or direct_user_a = auth.uid()
  or direct_user_b = auth.uid()
  or tour_id is not null
);

create policy "chat_rooms_update_participant"
on public.chat_rooms for update to authenticated
using (public.app_is_chat_participant(id))
with check (public.app_is_chat_participant(id));

create policy "chat_rooms_delete_admin"
on public.chat_rooms for delete to authenticated
using (public.app_is_admin());

-- chat_participants
create policy "chat_participants_select_room"
on public.chat_participants for select to authenticated
using (user_id = auth.uid() or public.app_is_chat_participant(chat_room_id));

create policy "chat_participants_insert_room_member"
on public.chat_participants for insert to authenticated
with check (
  public.app_is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.chat_rooms cr
    where cr.id = chat_room_id
      and (cr.direct_user_a = auth.uid() or cr.direct_user_b = auth.uid())
  )
);

create policy "chat_participants_update_self_or_admin"
on public.chat_participants for update to authenticated
using (user_id = auth.uid() or public.app_is_admin())
with check (user_id = auth.uid() or public.app_is_admin());

create policy "chat_participants_delete_self_or_admin"
on public.chat_participants for delete to authenticated
using (user_id = auth.uid() or public.app_is_admin());

-- chat_messages
create policy "chat_messages_select_participant"
on public.chat_messages for select to authenticated
using (public.app_is_chat_participant(chat_room_id));

create policy "chat_messages_insert_participant"
on public.chat_messages for insert to authenticated
with check (
  public.app_is_chat_participant(chat_room_id)
  and (sender_id = auth.uid() or sender_id is null)
);

create policy "chat_messages_update_participant"
on public.chat_messages for update to authenticated
using (public.app_is_chat_participant(chat_room_id))
with check (public.app_is_chat_participant(chat_room_id));

create policy "chat_messages_delete_sender_or_admin"
on public.chat_messages for delete to authenticated
using (sender_id = auth.uid() or public.app_is_admin());

-- notifications
create policy "notifications_select_owner"
on public.notifications for select to authenticated
using (user_id = auth.uid() or public.app_is_admin());

create policy "notifications_insert_admin"
on public.notifications for insert to authenticated
with check (public.app_is_admin());

create policy "notifications_update_owner"
on public.notifications for update to authenticated
using (user_id = auth.uid() or public.app_is_admin())
with check (user_id = auth.uid() or public.app_is_admin());

create policy "notifications_delete_owner"
on public.notifications for delete to authenticated
using (user_id = auth.uid() or public.app_is_admin());

-- 5) Tablas creadas en migraciones posteriores.
do $$
begin
  if to_regclass('public.tour_template_stops') is not null then
    execute 'create policy "tour_template_stops_select_catalog" on public.tour_template_stops for select to authenticated using (true)';
    execute 'create policy "tour_template_stops_insert_team" on public.tour_template_stops for insert to authenticated with check (public.app_can_manage_catalog())';
    execute 'create policy "tour_template_stops_update_team" on public.tour_template_stops for update to authenticated using (public.app_can_manage_catalog()) with check (public.app_can_manage_catalog())';
    execute 'create policy "tour_template_stops_delete_team" on public.tour_template_stops for delete to authenticated using (public.app_can_manage_catalog())';
  end if;

  if to_regclass('public.hotels') is not null then
    execute 'create policy "hotels_select_authenticated" on public.hotels for select to authenticated using (true)';
    execute 'create policy "hotels_insert_team" on public.hotels for insert to authenticated with check (public.app_can_manage_operations() or public.app_can_manage_commercial())';
    execute 'create policy "hotels_update_team" on public.hotels for update to authenticated using (public.app_can_manage_operations() or public.app_can_manage_commercial()) with check (public.app_can_manage_operations() or public.app_can_manage_commercial())';
    execute 'create policy "hotels_delete_team" on public.hotels for delete to authenticated using (public.app_can_manage_operations() or public.app_can_manage_commercial())';
  end if;

  if to_regclass('public.itinerary_day_documents') is not null then
    execute 'create policy "itinerary_day_documents_select_scope" on public.itinerary_day_documents for select to authenticated using (public.app_can_access_day(day_id))';
    execute 'create policy "itinerary_day_documents_insert_scope" on public.itinerary_day_documents for insert to authenticated with check (public.app_can_manage_operations() or public.app_can_manage_commercial() or public.app_can_access_day(day_id))';
    execute 'create policy "itinerary_day_documents_update_scope" on public.itinerary_day_documents for update to authenticated using (public.app_can_manage_operations() or uploaded_by = auth.uid()) with check (public.app_can_manage_operations() or uploaded_by = auth.uid())';
    execute 'create policy "itinerary_day_documents_delete_scope" on public.itinerary_day_documents for delete to authenticated using (public.app_can_manage_operations() or uploaded_by = auth.uid())';
  end if;

  if to_regclass('public.itinerary_day_collaborators') is not null then
    execute 'create policy "itinerary_day_collaborators_select_scope" on public.itinerary_day_collaborators for select to authenticated using (public.app_can_access_day(day_id) or collaborator_id = auth.uid())';
    execute 'create policy "itinerary_day_collaborators_insert_ops" on public.itinerary_day_collaborators for insert to authenticated with check (public.app_can_manage_operations() or public.app_can_manage_commercial())';
    execute 'create policy "itinerary_day_collaborators_update_ops" on public.itinerary_day_collaborators for update to authenticated using (public.app_can_manage_operations() or public.app_can_manage_commercial()) with check (public.app_can_manage_operations() or public.app_can_manage_commercial())';
    execute 'create policy "itinerary_day_collaborators_delete_ops" on public.itinerary_day_collaborators for delete to authenticated using (public.app_can_manage_operations() or public.app_can_manage_commercial())';
  end if;

  if to_regclass('public.proposal_versions') is not null then
    execute 'create policy "proposal_versions_select_scope" on public.proposal_versions for select to authenticated using (public.app_can_access_client(client_id) or (itinerary_id is not null and public.app_can_access_itinerary(itinerary_id)))';
    execute 'create policy "proposal_versions_insert_team" on public.proposal_versions for insert to authenticated with check (public.app_can_manage_commercial() or public.app_can_manage_operations())';
    execute 'create policy "proposal_versions_update_team" on public.proposal_versions for update to authenticated using (public.app_can_manage_commercial() or public.app_can_manage_operations()) with check (public.app_can_manage_commercial() or public.app_can_manage_operations())';
    execute 'create policy "proposal_versions_delete_team" on public.proposal_versions for delete to authenticated using (public.app_can_manage_commercial() or public.app_can_manage_operations())';
  end if;

  if to_regclass('public.payments') is not null then
    execute 'create policy "payments_select_scope" on public.payments for select to authenticated using (public.app_can_access_payment(id))';
    execute 'create policy "payments_insert_team" on public.payments for insert to authenticated with check (public.app_can_manage_commercial() or public.app_can_manage_operations())';
    execute 'create policy "payments_update_team" on public.payments for update to authenticated using (public.app_can_manage_commercial() or public.app_can_manage_operations()) with check (public.app_can_manage_commercial() or public.app_can_manage_operations())';
    execute 'create policy "payments_delete_admin" on public.payments for delete to authenticated using (public.app_is_admin())';
  end if;
end $$;

-- 6) Storage: endurecer buckets usados por la app.
-- Nota: estos policies solo afectan a storage.objects, no a tus tablas.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'authenticated_read_itinerary_day_documents_bucket',
        'authenticated_upload_itinerary_day_documents_bucket',
        'authenticated_update_itinerary_day_documents_bucket',
        'authenticated_delete_itinerary_day_documents_bucket',
        'Authenticated users can upload tour images',
        'Authenticated users can update tour images',
        'Authenticated users can delete tour images',
        'team_upload_tour_images',
        'team_update_tour_images',
        'team_delete_tour_images',
        'team_upload_itinerary_day_documents',
        'team_update_itinerary_day_documents',
        'team_delete_itinerary_day_documents'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "team_upload_tour_images"
on storage.objects for insert to authenticated
with check (bucket_id = 'tour-images' and public.app_can_manage_catalog());

create policy "team_update_tour_images"
on storage.objects for update to authenticated
using (bucket_id = 'tour-images' and public.app_can_manage_catalog())
with check (bucket_id = 'tour-images' and public.app_can_manage_catalog());

create policy "team_delete_tour_images"
on storage.objects for delete to authenticated
using (bucket_id = 'tour-images' and public.app_can_manage_catalog());

create policy "team_upload_itinerary_day_documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'itinerary-day-documents' and (public.app_can_manage_operations() or public.app_can_manage_commercial() or public.app_is_team()));

create policy "team_update_itinerary_day_documents"
on storage.objects for update to authenticated
using (bucket_id = 'itinerary-day-documents' and (public.app_can_manage_operations() or public.app_can_manage_commercial() or public.app_is_team()))
with check (bucket_id = 'itinerary-day-documents' and (public.app_can_manage_operations() or public.app_can_manage_commercial() or public.app_is_team()));

create policy "team_delete_itinerary_day_documents"
on storage.objects for delete to authenticated
using (bucket_id = 'itinerary-day-documents' and (public.app_can_manage_operations() or public.app_can_manage_commercial()));

-- 7) Índices útiles para que las políticas no se pongan lentas.
create index if not exists idx_profiles_role_position on public.profiles(role, position);
create index if not exists idx_clients_profile_id on public.clients(profile_id);
create index if not exists idx_tours_tour_leader_id on public.tours(tour_leader_id);
create index if not exists idx_tour_clients_client_id on public.tour_clients(client_id);
create index if not exists idx_tour_clients_tour_id on public.tour_clients(tour_id);
create index if not exists idx_tour_collaborators_collaborator_id on public.tour_collaborators(collaborator_id);
create index if not exists idx_itineraries_tour_id on public.itineraries(tour_id);
create index if not exists idx_itinerary_days_itinerary_id on public.itinerary_days(itinerary_id);
create index if not exists idx_itinerary_stops_day_id on public.itinerary_stops(day_id);
create index if not exists idx_client_itineraries_client_id on public.client_itineraries(client_id);
create index if not exists idx_client_itineraries_itinerary_id on public.client_itineraries(itinerary_id);
create index if not exists idx_chat_participants_room_user on public.chat_participants(chat_room_id, user_id);
create index if not exists idx_chat_rooms_direct_users on public.chat_rooms(direct_user_a, direct_user_b);
