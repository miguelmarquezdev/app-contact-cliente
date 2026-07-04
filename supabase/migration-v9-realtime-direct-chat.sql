-- v9: Chat directo en tiempo real entre usuarios.
-- Ejecutar en Supabase SQL Editor antes de probar el nuevo chat.

-- Agrega el tipo direct al enum existente.
alter type public.chat_room_type add value if not exists 'direct';

-- Permite salas independientes, sin tour obligatorio, para chats directos.
alter table public.chat_rooms
  add column if not exists title text,
  add column if not exists direct_user_a uuid references public.profiles(id) on delete cascade,
  add column if not exists direct_user_b uuid references public.profiles(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

-- Evita duplicar una sala para los mismos dos usuarios.
create unique index if not exists chat_rooms_direct_pair_unique
on public.chat_rooms (direct_user_a, direct_user_b)
where direct_user_a is not null and direct_user_b is not null;

-- Realtime para que los mensajes entren sin refrescar la página.
alter table public.chat_messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Políticas MVP abiertas para usuarios autenticados, por si tu proyecto no las tiene creadas.
drop policy if exists "authenticated_select_chat_rooms" on public.chat_rooms;
drop policy if exists "authenticated_insert_chat_rooms" on public.chat_rooms;
drop policy if exists "authenticated_update_chat_rooms" on public.chat_rooms;
drop policy if exists "authenticated_delete_chat_rooms" on public.chat_rooms;
create policy "authenticated_select_chat_rooms" on public.chat_rooms for select to authenticated using (true);
create policy "authenticated_insert_chat_rooms" on public.chat_rooms for insert to authenticated with check (true);
create policy "authenticated_update_chat_rooms" on public.chat_rooms for update to authenticated using (true) with check (true);
create policy "authenticated_delete_chat_rooms" on public.chat_rooms for delete to authenticated using (true);

drop policy if exists "authenticated_select_chat_participants" on public.chat_participants;
drop policy if exists "authenticated_insert_chat_participants" on public.chat_participants;
drop policy if exists "authenticated_update_chat_participants" on public.chat_participants;
drop policy if exists "authenticated_delete_chat_participants" on public.chat_participants;
create policy "authenticated_select_chat_participants" on public.chat_participants for select to authenticated using (true);
create policy "authenticated_insert_chat_participants" on public.chat_participants for insert to authenticated with check (true);
create policy "authenticated_update_chat_participants" on public.chat_participants for update to authenticated using (true) with check (true);
create policy "authenticated_delete_chat_participants" on public.chat_participants for delete to authenticated using (true);

drop policy if exists "authenticated_select_chat_messages" on public.chat_messages;
drop policy if exists "authenticated_insert_chat_messages" on public.chat_messages;
drop policy if exists "authenticated_update_chat_messages" on public.chat_messages;
drop policy if exists "authenticated_delete_chat_messages" on public.chat_messages;
create policy "authenticated_select_chat_messages" on public.chat_messages for select to authenticated using (true);
create policy "authenticated_insert_chat_messages" on public.chat_messages for insert to authenticated with check (true);
create policy "authenticated_update_chat_messages" on public.chat_messages for update to authenticated using (true) with check (true);
create policy "authenticated_delete_chat_messages" on public.chat_messages for delete to authenticated using (true);
